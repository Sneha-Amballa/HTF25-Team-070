// models/Room.js
import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  owner_id: { type: String, required: true },
  created_at: Date,
});

export default mongoose.model("Room", roomSchema);
