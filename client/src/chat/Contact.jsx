import UserLayout from "../layouts/UserLayout";

export default function Contact({
  chatRoom,
  onlineUsersId,
  currentUser,
  users,
}) {
  if (!chatRoom || !currentUser) return null;

  // ===== GROUP CHAT =====
  if (chatRoom.isGroup) {
    const isRead =
      !chatRoom.lastMessage ||
      chatRoom.lastMessage.sender === currentUser._id ||
      chatRoom.lastMessage.isRead;

    return (
      <div className="flex items-center justify-between w-full px-3 py-2">
        <div className="font-semibold text-black">
          {chatRoom.name || "Unnamed Group"}
        </div>
        {!isRead && (
          <span className="inline-block w-3 h-3 bg-red-500 rounded-full" />
        )}
      </div>
    );
  }

  // ===== 1–1 CHAT =====
  const contactId = chatRoom.members.find(
    (id) => id !== currentUser._id
  );

  const contact = users.find((u) => u._id === contactId);

  if (!contact) return null;

  const isRead =
    !chatRoom.lastMessage ||
    chatRoom.lastMessage.sender === currentUser._id ||
    chatRoom.lastMessage.isRead;

  return (
    <UserLayout
      user={contact}
      onlineUsersId={onlineUsersId}
      isRead={isRead}
    />
  );
}
