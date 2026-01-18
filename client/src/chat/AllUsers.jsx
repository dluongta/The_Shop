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
  const [showMembersId, setShowMembersId] = useState(null);

  const { createChatRoom } = useApi();

  // ================= HELPER (ĐÃ CẬP NHẬT) =================
  const getFullUserInfo = (userId) => {
    const user = users.find((u) => u._id === userId);
    if (!user) return "";
    // Trả về định dạng: "Tên - Email" hoặc chỉ Email nếu không có tên
    return user.name ? `${user.name} - ${user.email}` : user.email;
  };

  // Hàm này giữ nguyên để hiển thị tiêu đề chat ngắn gọn
  const getUserName = (userId) => {
    const user = users.find((u) => u._id === userId);
    return user ? (user.name || user.email) : "";
  };

  // ================= FILTER CHAT ROOMS =================
  const filteredChatRooms = useMemo(() => {
    if (!searchQuery.trim()) return chatRooms;

    const q = normalize(searchQuery);

    return chatRooms.filter((room) => {
      if (room.isGroup) {
        return normalize(room.name).includes(q);
      }

      const otherUserId = room.members.find(
        (id) => id !== currentUser._id
      );
      const otherUserName = getUserName(otherUserId);

      return normalize(otherUserName).includes(q);
    });
  }, [chatRooms, searchQuery, users]);
  const hasUnread = (room) => {
    return (
      room.lastMessage &&
      !room.lastMessage.isRead &&
      room.lastMessage.sender !== currentUser._id
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="overflow-y-auto flex-1">

        <h2 className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
          Chats
        </h2>

        {filteredChatRooms.length === 0 && (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">
            No chats found
          </p>
        )}

        {filteredChatRooms.map((room, index) => {
          const otherUserId = !room.isGroup
            ? room.members.find((id) => id !== currentUser._id)
            : null;

          return (
            <div key={room._id} className="relative border-b">
              <div
                onClick={() => {
                  setSelectedChat(index);
                  changeChat(room);
                }}
                className={classNames(
                  "px-4 py-3 cursor-pointer transition-colors flex justify-between items-center",
                  selectedChat === index
                    ? "bg-blue-50"
                    : "hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {room.isGroup ? (
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
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

                  <div className="truncate">
                    {/* <p className="font-medium truncate">
                      {room.isGroup
                        ? room.name
                        : getUserName(otherUserId)}
                    </p> */}

                    <p
                      className={
                        hasUnread(room)
                          ? "font-bold text-blue-600 truncate"
                          : "font-medium text-gray-900 truncate"
                      }
                    >
                      {room.isGroup ? room.name : getUserName(otherUserId)}
                    </p>

                    {room.lastMessage && (
                      <p
                        className={
                          hasUnread(room)
                            ? "text-xs text-blue-600 font-semibold truncate"
                            : "text-xs text-gray-500 truncate"
                        }
                      >
                        {room.lastMessage.message}
                      </p>
                    )}

                  </div>
                </div>

                {room.isGroup && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMembersId(
                        showMembersId === room._id ? null : room._id
                      );
                    }}
                    className="text-[10px] bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-blue-600 font-semibold"
                  >
                    {showMembersId === room._id ? "Close" : "Members"}
                  </button>
                )}
              </div>

              {/* MEMBERS (PHẦN HIỂN THỊ THÀNH VIÊN ĐÃ CẬP NHẬT) */}
              {room.isGroup && showMembersId === room._id && (
                <div className="bg-gray-50 px-4 py-2 border-t">
                  <p className="text-[10px] font-bold text-gray-400 mb-1">
                    GROUP MEMBERS ({room.members.length})
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {room.members.map((id) => (
                      <span
                        key={id}
                        className={classNames(
                          "text-[10px] px-2 py-0.5 rounded-full border",
                          id === currentUser._id
                            ? "bg-blue-100 border-blue-200 text-blue-700"
                            : "bg-white border-gray-200 text-gray-600"
                        )}
                      >
                        {id === currentUser._id
                          ? `You - ${currentUser.email}`
                          : getFullUserInfo(id)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}