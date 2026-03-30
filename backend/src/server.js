import express from 'express';
import dotenv from 'dotenv';
import { connectToDB } from './libs/db.js';
import authRoute from './routers/authRoute.js';
import userRoute from './routers/userRoute.js';
import friendRoute from './routers/friendRoute.js';
import messageRoute from './routers/messageRoute.js';
import notificationRoute from './routers/notificationRoute.js';
import groupRoute from './routers/groupRoute.js';
import adminRoute from './routers/adminRoute.js';
import cookieParser from 'cookie-parser';
import { protectedRoute } from './middlewares/authMiddleware.js';
import cors from 'cors';
import http from "http";
import { initSocket } from "./libs/socket.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

//middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

//public routes
app.use('/api/auth', authRoute);

//private routes
app.use(protectedRoute);
app.use('/api/users', userRoute);
app.use('/api/friends', friendRoute);
app.use('/api/messages', messageRoute);
app.use('/api/notifications', notificationRoute);
app.use('/api/groups', groupRoute);
app.use('/api/admin', adminRoute);

//connect to db
connectToDB().then(() => {
	// Initialize Socket.io
	initSocket(server);

	server.listen(PORT, () => {
		console.log(`Server is running on port ${PORT}`);
	})
}).catch((error) => {
	console.error("Error connecting to MongoDB:", error);
	process.exit(1);
})