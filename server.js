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
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// --- Serve uploads statically ---
app.use('/uploads', express.static(uploadDir));

// --- Multer setup for file uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
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

// --- Create HTTP server and Socket.IO ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' } // Change '*' to your frontend domain in production
});

// --- In-memory stores ---
let roomMessages = {};
let roomUsers = {};
let userSockets = {};

// --- Socket.IO connections ---
io.on('connection', socket => {
  const { userId, username } = socket.handshake.auth;
  if (!userId || !username) {
    console.log('❌ Socket missing auth, disconnecting');
    return socket.disconnect();
  }

  console.log(`✅ User connected: ${username} (${userId})`);
  userSockets[userId] = socket.id;

  // --- Join room ---
  socket.on('joinRoom', ({ roomId }) => {
    socket.join(roomId);
    if (!roomMessages[roomId]) roomMessages[roomId] = [];
    if (!roomUsers[roomId]) roomUsers[roomId] = {};
    roomUsers[roomId][socket.id] = { username, userId, status: 'online' };

    socket.emit('loadMessages', roomMessages[roomId]);
    io.to(roomId).emit('updateUsers', Object.values(roomUsers[roomId]));
    io.to(roomId).emit('userJoined', { username, userId });
  });

  // --- Leave room ---
  socket.on('leaveRoom', ({ roomId }) => {
    socket.leave(roomId);
    if (roomUsers[roomId] && roomUsers[roomId][socket.id]) {
      delete roomUsers[roomId][socket.id];
      io.to(roomId).emit('updateUsers', Object.values(roomUsers[roomId]));
    }
  });

  // --- Chat messages ---
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

  // --- File messages ---
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

  // --- Typing indicator ---
  socket.on('typing', ({ roomId, isTyping }) => {
    socket.to(roomId).emit('userTyping', { username, userId, isTyping });
  });

  // --- Reactions ---
  socket.on('addReaction', ({ roomId, messageId, emoji }) => {
    const message = roomMessages[roomId]?.find(m => m.id === messageId);
    if (!message) return;

    const existingReaction = message.reactions.find(
      r => r.user_id === userId && r.emoji === emoji
    );

    if (existingReaction) {
      message.reactions = message.reactions.filter(
        r => !(r.user_id === userId && r.emoji === emoji)
      );
    } else {
      message.reactions.push({ user_id: userId, emoji });
    }

    io.to(roomId).emit('reactionUpdated', {
      messageId,
      reactions: message.reactions
    });
  });

  // --- Pin message ---
  socket.on('pinMessage', ({ roomId, messageId }) => {
    const message = roomMessages[roomId]?.find(m => m.id === messageId);
    if (!message) return;

    message.is_pinned = !message.is_pinned;
    io.to(roomId).emit('messagePinned', {
      messageId,
      isPinned: message.is_pinned
    });
  });

  // --- Delete message ---
  socket.on('deleteMessage', ({ roomId, messageId }) => {
    if (roomMessages[roomId]) {
      roomMessages[roomId] = roomMessages[roomId].filter(m => m.id !== messageId);
      io.to(roomId).emit('messageDeleted', messageId);
    }
  });

  // --- Whiteboard ---
  socket.on('whiteboard-draw', (data) => {
    socket.to(data.roomId).emit('whiteboard-draw', data);
  });

  socket.on('whiteboard-clear', (roomId) => {
    socket.to(roomId).emit('whiteboard-clear');
  });

  // --- WebRTC Call Signaling ---
  const sendToTarget = (toId, event, payload) => {
    const targetSocketId = userSockets[toId];
    if (targetSocketId) io.to(targetSocketId).emit(event, payload);
  };

  socket.on('callUser', ({ targetId, type, roomId }) => {
    sendToTarget(targetId, 'incomingCall', { fromId: userId, fromName: username, type, roomId });
  });

  socket.on('acceptCall', ({ toId, roomId }) => {
    sendToTarget(toId, 'callAccepted', { fromId: userId, fromName: username, roomId });
  });

  socket.on('rejectCall', ({ toId, roomId }) => {
    sendToTarget(toId, 'callRejected', { fromId: userId, fromName: username, roomId });
  });

  socket.on('offer', ({ toId, offer, roomId }) => {
    sendToTarget(toId, 'offer', { fromId: userId, offer, roomId });
  });

  socket.on('answer', ({ toId, answer, roomId }) => {
    sendToTarget(toId, 'answer', { fromId: userId, answer, roomId });
  });

  socket.on('iceCandidate', ({ toId, candidate, roomId }) => {
    sendToTarget(toId, 'iceCandidate', { fromId: userId, candidate, roomId });
  });

  socket.on('endCall', ({ roomId }) => {
    socket.to(roomId).emit('userEndedCall', { fromId: userId, fromName: username });
  });

  socket.on('screenShareStarted', ({ roomId }) => {
    socket.to(roomId).emit('screenShareStarted', { fromId: userId, fromName: username });
  });

  socket.on('screenShareStopped', ({ roomId }) => {
    socket.to(roomId).emit('screenShareStopped', { fromId: userId, fromName: username });
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

// --- Start server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
