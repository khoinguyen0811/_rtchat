import express from "express";
import {
	sendFriendRequest,
	getFriendRequests,
	getSentRequests,
	acceptFriendRequest,
	rejectFriendRequest,
	getFriends,
	unfriend
} from "../controllers/friendController.js";

const router = express.Router();

router.post("/request", sendFriendRequest);
router.get("/requests", getFriendRequests);
router.get("/requests/sent", getSentRequests);
router.put("/request/:requestId/accept", acceptFriendRequest);
router.put("/request/:requestId/reject", rejectFriendRequest);
router.get("/", getFriends);
router.delete("/:friendId", unfriend);

export default router;
