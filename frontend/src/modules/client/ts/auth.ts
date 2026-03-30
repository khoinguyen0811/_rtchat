import { ToastService } from "../../../services/toast.ts";
import { signinSchema, signupSchema, showError } from "./formSchema.ts";
import { authStore } from "../../../store/authStore.ts";
import resetForm from "../../../helper/form.ts";

interface userInfo {
	username: string;
	password: string;
	email: string;
	firstname: string;
	lastname: string;
}
const loginData = {
	username: "",
	password: "",
};
const signupData = {
	firstname: "",
	lastname: "",
	email: "",
	username: "",
	password: "",
};
// DOM ELEMENT
const loginForm = document.getElementById("login") as HTMLFormElement;
const registerForm = document.getElementById("signup") as HTMLFormElement;
const loginTabBtn = document.getElementById("login-tab-btn") as HTMLButtonElement;
// Setup listener
// SignIn signInBtn
const signInBtn = document.getElementById("btn-login");
console.log(authStore.getState().accessToken);
if (signInBtn) {
	signInBtn.addEventListener("click", function () {
		const username = (
			document.getElementById("login-username") as HTMLInputElement
		)?.value;
		const password = (
			document.getElementById("login-password") as HTMLInputElement
		)?.value;

		if (!username || !password) {
			ToastService.show("All fields are required", "danger");
			return;
		}

		loginData.username = username;
		loginData.password = password;

		const result = signinSchema.safeParse(loginData);
		if (!result.success) {
			result.error.issues.forEach((error) => {
				if (loginForm?.classList.contains("active")) {
					showError(loginForm, String(error.path[0]), error.message);
				}
			});
			return;
		}

		authStore.getState().signIn(loginData);
		ToastService.show("Login successful", "success");

		setTimeout(() => {
			window.location.href = "/src/pages/client/home.html";
			console.log("Login successful", authStore.getState().accessToken);
		}, 500);
	});
}

// SignUp
const signupBtn = document.getElementById("btn-signup");

if (signupBtn) {
	signupBtn.addEventListener("click", function () {
		const firstname = (document.getElementById("signup-firstname") as HTMLInputElement)?.value;
		const lastname = (document.getElementById("signup-lastname") as HTMLInputElement)?.value;
		const email = (document.getElementById("signup-email") as HTMLInputElement)?.value;
		const username = (document.getElementById("signup-username") as HTMLInputElement)?.value;
		const password = (document.getElementById("signup-password") as HTMLInputElement)?.value;
		const confirmPassword = (document.getElementById("signup-confirm-password") as HTMLInputElement)?.value;

		if (!firstname || !lastname || !email || !username || !password || !confirmPassword) {
			ToastService.show("All fields are required", "danger");
			return;
		}

		if (password !== confirmPassword) {
			ToastService.show("Passwords do not match", "danger");
			return;
		}

		Object.assign(signupData, { firstname, lastname, email, username, password });

		const result = signupSchema.safeParse(signupData);
		if (!result.success) {
			result.error.issues.forEach((error) => {
				if (registerForm?.classList.contains("active")) {
					showError(registerForm, String(error.path[0]), error.message);
				}
			});
			return;
		}

		authStore.getState().signUp(signupData);
		resetForm(registerForm);
		loginTabBtn?.click();
	});
}


// SignOut
const signoutBtn = document.getElementById("signout-btn");

if (signoutBtn) {
	signoutBtn.addEventListener("click", function () {
		authStore.getState().signOut();
		window.location.href = "/src/pages/client/auth-login.html";
	});
}

