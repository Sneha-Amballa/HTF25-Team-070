import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // unique room names
  description: String,
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  members: [
    {
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      role: { type: String, enum: ["admin", "member"], default: "member" },
      status: { type: String, default: "offline" },
    },
  ],
  invitations: [
    {
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
    },
  ],
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model("Room", roomSchema);
