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

  const currentChatIdRef = useRef(null);
  const hasAutoScrolledRef = useRef(false);

  const {
    getMessagesOfChatRoom,
    sendMessage,
    leaveGroupChat,
  } = useApi();

  // ================= UPDATE ROOM =================
  useEffect(() => {
    currentChatIdRef.current = currentChat?._id || null;
    hasAutoScrolledRef.current = false;
  }, [currentChat?._id]);

  // ================= SCROLL =================
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, []);

  // ================= FETCH MESSAGES =================
  useEffect(() => {
    if (!currentChat?._id) {
      setMessages([]);
      return;
    }

    let mounted = true;

    const fetchMessages = async () => {
      try {
        const res = await getMessagesOfChatRoom(currentChat._id);
        if (!mounted) return;

        setMessages(res || []);
        requestAnimationFrame(() => {
          if (!hasAutoScrolledRef.current) {
            scrollToBottom();
            hasAutoScrolledRef.current = true;
          }
        });
      } catch (err) {
        console.error("Fetch messages error:", err);
      }
    };

    fetchMessages();
    return () => (mounted = false);
  }, [currentChat?._id, getMessagesOfChatRoom, scrollToBottom]);

  // ================= SOCKET RECEIVE =================
  useEffect(() => {
    if (!socket?.current) return;

    const handleGetMessage = (data) => {
      if (
        data.chatRoomId === currentChatIdRef.current &&
        data.senderId !== currentUser._id
      ) {
        setMessages((prev) => [
          ...prev,
          {
            _id: `temp-${Date.now()}`,
            sender: data.senderId,
            message: data.message,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    };

    socket.current.on("getMessage", handleGetMessage);
    return () => socket.current.off("getMessage", handleGetMessage);
  }, [socket, currentUser._id]);

  // ================= SEND MESSAGE =================
  const handleFormSubmit = async (message) => {
    if (!message.trim() || !currentChat?._id) return;

    socket.current.emit("sendMessage", {
      senderId: currentUser._id,
      chatRoomId: currentChat._id,
      message,
    });

    try {
      const res = await sendMessage({
        chatRoomId: currentChat._id,
        sender: currentUser._id,
        message,
        isRead: false,
      });

      setMessages((prev) => [...prev, res]);
      scrollToBottom();
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  // ================= LEAVE GROUP (FINAL FIX) =================
  const handleLeaveGroup = async () => {
    if (!currentChat?.isGroup) return;

    if (!window.confirm("Are you sure you want to leave this group?")) return;

    try {
      await leaveGroupChat(currentChat._id, currentUser._id);

      setChatRooms((prev) =>
        prev.filter((r) => r._id !== currentChat._id)
      );

      setCurrentChat(null);
    } catch (err) {
      console.error("Leave group error:", err);
      alert("Failed to leave group");
    }
  };

  // ================= HEADER =================
  const memoizedHeader = useMemo(() => {
    if (!currentChat) return null;

    if (currentChat.isGroup) {
      return (
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg">
              {currentChat.name}
            </h3>
            <p className="text-xs text-gray-500">
              {currentChat.members.length} members
            </p>
          </div>

          <button
            onClick={handleLeaveGroup}
            className="text-sm font-semibold text-white bg-red-500 px-4 py-1.5 rounded-lg hover:bg-red-600 active:scale-95 transition"
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
  }, [currentChat, currentUser, onlineUsersId]);

  return (
    <div className="lg:col-span-2 flex flex-col h-[600px] border-l">
      <div className="p-3 border-b bg-white">{memoizedHeader}</div>

      <div
        ref={chatContainerRef}
        className="flex-1 p-6 overflow-y-auto bg-white"
      >
        <ul className="space-y-4">
          {messages.map((msg) => (
            <Message
              key={msg._id}
              message={msg}
              self={currentUser._id}
              users={users}
              currentUser={currentUser}
            />
          ))}
        </ul>
      </div>

      <div className="p-3 border-t bg-white">
        <ChatForm handleFormSubmit={handleFormSubmit} />
      </div>
    </div>
  );
}
