import { authStore } from "../store/authStore";

const publicRoute = async () => {
	await authStore.getState().checkAuth();
	if (authStore.getState().accessToken) {
		window.location.replace("/src/pages/client/home.html");
	}
};

publicRoute();

/**
 * Handles Dark/Light Mode Toggling
 */

export class ThemeManager {
	private static readonly STORAGE_KEY = "chatvia-theme";
	private static readonly LIGHT_MODE_CLASS = "light-mode";
	private static readonly TOGGLE_BTN_ID = "theme-toggle-btn";
	private static readonly ICON_ID = "theme-icon";

	constructor() {
		this.init();
	}

	private init(): void {
		this.loadTheme();
		this.bindEvents();
	}

	private loadTheme(): void {
		const savedTheme = localStorage.getItem(ThemeManager.STORAGE_KEY);
		const systemPrefersLight = window.matchMedia(
			"(prefers-color-scheme: light)",
		).matches;

		if (savedTheme === "light" || (!savedTheme && systemPrefersLight)) {
			document.body.classList.add(ThemeManager.LIGHT_MODE_CLASS);
		}

		this.updateIcon();
	}

	private toggleTheme(): void {
		document.body.classList.toggle(ThemeManager.LIGHT_MODE_CLASS);
		const isLight = document.body.classList.contains(
			ThemeManager.LIGHT_MODE_CLASS,
		);

		localStorage.setItem(ThemeManager.STORAGE_KEY, isLight ? "light" : "dark");
		this.updateIcon();
	}

	private updateIcon(): void {
		const icon = document.getElementById(ThemeManager.ICON_ID);
		const isLight = document.body.classList.contains(
			ThemeManager.LIGHT_MODE_CLASS,
		);

		if (icon) {
			// Toggle between Moon and Sun icons using Remix Icons classes
			if (isLight) {
				icon.classList.remove("ri-moon-line");
				icon.classList.add("ri-sun-line");
			} else {
				icon.classList.remove("ri-sun-line");
				icon.classList.add("ri-moon-line");
			}
		}
	}

	private bindEvents(): void {
		const toggleBtn = document.getElementById(ThemeManager.TOGGLE_BTN_ID);
		if (toggleBtn) {
			toggleBtn.addEventListener("click", () => this.toggleTheme());
		}
	}
}

// Initialize on page load
new ThemeManager();

/**
 * Handles Statistics Counter Animation
 */
class StatsCounter {
	private statsSection: HTMLElement | null;
	private hasAnimated: boolean = false;

	constructor() {
		this.statsSection = document.getElementById("stats");
		if (this.statsSection) {
			this.init();
		}
	}

	private init(): void {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && !this.hasAnimated) {
						this.animateCounters();
						this.hasAnimated = true;
					}
				});
			},
			{ threshold: 0.5 },
		);

		observer.observe(this.statsSection!);
	}

	private animateCounters(): void {
		const counters = document.querySelectorAll(".stat-number");
		const duration = 2000; // 2 seconds

		counters.forEach((counter) => {
			const target = +counter.getAttribute("data-target")!;
			const increment = target / (duration / 16); // 60 FPS

			let current = 0;
			const updateCounter = () => {
				current += increment;
				if (current < target) {
					counter.textContent = this.formatNumber(Math.ceil(current));
					requestAnimationFrame(updateCounter);
				} else {
					counter.textContent = this.formatNumber(target) + "+";
				}
			};

			updateCounter();
		});
	}

	private formatNumber(num: number): string {
		if (num >= 1000000) {
			return (num / 1000000).toFixed(1) + "M";
		}
		if (num >= 1000) {
			return (num / 1000).toFixed(1) + "k";
		}
		return num.toString();
	}
}

new StatsCounter();

/**
 * Handles Live Demo Chat Animation
 */
class LiveDemoManager {
	private chatBody: HTMLElement | null;
	private statusText: HTMLElement | null;
	private messages: { text: string; isSent: boolean }[] = [
		{ text: "Chào cậu! Cuối tuần này rảnh không? 👋", isSent: false },
		{ text: "Chào Thảo! Tớ rảnh, có kèo gì hot à? 😎", isSent: true },
		{
			text: "Đi workshop vẽ tranh đi! Tớ mới tìm được chỗ này chill lắm.",
			isSent: false,
		},
		{ text: "Nghe thú vị đấy! Cho tớ xin info nhé.", isSent: true },
		{ text: "Đã gửi vị trí cho bạn 📍", isSent: false },
		{ text: "Tuyệt! Chốt 9h sáng chủ nhật nhé.", isSent: true },
		{ text: "Okela, hẹn gặp cậu ở đó! ❤️", isSent: false },
	];
	private currentIndex = 0;
	private isTyping = false;

	constructor() {
		this.chatBody = document.getElementById("demo-chat-body");
		this.statusText = document.getElementById("demo-status-text");
		if (this.chatBody) {
			this.init();
		}
	}

	private init() {
		// Initialize with first message immediately
		this.addMessage(this.messages[0]);
		this.currentIndex = 1;

		// Start loop
		this.scheduleNextStep();
	}

	private scheduleNextStep() {
		const nextMsg = this.messages[this.currentIndex];
		const delay = nextMsg.isSent ? 800 : 1200; // Faster delays

		setTimeout(() => {
			if (!nextMsg.isSent) {
				// Received message: Show typing indicator first
				this.showTyping();
				setTimeout(() => {
					this.hideTyping();
					this.addMessage(nextMsg);
					this.advanceIndex();
					this.scheduleNextStep();
				}, 1000); // Faster typing duration
			} else {
				// Sent message
				this.addMessage(nextMsg);
				this.advanceIndex();
				this.scheduleNextStep();
			}
		}, delay);
	}

	private advanceIndex() {
		this.currentIndex++;
		if (this.currentIndex >= this.messages.length) {
			this.currentIndex = 0;
			// Optional: clear chat after a pause to loop smoothly
			setTimeout(() => {
				if (this.chatBody) this.chatBody.innerHTML = "";
				this.addMessage(this.messages[0]);
				this.currentIndex = 1;
			}, 3000);
		}
	}

	private showTyping() {
		if (this.isTyping || !this.chatBody) return;
		this.isTyping = true;

		if (this.statusText) this.statusText.textContent = "Đang soạn tin...";

		const typingIndicator = document.createElement("div");
		typingIndicator.className = "demo-typing";
		typingIndicator.id = "demo-typing-indicator";
		typingIndicator.innerHTML = "<span></span><span></span><span></span>";
		typingIndicator.style.display = "flex";

		this.chatBody.appendChild(typingIndicator);
		this.scrollToBottom();
	}

	private hideTyping() {
		if (!this.isTyping) return;
		this.isTyping = false;

		if (this.statusText) this.statusText.textContent = "Đang hoạt động";

		const indicator = document.getElementById("demo-typing-indicator");
		if (indicator) indicator.remove();
	}

	private addMessage(msg: { text: string; isSent: boolean }) {
		if (!this.chatBody) return;

		const msgDiv = document.createElement("div");
		msgDiv.className = `demo-message ${msg.isSent ? "sent" : "received"}`;

		const time = new Date().toLocaleTimeString("vi-VN", {
			hour: "2-digit",
			minute: "2-digit",
		});

		let statusHtml = "";
		if (msg.isSent) {
			statusHtml = `<span class="demo-status"><i class="ri-check-double-line seen"></i></span>`;
		}

		msgDiv.innerHTML = `
			<div class="demo-bubble">${msg.text}</div>
			<div class="demo-meta">
				${statusHtml}
				<span class="demo-time">${time}</span>
			</div>
		`;

		this.chatBody.appendChild(msgDiv);
		this.scrollToBottom();
	}

	private scrollToBottom() {
		if (this.chatBody) {
			this.chatBody.scrollTop = this.chatBody.scrollHeight;
		}
	}
}

new LiveDemoManager();
