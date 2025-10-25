const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Store messages by room
let roomMessages = {}; // { roomId: [messages] }
let roomUsers = {}; // { roomId: { socketId: { username, userId, status } } }
let userSockets = {}; // { userId: socketId }

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ 
    url: `http://localhost:5000/uploads/${req.file.filename}`, 
    type: req.body.type 
  });
});

io.on('connection', socket => {
  const { username, userId } = socket.handshake.query;
  console.log(`✅ User connected: ${username} (${userId})`);
  
  userSockets[userId] = socket.id;

  // Join room
  socket.on('joinRoom', ({ roomId }) => {
    socket.join(roomId);
    
    // Initialize room if doesn't exist
    if (!roomMessages[roomId]) roomMessages[roomId] = [];
    if (!roomUsers[roomId]) roomUsers[roomId] = {};
    
    // Add user to room
    roomUsers[roomId][socket.id] = { username, userId, status: 'online' };
    
    // Send existing messages to user
    socket.emit('loadMessages', roomMessages[roomId]);
    
    // Notify room about new user
    io.to(roomId).emit('updateUsers', Object.values(roomUsers[roomId]));
    io.to(roomId).emit('userJoined', { username, userId });
    
    console.log(`User ${username} joined room ${roomId}`);
  });

  // Leave room
  socket.on('leaveRoom', ({ roomId }) => {
    socket.leave(roomId);
    if (roomUsers[roomId]) {
      delete roomUsers[roomId][socket.id];
      io.to(roomId).emit('updateUsers', Object.values(roomUsers[roomId]));
      io.to(roomId).emit('userLeft', { username, userId });
    }
    console.log(`User ${username} left room ${roomId}`);
  });

  // Send message
  socket.on('sendMessage', ({ roomId, message }) => {
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
    
    if (!roomMessages[roomId]) roomMessages[roomId] = [];
    roomMessages[roomId].push(newMessage);
    
    // Send to all users in room
    io.to(roomId).emit('newMessage', newMessage);
    
    console.log(`Message in room ${roomId} from ${username}: ${message.content}`);
  });

  // Pin message
  socket.on('pinMessage', ({ roomId, messageId }) => {
    if (roomMessages[roomId]) {
      const message = roomMessages[roomId].find(m => m.id === messageId);
      if (message) {
        message.is_pinned = !message.is_pinned;
        io.to(roomId).emit('messagePinned', { messageId, isPinned: message.is_pinned });
      }
    }
  });

  // Delete message
  socket.on('deleteMessage', ({ roomId, messageId }) => {
    if (roomMessages[roomId]) {
      roomMessages[roomId] = roomMessages[roomId].filter(m => m.id !== messageId);
      io.to(roomId).emit('messageDeleted', messageId);
    }
  });

  // Reaction
  socket.on('addReaction', ({ roomId, messageId, emoji }) => {
    if (roomMessages[roomId]) {
      const message = roomMessages[roomId].find(m => m.id === messageId);
      if (message) {
        const existingReaction = message.reactions.find(
          r => r.user_id === userId && r.emoji === emoji
        );
        
        if (existingReaction) {
          message.reactions = message.reactions.filter(
            r => !(r.user_id === userId && r.emoji === emoji)
          );
        } else {
          message.reactions.push({ emoji, user_id: userId });
        }
        
        io.to(roomId).emit('reactionUpdated', { 
          messageId, 
          reactions: message.reactions 
        });
      }
    }
  });

  // Typing indicator
  socket.on('typing', ({ roomId, isTyping }) => {
    socket.to(roomId).emit('userTyping', { username, userId, isTyping });
  });

  // File upload
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
    
    if (!roomMessages[roomId]) roomMessages[roomId] = [];
    roomMessages[roomId].push(newMessage);
    
    io.to(roomId).emit('newMessage', newMessage);
  });

  // Call signaling
  socket.on('callUser', ({ targetId, type, roomId }) => {
    const targetSocketId = userSockets[targetId];
    if (targetSocketId) {
      io.to(targetSocketId).emit('incomingCall', { 
        fromId: userId, 
        fromName: username, 
        type,
        roomId 
      });
    }
  });

  socket.on('answerCall', ({ toId, accepted, roomId }) => {
    const targetSocketId = userSockets[toId];
    if (targetSocketId) {
      io.to(targetSocketId).emit('callResponse', { 
        accepted, 
        fromId: userId,
        fromName: username 
      });
    }
  });

  socket.on('callEnded', ({ toId }) => {
    const targetSocketId = userSockets[toId];
    if (targetSocketId) {
      io.to(targetSocketId).emit('callEnded');
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${username} (${userId})`);
    delete userSockets[userId];
    
    // Remove from all rooms
    Object.keys(roomUsers).forEach(roomId => {
      if (roomUsers[roomId][socket.id]) {
        delete roomUsers[roomId][socket.id];
        io.to(roomId).emit('updateUsers', Object.values(roomUsers[roomId]));
        io.to(roomId).emit('userLeft', { username, userId });
      }
    });
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));