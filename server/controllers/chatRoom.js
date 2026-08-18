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
    res.status(409).json({ message: error.message });
  }
};

export const getChatRoomOfUser = async (req, res) => {
  try {
    const chatRoom = await ChatRoom.find({
      members: { $in: [req.params.userId] },
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
      deputies: [], // Khởi tạo mảng phó nhóm rỗng
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

    if (room.members.length === 1 && room.members[0].toString() === userId) {
      await ChatRoom.findByIdAndDelete(roomId);
      return res.status(200).json({ message: "Group deleted" });
    }

    room.members = room.members.filter(id => id.toString() !== userId);
    // Xóa luôn khỏi mảng phó nhóm nếu người rời là phó nhóm
    if (room.deputies) {
      room.deputies = room.deputies.filter(id => id.toString() !== userId);
    }
    await room.save();

    res.status(200).json({ message: "Left group successfully", room });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/room/group/remove (Trưởng nhóm / Phó nhóm xóa thành viên)
export const removeMember = async (req, res) => {
  const { roomId, adminId, memberToRemoveId } = req.body;
  // Biến adminId ở đây thực chất là ID của người đang thực hiện hành động (Requester)

  try {
    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: "Không tìm thấy nhóm" });

    const isAdmin = room.admin.toString() === adminId;
    const isDeputy = room.deputies && room.deputies.some(id => id.toString() === adminId);

    if (!isAdmin && !isDeputy) {
      return res.status(403).json({ message: "Chỉ Trưởng nhóm và Phó nhóm mới có quyền xóa" });
    }

    // Nếu người xóa là phó nhóm, không cho phép xóa Trưởng nhóm hoặc Phó nhóm khác
    if (isDeputy && !isAdmin) {
      const targetIsAdmin = room.admin.toString() === memberToRemoveId;
      const targetIsDeputy = room.deputies && room.deputies.some(id => id.toString() === memberToRemoveId);
      if (targetIsAdmin || targetIsDeputy) {
        return res.status(403).json({ message: "Phó nhóm không thể xóa Trưởng nhóm hoặc Phó nhóm khác" });
      }
    }

    room.members = room.members.filter(id => id.toString() !== memberToRemoveId);
    if (room.deputies) {
      room.deputies = room.deputies.filter(id => id.toString() !== memberToRemoveId);
    }
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

// PUT /api/room/group/transfer-admin
// export const transferAdmin = async (req, res) => {
//   const { roomId, currentAdminId, newAdminId } = req.body;
//   try {
//     const room = await ChatRoom.findById(roomId);
//     if (!room) return res.status(404).json({ message: "Không tìm thấy nhóm" });
//     if (room.admin.toString() !== currentAdminId) return res.status(403).json({ message: "Chỉ nhóm trưởng mới có quyền thực hiện" });

//     room.admin = newAdminId;
//     // Nếu tân trưởng nhóm đang là phó nhóm thì bỏ chức phó nhóm đi
//     if (room.deputies) {
//       room.deputies = room.deputies.filter(id => id.toString() !== newAdminId);
//     }
//     await room.save();

//     res.status(200).json(room);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// PUT /api/room/group/transfer-admin
export const transferAdmin = async (req, res) => {
  const { roomId, currentAdminId, newAdminId } = req.body;
  try {
    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: "Không tìm thấy nhóm" });
    if (room.admin.toString() !== currentAdminId) return res.status(403).json({ message: "Chỉ nhóm trưởng mới có quyền thực hiện" });

    // 1. Chuyển quyền trưởng nhóm cho người mới
    room.admin = newAdminId;

    if (!room.deputies) room.deputies = [];

    // 2. Nếu tân trưởng nhóm đang là phó nhóm thì gỡ chức phó nhóm đi
    room.deputies = room.deputies.filter(id => id.toString() !== newAdminId);

    // 3. Đưa cựu trưởng nhóm (người đang thực hiện) vào làm phó nhóm
    if (!room.deputies.includes(currentAdminId)) {
      room.deputies.push(currentAdminId);
    }

    await room.save();

    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/room/group/add-deputy
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

// PUT /api/room/group/remove-deputy
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