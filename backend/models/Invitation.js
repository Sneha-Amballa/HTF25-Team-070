import mongoose from "mongoose";

const InvitationSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  roomName: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  invitedBy: { type: String, required: true },
  invitedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Invitation", InvitationSchema); 
