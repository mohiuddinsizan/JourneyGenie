import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";
import image from '../assets/genie.png';
import ChatBot from "../components/Chatbot";

const loadUserFromLocalStorage = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse user from localStorage", e);
    return null;
  }
};

const saveUserToLocalStorage = (userLike) => {
  try {
    if (!userLike) return;
    // be defensive: /user/me might return {user: {...}} or just {...}
    const user = userLike.user ?? userLike;
    const { password, ...safeUser } = user || {};
    if (Object.keys(safeUser || {}).length > 0) {
      localStorage.setItem("user", JSON.stringify(safeUser));
    }
  } catch (e) {
    console.error("Failed to save user to localStorage", e);
  }
};

const LandingPage = () => {
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  // Prevent double-run in React Strict Mode (dev)
  const didBootstrapRef = useRef(false);

  // Keep isLoggedIn in sync with localStorage across tabs/refreshes
  useEffect(() => {
    const sync = () => setIsLoggedIn(!!loadUserFromLocalStorage());
    sync(); // initial
    window.addEventListener("storage", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.removeEventListener("storage", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  // 🔑 One-time bootstrap: try backend /user/me, else fall back to localStorage
  useEffect(() => {
    if (didBootstrapRef.current) return;
    didBootstrapRef.current = true;

    const bootstrap = async () => {
      try {
        const res = await fetch("http://localhost:8080/user/me", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (res.ok) {
          const payload = await res.json();
          // Accept { user: {...} } or {...}
          const foundUser = payload?.user ?? payload;
          if (foundUser) {
            saveUserToLocalStorage(foundUser);
            setIsLoggedIn(true);
            return;
          }
        } else if (res.status === 401) {
          // session expired: ensure we look logged out
          localStorage.removeItem("user");
        }
        // Fall back to whatever is in localStorage
        setIsLoggedIn(!!loadUserFromLocalStorage());
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setIsLoggedIn(!!loadUserFromLocalStorage());
      }
    };

    bootstrap();
  }, []);

  // Helper: robust auth check (uses state OR fresh localStorage)
  const isAuthed = () => isLoggedIn || !!loadUserFromLocalStorage();

  const requireLoginOr = (go) => {
    if (!isAuthed()) {
      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
        navigate("/login");
      }, 2000);
    } else {
      go();
    }
  };

  const handlePlanTrip = () => requireLoginOr(() => navigate("/plan"));
  const handleProfile = () => requireLoginOr(() => navigate("/profile"));

  return (
    <div className="container">
      <div className="box">
        {/* Hero heading */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            marginTop: "100px",
          }}
        >
          <h1>Your AI Travel Partner</h1>
          <img src={image} style={{ height: "80px" }} alt="icon" />
        </div>

        {/* Sub heading */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "30px",
          }}
        >
          <h2>Wanna know the best place for adventure now? Just ask!</h2>
        </div>

        {/* Chat input + floating popup */}
        <ChatBot />

        {/* Buttons */}
        <div className="hero-buttons">
          <button className="fancy-btn" onClick={handlePlanTrip}>
            Plan a Trip
          </button>
          <button className="fancy-btn" onClick={handleProfile}>
            Profile
          </button>
          <button className="fancy-btn" onClick={() => navigate("/about")}>
            About Us
          </button>
          <button className="fancy-btn" onClick={() => navigate("/howitworks")}>
            How it Works
          </button>
        </div>
      </div>

      {/* Fancy custom alert modal */}
      {showAlert && (
        <div className="alert-overlay">
          <div className="alert-box">
            <p>✨ You need to login first!</p>
          </div>
        </div>
      )}

      <div className="box"></div>
      <div className="box"></div>
      <div className="box"></div>
    </div>
  );
};

export default LandingPage;
