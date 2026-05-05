import React from "react";
import { Link } from "react-router-dom";
import { navbarStyles } from "../assets/dummyStyles";
import logo from "../assets/logo.png";

const Navbar = () => {
  // Debug logs: check if imports are working
  console.log("navbarStyles:", navbarStyles);
  console.log("logo path:", logo);

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
        </nav>
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
