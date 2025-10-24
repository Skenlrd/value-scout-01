import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import StyleBuilderSearchPage from "./pages/StyleBuilderSearchPage";
// ... other imports like Navbar, etc.

function App() {
  return (
    <Router>
      {/* Your Navbar likely lives here */}
      {/* <Navbar /> */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/style-builder" element={<StyleBuilderSearchPage />} />
        {/* ... other routes */}
      </Routes>
    </Router>
  );
}

export default App;
