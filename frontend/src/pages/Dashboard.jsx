import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import MembersList from "../components/MembersList";
import JoinRoomModal from "../components/JoinRoomModal";
import InviteMembersModal from "../components/InviteMembersModal";
import InvitationsModal from "../components/InvitationsModal";
import CreateRoomDialog from "../components/CreateRoomDialog";
import { FaUserCircle } from "react-icons/fa"; // Profile icon

const Dashboard = () => {
  const navigate = useNavigate();
  const [userId] = useState("user123"); // mock user ID
  const [currentUserName] = useState("John Doe"); // mock name
  const [email] = useState("johndoe@example.com");

  const [rooms, setRooms] = useState([
    {
      _id: "room1",
      name: "Room 1",
      members: [{ user_id: "user123", display_name: "John Doe", role: "admin", status: "online" }],
    },
    {
      _id: "room2",
      name: "Room 2",
      members: [{ user_id: "user456", display_name: "Jane Smith", role: "member", status: "offline" }],
    },
  ]);

  const [roomMemberships, setRoomMemberships] = useState({});
  const [allUsers] = useState([
    { _id: "user123", name: "John Doe" },
    { _id: "user456", name: "Jane Smith" },
    { _id: "user789", name: "Alice Johnson" },
  ]);
  const [pendingInvitations, setPendingInvitations] = useState({ user123: [] });
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  // Modals
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInvitationsModal, setShowInvitationsModal] = useState(false);
  const [showCreateRoomDialog, setShowCreateRoomDialog] = useState(false);

  useEffect(() => {
    const memberships = {};
    rooms.forEach((room) => {
      memberships[room._id] = room.members.map((m) => ({
        user_id: m.user_id,
        display_name: m.display_name || "Member",
        role: m.role,
        status: m.status || "offline",
      }));
    });
    setRoomMemberships(memberships);
  }, [rooms]);

  const selectedRoom = rooms.find((r) => r._id === selectedRoomId);
  const currentRoomMembers = selectedRoomId ? roomMemberships[selectedRoomId] || [] : [];
  const isAdmin = selectedRoomId
    ? roomMemberships[selectedRoomId]?.find((m) => m.user_id === userId)?.role === "admin"
    : false;
  const isMemberOfRoom = selectedRoomId
    ? roomMemberships[selectedRoomId]?.some((m) => m.user_id === userId)
    : false;

  const userRooms = rooms.filter((room) => roomMemberships[room._id]?.some((m) => m.user_id === userId));
  const availableRooms = rooms.filter((room) => !roomMemberships[room._id]?.some((m) => m.user_id === userId));

  const availableUsersToInvite = selectedRoomId
    ? allUsers.filter((user) => !currentRoomMembers.some((m) => m.user_id === user._id) && user._id !== userId)
    : [];

  return (
    <div className="d-flex flex-column" style={{ height: "100vh" }}>
      {/* ✅ Top Navbar */}
      <div
        className="d-flex justify-content-between align-items-center px-4 py-2 bg-light border-bottom"
        style={{ height: "60px" }}
      >
        <h5 className="mb-0">Study Room Dashboard</h5>
        <div className="d-flex align-items-center">
          <span className="me-3">{currentUserName}</span>
          <FaUserCircle
            size={30}
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/profile", { state: { userId, currentUserName, email } })}
            title="View Profile"
          />
        </div>
      </div>

      {/* ✅ Main content area */}
      <div className="d-flex flex-grow-1">
        <Sidebar
          selectedRoomId={selectedRoomId}
          onRoomSelect={setSelectedRoomId}
          userId={userId}
          rooms={userRooms}
          onRoomCreated={() => setShowCreateRoomDialog(true)}
          onJoinRoom={() => setShowJoinModal(true)}
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
          onRemoveMember={() => {}}
          onInviteMembers={() => setShowInviteModal(true)}
        />
      </div>

      {/* Modals */}
      <JoinRoomModal
        show={showJoinModal}
        onHide={() => setShowJoinModal(false)}
        rooms={availableRooms}
        onJoinRequest={() => {}}
      />

      <InviteMembersModal
        show={showInviteModal}
        onHide={() => setShowInviteModal(false)}
        roomId={selectedRoomId}
        roomName={selectedRoom?.name || ""}
        availableUsers={availableUsersToInvite}
        onInvite={() => {}}
      />

      <InvitationsModal
        show={showInvitationsModal}
        onHide={() => setShowInvitationsModal(false)}
        invitations={pendingInvitations[userId] || []}
        userId={userId}
        token={null}
        onUpdate={(updatedInvites) =>
          setPendingInvitations((prev) => ({
            ...prev,
            [userId]: updatedInvites || prev[userId],
          }))
        }
      />

      <CreateRoomDialog
        open={showCreateRoomDialog}
        onOpenChange={setShowCreateRoomDialog}
        userId={userId}
        token={null}
        onRoomCreated={() => {}}
      />
    </div>
  );
};

export default Dashboard;