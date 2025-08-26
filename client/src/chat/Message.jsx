import { format } from "timeago.js";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Message({ message, self, users, currentUser }) {
  // Tìm người gửi trong danh sách users
  const senderInfo = users?.find((u) => u._id === message.sender);
  const senderName =
    message.sender === currentUser._id
      ? "You"
      : senderInfo?.email || senderInfo?.name || "Unknown";

  return (
    <li
      className={classNames(
        self !== message.sender ? "justify-end" : "justify-start",
        "flex"
      )}
    >
      <div>
        <div
          className={classNames(
            self !== message.sender
              ? "text-gray-700 dark:text-gray-400 bg-white border border-gray-200 shadow-md dark:bg-gray-900 dark:border-gray-700"
              : "bg-blue-600 dark:bg-blue-500 text-white",
            "relative max-w-xl px-4 py-2 rounded-lg shadow"
          )}
        >
          <span className="block font-normal">{message.message}</span>
        </div>

        {/* Tên người gửi */}
        <span className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mt-0.5">
          {senderName}
        </span>

        {/* Thời gian gửi */}
        <span className="block text-sm text-gray-700 dark:text-gray-400">
          {format(message.createdAt)}
        </span>
      </div>
    </li>
  );
}
