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

        alert(`Welcome, ${user.name}`);
        // Make sure this route renders the TourGuideApp
        window.location.replace('/profile'); // or navigate('/profile') if using react-router
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

  return (
    <div className="login-page">
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
    </div>
  );
};

export default Login;