import express from "express";
import {
  createChatRoom,
  getChatRoomOfUser,
  getChatRoomOfUsers,
  createGroupChat,
  leaveGroupChat,
  removeMember,
  addMembers,
  dissolveGroup,
  transferAdmin,
  addDeputy,
  removeDeputy,
  acceptInvite,
  rejectInvite
} from "../controllers/chatRoom.js";

const router = express.Router();

router.post("/", createChatRoom);
router.get("/:userId", getChatRoomOfUser);
router.get("/:firstUserId/:secondUserId", getChatRoomOfUsers);
router.post("/group", createGroupChat);
router.put("/leave/:roomId", leaveGroupChat);

// Các route quản lý nhóm
router.put("/group/remove", removeMember);
router.put("/group/add", addMembers);
router.delete("/group/dissolve", dissolveGroup);
router.put("/group/transfer-admin", transferAdmin);
router.put("/group/add-deputy", addDeputy);
router.put("/group/remove-deputy", removeDeputy);

// Chấp nhận và từ chối tham gia nhóm
router.put("/group/accept-invite", acceptInvite);
router.put("/group/reject-invite", rejectInvite);

export default router;