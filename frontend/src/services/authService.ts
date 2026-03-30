import api from "../lib/api.ts";
import { ToastService } from "./toast.ts";

export const authService = {
	signUp: async (
		username: string,
		password: string,
		firstname: string,
		lastname: string,
		email: string,
	) => {
		try {
			const response = await api.post(
				"/auth/signup",
				{
					username,
					password,
					firstname,
					lastname,
					email,
				},
				{ withCredentials: true },
			);
			return response.data;
		} catch (error) {
			console.error(error);
			ToastService.show("Something went wrong when signup", "danger");
		}
	},

	signIn: async (username: string, password: string) => {
		try {
			const response = await api.post(
				"/auth/signin",
				{ username, password },
				{ withCredentials: true },
			);

			return response.data; // accesstoken
			ToastService.show(
				"You're all set! Redirecting to the home page...",
				"success",
			);
		} catch (error) {
			console.error(error);
			ToastService.show("Something went wrong when signin", "danger");
		}
	},

	signOut: async () => {
		try {
			await api.post("/auth/signout", { withCredentials: true });
		} catch (error) {
			console.error(error);
			ToastService.show("Something went wrong when signout", "danger");
		}
	},

	refreshToken: async () => {
		try {
			const response = await api.post(
				"/auth/refresh",
				{},
				{ withCredentials: true },
			);
			return response.data;
		} catch (error) {
			console.error(error); // Expected if token expired or missing
			throw error;
		}
	},

	getMe: async () => {
		try {
			const response = await api.get("/users/me");
			return response.data.user;
		} catch (error) {
			console.error("Error getting user info:", error);
			throw error;
		}
	},

	updateDisplayName: async (displayName: string) => {
		try {
			const response = await api.put("/users/displayname", { displayName });
			return response.data;
		} catch (error) {
			console.error("Error updating display name:", error);
			ToastService.show("Failed to update display name", "danger");
			throw error;
		}
	},

	updateAvatar: async (file: File) => {
		try {
			const formData = new FormData();
			formData.append("avatar", file);

			const response = await api.put("/users/avatar", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});
			return response.data;
		} catch (error) {
			console.error("Error updating avatar:", error);
			ToastService.show("Failed to update avatar", "danger");
			throw error;
		}
	},

	searchUsers: async (query: string) => {
		try {
			const response = await api.get(`/users/search?query=${query}`);
			return response.data;
		} catch (error) {
			console.error("Error searching users:", error);
			return [];
		}
	},

	getUser: async (userId: string) => {
		try {
			const response = await api.get(`/users/${userId}`);
			return response.data;
		} catch (error) {
			console.error("Error getting user details:", error);
			throw error;
		}
	},
};
