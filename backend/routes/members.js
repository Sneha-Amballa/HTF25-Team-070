import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

// This function will be called from server.js to update online status
let roomUsers = {}; // temporary in-memory reference
export const setRoomUsers = (rooms) => {
  roomUsers = rooms;
};

// GET all members with online status
router.get("/", authenticateToken, async (req, res) => {
  try {
    const users = await User.find({}, "displayName email");
    // Map users to include online/offline status from roomUsers
    const usersWithStatus = users.map((user) => {
      let isOnline = false;
      // Loop through roomUsers to see if this user is online
      Object.values(roomUsers).forEach((room) => {
        Object.values(room).forEach((u) => {
          if (u.userId === user._id.toString()) isOnline = true;
        });
      });
      return {
        displayName: user.displayName,
        email: user.email,
        status: isOnline ? "online" : "offline",
      };
    });
    res.json({ members: usersWithStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch members" });
  }
});

export default router;
