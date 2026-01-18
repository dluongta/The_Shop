export default function Message({ message, self, users = [] }) {
  // senderId có thể là string hoặc object
  const senderId =
    typeof message.sender === "string"
      ? message.sender
      : message.sender?._id;

  const senderUser = users.find((u) => u._id === senderId);

  const isSelf = senderId === self;

  return (
    <li
      className={`flex ${
        isSelf ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-xs px-4 py-2 rounded-lg text-sm shadow
          ${
            isSelf
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-900"
          }`}
      >
        {/* ✅ Sender name */}
        {!isSelf && (
          <p className="text-xs font-semibold mb-1 text-gray-600">
            {senderUser?.email ||
              senderUser?.name ||
              "Former member"}
          </p>
        )}

        {/* Message content */}
        <p>{message.message}</p>

        {/* Time */}
        <span className="block text-[10px] text-right opacity-70 mt-1">
          {new Date(message.createdAt).toLocaleTimeString()}
        </span>
      </div>
    </li>
  );
}
