import { useState } from "react";
import { Modal, Spinner } from "react-bootstrap";
import { toast } from "sonner";

const CreateRoomDialog = ({ open, onOpenChange, userId, onRoomCreated }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Room name cannot be empty!");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      // Simulate room creation
      const newRoom = {
        id: Date.now().toString(),
        name: name.trim(),
        description: description.trim() || null,
        owner_id: userId,
        created_at: new Date().toISOString(),
      };

      onRoomCreated(newRoom); // Update Dashboard state

      toast.success("Room created! Your study room is ready.");

      setName("");
      setDescription("");
      setLoading(false);
      onOpenChange(false);
    }, 500); // simulate delay
  };

  return (
    <Modal show={open} onHide={() => onOpenChange(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>Create Study Room</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="mb-3">
          <label className="form-label">Room Name</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter room name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Description (Optional)</label>
          <textarea
            className="form-control"
            placeholder="What's this room about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            disabled={loading}
          />
        </div>
      </Modal.Body>

      <Modal.Footer>
        <button
          className="btn btn-secondary"
          onClick={() => onOpenChange(false)}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={handleCreate}
          disabled={loading || !name.trim()}
        >
          {loading && <Spinner animation="border" size="sm" className="me-2" />}
          {loading ? "Creating..." : "Create Room"}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateRoomDialog;
