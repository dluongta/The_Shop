import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { io } from "socket.io-client";

const baseURL = "http://localhost:5000/api";

export const useApi = () => {
  const { currentUser } = useAuth();

  const createHeader = () => {
    const token = currentUser.token;

    return {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const initiateSocketConnection = () => {
    const token = currentUser.token;

    const socket = io("http://localhost:5000", {
      auth: {
        token,
      },
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
      const res = await axios.get(
        `${baseURL}/room/${firstUserId}/${secondUserId}`,
        header
      );
      return res.data;
    } catch (e) {
      console.error(e);
    }
  };

  const markAllMessagesAsRead = async (chatRoomId) => {
    try {
      await axios.put(`/api/message/mark-as-read/${chatRoomId}`);
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
const markMessagesAsRead = (chatRoomId, userId) => {
  return axios.put(`/chatMessage/mark-as-read/${chatRoomId}`, { userId });
};
  const leaveGroupChat = async (roomId, userId) => {
    const res = await axios.put(`/api/room/leave/${roomId}`, {
      userId,
    });
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
    leaveGroupChat
  };
};

