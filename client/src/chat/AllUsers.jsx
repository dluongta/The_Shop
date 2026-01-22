import { useState, useMemo } from "react";
import { useApi } from "../services/ChatService";
import Contact from "./Contact";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const normalize = (str = "") => str.toLowerCase();

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

  // 1. Hàm lấy tên hiển thị thông minh (Ưu tiên Name > Email)
  const getDisplayName = (userId) => {
    if (userId === currentUser._id) return "You";
    const user = users.find((u) => u._id === userId);
    if (!user) return "Unknown User";
    
    // Nếu có name và name không chỉ toàn khoảng trắng thì dùng name, ngược lại dùng email
    return user.name && user.name.trim() !== "" ? user.name : user.email;
  };

  // 2. Logic xử lý danh sách hiển thị
  const displayList = useMemo(() => {
    const q = normalize(searchQuery);

    // Bước A: Lọc các phòng chat hiện có (Recent Chats)
    const filteredRooms = chatRooms.filter((room) => {
      if (room.isGroup) return normalize(room.name).includes(q);
      
      const otherId = room.members.find((id) => id !== currentUser._id);
      const otherUser = users.find((u) => u._id === otherId);
      const nameToSearch = otherUser?.name || "";
      const emailToSearch = otherUser?.email || "";
      
      return normalize(nameToSearch).includes(q) || normalize(emailToSearch).includes(q);
    });

    // Bước B: Xác định ID của những người ĐÃ có phòng chat 1-1
    const existingContactIds = new Set();
    chatRooms.forEach((room) => {
      if (!room.isGroup) {
        room.members.forEach((mId) => {
          if (mId !== currentUser._id) existingContactIds.add(mId);
        });
      }
    });

    // Bước C: Lọc những người dùng CHƯA có phòng chat (Available Users)
    const availableUsers = users.filter((u) => {
      const isNotMe = u._id !== currentUser._id;
      const notInRecent = !existingContactIds.has(u._id);
      const matchesSearch = normalize(u.name || "").includes(q) || normalize(u.email || "").includes(q);
      return isNotMe && notInRecent && matchesSearch;
    });

    return { filteredRooms, availableUsers };
  }, [chatRooms, users, searchQuery, currentUser._id]);

  // 3. Xử lý tạo phòng chat mới
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

  const hasUnread = (room) => {
    return (
      room.lastMessage &&
      !room.lastMessage.isRead &&
      room.lastMessage.sender !== currentUser._id
    );
  };

  return (
    <div className="flex flex-col h-full bg-white select-none">
      <div className="overflow-y-auto flex-1">
        
        {/* SECTION 1: RECENT CHATS */}
        <div className="bg-gray-50 px-4 py-2 border-b border-t first:border-t-0">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Recent Chats ({displayList.filteredRooms.length})
          </h2>
        </div>

        {displayList.filteredRooms.map((room) => {
          const otherUserId = !room.isGroup
            ? room.members.find((id) => id !== currentUser._id)
            : null;

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
              <div className="flex items-center gap-3 truncate w-full">
                {room.isGroup ? (
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                    {room.name.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <Contact
                    chatRoom={room}
                    currentUser={currentUser}
                    onlineUsersId={onlineUsersId}
                    users={users}
                  />
                )}
                <div className="truncate flex-1">
                  <p
                    className={classNames(
                      "truncate text-sm",
                      hasUnread(room) ? "font-bold text-blue-600" : "font-semibold text-gray-900"
                    )}
                  >
                    {room.isGroup ? room.name : getDisplayName(otherUserId)}
                  </p>
                  {room.lastMessage ? (
                    <p className={classNames(
                      "text-xs truncate",
                      hasUnread(room) ? "text-blue-500 font-medium" : "text-gray-500"
                    )}>
                      {room.lastMessage.sender === currentUser._id ? "You: " : ""}
                      {room.lastMessage.message}
                    </p>
                  ) : (
                    !room.isGroup && (
                      <p className="text-[10px] text-gray-400 truncate">
                        {users.find(u => u._id === otherUserId)?.email}
                      </p>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* SECTION 2: ALL USERS (DIRECTORY) */}
        <div className="bg-gray-50 px-4 py-2 border-b border-t mt-2">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            All Users ({displayList.availableUsers.length})
          </h2>
        </div>

        {displayList.availableUsers.length === 0 && displayList.filteredRooms.length === 0 && (
          <p className="p-8 text-center text-gray-400 text-sm">No users found</p>
        )}

        {displayList.availableUsers.map((user) => (
          <div
            key={user._id}
            onClick={() => handleStartNewChat(user)}
            className="px-4 py-3 cursor-pointer border-b hover:bg-gray-50 flex items-center gap-3 transition-colors group"
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
              {onlineUsersId.includes(user._id) && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              )}
            </div>
            <div className="truncate flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user.name || "No Name"}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-bold">CHAT</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}