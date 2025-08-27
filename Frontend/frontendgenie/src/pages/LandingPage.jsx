import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";
import image from '../assets/genielogo.png';
import ChatBot from "../components/Chatbot";
import image1 from "../assets/tour-thumbnail-10.jpg"
import image2 from "../assets/tour-thumbnail-9.jpg";
import image3 from "../assets/tour-thumbnail-7.jpg";
import imagehero from "../assets/imagehero.jpg";
import naturelover from "../assets/naturelover.jpg";
import image6 from "../assets/tour-thumbnail-1.jpg";
import LandmarkUploader from "../components/LandmarkUploader.jsx";

const API_BASE = import.meta.env.REACT_APP_API_URL || 'http://localhost:8080';


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
        const res = await fetch(`${API_BASE}/user/me`, {
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

      <div className="box" style={{ marginTop: "100px" }}>
        <div className="ideas-header">
          <h1>Drop the Vibe or ask a Question</h1>
          <h3 style={{ marginLeft: '100px' }}> Try one below to spark instant travel ideas.</h3>
        </div>

        {/* three horizontally aligned cards */}
        <div className="ideas-grid">
          <article className="idea-card">
            <div className="thumb">
              <img src={image1} alt="Discover Places" />
            </div>
            <h3>Discover Places</h3>
            <p>Best monsoon getaways and hill stations in India for a family trip</p>
          </article>

          <article className="idea-card">
            <div className="thumb">
              <img src={image2} alt="Weekend Getaway" />
            </div>
            <h3>Weekend Getaway</h3>
            <p>Weekend getaways near Mumbai with friends—road trips, hikes, or amusement parks</p>
          </article>

          <article className="idea-card">
            <div className="thumb">
              <img src={image3} alt="Best Time to Visit" />
            </div>
            <h3>Best Time to Visit</h3>
            <p>Best time to visit Nagaland for the Hornbill Festival, and how many days to plan</p>
          </article>
        </div>

        <div className="ideas-footer">
          <button
            className="cta-primary"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Start Chatting →
          </button>
        </div>
      </div>





      <div className="box feature-box" style={{ marginTop: "100px" }}>
        <div className="feature-left">
          <h2>
            Why Our Tour Guide App <em>Works?</em>
          </h2>
          <ul className="feature-list">
            <li>✔ Plan trips, hangouts, or date nights in one chat</li>
            <li>✔ Get recommendations tailored to your mood and crew</li>
            <li>✔ Find hidden gems — cafés, bars, and local spots</li>
            <li>✔ Turn any idea into a real plan</li>
            <li>✔ Explore curated itineraries from travel creators</li>
            <li>✔ Discover stays, hotspots, and unique picks</li>
            <li>✔ Ask anything — from weather to what to pack</li>
            <li>✔ Get the full plan from A to Z</li>
            <li>✔ See the routes of your journey</li>
            <li>✔ Also checkout the weather there . All in one</li>
          </ul>

          <div className="feature-cta">
            <button
              className="cta-primary"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Start Chatting →
            </button>
          </div>
        </div>

        <div className="feature-right">
          <img src={imagehero} alt="Travel hero" />
        </div>
      </div>

      <div className="box discover-box" style={{ marginTop: "100px" }}>
        {/* Left side image */}
        <div className="discover-left">
          <img src={naturelover} alt="Nature Explorer" />
        </div>

        {/* Right side text */}
        <div className="discover-right">
          <h2>
            For Nature Lovers who <br />
            seek to Discover More 🌲
          </h2>
          <p>
            Escape the noise and reconnect with the outdoors. From hidden waterfalls
            and serene hiking trails to breathtaking landscapes, our app helps you
            find the best nature getaways — tailored just for you.
          </p>

          <button
            className="cta-primary"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Discover Nature →
          </button>
        </div>
      </div>

      <div className="landmark-uploader">
        <LandmarkUploader />
      </div>

    </div>
  );
};

export default LandingPage;
