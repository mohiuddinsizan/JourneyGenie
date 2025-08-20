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

const saveUserToLocalStorage = (user) => {
  try {
    if (!user) return;
    const { password, ...safeUser } = user;
    localStorage.setItem("user", JSON.stringify(safeUser));
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
          const user = await res.json();
          if (user) {
            saveUserToLocalStorage(user);
            setIsLoggedIn(true);
            return; // done
          }
        }
        // If /user/me failed or returned no user, fall back to localStorage
        const existing = loadUserFromLocalStorage();
        if (existing) setIsLoggedIn(true);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        const existing = loadUserFromLocalStorage();
        if (existing) setIsLoggedIn(true);
      }
    };

    bootstrap();
  }, []);

  const handlePlanTrip = () => {
    if (!isLoggedIn) {
      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
        navigate("/login");
      }, 2000);
    } else {
      navigate("/plan");
    }
  };

  const handleProfile = () => {
    if (!isLoggedIn) {
      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
        navigate("/login");
      }, 2000);
    } else {
      navigate("/profile");
    }
  };

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
