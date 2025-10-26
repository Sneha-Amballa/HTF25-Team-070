import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import MembersList from "../components/MembersList";
import JoinRoomModal from "../components/JoinRoomModal";
import PendingRequestsModal from "../components/PendingRequestsModal";
import InviteMembersModal from "../components/InviteMembersModal";
import InvitationsModal from "../components/InvitationsModal";
import { initSocket, closeSocket } from "../services/socket";

const Dashboard = () => {
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [userId] = useState("user-123"); // Replace with real user ID after auth
  const [currentUserName] = useState("John Doe"); // Replace with real username

  const [rooms, setRooms] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [messages, setMessages] = useState([]);

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInvitationsModal, setShowInvitationsModal] = useState(false);

  // Socket
  useEffect(() => {
    const socket = initSocket(currentUserName, userId);

    // Listen for messages
    socket.on("newMessage", (msg) => {
      if (msg.roomId === selectedRoomId) setMessages((prev) => [...prev, msg]);
    });

    // Cleanup
    return () => closeSocket();
  }, [selectedRoomId, currentUserName, userId]);

  // Fetch rooms from backend
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/rooms")
      .then((res) => setRooms(res.data))
      .catch((err) => console.error("Failed to fetch rooms:", err));
  }, []);

  // Fetch all users (for invitations)
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/users")
      .then((res) => setAllUsers(res.data))
      .catch((err) => console.error("Failed to fetch users:", err));
  }, []);

  // Fetch messages for selected room
  useEffect(() => {
    if (!selectedRoomId) return;
    axios
      .get(`http://localhost:5000/api/rooms/${selectedRoomId}/messages`)
      .then((res) => setMessages(res.data))
      .catch((err) => console.error("Failed to fetch messages:", err));
  }, [selectedRoomId]);

  const selectedRoom = rooms.find((r) => r._id === selectedRoomId);
  const currentRoomMembers = selectedRoom?.members || [];

  const isMemberOfRoom = currentRoomMembers.some((m) => m.user_id === userId);
  const isAdmin =
    currentRoomMembers.find((m) => m.user_id === userId)?.role === "admin";

  const userRooms = rooms.filter((room) =>
    room.members.some((m) => m.user_id === userId)
  );

  const availableRooms = rooms.filter(
    (room) => !room.members.some((m) => m.user_id === userId)
  );

  // --- Handlers ---
  const handleJoinRoom = async (roomId) => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/rooms/${roomId}/join`,
        { userId, displayName: currentUserName }
      );
      setRooms((prev) =>
        prev.map((r) => (r._id === roomId ? res.data : r))
      );
      setShowJoinModal(false);
    } catch (err) {
      console.error("Join failed:", err);
    }
  };

  const handleInviteUsers = async (roomId, userIds) => {
    try {
      await Promise.all(
        userIds.map((uid) =>
          axios.post(
            `http://localhost:5000/api/rooms/${roomId}/invite`,
            { invitedUserId: uid, invitedBy: currentUserName }
          )
        )
      );
      setShowInviteModal(false);
    } catch (err) {
      console.error("Invite failed:", err);
    }
  };

  const handleRemoveMember = async (roomId, memberId) => {
    if (!isAdmin) return;
    try {
      await axios.post(
        `http://localhost:5000/api/rooms/${roomId}/remove`,
        { memberId }
      );
      setRooms((prev) =>
        prev.map((r) =>
          r._id === roomId
            ? { ...r, members: r.members.filter((m) => m.user_id !== memberId) }
            : r
        )
      );
    } catch (err) {
      console.error("Remove member failed:", err);
    }
  };

  const availableUsersToInvite = allUsers.filter(
    (u) =>
      !currentRoomMembers.some((m) => m.user_id === u._id) &&
      u._id !== userId
  );

  return (
    <div className="d-flex" style={{ height: "100vh" }}>
      <Sidebar
        selectedRoomId={selectedRoomId}
        onRoomSelect={setSelectedRoomId}
        userId={userId}
        rooms={userRooms}
        onRoomCreated={(newRoom) => setRooms([newRoom, ...rooms])}
        onJoinRoom={() => setShowJoinModal(true)}
        isAdmin={isAdmin}
      />

      <ChatArea
        roomId={selectedRoomId}
        userId={userId}
        userRole={isAdmin ? "admin" : "member"}
        roomName={selectedRoom?.name || ""}
        isMember={isMemberOfRoom}
        messages={messages}
        setMessages={setMessages}
      />

      <MembersList
        roomId={selectedRoomId}
        members={currentRoomMembers}
        isAdmin={isAdmin}
        currentUserId={userId}
        onRemoveMember={handleRemoveMember}
        onInviteMembers={() => setShowInviteModal(true)}
      />

      <JoinRoomModal
        show={showJoinModal}
        onHide={() => setShowJoinModal(false)}
        rooms={availableRooms}
        onJoinRequest={handleJoinRoom}
      />

      <InviteMembersModal
        show={showInviteModal}
        onHide={() => setShowInviteModal(false)}
        roomId={selectedRoomId}
        roomName={selectedRoom?.name || ""}
        availableUsers={availableUsersToInvite}
        onInvite={handleInviteUsers}
      />
    </div>
  );
};

export default Dashboard;
