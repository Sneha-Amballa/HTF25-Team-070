import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
    <Routes>
  <Route path="/" element={<Home />} />
  <Route path="/auth" element={<Auth />} />
  <Route path="/dashboard" element={<Dashboard />} />
</Routes>

    </BrowserRouter>
  );
}

export default App;