import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/dashboard" element={<h2 className="text-center mt-5">Dashboard (placeholder)</h2>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
