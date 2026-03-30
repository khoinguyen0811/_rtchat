import { authStore } from "../../../store/authStore";

const protectedRoute = async () => {
	// Initialize auth check from server (using refresh token if available)
	await authStore.getState().checkAuth();

	const { accessToken } = authStore.getState();

	if (!accessToken) {
		window.location.replace("/src/pages/client/auth-login.html");
		return;
	}
	// Authentication successful, reveal the page
	const style = document.getElementById("anti-flash");
	if (style) style.remove();
	else document.body.style.display = "block";
};

export default protectedRoute;
