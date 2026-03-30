import api from "../lib/api.ts";

export const chatService = {
	getConversations: async (type: "main" | "pending" = "main") => {
		const response = await api.get(`/messages/conversations?type=${type}`, {
			withCredentials: true,
		});
		return response.data;
	},

	getMessages: async (conversationId: string) => {
		const response = await api.get(`/messages/${conversationId}`, {
			withCredentials: true,
		});
		return response.data;
	},

	sendMessage: async (data: any) => {
		// data can be JSON or FormData
		const headers =
			data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {};
		const response = await api.post("/messages", data, {
			withCredentials: true,
			headers,
		});
		return response.data;
	},

	createConversation: async (recipientId: string) => {
		const response = await api.post(
			"/messages/conversations",
			{ recipientId },
			{ withCredentials: true },
		);
		return response.data;
	},

	getConversation: async (conversationId: string) => {
		// Can use getMessages but that returns messages. We might already have it or simply fetch list.
		// Actually, for "getConversation" (single object), we might not have a dedicated API returning just the object
		// except createConversation (which returns it).
		// If we strictly need it, we can filter getConversations?
		// But for now let's just use what createConversation returns.
		// I'll leave this empty or mock if I referenced it, OR best, REMOVE the usage of getConversation if possible
		// and rely on what createConversation returns.
		// In chat.ts I used: const created = await chatService.getConversation(newConvo._id);
		// I will change chat.ts to NOT use getConversation and use newConvo directly.
		// So I won't add getConversation here to avoid confusion.
		return null;
	},

	deleteMessage: async (messageId: string) => {
		const response = await api.delete(`/messages/${messageId}`, {
			withCredentials: true,
		});
		return response.data;
	},
};
