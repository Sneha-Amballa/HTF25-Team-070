// models/RoomMembership.js
import mongoose from "mongoose";

const roomMembershipSchema = new mongoose.Schema({
  room_id: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
  user_id: { type: String, required: true },
  role: { type: String, enum: ["admin", "member"], default: "member" },
  status: { type: String, enum: ["online", "offline"], default: "offline" },
});

export default mongoose.model("RoomMembership", roomMembershipSchema);
