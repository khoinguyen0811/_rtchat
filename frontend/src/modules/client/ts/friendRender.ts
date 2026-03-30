import { friendService } from "../../../services/friendService";
import { getAvatarContent } from "./chatRender";
import { User } from "../../../types/chat";

let friends: User[] = [];
let pendingRequests: any[] = [];
let sentRequests: any[] = [];

export const initFriendListeners = () => {
	// Tab listeners
	const tabs = [
		{ id: "contacts-tab-friends", handler: renderFriendsList },
		{ id: "contacts-tab-requests", handler: renderFriendRequests },
		{ id: "contacts-tab-sent", handler: renderSentRequests },
	];

	tabs.forEach((tab) => {
		const element = document.getElementById(tab.id);
		if (element) {
			element.addEventListener("shown.bs.tab", () => {
				tab.handler();
			});
		}
	});

	// Initial fetch for badges
	updateRequestBadge();
};

export const renderFriendsList = async () => {
	const container = document.getElementById("contacts-list-container");
	if (!container) return;

	container.innerHTML =
		'<div class="text-center p-3"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';

	try {
		friends = await friendService.getFriends();
		container.innerHTML = "";

		if (friends.length === 0) {
			container.innerHTML =
				'<div class="text-center p-3 text-muted">No friends yet</div>';
			return;
		}

		// Group by alphabet (optional, but requested by design style)
		// For simplicity, just list them for now
		const ul = document.createElement("ul");
		ul.className = "list-unstyled contact-list";

		friends.forEach((friend) => {
			const li = document.createElement("li");
			const avatarHtml = getAvatarContent(friend);

			li.innerHTML = `
                <div class="d-flex align-items-center p-2">
                    <div class="chat-user-img me-3 ms-0">
                        ${avatarHtml}
                    </div>
                    <div class="flex-grow-1">
                        <h5 class="font-size-14 m-0">${friend.displayName || friend.username}</h5>
                    </div>
                    <div class="dropdown">
                        <a href="#" class="text-muted dropdown-toggle" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <i class="ri-more-2-fill"></i>
                        </a>
                        <div class="dropdown-menu dropdown-menu-end">
                            <a class="dropdown-item" href="#" onclick="alert('Not implemented')">Block <i class="ri-forbid-line float-end text-muted"></i></a>
                            <a class="dropdown-item" href="#">Remove <i class="ri-delete-bin-line float-end text-muted"></i></a>
                        </div>
                    </div>
                </div>
            `;
			// Add click listener to show profile popup
			li.querySelector(".chat-user-img")?.addEventListener("click", () => {
				const event = new CustomEvent("show-user-profile", {
					detail: friend,
				});
				document.dispatchEvent(event);
			});
			ul.appendChild(li);
		});
		container.appendChild(ul);
	} catch (e) {
		console.error("Failed to render friends", e);
		container.innerHTML =
			'<div class="text-center p-3 text-danger">Failed to load friends</div>';
	}
};

export const renderFriendRequests = async () => {
	const container = document.getElementById("contacts-requests-container");
	if (!container) return;

	container.innerHTML =
		'<div class="text-center p-3"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';

	try {
		pendingRequests = await friendService.getFriendRequests();
		updateRequestBadge(); // Update badge count
		container.innerHTML = "";

		if (pendingRequests.length === 0) {
			container.innerHTML =
				'<div class="text-center p-3 text-muted">No friend requests</div>';
			return;
		}

		const ul = document.createElement("ul");
		ul.className = "list-unstyled contact-list";

		pendingRequests.forEach((req) => {
			const sender = req.from;
			const li = document.createElement("li");
			const avatarHtml = getAvatarContent(sender);

			li.innerHTML = `
                <div class="d-flex align-items-center p-2">
                    <div class="chat-user-img me-3 ms-0">
                        ${avatarHtml}
                    </div>
                    <div class="flex-grow-1">
                        <h5 class="font-size-14 m-0">${sender.displayName || sender.username}</h5>
                    </div>
                    <div>
                        <button class="btn btn-primary btn-sm me-1 accept-btn"><i class="ri-check-line"></i></button>
                        <button class="btn btn-danger btn-sm reject-btn"><i class="ri-close-line"></i></button>
                    </div>
                </div>
            `;

			li.querySelector(".accept-btn")?.addEventListener("click", async () => {
				try {
					await friendService.acceptFriendRequest(req._id);
					li.remove();
					updateRequestBadge();
					// Optional: refresh friend list if visible
				} catch (e) {
					console.error("Failed to accept", e);
				}
			});

			li.querySelector(".reject-btn")?.addEventListener("click", async () => {
				try {
					// Assume we have a reject method in authService or friendService (add if missing)
					await friendService.rejectFriendRequest(req._id); // We might need to implement this wrapper
					li.remove();
					updateRequestBadge();
				} catch (e) {
					console.error("Failed to reject", e);
				}
			});

			ul.appendChild(li);
		});
		container.appendChild(ul);
	} catch (e) {
		console.error("Failed to render requests", e);
		container.innerHTML =
			'<div class="text-center p-3 text-danger">Failed to load requests</div>';
	}
};

export const renderSentRequests = async () => {
	const container = document.getElementById("contacts-sent-container");
	if (!container) return;

	container.innerHTML =
		'<div class="text-center p-3"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';

	try {
		sentRequests = await friendService.getSentRequests();
		container.innerHTML = "";

		if (sentRequests.length === 0) {
			container.innerHTML =
				'<div class="text-center p-3 text-muted">No sent requests</div>';
			return;
		}

		const ul = document.createElement("ul");
		ul.className = "list-unstyled contact-list";

		sentRequests.forEach((req) => {
			const recipient = req.to;
			const li = document.createElement("li");
			const avatarHtml = getAvatarContent(recipient);

			li.innerHTML = `
                <div class="d-flex align-items-center p-2">
                    <div class="chat-user-img me-3 ms-0">
                        ${avatarHtml}
                    </div>
                    <div class="flex-grow-1">
                        <h5 class="font-size-14 m-0">${recipient.displayName || recipient.username}</h5>
                        <small class="text-muted">Pending</small>
                    </div>
                     <div>
                        <button class="btn btn-outline-danger btn-sm cancel-btn">Cancel</button>
                    </div>
                </div>
            `;
			// Implement cancel logic if API exists
			ul.appendChild(li);
		});
		container.appendChild(ul);
	} catch (e) {
		console.error("Failed to render sent requests", e);
		container.innerHTML =
			'<div class="text-center p-3 text-danger">Failed to load sent requests</div>';
	}
};

const updateRequestBadge = async () => {
	try {
		// If we haven't fetched recently, fetch count. For now, rely on what we have if called from render, or fetch fresh
		const requests = await friendService.getFriendRequests();
		const count = requests.length;
		const badge = document.getElementById("contact-requests-badge");
		if (badge) {
			badge.textContent = count.toString();
			if (count > 0) badge.classList.remove("d-none");
			else badge.classList.add("d-none");
		}
	} catch (e) {
		console.error("Failed to update badge", e);
	}
};
