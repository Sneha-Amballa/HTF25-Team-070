import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  room_id: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  display_name: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ["text", "image", "file"], default: "text" },
  reactions: [
    {
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      emoji: String,
    },
  ],
  is_pinned: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model("Message", messageSchema);
