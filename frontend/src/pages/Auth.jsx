import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "sonner";
import { Spinner } from "react-bootstrap";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [activeTab, setActiveTab] = useState("signin");

  const API_URL = "http://localhost:5000/api/auth";

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Account created! You can now sign in.");
        setActiveTab("signin");
        setEmail("");
        setPassword("");
        setDisplayName("");
      } else {
        toast.error(data.message || "Signup failed");
      }
    } catch (err) {
      toast.error(err.message || "Server error");
    }
    setLoading(false);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Server returned non-JSON response");
      }

      if (res.ok) {
        toast.success(`Welcome back, ${data.user.displayName}!`);
        localStorage.setItem("token", data.token);
        navigate("/dashboard");
      } else {
        toast.error(data.message || "Invalid credentials");
      }
    } catch (err) {
      toast.error(err.message || "Server error");
    }
    setLoading(false);
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <Toaster richColors />
      <div className="card shadow-lg p-4" style={{ maxWidth: "400px", width: "100%" }}>
        {/* Header */}
        <div className="text-center mb-4">
          <div
            className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
            style={{ width: "50px", height: "50px" }}
          >
            🎓
          </div>
          <h3>Study Room</h3>
          <p className="text-muted">Collaborative learning starts here</p>
        </div>

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button className={`nav-link ${activeTab === "signin" ? "active" : ""}`} onClick={() => setActiveTab("signin")}>Sign In</button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === "signup" ? "active" : ""}`} onClick={() => setActiveTab("signup")}>Sign Up</button>
          </li>
        </ul>

        {/* Sign In */}
        {activeTab === "signin" && (
          <form onSubmit={handleSignIn}>
            <div className="mb-3">
              <label>Email</label>
              <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} required />
            </div>
            <div className="mb-3">
              <label>Password</label>
              <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} required />
            </div>
            <button className="btn btn-primary w-100" type="submit" disabled={loading}>
              {loading && <Spinner animation="border" size="sm" className="me-2" />}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        )}

        {/* Sign Up */}
        {activeTab === "signup" && (
          <form onSubmit={handleSignUp}>
            <div className="mb-3">
              <label>Display Name</label>
              <input type="text" className="form-control" value={displayName} onChange={e => setDisplayName(e.target.value)} disabled={loading} required />
            </div>
            <div className="mb-3">
              <label>Email</label>
              <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} required />
            </div>
            <div className="mb-3">
              <label>Password</label>
              <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} minLength={6} required />
            </div>
            <button className="btn btn-primary w-100" type="submit" disabled={loading}>
              {loading && <Spinner animation="border" size="sm" className="me-2" />}
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
