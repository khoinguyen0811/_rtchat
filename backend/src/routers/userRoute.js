import express from "express";
import { authMe, searchUsers, updateAvatar, updateDisplayName, getUser } from "../controllers/userController.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

router.get('/me', authMe)
router.get('/search', searchUsers)
router.put('/displayname', updateDisplayName);
router.put('/avatar', upload.single("avatar"), updateAvatar);
router.get('/:id', getUser);

export default router