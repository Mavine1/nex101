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
import Invoices from "./pages/Invoices";
import CreateInvoice from "./pages/CreateInvoice";
import InvoicePreview from "../components/InvoicePreview";

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

        {/* Protected section under /app */}
        <Route
          path="/app"
          element={
            <ClerkProtected>
              <AppShell />
            </ClerkProtected>
          }
        >
          {/* Index route – /app */}
          <Route index element={<Dashboard />} />
          {/* /app/dashboard */}
          <Route path="dashboard" element={<Dashboard />} />

          {/* Invoice routes */}
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/new" element={<CreateInvoice />} />
          <Route path="invoices/:id" element={<InvoicePreview />} />
          <Route path="invoices/:id/preview" element={<InvoicePreview />} />
          <Route path="invoices/:id/edit" element={<CreateInvoice />} />

          {/* Legacy / create-invoice (kept for backward compatibility) */}
          <Route path="create-invoice" element={<CreateInvoice />} />

          {/* Business profile route (from earlier Dashboard buttons) */}
          <Route path="business" element={<BusinessProfile />} />
        </Route>

        {/* Optional: 404 Not Found */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </div>
  );
};

export default App;