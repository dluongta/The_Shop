import express from "express";

import { createMessage, getMessages, markMessagesAsRead, revokeMessage  } from "../controllers/chatMessage.js";

const router = express.Router();

router.post("/", createMessage);
router.get("/:chatRoomId", getMessages);
router.put("/:messageId/revoke", revokeMessage);
router.put("/mark-as-read/:chatRoomId", markMessagesAsRead);


export default router;
