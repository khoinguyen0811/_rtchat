import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import { uploadToCloudinary } from "../libs/uploadHelper.js";
import Friend from "../models/Friend.js";
import { getIO } from "../libs/socket.js";

export const createConversation = async (req, res) => {
	try {
		const { recipientId } = req.body;
		const senderId = req.user._id;

		if (!recipientId) {
			return res.status(400).json({ message: "Recipient ID is required" });
		}

		// Check if exists
		let conversation = await Conversation.findOne({
			type: "direct",
			$and: [
				{ "participants.userId": senderId },
				{ "participants.userId": recipientId }
			]
		}).populate("participants.userId", "username displayName avatarUrl")
			.populate("lastMessage.senderId", "username displayName");

		if (conversation) {
			return res.status(200).json(conversation);
		}

		// Check friendship status
		const isFriend = await Friend.findOne({
			$or: [
				{ userA: senderId, userB: recipientId },
				{ userA: recipientId, userB: senderId },
			]
		});

		const isPending = !isFriend;
		const pendingReceiver = isPending ? recipientId : null;

		conversation = await Conversation.create({
			type: "direct",
			participants: [
				{ userId: senderId },
				{ userId: recipientId }
			],
			isPending,
			pendingReceiver,
			unReadCount: {}
		});

		// Populate for consistency with getConversations
		conversation = await conversation.populate("participants.userId", "username displayName avatarUrl");
		// lastMessage is undefined initially

		res.status(201).json(conversation);
	} catch (error) {
		console.error("Error inside createConversation:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const revokeMessage = async (req, res) => {
	try {
		const { messageId } = req.params;
		const userId = req.user._id;

		const message = await Message.findById(messageId);
		if (!message) {
			return res.status(404).json({ message: "Message not found" });
		}

		// Only sender can revoke
		if (message.senderId.toString() !== userId.toString()) {
			return res.status(403).json({ message: "Unauthorized to revoke this message" });
		}

		// Check if time limit exceeded? (Optional, e.g. 15 mins). Skipping for now as not requested.

		message.isRevoked = true;
		message.content = "Message revoked"; // Or clear it: ""
		message.imgUrl = null; // Remove image if any
		message.reactions = []; // Optionally remove reactions
		await message.save();

		// More efficient update
		await Conversation.updateOne(
			{ _id: message.conversationId, "lastMessage._id": message._id },
			{
				$set: {
					"lastMessage.content": "Message revoked"
				}
			}
		);

		res.status(200).json(message);
	} catch (error) {
		console.error("Error in revokeMessage:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const reactToMessage = async (req, res) => {
	try {
		const { messageId } = req.params;
		const { reactionType } = req.body;
		const userId = req.user._id;

		const validReactions = ["like", "love", "haha", "wow", "sad", "angry"];

		const message = await Message.findById(messageId);
		if (!message) {
			return res.status(404).json({ message: "Message not found" });
		}

		// Check if user is participant in conversation (security check)
		// Optimal: aggregate or find conversation of message and check participant
		const conversation = await Conversation.findOne({
			_id: message.conversationId,
			"participants.userId": userId
		});

		if (!conversation) {
			return res.status(403).json({ message: "Unauthorized" });
		}

		const existingReactionIndex = message.reactions.findIndex(
			(r) => r.userId.toString() === userId.toString()
		);

		if (!reactionType) {
			// If no type provided, remove reaction if exists
			if (existingReactionIndex !== -1) {
				message.reactions.splice(existingReactionIndex, 1);
			}
		} else {
			if (!validReactions.includes(reactionType)) {
				return res.status(400).json({ message: "Invalid reaction type" });
			}

			if (existingReactionIndex !== -1) {
				if (message.reactions[existingReactionIndex].type === reactionType) {
					// Toggle off if same type
					message.reactions.splice(existingReactionIndex, 1);
				} else {
					message.reactions[existingReactionIndex].type = reactionType;
				}
			} else {
				// Add new reaction
				message.reactions.push({ userId, type: reactionType });
			}
		}

		await message.save();

		res.status(200).json(message);

	} catch (error) {
		console.error("Error in reactToMessage:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const sendMessage = async (req, res) => {
	try {
		const { recipientId, content, conversationId, fileType } = req.body;
		const senderId = req.user._id;
		const file = req.file;

		let conversation;

		if (conversationId) {
			conversation = await Conversation.findOne({
				_id: conversationId,
				"participants.userId": senderId
			});
			if (!conversation) {
				return res.status(404).json({ message: "Conversation not found or you are not a participant" });
			}

			// If conversation is pending and sender is the pendingReceiver, accept it
			if (conversation.isPending && conversation.pendingReceiver && conversation.pendingReceiver.toString() === senderId.toString()) {
				conversation.isPending = false;
				conversation.pendingReceiver = null;
				await conversation.save();
			}

		} else if (recipientId) {
			// Check if direct conversation exists
			conversation = await Conversation.findOne({
				type: "direct",
				$and: [
					{ "participants.userId": senderId },
					{ "participants.userId": recipientId }
				]
			});

			// If not, create new
			if (!conversation) {
				// Check friendship status
				const isFriend = await Friend.findOne({
					$or: [
						{ userA: senderId, userB: recipientId },
						{ userA: recipientId, userB: senderId },
					]
				});

				const isPending = !isFriend;
				const pendingReceiver = isPending ? recipientId : null;

				conversation = await Conversation.create({
					type: "direct",
					participants: [
						{ userId: senderId },
						{ userId: recipientId }
					],
					isPending,
					pendingReceiver
				});
			} else {
				// If conversation exists but was pending (e.g. they unfriended or previous state), 
				// and sender is the one who needs to accept, accept it.
				// Or if I am sending again, it remains pending for them if I am not the receiver.
				if (conversation.isPending && conversation.pendingReceiver && conversation.pendingReceiver.toString() === senderId.toString()) {
					conversation.isPending = false;
					conversation.pendingReceiver = null;
					await conversation.save();
				}
			}
		} else {
			return res.status(400).json({ message: "Provide recipientId or conversationId" });
		}

		let fileUrl = null;
		let uploadedFileType = fileType || "image";

		if (file) {
			// Upload to Cloudinary
			// Dynamic import to avoid circular dependency issues if any, or just import at top?
			// Let's import at top.
			const result = await uploadToCloudinary(file.buffer);
			fileUrl = result.secure_url;
			// refine fileType based on cloudinary result if needed, or trust client/default
			if (result.resource_type === 'video') {
				uploadedFileType = 'video';
			} else if (result.resource_type === 'image') {
				// Could be gif
				if (result.format === 'gif') uploadedFileType = 'gif';
			}
		}

		// Create Message
		// Create Message
		let newMessage = await Message.create({
			conversationId: conversation._id,
			senderId,
			content,
			fileUrl,
			fileType: fileUrl ? uploadedFileType : undefined,
			imgUrl: (fileUrl && uploadedFileType === 'image') ? fileUrl : null // Backward compatibility
		});

		// Update Conversation
		conversation.lastMessage = {
			_id: newMessage._id,
			content: content || (fileUrl ? `Sent a ${uploadedFileType}` : "Message"),
			senderId: senderId,
			createdAt: newMessage.createdAt
		};
		conversation.lastMessageAt = newMessage.createdAt;

		// Increment unread count for others
		conversation.participants.forEach(p => {
			if (p.userId.toString() !== senderId.toString()) {
				const currentCount = conversation.unReadCount.get(p.userId.toString()) || 0;
				conversation.unReadCount.set(p.userId.toString(), currentCount + 1);
			}
		});

		await conversation.save();

		// Populate sender info for frontend rendering
		newMessage = await newMessage.populate("senderId", "username displayName avatarUrl");

		// Socket.io: Emit to all connected clients
		try {
			const io = getIO();
			io.emit("newMessage", newMessage);
		} catch (socketError) {
			console.error("Socket emit failed:", socketError);
		}

		res.status(201).json(newMessage);

	} catch (error) {
		console.error("Error in sendMessage:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const getMessages = async (req, res) => {
	try {
		const { conversationId } = req.params;
		const userId = req.user._id;

		// Check access
		const conversation = await Conversation.findOne({
			_id: conversationId,
			"participants.userId": userId
		});

		if (!conversation) {
			return res.status(403).json({ message: "Access denied" });
		}

		const messages = await Message.find({ conversationId })
			.sort({ createdAt: 1 })
			.populate("senderId", "username displayName avatarUrl");

		// Reset unread count for current user
		if (conversation.unReadCount.get(userId.toString()) > 0) {
			conversation.unReadCount.set(userId.toString(), 0);
			await conversation.save();
		}

		res.status(200).json(messages);
	} catch (error) {
		console.error("Error in getMessages:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const getConversations = async (req, res) => {
	try {
		const userId = req.user._id;
		const { type } = req.query; // 'pending' or 'main' (default)

		let query = {
			"participants.userId": userId
		};

		if (type === 'pending') {
			query.isPending = true;
			query.pendingReceiver = userId;
		} else {
			// Main inbox: Not pending OR pending for someone else (meaning I sent it)
			query.$or = [
				{ isPending: false },
				{ isPending: { $ne: true } }, // safe check for missing field
				{ pendingReceiver: { $ne: userId } }
			];
		}

		const conversations = await Conversation.find(query)
			.sort({ lastMessageAt: -1 })
			.populate("participants.userId", "username displayName avatarUrl")
			.populate("lastMessage.senderId", "username displayName");

		res.status(200).json(conversations);
	} catch (error) {
		console.error("Error in getConversations:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const deleteMessage = async (req, res) => {
	try {
		const { messageId } = req.params;
		const userId = req.user._id;

		const message = await Message.findById(messageId);
		if (!message) {
			return res.status(404).json({ message: "Message not found" });
		}

		if (message.senderId.toString() !== userId.toString()) {
			return res.status(403).json({ message: "Unauthorized" });
		}

		await Message.findByIdAndDelete(messageId);

		// Emit socket event to notify clients
		try {
			const io = getIO();
			io.emit("messageDeleted", {
				messageId,
				conversationId: message.conversationId,
			});
		} catch (socketError) {
			console.error("Socket emit failed:", socketError);
		}

		res.status(200).json({ message: "Message deleted successfully" });
	} catch (error) {
		console.error("Error in deleteMessage:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};
