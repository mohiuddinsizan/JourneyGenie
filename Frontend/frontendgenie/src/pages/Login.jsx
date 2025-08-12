// Login.jsx
import React, { useState, useEffect } from 'react';
import './Login.css';
import './Background.css';

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
        alert(`Welcome, ${user.name}`);
        window.location.href = '/home';
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
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
