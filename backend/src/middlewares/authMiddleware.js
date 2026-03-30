import jwt from "jsonwebtoken";
import User from "../models/User.js";


//next là một hàm callback dùng trong middleware của express khi dùng thì
// express sẻ hiểu là chyển tiếp tới luồn sửa lý kế tiếp vidu như chuyển tới middleware kế tiếp 
// hoặc api route tiếp theo
export const protectedRoute = async (req, res, next) => {
	try {
		// lấy token từ header
		// lấy token từ header. Node.js tự động chuyển header keys thành chữ thường.
		const authHeader = req.headers["authorization"];
		console.log("Headers:", req.headers); // Log headers để debug
		const token = authHeader && authHeader.split(" ")[1];

		if (!token) {
			console.log("Token not found in header:", authHeader);
			return res.status(401).json({ message: "Access token not found" })
		}
		// check token hợp lệ
		jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedUser) => {
			if (err) {
				console.error("Invalid access token:", err);
				return res.status(403).json({ message: "Invalid access token" })
			}
			// tìm user trong db
			const user = await User.findById(decodedUser.userId).select("-hashedPassword");
			if (!user) {
				console.error("User not found:", decodedUser.userId);
				return res.status(401).json({ message: "User not found" })
			}
			// trả user trong req
			req.user = user;
			// chuyển tiếp tới middleware tiếp theo
			next();
		})
		// tìm user nếu token hợp lệ

		//  trả user trong req

	} catch (error) {
		console.error("Error in protectedRoute middleware:", error);
		return res.status(500).json({ message: "Internal server error" })
	}
}