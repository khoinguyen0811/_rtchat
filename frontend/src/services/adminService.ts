import { tokenStorage } from "../helper/token";
import { authService } from "./authService";

const API_URL = "http://localhost:5001/api/admin";

const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
	let token = tokenStorage.get();
	const headers = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${token}`,
		...(options.headers || {}),
	};

	try {
		const response = await fetch(`${API_URL}${endpoint}`, {
			...options,
			headers,
			credentials: "include",
		});

		if (response.status === 401) {
			try {
				console.log("Token expired, attempting refresh...");
				const data = await authService.refreshToken();
				if (data && data.accessToken) {
					tokenStorage.set(data.accessToken);
					// Retry request with new token
					const newHeaders = {
						...headers,
						Authorization: `Bearer ${data.accessToken}`,
					};
					const retryResponse = await fetch(`${API_URL}${endpoint}`, {
						...options,
						headers: newHeaders,
						credentials: "include",
					});

					if (!retryResponse.ok) {
						const errorData = await retryResponse.json().catch(() => ({}));
						throw new Error(
							errorData.message || "API Request Failed after refresh",
						);
					}
					return await retryResponse.json();
				}
			} catch (refreshError) {
				console.error("RefreshToken failed", refreshError);
				tokenStorage.remove();
				window.location.href = "../client/auth.html";
				throw new Error("Session expired");
			}
		}

		if (response.status === 403) {
			tokenStorage.remove();
			window.location.href = "../client/auth.html";
			throw new Error("Access Forbidden");
		}

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || "API Request Failed");
		}

		return await response.json();
	} catch (error) {
		console.error(`API Error (${endpoint}):`, error);
		throw error;
	}
};

export const adminService = {
	getStats: async () => {
		return await fetchWithAuth("/stats", { method: "GET" });
	},

	getAllUsers: async () => {
		return await fetchWithAuth("/users", { method: "GET" });
	},

	banUser: async (userId: string) => {
		return await fetchWithAuth(`/users/${userId}/ban`, { method: "PATCH" });
	},

	deleteUser: async (userId: string) => {
		return await fetchWithAuth(`/users/${userId}`, { method: "DELETE" });
	},

	getAllGroups: async () => {
		return await fetchWithAuth("/groups", { method: "GET" });
	},

	deleteGroup: async (groupId: string) => {
		return await fetchWithAuth(`/groups/${groupId}`, { method: "DELETE" });
	},

	removeGroupMember: async (groupId: string, userId: string) => {
		return await fetchWithAuth(`/groups/${groupId}/members/${userId}`, {
			method: "DELETE",
		});
	},

	getAllMessages: async () => {
		return await fetchWithAuth("/messages", { method: "GET" });
	},

	deleteMessage: async (messageId: string) => {
		return await fetchWithAuth(`/messages/${messageId}`, { method: "DELETE" });
	},

	updateUserRole: async (userId: string, role: "user" | "admin") => {
		return await fetchWithAuth(`/users/${userId}/role`, {
			method: "PUT",
			body: JSON.stringify({ role }),
		});
	},
};
