import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import Friend from "../models/Friend.js";
import Conversation from "../models/Conversation.js";
import { createNotification } from "./notificationController.js";

export const sendFriendRequest = async (req, res) => {
	try {
		const { to } = req.body;
		const from = req.user._id;

		if (to === from.toString()) {
			return res.status(400).json({ message: "Cannot send request to yourself" });
		}

		const recipient = await User.findById(to);
		if (!recipient) {
			return res.status(404).json({ message: "User not found" });
		}

		// Check if already friends
		const isFriend = await Friend.findOne({
			$or: [
				{ userA: from, userB: to },
				{ userA: to, userB: from },
			]
		});

		if (isFriend) {
			return res.status(400).json({ message: "Already friends" });
		}

		// Check if request already exists
		const existingRequest = await FriendRequest.findOne({ from, to });
		if (existingRequest) {
			return res.status(400).json({ message: "Request already sent" });
		}

		// Check if they already sent you a request
		const reverseRequest = await FriendRequest.findOne({ from: to, to: from });
		if (reverseRequest) {
			return res.status(400).json({ message: "User has already sent you a request" });
		}

		const newFriendRequest = await FriendRequest.create({ from, to });

		// Create Notification
		await createNotification({
			recipient: to,
			sender: from,
			type: "friend_request",
			content: "sent you a friend request",
			relatedId: newFriendRequest._id,
			relatedModel: "FriendRequest"
		});

		res.status(201).json({ message: "Friend request sent successfully", friendRequest: newFriendRequest });
	} catch (error) {
		console.error("Error in sendFriendRequest:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const getFriendRequests = async (req, res) => {
	try {
		const userId = req.user._id;

		const requests = await FriendRequest.find({ to: userId })
			.populate("from", "username displayName avatarUrl");

		res.status(200).json(requests);
	} catch (error) {
		console.error("Error in getFriendRequests:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const getSentRequests = async (req, res) => {
	try {
		const userId = req.user._id;

		const requests = await FriendRequest.find({ from: userId })
			.populate("to", "username displayName avatarUrl");

		res.status(200).json(requests);
	} catch (error) {
		console.error("Error in getSentRequests:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const acceptFriendRequest = async (req, res) => {
	try {
		const { requestId } = req.params;
		const userId = req.user._id;

		const request = await FriendRequest.findById(requestId);
		if (!request) {
			return res.status(404).json({ message: "Request not found" });
		}

		if (request.to.toString() !== userId.toString()) {
			return res.status(403).json({ message: "Unauthorized" });
		}

		// Check if already friends to prevent duplicate key error
		const existingFriendship = await Friend.findOne({
			$or: [
				{ userA: request.from, userB: request.to },
				{ userA: request.to, userB: request.from },
			]
		});

		let newFriendship;
		if (existingFriendship) {
			console.log("Friendship already exists, skipping creation.");
			newFriendship = existingFriendship;
		} else {
			console.log("Creating friend relationship...");
			newFriendship = await Friend.create({
				userA: request.from,
				userB: request.to,
			});
			console.log("Friend relationship created:", newFriendship._id);
		}

		// Delete request
		console.log("Deleting friend request...");
		await request.deleteOne();
		console.log("Friend request deleted");

		// Activate any pending conversations
		console.log("Checking for pending conversations...");
		const conversation = await Conversation.findOne({
			type: "direct",
			$and: [
				{ "participants.userId": request.from },
				{ "participants.userId": request.to }
			]
		});

		if (conversation && conversation.isPending) {
			console.log("Activating pending conversation...");
			conversation.isPending = false;
			conversation.pendingReceiver = null;
			await conversation.save();
		}

		// Create Notification for the sender of the request
		console.log("Creating notification...");
		await createNotification({
			recipient: request.from,
			sender: userId, // The one who accepted
			type: "friend_accept",
			content: "accepted your friend request",
			relatedId: newFriendship._id,
			relatedModel: "Friend"
		});
		console.log("Notification created");

		res.status(200).json({ message: "Friend request accepted", friend: newFriendship });
	} catch (error) {
		console.error("Error in acceptFriendRequest:", error);
		// Print full stack trace if possible
		if (error.stack) console.error(error.stack);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const rejectFriendRequest = async (req, res) => {
	try {
		const { requestId } = req.params;
		const userId = req.user._id;

		const request = await FriendRequest.findById(requestId);
		if (!request) {
			return res.status(404).json({ message: "Request not found" });
		}

		if (request.to.toString() !== userId.toString()) {
			return res.status(403).json({ message: "Unauthorized" });
		}

		await FriendRequest.findByIdAndDelete(requestId);

		res.status(200).json({ message: "Friend request rejected" });
	} catch (error) {
		console.error("Error in rejectFriendRequest:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const getFriends = async (req, res) => {
	try {
		const userId = req.user._id;

		const friendships = await Friend.find({
			$or: [{ userA: userId }, { userB: userId }]
		}).populate("userA", "username displayName avatarUrl")
			.populate("userB", "username displayName avatarUrl");

		const friends = friendships.map(f => {
			if (f.userA._id.toString() === userId.toString()) return f.userB;
			return f.userA;
		});

		res.status(200).json(friends);
	} catch (error) {
		console.error("Error in getFriends:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const unfriend = async (req, res) => {
	try {
		const { friendId } = req.params;
		const userId = req.user._id;

		await Friend.findOneAndDelete({
			$or: [
				{ userA: userId, userB: friendId },
				{ userA: friendId, userB: userId }
			]
		});

		res.status(200).json({ message: "Unfriended successfully" });
	} catch (error) {
		console.error("Error in unfriend:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};
