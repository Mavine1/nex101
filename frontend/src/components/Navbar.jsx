import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser, useAuth, useClerk, SignedOut, SignedIn } from "@clerk/clerk-react";
import { navbarStyles } from "../assets/dummyStyles";
import logo from "../assets/logo.png";

const Navbar = () => {
  const [open, setOpen] = useState(false);           // mobile menu
  const [profileOpen, setProfileOpen] = useState(false);
  const { user } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const clerk = useClerk();
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const TOKEN_KEY = "token";

  // Open sign‑in modal
  const openSignIn = () => {
    if (clerk && typeof clerk.openSignIn === "function") {
      clerk.openSignIn({ redirectUrl: "/" });
    } else {
      navigate("/sign-in");
    }
  };

  // Open sign‑up modal
  const openSignUp = () => {
    try {
      if (clerk && typeof clerk.openSignUp === "function") {
        clerk.openSignUp();
      } else {
        navigate("/sign-up");
      }
    } catch (e) {
      console.error("openSignUp failed:", e);
      navigate("/sign-up");
    }
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [profileOpen]);

  return (
    <header className={navbarStyles.header}>
      <div className={navbarStyles.container}>
        <nav className={navbarStyles.nav}>
          {/* Logo Section */}
          <div className={navbarStyles.logoSection}>
            <Link to="/" className={navbarStyles.logoLink}>
              <img src={logo} alt="logo" className={navbarStyles.logoImage} />
              <span className={navbarStyles.logoText}>InvoiceAI</span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className={navbarStyles.desktopNav}>
            <a href="#features" className={navbarStyles.navLink}>
              Features
            </a>
            <a href="#pricing" className={navbarStyles.navLinkInactive}>
              Pricing
            </a>
          </div>

          {/* Auth Section (Desktop) */}
          <div className={navbarStyles.authSection}>
            <SignedOut>
              <button
                onClick={openSignIn}
                className={navbarStyles.signInButton}
                type="button"
              >
                Sign In
              </button>
              <button
                onClick={openSignUp}
                className={navbarStyles.signUpButton}
                type="button"
              >
                <div className={navbarStyles.signUpOverlay}></div>
                <span className={navbarStyles.signUpText}>Get Started</span>
              </button>
            </SignedOut>

            <SignedIn>
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className={navbarStyles.userAvatar}
                  type="button"
                >
                  {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || "U"}
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      {user?.firstName} {user?.lastName}
                      <div className="text-xs text-gray-500">
                        {user?.primaryEmailAddress?.emailAddress}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate("/dashboard")}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => clerk.signOut()}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </SignedIn>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={navbarStyles.mobileMenuButton}
            onClick={() => setOpen(!open)}
            type="button"
          >
            <div className={navbarStyles.mobileMenuIcon}>
              <span
                className={`${navbarStyles.mobileMenuLine1} ${
                  open
                    ? navbarStyles.mobileMenuLine1Open
                    : navbarStyles.mobileMenuLine1Closed
                }`}
              />
              <span
                className={`${navbarStyles.mobileMenuLine2} ${
                  open
                    ? navbarStyles.mobileMenuLine2Open
                    : navbarStyles.mobileMenuLine2Closed
                }`}
              />
              <span
                className={`${navbarStyles.mobileMenuLine3} ${
                  open
                    ? navbarStyles.mobileMenuLine3Open
                    : navbarStyles.mobileMenuLine3Closed
                }`}
              />
            </div>
          </button>
        </nav>

        {/* Mobile Menu Panel */}
        <div className={`${open ? "block" : "hidden"} ${navbarStyles.mobileMenu}`}>
          <div className={navbarStyles.mobileMenuContainer}>
            <a
              href="#features"
              className={navbarStyles.mobileNavLink}
              onClick={() => setOpen(false)}
            >
              Features
            </a>
            <a
              href="#pricing"
              className={navbarStyles.mobileNavLink}
              onClick={() => setOpen(false)}
            >
              Pricing
            </a>
            <div className={navbarStyles.mobileAuthSection}>
              <SignedOut>
                <button
                  onClick={() => {
                    openSignIn();
                    setOpen(false);
                  }}
                  className={navbarStyles.mobileSignIn}
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    openSignUp();
                    setOpen(false);
                  }}
                  className={navbarStyles.mobileSignUp}
                >
                  Get Started
                </button>
              </SignedOut>
              <SignedIn>
                <button
                  onClick={() => {
                    clerk.signOut();
                    setOpen(false);
                  }}
                  className={navbarStyles.mobileSignIn}
                >
                  Sign Out
                </button>
              </SignedIn>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
// useEffect(() => {
//   function onDocClick(e) {
//     if (!profileRef.current) return;
//     if (!profileRef.current.contains(e.target)) {
//       setProfileOpen(false);
//     }
//   }
//   if (profileOpen) {
//     document.addEventListener("mousedown", onDocClick);
//     document.addEventListener("touchstart", onDocClick);
//   }
//   return () => {
//     document.removeEventListener("mousedown", onDocClick);
//     document.removeEventListener("touchstart", onDocClick);
//   };
// }, [profileOpen]);

// <svg
//   className={navbarStyles.signUpIcon}
//   viewBox="0 0 24 24"
//   fill="none"
//   stroke="currentColor"
//   strokeWidth="2"
// >
//   <path d="M5 12h14m-7-7l7 7-7 7" />
// </svg>;
