import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser, useAuth, useClerk, SignedOut, SignedIn } from '@clerk/clerk-react';
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

    // Fetch and store token
    const fetchAndStoreToken = useCallback(async () => {
        try {
            const token = await getToken().catch(() => null);
            if (token) {
                try {
                    localStorage.setItem(TOKEN_KEY, token);
                    console.log("Token stored successfully");
                } catch (error) {
                    console.error("Failed to store token:", error);
                }
            }
            return token;
        } catch (error) {
            console.error("fetchAndStoreToken failed:", error);
            return null;
        }
    }, [getToken]);

    // Keep localStorage token in sync with Clerk auth state
    useEffect(() => {
        const syncToken = async () => {
            if (isSignedIn) {
                await fetchAndStoreToken();
            } else {
                try {
                    localStorage.removeItem(TOKEN_KEY);
                } catch (error) {
                    console.error("Failed to remove token:", error);
                }
            }
        };

        syncToken();
    }, [isSignedIn, fetchAndStoreToken]);

    // After successful login, redirect to dashboard
    useEffect(() => {
        if (isSignedIn) {
            const pathname = window.location.pathname || "";
            if (
                pathname === "/login" ||
                pathname === "/signup" ||
                pathname.startsWith("/auth") ||
                pathname === "/"
            ) {
                navigate("/app/dashboard", { replace: true });
            }
        }
    }, [isSignedIn, navigate]);

    // Close mobile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (open && !e.target.closest(`.${navbarStyles.mobileMenu}`) && !e.target.closest(`.${navbarStyles.mobileMenuButton}`)) {
                setOpen(false);
            }
        };
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

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

    // Open login modal
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

    // Open signup modal
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

    // Close mobile menu and scroll to section
    const handleNavLinkClick = (href) => {
        setOpen(false);
        const element = document.querySelector(href);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

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

                    {/* Desktop Navigation */}
                    <div className={navbarStyles.desktopNav}>
                        <a 
                            href="#features" 
                            className={navbarStyles.navLink}
                            onClick={(e) => {
                                e.preventDefault();
                                handleNavLinkClick("#features");
                            }}
                        >
                            Features
                        </a>
                        <a 
                            href="#pricing" 
                            className={navbarStyles.navLink}
                            onClick={(e) => {
                                e.preventDefault();
                                handleNavLinkClick("#pricing");
                            }}
                        >
                            Pricing
                        </a>
                    </div>

                    {/* Desktop Auth Section */}
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
                            
                            <SignedIn>
                                <div className={navbarStyles.userSection} ref={profileRef}>
                                    <button
                                        onClick={() => setProfileOpen(!profileOpen)}
                                        className={navbarStyles.userButton}
                                    >
                                        <img 
                                            src={user?.imageUrl || "/default-avatar.png"} 
                                            alt="Profile" 
                                            className={navbarStyles.userAvatar}
                                        />
                                        <span className={navbarStyles.userName}>
                                            {user?.fullName || user?.firstName || "User"}
                                        </span>
                                    </button>
                                    
                                    {profileOpen && (
                                        <div className={navbarStyles.profileDropdown}>
                                            <Link to="/app/dashboard" className={navbarStyles.dropdownItem}>
                                                Dashboard
                                            </Link>
                                            <Link to="/app/invoices" className={navbarStyles.dropdownItem}>
                                                Invoices
                                            </Link>
                                            <Link to="/app/settings" className={navbarStyles.dropdownItem}>
                                                Settings
                                            </Link>
                                            <button 
                                                onClick={() => clerk.signOut()}
                                                className={navbarStyles.dropdownItem}
                                            >
                                                Sign Out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </SignedIn>
                        </div>
                    </div>

                    {/* Mobile Menu Button (Hamburger) */}
                    <button
                        onClick={() => setOpen(!open)}
                        className={navbarStyles.mobileMenuButton}
                        aria-label="Toggle menu"
                    >
                        <div className={navbarStyles.mobileMenuIcon}>
                            <span className={`${navbarStyles.mobileMenuLine} ${open ? navbarStyles.mobileMenuLineOpen : ""}`}></span>
                            <span className={`${navbarStyles.mobileMenuLine} ${open ? navbarStyles.mobileMenuLineOpen : ""}`}></span>
                            <span className={`${navbarStyles.mobileMenuLine} ${open ? navbarStyles.mobileMenuLineOpen : ""}`}></span>
                        </div>
                    </button>
                </nav>

                {/* Mobile Menu Overlay */}
                <div className={`${navbarStyles.mobileMenuOverlay} ${open ? navbarStyles.mobileMenuOverlayOpen : ""}`}>
                    <div className={navbarStyles.mobileMenu}>
                        <div className={navbarStyles.mobileMenuContainer}>
                            {/* Mobile Navigation Links */}
                            <a 
                                href="#features" 
                                className={navbarStyles.mobileNavLink}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleNavLinkClick("#features");
                                }}
                            >
                                Features
                            </a>
                            <a 
                                href="#pricing" 
                                className={navbarStyles.mobileNavLink}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleNavLinkClick("#pricing");
                                }}
                            >
                                Pricing
                            </a>
                            
                            {/* Mobile Auth Section */}
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
                                    <div className={navbarStyles.mobileUserInfo}>
                                        <img 
                                            src={user?.imageUrl || "/default-avatar.png"} 
                                            alt="Profile" 
                                            className={navbarStyles.mobileUserAvatar}
                                        />
                                        <div className={navbarStyles.mobileUserDetails}>
                                            <span className={navbarStyles.mobileUserName}>
                                                {user?.fullName || user?.firstName || "User"}
                                            </span>
                                            <span className={navbarStyles.mobileUserEmail}>
                                                {user?.emailAddresses?.[0]?.emailAddress}
                                            </span>
                                        </div>
                                    </div>
                                    <Link 
                                        to="/app/dashboard" 
                                        className={navbarStyles.mobileNavLink}
                                        onClick={() => setOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <Link 
                                        to="/app/invoices" 
                                        className={navbarStyles.mobileNavLink}
                                        onClick={() => setOpen(false)}
                                    >
                                        Invoices
                                    </Link>
                                    <Link 
                                        to="/app/settings" 
                                        className={navbarStyles.mobileNavLink}
                                        onClick={() => setOpen(false)}
                                    >
                                        Settings
                                    </Link>
                                    <button 
                                        onClick={() => {
                                            clerk.signOut();
                                            setOpen(false);
                                        }}
                                        className={navbarStyles.mobileSignOut}
                                    >
                                        Sign Out
                                    </button>
                                </SignedIn>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;