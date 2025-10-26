import express from "express";
import Room from "../models/Room.js";
import Message from "../models/Message.js";

const router = express.Router();

// -----------------------------
// Get all rooms
// -----------------------------
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find().populate("owner_id", "displayName email");
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch rooms", error: err.message });
  }
});

// -----------------------------
// Create a new room
// -----------------------------
router.post("/", async (req, res) => {
  try {
    const { name, description, owner_id } = req.body;

    // Check for duplicate room name
    const existingRoom = await Room.findOne({ name });
    if (existingRoom)
      return res.status(400).json({ message: "Room name already exists" });

    const room = await Room.create({
      name,
      description,
      owner_id,
      members: [{ user_id: owner_id, role: "admin", status: "online" }],
    });
    res.status(201).json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create room", error: err.message });
  }
});

// -----------------------------
// Join a room
// -----------------------------
router.post("/:roomId/join", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (room.members.some((m) => m.user_id.toString() === userId))
      return res.status(400).json({ message: "Already a member" });

    room.members.push({ user_id: userId, role: "member", status: "online" });

    // If there was a pending invitation, mark it as accepted
    const invitation = room.invitations.find(
      (i) => i.user_id.toString() === userId && i.status === "pending"
    );
    if (invitation) invitation.status = "accepted";

    await room.save();
    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to join room", error: err.message });
  }
});

// -----------------------------
// Invite a user (admin only)
// -----------------------------
router.post("/:roomId/invite", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { invitedUserId, invitedBy } = req.body;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Check if inviter is admin
    const isAdmin = room.members.some(
      (m) => m.user_id.toString() === invitedBy && m.role === "admin"
    );
    if (!isAdmin) return res.status(403).json({ message: "Only admins can invite users" });

    // Check if already a member
    if (room.members.some((m) => m.user_id.toString() === invitedUserId))
      return res.status(400).json({ message: "User already in room" });

    // Check if already invited
    if (room.invitations.some((i) => i.user_id.toString() === invitedUserId && i.status === "pending"))
      return res.status(400).json({ message: "User already invited" });

    room.invitations.push({ user_id: invitedUserId, invitedBy });
    await room.save();

    res.json({ message: `User invited successfully`, room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to invite user", error: err.message });
  }
});

// -----------------------------
// Remove a member (admin only)
// -----------------------------
router.post("/:roomId/remove", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { memberId, requesterId } = req.body;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Check if requester is admin
    const isAdmin = room.members.some(
      (m) => m.user_id.toString() === requesterId && m.role === "admin"
    );
    if (!isAdmin) return res.status(403).json({ message: "Only admins can remove members" });

    room.members = room.members.filter((m) => m.user_id.toString() !== memberId);
    await room.save();

    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to remove member", error: err.message });
  }
});

// -----------------------------
// Post a message
// -----------------------------
router.post("/:roomId/message", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { senderId, content } = req.body;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Only members can send messages
    if (!room.members.some((m) => m.user_id.toString() === senderId))
      return res.status(403).json({ message: "Only members can send messages" });

    const message = await Message.create({
      room_id: roomId,
      sender: senderId,
      content,
    });

    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send message", error: err.message });
  }
});

// -----------------------------
// Get all messages in a room
// -----------------------------
router.get("/:roomId/messages", async (req, res) => {
  try {
    const { roomId } = req.params;

    const messages = await Message.find({ room_id: roomId })
      .populate("sender", "displayName email")
      .sort({ created_at: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch messages", error: err.message });
  }
});

export default router;
