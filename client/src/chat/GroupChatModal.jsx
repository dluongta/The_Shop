import { useState, useEffect } from "react";
import { useApi } from "../services/ChatService";

export default function GroupChatModal({ users, currentUser, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState([]);
  const { createChatRoom } = useApi();

  // Lọc bỏ currentUser khỏi danh sách chọn
  const filteredUsers = users.filter(u => u._id !== currentUser._id);

  const toggleSelect = (userId) => {
    setSelected((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim() || selected.length < 1) { // chỉ cần chọn thêm ít nhất 1 người
      alert("Please enter group name and select at least 1 member.");
      return;
    }
    try {
      // Thêm currentUser._id mặc định vào memberIds
      const memberIds = [currentUser._id, ...selected];
      const res = await createChatRoom({ name, memberIds, isGroup: true });
      onCreated(res);
    } catch (error) {
      console.error("Error creating group chat:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full">
        <h2 className="text-xl font-bold mb-4">Create New Group Chat</h2>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name"
          className="border border-gray-300 rounded px-3 py-2 w-full mb-4"
        />

        <div className="max-h-64 overflow-y-auto mb-4 border border-gray-200 rounded p-2">
          {filteredUsers.map((u) => (
            <label key={u._id} className="flex items-center mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(u._id)}
                onChange={() => toggleSelect(u._id)}
                className="mr-2"
              />
              <span>{u.email}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
}
