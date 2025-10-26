import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/profile";  
import Chatbot from "./pages/Chatbot";       
function App() {
  return (
    <BrowserRouter>
    <Routes>
  <Route path="/" element={<Home />} />
  <Route path="/auth" element={<Auth />} />
  <Route path="/dashboard" element={<Dashboard />} />
<Route path="/profile" element={<Profile />} /> 
<Route path="/Chatbot" element={<Chatbot />} /> 
</Routes>

    </BrowserRouter>
  );
}

export default App;