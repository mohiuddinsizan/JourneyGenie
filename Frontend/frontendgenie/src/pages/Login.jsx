// Login.jsx
import React, { useState, useEffect } from 'react';
import './Login.css';
import './Background.css';

const apiUrl = import.meta.env.REACT_APP_API_URL;
const loginWithGoogle = apiUrl + "/oauth2/authorization/google";

const styles = {
  googleButton: {
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
  googleIcon: { width: '16px', height: '16px' },
  googleText: { color: '#444' }
};

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });

  // Overlays
  const [welcome, setWelcome] = useState({ open: false, name: '' });
  const [errorBox, setErrorBox]   = useState({ open: false, message: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${apiUrl}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const user = await res.json();

        const { password, ...safeUser } = user || {};
        localStorage.setItem('user', JSON.stringify(safeUser));

        setWelcome({ open: true, name: user?.name || 'Traveler' });
        setTimeout(() => {
          window.location.replace('/');
        }, 1400);
      } else {
        let msg = 'Username or password mismatch';
        try {
          const text = (await res.text())?.trim();
          if (text) msg = text;
        } catch {}
        setErrorBox({ open: true, message: msg });
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorBox({ open: true, message: 'Username / Password is wrong. Please try again.' });
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

  // Local keyframes used by both success and error overlays
  const localCss = `
    @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
    @keyframes popIn { 0% { transform: scale(.95); opacity: 0 } 100% { transform: scale(1); opacity: 1 } }
    @keyframes bar { 0% { width: 0 } 100% { width: 100% } }
    @keyframes shake {
      0%, 100% { transform: translateX(0) }
      20% { transform: translateX(-6px) }
      40% { transform: translateX(6px) }
      60% { transform: translateX(-4px) }
      80% { transform: translateX(4px) }
    }
  `;

  // ESC to close error
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setErrorBox({ open: false, message: '' }); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="login-page">
      {/* local animation keyframes */}
      <style>{localCss}</style>

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
                autoComplete="email"
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
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="login-button">Login</button>

            <button
              type="button"
              className="register-nav-button"
              onClick={() => navigate("/login")}
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

      {/* ✅ Welcome overlay */}
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
                width: 64, height: 64, borderRadius: '50%',
                margin: '0 auto 12px',
                background: '#ec4899',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 30,
                boxShadow: '0 8px 16px rgba(236, 72, 153, .35)'
              }}
            >
              ✓
            </div>
            <h3 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22 }}>Welcome, {welcome.name}!</h3>
            <p className="muted" style={{ margin: 0 }}>What's about a new journey ? </p>

            {/* Progress bar */}
            <div
              style={{
                height: 6, borderRadius: 999, background: '#fce7f3',
                marginTop: 16, overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%', background: '#ec4899',
                  width: 0, animation: 'bar 1.2s linear forwards',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ❌ Error overlay (cool + on-theme) */}
      {errorBox.open && (
        <div
          onClick={() => setErrorBox({ open: false, message: '' })}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2100,
            animation: 'fadeIn .2s ease-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(420px, 92%)',
              background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
              textAlign: 'center',
              animation: 'popIn .25s ease-out, shake .4s ease-out',
            }}
          >
            <div
              style={{
                width: 64, height: 64, borderRadius: '50%',
                margin: '0 auto 12px',
                background: '#ef4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 28,
                boxShadow: '0 10px 18px rgba(239, 68, 68, .35)'
              }}
            >
              !
            </div>
            <h3 style={{ margin: '0 0 6px', color: '#991b1b', fontSize: 21 }}>
              Login failed
            </h3>
            <p className="muted" style={{ margin: 0, color: '#7f1d1d' }}>
              {errorBox.message || 'Username or password mismatch'}
            </p>

            {/* Error progress bar in red, just for flair */}
            <div
              style={{
                height: 6, borderRadius: 999, background: '#fee2e2',
                marginTop: 16, overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%', background: '#ef4444',
                  width: 0, animation: 'bar .9s linear forwards',
                }}
              />
            </div>

            <button
              type="button"
              className="login-button"
              style={{ width: 180, marginTop: 14, background: '#991b1b' }}
              onClick={() => setErrorBox({ open: false, message: '' })}
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
