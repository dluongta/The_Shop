import { useState, useRef, useEffect } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/solid";
import { EmojiHappyIcon } from "@heroicons/react/outline";
import Picker from "emoji-picker-react";

export default function ChatForm({ handleFormSubmit, onTyping, onStopTyping, typingText }) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const typingTimeoutRef = useRef(null);
  
  // Ref để lấy DOM của textarea nhằm tự động điều chỉnh chiều cao
  const textareaRef = useRef(null);

  const handleEmojiClick = (event, emojiObject) => {
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
      
      // Reset lại chiều cao mặc định của textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = "42px";
      }
      
      // Tắt trạng thái đang gõ ngay lập tức
      if (onStopTyping) onStopTyping();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setMessage(val);

    // Tự động thay đổi chiều cao của textarea (tối đa 120px)
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }

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
      <style>
        {`
          @keyframes customWave {
            0%, 60%, 100% {
              transform: translateY(0);
            }
            30% {
              transform: translateY(-4px);
            }
          }
          .animate-custom-wave {
            animation: customWave 1.3s linear infinite;
          }
        `}
      </style>

      {typingText && (
        <div className="absolute bottom-full left-0 mb-0 flex items-baseline gap-1 text-blue-600 z-10 px-3 py-1.5 text-xs italic bg-white rounded-t-lg shadow-[2px_-2px_10px_-3px_rgba(0,0,0,0.05)] border border-b-0 border-gray-200">
          <span className="font-semibold leading-none">{typingText}</span>
          <div className="flex space-x-0.5 items-baseline">
            <div className="w-1 h-1 bg-blue-600 rounded-full animate-custom-wave" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1 h-1 bg-blue-600 rounded-full animate-custom-wave" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1 h-1 bg-blue-600 rounded-full animate-custom-wave" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}

      {showEmojiPicker && (
        <div className="absolute bottom-full left-0 mb-2 z-50">
          <Picker onEmojiClick={handleEmojiClick} disableAutoFocus={true} native />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="flex items-end justify-between w-full p-3 bg-white border-t border-gray-200 dark:bg-gray-900 dark:border-gray-700 relative z-20">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="focus:outline-none pb-1.5"
          >
            <EmojiHappyIcon
              className="h-7 w-7 text-blue-600 hover:text-blue-700 transition-colors dark:text-blue-500"
              aria-hidden="true"
            />
          </button>

          {/* Đổi từ <input> sang <textarea> */}
          <textarea
            ref={textareaRef}
            rows="1"
            placeholder="Nhập tin nhắn..."
            className="block w-full py-2.5 pl-4 mx-3 outline-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white resize-none overflow-y-auto"
            style={{ minHeight: "42px", maxHeight: "120px" }}
            name="message"
            required
            value={message}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              // Nhấn Enter (không kèm Shift) để gửi tin nhắn
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button 
            type="submit"
            disabled={!message.trim()}
            className="disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none pb-1.5"
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