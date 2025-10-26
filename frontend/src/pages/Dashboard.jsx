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
  const [userId] = useState("user-123"); // Replace with logged-in user ID
  const [currentUserName] = useState("John Doe"); // Replace with logged-in user name

  const [rooms, setRooms] = useState([]);
  const [roomMemberships, setRoomMemberships] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState({});
  const [pendingRequests, setPendingRequests] = useState({});

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInvitationsModal, setShowInvitationsModal] = useState(false);

  // --- Fetch rooms, memberships, and invitations dynamically ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/rooms");
        const { rooms, memberships, invitations } = res.data;

        setRooms(rooms);

        // Convert memberships array to object keyed by room ID
        const membershipsByRoom = {};
        memberships.forEach((m) => {
          const roomId = m.room_id;
          if (!membershipsByRoom[roomId]) membershipsByRoom[roomId] = [];
          membershipsByRoom[roomId].push({
            user_id: m.user_id,
            display_name: m.display_name,
            role: m.role,
            status: m.status,
          });
        });
        setRoomMemberships(membershipsByRoom);

        // Convert invitations to object keyed by user ID
        const invitationsByUser = {};
        invitations.forEach((inv) => {
          if (!invitationsByUser[inv.user_id]) invitationsByUser[inv.user_id] = [];
          invitationsByUser[inv.user_id].push({
            room_id: inv.room_id,
            room_name: inv.room_name,
            invited_by: inv.invited_by,
            invited_at: inv.invited_at,
          });
        });
        setPendingInvitations(invitationsByUser);

        // You can also derive pending requests per room
        const requests = {};
        memberships.forEach((m) => {
          if (!requests[m.room_id]) requests[m.room_id] = [];
        });
        setPendingRequests(requests);

      } catch (err) {
        console.error("Failed to fetch rooms:", err);
      }
    };

    fetchData();
  }, []);

  // --- Fetch all users ---
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/users");
        setAllUsers(res.data);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };
    fetchUsers();
  }, []);

  // Initialize Socket.IO
  useEffect(() => {
    const socket = initSocket(currentUserName, userId);
    return () => closeSocket();
  }, [currentUserName, userId]);

  // Derived data
  const userRooms = rooms.filter((room) =>
    roomMemberships[room._id]?.some((m) => m.user_id === userId)
  );

  const availableRooms = rooms.filter((room) =>
    !roomMemberships[room._id]?.some((m) => m.user_id === userId)
  );

  const isAdmin = selectedRoomId
    ? roomMemberships[selectedRoomId]?.find((m) => m.user_id === userId)?.role === "admin"
    : false;

  const pendingRequestsCount = Object.keys(pendingRequests).reduce((count, roomId) => {
    const isAdminOfRoom = roomMemberships[roomId]?.find((m) => m.user_id === userId)?.role === "admin";
    return isAdminOfRoom ? count + (pendingRequests[roomId]?.length || 0) : count;
  }, 0);

  const myInvitationsCount = pendingInvitations[userId]?.length || 0;

  const selectedRoom = rooms.find((r) => r._id === selectedRoomId);
  const currentRoomMembers = selectedRoomId ? roomMemberships[selectedRoomId] || [] : [];
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
        onRoomCreated={(newRoom) => setRooms([newRoom, ...rooms])}
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
        onInviteMembers={() => setShowInviteModal(true)}
      />
      <JoinRoomModal
        show={showJoinModal}
        onHide={() => setShowJoinModal(false)}
        rooms={availableRooms}
        onJoinRequest={(roomId) => console.log("Join request:", roomId)}
      />
      <PendingRequestsModal
        show={showPendingModal}
        onHide={() => setShowPendingModal(false)}
        rooms={rooms}
        pendingRequests={pendingRequests}
        roomMemberships={roomMemberships}
        currentUserId={userId}
        onApprove={(roomId, userId) => console.log("Approve:", roomId, userId)}
        onReject={(roomId, userId) => console.log("Reject:", roomId, userId)}
      />
      <InviteMembersModal
        show={showInviteModal}
        onHide={() => setShowInviteModal(false)}
        roomId={selectedRoomId}
        roomName={selectedRoom?.name || ""}
        availableUsers={availableUsersToInvite}
        onInvite={(roomId, users) => console.log("Invite:", roomId, users)}
      />
      <InvitationsModal
        show={showInvitationsModal}
        onHide={() => setShowInvitationsModal(false)}
        invitations={pendingInvitations[userId] || []}
        onAccept={(roomId) => console.log("Accept:", roomId)}
        onDecline={(roomId) => console.log("Decline:", roomId)}
      />
    </div>
  );
};

export default Dashboard;
