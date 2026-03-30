import * as z from "zod";

export const signinSchema = z.object({
	username: z.string().min(1, "Username not null").max(40, "Username must be at most 20 characters long"),
	password: z.string().min(6, "Password must be at least 6 characters long"),
})

export const signupSchema = z.object({
	username: z.string().min(1, "Username not null").max(40, "Username must be at most 20 characters long"),
	password: z.string().min(6, "Password must be at least 6 characters long"),
	email: z.string().email({message: "Invalid email address"}),
	firstname: z.string().min(1, "First name not null").max(20, "First name must be at most 20 characters long"),
	lastname: z.string().min(1, "Last name not null").max(20, "Last name must be at most 20 characters long"),
})

export function showError(form: HTMLFormElement, field: string, message: string) {
	const el = form.querySelector(`[data-error="${field}"]`);
	if (el) el.textContent = message;
}
