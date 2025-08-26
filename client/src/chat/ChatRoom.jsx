import { useState, useEffect, useRef } from "react";
import { useApi } from "../services/ChatService";
import Message from "./Message";
import Contact from "./Contact";
import ChatForm from "./ChatForm";

export default function ChatRoom({ currentChat, currentUser, socket, users }) {
  const [messages, setMessages] = useState([]);
  const [incomingMessage, setIncomingMessage] = useState(null);
  const messagesEndRef = useRef();

  const { getMessagesOfChatRoom, sendMessage } = useApi();

  // Fetch messages when chat room changes
  useEffect(() => {
    const fetchData = async () => {
      if (currentChat) {
        const res = await getMessagesOfChatRoom(currentChat._id);
        setMessages(res);
      }
    };
    fetchData();
  }, [currentChat, getMessagesOfChatRoom]);

  // Scroll to bottom when messages update
  useEffect(() => {
    //scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Listen to incoming messages via socket
  useEffect(() => {
    socket.current?.on("getMessage", (data) => {
      setIncomingMessage({
        sender: data.senderId,
        message: data.message,
        createdAt: new Date().toISOString(),
      });
    });
  }, [socket]);

  // Update messages with new incoming one
  useEffect(() => {
    if (incomingMessage && incomingMessage.sender && incomingMessage.message) {
      setMessages((prev) => [...prev, incomingMessage]);
    }
  }, [incomingMessage]);

  const handleFormSubmit = async (message) => {
    const receiverId = currentChat.members.find(
      (member) => member !== currentUser._id
    );

    socket.current.emit("sendMessage", {
      senderId: currentUser._id,
      receiverId,
      message,
    });

    const messageBody = {
      chatRoomId: currentChat._id,
      sender: currentUser._id,
      message: message,
      isRead: false,
    };

    const res = await sendMessage(messageBody);
    setMessages((prev) => [...prev, res]);
  };

  return (
    <div className="lg:col-span-2 lg:block">
      <div className="w-full">
        <div className="p-3 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
          <Contact chatRoom={currentChat} />
        </div>

        <div className="relative w-full p-6 overflow-y-auto h-[30rem] bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
          <ul className="space-y-2">
            {messages.map((msg, index) => (
              <Message
                key={index}
                message={msg}
                self={currentUser._id}
                users={users}
                currentUser={currentUser}
              />
            ))}
          </ul>
          <div ref={messagesEndRef} />
        </div>

        <ChatForm handleFormSubmit={handleFormSubmit} />
      </div>
    </div>
  );
}
