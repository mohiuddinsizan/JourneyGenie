// import React, { useEffect, useRef, useState } from "react";
// import { NavLink, useNavigate } from "react-router-dom";
// import logo from "../assets/genielogo.png";
// import "./Navbar.css";

// const API_BASE = import.meta.env.REACT_APP_API_URL || "http://localhost:8080";

// /* Helpers (inline) */
// const loadUser = () => {
//   try {
//     const raw = localStorage.getItem("user");
//     return raw ? JSON.parse(raw) : null;
//   } catch {
//     return null;
//   }
// };
// const saveUser = (payload) => {
//   try {
//     const user = payload?.user ?? payload; // accept {user:{}} or {}
//     if (!user) return;
//     const { password, ...safe } = user;
//     localStorage.setItem("user", JSON.stringify(safe));
//   } catch {}
// };


// const clearUser = () => {
//   localStorage.removeItem("user");
// };


// const broadcastAuthChange = () => {
//   window.dispatchEvent(new Event("auth-changed"));
// };

// const Navbar = () => {
//   const navigate = useNavigate();
//   const [isLoggedIn, setIsLoggedIn] = useState(!!loadUser());
//   const didBootstrap = useRef(false); // guard StrictMode double-run

//   // Keep in sync with localStorage + same-tab custom event + visibility
//   useEffect(() => {
//     const sync = () => setIsLoggedIn(!!loadUser());
//     sync(); // initial
//     window.addEventListener("storage", sync);          // other tabs
//     window.addEventListener("auth-changed", sync);     // same tab
//     const onVisible = () => document.visibilityState === "visible" && sync();
//     document.addEventListener("visibilitychange", onVisible);
//     return () => {
//       window.removeEventListener("storage", sync);
//       window.removeEventListener("auth-changed", sync);
//       document.removeEventListener("visibilitychange", onVisible);
//     };
//   }, []);

//   // One-time bootstrap from backend: /user/me
//   useEffect(() => {
//     if (didBootstrap.current) return;
//     didBootstrap.current = true;

//     (async () => {
//       try {
//         const res = await fetch(`${API_BASE}/user/me`, {
//           method: "GET",
//           headers: { "Content-Type": "application/json" },
//           credentials: "include",
//         });
//         if (res.ok) {
//           const data = await res.json();
//           if (data) {
//             saveUser(data);
//             setIsLoggedIn(true);
//             broadcastAuthChange();
//             return;
//           }
//         } else if (res.status === 401) {
//           clearUser();
//           setIsLoggedIn(false);
//           broadcastAuthChange();
//         } else {
//           // leave whatever localStorage has
//           setIsLoggedIn(!!loadUser());
//         }
//       } catch {
//         setIsLoggedIn(!!loadUser());
//       }
//     })();
//   }, []);

//   // Call this after your login flow saves user to localStorage
//   // Example usage elsewhere (optional):
//   // localStorage.setItem('user', JSON.stringify(safeUser)); window.dispatchEvent(new Event('auth-changed'));

//   const handleLogout = async () => {
//     try {
//       const res = await fetch(`${API_BASE}/user/logout`, {
//         method: "POST",
//         credentials: "include",
//       });
//       clearUser();
//       setIsLoggedIn(false);
//       broadcastAuthChange();
//       if (!res.ok) console.warn("Server logout failed:", res.status);
//     } catch (e) {
//       console.error("Logout request failed:", e);
//       clearUser();
//       setIsLoggedIn(false);
//       broadcastAuthChange();
//     } finally {
//       navigate("/");
//     }
//   };

//   return (
//     <nav className="navbar">
//       <div className="navbar-container">
//         {/* Logo + Name */}
//         <div className="navbar-logo" onClick={() => navigate("/idle")}>
//           <img src={logo} alt="logo" className="navbar-logo-img" />
//           <h2 className="navbar-logo-text">JourneyGenie</h2>
//         </div>

//         {/* Links */}
//         <div className="navbar-links">
//           <NavLink to="/" className="nav-btn">Home</NavLink>
//           <NavLink to="/plan" className="nav-btn">Plan</NavLink>
//           <NavLink to="/profile" className="nav-btn">Profile</NavLink>
//           <NavLink to="/gallery" className="nav-btn">Gallery</NavLink>
//           <NavLink to="/searchplace" className="nav-btn">Detect Places</NavLink>  
//           <NavLink to="/tokenbuy" className="nav-btn">Buy Tokens</NavLink>
//           <NavLink to="/howitworks" className="nav-btn">How It Works</NavLink>
//           <NavLink to="/support" className="nav-btn">Support</NavLink>
//           <NavLink to="/about" className="nav-btn">About Us</NavLink>
//           {isLoggedIn ? (
//             <button className="nav-btn logout-btn" onClick={handleLogout}>
//               Logout
//             </button>
//           ) : (
//             <button className="nav-btn login-btn" onClick={() => navigate("/login")}>
//               Login
//             </button>
//           )}
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;


import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/genielogo.png";
import "./Navbar.css";

const API_BASE = import.meta.env.REACT_APP_API_URL || "http://localhost:8080";

/* Helpers (inline) */
const loadUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const saveUser = (payload) => {
  try {
    const user = payload?.user ?? payload; // accept {user:{}} or {}
    if (!user) return;
    const { password, ...safe } = user;
    localStorage.setItem("user", JSON.stringify(safe));
  } catch {}
};

const clearUser = () => {
  localStorage.removeItem("user");
};

const broadcastAuthChange = () => {
  window.dispatchEvent(new Event("auth-changed"));
};

const Navbar = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!loadUser());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const didBootstrap = useRef(false); // guard StrictMode double-run

  // Keep in sync with localStorage + same-tab custom event + visibility
  useEffect(() => {
    const sync = () => setIsLoggedIn(!!loadUser());
    sync(); // initial
    window.addEventListener("storage", sync);          // other tabs
    window.addEventListener("auth-changed", sync);     // same tab
    const onVisible = () => document.visibilityState === "visible" && sync();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("auth-changed", sync);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // One-time bootstrap from backend: /user/me
  useEffect(() => {
    if (didBootstrap.current) return;
    didBootstrap.current = true;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/user/me`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data) {
            saveUser(data);
            setIsLoggedIn(true);
            broadcastAuthChange();
            return;
          }
        } else if (res.status === 401) {
          clearUser();
          setIsLoggedIn(false);
          broadcastAuthChange();
        } else {
          // leave whatever localStorage has
          setIsLoggedIn(!!loadUser());
        }
      } catch {
        setIsLoggedIn(!!loadUser());
      }
    })();
  }, []);

  // Call this after your login flow saves user to localStorage
  // Example usage elsewhere (optional):
  // localStorage.setItem('user', JSON.stringify(safeUser)); window.dispatchEvent(new Event('auth-changed'));

  const handleLogout = async () => {
    try {
      const res = await fetch(`${API_BASE}/user/logout`, {
        method: "POST",
        credentials: "include",
      });
      clearUser();
      setIsLoggedIn(false);
      broadcastAuthChange();
      if (!res.ok) console.warn("Server logout failed:", res.status);
    } catch (e) {
      console.error("Logout request failed:", e);
      clearUser();
      setIsLoggedIn(false);
      broadcastAuthChange();
    } finally {
      navigate("/");
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo + Name */}
        <div className="navbar-logo" onClick={() => navigate("/idle")}>
          <img src={logo} alt="logo" className="navbar-logo-img" />
          <h2 className="navbar-logo-text">JourneyGenie</h2>
        </div>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        {/* Links - Desktop */}
        <div className="navbar-links desktop-links">
          <NavLink to="/" className="nav-btn">Home</NavLink>
          <NavLink to="/plan" className="nav-btn">Plan</NavLink>
          <NavLink to="/profile" className="nav-btn">Profile</NavLink>
          <NavLink to="/gallery" className="nav-btn">Gallery</NavLink>
          <NavLink to="/searchplace" className="nav-btn">Detect Places</NavLink>  
          <NavLink to="/tokenbuy" className="nav-btn">Buy Tokens</NavLink>
          <NavLink to="/howitworks" className="nav-btn">How It Works</NavLink>
          {/* <NavLink to="/support" className="nav-btn">Support</NavLink> */}
          <NavLink to="/about" className="nav-btn">About Us</NavLink>
          {isLoggedIn ? (
            <button className="nav-btn logout-btn" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <button className="nav-btn login-btn" onClick={() => navigate("/login")}>
              Login
            </button>
          )}
        </div>

        {/* Mobile Dropdown Menu */}
        <div className={`mobile-dropdown ${isMobileMenuOpen ? 'active' : ''}`}>
          <NavLink to="/" className="mobile-nav-btn" onClick={closeMobileMenu}>Home</NavLink>
          <NavLink to="/plan" className="mobile-nav-btn" onClick={closeMobileMenu}>Plan</NavLink>
          <NavLink to="/profile" className="mobile-nav-btn" onClick={closeMobileMenu}>Profile</NavLink>
          <NavLink to="/gallery" className="mobile-nav-btn" onClick={closeMobileMenu}>Gallery</NavLink>
          <NavLink to="/searchplace" className="mobile-nav-btn" onClick={closeMobileMenu}>Detect Places</NavLink>  
          <NavLink to="/tokenbuy" className="mobile-nav-btn" onClick={closeMobileMenu}>Buy Tokens</NavLink>
          <NavLink to="/howitworks" className="mobile-nav-btn" onClick={closeMobileMenu}>How It Works</NavLink>
          {/* <NavLink to="/support" className="mobile-nav-btn" onClick={closeMobileMenu}>Support</NavLink> */}
          <NavLink to="/about" className="mobile-nav-btn" onClick={closeMobileMenu}>About Us</NavLink>
          {isLoggedIn ? (
            <button className="mobile-nav-btn logout-btn" onClick={() => {handleLogout(); closeMobileMenu();}}>
              Logout
            </button>
          ) : (
            <button className="mobile-nav-btn login-btn" onClick={() => {navigate("/login"); closeMobileMenu();}}>
              Login
            </button>
          )}
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && <div className="mobile-overlay" onClick={closeMobileMenu}></div>}
      </div>
    </nav>
  );
};

export default Navbar;