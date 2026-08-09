import express from "express";
import {
  createChatRoom,
  getChatRoomOfUser,
  getChatRoomOfUsers,
  createGroupChat,
  leaveGroupChat,
  removeMember,
  addMembers,
  dissolveGroup
} from "../controllers/chatRoom.js";

const router = express.Router();

router.post("/", createChatRoom);
router.get("/:userId", getChatRoomOfUser);
router.get("/:firstUserId/:secondUserId", getChatRoomOfUsers);
router.post("/group", createGroupChat);
router.put("/leave/:roomId", leaveGroupChat);

// Các route quản lý nhóm mới
router.put("/group/remove", removeMember);
router.put("/group/add", addMembers);
router.delete("/group/dissolve", dissolveGroup);

export default router;