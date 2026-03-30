import { tokenStorage } from "../helper/token";

const API_URL = "http://localhost:5001/api/groups";

export const groupService = {
	createGroup: async (name: string, participants: string[]) => {
		try {
			const token = tokenStorage.get();
			const response = await fetch(`${API_URL}/`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				credentials: "include",
				body: JSON.stringify({ name, participants }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || "Failed to create group");
			}

			return await response.json();
		} catch (error) {
			console.error("createGroup error:", error);
			throw error;
		}
	},

	addMembers: async (groupId: string, userIds: string[]) => {
		try {
			const token = tokenStorage.get();
			const response = await fetch(`${API_URL}/${groupId}/members`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				credentials: "include",
				body: JSON.stringify({ userIds }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || "Failed to add members");
			}

			return await response.json();
		} catch (error) {
			console.error("addMembers error:", error);
			throw error;
		}
	},

	getGroups: async () => {
		try {
			const token = tokenStorage.get();
			const response = await fetch(`${API_URL}/`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				credentials: "include",
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || "Failed to get groups");
			}

			return await response.json();
		} catch (error) {
			console.error("getGroups error:", error);
			throw error;
		}
	},

	searchGroups: async (query: string) => {
		try {
			const token = tokenStorage.get();
			const response = await fetch(
				`${API_URL}/search?query=${encodeURIComponent(query)}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					credentials: "include",
				},
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || "Failed to search groups");
			}

			return await response.json();
		} catch (error) {
			console.error("searchGroups error:", error);
			throw error;
		}
	},

	joinGroup: async (groupId: string) => {
		try {
			const token = tokenStorage.get();
			const response = await fetch(`${API_URL}/${groupId}/join`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				credentials: "include",
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || "Failed to request to join group");
			}

			return await response.json();
		} catch (error) {
			console.error("joinGroup error:", error);
			throw error;
		}
	},
};
