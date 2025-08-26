import ChatRoom from "../models/ChatRoom.js";


// POST /api/room/group
export const createGroupChat = async (req, res) => {
  const { name, memberIds } = req.body;
  if (!name || !memberIds || memberIds.length < 2) {
    return res.status(400).json({ message: "Tên nhóm và tối thiểu 2 thành viên" });
  }
  try {
    const newRoom = new ChatRoom({
      name,
      members: memberIds,
      isGroup: true,
    });
    await newRoom.save();
    return res.status(201).json(newRoom);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createChatRoom = async (req, res) => {
  const newChatRoom = new ChatRoom({
    members: [req.body.senderId, req.body.receiverId],
  });

  try {
    await newChatRoom.save();
    res.status(201).json(newChatRoom);
  } catch (error) {
    res.status(409).json({
      message: error.message,
    });
  }
};

export const getChatRoomOfUser = async (req, res) => {
  try {
    const chatRoom = await ChatRoom.find({
      members: { $in: [req.params.userId] },
    });
    res.status(200).json(chatRoom);
  } catch (error) {
    res.status(404).json({
      message: error.message,
    });
  }
};

export const getChatRoomOfUsers = async (req, res) => {
  try {
    const chatRoom = await ChatRoom.find({
      members: { $all: [req.params.firstUserId, req.params.secondUserId] },
    });
    res.status(200).json(chatRoom);
  } catch (error) {
    res.status(404).json({
      message: error.message,
    });
  }
};
