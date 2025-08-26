import { useState, useEffect } from "react";
import { useApi } from "../services/ChatService";
import Contact from "./Contact";
import UserLayout from "../layouts/UserLayout";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function AllUsers({
  users,
  chatRooms,
  setChatRooms,
  onlineUsersId,
  currentUser,
  changeChat,
}) {
  const [selectedChat, setSelectedChat] = useState();
  const [nonContacts, setNonContacts] = useState([]);
  const [contactIds, setContactIds] = useState([]);
  const [showMembersId, setShowMembersId] = useState(null); // để bật/tắt danh sách thành viên nhóm

  const { createChatRoom } = useApi();

  // Lấy các user id trong chatRooms ngoại trừ currentUser (để phân biệt contact)
  useEffect(() => {
    if (chatRooms && currentUser) {
      const Ids = chatRooms
        .map((chatRoom) => {
          if (chatRoom.isGroup) {
            return null;
          }
          return chatRoom.members.find((member) => member !== currentUser._id);
        })
        .filter(Boolean);
      setContactIds(Ids);
    }
  }, [chatRooms, currentUser]);

  // Lọc ra các user không phải contact
  useEffect(() => {
    if (users && users.length > 0 && currentUser) {
      setNonContacts(
        users.filter(
          (f) => f._id !== currentUser._id && !contactIds.includes(f._id)
        )
      );
    }
  }, [contactIds, users, currentUser]);

  const changeCurrentChat = (index, chat) => {
    setSelectedChat(index);
    changeChat(chat);
  };

  // Tạo chat đơn mới
  const handleNewChatRoom = async (user) => {
    const members = {
      senderId: currentUser._id,
      receiverId: user._id,
    };
    const res = await createChatRoom(members);
    setChatRooms((prev) => [...prev, res]);
    changeChat(res);
  };

  // Lấy tên user từ id, để hiển thị tên thành viên nhóm
  const getUserName = (userId) => {
    const user = users.find((u) => u._id === userId);
    return user ? user.email || user.name || "Unknown" : "Unknown";
  };

  return (
    <>
      <ul className="overflow-auto h-[30rem]">
        <h2 className="my-2 mb-2 ml-2 text-black font-semibold">Chats</h2>
        <li>
          {chatRooms?.map((chatRoom, index) => (
            <div
              key={chatRoom._id || index}
              className={classNames(
                index === selectedChat
                  ? "bg-gray-100"
                  : "transition duration-150 ease-in-out cursor-pointer bg-white border-b border-gray-200 hover:bg-gray-100",
                "flex flex-col px-3 py-2 text-sm text-black"
              )}
              onClick={() => changeCurrentChat(index, chatRoom)}
            >
              {/* Tên group và nút view members cùng hàng */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {chatRoom.isGroup && (
                    <span className="text-xs bg-blue-500 text-white rounded px-2 py-0.5 font-semibold">
                      Group
                    </span>
                  )}
                  <div className="font-semibold">
                    {chatRoom.isGroup ? chatRoom.name : (
                      <Contact
                        chatRoom={chatRoom}
                        onlineUsersId={onlineUsersId}
                        currentUser={currentUser}
                      />
                    )}
                  </div>
                </div>

                {/* Nút xem thành viên cho nhóm */}
                {chatRoom.isGroup && (
                  <button
                    type="button"
                    className="text-blue-600 text-xs underline hover:text-blue-800"
                    onClick={(e) => {
                      e.stopPropagation(); // tránh click lan ra cha gây đổi chat
                      setShowMembersId(
                        showMembersId === chatRoom._id ? null : chatRoom._id
                      );
                    }}
                  >
                    {showMembersId === chatRoom._id ? "Hide Members" : "View Members"}
                  </button>
                )}
              </div>

              {/* Hiển thị thành viên nhóm nếu là group và đang mở xem */}
              {chatRoom.isGroup && showMembersId === chatRoom._id && (
                <div className="mt-2 ml-6 text-xs text-gray-700">
                  <div className="mb-1 font-semibold">Members:</div>
                  <ul>
                    {chatRoom.members
                      .filter((id) => id !== currentUser._id)
                      .map((memberId) => (
                        <li key={memberId}>{getUserName(memberId)}</li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </li>

        <h2 className="my-2 mb-2 ml-2 text-black font-semibold">Other Users</h2>
        <li>
          {nonContacts?.map((nonContact, index) => (
            <div
              key={nonContact._id || index}
              className="flex items-center px-3 py-2 text-sm bg-white border-b border-gray-200 hover:bg-gray-100 cursor-pointer text-black"
              onClick={() => handleNewChatRoom(nonContact)}
            >
              <UserLayout user={nonContact} onlineUsersId={onlineUsersId} />
            </div>
          ))}
        </li>
      </ul>
    </>
  );
}
