import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";

// Optional: import a NotFound component if you have one
// import NotFound from "./pages/NotFound";

const App = () => {
  return (
    <Routes>
      {/* Main route */}
      <Route path="/" element={<Home />} />

      {/* Catch-all route for 404 - Uncomment if you have a NotFound page */}
      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
};

export default App;