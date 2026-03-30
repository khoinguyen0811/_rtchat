export const tokenStorage = {
	get(): string | null {
		return localStorage.getItem("accessToken");
	},

	set(token: string) {
		console.log("Đang lưu token: " + token);
		localStorage.setItem("accessToken", token);
	},

	remove() {
		localStorage.removeItem("accessToken");
	},

	has(): boolean {
		return !!localStorage.getItem("accessToken");
	},
};
