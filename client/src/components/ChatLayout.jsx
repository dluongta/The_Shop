import { useEffect, useRef, useState } from "react";
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
  const { initiateSocketConnection, getAllUsers, getChatRooms } = useApi();

  // ================= SOCKET =================
  useEffect(() => {
    if (!currentUser?._id) return;
    socket.current = initiateSocketConnection();
    socket.current.emit("addUser", currentUser._id);
    socket.current.on("getUsers", (users) => {
      setOnlineUsersId(users.map((u) => u.toString()));
    });
    socket.current.on("getMessage", (data) => {
      setChatRooms((prev) =>
        prev.map((room) =>
          room._id === data.chatRoomId
            ? { ...room, lastMessage: { sender: data.senderId, message: data.message, isRead: false, createdAt: new Date().toISOString() } }
            : room
        )
      );
    });
    return () => socket.current?.disconnect();
  }, [currentUser?._id]);

  useEffect(() => {
    if (!currentUser?._id) return;
    getChatRooms(currentUser._id).then(setChatRooms);
  }, [currentUser?._id]);

  useEffect(() => {
    getAllUsers().then(setUsers);
  }, []);

  const handleChatChange = async (chat) => {
    if (!chat?._id) return;
    setCurrentChat(chat);
    try { await axios.put(`/api/message/mark-as-read/${chat._id}`); } catch {}
    setChatRooms((prev) =>
      prev.map((room) =>
        room._id === chat._id ? { ...room, lastMessage: room.lastMessage ? { ...room.lastMessage, isRead: true } : room.lastMessage } : room
      )
    );
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* 1. FIXED HEADER */}
      <Header />

      {/* 2. CHAT CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT SIDEBAR: Ẩn trên mobile khi đang mở chat */}
        <div className={`
          ${currentChat ? 'hidden lg:flex' : 'flex'} 
          w-full lg:w-1/3 flex-col border-r h-full overflow-hidden bg-white
        `}>
          <div className="p-3 border-b flex gap-2 shrink-0">
            <SearchUsers handleSearch={setSearchQuery} />
            <button
              onClick={() => setShowGroupModal(true)}
              className="bg-blue-600 text-white px-3 py-2 rounded text-sm whitespace-nowrap"
            >
              + Group
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
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
        </div>

        {/* RIGHT CHAT ROOM: Full màn hình trên mobile khi có chat */}
        <div className={`
          ${!currentChat ? 'hidden lg:flex' : 'flex'} 
          flex-1 h-full overflow-hidden bg-gray-50
        `}>
          {currentChat ? (
            <ChatRoom
              currentChat={currentChat}
              setCurrentChat={setCurrentChat}
              setChatRooms={setChatRooms}
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
    </div>
  );
}