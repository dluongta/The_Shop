import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
    if (!currentChat?._id) return setMessages([]);

    const fetch = async () => {
      const res = await getMessagesOfChatRoom(currentChat._id);
      setMessages(res || []);
    };
    fetch();
  }, [currentChat?._id]);

  // ================= SEND MESSAGE =================
  const handleFormSubmit = async (message) => {
    if (!message.trim()) return;

    await sendMessage({
      chatRoomId: currentChat._id,
      sender: currentUser._id,
      message,
      isRead: false,
    });
  };

  // ================= LEAVE GROUP (NO FAIL) =================
  const handleLeaveGroup = async () => {
    if (!currentChat?.isGroup) return;

    if (!window.confirm("Leave this group?")) return;

    try {
      await leaveGroupChat(currentChat._id, currentUser._id);

      setChatRooms((prev) =>
        prev.filter((r) => r._id !== currentChat._id)
      );

      setCurrentChat(null);
    } catch (err) {
      console.error(err);
      // alert("Leave group failed");
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
              {currentChat.members.length} members
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

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">{header}</div>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4">
        {messages.map((m) => (
          <Message key={m._id} message={m} self={currentUser._id} />
        ))}
      </div>

      <div className="border-t p-3">
        <ChatForm handleFormSubmit={handleFormSubmit} />
      </div>
    </div>
  );
}
