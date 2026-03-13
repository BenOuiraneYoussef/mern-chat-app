# 💬 MERN Chat App

A real-time chat application built with the MERN stack and Socket.io.

## Features

- 🔐 JWT Authentication (register & login)
- 💬 Real-time messaging with Socket.io
- 🏠 Multiple chat rooms
- ✍️ Typing indicators
- 🟢 Online/offline presence tracking
- 📜 Paginated message history
- 🔒 Protected routes

## Tech Stack

**Frontend**
- React 18
- React Router DOM v6
- Socket.io Client
- Axios
- Vite

**Backend**
- Node.js
- Express
- MongoDB + Mongoose
- Socket.io
- JWT (jsonwebtoken)
- bcryptjs

## Project Structure
```
chat-app/
├── server/         # Express + Socket.io backend
│   ├── src/
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # REST API routes
│   │   ├── middleware/   # JWT auth middleware
│   │   ├── socket.js     # Socket.io event handlers
│   │   └── index.js      # Entry point
│   └── .env              # Environment variables
│
└── client/         # React frontend
    └── src/
        ├── context/      # Auth & Socket context
        ├── pages/        # Login & Chat pages
        ├── components/   # UI components
        ├── hooks/        # Custom hooks
        └── utils/        # Axios instance
```

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB installed and running

### Installation

1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/mern-chat-app.git
cd mern-chat-app
```

2. Install server dependencies
```bash
cd server
npm install
```

3. Install client dependencies
```bash
cd ../client
npm install
```

4. Create the environment file
```bash
# inside server/
cp .env.example .env
```

Fill in your values:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/chatapp
JWT_SECRET=your_secret_key_here
CLIENT_URL=http://localhost:5173
```

5. Run the app

In one terminal:
```bash
cd server
npm run dev
```

In another terminal:
```bash
cd client
npm run dev
```

6. Open `http://localhost:5173` in your browser

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port the server runs on |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `CLIENT_URL` | Frontend URL for CORS |

## License

MIT
