import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
	conversationId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Conversation",
		required: true,
		index: true,
	},
	senderId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	content: {
		type: String,
		trim: true,
	},
	// imgUrl deprecated, use fileUrl/fileType or attachments
	imgUrl: {
		type: String,
	},
	fileUrl: {
		type: String,
	},
	fileType: {
		type: String,
		enum: ["image", "video", "voice", "gif", "file"],
		default: "image"
	},
	reactions: [
		{
			userId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User"
			},
			type: {
				type: String,
				enum: ["like", "love", "haha", "wow", "sad", "angry"],
				default: "like"
			}
		}
	],
	isRevoked: {
		type: Boolean,
		default: false,
	},
}, {
	timestamps: true, // tạo updatedAt và createdAt
});
messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;