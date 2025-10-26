import { Modal } from "react-bootstrap";

const JoinRoomModal = ({ show, onHide, rooms, onJoinRequest }) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Join a Room</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {rooms.length === 0 ? (
          <p className="text-muted text-center">No available rooms to join.</p>
        ) : (
          <div className="d-flex flex-column gap-2">
            {rooms.map((room) => (
              <div key={room.id} className="border rounded p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 className="mb-1">#{room.name}</h6>
                    {room.description && (
                      <p className="text-muted small mb-0">{room.description}</p>
                    )}
                  </div>
                </div>
                <button
                  className="btn btn-primary btn-sm w-100"
                  onClick={() => onJoinRequest(room.id)}
                >
                  Request to Join
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default JoinRoomModal;