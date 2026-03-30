import api from "../lib/api.ts";
import { ToastService } from "./toast.ts";

export const friendService = {
	sendFriendRequest: async (toUserId: string) => {
		try {
			const response = await api.post(
				"/friends/request",
				{ to: toUserId },
				{ withCredentials: true },
			);
			return response.data;
		} catch (error: any) {
			console.error("Error sending friend request:", error);
			const msg =
				error.response?.data?.message || "Failed to send friend request";
			ToastService.show(msg, "danger");
			throw error;
		}
	},
	getFriendRequests: async () => {
		try {
			const response = await api.get("/friends/requests", {
				withCredentials: true,
			});
			return response.data;
		} catch (error: any) {
			console.error("Error fetching friend requests:", error);
			return [];
		}
	},
	getSentRequests: async () => {
		try {
			const response = await api.get("/friends/requests/sent", {
				withCredentials: true,
			});
			return response.data;
		} catch (error: any) {
			console.error("Error fetching sent requests:", error);
			return [];
		}
	},
	getFriends: async () => {
		try {
			const response = await api.get("/friends", { withCredentials: true });
			return response.data;
		} catch (error: any) {
			console.error("Error fetching friends:", error);
			// Optional: ToastService.show("Failed to fetch friends", "danger");
			// Return empty array on error to not break UI
			return [];
		}
	},
	acceptFriendRequest: async (requestId: string) => {
		try {
			const response = await api.put(
				`/friends/request/${requestId}/accept`,
				{},
				{ withCredentials: true },
			);
			ToastService.show("Friend request accepted", "success");
			return response.data;
		} catch (error: any) {
			console.error("Error accepting friend request:", error);
			const msg = error.response?.data?.message || "Failed to accept request";
			ToastService.show(msg, "danger");
			throw error;
		}
	},
	rejectFriendRequest: async (requestId: string) => {
		try {
			const response = await api.put(
				`/friends/request/${requestId}/reject`,
				{},
				{ withCredentials: true },
			);
			ToastService.show("Friend request rejected", "primary");
			return response.data;
		} catch (error: any) {
			console.error("Error rejecting friend request:", error);
			const msg = error.response?.data?.message || "Failed to reject request";
			ToastService.show(msg, "danger");
			throw error;
		}
	},
	unfriend: async (friendId: string) => {
		try {
			const response = await api.delete(`/friends/${friendId}`, {
				withCredentials: true,
			});
			ToastService.show("Friend removed", "primary");
			return response.data;
		} catch (error: any) {
			console.error("Error removing friend:", error);
			const msg = error.response?.data?.message || "Failed to remove friend";
			ToastService.show(msg, "danger");
			throw error;
		}
	},
};
