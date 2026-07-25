import ChatMessage from "../models/ChatMessage.js";
import ChatRoom from "../models/ChatRoom.js"; // Import model ChatRoom
import Notification from "../models/notificationModel.js"; // Import model Notification
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
    // 1. Khởi tạo và Lưu tin nhắn mới (Đã sửa lỗi biến savedMessage)
    const newMessage = new ChatMessage({
      chatRoomId,
      sender,
      message,
      isRead: false,
    });
    
    // Lưu và gán luôn vào biến savedMessage
    const savedMessage = await newMessage.save();

    // 2. CẬP NHẬT LAST MESSAGE
    await ChatRoom.findByIdAndUpdate(chatRoomId, {
      lastMessage: {
        sender,
        message,
        isRead: false,
        createdAt: savedMessage.createdAt,
      },
    });

    // 3. Tìm thông tin người gửi & Phòng chat
    const senderInfo = await User.findById(sender);
    const room = await ChatRoom.findById(chatRoomId);
    
    if (room && senderInfo) {
      const receivers = room.members.filter(
        (memberId) => memberId.toString() !== sender.toString()
      );

      for (const receiverId of receivers) {
        // 4. Tạo thông báo
        const newNotification = new Notification({
          user: receiverId,
          title: "Tin nhắn mới",
          message: `Bạn có tin nhắn mới từ: ${senderInfo.email}`, 
          type: "new_message",
          link: "/chat", 
        });
        await newNotification.save();

        // 5. Gửi Socket Realtime tới người nhận
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
    
    // Trả về kết quả đúng để Frontend nhận được
    res.status(201).json(savedMessage);
  } catch (error) {
    console.error("Lỗi createMessage:", error);
    res.status(409).json({ message: error.message });
  }
};
// Mark messages as read
// export const markMessagesAsRead = async (req, res) => {
//   const { chatRoomId } = req.params;
//   const { userId } = req.body;

//   try {
//     await ChatMessage.updateMany(
//       {
//         chatRoomId,
//         sender: { $ne: userId },
//         isRead: false
//       },
//       { $set: { isRead: true } }
//     );

//     res.status(200).json({ success: true });
//   } catch (err) {
//     res.status(500).json(err);
//   }
// };

export const markMessagesAsRead = async (req, res) => {
  const { chatRoomId } = req.params;
  const { userId } = req.body;

  try {
    await ChatMessage.updateMany(
      {
        chatRoomId,
        sender: { $ne: userId },
        isRead: false,
      },
      { $set: { isRead: true } }
    );

    await ChatRoom.findByIdAndUpdate(chatRoomId, {
      "lastMessage.isRead": true,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json(err);
  }
};

// export const revokeMessage = async (req, res) => {
//   const { messageId } = req.params;
//   const { userId } = req.body;

//   try {
//     const message = await ChatMessage.findById(messageId);
    
//     if (!message) {
//       return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
//     }

//     if (message.sender.toString() !== userId.toString()) {
//       return res.status(403).json({ message: "Bạn không có quyền thu hồi tin nhắn này" });
//     }

//     message.isDeleted = true;
//     await message.save();


//     const latestMessage = await ChatMessage.findOne({ chatRoomId: message.chatRoomId })
//       .sort({ createdAt: -1 });

//     if (latestMessage) {
//       const updatedMessageContent = latestMessage.isDeleted
//         ? "Tin nhắn đã bị thu hồi"
//         : latestMessage.message;

//       await ChatRoom.findByIdAndUpdate(message.chatRoomId, {
//         lastMessage: {
//           sender: latestMessage.sender,
//           message: updatedMessageContent,
//           isRead: latestMessage.isRead,
//           createdAt: latestMessage.createdAt,
//         },
//       });
//     }

//     res.status(200).json(message);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
// export const revokeMessage = async (req, res) => {
//   const { messageId } = req.params;
//   const { userId } = req.body;

//   try {
//     const message = await ChatMessage.findById(messageId);
    
//     if (!message) {
//       return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
//     }

//     if (message.sender.toString() !== userId.toString()) {
//       return res.status(403).json({ message: "Bạn không có quyền thu hồi tin nhắn này" });
//     }

//     message.isDeleted = true;
//     await message.save();

//     const latestMessage = await ChatMessage.findOne({ chatRoomId: message.chatRoomId })
//       .sort({ createdAt: -1 });

//     if (latestMessage) {
//       const updatedMessageContent = latestMessage.isDeleted
//         ? "Tin nhắn đã bị thu hồi"
//         : latestMessage.message;

//       await ChatRoom.findByIdAndUpdate(message.chatRoomId, {
//         lastMessage: {
//           sender: latestMessage.sender,
//           message: updatedMessageContent,
//           isRead: latestMessage.isRead,
//           createdAt: latestMessage.createdAt,
//         },
//       });
//     }

//     const room = await ChatRoom.findById(message.chatRoomId);
//     if (room) {
//       const receivers = room.members.filter(
//         (memberId) => memberId.toString() !== userId.toString()
//       );

//       for (const receiverId of receivers) {
//         const receiverSocketId = global.onlineUsers.get(receiverId.toString());
        
//         if (receiverSocketId) {
//           global.io.to(receiverSocketId).emit("messageRevoked", {
//             chatRoomId: message.chatRoomId,
//             messageId: message._id,
//           });
//         }
//       }
//     }

//     res.status(200).json(message);
//   } catch (error) {
//     console.error("Lỗi revokeMessage:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

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

    // Tìm lại tin nhắn mới nhất của phòng
    const latestMessage = await ChatMessage.findOne({ chatRoomId: message.chatRoomId })
      .sort({ createdAt: -1 });

    let newLastMessage = null;

    // Tính toán cấu trúc tin nhắn mới nhất để cập nhật Sidebar
    if (latestMessage) {
      newLastMessage = {
        sender: latestMessage.sender,
        message: latestMessage.isDeleted ? "Tin nhắn đã bị thu hồi" : latestMessage.message,
        isRead: latestMessage.isRead,
        createdAt: latestMessage.createdAt,
      };

      // Cập nhật Database
      await ChatRoom.findByIdAndUpdate(message.chatRoomId, { lastMessage: newLastMessage });
    }

    // Gửi sự kiện cho NGƯỜI NHẬN qua Socket
    const room = await ChatRoom.findById(message.chatRoomId);
    if (room) {
      const receivers = room.members.filter((mId) => mId.toString() !== userId.toString());
      for (const receiverId of receivers) {
        const receiverSocketId = global.onlineUsers.get(receiverId.toString());
        if (receiverSocketId) {
          global.io.to(receiverSocketId).emit("messageRevoked", {
            chatRoomId: message.chatRoomId,
            messageId: message._id,
            newLastMessage: newLastMessage // ✅ Truyền chính xác tin nhắn cuối cùng đi
          });
        }
      }
    }

    // Trả về cho NGƯỜI GỬI qua API
    res.status(200).json({ success: true, newLastMessage: newLastMessage });
  } catch (error) {
    console.error("Lỗi revokeMessage:", error);
    res.status(500).json({ message: error.message });
  }
};