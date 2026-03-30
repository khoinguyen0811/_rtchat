import mongoose from "mongoose";

const participantsSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	joinedAt: {
		type: Date,
		default: Date.now,
	},
}, {
	_id: false,
});

const groupSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	createdBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	// có thể thêm thông tin cho group sau như avatar, description, ...
}, {
	_id: false,
});

const lastMessageSchema = new mongoose.Schema({
	_id: { type: String },
	content: {
		type: String,
		default: null
	},
	senderId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
	createdAt: {
		type: Date,
		default: null,
	},
}, {
	_id: false,
});


const conversationSchema = new mongoose.Schema({
	type: {
		type: String,
		enum: ["direct", "group"],
		required: true,
	},
	participants: {
		type: [participantsSchema],
		required: true,
	},
	isPending: {
		type: Boolean,
		default: false,
	},
	pendingReceiver: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		default: null,
	},
	group: {
		type: [groupSchema],
	},
	lastMessageAt: {
		type: Date,
	},
	lastMessage: {
		type: lastMessageSchema,
		default: null,
	},
	seenBy: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	}],
	unReadCount: {
		type: Map,
		of: Number,
		default: {},
	},
}, {
	timestamps: true,
});


conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });
const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;