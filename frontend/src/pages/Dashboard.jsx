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
  const [userId] = useState("user-123"); // Mock current user ID
  const [currentUserName] = useState("John Doe"); // Mock current user name

  const [rooms, setRooms] = useState([
    { id: "1", name: "General", description: "General discussion", owner_id: "user-123" },
    { id: "2", name: "Math Study", description: "Math homework help", owner_id: "user-456" },
  ]);

  const [roomMemberships, setRoomMemberships] = useState({
    "1": [
      { user_id: "user-123", display_name: "John Doe", role: "admin", status: "online" },
      { user_id: "user-456", display_name: "Jane Smith", role: "member", status: "online" },
    ],
    "2": [
      { user_id: "user-456", display_name: "Jane Smith", role: "admin", status: "online" },
      { user_id: "user-789", display_name: "Bob Wilson", role: "member", status: "offline" },
    ],
  });

  const [pendingRequests, setPendingRequests] = useState({
    "1": [],
    "2": [
      { user_id: "user-123", display_name: "John Doe", requested_at: new Date().toISOString() },
    ],
  });

  const [pendingInvitations, setPendingInvitations] = useState({
    "user-123": [
      { room_id: "2", room_name: "Math Study", invited_by: "Jane Smith", invited_at: new Date().toISOString() },
    ],
    "user-456": [],
    "user-789": [],
    "user-999": [],
  });

  // --- Fetch users dynamically from backend ---
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/users")
      .then((res) => setAllUsers(res.data))
      .catch((err) => console.error("Failed to fetch users:", err));
  }, []);

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInvitationsModal, setShowInvitationsModal] = useState(false);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socket = initSocket(currentUserName, userId);
    return () => closeSocket();
  }, [currentUserName, userId]);

  const userRooms = rooms.filter((room) => 
    roomMemberships[room.id]?.some((member) => member.user_id === userId)
  );

  const availableRooms = rooms.filter((room) => 
    !roomMemberships[room.id]?.some((member) => member.user_id === userId)
  );

  const isAdmin = selectedRoomId 
    ? roomMemberships[selectedRoomId]?.find((m) => m.user_id === userId)?.role === "admin"
    : false;

  const pendingRequestsCount = Object.keys(pendingRequests).reduce((count, roomId) => {
    const isAdminOfRoom = roomMemberships[roomId]?.find((m) => m.user_id === userId)?.role === "admin";
    return isAdminOfRoom ? count + pendingRequests[roomId].length : count;
  }, 0);

  const myInvitationsCount = pendingInvitations[userId]?.length || 0;

  const handleRoomCreated = (newRoom) => {
    setRooms([newRoom, ...rooms]);
    setRoomMemberships({
      ...roomMemberships,
      [newRoom.id]: [{ user_id: userId, display_name: currentUserName, role: "admin", status: "online" }],
    });
    setPendingRequests({ ...pendingRequests, [newRoom.id]: [] });
  };

  const handleJoinRequest = (roomId) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    setPendingRequests({
      ...pendingRequests,
      [roomId]: [
        ...(pendingRequests[roomId] || []),
        { user_id: userId, display_name: currentUserName, requested_at: new Date().toISOString() },
      ],
    });
    setShowJoinModal(false);
  };

  const handleApproveRequest = (roomId, requestUserId) => {
    const request = pendingRequests[roomId]?.find((r) => r.user_id === requestUserId);
    if (!request) return;
    const user = allUsers.find((u) => u._id === requestUserId);
    setRoomMemberships({
      ...roomMemberships,
      [roomId]: [
        ...(roomMemberships[roomId] || []),
        { user_id: request.user_id, display_name: request.display_name, role: "member", status: user?.status || "offline" },
      ],
    });
    setPendingRequests({
      ...pendingRequests,
      [roomId]: pendingRequests[roomId].filter((r) => r.user_id !== requestUserId),
    });
  };

  const handleRejectRequest = (roomId, requestUserId) => {
    setPendingRequests({
      ...pendingRequests,
      [roomId]: pendingRequests[roomId].filter((r) => r.user_id !== requestUserId),
    });
  };

  const handleInviteUsers = (roomId, userIds) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    const updatedInvitations = { ...pendingInvitations };
    userIds.forEach((invitedUserId) => {
      const invitation = { room_id: roomId, room_name: room.name, invited_by: currentUserName, invited_at: new Date().toISOString() };
      if (updatedInvitations[invitedUserId]) updatedInvitations[invitedUserId] = [...updatedInvitations[invitedUserId], invitation];
      else updatedInvitations[invitedUserId] = [invitation];
    });

    setPendingInvitations(updatedInvitations);
    setShowInviteModal(false);
  };

  const handleAcceptInvitation = (roomId) => {
    const user = allUsers.find((u) => u._id === userId);
    if (!user) return;
    setRoomMemberships({
      ...roomMemberships,
      [roomId]: [
        ...(roomMemberships[roomId] || []),
        { user_id: userId, display_name: currentUserName, role: "member", status: user.status },
      ],
    });
    setPendingInvitations({
      ...pendingInvitations,
      [userId]: pendingInvitations[userId].filter((inv) => inv.room_id !== roomId),
    });
  };

  const handleDeclineInvitation = (roomId) => {
    setPendingInvitations({
      ...pendingInvitations,
      [userId]: pendingInvitations[userId].filter((inv) => inv.room_id !== roomId),
    });
  };

  const handleRemoveMember = (roomId, memberId) => {
    if (!isAdmin) return;
    setRoomMemberships({
      ...roomMemberships,
      [roomId]: roomMemberships[roomId].filter((m) => m.user_id !== memberId),
    });
  };

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const currentRoomMembers = selectedRoomId ? (roomMemberships[selectedRoomId] || []) : [];
  const isMemberOfRoom = selectedRoomId 
    ? roomMemberships[selectedRoomId]?.some((m) => m.user_id === userId)
    : false;

  const availableUsersToInvite = selectedRoomId ? allUsers.filter((user) => {
    const isAlreadyMember = roomMemberships[selectedRoomId]?.some((m) => m.user_id === user._id);
    const hasPendingInvitation = pendingInvitations[user._id]?.some((inv) => inv.room_id === selectedRoomId);
    return !isAlreadyMember && !hasPendingInvitation && user._id !== userId;
  }) : [];

  return (
    <div className="d-flex" style={{ height: "100vh" }}>
      <Sidebar
        selectedRoomId={selectedRoomId}
        onRoomSelect={setSelectedRoomId}
        userId={userId}
        rooms={userRooms}
        onRoomCreated={handleRoomCreated}
        onJoinRoom={() => setShowJoinModal(true)}
        pendingRequestsCount={pendingRequestsCount}
        myInvitationsCount={myInvitationsCount}
        onShowPendingRequests={() => setShowPendingModal(true)}
        onShowInvitations={() => setShowInvitationsModal(true)}
        isAdmin={isAdmin}
      />
      <ChatArea
        roomId={selectedRoomId}
        userId={userId}
        userRole={isAdmin ? "admin" : "member"}
        roomName={selectedRoom?.name || ""}
        isMember={isMemberOfRoom}
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
        onJoinRequest={handleJoinRequest}
      />

      <PendingRequestsModal
        show={showPendingModal}
        onHide={() => setShowPendingModal(false)}
        rooms={rooms}
        pendingRequests={pendingRequests}
        roomMemberships={roomMemberships}
        currentUserId={userId}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
      />

      <InviteMembersModal
        show={showInviteModal}
        onHide={() => setShowInviteModal(false)}
        roomId={selectedRoomId}
        roomName={selectedRoom?.name || ""}
        availableUsers={availableUsersToInvite}
        onInvite={handleInviteUsers}
      />

      <InvitationsModal
        show={showInvitationsModal}
        onHide={() => setShowInvitationsModal(false)}
        invitations={pendingInvitations[userId] || []}
        onAccept={handleAcceptInvitation}
        onDecline={handleDeclineInvitation}
      />
    </div>
  );
};

export default Dashboard;
