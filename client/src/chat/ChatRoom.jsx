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

  const { getMessagesOfChatRoom, sendMessage, leaveGroupChat } = useApi();

  // ================= FETCH MESSAGES =================
  useEffect(() => {
    if (!currentChat?._id) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const res = await getMessagesOfChatRoom(currentChat._id);
        setMessages(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();
  }, [currentChat?._id]);

  // ================= SEND MESSAGE =================
  const handleFormSubmit = async (message) => {
    if (!message.trim() || !currentChat?._id) return;

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

  // ================= LEAVE GROUP (STABLE) =================
  const handleLeaveGroup = async () => {
    if (!currentChat?.isGroup) return;
    if (typeof setChatRooms !== "function") return;

    if (!window.confirm("Are you sure you want to leave this group?")) return;

    try {
      await leaveGroupChat(currentChat._id, currentUser._id);

      setMessages([]);
      setChatRooms((prev) =>
        prev.filter((r) => r._id !== currentChat._id)
      );
      setCurrentChat(null);
    } catch (err) {
      console.error("Leave group error:", err);
      alert("Leave group failed");
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
            className="bg-red-500 text-white px-4 py-1.5 rounded hover:bg-red-600"
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
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">{header}</div>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4"
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

      {!currentChat.isGroup ||
      currentChat.members?.includes(currentUser._id) ? (
        <div className="border-t p-3">
          <ChatForm handleFormSubmit={handleFormSubmit} />
        </div>
      ) : null}
    </div>
  );
}
