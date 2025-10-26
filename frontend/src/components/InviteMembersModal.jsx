import { useState } from "react";
import { Modal } from "react-bootstrap";

const InviteMembersModal = ({ show, onHide, roomId, roomName, availableUsers, onInvite }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  const filteredUsers = availableUsers.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.display_name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  const handleToggleUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleInvite = () => {
    if (selectedUsers.length === 0) return;
    onInvite(roomId, selectedUsers);
    setSelectedUsers([]);
    setSearchQuery("");
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setSearchQuery("");
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Invite Members to #{roomName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Search Bar */}
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Selected Count */}
        {selectedUsers.length > 0 && (
          <div className="alert alert-info py-2">
            {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
          </div>
        )}

        {/* Users List */}
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          {filteredUsers.length === 0 ? (
            <p className="text-muted text-center mt-3">
              {searchQuery ? "No users found" : "No users available to invite"}
            </p>
          ) : (
            <div className="d-flex flex-column gap-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`d-flex align-items-center gap-3 p-3 border rounded cursor-pointer ${
                    selectedUsers.includes(user.id) ? "border-primary bg-light" : ""
                  }`}
                  onClick={() => handleToggleUser(user.id)}
                  style={{ cursor: "pointer" }}
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleToggleUser(user.id)}
                    className="form-check-input"
                  />
                  <div className="position-relative">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px", fontSize: "0.9rem" }}>
                      {user.display_name[0].toUpperCase()}
                    </div>
                    {user.status === "online" && (
                      <span className="position-absolute bg-success rounded-circle" style={{ width: "12px", height: "12px", bottom: "0", right: "0", border: "2px solid white" }}></span>
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <p className="mb-0 fw-medium">{user.display_name}</p>
                    <p className="mb-0 text-muted small">{user.email}</p>
                  </div>
                  <span className="badge bg-secondary">{user.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary" onClick={handleClose}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={handleInvite}
          disabled={selectedUsers.length === 0}
        >
          Invite {selectedUsers.length > 0 && `(${selectedUsers.length})`}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default InviteMembersModal;