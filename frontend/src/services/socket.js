import { io } from "socket.io-client";

let socket = null;

export const initSocket = (userId, username) => {
  if (!socket) {
    if (!userId || !username) {
      console.error("❌ userId or username missing!");
      return null;
    }

    socket = io("http://localhost:5000", {
      auth: { userId, username },   // use auth for handshake
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("✅ Connected to server:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from server");
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const closeSocket = () => {
  if (socket) socket.disconnect();
  socket = null;
};
