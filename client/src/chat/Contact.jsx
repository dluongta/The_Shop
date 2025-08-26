import { useState, useEffect } from "react";
import { useApi } from "../services/ChatService";
import UserLayout from "../layouts/UserLayout";

export default function Contact({ chatRoom, onlineUsersId, currentUser }) {
  const [contact, setContact] = useState();
  const [isRead, setIsRead] = useState(true); // Default to true

  const {
    getUser,
    getMessagesOfChatRoom,
  } = useApi();

  useEffect(() => {
    if (!chatRoom || !currentUser) return;

    if (chatRoom.isGroup) {
      // Nếu là nhóm chat thì không cần gọi getUser
      setContact(null);
      // Đọc tin nhắn nhóm
      const fetchGroupMessages = async () => {
        const messages = await getMessagesOfChatRoom(chatRoom._id);
        const unreadMessages = messages.filter(
          (msg) => msg.isRead === false && msg.sender !== currentUser._id
        );
        setIsRead(unreadMessages.length === 0);
      };
      fetchGroupMessages();
      return;
    }

    const contactId = chatRoom.members?.find(
      (member) => member !== currentUser._id
    );

    const fetchData = async () => {
      const res = await getUser(contactId);
      setContact(res);

      const messages = await getMessagesOfChatRoom(chatRoom._id);
      const unreadMessages = messages.filter(
        (msg) => msg.isRead === false && msg.sender !== currentUser._id
      );
      setIsRead(unreadMessages.length === 0);
    };

    fetchData();
  }, [chatRoom, currentUser, getUser, getMessagesOfChatRoom]);

  if (chatRoom.isGroup) {
    return (
      <div className={`flex items-center justify-between w-full px-3 py-2`}>
        <div className="font-semibold text-black">
          {chatRoom.name || "Unnamed Group"}
        </div>
        {!isRead && (
          <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
        )}
      </div>
    );
  }

  return (
    <UserLayout user={contact} onlineUsersId={onlineUsersId} isRead={isRead} />
  );
}
