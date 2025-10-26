import { Modal, Button } from "react-bootstrap";
import { formatDistanceToNow } from "date-fns";
import axios from "axios";
import { toast } from "sonner";

const API_URL = "http://localhost:5001/api";

const InvitationsModal = ({
  show,
  onHide,
  invitations = [],
  userId,
  token,
  onUpdate = () => {}, // Callback to refresh parent state after accept/decline
}) => {

  const handleAccept = async (roomId) => {
    try {
      await axios.post(
        `${API_URL}/rooms/${roomId}/join`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Joined room successfully!");
      onUpdate(); // Refresh rooms and invitations
    } catch (err) {
      console.error(err);
      toast.error("Failed to join room.");
    }
  };

  const handleDecline = (roomId) => {
    // For now, just update UI; backend can store declined invitations if needed
    const remaining = invitations.filter((inv) => inv.room_id !== roomId);
    onUpdate(remaining);
    toast.info("Invitation declined.");
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Room Invitations</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {invitations.length === 0 ? (
          <p className="text-muted text-center my-3">
            No pending invitations.
          </p>
        ) : (
          <div className="d-flex flex-column gap-3">
            {invitations.map((invitation, index) => (
              <div
                key={`${invitation.room_id || index}-${invitation.invited_at || index}`}
                className="border rounded p-3 shadow-sm"
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 className="mb-1 fw-semibold">
                      #{invitation.room_name || "Unnamed Room"}
                    </h6>
                    <p className="text-muted small mb-0">
                      Invited by <strong>{invitation.invited_by || "Unknown"}</strong>
                    </p>
                    {invitation.invited_at && (
                      <p className="text-muted small mt-1">
                        {formatDistanceToNow(new Date(invitation.invited_at), {
                          addSuffix: true,
                        })}
                      </p>
                    )}
                  </div>

                  <div className="d-flex gap-2">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleAccept(invitation.room_id)}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDecline(invitation.room_id)}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default InvitationsModal;
