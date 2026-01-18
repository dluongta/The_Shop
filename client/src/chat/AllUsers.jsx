import { useEffect, useState } from "react";
import { useApi } from "../services/ChatService";
import Contact from "./Contact";
import UserLayout from "../layouts/UserLayout";

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
  const [nonContacts, setNonContacts] = useState([]);
  const [contactIds, setContactIds] = useState([]);
  const [showMembersId, setShowMembersId] = useState(null);

  const { createChatRoom } = useApi();

  // ================= CONTACT IDS (1–1) =================
  useEffect(() => {
    if (!chatRooms || !currentUser) return;

    const ids = chatRooms
      .filter((r) => !r.isGroup)
      .map((r) => r.members.find((m) => m !== currentUser._id))
      .filter(Boolean);

    setContactIds(ids);
  }, [chatRooms, currentUser]);

  // ================= NON CONTACTS =================
  useEffect(() => {
    if (!users || !currentUser) return;

    setNonContacts(
      users.filter(
        (u) => u._id !== currentUser._id && !contactIds.includes(u._id)
      )
    );
  }, [users, contactIds, currentUser]);

  // ================= UNREAD =================
  const hasUnreadMessages = (room) => {
    if (!room.lastMessage) return false;
    return (
      room.lastMessage.sender !== currentUser._id &&
      room.lastMessage.isRead === false
    );
  };

  // ================= CHANGE CHAT =================
  const changeCurrentChat = (index, chat) => {
    setSelectedChat(index);

    setChatRooms((prev) =>
      prev.map((r) =>
        r._id === chat._id
          ? {
              ...r,
              lastMessage: r.lastMessage
                ? { ...r.lastMessage, isRead: true }
                : r.lastMessage,
            }
          : r
      )
    );

    changeChat(chat);
  };

  // ================= GET USER NAME =================
  const getUserName = (userId) => {
    const user = users.find((u) => u._id === userId);
    return user?.email || user?.name || "Unknown user";
  };

  // ================= FILTER CHAT ROOMS =================
  const filteredChatRooms = chatRooms.filter((room) => {
    if (!searchQuery) return true;

    if (room.isGroup) {
      return normalize(room.name).includes(normalize(searchQuery));
    }

    const contactId = room.members.find(
      (id) => id !== currentUser._id
    );
    const contact = users.find((u) => u._id === contactId);

    return normalize(contact?.email).includes(normalize(searchQuery));
  });

  // ================= FILTER OTHER USERS =================
  const filteredNonContacts = nonContacts.filter((u) =>
    normalize(u.email).includes(normalize(searchQuery))
  );

  return (
    <ul className="overflow-auto h-[30rem]">
      <h2 className="m-2 font-semibold">Chats</h2>

      {filteredChatRooms.map((room, index) => (
        <div
          key={room._id}
          onClick={() => changeCurrentChat(index, room)}
          className={classNames(
            "px-3 py-2 cursor-pointer border-b",
            index === selectedChat
              ? "bg-gray-100"
              : "hover:bg-gray-100",
            hasUnreadMessages(room) && "font-bold"
          )}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {room.isGroup && (
                <span className="text-xs bg-blue-500 text-white px-2 rounded">
                  Group
                </span>
              )}

              {room.isGroup ? (
                <span>{room.name}</span>
              ) : (
                <Contact
                  chatRoom={room}
                  currentUser={currentUser}
                  onlineUsersId={onlineUsersId}
                  users={users}
                />
              )}
            </div>

            {room.isGroup && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMembersId(
                    showMembersId === room._id ? null : room._id
                  );
                }}
                className="text-xs underline text-blue-600"
              >
                Members
              </button>
            )}
          </div>

          {/* ===== GROUP MEMBERS ===== */}
          {room.isGroup && showMembersId === room._id && (
            <div className="ml-6 mt-2 text-xs text-gray-600 space-y-1">
              {[...room.members]
                .sort((a, b) =>
                  a === currentUser._id ? -1 : b === currentUser._id ? 1 : 0
                )
                .map((id) => (
                  <div
                    key={id}
                    className={classNames(
                      "flex items-center gap-2",
                      id === currentUser._id &&
                        "font-semibold text-black"
                    )}
                  >
                    <span>{getUserName(id)}</span>
                    {/* {id === currentUser._id && (
                      <span className="text-[10px] bg-gray-200 px-1.5 rounded">
                        You
                      </span>
                    )} */}
                  </div>
                ))}
            </div>
          )}
        </div>
      ))}

      <h2 className="m-2 font-semibold">Other Users</h2>

      {filteredNonContacts.map((u) => (
        <div
          key={u._id}
          onClick={() =>
            createChatRoom({
              senderId: currentUser._id,
              receiverId: u._id,
            })
          }
          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
        >
          <UserLayout user={u} onlineUsersId={onlineUsersId} />
        </div>
      ))}
    </ul>
  );
}
