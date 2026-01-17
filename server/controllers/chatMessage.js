import ChatMessage from "../models/ChatMessage.js";
import ChatRoom from "../models/ChatRoom.js"; // Import model ChatRoom
import Notification from "../models/notificationModel.js"; // Import model Notification
import User from "../models/userModel.js";
export const getMessages = async (req, res) => {
  try {
    const messages = await ChatMessage.find({
      chatRoomId: req.params.chatRoomId,
    });
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
    // 1. Lưu tin nhắn mới
    const newMessage = new ChatMessage({ chatRoomId, sender, message });
    const savedMessage = await newMessage.save();

    // 2. Tìm thông tin người gửi (sender) để lấy Email/Name
    const senderInfo = await User.findById(sender);

    // 3. Tìm phòng chat
    const room = await ChatRoom.findById(chatRoomId);
    
    if (room && senderInfo) {
      const receivers = room.members.filter(
        (memberId) => memberId.toString() !== sender.toString()
      );

      for (const receiverId of receivers) {
        // 4. Tạo thông báo với nội dung chứa Email người gửi
        const newNotification = new Notification({
          user: receiverId,
          title: "Tin nhắn mới",
          // THAY ĐỔI TẠI ĐÂY: Sử dụng senderInfo.email hoặc senderInfo.name
          message: `Bạn có tin nhắn mới từ: ${senderInfo.email}`, 
          type: "new_message",
          link: "/chat", 
        });
        await newNotification.save();

        // 5. Gửi Socket Realtime
        const receiverSocketId = global.onlineUsers.get(receiverId.toString());
        if (receiverSocketId) {
          global.io.to(receiverSocketId).emit("newNotification", newNotification);
        }
      }
    }
    res.status(201).json(savedMessage);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};
// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  const { chatRoomId } = req.params;
  const { userId } = req.body;

  try {
    await ChatMessage.updateMany(
      {
        chatRoomId,
        sender: { $ne: userId },
        isRead: false
      },
      { $set: { isRead: true } }
    );

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json(err);
  }
};


