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
        firstLoadRef.current = true;
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

  // ================= HELPER: MEMBER INFO =================
  const getMemberInfo = (memberId) => {
    if (memberId === currentUser._id) {
      return `You – ${currentUser.email}`;
    }

    const user = users.find((u) => u._id === memberId);
    if (!user) return "Unknown User";

    const name =
      user.name && user.name.trim() !== "" ? user.name : "No Name";

    return `${name} – ${user.email}`;
  };

  // ================= HEADER =================
  const headerContent = useMemo(() => {
    if (!currentChat) return null;

    // ===== GROUP CHAT HEADER =====
    if (currentChat.isGroup) {
      return (
        <div className="flex flex-col w-full">
          <div className="flex justify-between items-start">
            <div className="truncate">
              <h3 className="font-semibold truncate">
                {currentChat.name}
              </h3>
              <p className="text-[10px] text-gray-500">
                {currentChat.members?.length || 0} members
              </p>
            </div>

            <button
              type="button"
              onClick={async () => {
                const ok = window.confirm("Bạn có chắc muốn rời nhóm?");
                if (!ok) return;

                await leaveGroupChat(
                  currentChat._id,
                  currentUser._id
                );

                setChatRooms((prev) =>
                  prev.filter(
                    (room) => room._id !== currentChat._id
                  )
                );

                setCurrentChat(null);
              }}
              className="bg-red-500 text-white px-2 py-1 text-xs rounded"
            >
              Leave
            </button>
          </div>

          {/* ===== MEMBER LIST ===== */}
          <div className="mt-2 flex flex-wrap gap-1">
            {currentChat.members.map((memberId) => (
              <span
                key={memberId}
                className={`text-[10px] px-2 py-1 rounded-full border ${
                  memberId === currentUser._id
                    ? "bg-blue-100 text-blue-600 border-blue-200"
                    : "bg-gray-100 text-gray-600 border-gray-200"
                }`}
              >
                {getMemberInfo(memberId)}
              </span>
            ))}
          </div>
        </div>
      );
    }

    // ===== 1-1 CHAT HEADER =====
    return (
      <Contact
        chatRoom={currentChat}
        currentUser={currentUser}
        onlineUsersId={onlineUsersId}
        users={users}
      />
    );
  }, [currentChat, users, onlineUsersId]);

  // ================= SOCKET JOIN / LEAVE =================
  useEffect(() => {
    if (!socket || !currentChat?._id) return;

    socket.emit("joinRoom", currentChat._id);

    return () => {
      socket.emit("leaveRoom", currentChat._id);
    };
  }, [socket, currentChat?._id]);

  // ================= SOCKET RECEIVE =================
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (data) => {
      if (data.chatRoomId !== currentChat?._id) return;

      setMessages((prev) => [
        ...prev,
        {
          _id: Date.now(),
          sender: data.senderId,
          message: data.message,
        },
      ]);
    };

    socket.on("getMessage", handleMessage);

    return () => socket.off("getMessage", handleMessage);
  }, [socket, currentChat]);

  // ================= SEND MESSAGE =================
  const handleFormSubmit = async (message) => {
    if (!message.trim()) return;

    const res = await sendMessage({
      chatRoomId: currentChat._id,
      sender: currentUser._id,
      message,
    });

    socket.emit("sendMessageInRoom", {
      chatRoomId: currentChat._id,
      senderId: currentUser._id,
      message,
    });

    setMessages((prev) => [...prev, res]);
  };

  // ================= RENDER =================
  return (
    <div className="h-full flex flex-col w-full bg-white">
      {/* HEADER */}
      <div className="flex items-center p-3 border-b bg-white shrink-0 shadow-sm">
        {/* BACK BUTTON (MOBILE) */}
        <button
          onClick={() => setCurrentChat(null)}
          className="lg:hidden mr-3 p-1 hover:bg-gray-100 rounded-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          {headerContent}
        </div>
      </div>

      {/* MESSAGES */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3"
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
      <div className="p-3 border-t bg-white shrink-0">
        <ChatForm handleFormSubmit={handleFormSubmit} />
      </div>
    </div>
  );
}
