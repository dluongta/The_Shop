import express from "express";

import {
  createChatRoom,
  getChatRoomOfUser,
  getChatRoomOfUsers,
  createGroupChat
} from "../controllers/chatRoom.js";
import { leaveGroupChat } from "../controllers/chatRoom.js";


const router = express.Router();

router.post("/", createChatRoom);
router.get("/:userId", getChatRoomOfUser);
router.get("/:firstUserId/:secondUserId", getChatRoomOfUsers);
router.post("/group", createGroupChat);
router.put("/leave/:roomId", leaveGroupChat);

export default router;
