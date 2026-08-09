import { useState, useEffect, useMemo, useRef } from "react";
import { useApi } from "../services/ChatService";
import Message from "./Message";
import Contact from "./Contact";
import ChatForm from "./ChatForm";

// Hàm tính toán thời gian
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
  const [showSettings, setShowSettings] = useState(false); // Trạng thái mở menu cài đặt nhóm

  // State cho Modal thêm thành viên
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);

  const scrollRef = useRef(null);
  const {
    getMessagesOfChatRoom, sendMessage, leaveGroupChat, revokeMessageApi,
    kickMemberApi, addMembersToGroupApi, dissolveGroupApi
  } = useApi();

  // Kiểm tra xem user hiện tại có phải Nhóm trưởng không
  const isAdmin = currentChat?.admin === currentUser._id;

  // ================= HÀM XỬ LÝ QUẢN LÝ NHÓM =================
  const handleKick = async (memberId) => {
    if (window.confirm("Bạn có chắc muốn xóa thành viên này khỏi nhóm?")) {
      try {
        await kickMemberApi(currentChat._id, currentUser._id, memberId);
        setCurrentChat(prev => ({ ...prev, members: prev.members.filter(id => id !== memberId) }));
      } catch (error) {
        alert("Có lỗi xảy ra khi xóa thành viên!");
      }
    }
  };

  const handleDissolve = async () => {
    if (window.confirm("Bạn có chắc chắn muốn giải tán nhóm vĩnh viễn? Hành động này không thể hoàn tác.")) {
      try {
        await dissolveGroupApi(currentChat._id, currentUser._id);
        setChatRooms((prev) => prev.filter((room) => room._id !== currentChat._id));
        setCurrentChat(null);
      } catch (error) {
        alert("Có lỗi xảy ra khi giải tán nhóm!");
      }
    }
  };

  // Mở modal thêm thành viên
  const handleOpenAddMemberModal = () => {
    setShowAddMemberModal(true);
    setShowSettings(false); // Ẩn menu cài đặt đi
    setMemberSearchTerm("");
    setSelectedNewMembers([]);
  };

  // Gửi API thêm thành viên đã chọn
  const submitAddMembers = async () => {
    if (selectedNewMembers.length === 0) {
      return alert("Vui lòng chọn ít nhất 1 thành viên để thêm!");
    }

    try {
      await addMembersToGroupApi(currentChat._id, currentUser._id, selectedNewMembers);
      setCurrentChat(prev => ({ ...prev, members: [...prev.members, ...selectedNewMembers] }));
      setShowAddMemberModal(false);
      setSelectedNewMembers([]);
    } catch (error) {
      alert("Có lỗi xảy ra khi thêm thành viên!");
    }
  };

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
    setShowSettings(false); // Reset popup menu khi đổi nhóm
  }, [currentChat?._id]);

  // ================= 2. HEADER =================
  const headerContent = useMemo(() => {
    if (!currentChat) return null;

    // NẾU LÀ NHÓM CHAT
    // NẾU LÀ NHÓM CHAT
    if (currentChat.isGroup) {
      return (
        <div className="flex flex-col w-full relative">
          <div className="flex justify-between items-center">
            {/* Đã thêm justify-center, leading-none và margin-bottom để ép sát và căn giữa */}
            <div className="flex flex-col justify-center">
              <h3 className="font-semibold truncate text-[17px] text-gray-800 leading-none mb-1.5">
                {currentChat.name}
              </h3>
              <span className="text-[13px] text-gray-500 leading-none -translate-y-1.5">
                {currentChat.members?.length || 0} thành viên
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 px-3 py-1.5 text-sm rounded-md font-medium border"
              >
                Cài đặt nhóm
              </button>
            </div>
          </div>

          {/* ... (Phần Popup showSettings giữ nguyên bên dưới) ... */}
          {showSettings && (
            <div className="absolute right-0 top-12 w-64 bg-white shadow-xl border rounded p-4 z-50">
              <h4 className="font-bold mb-2 text-sm text-gray-800">Thành viên</h4>
              <ul className="max-h-40 overflow-y-auto mb-3">
                {currentChat.members.map(memberId => {
                  const member = users.find(u => u._id === memberId);
                  const isMemberAdmin = currentChat.admin === memberId;

                  return (
                    <li key={memberId} className="flex justify-between items-center text-sm py-1.5 border-b last:border-0">
                      <span className="truncate flex items-center gap-1">
                        {member?.email || "Unknown"}
                        {isMemberAdmin && (
                          <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded ml-1 whitespace-nowrap">
                            Trưởng nhóm
                          </span>
                        )}
                      </span>
                      {isAdmin && !isMemberAdmin && (
                        <button
                          onClick={() => handleKick(memberId)}
                          className="text-red-500 hover:text-red-700 text-xs ml-2 shrink-0 font-medium"
                        >
                          Xóa
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>

              {isAdmin && (
                <div className="flex flex-col gap-2 mt-3 border-t pt-3">
                  <button onClick={handleOpenAddMemberModal} className="bg-blue-500 hover:bg-blue-600 text-white text-xs py-1.5 rounded w-full transition-colors">
                    + Thêm thành viên
                  </button>
                  <button onClick={handleDissolve} className="bg-red-600 hover:bg-red-700 text-white text-xs py-1.5 rounded w-full transition-colors">
                    Giải tán nhóm
                  </button>
                </div>
              )}

              {!isAdmin && (
                <div className="mt-3 border-t pt-3">
                  <button
                    onClick={async () => {
                      if (window.confirm("Bạn có chắc muốn rời nhóm?")) {
                        await leaveGroupChat(currentChat._id, currentUser._id);
                        setChatRooms((prev) => prev.filter((room) => room._id !== currentChat._id));
                        setCurrentChat(null);
                      }
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white text-xs py-1.5 rounded w-full transition-colors"
                  >
                    Rời khỏi nhóm
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    // NẾU LÀ CHAT 1-1
    const otherUserId = currentChat.members.find(id => id !== currentUser._id);
    const otherUser = users.find(u => u._id === otherUserId);
    const isOnline = onlineUsersId.includes(otherUserId);

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
  }, [currentChat, users, onlineUsersId, currentUser, showSettings, isAdmin]);

  // Lọc user cho Modal thêm thành viên (những người CHƯA CÓ trong nhóm)
  const availableUsersToAdd = useMemo(() => {
    if (!currentChat) return [];
    return users.filter(u =>
      !currentChat.members.includes(u._id) &&
      (
        u.email.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
        (u.name && u.name.toLowerCase().includes(memberSearchTerm.toLowerCase()))
      )
    );
  }, [users, currentChat, memberSearchTerm]);

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
    <div className="flex flex-col w-full h-full overflow-hidden bg-white relative">

      {/* HEADER */}
      <div className="flex items-center p-3 px-4 border-b bg-white shrink-0 z-10 h-[76px] relative">
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

      {/* MODAL THÊM THÀNH VIÊN */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60]">
          <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full m-4">
            <h2 className="text-xl font-bold mb-4">Thêm thành viên</h2>

            <input
              value={memberSearchTerm}
              onChange={(e) => setMemberSearchTerm(e.target.value)}
              placeholder="Tìm kiếm bằng email hoặc tên..."
              className="border border-gray-300 rounded px-3 py-2 w-full mb-2 focus:outline-none focus:border-blue-500"
            />

            <div className="max-h-64 overflow-y-auto mb-4 border border-gray-200 rounded p-2">
              {availableUsersToAdd.length > 0 ? (
                availableUsersToAdd.map((u) => (
                  <label key={u._id} className="flex items-center mb-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                    <input
                      type="checkbox"
                      checked={selectedNewMembers.includes(u._id)}
                      onChange={() => {
                        setSelectedNewMembers((prev) =>
                          prev.includes(u._id) ? prev.filter((id) => id !== u._id) : [...prev, u._id]
                        );
                      }}
                      className="mr-3 cursor-pointer h-4 w-4"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-gray-800">
                        {u.name || u.email.split("@")[0]}
                      </span>
                      <span className="text-xs text-gray-500">{u.email}</span>
                    </div>
                  </label>
                ))
              ) : (
                <div className="text-gray-500 text-center py-4 text-sm">
                  Không tìm thấy người dùng phù hợp.
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setSelectedNewMembers([]);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Hủy
              </button>
              <button
                onClick={submitAddMembers}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Thêm vào nhóm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}