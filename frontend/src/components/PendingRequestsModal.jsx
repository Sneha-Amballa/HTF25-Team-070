import { Modal } from "react-bootstrap";
import { formatDistanceToNow } from "date-fns";

const PendingRequestsModal = ({ show, onHide, rooms, pendingRequests, roomMemberships, currentUserId, onApprove, onReject }) => {
  // Get rooms where current user is admin and has pending requests
  const adminRoomsWithRequests = rooms.filter((room) => {
    const isAdmin = roomMemberships[room.id]?.find((m) => m.user_id === currentUserId)?.role === "admin";
    const hasPendingRequests = pendingRequests[room.id]?.length > 0;
    return isAdmin && hasPendingRequests;
  });

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Pending Join Requests</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {adminRoomsWithRequests.length === 0 ? (
          <p className="text-muted text-center">No pending requests.</p>
        ) : (
          <div className="d-flex flex-column gap-3">
            {adminRoomsWithRequests.map((room) => (
              <div key={room.id} className="border rounded p-3">
                <h6 className="mb-3">#{room.name}</h6>
                <div className="d-flex flex-column gap-2">
                  {pendingRequests[room.id].map((request) => (
                    <div key={request.user_id} className="d-flex align-items-center justify-content-between p-2 bg-light rounded">
                      <div className="d-flex align-items-center gap-2">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px", fontSize: "0.75rem" }}>
                          {request.display_name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="mb-0 small fw-medium">{request.display_name}</p>
                          <p className="mb-0 text-muted" style={{ fontSize: "0.7rem" }}>
                            {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => onApprove(room.id, request.user_id)}
                        >
                          ✓ Approve
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => onReject(room.id, request.user_id)}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default PendingRequestsModal;