import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useUser,
  useAuth,
  useClerk,
  SignedOut,
  SignedIn,
} from "@clerk/clerk-react";
import { navbarStyles } from "../assets/dummyStyles";
import logo from "../assets/logo.png";

const Navbar = () => {
  // State
  const [open, setOpen] = useState(false);           // mobile menu
  const [profileOpen, setProfileOpen] = useState(false);

  // Clerk hooks
  const { user } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const clerk = useClerk();
  const navigate = useNavigate();

  // Refs
  const profileRef = useRef(null);
  const TOKEN_KEY = "token";

  // ---------- Token handling ----------
  const fetchAndStoreToken = useCallback(
    async (options = {}) => {
      try {
        if (!getToken) return null;
        const token = await getToken(options).catch(() => null);
        if (token) {
          try {
            localStorage.setItem(TOKEN_KEY, token);
            console.log("Token stored:", token.substring(0, 20) + "...");
          } catch (e) {
            console.warn("Failed to store token", e);
          }
        }
        return token;
      } catch (error) {
        console.error("fetchAndStoreToken error:", error);
        return null;
      }
    },
    [getToken]
  );

  // Keep localStorage token in sync with Clerk auth state
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (isSignedIn) {
        let token = await fetchAndStoreToken({ template: "default" }).catch(
          () => null
        );
        if (!token && mounted) {
          token = await fetchAndStoreToken({ forceRefresh: true }).catch(
            () => null
          );
        }
      } else {
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch (e) {
          console.warn("Failed to remove token", e);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isSignedIn, fetchAndStoreToken]);

  // ---------- Redirect after login ----------
  useEffect(() => {
    if (isSignedIn) {
      const pathname = window.location.pathname;
      const isAuthPage =
        pathname === "/login" ||
        pathname === "/signup" ||
        pathname.startsWith("/auth") ||
        pathname === "/";
      if (isAuthPage) {
        navigate("/app/dashboard", { replace: true });
      }
    }
  }, [isSignedIn, navigate]);

  // ---------- Auth modal functions ----------
  const openSignIn = () => {
    try {
      if (clerk && typeof clerk.openSignIn === "function") {
        clerk.openSignIn({ redirectUrl: "/" });
      } else {
        navigate("/sign-in");
      }
    } catch (e) {
      console.error("openSignIn failed:", e);
      navigate("/sign-in");
    }
  };

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

  // ---------- Close profile dropdown on outside click ----------
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

  // ---------- Render ----------
  return (
    <header className={navbarStyles.header}>
      <div className={navbarStyles.container}>
        <nav className={navbarStyles.nav}>
          {/* Logo */}
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

          {/* Desktop Auth Section */}
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
                  {user?.firstName?.[0] ||
                    user?.emailAddresses?.[0]?.emailAddress?.[0] ||
                    "U"}
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

          {/* Mobile Menu Button (Hamburger) */}
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
        <div
          className={`${open ? "block" : "hidden"} ${navbarStyles.mobileMenu}`}
        >
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