import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import StyleBuilderSearchPage from "./pages/StyleBuilderSearchPage";
import Auth from "./pages/Auth"; // 1. Import Auth component
import Navbar from "./components/Navbar"; // Assuming you need Navbar

function App() {
  // NOTE: In a real app, this should come from a global Auth Context or state management.
  // We hardcode it to false for now so you can test the Auth page immediately.
  const [isLoggedIn, setIsLoggedIn] = useState(true); 
  
  // Placeholder for user state, if needed later (e.g., to pass to Navbar)
  // const [user, setUser] = useState(null); 

  // Simple placeholder logic for toggling login state (to test routing)
  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(true);

  // If the user is not logged in, they can only access the Auth page.
  if (!isLoggedIn) {
    return (
      <Router>
        <Routes>
          {/* Public Route: Auth Page */}
          <Route path="/login" element={<Auth onLogin={handleLogin} />} />
          <Route path="/signup" element={<Auth onLogin={handleLogin} initialMode="signup" />} />
          {/* Redirects any other path (including '/') to the login page */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  // If the user is logged in, they see the main application structure
  return (
    <Router>
      <Navbar onLogout={handleLogout} /> {/* Assuming Navbar needs logout button */}
      <main className="pt-[60px]"> {/* Add top padding to account for fixed Navbar height */}
        <Routes>
          {/* Private Routes: Only accessible when logged in */}
          <Route path="/" element={<Home />} />
          <Route path="/style-builder" element={<StyleBuilderSearchPage />} />
          {/* If they somehow navigate to /login when logged in, redirect them home */}
          <Route path="/login" element={<Navigate to="/" replace />} />
          {/* Fallback route */}
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;