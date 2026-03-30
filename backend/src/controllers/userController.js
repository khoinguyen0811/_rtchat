import User from "../models/User.js";
import { uploadToCloudinary } from "../libs/uploadHelper.js";

export const authMe = async (req, res) => {
	try {
		const user = req.user;
		return res.status(200).json({ user })
	} catch (error) {
		console.error("Error while authMe:", error);
		return res.status(500).json({ message: "Internal server error" })
	}
}

export const searchUsers = async (req, res) => {
	try {
		const { query } = req.query;
		if (!query) return res.json([]);

		const users = await User.find({
			$or: [
				{ username: { $regex: query, $options: "i" } },
				{ displayName: { $regex: query, $options: "i" } },
			],
			_id: { $ne: req.user._id }
		}).select("-hashedPassword -email"); // don't return sensitive info

		res.status(200).json(users);
	} catch (error) {
		console.error("Error in searchUsers: ", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const updateDisplayName = async (req, res) => {
	try {
		const { displayName } = req.body;

		if (!displayName) {
			return res.status(400).json({ message: "Display name is required" });
		}

		const updatedUser = await User.findByIdAndUpdate(
			req.user._id,
			{ displayName },
			{ new: true }
		).select("-hashedPassword");

		res.status(200).json(updatedUser);
	} catch (error) {
		console.log("Error in updateDisplayName: ", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const updateAvatar = async (req, res) => {
	try {
		const file = req.file;

		if (!file) {
			return res.status(400).json({ message: "Avatar file is required" });
		}

		const result = await uploadToCloudinary(file.buffer);
		const avatarUrl = result.secure_url;

		const updatedUser = await User.findByIdAndUpdate(
			req.user._id,
			{ avatarUrl },
			{ new: true }
		).select("-hashedPassword");

		res.status(200).json(updatedUser);
	} catch (error) {
		console.log("Error in updateAvatar: ", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const getUser = async (req, res) => {
	try {
		const { id } = req.params;
		const user = await User.findById(id).select("-hashedPassword -email");
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}
		res.status(200).json(user);
	} catch (error) {
		console.error("Error in getUser:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};
