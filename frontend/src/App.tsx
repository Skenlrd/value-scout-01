import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Compare from "./pages/Compare";
import StyleBuilderSearchPage from "./pages/StyleBuilderSearchPage";
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
      {/* Global header + Navbar */}
      <header className="text-center py-6">
        <BrandLogo size="md" />
      </header>

      <Navbar onLogout={handleLogout} isLoggedIn={isLoggedIn} />

      {/* Unified gradient background for all pages */}
      <main className="min-h-screen bg-gradient-to-br from-[#eaf6f2] to-[#b6c9c3] pt-[20px]">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/style-builder" element={<StyleBuilderSearchPage />} />

          {/* Auth routes */}
          <Route path="/login" element={<Auth onLogin={handleLogin} />} />
          <Route
            path="/signup"
            element={<Auth onLogin={handleLogin} initialMode="signup" />}
          />

          {/* Example protected route */}
          {/* <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} /> */}

          {/* 404 fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
