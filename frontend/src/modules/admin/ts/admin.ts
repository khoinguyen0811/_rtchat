import { adminService } from "../../../services/adminService";
import { authService } from "../../../services/authService";
import { tokenStorage } from "../../../helper/token";
import Chart from "chart.js/auto";

// Redirect if not logged in or not admin (basic check, verified by API)
if (!tokenStorage.get()) {
	window.location.href = "../client/auth.html";
}

let userGrowthChart: Chart | null = null;
let messageActivityChart: Chart | null = null;
let userStatusChart: Chart | null = null;
let groupTrendChart: Chart | null = null;

const formatDate = (date: string | Date) => {
	return new Date(date).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
};

const processTimeSeriesData = (
	data: any[],
	dateField: string = "createdAt",
	days: number = 7,
) => {
	const counts: { [key: string]: number } = {};
	const labels: string[] = [];
	const values: number[] = [];

	// Initialize last 'days' days with 0
	for (let i = days - 1; i >= 0; i--) {
		const d = new Date();
		d.setDate(d.getDate() - i);
		const label = formatDate(d);
		counts[label] = 0;
		if (!labels.includes(label)) labels.push(label);
	}

	data.forEach((item) => {
		const itemDate = new Date(item[dateField]);
		const label = formatDate(itemDate);
		if (counts[label] !== undefined) {
			counts[label]++;
		}
	});

	labels.forEach((label) => values.push(counts[label]));

	return { labels, values };
};

const processGrowthData = (data: any[], dateField: string = "createdAt") => {
	// Sort by date
	const sorted = [...data].sort(
		(a, b) =>
			new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime(),
	);

	const labels: string[] = [];
	const values: number[] = [];
	let runningTotal = 0;

	// Group by month for entire history, or day if recent
	// Let's do cumulative growth by day for the last 14 days for a nice curve
	const daysToShow = 14;
	const today = new Date();

	// First calculate total prior to the window
	const startDate = new Date();
	startDate.setDate(today.getDate() - daysToShow);

	runningTotal = sorted.filter(
		(item) => new Date(item[dateField]) < startDate,
	).length;

	for (let i = daysToShow; i >= 0; i--) {
		const d = new Date();
		d.setDate(d.getDate() - i);
		const dateStr = formatDate(d);

		// Count items strictly on this day
		const dayCount = sorted.filter(
			(item) => formatDate(item[dateField]) === dateStr,
		).length;
		runningTotal += dayCount;

		labels.push(dateStr);
		values.push(runningTotal);
	}

	return { labels, values };
};

const renderCharts = (users: any[], groups: any[], messages: any[]) => {
	// 1. User Growth (Line)
	const userGrowth = processGrowthData(users);
	const ctxUserGrowth = document.getElementById(
		"userGrowthChart",
	) as HTMLCanvasElement;
	if (ctxUserGrowth) {
		if (userGrowthChart) userGrowthChart.destroy();
		userGrowthChart = new Chart(ctxUserGrowth, {
			type: "line",
			data: {
				labels: userGrowth.labels,
				datasets: [
					{
						label: "Total Users",
						data: userGrowth.values,
						borderColor: "#7269ef",
						backgroundColor: "rgba(114, 105, 239, 0.1)",
						tension: 0.4,
						fill: true,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: { legend: { display: false } },
				scales: {
					y: { beginAtZero: true, grid: { display: false } },
					x: { grid: { display: false } },
				},
			},
		});
	}

	// 2. User Status (Doughnut)
	const activeUsers = users.filter((u: any) => !u.isBanned).length;
	const bannedUsers = users.filter((u: any) => u.isBanned).length;

	const ctxUserStatus = document.getElementById(
		"userStatusChart",
	) as HTMLCanvasElement;
	if (ctxUserStatus) {
		if (userStatusChart) userStatusChart.destroy();
		userStatusChart = new Chart(ctxUserStatus, {
			type: "doughnut",
			data: {
				labels: ["Active", "Banned"],
				datasets: [
					{
						data: [activeUsers, bannedUsers],
						backgroundColor: ["#06d6a0", "#ef476f"],
						borderWidth: 0,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				cutout: "70%",
				plugins: { legend: { position: "bottom" } },
			},
		});
	}

	// 3. Message Activity (Bar)
	const msgActivity = processTimeSeriesData(messages, "createdAt", 7);
	const ctxMsg = document.getElementById(
		"messageActivityChart",
	) as HTMLCanvasElement;
	if (ctxMsg) {
		if (messageActivityChart) messageActivityChart.destroy();
		messageActivityChart = new Chart(ctxMsg, {
			type: "bar",
			data: {
				labels: msgActivity.labels,
				datasets: [
					{
						label: "Messages",
						data: msgActivity.values,
						backgroundColor: "#ffd166",
						borderRadius: 4,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: { legend: { display: false } },
				scales: { y: { beginAtZero: true } },
			},
		});
	}

	// 4. Group Trend (Line area)
	const groupTrend = processGrowthData(
		groups.map((g: any) => ({ createdAt: g.createdAt })),
		"createdAt",
	); // groups structure might differ
	const ctxGroup = document.getElementById(
		"groupTrendChart",
	) as HTMLCanvasElement;
	if (ctxGroup) {
		if (groupTrendChart) groupTrendChart.destroy();
		groupTrendChart = new Chart(ctxGroup, {
			type: "line",
			data: {
				labels: groupTrend.labels,
				datasets: [
					{
						label: "Groups Created",
						data: groupTrend.values,
						borderColor: "#06d6a0",
						backgroundColor: "rgba(6, 214, 160, 0.1)",
						tension: 0.4,
						fill: true,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: { legend: { display: false } },
				scales: {
					y: { beginAtZero: true, grid: { display: false } },
					x: { grid: { display: false } },
				},
			},
		});
	}
};

const renderStats = async () => {
	try {
		// Fetch all data for accurate charts
		// This is heavier but needed for standalone charts without backend aggregation endpoints
		const [users, groups, messages] = await Promise.all([
			adminService.getAllUsers(),
			adminService.getAllGroups(),
			adminService.getAllMessages(),
		]);

		// Update Text Stats
		const userEl = document.getElementById("stat-users");
		const groupEl = document.getElementById("stat-groups");
		const msgEl = document.getElementById("stat-messages");
		const dateEl = document.getElementById("current-date");

		if (userEl) userEl.textContent = users.length.toString();
		if (groupEl) groupEl.textContent = groups.length.toString(); // groups returns array of conversation objects
		if (msgEl) msgEl.textContent = messages.length.toString();
		if (dateEl)
			dateEl.textContent = new Date().toLocaleDateString("en-US", {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
			});

		// Render Charts
		renderCharts(
			users,
			groups.map((g: any) => ({ ...g, createdAt: g.createdAt || new Date() })),
			messages,
		);
	} catch (e) {
		console.error("Failed to load stats", e);
	}
};

const renderUsers = async () => {
	const tbody = document.getElementById("users-table-body");
	if (!tbody) return;
	tbody.innerHTML =
		'<tr><td colspan="6" class="text-center">Loading...</td></tr>';

	try {
		const users = await adminService.getAllUsers();
		tbody.innerHTML = "";

		users.forEach((user: any) => {
			const tr = document.createElement("tr");

			const isBanned = user.isBanned;

			// Role Selector
			const roleSelect = `
				<select class="form-select form-select-sm role-select" data-id="${user._id}" style="width: auto; min-width: 100px;">
					<option value="user" ${user.role === "user" ? "selected" : ""}>User</option>
					<option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
				</select>
			`;

			const statusBadge = isBanned
				? '<span class="badge bg-danger">Banned</span>'
				: '<span class="badge bg-success">Active</span>';

			const avatarHtml = user.avatarUrl
				? `<img src="${user.avatarUrl}" alt="" class="rounded-circle avatar-xs">`
				: `<div class="avatar-xs">
						<span style="background-color: #7269ef4a;" class="avatar-title rounded-circle bg-soft-primary text-primary font-size-16">
							${user.username.charAt(0).toUpperCase()}
						</span>
					</div>`;

			tr.innerHTML = `
                <td class="ps-4">
                    <div class="d-flex align-items-center">
                        <div class="me-3">
                            ${avatarHtml}
                        </div>
                        <div>
                            <h5 class="font-size-14 mb-1 text-dark">${user.username}</h5>
                            <p class="text-muted font-size-13 mb-0">${user.displayName || "No display name"}</p>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>${roleSelect}</td>
                <td>${statusBadge}</td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                    ${
											user.role !== "admin"
												? `
                        <button class="btn btn-sm btn-outline-warning btn-ban me-1" data-id="${user._id}">
                            ${isBanned ? "Unban" : "Ban"}
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${user._id}">Delete</button>
                    `
												: ""
										}
                </td>
            `;

			// Action Listeners
			const roleDropdown = tr.querySelector(".role-select");
			roleDropdown?.addEventListener("change", async (e) => {
				const target = e.target as HTMLSelectElement;
				const newRole = target.value as "user" | "admin";

				if (confirm(`Change role of ${user.username} to ${newRole}?`)) {
					try {
						await adminService.updateUserRole(user._id, newRole);
						// Reload to reflect side effects (like hiding delete button for admin)
						renderUsers();
					} catch (error) {
						alert("Failed to update role");
						target.value = user.role; // Revert on error
					}
				} else {
					target.value = user.role; // Revert if cancelled
				}
			});

			tr.querySelector(".btn-ban")?.addEventListener("click", async () => {
				if (
					confirm(
						`Are you sure you want to ${isBanned ? "unban" : "ban"} this user?`,
					)
				) {
					await adminService.banUser(user._id);
					renderUsers(); // Refresh
				}
			});

			tr.querySelector(".btn-delete")?.addEventListener("click", async () => {
				if (confirm("Are you sure? This cannot be undone.")) {
					await adminService.deleteUser(user._id);
					renderUsers();
				}
			});

			tbody.appendChild(tr);
		});
	} catch (e) {
		console.error("Failed to load users", e);
		tbody.innerHTML =
			'<tr><td colspan="6" class="text-center text-danger">Failed to load users</td></tr>';
	}
};

const renderGroups = async () => {
	const tbody = document.getElementById("groups-table-body");
	if (!tbody) return;
	tbody.innerHTML =
		'<tr><td colspan="5" class="text-center">Loading...</td></tr>';

	try {
		const groups = await adminService.getAllGroups();
		tbody.innerHTML = "";

		groups.forEach((conv: any) => {
			const tr = document.createElement("tr");
			const groupInfo = conv.group[0];
			const memberCount = conv.participants.length;

			tr.innerHTML = `
                <td>
                    <h5 class="font-size-14 mb-0">${groupInfo.name}</h5>
                </td>
                <td>${groupInfo.createdBy?.username || "Unknown"}</td>
                <td>
                    <button class="btn btn-sm btn-link view-members" data-id="${conv._id}" data-json='${JSON.stringify(conv.participants).replace(/'/g, "&apos;")}'>
                        ${memberCount} Members
                    </button>
                </td>
                <td>${new Date(conv.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger btn-delete-group" data-id="${conv._id}">Delete</button>
                </td>
            `;

			// View Members & Manage
			tr.querySelector(".view-members")?.addEventListener("click", (e) => {
				const target = e.currentTarget as HTMLElement;
				// const participants = JSON.parse(target.dataset.json || "[]");
				// Instead of passing JSON, better to fetch latest or just render what we have.
				// For simplicity, we use what we have in 'conv.participants'
				renderGroupMembers(conv._id, conv.participants);
			});

			tr.querySelector(".btn-delete-group")?.addEventListener(
				"click",
				async () => {
					if (confirm("Delete this group?")) {
						await adminService.deleteGroup(conv._id);
						renderGroups();
						renderStats(); // Update counts
					}
				},
			);

			tbody.appendChild(tr);
		});
	} catch (e) {
		console.error("Failed to load groups", e);
	}
};

const renderGroupMembers = (groupId: string, participants: any[]) => {
	const list = document.getElementById("group-members-list");
	if (!list) return;

	list.innerHTML = "";
	participants.forEach((p: any) => {
		const li = document.createElement("li");
		li.className =
			"list-group-item d-flex justify-content-between align-items-center";

		// Sometimes participant population might be complex, verify structure
		// From getGroups population: "participants.userId"
		const user = p.userId || {}; // if populated

		// If user is just an ID string (not populated correctly), handle it
		const username =
			typeof user === "object" ? user.username || "Unknown" : "UserID: " + user;

		li.innerHTML = `
            <span>${username}</span>
            <button class="btn btn-sm btn-danger btn-remove-member" data-uid="${user._id || user}">Remove</button>
        `;

		li.querySelector(".btn-remove-member")?.addEventListener(
			"click",
			async () => {
				if (confirm(`Remove ${username} from group?`)) {
					await adminService.removeGroupMember(groupId, user._id || user);
					// Remove from UI immediately
					li.remove();
					// Refresh groups table to update count
					renderGroups();
				}
			},
		);

		list.appendChild(li);
	});

	const modalEl = document.getElementById("groupMembersModal");
	if (modalEl) {
		// Simple bootstrap modal show via JS
		// @ts-ignore
		const modal = new bootstrap.Modal(modalEl);
		modal.show();
	}
};

const renderMessages = async () => {
	const tbody = document.getElementById("messages-table-body");
	if (!tbody) return;
	tbody.innerHTML =
		'<tr><td colspan="5" class="text-center">Loading...</td></tr>';

	try {
		const messages = await adminService.getAllMessages();
		tbody.innerHTML = "";

		messages.forEach((msg: any) => {
			const tr = document.createElement("tr");

			const sender = msg.senderId?.username || "Unknown";
			const content =
				msg.content || (msg.fileUrl ? `[File] ${msg.fileType}` : "[Empty]");
			const type = msg.conversationId?.type || "direct";

			tr.innerHTML = `
                <td>${sender}</td>
                <td class="text-truncate" style="max-width: 200px;">${content}</td>
                <td><span class="badge ${type === "group" ? "bg-info" : "bg-secondary"}">${type}</span></td>
                <td>${new Date(msg.createdAt).toLocaleString()}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger btn-delete-msg" data-id="${msg._id}">Delete</button>
                </td>
            `;

			tr.querySelector(".btn-delete-msg")?.addEventListener(
				"click",
				async () => {
					if (confirm("Delete this message?")) {
						await adminService.deleteMessage(msg._id);
						tr.remove(); // Remove locally
						renderStats(); // Update counts
					}
				},
			);

			tbody.appendChild(tr);
		});
	} catch (e) {
		console.error("Failed to load messages", e);
	}
};

// Initialization
document.addEventListener("DOMContentLoaded", async () => {
	// Initial Load
	await renderStats();

	// Sidebar Navigation
	const navLinks = document.querySelectorAll(
		".admin-sidebar .nav-link[data-target]",
	);
	const tabs = document.querySelectorAll(".content-tab");

	navLinks.forEach((link) => {
		link.addEventListener("click", (e) => {
			e.preventDefault();
			const targetId = (link as HTMLElement).dataset.target;

			// Update Active Link
			navLinks.forEach((l) => l.classList.remove("active"));
			link.classList.add("active");

			// Show Tab
			tabs.forEach((tab) => tab.classList.add("d-none"));
			document.getElementById(`tab-${targetId}`)?.classList.remove("d-none");

			// Load Data based on Tab
			if (targetId === "users") renderUsers();
			if (targetId === "groups") renderGroups();
			if (targetId === "messages") renderMessages();
			if (targetId === "dashboard") renderStats();
		});
	});

	// Logout
	document.getElementById("admin-logout-btn")?.addEventListener("click", () => {
		authService.signOut();
		window.location.href = "../client/auth.html";
	});
});
