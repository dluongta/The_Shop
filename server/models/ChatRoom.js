// import mongoose from "mongoose";

// const ChatRoomSchema = new mongoose.Schema(
//   {
//     name: { type: String },              // Tên nhóm (option)
//     members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
//     isGroup: { type: Boolean, default: false }, // Phân biệt nhóm hay 1‑1
//   },
//   { timestamps: true }
// );

// ChatRoomSchema.index({ members: 1, isGroup: 1, name: 1 });

// const ChatRoom = mongoose.model("ChatRoom", ChatRoomSchema);
// export default ChatRoom;
import mongoose from "mongoose";

const ChatRoomSchema = new mongoose.Schema(
  {
    name: { type: String },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isGroup: { type: Boolean, default: false },

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
