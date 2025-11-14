import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Compare from "./pages/Compare";
import StyleBuilderSearchPage from "./pages/StyleBuilderSearchPage"; // ✅ Correct path
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

import Navbar from "./components/Navbar";
import BrandLogo from "./components/BrandLogo";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false);

  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    return isLoggedIn ? children : <Navigate to="/login" replace />;
  };

  return (
    <Router>
      {/* Brand logo + Navbar */}
      <header className="text-center py-6">
        <BrandLogo size="md" />
      </header>

      <Navbar onLogout={handleLogout} isLoggedIn={isLoggedIn} />

      {/* Main layout */}
      <main className="min-h-screen bg-gradient-to-br from-[#eaf6f2] to-[#b6c9c3] pt-[20px]">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/compare" element={<Compare />} />

          {/* ✅ AI Style Builder Route */}
          <Route path="/style-builder" element={<StyleBuilderSearchPage />} />

          {/* Auth */}
          <Route path="/login" element={<Auth onLogin={handleLogin} />} />
          <Route path="/signup" element={<Auth onLogin={handleLogin} initialMode="signup" />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
