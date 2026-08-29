import React, { useEffect, useState } from "react";

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

export default function Message({ message, self, users = [], onRevoke }) {
  const senderId =
    typeof message.sender === "string" ? message.sender : message.sender?._id;

  const senderUser = users.find((u) => u._id === senderId);
  const isSelf = senderId === self;

  const [relativeTime, setRelativeTime] = useState("");

  useEffect(() => {
    setRelativeTime(timeAgo(message.createdAt));
    
    const intervalId = setInterval(() => {
      setRelativeTime(timeAgo(message.createdAt));
    }, 60000);

    return () => clearInterval(intervalId);
  }, [message.createdAt]);

  return (
    <li className={`flex ${isSelf ? "justify-end" : "justify-start"} mb-3`}>
      <div
        // Thêm shadow-md để mọi tin nhắn đều có đổ bóng 3D
        className={`max-w-md lg:max-w-lg px-4 py-2 rounded-lg text-sm border shadow-md ${
          message.isDeleted
            ? "bg-gray-200 text-black border-gray-400 italic"
            : isSelf
            ? "bg-blue-500 text-white border-blue-600"
            : "bg-gray-100 text-gray-900 border-gray-300"
        }`}
      >
        <p
          className={`text-xs font-semibold mb-1 ${
            message.isDeleted
              ? "text-black" 
              : isSelf
              ? "text-blue-100"
              : "text-gray-600"
          }`}
        >
          {senderUser?.email || senderUser?.name || "Former member"}
        </p>

        <p className={`break-words ${message.isDeleted ? "text-black font-medium" : ""}`}>
          {message.isDeleted ? "Tin nhắn đã bị thu hồi" : message.message}
        </p>

        <div className="flex justify-between items-end mt-2 gap-4">
          {isSelf && !message.isDeleted ? (
            <button
              onClick={() => onRevoke(message._id)}
              className="text-[10px] text-red-200 hover:text-white font-medium cursor-pointer shrink-0"
            >
              Thu hồi
            </button>
          ) : (
            <div className="flex-1"></div>
          )}

          {/* Dùng whitespace-nowrap để ngăn rớt dòng và shrink-0 để không bị bóp méo */}
          <div 
            className={`text-[10px] text-right whitespace-nowrap shrink-0 ${
              message.isDeleted ? "text-black font-medium opacity-100" : "opacity-80"
            }`}
          >
            {new Date(message.createdAt).toLocaleString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}{" "}
            <span className="italic">({relativeTime})</span>
          </div>
        </div>
      </div>
    </li>
  );
}