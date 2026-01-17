import { useEffect, useRef, useState } from "react";
import Helmet from "react-helmet";
import { useApi } from "../services/ChatService";
import { useAuth } from "../contexts/AuthContext";
import ChatRoom from "../chat/ChatRoom";
import Welcome from "../chat/Welcome";
import AllUsers from "../chat/AllUsers";
import SearchUsers from "../chat/SearchUsers";
import Header from "../layouts/HeaderChat";
import GroupChatModal from "../chat/GroupChatModal";
import axios from "axios";

export default function ChatLayout() {
  const [users, setUsers] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [onlineUsersId, setOnlineUsersId] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showGroupModal, setShowGroupModal] = useState(false);

  const socket = useRef(null);

  const { currentUser } = useAuth();
  const {
    initiateSocketConnection,
    getAllUsers,
    getChatRooms,
  } = useApi();

  // ================= SOCKET =================
  useEffect(() => {
    if (!currentUser?._id) return;

    const connect = async () => {
      socket.current = await initiateSocketConnection();
      socket.current.emit("addUser", currentUser._id);

      socket.current.on("getUsers", (users) => {
        setOnlineUsersId(users.map((u) => u.toString()));
      });

      socket.current.on("getMessage", (data) => {
        setChatRooms((prev) =>
          prev.map((room) =>
            room._id === data.chatRoomId
              ? {
                  ...room,
                  lastMessage: {
                    sender: data.senderId,
                    message: data.message,
                    isRead: false,
                    createdAt: new Date().toISOString(),
                  },
                }
              : room
          )
        );
      });
    };

    connect();

    return () => {
      socket.current?.off("getUsers");
      socket.current?.off("getMessage");
      socket.current?.disconnect();
    };
  }, [currentUser?._id]);

  // ================= FETCH ROOMS =================
  useEffect(() => {
    if (!currentUser?._id) return;

    getChatRooms(currentUser._id).then(setChatRooms);
  }, [currentUser?._id]);

  // ================= FETCH USERS =================
  useEffect(() => {
    getAllUsers().then(setUsers);
  }, []);

  // ================= CHANGE CHAT =================
  const handleChatChange = async (chat) => {
    setCurrentChat(chat);

    try {
      await axios.put(`/api/message/mark-as-read/${chat._id}`);
    } catch {}

    // mark read UI
    setChatRooms((prev) =>
      prev.map((room) =>
        room._id === chat._id
          ? {
              ...room,
              lastMessage: room.lastMessage
                ? { ...room.lastMessage, isRead: true }
                : room.lastMessage,
            }
          : room
      )
    );
  };

  return (
    <>
      <Header />

      <div className="container mx-auto">
        <div className="min-w-full bg-white border lg:grid lg:grid-cols-3">

          {/* LEFT */}
          <div className="border-r lg:col-span-1">
            <div className="flex items-center p-3 gap-2">
              <SearchUsers handleSearch={setSearchQuery} />
              <button
                onClick={() => setShowGroupModal(true)}
                className="bg-blue-600 text-white px-3 py-2 rounded"
              >
                + Group
              </button>
            </div>

            <AllUsers
              users={users}
              chatRooms={chatRooms}
              setChatRooms={setChatRooms}
              onlineUsersId={onlineUsersId}
              currentUser={currentUser}
              changeChat={handleChatChange}
              searchQuery={searchQuery}
            />
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-2">
            {currentChat ? (
              <ChatRoom
                currentChat={currentChat}
                currentUser={currentUser}
                socket={socket}
                users={users}
                onlineUsersId={onlineUsersId}
              />
            ) : (
              <Welcome />
            )}
          </div>
        </div>
      </div>

      {showGroupModal && (
        <GroupChatModal
          users={users}
          currentUser={currentUser}
          onClose={() => setShowGroupModal(false)}
          onCreated={(room) => {
            setChatRooms((prev) => [...prev, room]);
            setCurrentChat(room);
            setShowGroupModal(false);
          }}
        />
      )}
    </>
  );
}
