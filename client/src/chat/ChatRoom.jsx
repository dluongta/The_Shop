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

  useEffect(() => {
    if (!currentChat?._id) return;
    const fetchMessages = async () => {
      try {
        const res = await getMessagesOfChatRoom(currentChat._id);
        setMessages(Array.isArray(res) ? res : []);
        firstLoadRef.current = true;
      } catch (err) { console.error(err); }
    };
    fetchMessages();
  }, [currentChat?._id]);

  useEffect(() => {
    if (!chatContainerRef.current) return;
    chatContainerRef.current.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: firstLoadRef.current ? "auto" : "smooth",
    });
    firstLoadRef.current = false;
  }, [messages]);

  // const handleFormSubmit = async (message) => {
  //   if (!message.trim()) return;
  //   try {
  //     const res = await sendMessage({ chatRoomId: currentChat._id, sender: currentUser._id, message, isRead: false });
  //     if (res) setMessages((prev) => [...prev, res]);
  //   } catch (err) { console.error(err); }
  // };

  const headerContent = useMemo(() => {
    if (!currentChat) return null;
    if (currentChat.isGroup) {
      return (
        <div className="flex justify-between items-center w-full">
          <div className="truncate">
            <h3 className="font-semibold truncate">{currentChat.name}</h3>
            <p className="text-[10px] text-gray-500">{currentChat.members?.length || 0} members</p>
          </div>
          <button onClick={() => {if(window.confirm("Leave?")) leaveGroupChat(currentChat._id, currentUser._id)}} className="bg-red-500 text-white px-2 py-1 text-xs rounded ml-2">Leave</button>
        </div>
      );
    }
    return <Contact chatRoom={currentChat} currentUser={currentUser} onlineUsersId={onlineUsersId} users={users} />;
  }, [currentChat, onlineUsersId]);
useEffect(() => {
  if (!socket || !currentChat?._id) return;

  socket.emit("joinRoom", currentChat._id);

  return () => {
    socket.emit("leaveRoom", currentChat._id);
  };
}, [socket, currentChat?._id]);
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

  return (
    <div className="h-full flex flex-col w-full bg-white">
      {/* CUSTOM ROOM HEADER WITH BACK BUTTON */}
      <div className="flex items-center p-3 border-b bg-white shrink-0 shadow-sm">
        {/* Nút Back chỉ hiện trên Mobile */}
        <button 
          onClick={() => setCurrentChat(null)}
          className="lg:hidden mr-3 p-1 hover:bg-gray-100 rounded-full"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">{headerContent}</div>
      </div>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
        {messages.map((m) => m?._id && <Message key={m._id} message={m} self={currentUser._id} users={users} />)}
      </div>

      <div className="p-3 border-t bg-white shrink-0">
        <ChatForm handleFormSubmit={handleFormSubmit} />
      </div>
    </div>
  );
}