import ChatRoom from "../models/ChatRoom.js";

// ================= CÁC HÀM CHAT 1-1 & CHUNG =================

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


// ================= CÁC HÀM QUẢN LÝ NHÓM CHAT =================

// POST /api/room/group
export const createGroupChat = async (req, res) => {
  const { name, memberIds, adminId } = req.body;
  if (!name || !memberIds || memberIds.length < 2) {
    return res.status(400).json({ message: "Tên nhóm và tối thiểu 2 thành viên" });
  }
  
  try {
    const newRoom = new ChatRoom({
      name,
      members: memberIds,
      isGroup: true,
      admin: adminId, 
    });
    
    await newRoom.save();

    if (global.io && global.onlineUsers) {
      memberIds.forEach((memberId) => {
        const socketId = global.onlineUsers.get(memberId.toString());
        if (socketId) {
          global.io.to(socketId).emit("newChatRoom", newRoom);
        }
      });
    }

    return res.status(201).json(newRoom);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PUT /api/room/leave/:roomId (Thành viên tự rời nhóm)
export const leaveGroupChat = async (req, res) => {
  const { userId } = req.body;
  const { roomId } = req.params;

  try {
    const room = await ChatRoom.findById(roomId);

    if (!room || !room.isGroup) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    // Nếu chỉ còn 1 người thì xóa luôn nhóm
    if (room.members.length === 1 && room.members[0].toString() === userId) {
      await ChatRoom.findByIdAndDelete(roomId);
      return res.status(200).json({ message: "Group deleted" });
    }

    room.members = room.members.filter(id => id.toString() !== userId);
    await room.save();

    res.status(200).json({ message: "Left group successfully", room });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/room/group/remove (Nhóm trưởng xóa thành viên)
export const removeMember = async (req, res) => {
  const { roomId, adminId, memberToRemoveId } = req.body;
  try {
    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: "Không tìm thấy nhóm" });
    if (room.admin.toString() !== adminId) return res.status(403).json({ message: "Chỉ nhóm trưởng mới có quyền xóa thành viên" });
    
    room.members = room.members.filter(id => id.toString() !== memberToRemoveId);
    await room.save();
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/room/group/add (Nhóm trưởng thêm thành viên)
export const addMembers = async (req, res) => {
  const { roomId, adminId, newMemberIds } = req.body;
  try {
    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: "Không tìm thấy nhóm" });
    if (room.admin.toString() !== adminId) return res.status(403).json({ message: "Chỉ nhóm trưởng mới có quyền thêm thành viên" });
    
    newMemberIds.forEach(id => {
      if (!room.members.includes(id)) {
        room.members.push(id);
      }
    });
    await room.save();
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/room/group/dissolve (Nhóm trưởng giải tán nhóm)
export const dissolveGroup = async (req, res) => {
  const { roomId, adminId } = req.body;
  try {
    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: "Không tìm thấy nhóm" });
    if (room.admin.toString() !== adminId) return res.status(403).json({ message: "Chỉ nhóm trưởng mới có quyền giải tán" });
    
    await ChatRoom.findByIdAndDelete(roomId);
    res.status(200).json({ message: "Đã giải tán nhóm" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};