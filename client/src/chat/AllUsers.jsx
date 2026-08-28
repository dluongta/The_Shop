import { useState, useMemo } from "react";
import { useApi } from "../services/ChatService";
import Contact from "./Contact";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const normalize = (str = "") => str.toLowerCase();

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

export default function AllUsers({
  users,
  chatRooms,
  setChatRooms,
  onlineUsersId,
  currentUser,
  changeChat,
  searchQuery,
}) {
  const [selectedChat, setSelectedChat] = useState(null);
  const { createChatRoom } = useApi();

  const getDisplayName = (userId) => {
    if (userId === currentUser._id) return "You";
    const user = users.find((u) => u._id === userId);
    if (!user) return "Unknown User";

    return user.name && user.name.trim() !== "" ? user.name : user.email;
  };

  const displayList = useMemo(() => {
    const q = normalize(searchQuery);

    const filteredRooms = chatRooms.filter((room) => {
      if (room.isGroup) return normalize(room.name).includes(q);

      const otherId = room.members.find((id) => id !== currentUser._id);
      const otherUser = users.find((u) => u._id === otherId);
      const nameToSearch = otherUser?.name || "";
      const emailToSearch = otherUser?.email || "";

      return normalize(nameToSearch).includes(q) || normalize(emailToSearch).includes(q);
    });

    const existingContactIds = new Set();
    chatRooms.forEach((room) => {
      if (!room.isGroup) {
        room.members.forEach((mId) => {
          if (mId !== currentUser._id) existingContactIds.add(mId);
        });
      }
    });

    const availableUsers = users.filter((u) => {
      const isNotMe = u._id !== currentUser._id;
      const notInRecent = !existingContactIds.has(u._id);
      const matchesSearch = normalize(u.name || "").includes(q) || normalize(u.email || "").includes(q);
      return isNotMe && notInRecent && matchesSearch;
    });

    return { filteredRooms, availableUsers };
  }, [chatRooms, users, searchQuery, currentUser._id]);

  const handleStartNewChat = async (targetUser) => {
    const data = {
      senderId: currentUser._id,
      receiverId: targetUser._id,
      isGroup: false,
    };

    const newRoom = await createChatRoom(data);
    if (newRoom) {
      setChatRooms((prev) => [newRoom, ...prev]);
      setSelectedChat(newRoom._id);
      changeChat(newRoom);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white select-none">
      <div className="overflow-y-auto flex-1">

        <div className="bg-gray-50 px-4 py-2 border-b border-t first:border-t-0">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Recent Chats ({displayList.filteredRooms.length})
          </h2>
        </div>

        {displayList.filteredRooms.map((room) => {
          const otherUserId = !room.isGroup
            ? room.members.find((id) => id !== currentUser._id)
            : null;

          const otherUserObj = users.find(u => u._id === otherUserId);
          const isOnline = onlineUsersId.includes(otherUserId);
          
          // ==== LẤY SỐ LƯỢNG TIN NHẮN CHƯA ĐỌC TỪ CƠ SỞ DỮ LIỆU ====
          const unreadCount = room.unreadCounts ? (room.unreadCounts[currentUser._id] || 0) : 0;
          const isUnread = unreadCount > 0;

          // TỔNG HỢP KIỂM TRA LỜI MỜI
          const isPendingGroup = room.isGroup && room.pendingMembers?.includes(currentUser._id);
          const isPendingPrivate = !room.isGroup && room.isAccepted === false && room.requester !== currentUser._id;
          const isPending = isPendingGroup || isPendingPrivate;

          let isGroupOnline = false;
          let groupLastActivity = null;
          let userRoleInGroup = null;

          if (room.isGroup) {
            const otherMembers = room.members.filter(id => id !== currentUser._id);
            isGroupOnline = otherMembers.some(id => onlineUsersId.includes(id));
            if (room.lastMessage && room.lastMessage.createdAt) {
              groupLastActivity = room.lastMessage.createdAt;
            }

            // XÁC ĐỊNH VAI TRÒ CỦA USER HIỆN TẠI TRONG NHÓM
            if (room.admin === currentUser._id) {
              userRoleInGroup = "Trưởng nhóm";
            } else if (room.deputies && room.deputies.includes(currentUser._id)) {
              userRoleInGroup = "Phó nhóm";
            } else if (room.members.includes(currentUser._id)) {
              userRoleInGroup = "Thành viên";
            }
          }

          return (
            <div
              key={room._id}
              onClick={() => {
                setSelectedChat(room._id);
                changeChat(room);
              }}
              className={classNames(
                "px-4 py-3 cursor-pointer border-b transition-all flex justify-between items-center",
                selectedChat === room._id ? "bg-blue-50" : "hover:bg-gray-50"
              )}
            >
              <div className="flex items-center gap-3 w-full overflow-hidden">
                {room.isGroup ? (
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
                      {room.name.charAt(0).toUpperCase()}
                    </div>
                    {isGroupOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                ) : (
                  <div className="shrink-0">
                    <Contact
                      chatRoom={room}
                      currentUser={currentUser}
                      onlineUsersId={onlineUsersId}
                      users={users}
                    />
                  </div>
                )}
                
                {/* KHỐI NỘI DUNG */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  
                  <div className="flex justify-between items-center mb-0.5">
                    <div className="flex items-center min-w-0 flex-1 mr-2 gap-2">
                      <p
                        className={classNames(
                          "text-sm truncate", 
                          isUnread ? "font-bold text-black" : "font-medium text-gray-800"
                        )}
                      >
                        {room.isGroup ? room.name : getDisplayName(otherUserId)}
                      </p>

                      {/* HIỂN THỊ BADGE VAI TRÒ NẾU LÀ NHÓM */}
                      {room.isGroup && userRoleInGroup && !isPendingGroup && (
                        <span className={classNames(
                          "text-[9px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap border shrink-0",
                          userRoleInGroup === "Trưởng nhóm" ? "bg-orange-100 text-orange-600 border-orange-200" :
                          userRoleInGroup === "Phó nhóm" ? "bg-purple-100 text-purple-700 border-purple-200" :
                          "bg-gray-100 text-gray-600 border-gray-200"
                        )}>
                          {userRoleInGroup}
                        </span>
                      )}
                    </div>

                    <span className={classNames(
                      "text-[10px] shrink-0 ml-2",
                      isUnread ? "font-bold text-black" : "text-gray-400"
                    )}>
                      {room.isGroup ? (
                        isGroupOnline ? (
                          <span className="text-green-500 font-medium">Đang hoạt động</span>
                        ) : groupLastActivity ? (
                          `Hoạt động ${timeAgo(groupLastActivity)}`
                        ) : (
                          "Nhóm mới"
                        )
                      ) : (
                        isOnline ? (
                          <span className="text-green-500 font-medium">Đang hoạt động</span>
                        ) : otherUserObj?.lastSeen ? (
                          `Hoạt động ${timeAgo(otherUserObj.lastSeen)}`
                        ) : ""
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mt-0.5">
                    <div className="flex-1 min-w-0 pr-2">
                      {room.lastMessage && room.lastMessage.message ? (
                        <p className={classNames(
                          "text-xs truncate flex gap-1",
                          isUnread ? "font-bold text-black" : "text-gray-500"
                        )}>
                          {!room.lastMessage.message.startsWith("[SYS]: ") && (
                            <>
                              {room.lastMessage.sender === currentUser._id ? (
                                <span>You:</span>
                              ) : room.lastMessage.sender ? (
                                <span className={classNames(
                                  isUnread ? "font-bold text-black" : "font-medium text-gray-700"
                                )}>
                                  {getDisplayName(room.lastMessage.sender)}:
                                </span>
                              ) : null}
                            </>
                          )}

                          <span className={classNames(
                            "truncate",
                            isUnread ? "font-bold text-black" : ""
                          )}>
                            {room.lastMessage.message.startsWith("[SYS]: ")
                              ? room.lastMessage.message.replace("[SYS]: ", "")
                              : room.lastMessage.message}
                          </span>
                        </p>
                      ) : (
                        <p className="text-[10px] text-gray-400 truncate italic">
                          {!room.isGroup ? (
                            <span>{otherUserObj?.email}</span>
                          ) : (
                            isPendingGroup ? (
                              <span>Bạn được mời vào nhóm này</span>
                            ) : (
                              <span>Nhóm mới - Chưa có tin nhắn</span>
                            )
                          )}
                        </p>
                      )}
                    </div>
                    
                    {/* THẺ LỜI MỜI / SỐ TIN CHƯA ĐỌC */}
                    <div className="shrink-0 flex items-center justify-end min-w-[20px]">
                      {isPending ? (
                        <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                          LỜI MỜI
                        </span>
                      ) : isUnread ? (
                        <span className="bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 shadow-sm">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          );
        })}

        <div className="bg-gray-50 px-4 py-2 border-b border-t mt-2">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            All Users ({displayList.availableUsers.length})
          </h2>
        </div>

        {displayList.availableUsers.length === 0 && displayList.filteredRooms.length === 0 && (
          <p className="p-8 text-center text-gray-400 text-sm">No users found</p>
        )}

        {displayList.availableUsers.map((user) => {
          const isOnline = onlineUsersId.includes(user._id);

          return (
            <div
              key={user._id}
              onClick={() => handleStartNewChat(user)}
              className="px-4 py-3 cursor-pointer border-b hover:bg-gray-50 flex items-center gap-3 transition-colors group"
            >
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </div>
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                )}
              </div>
              <div className="truncate flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.name || "No Name"}
                </p>
                <p className="text-[11px] text-gray-500 truncate mt-0.5">
                  {isOnline ? (
                    <span className="text-green-500 font-medium">Đang hoạt động</span>
                  ) : user.lastSeen ? (
                    `Hoạt động ${timeAgo(user.lastSeen)}`
                  ) : (
                    user.email
                  )}
                </p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-bold">CHAT</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}