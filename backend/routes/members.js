import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import User from "../models/User.js"; // assuming your users are stored in User model

const router = express.Router();

// ✅ GET all members (protected route)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const members = await User.find({}, "displayName email status"); // select only safe fields
    res.json({ members });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch members" });
  }
});

export default router;
