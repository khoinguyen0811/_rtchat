import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import { createNotification } from "./notificationController.js";

// Create Group
export const createGroup = async (req, res) => {
	try {
		const { name, participants } = req.body;
		const creatorId = req.user._id;

		if (!name || !participants || !Array.isArray(participants) || participants.length === 0) {
			return res.status(400).json({ message: "Group name and participants are required" });
		}

		// Add creator to participants if not present
		const participantIds = new Set(participants);
		participantIds.add(creatorId.toString());

		const participantsArray = Array.from(participantIds).map(userId => ({ userId }));

		const newGroup = await Conversation.create({
			type: "group",
			participants: participantsArray,
			group: [{
				name,
				createdBy: creatorId
			}],
			lastMessageAt: new Date() // Initialize for sorting
		});

		// Populate for response
		const populatedGroup = await Conversation.findById(newGroup._id)
			.populate("participants.userId", "username displayName avatarUrl")
			.populate("group.createdBy", "username displayName");

		res.status(201).json(populatedGroup);
	} catch (error) {
		console.error("Error in createGroup:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Add Members
export const addMembers = async (req, res) => {
	try {
		const { groupId } = req.params;
		const { userIds } = req.body;
		const requesterId = req.user._id;

		if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
			return res.status(400).json({ message: "User IDs are required" });
		}

		const conversation = await Conversation.findById(groupId);

		if (!conversation) {
			return res.status(404).json({ message: "Group not found" });
		}

		if (conversation.type !== "group") {
			return res.status(400).json({ message: "Not a group chat" });
		}

		// Check permission: Only creator can add members
		const groupInfo = conversation.group[0];
		if (groupInfo.createdBy.toString() !== requesterId.toString()) {
			return res.status(403).json({ message: "Only group creator can add members" });
		}

		// Filter out existing members
		const currentMemberIds = new Set(conversation.participants.map(p => p.userId.toString()));
		const newMembers = userIds.filter(id => !currentMemberIds.has(id.toString()));

		if (newMembers.length === 0) {
			return res.status(200).json(conversation); // Nothing to add
		}

		// Add new members
		const newParticipants = newMembers.map(userId => ({ userId, joinedAt: new Date() }));
		conversation.participants.push(...newParticipants);

		await conversation.save();

		const updatedConversation = await Conversation.findById(groupId)
			.populate("participants.userId", "username displayName avatarUrl")
			.populate("group.createdBy", "username displayName");

		res.status(200).json(updatedConversation);
	} catch (error) {
		console.error("Error in addMembers:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};
// Get User's Groups
export const getGroups = async (req, res) => {
	try {
		const userId = req.user._id;

		const groups = await Conversation.find({
			type: "group",
			"participants.userId": userId
		})
			.populate("participants.userId", "username displayName avatarUrl")
			.populate("group.createdBy", "username displayName")
			.sort({ lastMessageAt: -1 });

		res.status(200).json(groups);
	} catch (error) {
		console.error("Error in getGroups:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};
// Search Groups (Global)
export const searchGroups = async (req, res) => {
	try {
		const { query } = req.query;
		const userId = req.user._id;

		if (!query) return res.json([]);

		// Find groups where name matches query AND user is NOT a participant
		const groups = await Conversation.find({
			type: "group",
			"group.name": { $regex: query, $options: "i" },
			"participants.userId": { $ne: userId }
		})
			.populate("group.createdBy", "username displayName")
			.select("-participants"); // Don't need full participant list for search

		res.status(200).json(groups);
	} catch (error) {
		console.error("Error in searchGroups:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Request to Join Group
export const requestJoinGroup = async (req, res) => {
	try {
		const { groupId } = req.params;
		const requesterId = req.user._id;

		const conversation = await Conversation.findById(groupId);
		if (!conversation || conversation.type !== 'group') {
			return res.status(404).json({ message: "Group not found" });
		}

		// Check if already a member
		const isMember = conversation.participants.some(p => p.userId.toString() === requesterId.toString());
		if (isMember) {
			return res.status(400).json({ message: "You are already a member of this group" });
		}

		const groupInfo = conversation.group[0];
		const adminId = groupInfo.createdBy;

		// Check if request already exists (Optional optimization: check Notification or a specific Request model if created)
		// For simplicity, we just send a notification to Admin. 
		// Real-world: Check if pending request exists in a JoinRequest model. 
		// Here we'll just create a notification. The Admin can "Add Member" manually or we implement a "Approve Request" flow later.
		// For this task, "request join" -> Notification to Admin is sufficient start.

		await createNotification({
			recipient: adminId,
			sender: requesterId,
			type: "group_join_request", // New type
			content: `requested to join your group "${groupInfo.name}"`,
			relatedId: conversation._id,
			relatedModel: "Conversation"
		});

		res.status(200).json({ message: "Join request sent to admin" });

	} catch (error) {
		console.error("Error in requestJoinGroup:", error);
		res.status(500).json({ message: "Internal server error" });
	}
}
