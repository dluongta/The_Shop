import { useState, useRef, useEffect } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/solid";
import { EmojiHappyIcon } from "@heroicons/react/outline";
import Picker from "emoji-picker-react";

export default function ChatForm({ handleFormSubmit, onTyping, onStopTyping, typingText }) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const typingTimeoutRef = useRef(null);

  const handleEmojiClick = (event, emojiObject) => {
    // Khi thêm emoji cũng coi như đang gõ
    const newMessage = message + emojiObject.emoji;
    setMessage(newMessage);
    
    if (onTyping) onTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (onStopTyping) onStopTyping();
    }, 3000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      handleFormSubmit(message);
      setMessage(""); // Làm trống ô chat
      setShowEmojiPicker(false); // Ẩn picker khi gửi xong
      
      // Tắt trạng thái đang gõ ngay lập tức
      if (onStopTyping) onStopTyping();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setMessage(val);

    // 1. Nếu xóa trắng ô -> tắt trạng thái gõ ngay
    if (val.trim() === "") {
      if (onStopTyping) onStopTyping();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      return;
    }

    // 2. Có chữ -> kích hoạt trạng thái gõ
    if (onTyping) onTyping();

    // 3. Xóa timeout cũ và tạo timeout mới 3s để tự tắt nếu treo phím
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (onStopTyping) onStopTyping();
    }, 3000);
  };

  const handleBlur = () => {
    if (onStopTyping) onStopTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  return (
    <div className="relative w-full">
      {/* VÙNG HIỂN THỊ "ĐANG SOẠN TIN..." */}
      {typingText && (
        <div className="absolute bottom-full left-0 mb-0 flex items-center gap-1.5 text-blue-600 z-10 px-3 py-1.5 text-xs italic bg-white rounded-t-lg shadow-[2px_-2px_10px_-3px_rgba(0,0,0,0.05)] border border-b-0 border-gray-200">
          <span className="font-semibold">{typingText}</span>
          {/* 3 dấu chấm nhảy ở bên phải chữ */}
          <div className="flex space-x-1 items-center pb-1">
            <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}

      {showEmojiPicker && (
        <div className="absolute bottom-full left-0 mb-2 z-50">
          <Picker onEmojiClick={handleEmojiClick} disableAutoFocus={true} native />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between w-full p-3 bg-white border-t border-gray-200 dark:bg-gray-900 dark:border-gray-700 relative z-20">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="focus:outline-none"
          >
            <EmojiHappyIcon
              className="h-7 w-7 text-blue-600 hover:text-blue-700 transition-colors dark:text-blue-500"
              aria-hidden="true"
            />
          </button>

          <input
            type="text"
            placeholder="Nhập tin nhắn..."
            className="block w-full py-2 pl-4 mx-3 outline-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            name="message"
            required
            value={message}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button 
            type="submit"
            disabled={!message.trim()}
            className="disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
          >
            <PaperAirplaneIcon
              className="h-6 w-6 text-blue-600 hover:text-blue-700 transition-colors dark:text-blue-500 rotate-[90deg]"
              aria-hidden="true"
            />
          </button>
        </div>
      </form>
    </div>
  );
}