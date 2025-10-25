import { useState } from "react";
import CreateRoomDialog from "./CreateRoomDialog";
import { useNavigate } from "react-router-dom";
import { Badge } from "react-bootstrap";

const Sidebar = ({ selectedRoomId, onRoomSelect, userId, rooms, onRoomCreated, onJoinRoom, pendingRequestsCount, myInvitationsCount, onShowPendingRequests, onShowInvitations, isAdmin }) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = () => {
    navigate("/auth");
  };

  return (
    <div className="d-flex flex-column bg-white border-end" style={{ width: "260px", height: "100vh" }}>
      {/* Header */}
      <div className="p-3 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <div className="bg-primary text-white rounded d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>
            #
          </div>
          <h5 className="m-0 fw-bold">Study Rooms</h5>
        </div>
      </div>

      {/* Rooms List */}
      <div className="flex-grow-1 overflow-auto p-3">
        <div className="d-flex flex-column gap-1">
          {rooms.length === 0 ? (
            <p className="text-muted small text-center mt-3">No rooms yet. Create or join one!</p>
          ) : (
            rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => onRoomSelect(room.id)}
                className={`btn text-start d-flex align-items-center gap-2 ${
                  selectedRoomId === room.id
                    ? "btn-primary"
                    : "btn-light"
                }`}
              >
                <span style={{ fontSize: "1.1rem" }}>#</span>
                <span className="text-truncate">{room.name}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-top d-flex flex-column gap-2">
        {myInvitationsCount > 0 && (
          <button
            onClick={onShowInvitations}
            className="btn btn-info w-100 position-relative text-white"
          >
            <span className="me-2">📨</span>
            My Invitations
            <Badge bg="danger" className="position-absolute top-0 end-0 translate-middle">
              {myInvitationsCount}
            </Badge>
          </button>
        )}
        {isAdmin && pendingRequestsCount > 0 && (
          <button
            onClick={onShowPendingRequests}
            className="btn btn-warning w-100 position-relative"
          >
            <span className="me-2">👥</span>
            Pending Requests
            <Badge bg="danger" className="position-absolute top-0 end-0 translate-middle">
              {pendingRequestsCount}
            </Badge>
          </button>
        )}
        <button
          onClick={onJoinRoom}
          className="btn btn-success w-100"
        >
          <span className="me-2">➕</span>
          Join Room
        </button>
        <button
          onClick={() => setCreateDialogOpen(true)}
          className="btn btn-primary w-100"
        >
          <span className="me-2">+</span>
          Create Room
        </button>
        <button onClick={handleSignOut} className="btn btn-outline-secondary w-100">
          <span className="me-2">→</span>
          Sign Out
        </button>
      </div>

      <CreateRoomDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        userId={userId}
        onRoomCreated={onRoomCreated}
      />
    </div>
  );
};

export default Sidebar;