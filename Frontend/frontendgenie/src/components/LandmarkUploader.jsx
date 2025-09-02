import React, { useState } from "react";
import axios from "axios";
import { Upload, MapPin, ExternalLink, CheckCircle, Sparkles } from "lucide-react";
import "./LandmarkUploader.css";

const LandmarkUploader = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const API_BASE = import.meta.env.REACT_APP_API_URL || "http://localhost:8080";

  // Landmark mapping with cleaner names and image paths
  const landmarkData = {
    "Qutb_Minar_and_its_monuments,_Delhi": {
      name: "Qutb Minar",
      location: "Delhi, India",
      image: "landmark_1.jpg"
    },
    "Angkor_Wat": {
      name: "Angkor Wat",
      location: "Siem Reap, Cambodia",
      image: "landmark_2.jpg"
    },
    "Zvartnots": {
      name: "Zvartnots",
      location: "Armenia",
      image: "landmark_3.jpg"
    },
    "Chichen_Itza": {
      name: "Chichén Itzá",
      location: "Yucatán, Mexico",
      image: "landmark_4.jpg"
    },
    "Masada": {
      name: "Masada",
      location: "Israel",
      image: "landmark_5.jpg"
    },
    "Eiffel_Tower": {
      name: "Eiffel Tower",
      location: "Paris, France",
      image: "landmark_6.jpg"
    },
    "Victoria_Memorial": {
      name: "Victoria Memorial",
      location: "Kolkata, India",
      image: "landmark_7.jpg"
    },
    "Rohtas_Fort": {
      name: "Rohtas Fort",
      location: "Punjab, Pakistan",
      image: "landmark_8.jpg"
    },
    "Itmad-Ud-Daulah's_Tomb": {
      name: "Itmad-Ud-Daulah's Tomb",
      location: "Agra, India",
      image: "landmark_9.jpg"
    },
    "Faisal_Mosque": {
      name: "Faisal Mosque",
      location: "Islamabad, Pakistan",
      image: "landmark_10.jpg"
    }
  };

  // Function to get landmark info from the result
  const getLandmarkInfo = (locationString) => {
    // Try to find exact match first
    if (landmarkData[locationString]) {
      return landmarkData[locationString];
    }
    
    // Try to find partial matches
    const normalizedLocation = locationString.toLowerCase().replace(/[_\s-]/g, '');
    for (const [key, value] of Object.entries(landmarkData)) {
      const normalizedKey = key.toLowerCase().replace(/[_\s-]/g, '');
      if (normalizedLocation.includes(normalizedKey) || normalizedKey.includes(normalizedLocation)) {
        return value;
      }
    }
    
    // If no match found, return original data with fallback
    return {
      name: locationString.replace(/_/g, ' '),
      location: "Location detected",
      image: null
    };
  };

  const handleFileChange = (selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    handleFileChange(selectedFile);
  };

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
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      handleFileChange(droppedFile);
    }
  };

  const handleCancelFile = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select an image first!");
    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/api/landmark/predict`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        setResult({ error: "Authentication failed. Please login first!" });
      } else {
        setResult({ error: "Error predicting landmark" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landmark-uploader-container">
      <h2 className="landmark-uploader-title">Upload Your Landmark Photo</h2>

      {/* Drag and Drop Upload Area */}
      <div
        className={`upload-area ${dragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput').click()}
      >
        <input
          id="fileInput"
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="landmark-file-input"
        />
        
        {!preview ? (
          <div className="upload-placeholder">
            <Upload size={48} className="upload-icon" />
            <h3 className="upload-title">Drop your image here or click to browse</h3>
            <p className="upload-subtitle">Supports JPG, PNG, WebP formats</p>
          </div>
        ) : (
          <div className="uploaded-content">
            <img
              src={preview}
              alt="Uploaded landmark"
              className="uploaded-image"
            />
            <button
              onClick={(e) => { e.stopPropagation(); handleCancelFile(); }}
              className="upload-reset-btn"
            >
              Upload Different Image
            </button>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={loading || !file}
        className="landmark-button"
      >
        {loading ? "Predicting..." : "Predict"}
      </button>

      {/* Loader */}
      {loading && (
        <div className="landmark-loader">
          <div className="search-compass">
            <div className="compass-center"></div>
          </div>
          <div className="loader-text">Analyzing image, please wait</div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="landmark-result-container">
          {result.error ? (
            <div className="landmark-error">{result.error}</div>
          ) : (
            <div className="result-success-card">
              <div className="result-header">
                <h3 className="result-title">
                  <CheckCircle size={24} />
                  Landmark Identified!
                </h3>
                <p className="result-subtitle">This is what you're searching for</p>
              </div>

              <div className="result-content">
                {(() => {
                  const landmarkInfo = getLandmarkInfo(result.location);
                  return (
                    <>
                      <div className="result-image-container">
                        {landmarkInfo.image ? (
                          <img
                            src={`/${landmarkInfo.image}`}
                            alt={landmarkInfo.name}
                            className="result-landmark-image"
                            onError={(e) => {
                              // Fallback if image doesn't load
                              console.log('Image failed to load:', `/${landmarkInfo.image}`);
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="result-landmark-fallback">
                            <Sparkles size={48} />
                          </div>
                        )}
                        <div className="image-overlay">Match Found</div>
                      </div>

                      <div className="result-info">
                        <h2 className="result-landmark-name">{landmarkInfo.name}</h2>
                        
                        <div className="result-location">
                          <MapPin size={20} className="location-icon" />
                          {landmarkInfo.location}
                        </div>

                        <div className="confidence-section">
                          <div className="confidence-badge">
                            <Sparkles size={16} />
                            AI Detection Complete
                          </div>
                        </div>

                        <div className="learn-more-section">
                          <a 
                            href={result.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="learn-more-link"
                          >
                            <ExternalLink size={18} />
                            Learn More About This Landmark
                          </a>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LandmarkUploader;