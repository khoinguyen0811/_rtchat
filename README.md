# 💬 Chatz — Real-Time Chat Application

A full-stack real-time chat application built with **Node.js + Socket.io** on the backend and **Vanilla TypeScript + Vite** on the frontend. Supports private messaging, group chats, friend system, and a full admin dashboard.

---

## ✨ Features

### 👤 Client
- 🔐 Authentication (Login / Register / Logout)
- 💬 Real-time private messaging via Socket.io
- 👥 Group chat creation and management
- 🤝 Friend request system (send, accept, reject)
- 🔔 Real-time notifications
- 😊 Emoji picker in chat
- 🖼️ Image upload via Cloudinary
- 👁️ Online/offline status indicator

### 🛡️ Admin
- 📊 Dashboard with statistics
- 👤 User management (view, ban, delete)
- 👥 Group management
- 🔒 Protected admin routes

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | - | Runtime environment |
| Express | ^5.2.1 | HTTP server & routing |
| MongoDB + Mongoose | ^9.0.2 | Database |
| Socket.io | ^4.8.3 | Real-time communication |
| JWT | ^9.0.3 | Authentication |
| Bcrypt | ^6.0.0 | Password hashing |
| Cloudinary | ^2.9.0 | Image storage |
| Multer | ^2.0.2 | File upload handling |
| Cookie-parser | ^1.4.7 | Cookie management |
| CORS | ^2.8.5 | Cross-origin requests |
| Dotenv | ^17.2.3 | Environment config |
| Nodemon | ^3.1.11 | Dev auto-reload |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| TypeScript | ^5.9.3 | Type-safe scripting |
| Vite | ^7.3.1 | Build tool & dev server |
| Socket.io-client | ^4.8.3 | Real-time client |
| Axios | ^1.13.2 | HTTP requests |
| Zustand | ^5.0.9 | State management |
| Zod | ^4.3.5 | Schema validation |
| Chart.js | ^4.5.1 | Admin dashboard charts |
| Emoji Picker Element | ^1.28.1 | Emoji support |
| Shoelace | ^2.20.1 | UI components |

---

## 📁 Project Structure

```
Chatz/
├── backend/
│   ├── src/
│   │   ├── controllers/         # Business logic
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── friendController.js
│   │   │   ├── messageController.js
│   │   │   ├── groupController.js
│   │   │   ├── notificationController.js
│   │   │   └── adminController.js
│   │   ├── models/              # MongoDB schemas
│   │   │   ├── User.js
│   │   │   ├── Conversation.js
│   │   │   ├── Message.js
│   │   │   ├── Friend.js
│   │   │   ├── FriendRequest.js
│   │   │   ├── Notification.js
│   │   │   └── Session.js
│   │   ├── routers/             # Express routes
│   │   │   ├── authRoute.js
│   │   │   ├── userRoute.js
│   │   │   ├── friendRoute.js
│   │   │   ├── messageRoute.js
│   │   │   ├── groupRoute.js
│   │   │   ├── notificationRoute.js
│   │   │   └── adminRoute.js
│   │   ├── middlewares/
│   │   │   └── authMiddleware.js
│   │   ├── libs/
│   │   │   ├── db.js            # MongoDB connection
│   │   │   ├── socket.js        # Socket.io init
│   │   │   ├── cloudinary.js    # Cloudinary config
│   │   │   └── uploadHelper.js  # Multer helper
│   │   └── server.js            # Entry point
│   ├── .env                     # Environment variables (không commit)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── client/
│   │   │   │   ├── home.html    # Main chat page
│   │   │   │   └── auth-login.html
│   │   │   └── admin/
│   │   │       ├── dashboard.html
│   │   │       ├── users.html
│   │   │       └── groups.html
│   │   ├── modules/             # Page-level TypeScript modules
│   │   ├── services/            # API call services
│   │   │   ├── authService.ts
│   │   │   ├── chatService.ts
│   │   │   ├── friendService.ts
│   │   │   ├── groupService.ts
│   │   │   ├── notificationService.ts
│   │   │   ├── adminService.ts
│   │   │   ├── socketService.ts
│   │   │   └── toast.ts
│   │   ├── store/               # Zustand state stores
│   │   ├── assets/              # CSS & static files
│   │   ├── helper/              # Utility functions
│   │   ├── lib/                 # Shared libraries
│   │   └── types/               # TypeScript type definitions
│   ├── tsconfig.json
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 18.x
- **MongoDB** (local hoặc MongoDB Atlas)
- **Cloudinary** account (để upload ảnh)

---

### 1. Clone repository

```bash
git clone https://github.com/khoinguyen0811/_rtchat.git
cd _rtchat
```

---

### 2. Cấu hình Backend

```bash
cd backend
npm install
```

Tạo file `.env` trong thư mục `backend/`:

```env
PORT=5001
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/chatz
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Chạy server backend:

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

> Backend chạy tại: `http://localhost:5001`

---

### 3. Cấu hình Frontend

```bash
cd frontend
npm install
```

Chạy dev server:

```bash
npm run dev
```

Build production:

```bash
npm run build
```

> Frontend chạy tại: `http://localhost:5173`

---

## 🔌 API Endpoints

### 🔓 Public Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Đăng ký tài khoản |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/logout` | Đăng xuất |

### 🔒 Protected Routes (yêu cầu đăng nhập)

#### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Lấy danh sách người dùng |
| GET | `/api/users/:id` | Lấy thông tin user |
| PUT | `/api/users/profile` | Cập nhật profile |

#### Friends
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/friends` | Danh sách bạn bè |
| POST | `/api/friends/request` | Gửi lời mời kết bạn |
| PUT | `/api/friends/accept/:id` | Chấp nhận lời mời |
| DELETE | `/api/friends/reject/:id` | Từ chối lời mời |

#### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/:conversationId` | Lấy tin nhắn |
| POST | `/api/messages` | Gửi tin nhắn |
| DELETE | `/api/messages/:id` | Xóa tin nhắn |

#### Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/groups` | Danh sách nhóm |
| POST | `/api/groups` | Tạo nhóm mới |
| PUT | `/api/groups/:id` | Cập nhật nhóm |
| DELETE | `/api/groups/:id` | Xóa nhóm |

#### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Lấy thông báo |

#### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | Quản lý tất cả users |
| GET | `/api/admin/groups` | Quản lý tất cả groups |
| GET | `/api/admin/stats` | Thống kê hệ thống |

---

## ⚡ Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `sendMessage` | Client → Server | Gửi tin nhắn mới |
| `newMessage` | Server → Client | Nhận tin nhắn mới |
| `sendFriendRequest` | Client → Server | Gửi lời mời kết bạn |
| `friendRequestReceived` | Server → Client | Nhận lời mời kết bạn |
| `userOnline` | Server → Client | User online |
| `userOffline` | Server → Client | User offline |

---

## 📸 Screenshots

>

---

## 👨‍💻 Author

**Khoi Nguyen**
- GitHub: [@khoinguyen0811](https://github.com/khoinguyen0811)

---

## 📄 License

This project is licensed under the **ISC License**.
