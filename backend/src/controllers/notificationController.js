import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
	try {
		const userId = req.user._id;
		const notifications = await Notification.find({ recipient: userId })
			.sort({ createdAt: -1 })
			.populate("sender", "username displayName avatarUrl")
			.limit(20);

		res.status(200).json(notifications);
	} catch (error) {
		console.error("Error in getNotifications:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const markAsRead = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user._id;

		const notification = await Notification.findById(id);
		if (!notification) {
			return res.status(404).json({ message: "Notification not found" });
		}

		if (notification.recipient.toString() !== userId.toString()) {
			return res.status(403).json({ message: "Unauthorized" });
		}

		notification.isRead = true;
		await notification.save();

		res.status(200).json(notification);
	} catch (error) {
		console.error("Error in markAsRead:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const markAllAsRead = async (req, res) => {
	try {
		const userId = req.user._id;
		await Notification.updateMany(
			{ recipient: userId, isRead: false },
			{ isRead: true }
		);
		res.status(200).json({ message: "All notifications marked as read" });
	} catch (error) {
		console.error("Error in markAllAsRead:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Internal Helper to create notification (not an API endpoint)
export const createNotification = async ({ recipient, sender, type, content, relatedId, relatedModel }) => {
	try {
		await Notification.create({
			recipient,
			sender,
			type,
			content,
			relatedId,
			relatedModel
		});
	} catch (error) {
		console.error("Error creating notification:", error);
	}
};
