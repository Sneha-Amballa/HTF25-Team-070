import express from "express";
import Message from "../models/messageModel.js";

const router = express.Router();

// Get messages of a room
router.get("/:roomId", async (req, res) => {
  const messages = await Message.find({ room_id: req.params.roomId }).populate("sender_id", "name");
  res.json(messages);
});

// Send message
router.post("/", async (req, res) => {
  const { room_id, sender_id, content } = req.body;
  const msg = await Message.create({ room_id, sender_id, content });
  res.json(msg);
});

export default router;
