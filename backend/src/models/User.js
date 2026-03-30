import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true,
		trim: true,
		lowercase: true,
		index: true
	},

	role: {
		type: String,
		enum: ["user", "admin"],
		default: "user"
	},

	isBanned: {
		type: Boolean,
		default: false
	},

	hashedPassword: {
		type: String,
		required: true
	},

	email: {
		type: String,
		required: true,
		unique: true,
		trim: true,
		lowercase: true,
		index: true
	},

	displayName: {
		type: String,
		trim: true,
		index: true
	},

	avatarUrl: {
		type: String, //link CDN để hiển thị hình ảnh
	},

	avatarId: {
		type: String, //id của file trong cloudinary
	},

	bio: {
		type: String,
		maxLength: 500
	},

	phone: {
		type: String,
		sparse: true, // allow null, như không đc trùng
		unique: true
	}
}, {
	timestamps: true // cấu hình tự động tạo createdAt và updatedAt
});

const User = mongoose.model("User", userSchema);
export default User;