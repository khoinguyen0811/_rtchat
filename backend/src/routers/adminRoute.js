import express from "express";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import {
	getStats,
	getAllUsers,
	banUser,
	updateUserRole,
	deleteUser,
	getAllGroups,
	deleteGroup,
	removeGroupMember,
	getAllMessages,
	deleteMessage
} from "../controllers/adminController.js";

const router = express.Router();

router.use(protectedRoute);
router.use(adminMiddleware);

// Stats
router.get("/stats", getStats);

// Users
router.get("/users", getAllUsers);
router.patch("/users/:userId/ban", banUser);
router.put("/users/:userId/role", updateUserRole);
router.delete("/users/:userId", deleteUser);

// Groups
router.get("/groups", getAllGroups);
router.delete("/groups/:groupId", deleteGroup);
router.delete("/groups/:groupId/members/:userId", removeGroupMember);

// Messages
router.get("/messages", getAllMessages);
router.delete("/messages/:messageId", deleteMessage);

export default router;
