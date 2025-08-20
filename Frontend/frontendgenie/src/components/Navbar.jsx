import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/world-tour.png"; // your logo image
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:8080"}/user/logout`, {
        method: "POST",
        credentials: "include", // ✅ ensures cookies/sessions are cleared
      });
  
      if (!res.ok) {
        console.warn("Server logout failed:", res.status);
      }
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      // ✅ Always clear frontend state
      localStorage.removeItem("user");
      navigate("/");
    }
  };
  

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo + Name */}
        <div className="navbar-logo" onClick={() => navigate("/idle")}>
          <img src={logo} alt="logo" className="navbar-logo-img" />
          <span className="navbar-logo-text">JourneyGenie</span>
        </div>

        {/* Links */}
        <div className="navbar-links">
          <NavLink to="/" className="nav-btn">Home</NavLink>
          <NavLink to="/plan" className="nav-btn">Plan</NavLink>
          <NavLink to="/profile" className="nav-btn">Profile</NavLink>
          <NavLink to="/about" className="nav-btn">About Us</NavLink>
          <NavLink to="/howitworks" className="nav-btn">How It Works</NavLink>
          <button className="nav-btn logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
