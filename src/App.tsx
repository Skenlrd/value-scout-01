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
  // NOTE: In a real app, this should come from a global Auth Context or state management.
  // We keep a simple boolean here for demonstration and to show protected-route usage.
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false);

  // Reusable protected route wrapper
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

      <main className="pt-[20px]">
        <Routes>
          {/* Public routes: accessible without login */}
          <Route path="/" element={<Home />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/style-builder" element={<StyleBuilderSearchPage />} />

          {/* Auth pages */}
          <Route path="/login" element={<Auth onLogin={handleLogin} />} />
          <Route path="/signup" element={<Auth onLogin={handleLogin} initialMode="signup" />} />

          {/* Example protected route usage (uncomment/add real protected pages) */}
          {/* <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} /> */}

          {/* Fallback / Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;