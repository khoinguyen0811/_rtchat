import express from "express";
import { sendMessage, getMessages, getConversations, reactToMessage, revokeMessage, createConversation, deleteMessage } from "../controllers/messageController.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

router.post("/", upload.single("file"), sendMessage);
router.post("/", upload.single("file"), sendMessage);
router.post("/conversations", createConversation);
router.get("/conversations", getConversations);
router.get("/:conversationId", getMessages);
router.put("/:messageId/react", reactToMessage);
router.put("/:messageId/revoke", revokeMessage);
router.delete("/:messageId", deleteMessage);

export default router;
