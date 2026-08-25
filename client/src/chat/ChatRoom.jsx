import { useState, useEffect, useMemo, useRef } from "react";
import { useApi } from "../services/ChatService";
import Message from "./Message";
import Contact from "./Contact";
import ChatForm from "./ChatForm";

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

const getUserString = (user) => {
  if (!user) return "Ai đó";
  const name = user.name && user.name.trim() !== "" ? user.name : (user.email?.split("@")[0] || "Ai đó");
  return user.email ? `${name} (${user.email})` : name;
};

export default function ChatRoom({
  currentChat, setCurrentChat, setChatRooms, currentUser, socket, users, onlineUsersId,
}) {
  const [messages, setMessages] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [showSettings, setShowSettings] = useState(false);

  const [typingUsers, setTypingUsers] = useState([]);
  
  // === STATE QUẢN LÝ NÚT CUỘN LÊN ===
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [hasNewMessageIndicator, setHasNewMessageIndicator] = useState(false);

  const settingsRef = useRef(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);

  const scrollRef = useRef(null);
  const {
    getMessagesOfChatRoom, sendMessage, leaveGroupChat, revokeMessageApi,
    kickMemberApi, addMembersToGroupApi, dissolveGroupApi, transferAdminApi,
    addDeputyApi, removeDeputyApi, acceptGroupInviteApi, rejectGroupInviteApi,
    acceptPrivateChatApi, rejectPrivateChatApi
  } = useApi();

  const isAdmin = currentChat?.admin === currentUser._id;
  const isDeputy = currentChat?.deputies?.includes(currentUser._id);

  const isPendingMember = currentChat?.pendingMembers?.includes(currentUser._id);

  const isPendingPrivate = currentChat?.isGroup === false && currentChat?.isAccepted === false;
  const isReceiverOfPrivate = isPendingPrivate && currentChat?.requester !== currentUser._id;
  const isRequesterOfPrivate = isPendingPrivate && currentChat?.requester === currentUser._id;

  const requesterMessageCount = messages.filter(m => m.sender === currentUser._id && (!m.message || !m.message.startsWith("[SYS]:"))).length;
  const remainingMessages = Math.max(0, 10 - requesterMessageCount);

  const availableUsersToAdd = useMemo(() => {
    if (!currentChat) return [];
    return users.filter(u =>
      !currentChat.members.includes(u._id) &&
      (!currentChat.pendingMembers || !currentChat.pendingMembers.includes(u._id)) &&
      (u.email.toLowerCase().includes(memberSearchTerm.toLowerCase()) || (u.name && u.name.toLowerCase().includes(memberSearchTerm.toLowerCase())))
    );
  }, [users, currentChat, memberSearchTerm]);

  const handleFormSubmit = async (message) => {
    if (!message.trim()) return;

    if (isRequesterOfPrivate && remainingMessages <= 0) {
      alert("Bạn đã gửi tối đa 10 tin nhắn! Vui lòng chờ đối phương xác nhận để tiếp tục chat.");
      return;
    }

    try {
      const res = await sendMessage({ chatRoomId: currentChat._id, sender: currentUser._id, message });
      if (!res || !res._id) return;

      socket.emit("sendMessageInRoom", {
        _id: res._id, chatRoomId: currentChat._id, senderId: currentUser._id,
        senderEmail: currentUser.name || currentUser.email, message, createdAt: res.createdAt,
        isGroup: currentChat.isGroup, roomName: currentChat.name
      });

      setMessages((prev) => [res, ...prev]);
      setVisibleCount((prev) => prev + 1);
      setChatRooms((prev) => prev.map((room) => room._id === currentChat._id ? { ...room, lastMessage: { sender: currentUser._id, message: res.message, isRead: false, createdAt: res.createdAt || new Date().toISOString() } } : room));
      
      // Tự mình gửi tin thì chắc chắn phải cuộn lên
      setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: "smooth" }); }, 50);
    } catch (error) { console.error("Lỗi gửi tin nhắn:", error); }
  };

  const handleTyping = () => {
    if (!socket || !currentChat?._id) return;
    socket.emit("typing", {
      chatRoomId: currentChat._id,
      senderId: currentUser._id,
      senderName: currentUser.name || currentUser.email.split("@")[0]
    });
  };

  const handleStopTyping = () => {
    if (!socket || !currentChat?._id) return;
    socket.emit("stopTyping", {
      chatRoomId: currentChat._id,
      senderId: currentUser._id
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleKick = async (memberId) => {
    if (window.confirm("Bạn có chắc muốn xóa/hủy mời thành viên này?")) {
      try {
        await kickMemberApi(currentChat._id, currentUser._id, memberId);

        setCurrentChat(prev => {
          const newMembers = prev.members.filter(id => id !== memberId);
          const newPending = prev.pendingMembers ? prev.pendingMembers.filter(id => id !== memberId) : [];
          const newDeputies = prev.deputies ? prev.deputies.filter(id => id !== memberId) : [];
          return { ...prev, members: newMembers, pendingMembers: newPending, deputies: newDeputies };
        });

        const member = users.find(u => u._id === memberId);
        const actorString = getUserString(currentUser);
        const targetString = getUserString(member);
        await handleFormSubmit(`[SYS]: ${actorString} đã xóa ${targetString} khỏi nhóm.`);
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

  const handleTransferAdmin = async (newAdminId) => {
    if (window.confirm("Bạn có chắc chắn muốn chuyển quyền Trưởng nhóm? Bạn sẽ được chuyển xuống làm Phó nhóm.")) {
      try {
        await transferAdminApi(currentChat._id, currentUser._id, newAdminId);
        setCurrentChat(prev => {
          let newDeputies = prev.deputies ? prev.deputies.filter(id => id !== newAdminId) : [];
          if (!newDeputies.includes(currentUser._id)) newDeputies.push(currentUser._id);
          return { ...prev, admin: newAdminId, deputies: newDeputies };
        });
        setChatRooms(prev => prev.map(room => {
          if (room._id === currentChat._id) {
            let newDeputies = room.deputies ? room.deputies.filter(id => id !== newAdminId) : [];
            if (!newDeputies.includes(currentUser._id)) newDeputies.push(currentUser._id);
            return { ...room, admin: newAdminId, deputies: newDeputies };
          }
          return room;
        }));

        const newAdmin = users.find(u => u._id === newAdminId);
        const actorString = getUserString(currentUser);
        const targetString = getUserString(newAdmin);
        await handleFormSubmit(`[SYS]: ${actorString} đã chuyển quyền Trưởng nhóm cho ${targetString}.`);
      } catch (error) {
        alert("Có lỗi xảy ra khi chuyển quyền!");
      }
    }
  };

  const handleAddDeputy = async (memberId) => {
    if (window.confirm("Bạn muốn bổ nhiệm thành viên này làm Phó nhóm?")) {
      try {
        await addDeputyApi(currentChat._id, currentUser._id, memberId);
        setCurrentChat(prev => ({ ...prev, deputies: [...(prev.deputies || []), memberId] }));

        const member = users.find(u => u._id === memberId);
        const actorString = getUserString(currentUser);
        const targetString = getUserString(member);
        await handleFormSubmit(`[SYS]: ${actorString} đã bổ nhiệm ${targetString} làm Phó nhóm.`);
      } catch (error) { alert("Có lỗi xảy ra!"); }
    }
  };

  const handleRemoveDeputy = async (memberId) => {
    if (window.confirm("Bạn muốn gỡ quyền Phó nhóm của thành viên này?")) {
      try {
        await removeDeputyApi(currentChat._id, currentUser._id, memberId);
        setCurrentChat(prev => ({ ...prev, deputies: prev.deputies.filter(id => id !== memberId) }));

        const member = users.find(u => u._id === memberId);
        const actorString = getUserString(currentUser);
        const targetString = getUserString(member);
        await handleFormSubmit(`[SYS]: ${actorString} đã gỡ quyền Phó nhóm của ${targetString}.`);
      } catch (error) { alert("Có lỗi xảy ra!"); }
    }
  };

  const handleOpenAddMemberModal = () => {
    setShowAddMemberModal(true);
    setShowSettings(false);
    setMemberSearchTerm("");
    setSelectedNewMembers([]);
  };

  const submitAddMembers = async () => {
    if (selectedNewMembers.length === 0) return alert("Vui lòng chọn ít nhất 1 thành viên để mời!");
    try {
      await addMembersToGroupApi(currentChat._id, currentUser._id, selectedNewMembers);

      setCurrentChat(prev => ({
        ...prev,
        pendingMembers: [...(prev.pendingMembers || []), ...selectedNewMembers]
      }));

      const actorString = getUserString(currentUser);
      const addedStrings = selectedNewMembers.map(id => {
        const u = users.find(user => user._id === id);
        return getUserString(u);
      }).join(", ");

      await handleFormSubmit(`[SYS]: ${actorString} đã gửi lời mời tham gia nhóm cho ${addedStrings}.`);
      setShowAddMemberModal(false);
      setSelectedNewMembers([]);
    } catch (error) {
      alert("Có lỗi xảy ra khi mời thành viên!");
    }
  };

  const handleAcceptInvite = async () => {
    try {
      const updatedRoom = await acceptGroupInviteApi(currentChat._id, currentUser._id);
      setCurrentChat(updatedRoom);
      setChatRooms(prev => prev.map(r => r._id === currentChat._id ? updatedRoom : r));
      await handleFormSubmit(`[SYS]: ${getUserString(currentUser)} đã chấp nhận tham gia nhóm.`);
    } catch (err) {
      alert("Không thể tham gia nhóm");
    }
  };

  const handleRejectInvite = async () => {
    if (window.confirm("Bạn có chắc muốn từ chối lời mời vào nhóm này?")) {
      try {
        const actorString = getUserString(currentUser);
        await handleFormSubmit(`[SYS]: ${actorString} đã từ chối tham gia nhóm.`);
        await rejectGroupInviteApi(currentChat._id, currentUser._id);
        setCurrentChat(null);
        setChatRooms(prev => prev.filter(r => r._id !== currentChat._id));
      } catch (err) {
        alert("Lỗi khi từ chối");
      }
    }
  };

  const handleAcceptPrivate = async () => {
    try {
      const updatedRoom = await acceptPrivateChatApi(currentChat._id);
      setCurrentChat(updatedRoom);
      setChatRooms(prev => prev.map(r => r._id === currentChat._id ? updatedRoom : r));

      const actorString = getUserString(currentUser);
      await handleFormSubmit(`[SYS]: ${actorString} đã đồng ý cuộc trò chuyện.`);
    } catch (err) {
      alert("Lỗi khi đồng ý!");
    }
  };

  const handleRejectPrivate = async () => {
    if (window.confirm("Bạn có chắc muốn từ chối và xóa cuộc trò chuyện này?")) {
      try {
        await rejectPrivateChatApi(currentChat._id);
        setCurrentChat(null);
        setChatRooms(prev => prev.filter(r => r._id !== currentChat._id));
      } catch (err) {
        alert("Lỗi khi từ chối!");
      }
    }
  };

  useEffect(() => {
    if (!currentChat?._id) return;

    setTypingUsers([]);
    setHasNewMessageIndicator(false);

    const fetchMessages = async () => {
      try {
        const res = await getMessagesOfChatRoom(currentChat._id);
        setMessages(Array.isArray(res) ? res : []);
        setVisibleCount(10);
      } catch (err) { console.error("Lỗi khi tải tin nhắn:", err); }
    };
    fetchMessages();
    setShowSettings(false);
  }, [currentChat?._id]);

  useEffect(() => {
    if (!socket || !currentChat?._id) return;
    socket.emit("joinRoom", currentChat._id);

    const handleMessage = (data) => {
      if (data.chatRoomId !== currentChat?._id) return;

      setTypingUsers((prev) => prev.filter((user) => user.senderId !== data.senderId));

      if (data.message && data.message.includes("đã đồng ý cuộc trò chuyện")) {
        setCurrentChat(prev => ({ ...prev, isAccepted: true }));
        setChatRooms(prevRooms => prevRooms.map(r => r._id === data.chatRoomId ? { ...r, isAccepted: true } : r));
      }

      setMessages((prev) => {
        if (prev.some((m) => m._id === data._id)) return prev;
        return [{ _id: data._id || Date.now(), sender: data.senderId, message: data.message, isDeleted: false, createdAt: data.createdAt || new Date() }, ...prev];
      });
      setVisibleCount((prev) => prev + 1);
      
      // Bật trạng thái tin nhắn mới nếu đang cuộn xuống dưới sâu
      if (scrollRef.current && scrollRef.current.scrollTop > 50) {
        setHasNewMessageIndicator(true);
      }
    };

    const handleRevoke = (data) => {
      if (data.chatRoomId !== currentChat?._id) return;
      setMessages((prev) => prev.map((m) => (m._id === data.messageId ? { ...m, isDeleted: true } : m)));
    };

    const onUserTyping = (data) => {
      setTypingUsers((prev) => {
        if (prev.some((u) => u.senderId === data.senderId)) return prev;
        return [...prev, data];
      });
    };

    const onUserStopTyping = (data) => {
      setTypingUsers((prev) => prev.filter((u) => u.senderId !== data.senderId));
    };

    socket.on("getMessage", handleMessage);
    socket.on("messageRevoked", handleRevoke);
    socket.on("userTyping", onUserTyping);
    socket.on("userStopTyping", onUserStopTyping);

    return () => {
      socket.emit("leaveRoom", currentChat._id);
      socket.off("getMessage", handleMessage);
      socket.off("messageRevoked", handleRevoke);
      socket.off("userTyping", onUserTyping);
      socket.off("userStopTyping", onUserStopTyping);
    };
  }, [socket, currentChat, setCurrentChat, setChatRooms]);

  const handleRevokeMessage = async (messageId) => {
    try {
      await revokeMessageApi(messageId, currentUser._id);
      setMessages((prev) => {
        const updatedMessages = prev.map((m) => m._id === messageId ? { ...m, isDeleted: true } : m);
        const latestMsg = updatedMessages[0];
        if (latestMsg) {
          setChatRooms((prevRooms) => prevRooms.map((room) => room._id === currentChat._id ? { ...room, lastMessage: { ...room.lastMessage, message: latestMsg.isDeleted ? "Tin nhắn bị thu hồi" : latestMsg.message, sender: latestMsg.sender, createdAt: latestMsg.createdAt } } : room));
        }
        return updatedMessages;
      });
    } catch (error) { alert("Không thể thu hồi tin nhắn."); }
  };

  // === XỬ LÝ SỰ KIỆN CUỘN ===
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

    // Hiện mũi tên LÊN khi cuộn xuống xa tin nhắn mới nhất
    setShowScrollTop(scrollTop > 120);

    // Xóa trạng thái tin mới khi đã cuộn lên tới cùng
    if (scrollTop < 50) {
      setHasNewMessageIndicator(false);
    }

    // Load thêm tin nhắn cũ (Infinite scroll)
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      if (visibleCount < messages.length) setVisibleCount((prev) => prev + 10);
    }
  };

  useEffect(() => {
    handleScroll();
  }, [messages.length, visibleCount]);

  const headerContent = useMemo(() => {
    if (!currentChat) return null;

    if (currentChat.isGroup) {
      const otherMembers = currentChat.members.filter(id => id !== currentUser._id);
      const isGroupOnline = otherMembers.some(id => onlineUsersId.includes(id));
      const groupLastActivity = messages.length > 0 ? messages[0].createdAt : currentChat.lastMessage?.createdAt;

      const allUsersInGroup = [...currentChat.members, ...(currentChat.pendingMembers || [])];

      return (
        <div className="flex justify-between items-center w-full">
          <div className="flex flex-col justify-center translate-y">
            <h3 className="font-semibold truncate text-[17px] text-gray-800 leading-none mb-1.5">
              {currentChat.name}
              {isPendingMember && <span className="ml-2 text-xs text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">Phòng chờ</span>}
            </h3>
            <span className="text-[13px] text-gray-500 leading-none translate-y-1">
              {currentChat.members?.length || 0} thành viên
              <span className="mx-1.5">•</span>
              {isGroupOnline ? <span className="text-green-500 font-medium">Đang hoạt động</span> : groupLastActivity ? `Hoạt động ${timeAgo(groupLastActivity)}` : "Nhóm mới"}
            </span>
          </div>

          <div className="relative flex gap-2" ref={settingsRef}>
            <button onClick={() => setShowSettings(!showSettings)} className="bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 px-3 py-1.5 text-sm rounded-md font-medium border">
              Cài đặt nhóm
            </button>

            {showSettings && (
              <div className="absolute right-0 top-full mt-2 w-[340px] bg-white shadow-xl border rounded p-4 z-50">
                <h4 className="font-bold mb-2 text-sm text-gray-800">Thành viên</h4>
                <ul className="max-h-48 overflow-y-auto mb-3">
                  {allUsersInGroup.map(memberId => {
                    const member = users.find(u => u._id === memberId);
                    const isMemberAdmin = currentChat.admin === memberId;
                    const isMemberDeputy = currentChat.deputies?.includes(memberId);
                    const isPending = currentChat.pendingMembers?.includes(memberId);

                    return (
                      <li key={memberId} className="flex justify-between items-center text-sm py-2 border-b last:border-0">
                        <span className="truncate flex flex-wrap items-center gap-1">
                          {member?.email || "Unknown"}
                          {isMemberAdmin && <span className="text-[10px] bg-orange-100 text-orange-600 border border-orange-200 px-1.5 py-0.5 rounded whitespace-nowrap font-bold">Trưởng nhóm</span>}
                          {isMemberDeputy && <span className="text-[10px] bg-purple-100 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded whitespace-nowrap font-bold">Phó nhóm</span>}
                          {isPending && <span className="text-[10px] bg-gray-100 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded whitespace-nowrap font-bold">Đang chờ xác nhận</span>}
                        </span>

                        <div className="flex gap-2 ml-2 shrink-0">
                          {isAdmin && !isMemberAdmin && (
                            <div className="flex flex-col gap-1 items-end">
                              <div className="flex gap-2">
                                {!isPending && !isMemberDeputy && (
                                  <button onClick={() => handleAddDeputy(memberId)} className="text-blue-500 hover:text-blue-700 text-[10px] font-medium border border-blue-200 px-1 rounded">Thêm Phó nhóm</button>
                                )}
                                {!isPending && isMemberDeputy && (
                                  <button onClick={() => handleRemoveDeputy(memberId)} className="text-orange-500 hover:text-orange-700 text-[10px] font-medium border border-orange-200 px-1 rounded">Gỡ Phó nhóm</button>
                                )}
                                <button onClick={() => handleKick(memberId)} className="text-red-500 hover:text-red-700 text-[10px] font-medium border border-red-200 px-1 rounded">{isPending ? "Hủy mời" : "Xóa"}</button>
                              </div>
                              {!isPending && (
                                <button onClick={() => handleTransferAdmin(memberId)} className="text-green-600 hover:text-green-800 text-[10px] font-medium border border-green-200 px-1 rounded">Chuyển quyền Trưởng nhóm</button>
                              )}
                            </div>
                          )}
                          {isDeputy && !isMemberAdmin && !isMemberDeputy && !isAdmin && (
                            <button onClick={() => handleKick(memberId)} className="text-red-500 hover:text-red-700 text-[10px] font-medium border border-red-200 px-1 rounded">{isPending ? "Hủy mời" : "Xóa khỏi nhóm"}</button>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>

                {isAdmin && (
                  <div className="flex flex-col gap-2 mt-3 border-t pt-3">
                    <button onClick={handleOpenAddMemberModal} className="bg-blue-500 hover:bg-blue-600 text-white text-xs py-1.5 rounded w-full transition-colors">+ Mời thành viên</button>
                    <button onClick={handleDissolve} className="bg-red-600 hover:bg-red-700 text-white text-xs py-1.5 rounded w-full transition-colors">Giải tán nhóm</button>
                  </div>
                )}

                {!isAdmin && !isPendingMember && (
                  <div className="mt-3 border-t pt-3">
                    <button
                      onClick={async () => {
                        if (window.confirm("Bạn có chắc muốn rời nhóm?")) {
                          const actorString = getUserString(currentUser);
                          await handleFormSubmit(`[SYS]: ${actorString} đã rời khỏi nhóm.`);

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
        </div>
      );
    }

    const otherUserId = currentChat.members.find(id => id !== currentUser._id);
    const otherUser = users.find(u => u._id === otherUserId);
    const isOnline = onlineUsersId.includes(otherUserId);
    const displayName = otherUser ? (otherUser.name?.trim() !== "" ? otherUser.name : otherUser.email) : "Unknown User";

    return (
      <div className="flex items-center gap-3">
        <Contact chatRoom={currentChat} currentUser={currentUser} onlineUsersId={onlineUsersId} users={users} />
        <div className="flex flex-col truncate">
          <span className="font-semibold text-gray-900 text-[15px] truncate">{displayName}</span>
          <span className="text-xs text-gray-500 truncate mt-0.5">
            {isOnline ? <span className="text-green-500 font-medium">Đang hoạt động</span> : otherUser?.lastSeen ? `Hoạt động ${timeAgo(otherUser.lastSeen)}` : "Ngoại tuyến"}
          </span>
        </div>
      </div>
    );
  }, [currentChat, users, onlineUsersId, currentUser, showSettings, isAdmin, isDeputy, messages, isPendingMember]);

  const visibleMessages = messages.slice(0, visibleCount);
  const hasRegularMessages = messages.some((m) => m.message && !m.message.startsWith("[SYS]: "));

  const typingText = useMemo(() => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) return `${typingUsers[0].senderName} đang soạn tin`;
    if (typingUsers.length === 2) return `${typingUsers[0].senderName} và ${typingUsers[1].senderName} đang soạn tin`;
    return `Nhiều người đang soạn tin`;
  }, [typingUsers]);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-white relative">
      <div className="flex items-center p-3 px-4 border-b bg-white shrink-0 z-10 h-[76px] relative">
        <button onClick={() => setCurrentChat(null)} className="lg:hidden mr-3 p-2 hover:bg-gray-100 rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1 min-w-0">{headerContent}</div>
      </div>

      {/* NÚT FLOAT "^" KÉP NẰM NGOÀI ĐỂ CỐ ĐỊNH GÓC MÀN HÌNH */}
      <div className="absolute right-6 bottom-24 flex flex-col gap-2 z-[60]">
        {(showScrollTop || hasNewMessageIndicator) && (
          <button
            onClick={() => {
              scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
              setHasNewMessageIndicator(false);
            }}
            className={`relative w-10 h-10 shadow-lg border rounded-full flex items-center justify-center transition-colors hover:border-blue-600 hover:text-blue-600 ${
              hasNewMessageIndicator 
                ? "bg-orange-500 text-white border-orange-500" 
                : "bg-white text-gray-700 border-gray-700"
            }`}
            title="Cuộn lên tin nhắn mới nhất"
          >
            {/* Icon 2 mũi tên lên */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7M5 9l7-7 7 7" />
            </svg>
          </button>
        )}
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 min-h-0 overflow-y-auto bg-gray-50 p-4">
        <div className="flex flex-col gap-3">
          {visibleMessages.map((m) => {
            if (!m?._id) return null;

            if (m.message && m.message.startsWith("[SYS]: ")) {
              const sysText = m.message.replace("[SYS]: ", "");
              const parts = sysText.split(/\*\*(.*?)\*\*/g);

              return (
                <div key={m._id} className="text-center text-xs text-gray-400 my-2">
                  {parts.map((part, index) =>
                    index % 2 === 1 ? (
                      <span key={index} className="font-bold text-gray-500">{part}</span>
                    ) : (
                      part
                    )
                  )}
                </div>
              );
            }

            return <Message key={m._id} message={m} self={currentUser._id} users={users} onRevoke={handleRevokeMessage} />
          })}

          {visibleCount < messages.length ? (
            <div className="text-center text-xs text-gray-400 my-2">Cuộn xuống để xem thêm...</div>
          ) : hasRegularMessages && (
            <div className="text-center text-xs text-gray-400 my-2">Đã hết tin nhắn</div>
          )}
        </div>
      </div>

      <div className="p-0 bg-white shrink-0 z-10 relative border-t border-gray-200">
        {isPendingMember ? (
          <div className="flex flex-col items-center justify-center py-5">
            <p className="text-sm text-gray-600 mb-3 font-medium">Bạn được mời tham gia nhóm này. Bạn có muốn tham gia không?</p>
            <div className="flex gap-4">
              <button
                onClick={handleRejectInvite}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm font-semibold transition"
              >
                Từ chối
              </button>
              <button
                onClick={handleAcceptInvite}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold transition shadow-sm"
              >
                Đồng ý tham gia
              </button>
            </div>
          </div>
        ) : isReceiverOfPrivate ? (
          <div className="flex flex-col items-center justify-center py-5">
            <p className="text-sm text-gray-600 mb-3 font-medium">Người này muốn gửi tin nhắn cho bạn. Chấp nhận để tiếp tục trò chuyện?</p>
            <div className="flex gap-4">
              <button onClick={handleRejectPrivate} className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm font-semibold transition">Từ chối</button>
              <button onClick={handleAcceptPrivate} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold transition shadow-sm">Đồng ý</button>
            </div>
          </div>
        ) : (isRequesterOfPrivate && remainingMessages <= 0) ? (
          <div className="flex flex-col items-center justify-center py-5">
            <p className="text-sm text-red-500 font-medium">Đã gửi tối đa 10 tin nhắn. Vui lòng chờ đối phương đồng ý để tiếp tục.</p>
          </div>
        ) : (
          <div className="flex flex-col relative w-full pt-1">
            {isRequesterOfPrivate && (
              <span className="text-xs text-orange-500 mb-2 mt-2 font-medium italic text-center">
                Cuộc trò chuyện đang chờ xác nhận. Bạn có thể gửi thêm {remainingMessages} tin nhắn.
              </span>
            )}
            
            <ChatForm 
              handleFormSubmit={handleFormSubmit} 
              onTyping={handleTyping}
              onStopTyping={handleStopTyping}
              typingText={typingText}
            />
          </div>
        )}
      </div>

      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60]">
          <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full m-4">
            <h2 className="text-xl font-bold mb-4">Mời thành viên</h2>
            <input value={memberSearchTerm} onChange={(e) => setMemberSearchTerm(e.target.value)} placeholder="Tìm kiếm bằng email hoặc tên..." className="border border-gray-300 rounded px-3 py-2 w-full mb-2 focus:outline-none focus:border-blue-500" />
            <div className="max-h-64 overflow-y-auto mb-4 border border-gray-200 rounded p-2">
              {availableUsersToAdd.length > 0 ? (
                availableUsersToAdd.map((u) => (
                  <label key={u._id} className="flex items-center mb-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                    <input type="checkbox" checked={selectedNewMembers.includes(u._id)} onChange={() => { setSelectedNewMembers((prev) => prev.includes(u._id) ? prev.filter((id) => id !== u._id) : [...prev, u._id]); }} className="mr-3 cursor-pointer h-4 w-4" />
                    <div className="flex flex-col"><span className="font-medium text-sm text-gray-800">{u.name || u.email.split("@")[0]}</span><span className="text-xs text-gray-500">{u.email}</span></div>
                  </label>
                ))
              ) : <div className="text-gray-500 text-center py-4 text-sm">Không tìm thấy người dùng phù hợp.</div>}
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => { setShowAddMemberModal(false); setSelectedNewMembers([]); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm font-medium">Hủy</button>
              <button onClick={submitAddMembers} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium">Gửi lời mời</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}