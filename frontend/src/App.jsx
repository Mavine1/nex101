import React from "react";
import { Route, Routes } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from "@clerk/clerk-react";
import Home from "./pages/Home";
import AppShell from "./components/AppShell";
import Dashboard from "./pages/Dashboard";

// Protected route wrapper – renders children only when signed in,
// otherwise redirects to Clerk's sign‑in page.
const ClerkProtected = ({ children }) => {
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
    <div className="min-h-screen max-w-full overflow-x-hidden">
      <Routes>
        {/* Public route */}
        <Route path="/" element={<Home />} />

        {/* Protected section */}
        <Route
          path="/app"
          element={
            <ClerkProtected>
              <AppShell />
            </ClerkProtected>
          }
        >
          {/* Index route – renders when path is exactly /app */}
          <Route index element={<Dashboard />} />
          {/* Explicit /app/dashboard route */}
          <Route path="dashboard" element={<Dashboard />} />
        </Route>

        {/* Optional: catch‑all 404 route */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </div>
  );
};

export default App;