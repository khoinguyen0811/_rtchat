import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
	io = new Server(server, {
		cors: {
			origin: process.env.FRONTEND_URL,
			methods: ["GET", "POST"],
			credentials: true,
		},
	});

	io.on("connection", (socket) => {
		console.log("A user connected:", socket.id);

		socket.on("disconnect", () => {
			console.log("User disconnected:", socket.id);
		});

		// real event - replace with actual logic later
		socket.on("sendMessage", (message) => {
			console.log("Message received:", message);
			io.emit("receiveMessage", message);
		});
	});

	return io;
};

export const getIO = () => {
	if (!io) {
		throw new Error("Socket.io not initialized!");
	}
	return io;
};
