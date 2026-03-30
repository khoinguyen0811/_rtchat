import api from "../lib/api";

export interface Notification {
	_id: string;
	recipient: string;
	sender?: {
		_id: string;
		username: string;
		displayName: string;
		avatarUrl?: string;
	};
	type: "friend_request" | "friend_accept" | "group_invite" | "system";
	content: string;
	relatedId?: string;
	relatedModel?: string;
	isRead: boolean;
	createdAt: string;
}

export const notificationService = {
	getNotifications: async () => {
		const response = await api.get("/notifications", { withCredentials: true });
		return response.data;
	},

	markAsRead: async (id: string) => {
		const response = await api.put(
			`/notifications/${id}/read`,
			{},
			{ withCredentials: true },
		);
		return response.data;
	},

	markAllAsRead: async () => {
		const response = await api.put(
			"/notifications/read-all",
			{},
			{ withCredentials: true },
		);
		return response.data;
	},
};
