const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// --- Ensure uploads folder exists ---
const uploadDir = path.join(__dirname, 'backend/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// --- Serve uploads ---
app.use('/uploads', express.static(uploadDir));

// --- Multer setup ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// --- File upload route ---
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  res.json({
    url: `http://localhost:5000/uploads/${req.file.filename}`,
    type: req.body.type || 'file'
  });
});

// --- Create server & Socket.IO ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// --- In-memory stores ---
let roomMessages = {};
let roomUsers = {};
let userSockets = {};

// --- Socket.IO connections ---
io.on('connection', socket => {
  const { userId, username } = socket.handshake.auth;
  if (!userId || !username) {
    console.log("❌ Invalid socket connection attempt");
    return socket.disconnect();
  }

  console.log(`✅ User connected: ${username} (${userId})`);
  userSockets[userId] = socket.id;

  // Example: joinRoom
  socket.on('joinRoom', ({ roomId }) => {
    socket.join(roomId);
    if (!roomMessages[roomId]) roomMessages[roomId] = [];
    if (!roomUsers[roomId]) roomUsers[roomId] = {};
    roomUsers[roomId][socket.id] = { username, userId, status: 'online' };

    socket.emit('loadMessages', roomMessages[roomId]);
    io.to(roomId).emit('updateUsers', Object.values(roomUsers[roomId]));
    io.to(roomId).emit('userJoined', { username, userId });
  });

  // --- Send message ---
  socket.on('sendMessage', ({ roomId, message }) => {
    if (!message?.content) return;
    const newMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      content: message.content,
      user_id: userId,
      display_name: username,
      created_at: new Date().toISOString(),
      is_pinned: false,
      reactions: [],
      type: message.type || 'text',
    };
    roomMessages[roomId] = roomMessages[roomId] || [];
    roomMessages[roomId].push(newMessage);
    io.to(roomId).emit('newMessage', newMessage);
  });

  // --- Handle fileUploaded from frontend ---
  socket.on('fileUploaded', ({ roomId, fileUrl, fileType }) => {
    const newMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      content: fileUrl,
      user_id: userId,
      display_name: username,
      created_at: new Date().toISOString(),
      is_pinned: false,
      reactions: [],
      type: fileType,
    };
    roomMessages[roomId] = roomMessages[roomId] || [];
    roomMessages[roomId].push(newMessage);
    io.to(roomId).emit('newMessage', newMessage);
  });

  // --- Disconnect ---
  socket.on('disconnect', () => {
    delete userSockets[userId];
    Object.keys(roomUsers).forEach(roomId => {
      if (roomUsers[roomId][socket.id]) {
        delete roomUsers[roomId][socket.id];
        io.to(roomId).emit('updateUsers', Object.values(roomUsers[roomId]));
        io.to(roomId).emit('userLeft', { username, userId });
      }
    });
    console.log(`❌ ${username} (${userId}) disconnected`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
