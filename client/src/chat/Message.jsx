// // export default function Message({ message, self, users = [] }) {
// //   const senderId =
// //     typeof message.sender === "string"
// //       ? message.sender
// //       : message.sender?._id;

// //   const senderUser = users.find((u) => u._id === senderId);
// //   const isSelf = senderId === self;

// //   return (
// //     <li className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
// //       <div
// //         className={`max-w-xs px-4 py-2 rounded-lg text-sm shadow ${isSelf ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-900"
// //           }`}
// //       >
// //         <p className={`text-xs font-semibold mb-1 ${isSelf ? "text-blue-100" : "text-gray-600"}`}>
// //           {senderUser?.email || senderUser?.name || "Former member"}
// //         </p>

// //         <p>{message.message}</p>

// //         {/* Time */}
// //         {/* <span className="block text-[10px] text-right opacity-70 mt-1">
// //           {new Date(message.createdAt).toLocaleTimeString()}
// //         </span> */}
// //         <span className="block text-[10px] text-right opacity-70 mt-1">
// //           {new Date(message.createdAt).toLocaleString("vi-VN", {
// //             day: "2-digit",
// //             month: "2-digit",
// //             year: "numeric",
// //             hour: "2-digit",
// //             minute: "2-digit",
// //           })}
// //         </span>

// //       </div>
// //     </li>
// //   );
// // }
// export default function Message({ message, self, users = [], onRevoke }) {
//   const senderId =
//     typeof message.sender === "string"
//       ? message.sender
//       : message.sender?._id;

//   const senderUser = users.find((u) => u._id === senderId);
//   const isSelf = senderId === self;

//   return (
//     <li className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
//       <div className="relative group max-w-xs">
//         {isSelf && !message.isDeleted && (
//           <button
//             onClick={() => onRevoke(message._id)}
//             className="absolute top-1/2 -left-10 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-100 text-red-600 text-[10px] px-2 py-1 rounded"
//           >
//             Thu hồi
//           </button>
//         )}

//         <div
//           className={`px-4 py-2 rounded-lg text-sm shadow ${
//             isSelf ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-900"
//           } ${message.isDeleted ? "opacity-60 italic bg-gray-100 text-gray-500 border" : ""}`}
//         >
//           <p className={`text-xs font-semibold mb-1 ${isSelf && !message.isDeleted ? "text-blue-100" : "text-gray-600"}`}>
//             {senderUser?.email || senderUser?.name || "Former member"}
//           </p>

//           <p>
//             {message.isDeleted ? "Tin nhắn đã bị thu hồi" : message.message}
//           </p>

//           <span className="block text-[10px] text-right opacity-70 mt-1">
//             {new Date(message.createdAt).toLocaleString("vi-VN", {
//               day: "2-digit", month: "2-digit", year: "numeric",
//               hour: "2-digit", minute: "2-digit",
//             })}
//           </span>
//         </div>
//       </div>
//     </li>
//   );
// }
import React from "react";

export default function Message({ message, self, users = [], onRevoke }) {
  const senderId =
    typeof message.sender === "string" ? message.sender : message.sender?._id;

  const senderUser = users.find((u) => u._id === senderId);
  const isSelf = senderId === self;

  return (
    <li className={`flex ${isSelf ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-xs px-4 py-2 rounded-lg text-sm shadow ${
          message.isDeleted
            ? "bg-gray-200 text-black border border-gray-400 italic" // ✅ Nền xám, chữ đen, có viền cho tin nhắn thu hồi
            : isSelf
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-900"
        }`}
      >
        {/* HIỂN THỊ TÊN / EMAIL */}
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

        {/* NỘI DUNG TIN NHẮN */}
        <p className={`break-words ${message.isDeleted ? "text-black font-medium" : ""}`}>
          {message.isDeleted ? "Tin nhắn đã bị thu hồi" : message.message}
        </p>

        <div className="flex justify-between items-end mt-2 gap-4">
          {isSelf && !message.isDeleted ? (
            <button
              onClick={() => onRevoke(message._id)}
              className="text-[10px] text-red-200 hover:text-white font-medium cursor-pointer"
            >
              Thu hồi
            </button>
          ) : (
            <span></span>
          )}

          {/* Thời gian */}
          <span 
            className={`text-[10px] text-right whitespace-nowrap ${
              message.isDeleted ? "text-black font-medium opacity-100" : "opacity-70" // ✅ Thời gian màu đen, đậm hơn khi thu hồi
            }`}
          >
            {new Date(message.createdAt).toLocaleString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </li>
  );
}