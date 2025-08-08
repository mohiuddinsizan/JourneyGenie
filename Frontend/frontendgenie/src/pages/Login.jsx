// Login.jsx
import React, { useState, useEffect } from 'react';
import './login.css';
import './background.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember: false
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempt:', formData);
    // Add your login logic here
  };

  // Generate stars on component mount
  useEffect(() => {
    const createStars = () => {
      const starsContainer = document.getElementById('stars');
      if (starsContainer) {
        const numStars = 100;
        
        for (let i = 0; i < numStars; i++) {
          const star = document.createElement('div');
          star.className = 'star';
          star.style.left = Math.random() * 100 + '%';
          star.style.top = Math.random() * 60 + '%';
          star.style.animationDelay = Math.random() * 3 + 's';
          starsContainer.appendChild(star);
        }
      }
    };
    
    createStars();
    
    // Cleanup function
    return () => {
      const starsContainer = document.getElementById('stars');
      if (starsContainer) {
        starsContainer.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="login-page">
      {/* Background Elements */}
      <div className="background"></div>
      <div className="stars" id="stars"></div>
      <div className="planet"></div>
      <div className="sun"></div>
      
      <div className="landscape">
        <div className="mountain mountain-1"></div>
        <div className="mountain mountain-2"></div>
        <div className="tree">
          <div className="tree-trunk"></div>
          <div className="tree-crown"></div>
        </div>
      </div>

      {/* Login Form */}
      <div className="login-container">
        <div className="login-form-box">
          <h1 className="welcome-title">Welcome to the website</h1>
          <p className="welcome-subtitle">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, 
            sed do eiusmod tempor incididunt ut labore et dolore.
          </p>
          
          <h2 className="login-title">USER LOGIN</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <div className="input-icon user-icon"></div>
              <input
                type="text"
                name="username"
                className="input-field"
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="input-group">
              <div className="input-icon lock-icon"></div>
              <input
                type="password"
                name="password"
                className="input-field"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleInputChange}
                />
                Remember
              </label>
              <a href="#" className="forgot-password">Forgot Password?</a>
            </div>
            
            <button type="submit" className="login-button">
            Login
            </button>

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
      
      <div className="designer-credit">
        designed by <span>Team_X</span>
      </div>
    </div>
  );
};

export default Login;
