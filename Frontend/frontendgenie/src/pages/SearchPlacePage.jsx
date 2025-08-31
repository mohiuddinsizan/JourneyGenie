import React from "react";
import LandmarkUploader from "../components/LandmarkUploader.jsx";
import "./SearchPlacePage.css";

const SearchPlacePage = () => {
  return (
    <div className="search-place-container">
      <div className="search-place-box">
        <div className="search-place-header">
          <h1>Search Places</h1>
          <p>Upload an image to discover landmarks and places around the world</p>
        </div>
        
        <div className="landmark-uploader-wrapper">
          <LandmarkUploader />
        </div>
      </div>
    </div>
  );
};

export default SearchPlacePage;