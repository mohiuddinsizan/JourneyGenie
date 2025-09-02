import React, { useState, useEffect } from "react";
import { Search, Calendar, MapPin, Image, Video, ArrowLeft, Loader2 } from "lucide-react";
import './GalleryPage.css';
const API_BASE = import.meta.env.REACT_APP_API_URL || 'http://localhost:8080';

const GalleryPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState(null); // 'photos' or 'videos'
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

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
          const initialPhotos = extractPhotos(userData);
          setFilteredPhotos(initialPhotos);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Extract photos
  const extractPhotos = (userData) => {
    const photos = [];
    if (userData?.tours) {
      userData.tours.forEach(tour => {
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
    return photos;
  };

  // Handle AI-powered search
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setFilteredPhotos(extractPhotos(user));
      return;
    }

    setIsSearching(true);
    try {
      const allPhotos = extractPhotos(user);
      const analysisPromises = allPhotos.map(async (photo) => {
        try {
          const response = await fetch(`${API_BASE}/api/analyze-image-content`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              imageUrl: photo.link,
              prompt: searchTerm
            })
          });

          if (response.ok) {
            const result = await response.json();
            if (result && typeof result === 'object' && result.description) {
              return {
                ...photo,
                relevance: result.description.toLowerCase().includes(searchTerm.toLowerCase()) ? 1 : 0,
                description: result.description
              };
            }
          }
        } catch (error) {
          console.error("Failed to analyze photo:", error);
        }
        
        const photoText = `${photo.tourTitle} ${photo.startLocation} ${photo.destination}`.toLowerCase();
        const matchScore = photoText.includes(searchTerm.toLowerCase()) ? 0.5 : 0;
        
        return { 
          ...photo, 
          relevance: matchScore, 
          description: 'Basic search match' 
        };
      });

      const analyzedPhotos = await Promise.all(analysisPromises);
      const relevantPhotos = analyzedPhotos
        .filter(photo => photo.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance);
      
      setFilteredPhotos(relevantPhotos);
    } catch (error) {
      console.error("Failed to perform AI search:", error);
      const allPhotos = extractPhotos(user);
      const basicResults = allPhotos.filter(photo => 
        `${photo.tourTitle} ${photo.startLocation} ${photo.destination}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
      setFilteredPhotos(basicResults);
    } finally {
      setIsSearching(false);
    }
  };

  // Trigger search on Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Reset search when clearing input
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPhotos(extractPhotos(user));
    }
  }, [searchTerm, user]);

  if (loading) {
    return (
      <div className="gallery-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your gallery...</p>
        </div>
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
              <Image className="section-main-icon" />
            </div>
            <div className="section-content">
              <h3>Photos</h3>
              <p>{filteredPhotos.length} travel photos</p>
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

  if (selectedSection === 'photos') {
    return (
      <div className="gallery-container">
        <div className="section-view-header">
          <button 
            className="back-button"
            onClick={() => {
              setSelectedSection(null);
              setSearchTerm("");
              setFilteredPhotos(extractPhotos(user));
            }}
          >
            <ArrowLeft size={20} />
            Back to Gallery
          </button>
          
          <div className="section-title-with-search">
            <div className="section-title">
              <Image className="section-icon" />
              <h2>Photos ({filteredPhotos.length})</h2>
            </div>
            
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search photos with AI (e.g., 'beach sunset')..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="search-input"
                disabled={isSearching}
              />
              <button
                className="search-button"
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? (
                  <Loader2 className="search-spinner" size={16} />
                ) : (
                  <Search size={16} />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="gallery-section">
          <div className="photos-grid">
            {isSearching ? (
              <div className="search-loading-grid">
                <div className="spinner"></div>
                <p>Analyzing photos with AI...</p>
              </div>
            ) : filteredPhotos.length > 0 ? (
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
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="image-error" style={{ display: 'none' }}>
                    <Image size={24} />
                    <p>Image unavailable</p>
                  </div>
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
                      {photo.description && photo.description !== 'Basic search match' && (
                        <span className="photo-description">
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-content">
                <Image size={48} />
                <p>
                  {searchTerm.trim() 
                    ? "No photos found matching your search. Try different keywords!"
                    : "No photos found. Start your first trip to capture memories!"
                  }
                </p>
                {searchTerm.trim() && (
                  <button 
                    className="clear-search-btn"
                    onClick={() => {
                      setSearchTerm("");
                      setFilteredPhotos(extractPhotos(user));
                    }}
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {selectedImage && (
          <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
            <div className="modal-content image-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setSelectedImage(null)}>×</button>
              <img 
                src={selectedImage.link} 
                alt={selectedImage.tourTitle} 
                className="modal-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="modal-image-error" style={{ display: 'none' }}>
                <Image size={48} />
                <p>Image could not be loaded</p>
              </div>
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
                {selectedImage.description && selectedImage.description !== 'Basic search match' && (
                  <div className="modal-description">
                    
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (selectedSection === 'videos') {
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
          
          <div className="section-title">
            <Video className="section-icon" />
            <h2>Trip Videos ({videos.length})</h2>
          </div>
        </div>

        <div className="gallery-section">
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
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="video-error" style={{ display: 'none' }}>
                      <Video size={24} />
                      <p>Video unavailable</p>
                    </div>
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
        </div>

        {selectedVideo && (
          <div className="modal-overlay" onClick={() => setSelectedVideo(null)}>
            <div className="modal-content video-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setSelectedVideo(null)}>×</button>
              <video 
                src={selectedVideo.link} 
                controls 
                autoPlay 
                className="modal-video"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="modal-video-error" style={{ display: 'none' }}>
                <Video size={48} />
                <p>Video could not be loaded</p>
              </div>
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
