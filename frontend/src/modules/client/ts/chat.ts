import { chatStore } from "../../../store/chatStore";
import { authStore } from "../../../store/authStore";
import { authService } from "../../../services/authService";
import { initNotificationListeners } from "./notificationRender";
import { chatService } from "../../../services/chatService";
import type { Conversation, User } from "../../../types/chat";
import "emoji-picker-element"; // Import emoji picker web component
import {
	renderMainChats,
	renderPendingChats,
	createMessageItem,
	renderGroupList,
	handleGroupSearch,
} from "./chatRender";
import { initFriendListeners, renderFriendsList } from "./friendRender";
import { groupService } from "../../../services/groupService";
import { friendService } from "../../../services/friendService";

const setupGroupListeners = () => {
	const createGroupBtn = document.getElementById("btn-create-group");
	const addMemberBtn = document.getElementById("btn-add-member"); // In Modal
	const createGroupModal = document.getElementById("addgroup-exampleModal");
	const addMemberModal = document.getElementById("addmember-modal");

	// Generic function to render friends with checkboxes
	const renderFriendSelection = async (
		containerId: string,
		excludedIds: string[] = [],
	) => {
		const container = document.getElementById(containerId);
		if (!container) return;

		container.innerHTML =
			'<li class="text-center"><div class="spinner-border text-primary spinner-border-sm" role="status"></div></li>';

		try {
			const friends = (await friendService.getFriends()) as User[];
			container.innerHTML = "";

			const filteredFriends = friends.filter(
				(f) => !excludedIds.includes(f._id),
			);

			if (filteredFriends.length === 0) {
				container.innerHTML =
					'<li class="text-muted text-center p-2">No friends available to add.</li>';
				return;
			}

			// Sort alphabetical
			filteredFriends.sort((a, b) =>
				(a.displayName || a.username).localeCompare(
					b.displayName || b.username,
				),
			);

			// Group by letter
			const groups: Record<string, User[]> = {};
			filteredFriends.forEach((friend) => {
				const name = friend.displayName || friend.username;
				const letter = name.charAt(0).toUpperCase();
				if (!groups[letter]) groups[letter] = [];
				groups[letter].push(friend);
			});

			Object.keys(groups)
				.sort()
				.forEach((letter) => {
					const letterDiv = document.createElement("div");
					letterDiv.innerHTML = `<div class="p-3 fw-bold text-primary">${letter}</div>`;
					container.appendChild(letterDiv);

					groups[letter].forEach((friend) => {
						const li = document.createElement("li");
						const name = friend.displayName || friend.username;
						const id = friend._id;

						li.innerHTML = `
                        <div class="form-check">
                            <input type="checkbox" class="form-check-input group-member-checkbox" id="memberCheck-${containerId}-${id}" value="${id}">
                            <label class="form-check-label" for="memberCheck-${containerId}-${id}">${name}</label>
                        </div>
                     `;
						container.appendChild(li);
					});
				});
		} catch (error) {
			console.error("Failed to load friends for selection", error);
			container.innerHTML =
				'<li class="text-danger text-center">Failed to load friends.</li>';
		}
	};

	// Create Group Modal Show
	createGroupModal?.addEventListener("show.bs.modal", () => {
		const nameInput = document.getElementById(
			"addgroupname-input",
		) as HTMLInputElement;
		if (nameInput) nameInput.value = "";
		renderFriendSelection("group-friends-list");
	});

	// Create Group Submit
	createGroupBtn?.addEventListener("click", async () => {
		const nameInput = document.getElementById(
			"addgroupname-input",
		) as HTMLInputElement;
		const name = nameInput?.value.trim();
		const memberCheckboxes = document.querySelectorAll(
			"#group-friends-list .group-member-checkbox:checked",
		);
		const members = Array.from(memberCheckboxes).map((cb: any) => cb.value);

		if (!name) {
			alert("Please enter a group name");
			return;
		}

		if (members.length === 0) {
			alert("Please select at least one member");
			return;
		}

		try {
			await groupService.createGroup(name, members);

			// Close modal manually (bootstrap 5 vanilla)
			// @ts-ignore
			const modalInstance = bootstrap.Modal.getInstance(createGroupModal);
			modalInstance?.hide();

			// Refresh conversations is handled by socket or we trigger generic refresh
			chatStore.getState().fetchConversations();
		} catch (error) {
			console.error("Failed to create group", error);
			alert("Failed to create group");
		}
	});

	// Add Member Modal Show
	addMemberModal?.addEventListener("show.bs.modal", () => {
		const { activeConversation } = chatStore.getState();
		if (!activeConversation) return;

		// Get existing participant IDs to exclude
		// Note: participant.userId is populated object usually
		const existingIds = activeConversation.participants.map(
			(p: any) => p.userId._id || p.userId,
		);

		renderFriendSelection("add-member-list", existingIds);
	});

	// Add Member Submit
	addMemberBtn?.addEventListener("click", async () => {
		const { activeConversation } = chatStore.getState();
		if (!activeConversation) return;

		const memberCheckboxes = document.querySelectorAll(
			"#add-member-list .group-member-checkbox:checked",
		);
		const members = Array.from(memberCheckboxes).map((cb: any) => cb.value);

		if (members.length === 0) {
			alert("Please select at least one friend to add");
			return;
		}

		try {
			await groupService.addMembers(activeConversation._id, members);
			// Close modal
			// @ts-ignore
			const modalInstance = bootstrap.Modal.getInstance(addMemberModal);
			modalInstance?.hide();

			// No need to refresh everything, but socket should handle updating conversation details
			// For now, explicit fetch to update internal state immediately
			chatStore.getState().fetchConversations();
		} catch (error) {
			console.error("Failed to add members", error);
			alert("Failed to add members");
		}
	});
};

const renderUserProfile = async () => {
	try {
		const user = await authService.getMe();
		if (!user) return;

		// 1. Side Menu Avatar (Mini)
		const sideMenuContainer = document.getElementById(
			"side-menu-avatar-container",
		);
		if (sideMenuContainer) {
			let content = "";
			if (user.avatarUrl && user.avatarUrl.trim() !== "") {
				content = `<img src="${user.avatarUrl}" alt="" class="profile-user rounded-circle">`;
			} else {
				const initial = (user.displayName || user.username || "?")
					.charAt(0)
					.toUpperCase();
				content = `
                    <div class="avatar-xs profile-user rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center">
                        <span class="avatar-title">${initial}</span>
                    </div>
                 `;
			}
			sideMenuContainer.innerHTML = content;
		}

		// 2. Settings Tab Profile
		const settingName = document.getElementById("setting-profile-name");
		const settingAvatarContainer = document.getElementById(
			"setting-profile-avatar-container",
		);

		if (settingName)
			settingName.textContent = user.displayName || user.username;

		if (settingAvatarContainer) {
			let content = "";
			if (user.avatarUrl && user.avatarUrl.trim() !== "") {
				content = `<img src="${user.avatarUrl}" class="rounded-circle avatar-lg img-thumbnail" alt="">`;
			} else {
				const initial = (user.displayName || user.username || "?")
					.charAt(0)
					.toUpperCase();
				content = `
                    <div class="avatar-lg img-thumbnail rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center mx-auto">
                        <span class="font-size-24">${initial}</span>
                    </div>
                 `;
			}
			content += `
                <button type="button" class="btn btn-light bg-light avatar-xs p-0 rounded-circle profile-photo-edit" id="profile-photo-edit-btn">
                    <i class="ri-pencil-fill"></i>
                </button>
             `;
			settingAvatarContainer.innerHTML = content;
		}

		// Re-attach event listener for avatar edit button (dynamic)
		const avatarEditBtn = document.getElementById("profile-photo-edit-btn");
		const avatarInput = document.getElementById(
			"profile-avatar-input",
		) as HTMLInputElement;

		if (avatarEditBtn && avatarInput) {
			avatarEditBtn.onclick = () => {
				avatarInput.click();
			};
		}

		// 3. Profile Tab (#pills-user)
		const profileName = document.getElementById("profile-user-name");
		const profileAboutName = document.getElementById("profile-about-name");
		const profileAboutEmail = document.getElementById("profile-about-email");
		const profileAvatarContainer = document.getElementById(
			"profile-user-avatar-container",
		);

		const displayName = user.displayName || user.username;

		if (profileName) profileName.textContent = displayName;
		if (profileAboutName) profileAboutName.textContent = displayName;
		if (profileAboutEmail) profileAboutEmail.textContent = user.email || "";

		if (profileAvatarContainer) {
			let content = "";
			if (user.avatarUrl && user.avatarUrl.trim() !== "") {
				content = `<img src="${user.avatarUrl}" class="rounded-circle avatar-lg img-thumbnail" alt="">`;
			} else {
				const initial = (displayName || "?").charAt(0).toUpperCase();
				content = `
                    <div class="avatar-lg img-thumbnail rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center mx-auto">
                        <span class="font-size-24">${initial}</span>
                    </div>
                 `;
			}
			profileAvatarContainer.innerHTML = content;
		}

		// 4. Personal Info Tab (Settings -> Personal Info)
		const personalInfoName = document.getElementById("personal-info-name");
		const personalInfoEmail = document.getElementById("personal-info-email");
		const personalInfoEditBtn = document.getElementById(
			"personal-info-edit-btn",
		);

		if (personalInfoName) personalInfoName.textContent = displayName;
		if (personalInfoEmail) personalInfoEmail.textContent = user.email || "";

		if (personalInfoEditBtn) {
			// Cloning to remove old event listeners
			const newBtn = personalInfoEditBtn.cloneNode(true);
			personalInfoEditBtn.parentNode?.replaceChild(newBtn, personalInfoEditBtn);

			newBtn.addEventListener("click", () => {
				const currentName = personalInfoName?.textContent || "";
				const newName = prompt("Enter new display name:", currentName);
				if (newName && newName !== currentName) {
					authService
						.updateDisplayName(newName)
						.then(() => {
							renderUserProfile(); // Refresh UI
						})
						.catch((err) => console.error(err));
				}
			});
		}
	} catch (error) {
		console.error("Failed to render user profile", error);
	}
};

const setupAvatarListener = () => {
	const avatarInput = document.getElementById(
		"profile-avatar-input",
	) as HTMLInputElement;
	if (avatarInput) {
		avatarInput.addEventListener("change", async (e) => {
			const files = (e.target as HTMLInputElement).files;
			if (files && files.length > 0) {
				try {
					await authService.updateAvatar(files[0]);
					// Refresh UI to show new avatar
					await renderUserProfile();
				} catch (error) {
					console.error("Failed to upload avatar", error);
				} finally {
					// Reset input value so same file can be selected again if needed
					avatarInput.value = "";
				}
			}
		});
	}
};

const setupSearchListener = () => {
	const searchInput = document.getElementById(
		"user-search-input",
	) as HTMLInputElement;
	const searchResultsContainer = document.getElementById("user-search-results");
	const searchResultsList = searchResultsContainer?.querySelector("ul");

	if (searchInput && searchResultsContainer && searchResultsList) {
		let timeout: any = null;

		// Import getAvatarContent at the top if not already, or use full path.
		// Actually, I can't easily add import if I don't see top of file.
		// But I viewed the file and imports are there.
		// import { getAvatarContent } from "./chatRender"; is NOT imported in original file.
		// I need to add it to imports first or just inline the fix efficiently.
		// Let's check imports in chat.ts again.
		// Line 8-12: imports from ./chatRender. getAvatarContent is NOT there.
		// I should add it to imports first.

		// START_REPLACEMENT

		searchInput.addEventListener("input", (e) => {
			const query = (e.target as HTMLInputElement).value;
			console.log("Search query input:", query);

			if (timeout) clearTimeout(timeout);

			timeout = setTimeout(async () => {
				if (!query.trim()) {
					searchResultsContainer.classList.add("d-none");
					return;
				}

				const users = await authService.searchUsers(query);
				console.log("Search results:", users);

				// Show container
				searchResultsContainer.classList.remove("d-none");
				searchResultsList.innerHTML = "";

				if (users.length === 0) {
					searchResultsList.innerHTML = `<li class="text-center p-3">No users found</li>`;
					return;
				}

				users.forEach((u: User) => {
					// Use consistent avatar logic
					let avatarHtml = "";
					if (u.avatarUrl && u.avatarUrl.trim() !== "") {
						avatarHtml = `<img src="${u.avatarUrl}" class="rounded-circle avatar-xs" alt="">`;
					} else {
						const name = u.displayName || u.username || "?";
						const initial = name.charAt(0).toUpperCase();
						avatarHtml = `
                                <div class="avatar-xs">
                                    <span class="avatar-title rounded-circle bg-primary-subtle text-primary">
                                        ${initial}
                                    </span>
                                </div>
                            `;
					}

					const li = document.createElement("li");
					li.innerHTML = `
                            <a href="javascript:void(0);">
                                <div class="d-flex align-items-center">                            
                                    <div class="chat-user-img me-3 ms-0">
                                        ${avatarHtml}
                                    </div>
                                    <div class="flex-grow-1 overflow-hidden">
                                        <h5 class="text-truncate font-size-15 mb-1">${u.displayName || u.username}</h5>
                                    </div>
                                </div>
                            </a>
                        `;

					li.querySelector("a")?.addEventListener("click", () => {
						console.log("Clicked user", u._id);
						showUserProfilePopup(u);
					});
					searchResultsList.appendChild(li);
				});
			}, 500); // 500ms debounce
		});

		// Hide results on blur with delay for click
		searchInput.addEventListener("blur", () => {
			setTimeout(() => {
				searchResultsContainer.classList.add("d-none");
			}, 200);
		});

		// Show again on focus if text exists
		searchInput.addEventListener("focus", () => {
			if (searchInput.value.trim()) {
				searchResultsContainer.classList.remove("d-none");
			}
		});
	}
};

const setupChatInputListener = () => {
	const chatInput = document.getElementById("chat-input") as HTMLInputElement;
	const sendBtn = document.getElementById("chat-send-btn");
	const attachBtn = document.getElementById("chat-attach-btn");
	const fileInput = document.getElementById(
		"chat-file-input",
	) as HTMLInputElement;
	const emojiBtn = document.getElementById("chat-emoji-btn");
	const emojiWrapper = document.getElementById("emoji-picker-wrapper");

	// Define handleSend FIRST to ensure it's available for all listeners
	const handleSend = async () => {
		const content = chatInput?.value.trim() || "";
		// Check both content and file
		const file =
			fileInput?.files && fileInput.files.length > 0
				? fileInput.files[0]
				: null;

		if (!content && !file) return;

		const { activeConversation } = chatStore.getState();
		const { user } = authStore.getState();
		if (!activeConversation || !user) return;

		try {
			// Prepare data
			let data: any;
			if (file) {
				const formData = new FormData();
				formData.append("conversationId", activeConversation._id);
				formData.append("file", file);
				if (content) formData.append("content", content);
				data = formData;
			} else {
				data = {
					conversationId: activeConversation._id,
					content: content,
					type: "text",
				};
			}

			// Call API
			const newMessage = await chatService.sendMessage(data);

			// Patch sender info for UI rendering
			const messageForUI = {
				...newMessage,
				senderId: {
					_id: user._id,
					username: user.username,
					displayName: user.displayName,
					avatarUrl: user.avatarUrl,
				},
			};

			// Append to UI immediately
			const chatList = document.getElementById("chat-conversation-list");
			if (chatList) {
				const firstChild = chatList.firstElementChild;
				if (
					chatList.children.length === 1 &&
					firstChild?.textContent?.includes("No messages yet")
				) {
					chatList.innerHTML = "";
				}

				const messageItem = createMessageItem(messageForUI);
				chatList.appendChild(messageItem);

				// Scroll to bottom
				const chatContainer =
					document.querySelector(
						"#chat-conversation .simplebar-content-wrapper",
					) || document.getElementById("chat-conversation");
				if (chatContainer) {
					chatContainer.scrollTop = chatContainer.scrollHeight;
				}
			}

			// Clear inputs
			if (chatInput) chatInput.value = "";
			if (fileInput) fileInput.value = "";

			// Update Sidebar
			await chatStore.getState().fetchConversations();
			renderMainChats();
		} catch (error) {
			console.error("Failed to send message", error);
			alert("Failed to send message");
		}
	};

	// Attach button click -> triggers file input
	if (attachBtn && fileInput) {
		attachBtn.addEventListener("click", () => {
			fileInput.click();
		});

		// Listen for file selection
		fileInput.addEventListener("change", () => {
			if (fileInput.files && fileInput.files.length > 0) {
				handleSend();
			}
		});
	}

	// Emoji Picker Toggle
	// Emoji Picker Toggle
	if (emojiBtn && emojiWrapper) {
		emojiBtn.addEventListener("click", (e) => {
			e.preventDefault();
			emojiWrapper.classList.toggle("d-none");
		});

		// Close picker if clicking outside
		document.addEventListener("click", (e) => {
			if (
				!emojiWrapper.contains(e.target as Node) &&
				!emojiBtn.contains(e.target as Node)
			) {
				if (!emojiWrapper.classList.contains("d-none")) {
					emojiWrapper.classList.add("d-none");
				}
			}
		});

		// Emoji Selection
		const picker = emojiWrapper.querySelector("emoji-picker");
		if (picker) {
			picker.addEventListener("emoji-click", (e: any) => {
				const emoji = e.detail.unicode;
				if (chatInput) {
					chatInput.value += emoji;
					chatInput.focus();
				}
			});
		}
	}

	if (sendBtn) {
		sendBtn.addEventListener("click", (e) => {
			e.preventDefault();
			handleSend();
		});
	}

	if (chatInput) {
		chatInput.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				handleSend();
			}
		});
	}
};

import { showUserProfilePopup } from "./userProfilePopup";

import { socketService } from "../../../services/socketService"; // Import

// ... existing code

// Initialization
export const initChat = async () => {
	// Connect Socket
	socketService.connect();

	// Listen for socket messages
	document.addEventListener("socket:newMessage", (e: any) => {
		const message = e.detail;
		console.log("New message received via socket:", message);

		const { user } = authStore.getState();
		const senderId =
			typeof message.senderId === "object"
				? message.senderId._id
				: message.senderId;
		if (user && senderId === user._id) {
			console.log("Ignoring socket message from self (already rendered)");
			return;
		}

		// 1. If this message belongs to the active conversation, append it
		const { activeConversation } = chatStore.getState();
		if (
			activeConversation &&
			activeConversation._id === message.conversationId
		) {
			const chatList = document.getElementById("chat-conversation-list");
			if (chatList) {
				// If it was "No messages yet", clear it
				const firstChild = chatList.firstElementChild;
				if (
					chatList.children.length === 1 &&
					firstChild?.textContent?.includes("No messages yet")
				) {
					chatList.innerHTML = "";
				}
				const messageItem = createMessageItem(message);
				chatList.appendChild(messageItem);

				// Scroll
				const chatContainer =
					document.querySelector(
						"#chat-conversation .simplebar-content-wrapper",
					) || document.getElementById("chat-conversation");
				if (chatContainer) {
					chatContainer.scrollTop = chatContainer.scrollHeight;
				}
			}
		}

		// 2. Refresh conversation lists to update "last message" snippet and unread counts
		chatStore.getState().fetchConversations();
		chatStore.getState().fetchPendingConversations();

		// Re-render chat list (optional optimization: only update the relevant item)
		renderMainChats();
		renderPendingChats();
	});

	setupAvatarListener();
	setupSearchListener();
	// ... rest of initChat
	setupChatInputListener();
	setupGroupListeners();

	// Initial fetch
	await Promise.all([
		chatStore.getState().fetchConversations(),
		chatStore.getState().fetchPendingConversations(),
		renderUserProfile(),
		renderFriendsList(),
		renderGroupList(),
	]);

	initNotificationListeners(); // Initialize notifications
	initFriendListeners(); // Initialize friend tabs

	// Initial render
	renderMainChats();
	renderPendingChats();

	// Group Search listener
	const groupSearchInput = document.getElementById(
		"group-search-input",
	) as HTMLInputElement;
	if (groupSearchInput) {
		groupSearchInput.addEventListener("input", (e) => {
			const query = (e.target as HTMLInputElement).value;
			handleGroupSearch(query);
		});
	}

	// Subscribe to specific store updates? Or just simple render for now.
	chatStore.subscribe(() => {
		// Optimally check diff, but for now re-render
		renderMainChats();
		renderPendingChats();
	});

	// Tab switching listeners
	document
		.getElementById("chat-tab-pending")
		?.addEventListener("shown.bs.tab", () => {
			chatStore.getState().fetchPendingConversations();
		});

	document
		.getElementById("chat-tab-main")
		?.addEventListener("shown.bs.tab", () => {
			chatStore.getState().fetchConversations();
		});

	document
		.getElementById("pills-contacts-tab")
		?.addEventListener("shown.bs.tab", () => {
			renderFriendsList();
		});

	// Listen for profile popup requests from other modules
	document.addEventListener("show-user-profile", (e: any) => {
		if (e.detail) {
			showUserProfilePopup(e.detail);
		}
	});
};
