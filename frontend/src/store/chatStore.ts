import { createStore } from "zustand/vanilla";
import { chatService } from "../services/chatService.ts";
import type { Conversation, Message } from "../types/chat.ts";
import { ToastService } from "../services/toast.ts";

interface ChatState {
	conversations: Conversation[];
	pendingConversations: Conversation[];
	messages: Message[];
	activeConversation: Conversation | null;
	loading: boolean;

	fetchConversations: () => Promise<void>;
	fetchPendingConversations: () => Promise<void>;
	fetchMessages: (conversationId: string) => Promise<void>;
	setActiveConversation: (conversation: Conversation) => void;
	sendMessage: (data: any) => Promise<void>;
}

export const chatStore = createStore<ChatState>((set, get) => ({
	conversations: [],
	pendingConversations: [],
	messages: [],
	activeConversation: null,
	loading: false,

	fetchConversations: async () => {
		try {
			const data = await chatService.getConversations("main");
			set({ conversations: data });
		} catch (error) {
			console.error("Failed to fetch conversations", error);
		}
	},

	fetchPendingConversations: async () => {
		try {
			const data = await chatService.getConversations("pending");
			set({ pendingConversations: data });
		} catch (error) {
			console.error("Failed to fetch pending conversations", error);
		}
	},

	fetchMessages: async (conversationId: string) => {
		try {
			set({ loading: true });
			const data = await chatService.getMessages(conversationId);
			set({ messages: data });
		} catch (error) {
			console.error("Failed to fetch messages", error);
			ToastService.show("Failed to load messages", "danger");
		} finally {
			set({ loading: false });
		}
	},

	setActiveConversation: (conversation: Conversation) => {
		set({ activeConversation: conversation });
		get().fetchMessages(conversation._id);
	},

	sendMessage: async (data: any) => {
		try {
			await chatService.sendMessage(data);
			// Refresh logic:
			// If active conversation, refresh messages?
			// Better: socket update (omitted for now), or optimistic update.
			// For now, simple refresh
			const active = get().activeConversation;
			if (active) {
				await get().fetchMessages(active._id);
			}
			// Refresh lists
			get().fetchConversations();
			get().fetchPendingConversations();
		} catch (error) {
			console.error("Failed to send message", error);
			ToastService.show("Failed to send message", "danger");
		}
	},
}));
