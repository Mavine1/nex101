import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser, useAuth, useClerk, SignedOut } from '@clerk/clerk-react';
import { navbarStyles } from '../assets/dummyStyles';
import logo from './../assets/logo.png';

const Navbar = () => {
    const [open, setOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const { user } = useUser();
    const { getToken, isSignedIn } = useAuth();
    const clerk = useClerk();

    const navigate = useNavigate();
    const profileRef = useRef(null);
    const TOKEN_KEY = "token";

    // to open login modal
    function openSignIn() {
        try {
            if (clerk && typeof clerk.openSignIn === "function") {
                clerk.openSignIn();
            } else {
                navigate("/login");
            }
        } catch (e) {
            console.error("openSignIn failed:", e);
            navigate("/login");
        }
    }

    // to open signup modal
    function openSignUp() {
        try {
            if (clerk && typeof clerk.openSignUp === "function") {
                clerk.openSignUp();
            } else {
                navigate("/signup");
            }
        } catch (e) {
            console.error("openSignUp failed:", e);
            navigate("/signup");
        }
    }

    // Close profile popover on outside click
    useEffect(() => {
        function onDocClick(e) {
            if (!profileRef.current) return;
            if (!profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        }
        if (profileOpen) {
            document.addEventListener("mousedown", onDocClick);
            document.addEventListener("touchstart", onDocClick);
        }
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("touchstart", onDocClick);
        };
    }, [profileOpen]);

    return (
        <header className={navbarStyles.header}>
            <div className={navbarStyles.container}>
                <nav className={navbarStyles.nav}>
                    <div className={navbarStyles.logoSection}>
                        <Link to="/" className={navbarStyles.logoLink}>
                            <img src={logo} alt="logo" className={navbarStyles.logoImage} />
                            <span className={navbarStyles.logoText}>InvoiceAI</span>
                        </Link>
                    </div>

                    <div className={navbarStyles.desktopNav}>
                        <a href="#features" className={navbarStyles.navLink}>Features</a>
                        <a href="#pricing" className={navbarStyles.navLink}>Pricing</a>
                    </div>

                    <div className="flex items-center gap-4">
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
                                    <svg
                                        className={navbarStyles.signUpIcon}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M5 12h14m-7-7l7 7-7 7" />
                                    </svg>
                                </button>
                            </SignedOut>
                        </div>
                    </div>
                </nav>
            </div>
        </header>
    );
};

export default Navbar;