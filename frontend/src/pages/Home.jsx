import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <header className="d-flex justify-content-between align-items-center px-4 py-3 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{ 
              width: "40px", 
              height: "40px", 
              backgroundColor: '#4361ee',
              color: '#ffffff'
            }}
          >
            🎓
          </div>
          <h4 className="m-0 fw-bold" style={{ color: '#3a0ca3' }}>Study Room</h4>
        </div>
        <button 
          onClick={() => navigate("/Auth")} 
          className="btn fw-semibold"
          style={{ 
            backgroundColor: '#4361ee',
            color: '#ffffff',
            border: 'none'
          }}
        >
          Get Started
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-center px-3 py-5">
        <h1 className="fw-bold display-5 mb-3" style={{ color: '#3a0ca3' }}>
          Connect, Collaborate, and Learn Together
        </h1>
        <p className="lead mb-4" style={{ maxWidth: "600px", color: '#4a4e69' }}>
          Join your peers in a real-time collaborative environment. Chat, share
          your screen, brainstorm on a whiteboard, and learn smarter together.
        </p>
        <button
          className="btn fw-semibold"
          onClick={() => navigate("/Auth")}
          style={{ 
            backgroundColor: '#4361ee',
            color: '#ffffff',
            border: 'none',
            padding: '12px 30px',
            fontSize: '1.1rem'
          }}
        >
          Start Studying
        </button>
      </main>

      {/* Features */}
      <section className="py-5" style={{ backgroundColor: '#ffffff' }}>
        <div className="container text-center">
          <h2 className="fw-bold mb-5" style={{ color: '#3a0ca3' }}>Features</h2>
          <div className="row g-4">

            {/* Chat + Community merged */}
            <div className="col-md-4">
              <div className="p-4 rounded shadow-sm h-100" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                <h5 className="fw-semibold mb-2" style={{ color: '#3a0ca3' }}>💬 Chat & Community</h5>
                <p style={{ color: '#4a4e69' }}>
                  Communicate instantly, participate in discussions, join study groups, and learn from a vibrant community.
                </p>
              </div>
            </div>

            {/* Video & Audio Calls */}
            <div className="col-md-4">
              <div className="p-4 rounded shadow-sm h-100" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                <h5 className="fw-semibold mb-2" style={{ color: '#3a0ca3' }}>🎥 Video & Audio Calls</h5>
                <p style={{ color: '#4a4e69' }}>
                  Host or join high-quality video and audio calls to study or collaborate face-to-face virtually.
                </p>
              </div>
            </div>

            {/* Interactive Whiteboard */}
            <div className="col-md-4">
              <div className="p-4 rounded shadow-sm h-100" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                <h5 className="fw-semibold mb-2" style={{ color: '#3a0ca3' }}>📝 Interactive Whiteboard</h5>
                <p style={{ color: '#4a4e69' }}>
                  Brainstorm, draw, and solve problems together in real-time using a shared whiteboard.
                </p>
              </div>
            </div>

            {/* Screen Sharing */}
            <div className="col-md-4">
              <div className="p-4 rounded shadow-sm h-100" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                <h5 className="fw-semibold mb-2" style={{ color: '#3a0ca3' }}>🖥️ Screen Sharing</h5>
                <p style={{ color: '#4a4e69' }}>
                  Share your screen with peers to present ideas, notes, or assignments seamlessly.
                </p>
              </div>
            </div>

            {/* Pinned Notes */}
            <div className="col-md-4">
              <div className="p-4 rounded shadow-sm h-100" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                <h5 className="fw-semibold mb-2" style={{ color: '#3a0ca3' }}>📌 Pinned Notes</h5>
                <p style={{ color: '#4a4e69' }}>
                  Keep your important notes and study materials pinned for quick access anytime.
                </p>
              </div>
            </div>

            {/* Chatbot */}
            <div className="col-md-4">
              <div className="p-4 rounded shadow-sm h-100" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                <h5 className="fw-semibold mb-2" style={{ color: '#3a0ca3' }}>🤖 AI Chatbot</h5>
                <p style={{ color: '#4a4e69' }}>
                  Get instant help, answers, and study guidance from our AI-powered chatbot anytime.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer 
        className="text-center py-3 mt-auto"
        style={{ 
          backgroundColor: '#3a0ca3',
          color: '#ffffff'
        }}
      >
        <p className="mb-0">© {new Date().getFullYear()} Study Room. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
