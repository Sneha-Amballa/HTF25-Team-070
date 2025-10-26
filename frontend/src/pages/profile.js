import { useLocation, useNavigate } from "react-router-dom";
import { Card, Button } from "react-bootstrap";

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, currentUserName, email } = location.state || {};

  return (
    <div
      className="d-flex justify-content-center align-items-center bg-light"
      style={{ height: "100vh" }}
    >
      <Card style={{ width: "400px" }} className="shadow-lg p-3 rounded">
        <Card.Body>
          <Card.Title className="text-center mb-4">👤 User Profile</Card.Title>
          <div className="mb-3">
            <strong>Name:</strong> {currentUserName || "N/A"}
          </div>
          <div className="mb-3">
            <strong>Email:</strong> {email || "N/A"}
          </div>
          <div className="mb-3">
            <strong>User ID:</strong> {userId || "N/A"}
          </div>
          <Button variant="primary" className="w-100 mt-3" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Profile;