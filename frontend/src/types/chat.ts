export interface User {
	_id: string;
	username: string;
	displayName: string;
	avatarUrl?: string;
	email?: string;
}

export interface Message {
	_id: string;
	conversationId: string;
	senderId: User; // Populated
	content: string;
	fileUrl?: string;
	fileType?: string;
	imgUrl?: string;
	reactions: any[];
	isRevoked: boolean;
	createdAt: string;
}

export interface Conversation {
	_id: string;
	type: "direct" | "group";
	participants: {
		userId: User; // Populated
		joinedAt: string;
	}[];
	lastMessage?: {
		_id: string;
		content: string;
		senderId: User | string; // Sometimes populated
		createdAt: string;
	};
	lastMessageAt?: string;
	unReadCount: Record<string, number>;
	isPending?: boolean;
	pendingReceiver?: string; // ObjectId
	group?: {
		name: string;
		createdBy: string;
	}[];
}
