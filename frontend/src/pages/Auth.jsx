// src/pages/Auth.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Spinner } from "react-bootstrap";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [activeTab, setActiveTab] = useState("signin");

  const handleSignUp = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success("Account created! You can now sign in.");
      setEmail("");
      setPassword("");
      setDisplayName("");
      setLoading(false);
      setActiveTab("signin");
    }, 1000);
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success("Welcome back!");
      setLoading(false);
      navigate("/dashboard");
    }, 1000);
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow-lg p-4" style={{ maxWidth: "400px", width: "100%" }}>
        {/* Header */}
        <div className="text-center mb-4">
          <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: "50px", height: "50px" }}>
            🎓
          </div>
          <h3>Study Room</h3>
          <p className="text-muted">Collaborative learning starts here</p>
        </div>

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "signin" ? "active" : ""}`}
              onClick={() => setActiveTab("signin")}
            >
              Sign In
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "signup" ? "active" : ""}`}
              onClick={() => setActiveTab("signup")}
            >
              Sign Up
            </button>
          </li>
        </ul>

        {/* Sign In Form */}
        {activeTab === "signin" && (
          <form onSubmit={handleSignIn}>
            <div className="mb-3">
              <label htmlFor="signin-email" className="form-label">Email</label>
              <input
                type="email"
                id="signin-email"
                className="form-control"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="signin-password" className="form-label">Password</label>
              <input
                type="password"
                id="signin-password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <button className="btn btn-primary w-100" type="submit" disabled={loading}>
              {loading && <Spinner animation="border" size="sm" className="me-2" />}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        )}

        {/* Sign Up Form */}
        {activeTab === "signup" && (
          <form onSubmit={handleSignUp}>
            <div className="mb-3">
              <label htmlFor="signup-name" className="form-label">Display Name</label>
              <input
                type="text"
                id="signup-name"
                className="form-control"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="signup-email" className="form-label">Email</label>
              <input
                type="email"
                id="signup-email"
                className="form-control"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="signup-password" className="form-label">Password</label>
              <input
                type="password"
                id="signup-password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                minLength={6}
                required
              />
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
