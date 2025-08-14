// Login.jsx
import React, { useState, useEffect } from 'react';
import './Login.css';
import './Background.css';

const apiUrl = 'http://localhost:8080';
const loginWithGoogle = apiUrl + "/oauth2/authorization/google";

const styles = {
  googleButton: {
    // marginTop: '12px',
    padding: '8px 12px',
    background: '#ffffff',
    color: '#444',
    borderRadius: '6px',
    fontWeight: 500,
    fontSize: '0.85em',
    border: '1px solid #ccc',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'background 0.3s',
  },
  googleIcon: {
    width: '16px',
    height: '16px',
  },
  googleText: {
    color: '#444',
  }
};

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // NEW: pretty welcome popup state
  const [welcome, setWelcome] = useState({ open: false, name: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:8080/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const user = await res.json();

        // (optional) avoid storing the password hash
        const { password, ...safeUser } = user;
        localStorage.setItem('user', JSON.stringify(safeUser));

        // ✨ instead of alert — show a beautiful welcome and then redirect
        setWelcome({ open: true, name: user?.name || 'Traveler' });
        setTimeout(() => {
          window.location.replace('/profile');
        }, 1400);
      } else {
        const errorText = await res.text();
        alert('Login failed: ' + errorText);
      }

    } catch (err) {
      console.error('Login error:', err);
      alert('Something went wrong');
    }
  };

  useEffect(() => {
    const starsContainer = document.getElementById('stars');
    if (starsContainer) {
      for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 60 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        starsContainer.appendChild(star);
      }
    }
    return () => {
      if (starsContainer) starsContainer.innerHTML = '';
    };
  }, []);

  // Small local CSS for the welcome animation (kept inside component)
  const welcomeCss = `
    @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
    @keyframes popIn { 0% { transform: scale(.95); opacity: 0 } 100% { transform: scale(1); opacity: 1 } }
    @keyframes bar { 0% { width: 0 } 100% { width: 100% } }
  `;

  return (
    <div className="login-page">
      {/* local animation keyframes */}
      <style>{welcomeCss}</style>

      <div className="background"></div>
      <div className="stars" id="stars"></div>
      <div className="login-container">
        <div className="login-form-box">
          <h2 className="login-title">Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="input-field"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="input-group">
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="input-field"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>
            <button type="submit" className="login-button">Login</button>
            <button
              type="button"
              className="register-nav-button"
              onClick={() => window.location.href = '/register'}
            >
              Create New Account
            </button>
            {/* Google Login Button */}
            <a href={loginWithGoogle} style={{ marginTop: '12px', textDecoration: 'none' }}>
              <div style={styles.googleButton}>
                <img
                  src="https://developers.google.com/identity/images/g-logo.png"
                  alt="Google"
                  style={styles.googleIcon}
                />
                <span style={styles.googleText}>Login with Google</span>
              </div>
            </a>
          </form>
        </div>
      </div>

      {/* ✨ Welcome overlay (shows after successful login) */}
      {welcome.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            animation: 'fadeIn .2s ease-out',
          }}
        >
          <div
            style={{
              width: 'min(420px, 92%)',
              background: 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 100%)',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              animation: 'popIn .25s ease-out',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                margin: '0 auto 12px',
                background: '#ec4899',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 30,
                boxShadow: '0 8px 16px rgba(236, 72, 153, .35)'
              }}
            >
              ✓
            </div>
            <h3 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22 }}>Welcome, {welcome.name}!</h3>
            <p className="muted" style={{ margin: 0 }}>Redirecting to your profile…</p>

            {/* Progress bar */}
            <div
              style={{
                height: 6,
                borderRadius: 999,
                background: '#fce7f3',
                marginTop: 16,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  background: '#ec4899',
                  width: 0,
                  animation: 'bar 1.2s linear forwards',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
