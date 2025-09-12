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

// Enhanced auth check that tries both sources
const checkAuthStatus = async () => {
  try {
    // First check localStorage (faster)
    const localUser = loadUserFromLocalStorage();
    
    // Then verify with backend
    const res = await fetch(`${API_BASE}/user/me`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (res.ok) {
      const payload = await res.json();
      const backendUser = payload?.user ?? payload;
      
      if (backendUser) {
        // Update localStorage with fresh data
        saveUserToLocalStorage(backendUser);
        return { isAuthenticated: true, user: backendUser, source: 'backend' };
      }
    } else if (res.status === 401) {
      // Backend says not authenticated, clear localStorage
      localStorage.removeItem("user");
      return { isAuthenticated: false, user: null, source: 'backend' };
    }
    
    // Backend failed but we have local data, use it but mark as potentially stale
    if (localUser) {
      return { isAuthenticated: true, user: localUser, source: 'localStorage' };
    }
    
    return { isAuthenticated: false, user: null, source: 'none' };
  } catch (err) {
    console.error("Auth check failed:", err);
    
    // Network error, fall back to localStorage
    const localUser = loadUserFromLocalStorage();
    return { 
      isAuthenticated: !!localUser, 
      user: localUser, 
      source: localUser ? 'localStorage_fallback' : 'none' 
    };
  }
};

const LandingPage = () => {
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Prevent double-run in React Strict Mode (dev)
  const didBootstrapRef = useRef(false);

  // Keep isLoggedIn in sync with localStorage across tabs/refreshes
  useEffect(() => {
    const sync = async () => {
      const authResult = await checkAuthStatus();
      setIsLoggedIn(authResult.isAuthenticated);
      setCurrentUser(authResult.user);
    };
    
    // Listen for storage changes (other tabs)
    const handleStorageChange = () => {
      sync();
    };
    
    // Listen for visibility changes (tab focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sync();
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // 🔑 One-time bootstrap: comprehensive auth check
  useEffect(() => {
    if (didBootstrapRef.current) return;
    didBootstrapRef.current = true;

    const bootstrap = async () => {
      setAuthLoading(true);
      
      try {
        const authResult = await checkAuthStatus();
        
        setIsLoggedIn(authResult.isAuthenticated);
        setCurrentUser(authResult.user);
        
        // Log the auth source for debugging
        console.log(`Auth check complete: ${authResult.isAuthenticated ? 'authenticated' : 'not authenticated'} (source: ${authResult.source})`);
        
      } catch (err) {
        console.error("Bootstrap auth check failed:", err);
        setIsLoggedIn(false);
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    bootstrap();
  }, []);

  // Enhanced auth check that works on both mobile and desktop
  const isAuthenticated = async () => {
    if (authLoading) {
      // Still loading, wait for it
      return new Promise((resolve) => {
        const checkLoading = () => {
          if (!authLoading) {
            resolve(isLoggedIn);
          } else {
            setTimeout(checkLoading, 100);
          }
        };
        checkLoading();
      });
    }
    
    // Quick check first
    if (isLoggedIn && currentUser) {
      return true;
    }
    
    // More thorough check
    const authResult = await checkAuthStatus();
    
    // Update state if different
    if (authResult.isAuthenticated !== isLoggedIn) {
      setIsLoggedIn(authResult.isAuthenticated);
      setCurrentUser(authResult.user);
    }
    
    return authResult.isAuthenticated;
  };

  const requireLoginOr = async (go) => {
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
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
  const handleFindPlaces = () => requireLoginOr(() => navigate("/searchplace"));

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="container" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <img src={image} style={{ height: "80px", marginBottom: "20px" }} alt="icon" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

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
          <button className="fancy-btn" onClick={() => navigate("/searchplace")}>
            Detect a Location
          </button>
          <button className="fancy-btn" onClick={() => navigate("/howitworks")}>
            How it Works
          </button>
        </div>

        {/* Debug info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ 
            position: 'fixed', 
            top: '10px', 
            right: '10px', 
            background: 'rgba(0,0,0,0.8)', 
            color: 'white', 
            padding: '10px', 
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 1000
          }}>
            <div>Auth Status: {isLoggedIn ? '✓ Logged In' : '✗ Not Logged In'}</div>
            {currentUser && <div>User: {currentUser.name || currentUser.email}</div>}
          </div>
        )}
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
            onClick={handleFindPlaces}
          >
            Start Finding →
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
              How it Works →
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
            onClick={handlePlanTrip}
          >
            Discover Nature →
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;