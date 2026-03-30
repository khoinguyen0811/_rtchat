import type { User } from "./user";

export interface AuthState {
	accessToken: string | null;
	user: User | null;
	loading: boolean;

	clearState: () => void;

	signUp: (data: {
		username: string;
		password: string;
		firstname: string;
		lastname: string;
		email: string;
	}) => Promise<void>;

	signIn: (data: { username: string; password: string }) => Promise<void>;

	signOut: () => Promise<void>;

	checkAuth: () => Promise<void>;
}
