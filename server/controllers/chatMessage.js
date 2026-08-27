import ChatMessage from "../models/ChatMessage.js";
import ChatRoom from "../models/ChatRoom.js";
import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";

export const getMessages = async (req, res) => {
  try {
    const messages = await ChatMessage.find({
      chatRoomId: req.params.chatRoomId,
    }).sort({ createdAt: -1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(409).json({
      message: error.message,
    });
  }
};

export const createMessage = async (req, res) => {
  const { chatRoomId, sender, message } = req.body;

  try {
    // === KIỂM TRA LOGIC CHAT 1-1 (GIỚI HẠN 10 TIN NHẮN) ===
    const room = await ChatRoom.findById(chatRoomId);
    
    if (room && room.isGroup === false && room.isAccepted === false) {
      if (room.requester.toString() !== sender.toString()) {
        return res.status(403).json({ message: "Bạn phải đồng ý cuộc trò chuyện mới được nhắn tin." });
      }
      
      const messageCount = await ChatMessage.countDocuments({ chatRoomId });
      if (messageCount >= 10) {
        return res.status(403).json({ message: "Bạn chỉ được gửi tối đa 10 tin nhắn. Vui lòng chờ đối phương đồng ý để tiếp tục." });
      }
    }
    // ========================================================

    const newMessage = new ChatMessage({
      chatRoomId,
      sender,
      message,
      isRead: false,
    });

    const savedMessage = await newMessage.save();

    // ================= CẬP NHẬT PHÒNG CHAT & UNREAD COUNT =================
    if (room) {
      if (!room.unreadCounts) {
        room.unreadCounts = new Map();
      }

      room.members.forEach(memberId => {
        if (memberId.toString() !== sender.toString()) {
          const currentCount = room.unreadCounts.get(memberId.toString()) || 0;
          room.unreadCounts.set(memberId.toString(), currentCount + 1);
        }
      });

      room.lastMessage = {
        sender,
        message,
        isRead: false,
        createdAt: savedMessage.createdAt,
      };

      await room.save(); 
    }
    // ======================================================================

    const senderInfo = await User.findById(sender);

    if (room && senderInfo) {
      const receivers = room.members.filter(
        (memberId) => memberId.toString() !== sender.toString()
      );

      for (const receiverId of receivers) {

        let notifTitle = "Tin nhắn mới";
        let notifMessage = `Bạn có tin nhắn mới từ: ${senderInfo.email}`;

        if (room.isGroup) {
          notifTitle = `Tin nhắn mới - Nhóm ${room.name}`;
          notifMessage = `Bạn có tin nhắn mới từ: ${senderInfo.email} - Nhóm ${room.name}`;
        }

        const newNotification = new Notification({
          user: receiverId,
          title: notifTitle,
          message: notifMessage,
          type: "new_message",
          link: "/chat",
        });
        await newNotification.save();

        const receiverSocketId = global.onlineUsers.get(receiverId.toString());
        if (receiverSocketId) {
          global.io.to(receiverSocketId).emit("newNotification", newNotification);

          global.io.to(receiverSocketId).emit("getMessage", {
            _id: savedMessage._id,
            chatRoomId,
            senderId: sender,
            message,
            createdAt: savedMessage.createdAt
          });
        }
      }
    }

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error("Lỗi createMessage:", error);
    res.status(409).json({ message: error.message });
  }
};

export const markMessagesAsRead = async (req, res) => {
  const { chatRoomId } = req.params;
  const { userId, messageIds } = req.body; // THÊM messageIds ĐỂ ĐÁNH DẤU CỤ THỂ TỪNG TIN NHẮN

  try {
    // Nếu có truyền danh sách ID các tin nhắn cụ thể
    if (messageIds && messageIds.length > 0) {
       await ChatMessage.updateMany(
        { _id: { $in: messageIds }, sender: { $ne: userId } },
        { $set: { isRead: true } }
      );
    } else {
      // Nếu không, đánh dấu tất cả (khi vừa bấm mở phòng chat)
      await ChatMessage.updateMany(
        { chatRoomId, sender: { $ne: userId }, isRead: false },
        { $set: { isRead: true } }
      );
    }

    // ================= RESET HOẶC GIẢM UNREAD COUNT =================
    const room = await ChatRoom.findById(chatRoomId);
    if (room) {
      if (!room.unreadCounts) {
        room.unreadCounts = new Map();
      }
      
      const currentCount = room.unreadCounts.get(userId.toString()) || 0;

      if (messageIds && messageIds.length > 0) {
        // Trừ đi số lượng tin nhắn vừa được đọc
        const newCount = Math.max(0, currentCount - messageIds.length);
        room.unreadCounts.set(userId.toString(), newCount);
      } else {
        // Reset về 0 khi vừa mở phòng
        room.unreadCounts.set(userId.toString(), 0);
      }

      if (room.lastMessage && room.lastMessage.sender && room.lastMessage.sender.toString() !== userId.toString()) {
        room.lastMessage.isRead = true;
      }

      await room.save();
    }
    // ======================================================

    res.json({ success: true });
  } catch (err) {
    res.status(500).json(err);
  }
};

export const revokeMessage = async (req, res) => {
  const { messageId } = req.params;
  const { userId } = req.body;

  try {
    const message = await ChatMessage.findById(messageId);

    if (!message) return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền thu hồi tin nhắn này" });
    }

    message.isDeleted = true;
    await message.save();

    const latestMessage = await ChatMessage.findOne({ chatRoomId: message.chatRoomId })
      .sort({ createdAt: -1 });

    let newLastMessage = null;

    if (latestMessage) {
      newLastMessage = {
        sender: latestMessage.sender,
        message: latestMessage.isDeleted ? "Tin nhắn đã bị thu hồi" : latestMessage.message,
        isRead: latestMessage.isRead,
        createdAt: latestMessage.createdAt,
      };

      await ChatRoom.findByIdAndUpdate(message.chatRoomId, { lastMessage: newLastMessage });
    }

    const room = await ChatRoom.findById(message.chatRoomId);
    if (room) {
      const receivers = room.members.filter((mId) => mId.toString() !== userId.toString());
      for (const receiverId of receivers) {
        const receiverSocketId = global.onlineUsers.get(receiverId.toString());
        if (receiverSocketId) {
          global.io.to(receiverSocketId).emit("messageRevoked", {
            chatRoomId: message.chatRoomId,
            messageId: message._id,
            newLastMessage: newLastMessage
          });
        }
      }
    }

    res.status(200).json({ success: true, newLastMessage: newLastMessage });
  } catch (error) {
    console.error("Lỗi revokeMessage:", error);
    res.status(500).json({ message: error.message });
  }
};