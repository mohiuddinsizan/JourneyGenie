import React, { useState } from 'react';
import { Upload, Camera, AlertTriangle, MapPin, ExternalLink } from 'lucide-react';
import './SearchPlacePage.css';
import LandmarkUploader from '../components/LandmarkUploader';

const landmarks = [
  { id: 0, name: "Qutb Minar", link: "http://commons.wikimedia.org/wiki/Category:Qutb_Minar_and_its_monuments,_Delhi", location: "Delhi, India" },
  { id: 1, name: "Angkor Wat", link: "http://commons.wikimedia.org/wiki/Category:Angkor_Wat", location: "Siem Reap, Cambodia" },
  { id: 2, name: "Zvartnots", link: "http://commons.wikimedia.org/wiki/Category:Zvartnots", location: "Armenia" },
  { id: 3, name: "Chichén Itzá", link: "http://commons.wikimedia.org/wiki/Category:Chich%C3%A9n_Itz%C3%A1", location: "Yucatán, Mexico" },
  { id: 4, name: "Masada", link: "http://commons.wikimedia.org/wiki/Category:Masada", location: "Israel" },
  { id: 5, name: "Eiffel Tower", link: "http://commons.wikimedia.org/wiki/Category:Eiffel_Tower", location: "Paris, France" },
  { id: 6, name: "Victoria Memorial", link: "http://commons.wikimedia.org/wiki/Category:Victoria_Memorial,_Kolkata", location: "Kolkata, India" },
  { id: 7, name: "Rohtas Fort", link: "http://commons.wikimedia.org/wiki/Category:Rohtas_Fort", location: "Punjab, Pakistan" },
  { id: 8, name: "Itmad-Ud-Daulah's Tomb", link: "http://commons.wikimedia.org/wiki/Category:Itmad-Ud-Daulah's_Tomb", location: "Agra, India" },
  { id: 9, name: "Faisal Mosque", link: "http://commons.wikimedia.org/wiki/Category:Faisal_Mosque", location: "Islamabad, Pakistan" },
];

const SearchPlaceLoader = () => (
  <div className="search-loader">
    <div className="search-compass">
      <div className="compass-center"></div>
    </div>
    <div className="loader-text">Analyzing image</div>
  </div>
);

const SearchPlacePage = () => {
  const [dragOver, setDragOver] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
        simulateAnalysis();
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateAnalysis = () => {
    setIsAnalyzing(true);
    setResult(null);
    
    // Simulate AI processing time
    setTimeout(() => {
      // Randomly select a landmark for demo
      const randomLandmark = landmarks[Math.floor(Math.random() * landmarks.length)];
      const confidence = Math.floor(Math.random() * 30) + 70; // 70-99%
      
      setResult({
        detected: randomLandmark,
        confidence: confidence,
        isMatch: confidence > 80,
        // Use static asset path
        landmarkImage: `/assets/landmark_${randomLandmark.id}.jpg`
      });
      setIsAnalyzing(false);
    }, 3000);
  };

  const resetUpload = () => {
    setUploadedImage(null);
    setResult(null);
    setIsAnalyzing(false);
  };

  return (
    <div className="search-place-page">
      <div className="search-place-card">
        
        {/* Header */}
        <div className="search-header">
          <h1 className="search-title">Landmark Discovery AI</h1>
          <p className="search-description">
            Upload an image of a landmark and let our AI identify it for you. Discover amazing places around the world!
          </p>
        </div>

        {/* Upload Section */}
        <div className="upload-section">
          <h2 className="section-title">Upload Your Landmark Photo</h2>

          <div className="uploader-section">
          <LandmarkUploader />
        </div>
          
        </div>

        {/* Analysis Loading */}
        {isAnalyzing && <SearchPlaceLoader />}
        
        {/* Analysis Result */}
        {result && !isAnalyzing && (
          <div className={`result-section ${result.isMatch ? 'result-success' : 'result-warning'}`}>
            <div className="result-header">
              <MapPin size={24} className="result-icon" />
              <h3 className="result-title">
                {result.isMatch ? 'Match Found!' : 'Possible Match'}
              </h3>
            </div>
            
            <div className="result-content">
              <img
                src={result.landmarkImage}
                alt={result.detected.name}
                className="result-image"
                onError={(e) => {
                  // Fallback to a placeholder if image doesn't exist
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDE1MCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMWExZjI3Ii8+Cjx0ZXh0IHg9Ijc1IiB5PSI1NSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5YWE1YjEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlPC90ZXh0Pgo8L3N2Zz4K';
                }}
              />
              <div className="result-info">
                <h4 className="result-landmark-name">{result.detected.name}</h4>
                <p className="result-location">{result.detected.location}</p>
                <div className="confidence-badge">
                  {result.confidence}% Confidence
                </div>
                <a
                  href={result.detected.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="learn-more-link"
                >
                  Learn More <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Model Info */}
        <div className="model-info-section">
          <h3 className="model-info-title">About Our AI Model</h3>
          <div className="model-info-grid">
            <div className="model-info-item">
              <span className="info-label">Architecture:</span>
              <span className="info-value">ResNet18 (Transfer Learning)</span>
            </div>
            <div className="model-info-item">
              <span className="info-label">Validation Accuracy:</span>
              <span className="info-value success">~85%</span>
            </div>
            <div className="model-info-item">
              <span className="info-label">Training Status:</span>
              <span className="info-value warning">In Progress</span>
            </div>
          </div>
        </div>

                {/* Warning Section with Landmark List */}
                <div className="warning-section">
          <div className="warning-header">
            <AlertTriangle size={24} className="warning-icon" />
            <h3 className="warning-title">AI Training Mode</h3>
          </div>
          
          <p className="warning-text">
            Our AI is currently under training and can only recognize these specific landmarks. 
            We're working hard to expand our database to include thousands more destinations worldwide!
          </p>

          <div className="landmarks-grid">
            {landmarks.map((landmark) => (
              <div key={landmark.id} className="landmark-badge">
                <span className="landmark-name">{landmark.name}</span>
                <span className="landmark-location">{landmark.location}</span>
              </div>
            ))}
          </div>
        </div>


      </div>
    </div>
  );
};

export default SearchPlacePage;