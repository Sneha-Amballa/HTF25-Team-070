import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import MembersList from "../components/MembersList";
import JoinRoomModal from "../components/JoinRoomModal";
import InviteMembersModal from "../components/InviteMembersModal";
import InvitationsModal from "../components/InvitationsModal";
import CreateRoomDialog from "../components/CreateRoomDialog";
import { initSocket, closeSocket } from "../services/socket";
import { toast } from "sonner";

const API_URL = "http://localhost:5001/api";

const Dashboard = () => {
  const token = localStorage.getItem("token");
  const [userId, setUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState("");

  const [rooms, setRooms] = useState([]);
  const [roomMemberships, setRoomMemberships] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState({});

  const [selectedRoomId, setSelectedRoomId] = useState(null);

  // Modals
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInvitationsModal, setShowInvitationsModal] = useState(false);
  const [showCreateRoomDialog, setShowCreateRoomDialog] = useState(false);

  // ---- Fetch current user info from token ----
  useEffect(() => {
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserId(payload.id);
      setCurrentUserName(payload.displayName || "Unknown");
    } catch (err) {
      console.error("Invalid token:", err);
    }
  }, [token]);

  // ---- Fetch rooms from backend ----
  const fetchRooms = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/rooms`, { headers: { Authorization: `Bearer ${token}` } });
      setRooms(res.data);

      const memberships = {};
      res.data.forEach((room) => {
        memberships[room._id] = room.members.map((m) => ({
          user_id: m.user_id,
          display_name: m.display_name || "Member",
          role: m.role,
          status: m.status || "offline",
        }));
      });
      setRoomMemberships(memberships);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
      toast.error("Failed to load rooms.");
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [token]);

  // ---- Fetch all users ----
  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API_URL}/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setAllUsers(res.data))
      .catch((err) => {
        console.error("Failed to fetch users:", err);
        toast.error("Failed to load users.");
      });
  }, [token]);

  // ---- Socket.IO ----
  useEffect(() => {
    if (!userId) return;
    initSocket(currentUserName, userId);
    return () => closeSocket();
  }, [currentUserName, userId]);

  // ---- Derived data ----
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

  // ---- Handlers ----

  // Room created
  const handleRoomCreated = () => fetchRooms();

  // Join room
  const handleJoinRoom = async (roomId) => {
    try {
      await axios.post(`${API_URL}/rooms/${roomId}/join`, { userId }, { headers: { Authorization: `Bearer ${token}` } });
      fetchRooms();
      toast.success("Joined room!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to join room.");
    }
  };

  // Invite members
  const handleInviteUsers = async (roomId, userIds) => {
    try {
      for (let invitedUserId of userIds) {
        await axios.post(
          `${API_URL}/rooms/${roomId}/invite`,
          { invitedUserId, invitedBy: userId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      fetchRooms();
      toast.success("Users invited successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to invite users.");
    }
  };

  // Remove member
  const handleRemoveMember = async (roomId, memberId) => {
    try {
      if (!isAdmin) return;
      await axios.post(`${API_URL}/rooms/${roomId}/remove`, { memberId }, { headers: { Authorization: `Bearer ${token}` } });
      fetchRooms();
      toast.success("Member removed!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove member.");
    }
  };

  // Accept invitation
  const handleAcceptInvitation = async (roomId) => {
    try {
      await handleJoinRoom(roomId); // Reuse join API
      setPendingInvitations((prev) => ({
        ...prev,
        [userId]: (prev[userId] || []).filter((inv) => inv.room_id !== roomId),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // Decline invitation
  const handleDeclineInvitation = (roomId) => {
    setPendingInvitations((prev) => ({
      ...prev,
      [userId]: (prev[userId] || []).filter((inv) => inv.room_id !== roomId),
    }));
    toast.info("Invitation declined.");
  };

  return (
    <div className="d-flex" style={{ height: "100vh" }}>
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

      <InvitationsModal
        show={showInvitationsModal}
        onHide={() => setShowInvitationsModal(false)}
        invitations={pendingInvitations[userId] || []}
        userId={userId}
        token={token}
        onUpdate={(updatedInvites) => setPendingInvitations((prev) => ({
          ...prev,
          [userId]: updatedInvites || prev[userId],
        }))}
      />

      <CreateRoomDialog
        open={showCreateRoomDialog}
        onOpenChange={setShowCreateRoomDialog}
        userId={userId}
        token={token}
        onRoomCreated={handleRoomCreated}
      />
    </div>
  );
};

export default Dashboard;
