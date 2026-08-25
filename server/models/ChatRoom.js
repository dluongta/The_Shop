import mongoose from "mongoose";

const ChatRoomSchema = new mongoose.Schema(
  {
    name: { type: String },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    pendingMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
    isGroup: { type: Boolean, default: false },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
    deputies: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 

    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
    isAccepted: { type: Boolean, default: true }, 

    // === THÊM TRƯỜNG NÀY ĐỂ ĐẾM SỐ TIN CHƯA ĐỌC ===
    unreadCounts: {
      type: Map,
      of: Number,
      default: {}
    },

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