// routes/users.js
import express from "express";
import User from "../models/User.js";

export const router = express.Router();

// Example route
router.get("/", async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
