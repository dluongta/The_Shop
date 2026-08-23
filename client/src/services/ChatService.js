import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { io } from "socket.io-client";

const baseURL = "http://localhost:5000/api";

export const useApi = () => {
  const { currentUser } = useAuth();

  const createHeader = () => {
    const token = currentUser?.token;
    return {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const initiateSocketConnection = () => {
    const token = currentUser?.token;
    const socket = io("http://localhost:5000", {
      auth: { token },
    });
    return socket;
  };

  const getAllUsers = async () => {
    const header = createHeader();
    try {
      const res = await axios.get(`${baseURL}/users`, header);
      return res.data;
    } catch (e) {
      console.error(e);
    }
  };

  const getUser = async (userId) => {
    const header = createHeader();
    try {
      const res = await axios.get(`${baseURL}/users/${userId}`, header);
      return res.data;
    } catch (e) {
      console.error(e);
    }
  };

  const getChatRooms = async (userId) => {
    const header = createHeader();
    try {
      const res = await axios.get(`${baseURL}/room/${userId}`, header);
      return res.data;
    } catch (e) {
      console.error(e);
    }
  };

  const getChatRoomOfUsers = async (firstUserId, secondUserId) => {
    const header = createHeader();
    try {
      const res = await axios.get(`${baseURL}/room/${firstUserId}/${secondUserId}`, header);
      return res.data;
    } catch (e) {
      console.error(e);
    }
  };

  const markAllMessagesAsRead = async (chatRoomId) => {
    const header = createHeader();
    try {
      await axios.put(`${baseURL}/message/mark-as-read/${chatRoomId}`, {}, header);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const createChatRoom = async (data) => {
    const header = createHeader();
    try {
      const res = await axios.post(`${baseURL}/room/${data.isGroup ? "group" : ""}`, data, header);
      return res.data;
    } catch (e) {
      console.error(e);
    }
  };

  const getMessagesOfChatRoom = async (chatRoomId) => {
    const header = createHeader();
    try {
      const res = await axios.get(`${baseURL}/message/${chatRoomId}`, header);
      return res.data;
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async (messageBody) => {
    const header = createHeader();
    try {
      const res = await axios.post(`${baseURL}/message`, messageBody, header);
      return res.data;
    } catch (e) {
      console.error(e);
    }
  };

  const markMessagesAsRead = async (chatRoomId, userId) => {
    const header = createHeader();
    try {
      const res = await axios.put(`${baseURL}/chatMessage/mark-as-read/${chatRoomId}`, { userId }, header);
      return res.data;
    } catch (e) {
      console.error(e);
    }
  };

  const leaveGroupChat = async (roomId, userId) => {
    const header = createHeader();
    try {
      const res = await axios.put(`${baseURL}/room/leave/${roomId}`, { userId }, header);
      return res.data;
    } catch (e) {
      console.error(e);
    }
  };

  const revokeMessageApi = async (messageId, userId) => {
    const header = createHeader();
    try {
      const res = await axios.put(`${baseURL}/message/${messageId}/revoke`, { userId }, header);
      return res.data;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  // ================= CÁC HÀM QUẢN LÝ NHÓM MỚI =================
  const kickMemberApi = async (roomId, adminId, memberToRemoveId) => {
    const header = createHeader();
    try {
      const res = await axios.put(`${baseURL}/room/group/remove`, { roomId, adminId, memberToRemoveId }, header);
      return res.data;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const addMembersToGroupApi = async (roomId, adminId, newMemberIds) => {
    const header = createHeader();
    try {
      const res = await axios.put(`${baseURL}/room/group/add`, { roomId, adminId, newMemberIds }, header);
      return res.data;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const dissolveGroupApi = async (roomId, adminId) => {
    const header = createHeader();
    try {
      const res = await axios.delete(`${baseURL}/room/group/dissolve`, {
        ...header,
        data: { roomId, adminId }
      });
      return res.data;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const transferAdminApi = async (roomId, currentAdminId, newAdminId) => {
    const header = createHeader();
    try {
      const res = await axios.put(`${baseURL}/room/group/transfer-admin`, { roomId, currentAdminId, newAdminId }, header);
      return res.data;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const addDeputyApi = async (roomId, adminId, deputyId) => {
    const header = createHeader();
    try {
      const res = await axios.put(`${baseURL}/room/group/add-deputy`, { roomId, adminId, deputyId }, header);
      return res.data;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const removeDeputyApi = async (roomId, adminId, deputyId) => {
    const header = createHeader();
    try {
      const res = await axios.put(`${baseURL}/room/group/remove-deputy`, { roomId, adminId, deputyId }, header);
      return res.data;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };
  // Bổ sung vào danh sách return của useApi()
  const acceptGroupInviteApi = async (roomId, userId) => {
    const res = await axios.put(`/api/room/group/accept-invite`, { roomId, userId });
    return res.data;
  };

  const rejectGroupInviteApi = async (roomId, userId) => {
    const res = await axios.put(`/api/room/group/reject-invite`, { roomId, userId });
    return res.data;
  };
 const acceptPrivateChatApi = async (roomId) => {
  const res = await axios.put(`/api/room/accept-private`, { roomId });
  return res.data;
};

 const rejectPrivateChatApi = async (roomId) => {
  const res = await axios.delete(`/api/room/reject-private`, { data: { roomId } });
  return res.data;
};
  return {
    initiateSocketConnection,
    getAllUsers,
    getUser,
    getChatRooms,
    getChatRoomOfUsers,
    createChatRoom,
    getMessagesOfChatRoom,
    sendMessage,
    markAllMessagesAsRead,
    markMessagesAsRead,
    leaveGroupChat,
    revokeMessageApi,
    kickMemberApi,
    addMembersToGroupApi,
    dissolveGroupApi,
    transferAdminApi,
    addDeputyApi,
    removeDeputyApi,
    acceptGroupInviteApi,
    rejectGroupInviteApi,
    acceptPrivateChatApi,
    rejectPrivateChatApi
  };
};