import { io } from "socket.io-client";

let socket = null;

export const initSocket = (userId, username) => {
  if (!userId || !username) {
    console.error("❌ userId or username missing!");
    return null;
  }

  // If socket already exists and is connected, reuse it
  if (socket && socket.connected) return socket;

  socket = io("http://localhost:5000", {
    auth: { userId, username }, // handshake data
    transports: ["websocket"], // ensure faster connection
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("✅ Connected to server:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.warn("⚠️ Disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Connection Error:", err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
