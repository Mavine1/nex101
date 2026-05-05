import React from "react";
import { Route, Routes } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from "@clerk/clerk-react";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard"; // create this page

// Protected route wrapper component
const ProtectedRoute = ({ children }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

const App = () => {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/" element={<Home />} />

      {/* Protected route – only visible when signed in */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Optional: catch-all 404 route */}
      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
};

export default App;