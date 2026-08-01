import { useState, useEffect, useMemo, useRef } from "react";
import { useApi } from "../services/ChatService";
import Message from "./Message";
import Contact from "./Contact";
import ChatForm from "./ChatForm";

// Thêm hàm tính toán thời gian ở ngoài component
const timeAgo = (date) => {
  if (!date) return "";
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " năm trước";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " tháng trước";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " ngày trước";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " giờ trước";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " phút trước";
  return "vừa xong";
};

export default function ChatRoom({
  currentChat, setCurrentChat, setChatRooms, currentUser, socket, users, onlineUsersId,
}) {
  const [messages, setMessages] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10); 
  
  const scrollRef = useRef(null);
  const { getMessagesOfChatRoom, sendMessage, leaveGroupChat, revokeMessageApi } = useApi();

  // ================= 1. TẢI TẤT CẢ TIN NHẮN =================
  useEffect(() => {
    if (!currentChat?._id) return;

    const fetchMessages = async () => {
      try {
        const res = await getMessagesOfChatRoom(currentChat._id);
        const data = Array.isArray(res) ? res : [];
        setMessages(data);
        setVisibleCount(10);
      } catch (err) {
        console.error("Lỗi khi tải tin nhắn:", err);
      }
    };

    fetchMessages();
  }, [currentChat?._id]);

  // ================= 2. HEADER =================
  const headerContent = useMemo(() => {
    if (!currentChat) return null;
    
    // NẾU LÀ NHÓM CHAT
    if (currentChat.isGroup) {
      return (
        <div className="flex flex-col w-full">
          <div className="flex justify-between items-start">
            <div className="truncate">
              <h3 className="font-semibold truncate text-lg text-gray-800">{currentChat.name}</h3>
              <p className="text-xs text-gray-500">{currentChat.members?.length || 0} members</p>
            </div>
            <button
              onClick={async () => {
                if (window.confirm("Bạn có chắc muốn rời nhóm?")) {
                  await leaveGroupChat(currentChat._id, currentUser._id);
                  setChatRooms((prev) => prev.filter((room) => room._id !== currentChat._id));
                  setCurrentChat(null);
                }
              }}
              className="bg-red-500 hover:bg-red-600 transition-colors text-white px-3 py-1.5 text-xs rounded font-medium"
            >
              Leave
            </button>
          </div>
        </div>
      );
    }
    
    // NẾU LÀ CHAT 1-1
    const otherUserId = currentChat.members.find(id => id !== currentUser._id);
    const otherUser = users.find(u => u._id === otherUserId);
    const isOnline = onlineUsersId.includes(otherUserId);
    
    // Lấy tên hiển thị
    let displayName = "Unknown User";
    if (otherUser) {
      displayName = otherUser.name && otherUser.name.trim() !== "" ? otherUser.name : otherUser.email;
    }

    return (
      <div className="flex items-center gap-3">
        <Contact 
          chatRoom={currentChat} 
          currentUser={currentUser} 
          onlineUsersId={onlineUsersId} 
          users={users} 
        />
        <div className="flex flex-col truncate">
          <span className="font-semibold text-gray-900 text-[15px] truncate">
            {displayName}
          </span>
          <span className="text-xs text-gray-500 truncate mt-0.5">
            {isOnline ? (
              <span className="text-green-500 font-medium">Đang hoạt động</span>
            ) : otherUser?.lastSeen ? (
              `Hoạt động ${timeAgo(otherUser.lastSeen)}`
            ) : (
              "Ngoại tuyến"
            )}
          </span>
        </div>
      </div>
    );
  }, [currentChat, users, onlineUsersId, currentUser]);

  // ================= 3. SOCKET NHẬN TIN NHẮN =================
  useEffect(() => {
    if (!socket || !currentChat?._id) return;
    socket.emit("joinRoom", currentChat._id);

    const handleMessage = (data) => {
      if (data.chatRoomId !== currentChat?._id) return;

      setMessages((prev) => {
        if (prev.some((m) => m._id === data._id)) return prev;
        return [
          {
            _id: data._id || Date.now(),
            sender: data.senderId,
            message: data.message,
            isDeleted: false,
            createdAt: data.createdAt || new Date()
          },
          ...prev
        ];
      });
      
      setVisibleCount((prev) => prev + 1);

      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    const handleRevoke = (data) => {
      if (data.chatRoomId !== currentChat?._id) return;
      setMessages((prev) => prev.map((m) => (m._id === data.messageId ? { ...m, isDeleted: true } : m)));
    };

    socket.on("getMessage", handleMessage);
    socket.on("messageRevoked", handleRevoke);

    return () => {
      socket.emit("leaveRoom", currentChat._id);
      socket.off("getMessage", handleMessage);
      socket.off("messageRevoked", handleRevoke);
    };
  }, [socket, currentChat]);

  // ================= 4. GỬI & THU HỒI TIN NHẮN =================
  const handleFormSubmit = async (message) => {
    if (!message.trim()) return;
    try {
      const res = await sendMessage({ chatRoomId: currentChat._id, sender: currentUser._id, message });
      if (!res || !res._id) return;

      socket.emit("sendMessageInRoom", {
        _id: res._id, chatRoomId: currentChat._id, senderId: currentUser._id, message, createdAt: res.createdAt
      });

      setMessages((prev) => [res, ...prev]);
      setVisibleCount((prev) => prev + 1); 

      setChatRooms((prev) =>
        prev.map((room) =>
          room._id === currentChat._id
            ? { ...room, lastMessage: { sender: currentUser._id, message: res.message, isRead: false, createdAt: res.createdAt || new Date().toISOString() } }
            : room
        )
      );

      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 50);
      
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
    }
  };

  const handleRevokeMessage = async (messageId) => {
    try {
      await revokeMessageApi(messageId, currentUser._id);
      setMessages((prev) => {
        const updatedMessages = prev.map((m) => m._id === messageId ? { ...m, isDeleted: true } : m);
        const latestMsg = updatedMessages[0];

        if (latestMsg) {
          setChatRooms((prevRooms) => prevRooms.map((room) =>
            room._id === currentChat._id
              ? { ...room, lastMessage: { ...room.lastMessage, message: latestMsg.isDeleted ? "Tin nhắn bị thu hồi" : latestMsg.message, sender: latestMsg.sender, createdAt: latestMsg.createdAt } }
              : room
          ));
        }
        return updatedMessages;
      });
    } catch (error) {
      alert("Không thể thu hồi tin nhắn.");
    }
  };

  // ================= 5. HÀM XỬ LÝ CUỘN ĐỂ LOAD THÊM TIN NHẮN =================
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      if (visibleCount < messages.length) {
        setVisibleCount((prev) => prev + 10);
      }
    }
  };

  const visibleMessages = messages.slice(0, visibleCount);

  // ================= RENDER =================
  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-white">
      
      {/* HEADER */}
      <div className="flex items-center p-3 border-b bg-white shrink-0 z-10 min-h-[64px]">
        <button onClick={() => setCurrentChat(null)} className="lg:hidden mr-3 p-2 hover:bg-gray-100 rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">{headerContent}</div>
      </div>

      {/* KHUNG TIN NHẮN */}
      <div 
        ref={scrollRef} 
        onScroll={handleScroll} 
        className="flex-1 min-h-0 overflow-y-auto bg-gray-50 p-4"
      >
        <div className="flex flex-col gap-3">
          {visibleMessages.map((m) => ( 
            m?._id && (
              <Message
                key={m._id}
                message={m}
                self={currentUser._id}
                users={users}
                onRevoke={handleRevokeMessage}
              />
            )
          ))}
          {visibleCount < messages.length ? (
             <div className="text-center text-xs text-gray-400 my-2">Cuộn xuống để xem thêm...</div>
          ) : (
             messages.length > 0 && <div className="text-center text-xs text-gray-400 my-2">Đã hết tin nhắn</div>
          )}
        </div>
      </div>

      {/* INPUT FORM */}
      <div className="p-3 border-t bg-white shrink-0 z-10">
        <ChatForm handleFormSubmit={handleFormSubmit} />
      </div>
    </div>
  );
}