import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import multer from "multer";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Routes
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import membersRoutes from "./routes/members.js";

dotenv.config();

// --- File paths for ES modules ---
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
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/members", membersRoutes);

// --- MongoDB model for chat ---
const chatSchema = new mongoose.Schema({
  senderId: String,
  content: String,
  type: { type: String, default: "text" }, // text, image, file, system
  pinned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Chat = mongoose.model("Chat", chatSchema);

// --- File upload ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ url: `http://localhost:${process.env.PORT || 5000}/uploads/${req.file.filename}`, type: req.body.type });
});

// --- Socket.IO ---
let users = {}; // socketId -> username

io.on("connection", (socket) => {
  const username = socket.handshake.query.username || "Anonymous";
  users[socket.id] = username;

  // Send initial data
  Chat.find().sort({ createdAt: -1 }).then((msgs) => {
    socket.emit("loadMessages", msgs);
  });
  socket.emit("updateUsers", users);

  // New message
  socket.on("sendMessage", async (data) => {
    const newMsg = new Chat(data);
    await newMsg.save();
    io.emit("newMessage", newMsg);
  });

  // Pin message
  socket.on("pinMessage", async (id) => {
    const msg = await Chat.findById(id);
    if (msg && !msg.pinned) {
      msg.pinned = true;
      await msg.save();
      io.emit("pinnedMessage", msg);
    }
  });

  // --- Call signaling ---
  socket.on("callUser", ({ targetId, type }) => {
    io.to(targetId).emit("incomingCall", { fromId: socket.id, fromName: username, type });
  });

  socket.on("answerCall", ({ toId, accepted }) => {
    io.to(toId).emit("callResponse", { accepted, fromId: socket.id });
  });

  socket.on("callEnded", ({ toId }) => {
    io.to(toId).emit("callEnded");
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("updateUsers", users);
  });
});

// --- Start server & MongoDB ---
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }
};

startServer();
