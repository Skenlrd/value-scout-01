import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import Home from "./pages/Home";
import Compare from "./pages/Compare";
import StyleBuilderSearchPage from "./pages/StyleBuilderSearchPage"; // ✅ Correct path
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Wishlist from "./pages/Wishlist";
import VerifyEmail from "./pages/VerifyEmail";

import Navbar from "./components/Navbar";
import BrandLogo from "./components/BrandLogo";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const storedUser = localStorage.getItem("valuescout_user");
    return !!storedUser;
  });

  useEffect(() => {
    // Keep legacy flag for compatibility but source of truth is valuescout_user
    if (isLoggedIn) {
      localStorage.setItem("isLoggedIn", "true");
    } else {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("valuescout_user");
    }
  }, [isLoggedIn]);

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => {
    localStorage.removeItem("valuescout_user");
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
  };

  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    return isLoggedIn ? children : <Navigate to="/login" replace />;
  };

  return (
    <GoogleOAuthProvider clientId="813492076332-lf68pl7vn7kfe6m53t0i0u55mgrandhe.apps.googleusercontent.com">
      <Router>
        {/* Brand logo + Navbar */}
        <header className="text-center py-6 bg-gradient-to-br from-[#eaf6f2] to-[#b6c9c3]">
          <BrandLogo size="md" />
        </header>

        <Navbar onLogout={handleLogout} isLoggedIn={isLoggedIn} />

        {/* Main layout */}
        <main className="min-h-screen bg-gradient-to-br from-[#eaf6f2] to-[#b6c9c3] pt-[20px]">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* ✅ AI Style Builder Route */}
            <Route path="/style-builder" element={<StyleBuilderSearchPage />} />

            {/* Auth */}
            <Route path="/login" element={<Auth onLogin={handleLogin} />} />
            <Route path="/register" element={<Auth onLogin={handleLogin} initialMode="signup" />} />
            <Route path="/signup" element={<Auth onLogin={handleLogin} initialMode="signup" />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
