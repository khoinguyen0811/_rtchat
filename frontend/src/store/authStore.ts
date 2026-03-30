import { createStore } from "zustand/vanilla";
import { ToastService } from "../services/toast.ts";
import type { AuthState } from "../types/store.ts";
import { authService } from "../services/authService.ts";
import { tokenStorage } from "../helper/token.ts";

export const authStore = createStore<AuthState>((set, get) => ({
	accessToken: null,
	user: null,
	loading: false,

	clearState: () => {
		set({ accessToken: null, user: null, loading: false });
	},

	signUp: async ({ username, password, firstname, lastname, email }) => {
		try {
			set({ loading: true });

			//call api
			await authService
				.signUp(username, password, firstname, lastname, email)
				.then((response) => {
					tokenStorage.set(response.accessToken);
					set({ accessToken: response.accessToken });
					set({ user: response.user });
				});

			ToastService.show(
				"You're all set! Redirecting to the login page...",
				"success",
			);
		} catch (error) {
			console.error(error);
			ToastService.show("Something went wrong", "danger");
		} finally {
			set({ loading: false });
		}
	},

	signIn: async ({ username, password }) => {
		try {
			set({ loading: true });

			//call api
			await authService.signIn(username, password).then((response) => {
				tokenStorage.set(response.accessToken);
				set({ accessToken: response.accessToken });
				set({ user: response.user });
			});
		} catch (error) {
			console.error(error);
			ToastService.show("Something went wrong", "danger");
		} finally {
			set({ loading: false });
		}
	},

	signOut: async () => {
		try {
			//call api
			set({ loading: true });
			get().clearState();
			tokenStorage.remove();
			await authService.signOut();
			ToastService.show("You're signed out successfully", "success");
		} catch (error) {
			console.error(error);
			ToastService.show("Something went wrong when signout", "danger");
		} finally {
			set({ loading: false });
		}
	},

	checkAuth: async () => {
		try {
			set({ loading: true });
			const response = await authService.refreshToken();
			tokenStorage.set(response.accessToken);
			set({
				accessToken: response.accessToken,
				user: response.user,
			});
		} catch (error) {
			console.error("Check auth failed:", error);
			get().clearState();
			tokenStorage.remove();
		} finally {
			set({ loading: false });
		}
	},
}));
