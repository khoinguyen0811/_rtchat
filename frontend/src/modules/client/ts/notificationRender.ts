import {
	notificationService,
	Notification,
} from "../../../services/notificationService";
import { getAvatarContent } from "./chatRender";

let notifications: Notification[] = [];
let unreadCount = 0;

export const renderNotifications = async () => {
	const container = document.getElementById("notification-list-container");
	if (!container) return; // Not on page

	// Handle SimpleBar if present
	const content = container.querySelector(".simplebar-content") || container;

	content.innerHTML =
		'<div class="text-center p-3"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';

	try {
		notifications = await notificationService.getNotifications();
		updateUnreadCount();
		renderList(content);
	} catch (e) {
		console.error("Failed to load notifications", e);
		content.innerHTML =
			'<div class="text-center p-3 text-danger">Failed to load notifications</div>';
	}
};

const renderList = (container: Element) => {
	container.innerHTML = "";

	if (notifications.length === 0) {
		container.innerHTML =
			'<div class="text-center p-3 text-muted">No notifications</div>';
		return;
	}

	const ul = document.createElement("ul");
	ul.className = "list-unstyled chat-list";

	notifications.forEach((notification) => {
		const li = document.createElement("li");
		li.className = notification.isRead ? "" : "unread";
		if (!notification.isRead)
			li.style.backgroundColor = "rgba(114, 105, 239, 0.05)"; // Light highlight

		const senderName =
			notification.sender?.displayName ||
			notification.sender?.username ||
			"System";
		const avatarHtml = notification.sender
			? getAvatarContent(notification.sender as any)
			: '<div class="avatar-xs"><span class="avatar-title rounded-circle bg-primary-subtle text-primary">S</span></div>';

		// Time diff
		const time = new Date(notification.createdAt).toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		});

		li.innerHTML = `
            <a href="javascript:void(0);" class="d-flex align-items-center p-2">
                <div class="chat-user-img me-3 ms-0">
                    ${avatarHtml}
                </div>
                <div class="flex-grow-1 overflow-hidden">
                    <h5 class="font-size-14 mb-1">${senderName}</h5>
                    <p class="chat-user-message text-truncate mb-0">${notification.content}</p>
                </div>
                <div class="font-size-11">${time}</div>
            </a>
        `;

		// Handle Click (Mark as read + potential action)
		li.addEventListener("click", async () => {
			if (!notification.isRead) {
				try {
					await notificationService.markAsRead(notification._id);
					notification.isRead = true;
					updateUnreadCount();
					li.classList.remove("unread");
					li.style.backgroundColor = "";
				} catch (e) {
					console.error("Failed to mark as read", e);
				}
			}

			// Action based on type
			if (notification.type === "friend_request" && notification.sender) {
				// Open Profile Popup
				const event = new CustomEvent("show-user-profile", {
					detail: notification.sender,
				});
				document.dispatchEvent(event);
			}
		});

		ul.appendChild(li);
	});

	container.appendChild(ul);
};

const updateUnreadCount = () => {
	unreadCount = notifications.filter((n) => !n.isRead).length;
	const badge = document.getElementById("notification-badge");
	if (badge) {
		if (unreadCount > 0) {
			badge.classList.remove("d-none");
			badge.textContent = unreadCount > 9 ? "9+" : unreadCount.toString();
		} else {
			badge.classList.add("d-none");
		}
	}
};

export const initNotificationListeners = () => {
	const tab = document.getElementById("pills-notifications-tab");
	if (tab) {
		tab.addEventListener("shown.bs.tab", () => {
			renderNotifications();
		});
	}

	const markAllBtn = document.getElementById("mark-all-read-btn");
	if (markAllBtn) {
		markAllBtn.addEventListener("click", async () => {
			try {
				await notificationService.markAllAsRead();
				notifications.forEach((n) => (n.isRead = true));
				updateUnreadCount();
				renderNotifications(); // Re-render to remove highlights
			} catch (e) {
				console.error("Failed to mark all read", e);
			}
		});
	}

	// Initial load (creates badge)
	notificationService
		.getNotifications()
		.then((data) => {
			notifications = data;
			updateUnreadCount();
		})
		.catch((err) => console.error(err));
};
