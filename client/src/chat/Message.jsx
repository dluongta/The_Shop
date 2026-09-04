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

// Hàm nhận diện URL và chuyển thành thẻ <a> có thể click
const formatMessage = (text, isSelf) => {
  if (!text) return "";
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          // Bỏ in đậm, giữ nguyên trắng tinh #fff
          className="underline transition-colors text-white hover:text-gray-200"
        >
          {part}
        </a>
      );
    }
    return part;
  });
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
        className={`max-w-md lg:max-w-lg px-4 py-2 rounded-lg text-sm border shadow-md ${message.isDeleted
            ? "bg-gray-200 text-black border-gray-400 italic" // Thu hồi -> Nền xám, chữ đen
            : isSelf
              ? "bg-blue-500 text-white border-blue-600"        // Mình -> Nền xanh, chữ trắng
              : "bg-orange-500 text-white border-orange-600"    // Người khác -> Nền cam đậm, chữ trắng
          }`}
      >
        {/* TÊN / EMAIL: Bỏ in đậm, màu trắng tinh #fff */}
        <p
          className={`text-xs mb-1 ${message.isDeleted ? "text-black" : "text-white"
            }`}
        >
          {senderUser?.email || senderUser?.name || "Former member"}
        </p>

        {/* NỘI DUNG TIN NHẮN: Bỏ font-medium, màu trắng tinh #fff */}
        <p className={`break-words whitespace-pre-wrap ${message.isDeleted ? "text-black" : "text-white"}`}>
          {message.isDeleted ? "Tin nhắn đã bị thu hồi" : formatMessage(message.message, isSelf)}
        </p>

        <div className="flex justify-between items-end mt-2 gap-4">
          {isSelf && !message.isDeleted ? (
            <button
              onClick={() => onRevoke(message._id)}
              className="text-[10px] text-red-300 hover:text-red-300 font-medium cursor-pointer shrink-0"
            >
              Thu hồi
            </button>
          ) : (
            <div className="flex-1"></div>
          )}

          <div
            className={`text-[10px] text-right whitespace-nowrap shrink-0 ${message.isDeleted ? "text-black" : "text-white"
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