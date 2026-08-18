import mongoose from "mongoose";

const ChatRoomSchema = new mongoose.Schema(
  {
    name: { type: String },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isGroup: { type: Boolean, default: false },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
    deputies: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // THÊM DÒNG NÀY: Mảng lưu Phó nhóm

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