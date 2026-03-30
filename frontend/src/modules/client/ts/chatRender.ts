import { chatStore } from "../../../store/chatStore";
import { authStore } from "../../../store/authStore";
import { chatService } from "../../../services/chatService";
import type { Conversation, User } from "../../../types/chat";
import { friendService } from "../../../services/friendService";
import { groupService } from "../../../services/groupService";

declare var bootstrap: any;

// Selectors
const chatListContainer = document.getElementById("chat-list-container");
const pendingListContainer = document.getElementById("pending-list-container");

// Helper to get other participant
export const getOtherParticipant = (
	conversation: Conversation,
	currentUserId: string,
): User | null => {
	const p = conversation.participants.find(
		(p) => p.userId._id !== currentUserId,
	);
	return p ? p.userId : null;
};

// Helper for Avatar
export const getAvatarContent = (user: User | null | undefined) => {
	if (!user) return "";

	// Check if avatarUrl is valid (basic check)
	if (
		user.avatarUrl &&
		typeof user.avatarUrl === "string" &&
		user.avatarUrl.trim() !== ""
	) {
		return `<img src="${user.avatarUrl}" class="rounded-circle avatar-xs" alt="">`;
	}

	// Fallback to initials
	const name = user.displayName || user.username || "?";
	const initial = name.charAt(0).toUpperCase();

	return `
        <div class="avatar-xs">
            <span class="avatar-title rounded-circle bg-primary-subtle text-primary">
                ${initial}
            </span>
        </div>
    `;
};

export const updateChatHeader = (
	conversation: Conversation,
	currentUserId: string,
) => {
	const nameEl = document.getElementById("chat-header-name");
	const statusEl = document.getElementById("chat-header-status");
	const avatarEl = document.getElementById("chat-header-avatar");
	const addMemberBtnContainer = document.getElementById(
		"chat-add-member-container",
	);

	let name = "Unknown";
	let avatar = "";
	let isGroup = conversation.type === "group";

	if (isGroup && conversation.group && conversation.group.length > 0) {
		const groupInfo = conversation.group[0];
		name = groupInfo.name;
		avatar =
			"https://ui-avatars.com/api/?name=" +
			encodeURIComponent(name) +
			"&background=random";

		// Show/Hide Add Member Button
		if (addMemberBtnContainer) {
			const createdById =
				typeof groupInfo.createdBy === "object"
					? (groupInfo.createdBy as any)._id
					: groupInfo.createdBy;

			if (createdById === currentUserId) {
				addMemberBtnContainer.classList.remove("d-none");
			} else {
				addMemberBtnContainer.classList.add("d-none");
			}
		}
	} else {
		const otherUser = getOtherParticipant(conversation, currentUserId);
		name = otherUser?.displayName || otherUser?.username || "Unknown";
		avatar = otherUser?.avatarUrl || "https://via.placeholder.com/150";

		if (avatar === "https://via.placeholder.com/150") {
			const initial = name.charAt(0).toUpperCase();
			avatar = `<div class="avatar-xs">
                    <span class="avatar-title rounded-circle bg-primary-subtle text-primary">
                        ${initial}
                    </span>
                </div>`; // Note: Logic below handles string vs html
		}

		if (addMemberBtnContainer) {
			addMemberBtnContainer.classList.add("d-none");
		}
	}

	if (nameEl) {
		nameEl.textContent = name;
	}

	if (statusEl) {
		if (isGroup) {
			statusEl.className = ""; // No status dot for group
			statusEl.textContent = "";
		} else {
			statusEl.className = `ri-record-circle-fill font-size-10 text-success d-inline-block ms-1`;
		}
	}

	if (avatarEl) {
		let avatarHtml = "";
		if (avatar.trim().startsWith("<div")) {
			avatarHtml = avatar;
		} else {
			avatarHtml = `<img src="${avatar}" class="rounded-circle avatar-xs" alt="">`;
		}
		avatarEl.innerHTML = avatarHtml;
	}
};

export const createMessageItem = (msg: any) => {
	const { user } = authStore.getState();
	const sender = msg.senderId || {};
	const senderId = sender._id || sender;
	const isMe = senderId === user?._id;

	const li = document.createElement("li");
	if (isMe) {
		li.classList.add("right");
	}

	const time = new Date(msg.createdAt).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});
	const username = sender.username || "Unknown";

	let avatarHtml = "";
	if (sender.avatarUrl) {
		avatarHtml = `<img src="${sender.avatarUrl}" alt="">`;
	} else {
		const initial = (username.charAt(0) || "?").toUpperCase();
		avatarHtml = `<div class="avatar-xs"><span class="avatar-title rounded-circle bg-primary-subtle text-primary">${initial}</span></div>`;
	}

	let contentHtml = "";
	// Priority: fileUrl -> imgUrl -> content
	// But content can exist WITH fileUrl (caption).

	// 1. File Rendering
	let fileHtml = "";
	if (msg.fileUrl) {
		if (msg.fileType === "video") {
			fileHtml = `
                <div class="message-img mb-2">
                    <video src="${msg.fileUrl}" controls class="rounded w-100" style="max-width: 300px;"></video>
                </div>
            `;
		} else if (msg.fileType === "image" || msg.imgUrl) {
			// 'image' covers gif usually if backend sets it so.
			// msg.imgUrl is legacy fallback
			fileHtml = `
                <div class="message-img mb-2">
                    <a href="${msg.fileUrl}" class="popup-img d-inline-block m-1">
                        <img src="${msg.fileUrl}" alt="" class="rounded border w-100" style="max-width: 250px;">
                    </a>
                </div>
            `;
		} else {
			// Generic file (fallback)
			fileHtml = `
                <div class="card p-2 mb-2">
                    <div class="d-flex align-items-center">
                        <div class="avatar-sm me-3 ms-0">
                            <div class="avatar-title bg-primary-subtle text-primary rounded font-size-20">
                                <i class="ri-file-text-fill"></i>
                            </div>
                        </div>
                        <div class="flex-grow-1">
                            <div class="text-start">
                                <h5 class="font-size-14 mb-1 text-truncate"><a href="${msg.fileUrl}" target="_blank" class="text-reset">Attachment</a></h5>
                                <p class="text-muted font-size-13 mb-0">Click to download</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
		}
	} else if (msg.imgUrl) {
		// Legacy support just in case
		fileHtml = `
                <div class="message-img mb-2">
                    <a href="${msg.imgUrl}" class="popup-img d-inline-block m-1">
                        <img src="${msg.imgUrl}" alt="" class="rounded border w-100" style="max-width: 250px;">
                    </a>
                </div>
            `;
	}

	// 2. Text Content
	if (msg.content) {
		contentHtml = `<p class="mb-0">${msg.content}</p>`;
	}

	// Admin Badge logic
	let adminBadge = "";
	const { activeConversation } = chatStore.getState();
	if (
		activeConversation &&
		activeConversation.type === "group" &&
		activeConversation.group &&
		activeConversation.group.length > 0
	) {
		const creatorId =
			typeof activeConversation.group[0].createdBy === "object"
				? (activeConversation.group[0].createdBy as any)._id
				: activeConversation.group[0].createdBy;

		if (senderId === creatorId) {
			adminBadge = `<span class="badge badge-soft-warning font-size-10 ms-1" style="vertical-align: middle;">Admin</span>`;
		}
	}

	li.innerHTML = `
		<div class="conversation-list">
			<div class="chat-avatar">
				${avatarHtml}
			</div>

			<div class="user-chat-content">
				<div class="ctext-wrap">
					<div class="ctext-wrap-content">
                        ${fileHtml}
						${contentHtml}
						<p class="chat-time mb-0"><i class="ri-time-line align-middle"></i> <span class="align-middle">${time}</span></p>
					</div>
					<div class="dropdown align-self-start">
						<a class="dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
							<i class="ri-more-2-fill"></i>
						</a>
						<div class="dropdown-menu">
							<a class="dropdown-item" href="#">Copy <i class="ri-file-copy-line float-end text-muted"></i></a>
							<a class="dropdown-item delete-message-btn" href="#" data-id="${msg._id}">Delete <i class="ri-delete-bin-line float-end text-muted"></i></a>
						</div>
					</div>
				</div>
				<div class="conversation-name">${isMe ? "You" : username} ${adminBadge}</div>
			</div>
		</div>
	`;

	// Bind Delete Event
	const deleteBtn = li.querySelector(".delete-message-btn");
	if (deleteBtn) {
		if (isMe) {
			deleteBtn.addEventListener("click", (e) => {
				e.preventDefault();
				// Instead of confirm(), show the modal
				const deleteModalEl = document.getElementById("delete-message-modal");
				if (deleteModalEl) {
					const confirmBtn = document.getElementById(
						"confirm-delete-message-btn",
					);
					if (confirmBtn) {
						const newConfirmBtn = confirmBtn.cloneNode(true) as HTMLElement;
						confirmBtn.parentNode?.replaceChild(newConfirmBtn, confirmBtn);

						newConfirmBtn.addEventListener("click", async () => {
							try {
								await chatService.deleteMessage(msg._id);
								li.remove(); // Optimistic removal

								// Hide modal
								const modalInstance =
									bootstrap.Modal.getInstance(deleteModalEl) ||
									new bootstrap.Modal(deleteModalEl);
								modalInstance.hide();
							} catch (error) {
								console.error("Failed to delete message", error);
								// You might want to use a toast here instead of alert, but for now fallback to alert or nothing
								alert("Failed to delete message");
							}
						});
					}

					// Show the modal
					const modal = new bootstrap.Modal(deleteModalEl);
					modal.show();
				} else {
					// Fallback if modal is missing (should verify during dev)
					if (confirm("Are you sure you want to delete this message?")) {
						chatService.deleteMessage(msg._id).then(() => li.remove());
					}
				}
			});
		} else {
			deleteBtn.remove(); // Remove delete option for others' messages
		}
	}

	return li;
};

export const loadMessages = async (
	conversationId: string,
	conversation: Conversation,
) => {
	const chatList = document.getElementById("chat-conversation-list");
	if (!chatList) return;

	// Only show loader if empty? Or simple logic for now.
	// If checking state might vary.
	chatList.innerHTML = `<li class="text-center p-3"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></li>`;

	try {
		const messages = await chatService.getMessages(conversationId);
		chatList.innerHTML = "";

		if (messages.length === 0) {
			chatList.innerHTML = `<li class="text-center p-3 text-muted">No messages yet. Say hi!</li>`;
			return;
		}

		messages.forEach((msg: any) => {
			chatList.appendChild(createMessageItem(msg));
		});

		const chatContainer =
			document.querySelector("#chat-conversation .simplebar-content-wrapper") ||
			document.getElementById("chat-conversation");
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	} catch (error) {
		console.error("Failed to load messages", error);
		chatList.innerHTML = `<li class="text-center p-3 text-danger">Failed to load messages</li>`;
	}
};

export const activateConversation = (conversation: Conversation) => {
	const { user } = authStore.getState();
	if (!user) return;

	chatStore.getState().setActiveConversation(conversation);

	const allItems = document.querySelectorAll(".chat-list li");
	allItems.forEach((el) => {
		el.classList.remove("active");
	});

	const activeLi = document.querySelector(
		`.chat-list li[data-id='${conversation._id}']`,
	);
	if (activeLi) {
		activeLi.classList.add("active");
	}

	// Existing activateConversation logic
	updateChatHeader(conversation, user._id);
	loadMessages(conversation._id, conversation);

	const otherUser = getOtherParticipant(conversation, user._id);
	if (otherUser) {
		renderUserProfileSidebar(otherUser);
	}
};

export const renderUserProfileSidebar = (user: User) => {
	const avatarEl = document.getElementById(
		"user-profile-sidebar-avatar",
	) as HTMLImageElement;
	const nameEl = document.getElementById("user-profile-sidebar-name");
	const statusContainerEl = document.getElementById(
		"user-profile-sidebar-status-container",
	);
	const aboutNameEl = document.getElementById(
		"user-profile-sidebar-about-name",
	);
	const aboutEmailEl = document.getElementById(
		"user-profile-sidebar-about-email",
	);

	// Update Avatar
	if (avatarEl) {
		if (user.avatarUrl && user.avatarUrl.trim() !== "") {
			avatarEl.src = user.avatarUrl;
		} else {
			avatarEl.src =
				"https://via.placeholder.com/150?text=" +
				(user.username?.charAt(0).toUpperCase() || "U");
		}
	}

	// Update Name
	if (nameEl) {
		nameEl.textContent = user.displayName || user.username || "Unknown";
	}

	// Update Status (Mock for now as we don't have real-time status props readily available in User type yet usually)
	if (statusContainerEl) {
		// Example: <i class="ri-record-circle-fill font-size-10 text-success me-1 ms-0"></i> Active
		statusContainerEl.innerHTML = `<i class="ri-record-circle-fill font-size-10 text-success me-1 ms-0"></i> Active`;
	}

	// Update About Section
	if (aboutNameEl) {
		aboutNameEl.textContent = user.displayName || user.username || "";
	}

	if (aboutEmailEl) {
		aboutEmailEl.textContent = user.email || "No email hidden";
	}
};

export const createConversationItem = (
	conversation: Conversation,
	currentUserId: string,
) => {
	const { activeConversation } = chatStore.getState();
	const isActive = activeConversation?._id === conversation._id;
	const lastMessage = conversation.lastMessage
		? conversation.lastMessage.content
		: "No messages yet";
	const time = conversation.lastMessageAt
		? new Date(conversation.lastMessageAt).toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
			})
		: "";

	let name = "";
	let avatarHtml = "";
	const isGroup = conversation.type === "group";

	if (isGroup && conversation.group && conversation.group.length > 0) {
		name = conversation.group[0].name;
		const groupAvatarUrl =
			"https://ui-avatars.com/api/?name=" +
			encodeURIComponent(name) +
			"&background=random";
		avatarHtml = `<img src="${groupAvatarUrl}" class="rounded-circle avatar-xs" alt="">`;
	} else {
		const otherParticipant = conversation.participants.find(
			(p: any) => p.userId._id !== currentUserId,
		);
		const user = otherParticipant ? otherParticipant.userId : null;
		if (user) {
			name = user.displayName || user.username;
			avatarHtml = getAvatarContent(user);
		} else {
			name = "Unknown User";
			avatarHtml = `<div class="avatar-xs"><span class="avatar-title rounded-circle bg-primary-subtle text-primary">?</span></div>`;
		}
	}

	const unreadCount = conversation.unReadCount?.[currentUserId] || 0;
	const unreadBadge =
		unreadCount > 0
			? `<div class="unread-message-count">${unreadCount}</div>`
			: "";

	// Determine if the other user is online (mock for now)
	const isOnline = !isGroup && Math.random() > 0.5; // Placeholder for actual online status

	const li = document.createElement("li");
	li.id = `conversation-${conversation._id}`;
	li.setAttribute("data-id", conversation._id);
	if (isActive) li.classList.add("active");

	li.innerHTML = `
        <a href="javascript: void(0);">
            <div class="d-flex">
                <div class="chat-user-img ${isOnline ? "online" : ""} align-self-center me-3 ms-0">
                    ${avatarHtml}
                    ${!isGroup ? '<span class="user-status"></span>' : ""}
                </div>
                <div class="flex-grow-1 overflow-hidden">
                    <h5 class="text-truncate font-size-15 mb-1">${name}</h5>
                    <p class="chat-user-message text-truncate mb-0">${lastMessage}</p>
                </div>
                <div class="font-size-11">${time}</div>
                ${unreadBadge}
            </div>
        </a>
    `;

	li.querySelector("a")?.addEventListener("click", () => {
		activateConversation(conversation);
	});

	return li;
};

// Render Functions
export const renderMainChats = () => {
	const container = document.getElementById("chat-list-container");
	if (!container) return;
	const { conversations, activeConversation } = chatStore.getState();
	const { user } = authStore.getState();
	if (!user) return;

	container.innerHTML = "";
	conversations.forEach((convo) => {
		container.appendChild(createConversationItem(convo, user._id));
	});

	if (conversations.length > 0) {
		if (!activeConversation) {
			activateConversation(conversations[0]);
		}
	}
};

export const renderPendingChats = () => {
	const container = document.getElementById("pending-list-container");
	if (!container) return;
	const { pendingConversations } = chatStore.getState();
	const { user } = authStore.getState();
	if (!user) return;

	container.innerHTML = "";
	pendingConversations.forEach((convo) => {
		container.appendChild(createConversationItem(convo, user._id));
	});
};

export const renderFriendsList = async () => {
	const container = document.querySelector(
		"#pills-contacts .chat-message-list",
	);
	if (!container) return;

	// Handle SimpleBar structure if present
	const contentContainer =
		container.querySelector(".simplebar-content") || container;

	// Show loading
	contentContainer.innerHTML =
		'<div class="text-center p-3"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';

	try {
		const friends = (await friendService.getFriends()) as User[];
		contentContainer.innerHTML = "";

		if (friends.length === 0) {
			contentContainer.innerHTML =
				'<div class="text-center p-3 text-muted">No friends yet. Add some!</div>';
			return;
		}

		// Sort friends
		friends.sort((a: User, b: User) => {
			const nameA = (a.displayName || a.username).toUpperCase();
			const nameB = (b.displayName || b.username).toUpperCase();
			if (nameA < nameB) return -1;
			if (nameA > nameB) return 1;
			return 0;
		});

		// Group by letter
		const groups: Record<string, User[]> = {};
		friends.forEach((friend: User) => {
			const name = friend.displayName || friend.username;
			const letter = name.charAt(0).toUpperCase();
			if (!groups[letter]) groups[letter] = [];
			groups[letter].push(friend);
		});

		// Render groups
		Object.keys(groups)
			.sort()
			.forEach((letter) => {
				const groupDiv = document.createElement("div");
				if (Object.keys(groups).indexOf(letter) > 0)
					groupDiv.classList.add("mt-3");

				const header = document.createElement("div");
				header.className = "p-3 fw-bold text-primary";
				header.textContent = letter;
				groupDiv.appendChild(header);

				const ul = document.createElement("ul");
				ul.className = "list-unstyled contact-list";

				groups[letter].forEach((friend) => {
					const li = document.createElement("li");
					const name = friend.displayName || friend.username;
					const avatarHtml = getAvatarContent(friend);

					li.innerHTML = `
                        <div class="d-flex align-items-center">
                            <div class="chat-user-img me-3 ms-0">
                                ${avatarHtml}
                            </div>
                            <div class="flex-grow-1">
                                <h5 class="font-size-14 m-0">${name}</h5>
                            </div>
                            <div class="dropdown">
                                <a href="#" class="text-muted dropdown-toggle" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <i class="ri-more-2-fill"></i>
                                </a>
                                <div class="dropdown-menu dropdown-menu-end">
                                    <a class="dropdown-item user-profile-link" href="javascript:void(0);">Profile <i class="ri-user-line float-end text-muted"></i></a>
                                    <a class="dropdown-item" href="#">Share <i class="ri-share-line float-end text-muted"></i></a>
                                    <a class="dropdown-item" href="#">Block <i class="ri-forbid-line float-end text-muted"></i></a>
                                    <a class="dropdown-item" href="#">Remove <i class="ri-delete-bin-line float-end text-muted"></i></a>
                                </div>
                            </div>
                        </div>
                    `;

					const profileLink = li.querySelector(".user-profile-link");
					if (profileLink) {
						profileLink.addEventListener("click", () => {
							const event = new CustomEvent("show-user-profile", {
								detail: friend,
							});
							document.dispatchEvent(event);
						});
					}

					// Allow clicking the row (excluding dropdown)
					const row = li.querySelector(".d-flex");
					if (row) {
						row.addEventListener("click", (e) => {
							if ((e.target as HTMLElement).closest(".dropdown")) return;
							const event = new CustomEvent("show-user-profile", {
								detail: friend,
							});
							document.dispatchEvent(event);
						});
					}

					ul.appendChild(li);
				});

				groupDiv.appendChild(ul);
				contentContainer.appendChild(groupDiv);
			});
	} catch (e) {
		console.error("Failed to render friends", e);
		contentContainer.innerHTML =
			'<div class="text-center p-3 text-danger">Failed to load friends</div>';
	}
};

export const renderGroupList = async () => {
	const container = document.getElementById("group-list-container");
	if (!container) return; // Should exist in html

	// Show spinner
	container.innerHTML =
		'<li class="text-center p-3"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></li>';

	try {
		const groups = (await groupService.getGroups()) as Conversation[];
		container.innerHTML = "";

		// Add class to identify local items
		if (groups.length === 0) {
			container.innerHTML =
				'<li class="text-center p-3 text-muted local-empty-msg">No groups yet. Create one!</li>';
			return;
		}

		groups.forEach((group) => {
			const { user } = authStore.getState();
			if (!user) return;
			const li = createConversationItem(group, user._id);
			li.classList.add("local-group-item");
			container.appendChild(li);
		});
	} catch (e) {
		console.error("Failed to render groups", e);
		container.innerHTML =
			'<li class="text-center p-3 text-danger">Failed to load groups</li>';
	}
};

// Debounce helper
const debounce = (func: Function, wait: number) => {
	let timeout: any;
	return (...args: any[]) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
};

export const handleGroupSearch = debounce(async (query: string) => {
	const container = document.getElementById("group-list-container");
	if (!container) return;

	query = query.toLowerCase().trim();

	// 1. Filter Local Groups
	const localItems = container.querySelectorAll(".local-group-item");
	let hasLocalMatch = false;
	localItems.forEach((item: any) => {
		const name =
			item.querySelector(".text-truncate")?.textContent?.toLowerCase() || "";
		if (name.includes(query) || query === "") {
			item.classList.remove("d-none");
			hasLocalMatch = true;
		} else {
			item.classList.add("d-none");
		}
	});

	// Hide/Show "No groups yet" message if strictly local filter
	const emptyMsg = container.querySelector(".local-empty-msg");
	if (emptyMsg) {
		if (query === "") (emptyMsg as HTMLElement).classList.remove("d-none");
		else (emptyMsg as HTMLElement).classList.add("d-none");
	}

	// Remove existing global results
	const existingGlobals = container.querySelectorAll(".global-search-result");
	existingGlobals.forEach((el) => el.remove());

	if (query.length < 2) return; // Only global search for > 1 chars

	// 2. Fetch Global Groups
	// Show temporary loader for global
	const loaderId = "global-search-loader";
	if (!document.getElementById(loaderId)) {
		const loader = document.createElement("li");
		loader.id = loaderId;
		loader.className = "text-center p-2 global-search-result";
		loader.innerHTML =
			'<div class="spinner-border spinner-border-sm text-primary" role="status"></div>';
		container.appendChild(loader);
	}

	try {
		const globalGroups = await groupService.searchGroups(query);
		const loader = document.getElementById(loaderId);
		if (loader) loader.remove();

		if (globalGroups.length > 0) {
			// Divider
			const divider = document.createElement("li");
			divider.className =
				"p-2 bg-light font-weight-bold text-muted small global-search-result";
			divider.textContent = "Global Results";
			container.appendChild(divider);

			globalGroups.forEach((group: any) => {
				const li = document.createElement("li");
				li.className = "global-search-result";

				const groupName = group.group[0]?.name || "Unknown Group";
				const creatorName = group.group[0]?.createdBy?.displayName || "Unknown";
				const avatar =
					"https://ui-avatars.com/api/?name=" +
					encodeURIComponent(groupName) +
					"&background=random";

				li.innerHTML = `
                    <div class="d-flex align-items-center p-2">
                        <div class="chat-user-img me-3 ms-0">
                            <img src="${avatar}" class="rounded-circle avatar-xs" alt="">
                        </div>
                        <div class="flex-grow-1 overflow-hidden">
                            <h5 class="text-truncate font-size-14 mb-0">${groupName}</h5>
                            <p class="text-muted font-size-12 mb-0">Created by ${creatorName}</p>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-primary btn-join-group">Join</button>
                        </div>
                    </div>
                `;

				// Handle Join
				const joinBtn = li.querySelector(".btn-join-group");
				joinBtn?.addEventListener("click", async (e) => {
					const btn = e.target as HTMLButtonElement;
					btn.disabled = true;
					btn.textContent = "Sending...";
					try {
						await groupService.joinGroup(group._id);
						btn.textContent = "Sent";
						btn.classList.remove("btn-primary");
						btn.classList.add("btn-success");
						// ToastService.success("Request sent!"); // Use toast if available
					} catch (err) {
						console.error(err);
						btn.disabled = false;
						btn.textContent = "Join";
						// ToastService.error("Failed to send request");
					}
				});

				container.appendChild(li);
			});
		} else if (!hasLocalMatch) {
			const noResult = document.createElement("li");
			noResult.className = "text-center p-3 text-muted global-search-result";
			noResult.textContent = "No groups found.";
			container.appendChild(noResult);
		}
	} catch (err) {
		console.error("Global search failed", err);
		const loader = document.getElementById(loaderId);
		if (loader) loader.remove();
	}
}, 500);
