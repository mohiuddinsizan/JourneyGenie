import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/world-tour.png";
import "./Navbar.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

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

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo + Name */}
        <div className="navbar-logo" onClick={() => navigate("/idle")}>
          <img src={logo} alt="logo" className="navbar-logo-img" />
          <h2>JourneyGenie</h2>
        </div>

        {/* Links */}
        <div className="navbar-links">
          <NavLink to="/" className="nav-btn">Home</NavLink>
          <NavLink to="/plan" className="nav-btn">Plan</NavLink>
          <NavLink to="/profile" className="nav-btn">Profile</NavLink>
          <NavLink to="/about" className="nav-btn">About Us</NavLink>
          <NavLink to="/howitworks" className="nav-btn">How It Works</NavLink>

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
      </div>
    </nav>
  );
};

export default Navbar;
