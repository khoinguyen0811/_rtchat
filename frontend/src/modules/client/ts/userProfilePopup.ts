import { authService } from "../../../services/authService";
import { friendService } from "../../../services/friendService";
import { chatService } from "../../../services/chatService";
import { chatStore } from "../../../store/chatStore";
import type { User, Conversation } from "../../../types/chat";
import { activateConversation } from "./chatRender";

let selectedUserForPopup: User | null = null;

export const showUserProfilePopup = async (userPreview: User) => {
	try {
		// Fetch full details
		const user = await authService.getUser(userPreview._id);
		selectedUserForPopup = user;

		const popup = document.getElementById("user-profile-popup");
		const overlay = document.getElementById("user-profile-overlay");
		const nameEl = document.getElementById("popup-user-name");
		const avatarContainer = document.getElementById("popup-avatar-container");
		const addFriendBtn = document.getElementById(
			"popup-add-friend-btn",
		) as HTMLButtonElement;
		const messageBtn = document.getElementById("popup-message-btn");

		if (!popup || !overlay) return;

		// Render Data
		if (nameEl) nameEl.textContent = user.displayName || user.username;

		if (avatarContainer) {
			let avatarHtml = "";
			if (user.avatarUrl && user.avatarUrl.trim() !== "") {
				avatarHtml = `<img src="${user.avatarUrl}" class="rounded-circle avatar-lg img-thumbnail" alt="">`;
			} else {
				const initial = (user.displayName || user.username || "?")
					.charAt(0)
					.toUpperCase();
				avatarHtml = `
                    <div class="avatar-lg img-thumbnail rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center mx-auto">
                        <span class="font-size-24">${initial}</span>
                    </div>
                `;
			}
			avatarContainer.innerHTML = avatarHtml;
		}

		// Reset Buttons
		if (addFriendBtn) {
			addFriendBtn.disabled = false;
			addFriendBtn.innerHTML = `<i class="ri-user-add-line me-1"></i> Add Friend`;
		}

		// Show
		popup.classList.remove("d-none");
		overlay.classList.remove("d-none");

		// Event Listeners
		const closeBtn = document.getElementById("popup-close-btn");
		const closePopup = () => {
			popup.classList.add("d-none");
			overlay.classList.add("d-none");
			selectedUserForPopup = null;
		};

		if (closeBtn) closeBtn.onclick = closePopup;
		overlay.onclick = closePopup;

		if (addFriendBtn) {
			addFriendBtn.onclick = async () => {
				try {
					await friendService.sendFriendRequest(user._id);
					addFriendBtn.innerHTML = `<i class="ri-check-line me-1"></i> Request Sent`;
					addFriendBtn.disabled = true;
				} catch (error) {
					// Toast handled in service
				}
			};
		}

		if (messageBtn) {
			messageBtn.onclick = async () => {
				const { conversations } = chatStore.getState();

				const existing = conversations.find(
					(c) =>
						c.type === "direct" &&
						c.participants.some((p) => p.userId._id === user._id),
				);

				if (existing) {
					activateConversation(existing);
					closePopup();
				} else {
					console.log("Create conversation with", user._id);
					try {
						const newConvo = await chatService.createConversation(user._id);
						if (newConvo) {
							// Update store
							await chatStore.getState().fetchConversations();
							// Activate
							activateConversation(newConvo as Conversation);
						}
					} catch (e) {
						console.error("Failed to create conversation", e);
					}
					closePopup();
				}
			};
		}
	} catch (error) {
		console.error("Failed to show popup", error);
	}
};
