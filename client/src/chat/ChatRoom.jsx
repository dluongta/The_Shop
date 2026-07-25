import { useState, useEffect, useMemo, useRef } from "react";
import { useApi } from "../services/ChatService";
import Message from "./Message";
import Contact from "./Contact";
import ChatForm from "./ChatForm";

export default function ChatRoom({
  currentChat, setCurrentChat, setChatRooms, currentUser, socket, users, onlineUsersId,
}) {
  const [messages, setMessages] = useState([]);
  
  // Thêm state để quản lý giới hạn số lượng tin nhắn hiển thị trên màn hình
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
        
        // Reset lại số lượng hiển thị bằng 10 mỗi khi đổi phòng chat
        setVisibleCount(10);
      } catch (err) {
        console.error("Lỗi khi tải tin nhắn:", err);
      }
    };

    fetchMessages();
  }, [currentChat?._id]);

  // ================= 2. HEADER =================
  const getMemberInfo = (memberId) => {
    if (memberId === currentUser._id) return `You – ${currentUser.email}`;
    const user = users.find((u) => u._id === memberId);
    if (!user) return "Unknown User";
    const name = user.name && user.name.trim() !== "" ? user.name : "No Name";
    return `${name} – ${user.email}`;
  };

  const headerContent = useMemo(() => {
    if (!currentChat) return null;
    if (currentChat.isGroup) {
      return (
        <div className="flex flex-col w-full">
          <div className="flex justify-between items-start">
            <div className="truncate">
              <h3 className="font-semibold truncate">{currentChat.name}</h3>
              <p className="text-[10px] text-gray-500">{currentChat.members?.length || 0} members</p>
            </div>
            <button
              onClick={async () => {
                if (window.confirm("Bạn có chắc muốn rời nhóm?")) {
                  await leaveGroupChat(currentChat._id, currentUser._id);
                  setChatRooms((prev) => prev.filter((room) => room._id !== currentChat._id));
                  setCurrentChat(null);
                }
              }}
              className="bg-red-500 text-white px-2 py-1 text-xs rounded"
            >
              Leave
            </button>
          </div>
        </div>
      );
    }
    return <Contact chatRoom={currentChat} currentUser={currentUser} onlineUsersId={onlineUsersId} users={users} />;
  }, [currentChat, users, onlineUsersId]);

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
      
      // Khi có tin nhắn mới, tăng giới hạn hiển thị lên 1 để tin nhắn cũ không bị đẩy mất khỏi danh sách đang xem
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
      
      // Tăng số lượng hiển thị thêm 1 vì có thêm 1 tin nhắn mới
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
    
    // Nếu người dùng cuộn xuống gần cuối màn hình (cách đáy khoảng 20px)
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      if (visibleCount < messages.length) {
        setVisibleCount((prev) => prev + 10); // Tăng giới hạn lên thêm 10 tin nhắn
      }
    }
  };

  // Cắt mảng tin nhắn dựa trên số lượng limit hiện tại
  const visibleMessages = messages.slice(0, visibleCount);

  // ================= RENDER =================
  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-white">
      
      {/* HEADER */}
      <div className="flex items-center p-3 border-b bg-white shrink-0 z-10">
        <button onClick={() => setCurrentChat(null)} className="lg:hidden mr-3 p-1 hover:bg-gray-100 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">{headerContent}</div>
      </div>

      {/* KHUNG TIN NHẮN */}
      <div 
        ref={scrollRef} 
        onScroll={handleScroll} // Bổ sung sự kiện onScroll
        className="flex-1 min-h-0 overflow-y-auto bg-gray-50 p-4"
      >
        <div className="flex flex-col gap-3">
          {visibleMessages.map((m) => ( // Render mảng tin nhắn đã giới hạn
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
          {/* Hiển thị dòng text nếu đang load thêm hoặc đã hết tin */}
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