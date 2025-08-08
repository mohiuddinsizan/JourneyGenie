// Register.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './register.css';
import './background.css';

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length === 0) {
      console.log('Registration attempt:', formData);
      // Add your registration logic here
    } else {
      setErrors(newErrors);
    }
  };

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

    return () => {
      const starsContainer = document.getElementById('stars');
      if (starsContainer) starsContainer.innerHTML = '';
    };
  }, []);

  return (
    <div className="register-page">
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

      <div className="register-container">
        <div className="register-form-box">
          <h1 className="welcome-title">Create Your Account</h1>
          
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <div className="input-icon user-icon"></div>
              <input
                type="text"
                name="fullName"
                className="input-field"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
              {errors.fullName && <span className="error-message">{errors.fullName}</span>}
            </div>

            <div className="input-group">
              <div className="input-icon email-icon"></div>
              <input
                type="email"
                name="email"
                className="input-field"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="input-group">
              <div className="input-icon lock-icon"></div>
              <input
                type="password"
                name="confirmPassword"
                className="input-field"
                placeholder="Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
            
            <div className="form-options">
              <label className="terms-agreement">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleInputChange}
                />
                I agree to the <a href="#" className="terms-link">Terms & Conditions</a>
              </label>
              {errors.agreeTerms && <span className="error-message">{errors.agreeTerms}</span>}
            </div>
            
            <button type="submit" className="register-button">
              Create Account
            </button>

            <button type="button" className="google-button" onClick={() => alert('Google Sign-In logic here')}>
              <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google Logo" className="google-logo" />
              Continue with Google
            </button>

            <div className="login-link">
              Already have an account? <a href="/" className="switch-link">Login here</a>
            </div>

          </form>
        </div>
      </div>

      <div className="designer-credit">
        designed by <span>Team_X</span>
      </div>
    </div>
  );
};

export default Register;
