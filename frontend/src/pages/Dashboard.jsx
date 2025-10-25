import { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import MembersList from "../components/MembersList";

const Dashboard = () => {
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [userId] = useState("user-123"); // Mock user ID
  const [userRole] = useState("owner"); // Mock user role
  const [rooms, setRooms] = useState([
    { id: "1", name: "General", description: "General discussion", owner_id: "user-123" },
    { id: "2", name: "Math Study", description: "Math homework help", owner_id: "user-123" },
  ]);
  const [messages, setMessages] = useState({
    "1": [
      {
        id: "msg1",
        content: "Welcome to the General room!",
        user_id: "user-123",
        display_name: "John Doe",
        created_at: new Date().toISOString(),
        is_pinned: false,
        reactions: [],
      },
    ],
    "2": [],
  });
  const [members] = useState([
    { id: "user-123", display_name: "John Doe", status: "online", role: "owner" },
    { id: "user-456", display_name: "Jane Smith", status: "online", role: "member" },
    { id: "user-789", display_name: "Bob Wilson", status: "offline", role: "member" },
  ]);

  const handleRoomCreated = (newRoom) => {
    setRooms([newRoom, ...rooms]);
    setMessages({ ...messages, [newRoom.id]: [] });
  };

  const handleSendMessage = (content) => {
    if (!selectedRoomId) return;

    const newMessage = {
      id: `msg-${Date.now()}`,
      content,
      user_id: userId,
      display_name: "John Doe",
      created_at: new Date().toISOString(),
      is_pinned: false,
      reactions: [],
    };

    setMessages({
      ...messages,
      [selectedRoomId]: [...(messages[selectedRoomId] || []), newMessage],
    });
  };

  const handleReaction = (messageId, emoji, userId) => {
    if (!selectedRoomId) return;

    const roomMessages = messages[selectedRoomId] || [];
    const updatedMessages = roomMessages.map((msg) => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions.find(
          (r) => r.user_id === userId && r.emoji === emoji
        );

        if (existingReaction) {
          // Remove reaction
          return {
            ...msg,
            reactions: msg.reactions.filter(
              (r) => !(r.user_id === userId && r.emoji === emoji)
            ),
          };
        } else {
          // Add reaction
          return {
            ...msg,
            reactions: [...msg.reactions, { emoji, user_id: userId }],
          };
        }
      }
      return msg;
    });

    setMessages({ ...messages, [selectedRoomId]: updatedMessages });
  };

  const handlePinMessage = (messageId) => {
    if (!selectedRoomId) return;

    const roomMessages = messages[selectedRoomId] || [];
    const updatedMessages = roomMessages.map((msg) =>
      msg.id === messageId ? { ...msg, is_pinned: !msg.is_pinned } : msg
    );

    setMessages({ ...messages, [selectedRoomId]: updatedMessages });
  };

  const handleDeleteMessage = (messageId) => {
    if (!selectedRoomId) return;

    const roomMessages = messages[selectedRoomId] || [];
    const updatedMessages = roomMessages.filter((msg) => msg.id !== messageId);

    setMessages({ ...messages, [selectedRoomId]: updatedMessages });
  };

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="d-flex" style={{ height: "100vh" }}>
      <Sidebar
        selectedRoomId={selectedRoomId}
        onRoomSelect={setSelectedRoomId}
        userId={userId}
        rooms={rooms}
        onRoomCreated={handleRoomCreated}
      />
      <ChatArea
        roomId={selectedRoomId}
        userId={userId}
        userRole={userRole}
        roomName={selectedRoom?.name || ""}
        messages={messages[selectedRoomId] || []}
        onSendMessage={handleSendMessage}
        onReaction={handleReaction}
        onPinMessage={handlePinMessage}
        onDeleteMessage={handleDeleteMessage}
      />
      <MembersList roomId={selectedRoomId} members={members} />
    </div>
  );
};

export default Dashboard;