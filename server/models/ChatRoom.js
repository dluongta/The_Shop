import mongoose from "mongoose";

const ChatRoomSchema = new mongoose.Schema(
  {
    name: { type: String },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    pendingMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
    isGroup: { type: Boolean, default: false },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
    deputies: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 

    // === 2 TRƯỜNG MỚI THÊM CHO TÍNH NĂNG CHỜ CHAT 1-1 ===
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Ai là người bắt đầu chat
    isAccepted: { type: Boolean, default: true }, // Nhóm mặc định là true, nhưng 1-1 mới sẽ là false

    lastMessage: {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      message: String,
      isRead: { type: Boolean, default: false },
      createdAt: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ChatRoom", ChatRoomSchema);