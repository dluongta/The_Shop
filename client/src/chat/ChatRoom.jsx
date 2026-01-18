import { useState, useEffect, useRef, useMemo } from "react";
import { useApi } from "../services/ChatService";
import Message from "./Message";
import Contact from "./Contact";
import ChatForm from "./ChatForm";

export default function ChatRoom({
  currentChat,
  setCurrentChat,
  setChatRooms,
  currentUser,
  socket,
  users,
  onlineUsersId,
}) {
  const [messages, setMessages] = useState([]);
  const chatContainerRef = useRef(null);
  const firstLoadRef = useRef(true);

  const { getMessagesOfChatRoom, sendMessage, leaveGroupChat } = useApi();

  // ================= FETCH MESSAGES =================
  useEffect(() => {
    if (!currentChat?._id) return;

    const fetchMessages = async () => {
      try {
        const res = await getMessagesOfChatRoom(currentChat._id);
        setMessages(Array.isArray(res) ? res : []);
        firstLoadRef.current = true; // đánh dấu lần mở phòng
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();
  }, [currentChat?._id]);

  // ================= AUTO SCROLL =================
  useEffect(() => {
    if (!chatContainerRef.current) return;

    chatContainerRef.current.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: firstLoadRef.current ? "auto" : "smooth",
    });

    firstLoadRef.current = false;
  }, [messages]);

  // ================= SEND MESSAGE =================
  const handleFormSubmit = async (message) => {
    if (!message.trim()) return;

    try {
      const res = await sendMessage({
        chatRoomId: currentChat._id,
        sender: currentUser._id,
        message,
        isRead: false,
      });

      if (res) setMessages((prev) => [...prev, res]);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= LEAVE GROUP =================
  const handleLeaveGroup = async () => {
    if (!currentChat?.isGroup) return;
    if (!window.confirm("Are you sure you want to leave this group?")) return;

    try {
      await leaveGroupChat(currentChat._id, currentUser._id);
      setChatRooms((prev) => prev.filter((r) => r._id !== currentChat._id));
      setCurrentChat(null);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= HEADER =================
  const header = useMemo(() => {
    if (!currentChat) return null;

    if (currentChat.isGroup) {
      return (
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold">{currentChat.name}</h3>
            <p className="text-xs text-gray-500">
              {currentChat.members?.length || 0} members
            </p>
          </div>
          <button
            onClick={handleLeaveGroup}
            className="bg-red-500 text-white px-4 py-1.5 rounded"
          >
            Leave Group
          </button>
        </div>
      );
    }

    return (
      <Contact
        chatRoom={currentChat}
        currentUser={currentUser}
        onlineUsersId={onlineUsersId}
        users={users}
      />
    );
  }, [currentChat]);

  if (!currentChat) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Select a chat
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* HEADER */}
      <div className="p-3 border-b shrink-0">
        {header}
      </div>

      {/* 🔥 KHUNG TIN NHẮN CỐ ĐỊNH */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-50"
      >
        {messages.map(
          (m) =>
            m?._id && (
              <Message
                key={m._id}
                message={m}
                self={currentUser._id}
                users={users}
              />
            )
        )}
      </div>

      {/* INPUT */}
      <div className="border-t p-3 shrink-0">
        <ChatForm handleFormSubmit={handleFormSubmit} />
      </div>
    </div>
  );
}
