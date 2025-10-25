import { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import MembersList from "../components/MembersList";
import JoinRoomModal from "../components/JoinRoomModal";
import PendingRequestsModal from "../components/PendingRequestsModal";
import InviteMembersModal from "../components/InvitationsModal";
import InvitationsModal from "../components/InvitationsModal";

const Dashboard = () => {
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [userId] = useState("user-123"); // Mock current user ID
  const [currentUserName] = useState("John Doe"); // Mock current user name
  const [rooms, setRooms] = useState([
    { id: "1", name: "General", description: "General discussion", owner_id: "user-123" },
    { id: "2", name: "Math Study", description: "Math homework help", owner_id: "user-456" },
  ]);
  
  // Room memberships - tracks which users are in which rooms
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

  // Pending join requests (users requesting to join)
  const [pendingRequests, setPendingRequests] = useState({
    "1": [],
    "2": [
      { user_id: "user-123", display_name: "John Doe", requested_at: new Date().toISOString() },
    ],
  });

  // Pending invitations (admins inviting users)
  const [pendingInvitations, setPendingInvitations] = useState({
    "user-123": [
      { room_id: "2", room_name: "Math Study", invited_by: "Jane Smith", invited_at: new Date().toISOString() },
    ],
    "user-456": [],
    "user-789": [],
    "user-999": [],
  });

  // All users in the system
  const [allUsers] = useState([
    { id: "user-123", display_name: "John Doe", status: "online", email: "john@example.com" },
    { id: "user-456", display_name: "Jane Smith", status: "online", email: "jane@example.com" },
    { id: "user-789", display_name: "Bob Wilson", status: "offline", email: "bob@example.com" },
    { id: "user-999", display_name: "Alice Johnson", status: "online", email: "alice@example.com" },
    { id: "user-111", display_name: "Charlie Brown", status: "offline", email: "charlie@example.com" },
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

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInvitationsModal, setShowInvitationsModal] = useState(false);

  // Get rooms where current user is a member
  const userRooms = rooms.filter((room) => 
    roomMemberships[room.id]?.some((member) => member.user_id === userId)
  );

  // Get all available rooms (for joining)
  const availableRooms = rooms.filter((room) => 
    !roomMemberships[room.id]?.some((member) => member.user_id === userId)
  );

  // Check if current user is admin of selected room
  const isAdmin = selectedRoomId 
    ? roomMemberships[selectedRoomId]?.find((m) => m.user_id === userId)?.role === "admin"
    : false;

  // Count pending requests for admin rooms
  const pendingRequestsCount = Object.keys(pendingRequests).reduce((count, roomId) => {
    const isAdminOfRoom = roomMemberships[roomId]?.find((m) => m.user_id === userId)?.role === "admin";
    return isAdminOfRoom ? count + pendingRequests[roomId].length : count;
  }, 0);

  // Count pending invitations for current user
  const myInvitationsCount = pendingInvitations[userId]?.length || 0;

  const handleRoomCreated = (newRoom) => {
    setRooms([newRoom, ...rooms]);
    setMessages({ ...messages, [newRoom.id]: [] });
    // Creator automatically becomes admin
    setRoomMemberships({
      ...roomMemberships,
      [newRoom.id]: [{ user_id: userId, display_name: currentUserName, role: "admin", status: "online" }],
    });
    setPendingRequests({ ...pendingRequests, [newRoom.id]: [] });
  };

  const handleJoinRequest = (roomId) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    // Add to pending requests
    setPendingRequests({
      ...pendingRequests,
      [roomId]: [
        ...(pendingRequests[roomId] || []),
        {
          user_id: userId,
          display_name: currentUserName,
          requested_at: new Date().toISOString(),
        },
      ],
    });

    setShowJoinModal(false);
  };

  const handleApproveRequest = (roomId, requestUserId) => {
    const request = pendingRequests[roomId]?.find((r) => r.user_id === requestUserId);
    if (!request) return;

    const user = allUsers.find((u) => u.id === requestUserId);

    // Add user to room members
    setRoomMemberships({
      ...roomMemberships,
      [roomId]: [
        ...(roomMemberships[roomId] || []),
        { 
          user_id: request.user_id, 
          display_name: request.display_name, 
          role: "member",
          status: user?.status || "offline"
        },
      ],
    });

    // Remove from pending requests
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

    // Add invitations for each user
    const updatedInvitations = { ...pendingInvitations };
    
    userIds.forEach((invitedUserId) => {
      const invitation = {
        room_id: roomId,
        room_name: room.name,
        invited_by: currentUserName,
        invited_at: new Date().toISOString(),
      };

      if (updatedInvitations[invitedUserId]) {
        updatedInvitations[invitedUserId] = [...updatedInvitations[invitedUserId], invitation];
      } else {
        updatedInvitations[invitedUserId] = [invitation];
      }
    });

    setPendingInvitations(updatedInvitations);
    setShowInviteModal(false);
  };

  const handleAcceptInvitation = (roomId) => {
    const user = allUsers.find((u) => u.id === userId);
    if (!user) return;

    // Add user to room members
    setRoomMemberships({
      ...roomMemberships,
      [roomId]: [
        ...(roomMemberships[roomId] || []),
        { 
          user_id: userId, 
          display_name: currentUserName, 
          role: "member",
          status: user.status
        },
      ],
    });

    // Remove invitation
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

  const handleSendMessage = (content) => {
    if (!selectedRoomId) return;

    // Check if user is a member of the room
    const isMember = roomMemberships[selectedRoomId]?.some((m) => m.user_id === userId);
    if (!isMember) return;

    const newMessage = {
      id: `msg-${Date.now()}`,
      content,
      user_id: userId,
      display_name: currentUserName,
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
          return {
            ...msg,
            reactions: msg.reactions.filter(
              (r) => !(r.user_id === userId && r.emoji === emoji)
            ),
          };
        } else {
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
    if (!selectedRoomId || !isAdmin) return;

    const roomMessages = messages[selectedRoomId] || [];
    const updatedMessages = roomMessages.map((msg) =>
      msg.id === messageId ? { ...msg, is_pinned: !msg.is_pinned } : msg
    );

    setMessages({ ...messages, [selectedRoomId]: updatedMessages });
  };

  const handleDeleteMessage = (messageId) => {
    if (!selectedRoomId || !isAdmin) return;

    const roomMessages = messages[selectedRoomId] || [];
    const updatedMessages = roomMessages.filter((msg) => msg.id !== messageId);

    setMessages({ ...messages, [selectedRoomId]: updatedMessages });
  };

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const currentRoomMembers = selectedRoomId ? (roomMemberships[selectedRoomId] || []) : [];

  // Check if user is member of selected room
  const isMemberOfRoom = selectedRoomId 
    ? roomMemberships[selectedRoomId]?.some((m) => m.user_id === userId)
    : false;

  // Get available users to invite (not already in the room and no pending invitation)
  const availableUsersToInvite = selectedRoomId ? allUsers.filter((user) => {
    const isAlreadyMember = roomMemberships[selectedRoomId]?.some((m) => m.user_id === user.id);
    const hasPendingInvitation = pendingInvitations[user.id]?.some((inv) => inv.room_id === selectedRoomId);
    return !isAlreadyMember && !hasPendingInvitation && user.id !== userId;
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
        messages={messages[selectedRoomId] || []}
        onSendMessage={handleSendMessage}
        onReaction={handleReaction}
        onPinMessage={handlePinMessage}
        onDeleteMessage={handleDeleteMessage}
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