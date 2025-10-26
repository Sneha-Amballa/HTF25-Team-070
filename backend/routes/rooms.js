import express from "express";
import Room from "../models/Room.js";
import RoomMembership from "../models/RoomMembership.js";

const router = express.Router();

// GET all rooms
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find({});
    const memberships = await RoomMembership.find({});
    res.json({ rooms, memberships });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new room
router.post("/", async (req, res) => {
  try {
    const { name, description, owner_id } = req.body;
    const newRoom = new Room({ name, description, owner_id });
    await newRoom.save();

    // Creator is admin
    await RoomMembership.create({
      room_id: newRoom._id,
      user_id: owner_id,
      role: "admin",
      status: "online",
    });

    res.status(201).json(newRoom);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
