import express from "express";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Protected dashboard route
router.get("/", authenticateToken, (req, res) => {
  res.json({
    message: `Welcome to your dashboard, user ${req.user.id}`,
    user: req.user,
  });
});

export default router;
