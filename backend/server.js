import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import multer from "multer";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import {router as usersRoutes} from "./routes/users.js";

// Routes
import authRoutes from "./routes/auth.js";
import membersRoutes from "./routes/members.js";

dotenv.config();

// File paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/members", membersRoutes);
app.use("/api/users", usersRoutes);

// Multer file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "uploads")),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

app.post("/upload", upload.single("file"), (req, res) => {
  res.json({
    url: `http://localhost:${process.env.PORT || 5000}/uploads/${req.file.filename}`,
    type: req.body.type || "file",
  });
});

// Socket.IO logic
let roomMessages = {};
let roomUsers = {};
let userSockets = {};

io.on("connection", (socket) => {
  const { userId, username } = socket.handshake.auth;
  if (!userId || !username) return socket.disconnect();
  userSockets[userId] = socket.id;

  // Join room
  socket.on("joinRoom", ({ roomId }) => {
    socket.join(roomId);
    roomMessages[roomId] ||= [];
    roomUsers[roomId] ||= {};
    roomUsers[roomId][socket.id] = { userId, username, status: "online" };
    socket.emit("loadMessages", roomMessages[roomId]);
    io.to(roomId).emit("updateUsers", Object.values(roomUsers[roomId]));
  });

  // Send message
  socket.on("sendMessage", ({ roomId, message }) => {
    const newMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      content: message.content,
      user_id: userId,
      display_name: username,
      created_at: new Date().toISOString(),
      type: message.type || "text",
      is_pinned: false,
      reactions: [],
    };
    roomMessages[roomId].push(newMessage);
    io.to(roomId).emit("newMessage", newMessage);
  });

  // Disconnect
  socket.on("disconnect", () => {
    delete userSockets[userId];
    Object.keys(roomUsers).forEach((roomId) => {
      if (roomUsers[roomId][socket.id]) {
        delete roomUsers[roomId][socket.id];
        io.to(roomId).emit("updateUsers", Object.values(roomUsers[roomId]));
      }
    });
  });
});

// Start server
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  })
  .catch((err) => console.error(err));
