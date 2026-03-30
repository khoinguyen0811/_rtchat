import io from "socket.io-client";
import { authStore } from "../store/authStore";

const SERVER_URL = "http://localhost:5001";

class SocketService {
	private socket: any | null = null;

	connect() {
		if (this.socket) return;

		const { user } = authStore.getState();
		if (!user) return;

		this.socket = io(SERVER_URL, {
			withCredentials: true,
		} as any);

		this.socket.on("connect", () => {
			console.log("Socket connected:", this.socket?.id);
		});

		this.socket.on("disconnect", () => {
			console.log("Socket disconnected");
		});

		this.socket.on("newMessage", (message: any) => {
			const event = new CustomEvent("socket:newMessage", { detail: message });
			document.dispatchEvent(event);
		});
	}

	disconnect() {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
		}
	}

	getSocket() {
		return this.socket;
	}
}

export const socketService = new SocketService();
