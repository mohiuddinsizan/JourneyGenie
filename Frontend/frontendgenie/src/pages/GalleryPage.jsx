import React, { useState, useEffect } from "react";
import { Search, Calendar, MapPin, ImageIcon, Video, ArrowLeft } from "lucide-react";
import "./GalleryPage.css";

const API_BASE = import.meta.env.REACT_APP_API_URL || 'http://localhost:8080';

const GalleryPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState(null); // 'photos' or 'videos'
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(`${API_BASE}/user/me`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);


if (loading) {
  return (
    <div className="loading-popup">
      <div className="loading-spinner"></div>
      <p>Loading your gallery...</p>
    </div>
  );
}

  

  if (!user) {
    return (
      <div className="gallery-container">
        <div className="no-user-message">
          <p>Please log in to view your travel gallery.</p>
        </div>
      </div>
    );
  }

  // Extract photos
  const photos = [];
  if (user.tours) {
    user.tours.forEach(tour => {
      if (tour.days) {
        tour.days.forEach(day => {
          if (day.photos) {
            day.photos.forEach(photo => {
              photos.push({
                ...photo,
                tourTitle: `${tour.destination} Trip`,
                date: day.date,
                startLocation: tour.startLocation,
                destination: tour.destination
              });
            });
          }
        });
      }
    });
  }

  // Extract videos
  const videos = [];
  if (user.tours) {
    user.tours.forEach(tour => {
      if (tour.video) {
        videos.push({
          id: tour.id,
          link: tour.video,
          title: `${tour.destination} Trip`,
          startDate: tour.startDate,
          endDate: tour.endDate,
          startLocation: tour.startLocation,
          destination: tour.destination,
          budget: tour.budget
        });
      }
    });
  }

  // Filter photos based on search term
  const filteredPhotos = photos.filter(photo =>
    photo.tourTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    photo.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    photo.startLocation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Section selection view
  if (!selectedSection) {
    return (
      <div className="gallery-container">
        <div className="gallery-header">
          <h1>My Travel Gallery</h1>
          <p>Relive your amazing travel memories</p>
        </div>

        <div className="sections-grid">
          <div 
            className="section-card"
            onClick={() => setSelectedSection('photos')}
          >
            <div className="section-icon-wrapper">
              <ImageIcon className="section-main-icon" />
            </div>
            <div className="section-content">
              <h3>Photos</h3>
              <p>{photos.length} travel photos</p>
              <span className="section-description">
                Browse through all your captured moments from your trips
              </span>
            </div>
            <div className="section-arrow">→</div>
          </div>

          <div 
            className="section-card"
            onClick={() => setSelectedSection('videos')}
          >
            <div className="section-icon-wrapper">
              <Video className="section-main-icon" />
            </div>
            <div className="section-content">
              <h3>Trip Videos</h3>
              <p>{videos.length} travel videos</p>
              <span className="section-description">
                Watch your complete trip experiences and highlights
              </span>
            </div>
            <div className="section-arrow">→</div>
          </div>
        </div>
      </div>
    );
  }

  // Photos section view
  if (selectedSection === 'photos') {
    return (
      <div className="gallery-container">
        <div className="section-view-header">
          <button 
            className="back-button"
            onClick={() => {
              setSelectedSection(null);
              setSearchTerm("");
            }}
          >
            <ArrowLeft size={20} />
            Back to Gallery
          </button>
          
          <div className="section-title-with-search">
            <div className="section-title">
              <ImageIcon className="section-icon" />
              <h2>Photos ({filteredPhotos.length})</h2>
            </div>
            
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search photos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </div>

        <div className="photos-grid">
          {filteredPhotos.length > 0 ? (
            filteredPhotos.map((photo, index) => (
              <div 
                key={`${photo.id}-${index}`} 
                className="photo-card"
                onClick={() => setSelectedImage(photo)}
              >
                <img 
                  src={photo.link} 
                  alt={photo.tourTitle}
                  className="photo-image"
                />
                <div className="photo-overlay">
                  <div className="photo-info">
                    <h4>{photo.tourTitle}</h4>
                    <div className="photo-details">
                      <span className="photo-location">
                        <MapPin size={14} />
                        {photo.startLocation} → {photo.destination}
                      </span>
                      <span className="photo-date">
                        <Calendar size={14} />
                        {new Date(photo.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-content">
              <ImageIcon size={48} />
              <p>No photos found. Try adjusting your search or start your first trip to capture memories!</p>
            </div>
          )}
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
            <div className="modal-content image-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setSelectedImage(null)}>×</button>
              <img src={selectedImage.link} alt={selectedImage.tourTitle} className="modal-image" />
              <div className="modal-info">
                <h3>{selectedImage.tourTitle}</h3>
                <p>
                  <MapPin size={16} />
                  {selectedImage.startLocation} → {selectedImage.destination}
                </p>
                <p>
                  <Calendar size={16} />
                  {new Date(selectedImage.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Videos section view
  if (selectedSection === 'videos') {
    return (
      <div className="gallery-container">
        <div className="section-view-header">
          <button 
            className="back-button"
            onClick={() => setSelectedSection(null)}
          >
            <ArrowLeft size={20} />
            Back to Gallery
          </button>
          
          <div className="section-title">
            <Video className="section-icon" />
            <h2>Trip Videos ({videos.length})</h2>
          </div>
        </div>

        <div className="videos-grid">
          {videos.length > 0 ? (
            videos.map((video) => (
              <div 
                key={video.id} 
                className="video-card"
                onClick={() => setSelectedVideo(video)}
              >
                <div className="video-thumbnail">
                  <video
                    src={video.link}
                    className="video-preview"
                    muted
                    preload="metadata"
                  />
                  <div className="play-button">
                    <Video size={32} />
                  </div>
                </div>
                <div className="video-info">
                  <h4>{video.title}</h4>
                  <div className="video-details">
                    <span className="video-route">
                      <MapPin size={14} />
                      {video.startLocation} → {video.destination}
                    </span>
                    <span className="video-duration">
                      <Calendar size={14} />
                      {new Date(video.startDate).toLocaleDateString()} - {new Date(video.endDate).toLocaleDateString()}
                    </span>
                    <span className={`budget-badge budget-${video.budget}`}>
                      {video.budget} budget
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-content">
              <Video size={48} />
              <p>No trip videos available. Complete your trips to generate travel videos!</p>
            </div>
          )}
        </div>

        {/* Video Modal */}
        {selectedVideo && (
          <div className="modal-overlay" onClick={() => setSelectedVideo(null)}>
            <div className="modal-content video-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setSelectedVideo(null)}>×</button>
              <video 
                src={selectedVideo.link} 
                controls 
                autoPlay 
                className="modal-video"
              />
              <div className="modal-info">
                <h3>{selectedVideo.title}</h3>
                <p>
                  <MapPin size={16} />
                  {selectedVideo.startLocation} → {selectedVideo.destination}
                </p>
                <p>
                  <Calendar size={16} />
                  {new Date(selectedVideo.startDate).toLocaleDateString()} - {new Date(selectedVideo.endDate).toLocaleDateString()}
                </p>
                <span className={`budget-badge budget-${selectedVideo.budget}`}>
                  {selectedVideo.budget} budget
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
};

export default GalleryPage;