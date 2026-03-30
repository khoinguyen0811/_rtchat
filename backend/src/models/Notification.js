import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
	recipient: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
		index: true
	},
	sender: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User"
	},
	type: {
		type: String,
		enum: ["friend_request", "friend_accept", "group_invite", "system"],
		required: true
	},
	content: {
		type: String, // Short description
		required: true
	},
	relatedId: {
		type: mongoose.Schema.Types.ObjectId, // ID of FriendRequest, Group, etc.
	},
	relatedModel: {
		type: String, // "FriendRequest", "Group", "User"; used for dynamic population if needed
	},
	isRead: {
		type: Boolean,
		default: false
	}
}, {
	timestamps: true
});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
