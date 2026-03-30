import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

// Get Dashboard Stats
export const getStats = async (req, res) => {
	try {
		const userCount = await User.countDocuments();
		const groupCount = await Conversation.countDocuments({ type: "group" });
		const messageCount = await Message.countDocuments();

		res.status(200).json({
			users: userCount,
			groups: groupCount,
			messages: messageCount
		});
	} catch (error) {
		console.error("Error in getStats:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// --- USER MANAGEMENT ---

export const getAllUsers = async (req, res) => {
	try {
		const users = await User.find({}, "-hashedPassword").sort({ createdAt: -1 });
		res.status(200).json(users);
	} catch (error) {
		console.error("Error in getAllUsers:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const banUser = async (req, res) => {
	try {
		const { userId } = req.params;
		const user = await User.findById(userId);

		if (!user) return res.status(404).json({ message: "User not found" });
		if (user.role === 'admin') return res.status(403).json({ message: "Cannot ban an admin" });

		user.isBanned = !user.isBanned;
		await user.save();

		res.status(200).json({ message: `User ${user.isBanned ? "banned" : "unbanned"} successfully`, user });
	} catch (error) {
		console.error("Error in banUser:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const updateUserRole = async (req, res) => {
	try {
		const { userId } = req.params;
		const { role } = req.body;

		if (!['user', 'admin'].includes(role)) {
			return res.status(400).json({ message: "Invalid role. Must be 'user' or 'admin'" });
		}

		const user = await User.findById(userId);

		if (!user) return res.status(404).json({ message: "User not found" });

		// Optional: Prevent changing own role to avoid locking oneself out if that's a concern, 
		// but sometimes admins need to demote themselves. 
		// For now, we'll allow it but maybe warn in frontend.

		user.role = role;
		await user.save();

		res.status(200).json({ message: `User role updated to ${role} successfully`, user });
	} catch (error) {
		console.error("Error in updateUserRole:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const deleteUser = async (req, res) => {
	try {
		const { userId } = req.params;
		const user = await User.findById(userId);

		if (!user) return res.status(404).json({ message: "User not found" });
		if (user.role === 'admin') return res.status(403).json({ message: "Cannot delete an admin" });

		await User.findByIdAndDelete(userId);
		// Optional: Cascade delete messages, etc.

		res.status(200).json({ message: "User deleted successfully" });
	} catch (error) {
		console.error("Error in deleteUser:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// --- GROUP MANAGEMENT ---

export const getAllGroups = async (req, res) => {
	try {
		const groups = await Conversation.find({ type: "group" })
			.populate("group.createdBy", "username displayName")
			.sort({ createdAt: -1 });
		res.status(200).json(groups);
	} catch (error) {
		console.error("Error in getAllGroups:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const deleteGroup = async (req, res) => {
	try {
		const { groupId } = req.params;
		await Conversation.findByIdAndDelete(groupId);
		await Message.deleteMany({ conversationId: groupId }); // Clean up messages
		res.status(200).json({ message: "Group deleted successfully" });
	} catch (error) {
		console.error("Error in deleteGroup:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const removeGroupMember = async (req, res) => {
	try {
		const { groupId, userId } = req.params;
		const conversation = await Conversation.findById(groupId);

		if (!conversation || conversation.type !== 'group') {
			return res.status(404).json({ message: "Group not found" });
		}

		// Remove user from participants
		conversation.participants = conversation.participants.filter(p => p.userId.toString() !== userId);
		await conversation.save();

		res.status(200).json({ message: "Member removed successfully" });

	} catch (error) {
		console.error("Error in removeGroupMember:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};


// --- MESSAGE MANAGEMENT ---

export const getAllMessages = async (req, res) => {
	try {
		// Limit to last 100 for performance, or implement pagination
		const messages = await Message.find()
			.populate("senderId", "username displayName")
			.populate("conversationId", "type group") // To see which group it belongs to
			.sort({ createdAt: -1 })
			.limit(100);

		res.status(200).json(messages);
	} catch (error) {
		console.error("Error in getAllMessages:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const deleteMessage = async (req, res) => {
	try {
		const { messageId } = req.params;
		await Message.findByIdAndDelete(messageId);
		res.status(200).json({ message: "Message deleted successfully" });
	} catch (error) {
		console.error("Error in deleteMessage:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};
