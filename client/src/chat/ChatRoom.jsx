import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useApi } from "../services/ChatService";
import Message from "./Message";
import Contact from "./Contact";
import ChatForm from "./ChatForm";

export default function ChatRoom({
  currentChat,
  currentUser,
  socket,
  users,
  onlineUsersId,
}) {
  const [messages, setMessages] = useState([]);
  const chatContainerRef = useRef(null);

  const currentChatIdRef = useRef(null);
  const hasAutoScrolledRef = useRef(false);

  const { getMessagesOfChatRoom, sendMessage } = useApi();

  // ================== UPDATE ROOM ==================
  useEffect(() => {
    currentChatIdRef.current = currentChat?._id || null;
    hasAutoScrolledRef.current = false;
  }, [currentChat?._id]);

  // ================== SCROLL ==================
  const scrollToBottom = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  // ================== FETCH MESSAGES ==================
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

    return () => {
      mounted = false;
    };
  }, [currentChat?._id, getMessagesOfChatRoom, scrollToBottom]);

  // ================== SOCKET RECEIVE ==================
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
    return () => {
      socket.current.off("getMessage", handleGetMessage);
    };
  }, [socket, currentUser._id]);

  // ================== SEND MESSAGE ==================
  const handleFormSubmit = async (message) => {
    if (!message.trim() || !currentChat?._id) return;

    const receiverId = currentChat.members.find(
      (m) => m !== currentUser._id
    );

    socket.current.emit("sendMessage", {
      senderId: currentUser._id,
      receiverId,
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

  // ================== HEADER ==================
  const memoizedHeader = useMemo(() => {
    if (!currentChat) return null;

    // ✅ GROUP CHAT
    if (currentChat.isGroup) {
      return (
        <div>
          <h3 className="font-semibold text-lg">
            {currentChat.name}
          </h3>
          <p className="text-xs text-gray-500">
            {currentChat.members.length} members
          </p>
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
      {/* HEADER */}
      <div className="p-3 border-b bg-white">
        {memoizedHeader}
      </div>

      {/* MESSAGES */}
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

      {/* INPUT */}
      <div className="p-3 border-t bg-white">
        <ChatForm handleFormSubmit={handleFormSubmit} />
      </div>
    </div>
  );
}
