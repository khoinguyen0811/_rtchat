import express from "express";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import { createGroup, addMembers, getGroups, searchGroups, requestJoinGroup } from "../controllers/groupController.js";

const router = express.Router();

router.use(protectedRoute);

router.get("/search", searchGroups);
router.post("/:groupId/join", requestJoinGroup);
router.get("/", getGroups);
router.post("/", createGroup);
router.post("/:groupId/members", addMembers);

export default router;
