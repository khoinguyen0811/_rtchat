import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";

const ACCESS_TOKEN_TTL = "15m"; // thường dưới 15 phút
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 days	

export const signUp = async (req, res) => {
	try {
		const { username, password, email, firstname, lastname } = req.body;
		if (!username || !password || !email || !firstname || !lastname) {
			return res
				.status(400)
				.json(
					{
						message: "Not Null username, password, email, firstname, lastname"
						// fieldErrors: {
						// 	username: username,
						// 	password: password,
						// 	email: email,
						// 	firstname: firstname,
						// 	lastname: lastname,
						// }
					}
				);
		}

		// kiểm tra username có tồn tại chưa
		const duplicate = await User.findOne({ username })
		if (duplicate) {
			return res.status(409).json({ message: "Username already exists" }) //  return 409 error
		}
		// kiểm tra email có tồn tại chưa
		const duplicateEmail = await User.findOne({ email })
		if (duplicateEmail) {
			return res.status(409).json({ message: "Email already exists" }) //  return 409 error
		}

		// Mã hóa password
		const hashedPassword = await bcrypt.hash(password, 10); // salt = 10 

		// Tạo user 
		await User.create({
			username,
			email,
			hashedPassword,
			displayName: `${firstname} ${lastname}`,
		})

		// return response
		return res.status(204).json({ message: "User created successfully" })

	} catch (error) {
		console.error("Error while signup:", error);
		return res.status(500).json({ message: "Internal server error" })
	}
}

export const signIn = async (req, res) => {
	try {
		// lấy inputs
		const { username, password } = req.body;
		if (!username || !password) {
			return res.status(400).json({ message: "Not Null username or password" })
		}
		// lấy hashedPassword trong db để so với password input
		const user = await User.findOne({ username })
		if (!user) {
			return res.status(401).json({ message: "Invalid user credentials" })
		}
		// so sánh password
		const isPasswordMatched = await bcrypt.compare(password, user.hashedPassword)
		if (!isPasswordMatched) {
			return res.status(401).json({ message: "Invalid user credentials" })
		}
		// nếu khớp, tạo accesstoken  với jwt
		const accessToken = jwt.sign(
			{ userId: user._id },
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: ACCESS_TOKEN_TTL }
		)
		// tạo refesh token với jwt
		const refreshToken = crypto.randomBytes(64).toString("hex");

		// tạo session mơi để lưu refesh token
		await Session.create({
			userId: user._id,
			refreshToken,
			expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL)
		})

		// trả refesh token về trong cookie
		res.cookie("refreshToken", refreshToken, {
			httpOnly: true, // không thể truy cập từ js
			secure: true, // chỉ gửi qua https 
			sameSite: "none", // cho phép 2 domain khác nhau (deploy backend, frontend riêng) 
			maxAge: REFRESH_TOKEN_TTL
		})
		// return  response
		return res.status(200).json({ message: "User signed in successfully", accessToken })

	} catch (error) {
		console.error("Error while signIn:", error);
		return res.status(500).json({ message: "Internal server error" })
	}
}

export const signOut = async (req, res) => {
	try {
		// lấy refesh token từ cookie
		const refreshToken = req.cookies.refreshToken;
		if (!refreshToken) {
			return res.status(401).json({ message: "Unauthorized" })
		}
		// xóa refesh token trong db
		await Session.deleteOne({ refreshToken })
		// xóa refesh token trong cookie
		res.clearCookie("refreshToken")
		// return response
		return res.status(200).json({ message: "User signed out successfully" })
	} catch (error) {
		console.error("Error while signOut:", error);
		return res.status(500).json({ message: "Internal server error" })
	}
}

// tạo refect token mới từ refect token
export const refreshToken = async (req, res) => {
	try {
		// lấy refesh token từ cookie
		const refreshToken = req.cookies?.refreshToken; // ? là hỏi có refreshToken trong cookie không
		if (!refreshToken) {
			return res.status(401).json({ message: "Token not found" })
		}

		// so với refesh token trong db
		const session = await Session.findOne({ refreshToken })
		if (!session) {
			return res.status(401).json({ message: "Invalid token" })
		}
		// kiểm tra hết hạn chưa 
		if (session.expiresAt < new Date()) {
			return res.status(401).json({ message: "Token expired" })
		}

		const user = await User.findById(session.userId).select("-hashedPassword");
		if (!user) {
			return res.status(401).json({ message: "User not found" });
		}

		const accessToken = jwt.sign(
			{ userId: session.userId },
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: ACCESS_TOKEN_TTL }
		)

		return res.status(200).json({ message: "Access token refreshed", accessToken, user })
	} catch (error) {
		console.error("Error while refreshToken:", error);
		return res.status(500).json({ message: "Internal server error" })
	}
} 