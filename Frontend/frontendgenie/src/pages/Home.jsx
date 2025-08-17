// src/pages/Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import ChatBot from '../components/Chatbot';

import nature1 from '../assets/nature-1.jpg';
import nature2 from '../assets/nature-2.jpg';
import nature3 from '../assets/nature-3.jpg';
import nature4 from '../assets/nature-4.jpg';
import nature5 from '../assets/nature-5.jpg';
import nature6 from '../assets/nature-6.jpg';
import heroimage from '../assets/hero.jpg';

const images = [nature1, nature2, nature3, nature4, nature5, nature6];

const Home = () => {
  const navigate = useNavigate();

  const handlePlanClick = () => {
    navigate('/plan');
  };

  return (
    <div className="home-wrapper">
      <div className="home-page">
        <div className="hero-section">
          <img src={heroimage} alt="Beautiful landscape" className="hero-image" />
          <div className="overlay" />
          <div className="hero-text">
            <h1>Welcome, Explorer!</h1>
            <p>Ready to create unforgettable memories?</p>
            <button className="plan-button" onClick={handlePlanClick}>
              Plan An Adventure
            </button>
          </div>
        </div>

        <div className="gallery-wrapper">
          <div className="gallery-track">
            {[...images, ...images].map((img, index) => (
              <img key={index} src={img} alt={`Nature ${index + 1}`} />
            ))}
          </div>
        </div>
      </div>
        <div className="chatbot-wrapper">
          <ChatBot />
        </div>
    </div>
  );
};

export default Home;
