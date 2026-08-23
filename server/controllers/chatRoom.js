import ChatRoom from "../models/ChatRoom.js";

// ================= CÁC HÀM CHAT 1-1 & CHUNG =================

export const createChatRoom = async (req, res) => {
  try {
    // Tránh tạo trùng phòng chat 1-1
    let existingRoom = await ChatRoom.findOne({
      isGroup: false,
      members: { $all: [req.body.senderId, req.body.receiverId] }
    });
    if (existingRoom) {
      return res.status(200).json(existingRoom);
    }

    const newChatRoom = new ChatRoom({
      members: [req.body.senderId, req.body.receiverId],
      isGroup: false,
      requester: req.body.senderId, // Lưu người khởi tạo chat
      isAccepted: false, // Yêu cầu người nhận phải đồng ý
    });

    await newChatRoom.save();
    res.status(201).json(newChatRoom);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const getChatRoomOfUser = async (req, res) => {
  try {
    const chatRoom = await ChatRoom.find({
      $or: [
        { members: { $in: [req.params.userId] } },
        { pendingMembers: { $in: [req.params.userId] } }
      ]
    });
    res.status(200).json(chatRoom);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getChatRoomOfUsers = async (req, res) => {
  try {
    const chatRoom = await ChatRoom.find({
      members: { $all: [req.params.firstUserId, req.params.secondUserId] },
    });
    res.status(200).json(chatRoom);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// ================= CÁC HÀM QUẢN LÝ NHÓM CHAT =================

export const createGroupChat = async (req, res) => {
  const { name, memberIds, adminId } = req.body;
  if (!name || !memberIds || memberIds.length < 2) {
    return res.status(400).json({ message: "Tên nhóm và tối thiểu 2 thành viên" });
  }

  try {
    const initialMembers = [adminId];
    const initialPending = memberIds.filter(id => id !== adminId);

    const newRoom = new ChatRoom({
      name,
      members: initialMembers,
      pendingMembers: initialPending,
      isGroup: true,
      admin: adminId,
      deputies: [], 
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

export const leaveGroupChat = async (req, res) => {
  const { userId } = req.body;
  const { roomId } = req.params;

  try {
    const room = await ChatRoom.findById(roomId);

    if (!room || !room.isGroup) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    if (room.members.length === 1 && room.members[0].toString() === userId) {
      await ChatRoom.findByIdAndDelete(roomId);
      return res.status(200).json({ message: "Group deleted" });
    }

    room.members = room.members.filter(id => id.toString() !== userId);
    if (room.pendingMembers) {
      room.pendingMembers = room.pendingMembers.filter(id => id.toString() !== userId);
    }
    if (room.deputies) {
      room.deputies = room.deputies.filter(id => id.toString() !== userId);
    }
    
    await room.save();
    res.status(200).json({ message: "Left group successfully", room });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeMember = async (req, res) => {
  const { roomId, adminId, memberToRemoveId } = req.body;

  try {
    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: "Không tìm thấy nhóm" });

    const isAdmin = room.admin.toString() === adminId;
    const isDeputy = room.deputies && room.deputies.some(id => id.toString() === adminId);

    if (!isAdmin && !isDeputy) {
      return res.status(403).json({ message: "Chỉ Trưởng nhóm và Phó nhóm mới có quyền xóa" });
    }

    if (isDeputy && !isAdmin) {
      const targetIsAdmin = room.admin.toString() === memberToRemoveId;
      const targetIsDeputy = room.deputies && room.deputies.some(id => id.toString() === memberToRemoveId);
      if (targetIsAdmin || targetIsDeputy) {
        return res.status(403).json({ message: "Phó nhóm không thể xóa Trưởng nhóm hoặc Phó nhóm khác" });
      }
    }

    room.members = room.members.filter(id => id.toString() !== memberToRemoveId);
    if (room.pendingMembers) {
      room.pendingMembers = room.pendingMembers.filter(id => id.toString() !== memberToRemoveId);
    }
    if (room.deputies) {
      room.deputies = room.deputies.filter(id => id.toString() !== memberToRemoveId);
    }
    await room.save();
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addMembers = async (req, res) => {
  const { roomId, adminId, newMemberIds } = req.body;
  try {
    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: "Không tìm thấy nhóm" });
    if (room.admin.toString() !== adminId) return res.status(403).json({ message: "Chỉ nhóm trưởng mới có quyền thêm thành viên" });

    if (!room.pendingMembers) room.pendingMembers = [];

    newMemberIds.forEach(id => {
      if (!room.members.includes(id) && !room.pendingMembers.includes(id)) {
        room.pendingMembers.push(id);
      }
    });
    
    await room.save();
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const acceptInvite = async (req, res) => {
  const { roomId, userId } = req.body;
  try {
    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: "Không tìm thấy nhóm" });

    room.pendingMembers = room.pendingMembers.filter(id => id.toString() !== userId);
    if (!room.members.includes(userId)) {
      room.members.push(userId);
    }
    
    await room.save();
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectInvite = async (req, res) => {
  const { roomId, userId } = req.body;
  try {
    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: "Không tìm thấy nhóm" });

    room.pendingMembers = room.pendingMembers.filter(id => id.toString() !== userId);
    await room.save();
    
    res.status(200).json({ message: "Đã từ chối tham gia nhóm", roomId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

export const transferAdmin = async (req, res) => {
  const { roomId, currentAdminId, newAdminId } = req.body;
  try {
    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: "Không tìm thấy nhóm" });
    if (room.admin.toString() !== currentAdminId) return res.status(403).json({ message: "Chỉ nhóm trưởng mới có quyền thực hiện" });

    room.admin = newAdminId;
    if (!room.deputies) room.deputies = [];
    room.deputies = room.deputies.filter(id => id.toString() !== newAdminId);

    if (!room.deputies.includes(currentAdminId)) {
      room.deputies.push(currentAdminId);
    }

    await room.save();
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addDeputy = async (req, res) => {
  const { roomId, adminId, deputyId } = req.body;
  try {
    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: "Không tìm thấy nhóm" });
    if (room.admin.toString() !== adminId) return res.status(403).json({ message: "Chỉ nhóm trưởng mới có quyền bổ nhiệm phó nhóm" });

    if (!room.deputies) room.deputies = [];
    if (!room.deputies.includes(deputyId)) {
      room.deputies.push(deputyId);
    }
    await room.save();
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeDeputy = async (req, res) => {
  const { roomId, adminId, deputyId } = req.body;
  try {
    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: "Không tìm thấy nhóm" });
    if (room.admin.toString() !== adminId) return res.status(403).json({ message: "Chỉ nhóm trưởng mới có quyền gỡ phó nhóm" });

    if (room.deputies) {
      room.deputies = room.deputies.filter(id => id.toString() !== deputyId);
    }
    await room.save();
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/room/accept-private
export const acceptPrivateChat = async (req, res) => {
  const { roomId } = req.body;
  try {
    const room = await ChatRoom.findByIdAndUpdate(roomId, { isAccepted: true }, { new: true });
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/room/reject-private
export const rejectPrivateChat = async (req, res) => {
  const { roomId } = req.body;
  try {
    await ChatRoom.findByIdAndDelete(roomId);
    res.status(200).json({ message: "Đã từ chối và xóa cuộc trò chuyện" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};