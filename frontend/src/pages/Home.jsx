import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Header */}
      <header className="d-flex justify-content-between align-items-center px-4 py-3 bg-white shadow-sm">
        <div className="d-flex align-items-center gap-2">
          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
            🎓
          </div>
          <h4 className="m-0 fw-bold text-secondary">Study Room</h4>
        </div>
        <button
          onClick={() => navigate("/Auth")}
          className="btn btn-primary"
        >
          Get Started
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-center px-3">
        <h1 className="fw-bold display-5 mb-3 text-dark">Collaborate, Learn, and Succeed</h1>
        <p className="lead text-muted mb-4" style={{ maxWidth: "600px" }}>
          Join your peers in a real-time collaborative study environment. 
          Share notes, chat live, and prepare smarter — together.
        </p>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => navigate("/Auth")}
        >
          Start Studying
        </button>
      </main>

      {/* Features */}
      <section className="bg-white py-5">
        <div className="container text-center">
          <h2 className="fw-bold mb-5">Features</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="p-4 bg-light rounded shadow-sm h-100">
                <h5 className="fw-semibold mb-2">💬 Real-Time Collaboration</h5>
                <p className="text-muted">
                  Work together instantly on shared study boards with live updates across devices.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-4 bg-light rounded shadow-sm h-100">
                <h5 className="fw-semibold mb-2">📝 Rich Notes</h5>
                <p className="text-muted">
                  Create and format your notes in Markdown or rich text for seamless organization.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-4 bg-light rounded shadow-sm h-100">
                <h5 className="fw-semibold mb-2">📈 Track Progress</h5>
                <p className="text-muted">
                  Stay on top of your goals and see how your group contributions evolve over time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white text-center py-3 mt-auto">
        <p className="mb-0">© {new Date().getFullYear()} Study Room. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;