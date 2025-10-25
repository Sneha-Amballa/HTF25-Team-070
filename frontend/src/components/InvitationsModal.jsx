import { Modal, Button } from "react-bootstrap";
import { formatDistanceToNow } from "date-fns";

const InvitationsModal = ({ show, onHide, invitations, onAccept, onDecline }) => {
  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Room Invitations</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {invitations.length === 0 ? (
          <p className="text-muted text-center">No pending invitations.</p>
        ) : (
          <div className="d-flex flex-column gap-3">
            {invitations.map((invitation) => (
              <div
                key={`${invitation.room_id}-${invitation.invited_at}`}
                className="border rounded p-3"
              >
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h6 className="mb-1">#{invitation.room_name}</h6>
                    <p className="text-muted small mb-0">
                      Invited by {invitation.invited_by}
                    </p>
                    <p className="text-muted" style={{ fontSize: "0.75rem" }}>
                      {formatDistanceToNow(new Date(invitation.invited_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => onAccept(invitation.room_id)}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onDecline(invitation.room_id)}
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
