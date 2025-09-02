import React, { useState, useEffect } from "react";
import { Search, Calendar, MapPin, ImageIcon, Video, ArrowLeft, Tag } from "lucide-react";
import "./GalleryPage.css";

const API_BASE = import.meta.env.REACT_APP_API_URL || 'http://localhost:8080';

// AI Image Analysis Service - generates descriptions for content matching
const generateImageDescription = async (imageUrl) => {
  try {
    // Option 1: Using OpenAI Vision API (recommended)
    const response = await fetch(`${API_BASE}/api/analyze-image-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        imageUrl,
        prompt: "Describe this image in detail, including objects, animals, landscapes, people, food, activities, weather, time of day, and any notable features. Be comprehensive but concise."
      }),
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.description || '';
    }
  } catch (error) {
    console.error('Image description generation failed:', error);
  }
  
  return '';
};

// Alternative: Using Google Vision API
const generateImageDescriptionGoogle = async (imageUrl) => {
  try {
    const response = await fetch(`${API_BASE}/api/google-vision-describe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.description || '';
    }
  } catch (error) {
    console.error('Google Vision analysis failed:', error);
  }
  
  return '';
};

// Calculate relevance score for search matching
const calculateRelevanceScore = (description, searchTerm) => {
  if (!description || !searchTerm) return 0;
  
  const descLower = description.toLowerCase();
  const searchLower = searchTerm.toLowerCase();
  
  let score = 0;
  
  // Exact match bonus
  if (descLower.includes(searchLower)) {
    score += 100;
  }
  
  // Word matching
  const searchWords = searchLower.split(' ').filter(word => word.length > 2);
  const descWords = descLower.split(' ');
  
  searchWords.forEach(searchWord => {
    descWords.forEach(descWord => {
      if (descWord.includes(searchWord) || searchWord.includes(descWord)) {
        score += 50;
      }
      // Partial matching for similar words
      if (descWord.length > 3 && searchWord.length > 3) {
        const similarity = calculateStringSimilarity(searchWord, descWord);
        if (similarity > 0.7) {
          score += 30;
        }
      }
    });
  });
  
  return score;
};

// Simple string similarity calculation
const calculateStringSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

const GalleryPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [imageDescriptions, setImageDescriptions] = useState({}); // Store AI descriptions
  const [analyzingImages, setAnalyzingImages] = useState(new Set()); // Track which images are being analyzed

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

  // Analyze image when needed for search
  const analyzeImageForSearch = async (photo) => {
    if (imageDescriptions[photo.link] || analyzingImages.has(photo.link)) {
      return imageDescriptions[photo.link] || '';
    }
    
    setAnalyzingImages(prev => new Set(prev).add(photo.link));
    
    try {
      const description = await generateImageDescription(photo.link);
      
      setImageDescriptions(prev => ({
        ...prev,
        [photo.link]: description
      }));
      
      return description;
    } catch (error) {
      console.error('Failed to analyze image:', error);
      return '';
    } finally {
      setAnalyzingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(photo.link);
        return newSet;
      });
    }
  };

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

  // Smart filtering with AI descriptions and relevance scoring
  const getFilteredPhotos = async () => {
    if (!searchTerm.trim()) return photos;
    
    const photosWithScores = await Promise.all(
      photos.map(async (photo) => {
        let score = 0;
        
        // Location and title matching (existing functionality)
        const searchLower = searchTerm.toLowerCase();
        const locationMatch = 
          photo.tourTitle.toLowerCase().includes(searchLower) ||
          photo.destination.toLowerCase().includes(searchLower) ||
          photo.startLocation.toLowerCase().includes(searchLower);
        
        if (locationMatch) {
          score += 200; // High priority for location matches
        }
        
        // AI description matching
        const description = await analyzeImageForSearch(photo);
        const contentScore = calculateRelevanceScore(description, searchTerm);
        score += contentScore;
        
        return {
          photo,
          score,
          description
        };
      })
    );
    
    // Filter and sort by relevance score
    return photosWithScores
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.photo);
  };

  // Use state for filtered photos to trigger re-render
  const [filteredPhotos, setFilteredPhotos] = useState(photos);
  const [searching, setSearching] = useState(false);

  // Update filtered photos when search term changes
  useEffect(() => {
    const updateFilteredPhotos = async () => {
      if (!searchTerm.trim()) {
        setFilteredPhotos(photos);
        return;
      }
      
      setSearching(true);
      const filtered = await getFilteredPhotos();
      setFilteredPhotos(filtered);
      setSearching(false);
    };

    const debounceTimer = setTimeout(updateFilteredPhotos, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, photos, imageDescriptions]);

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
              <h3>Smart Photos</h3>
              <p>{photos.length} travel photos</p>
              <span className="section-description">
                Search your photos by content using AI - find animals, landscapes, food, and more
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
              <h2>Smart Photos ({filteredPhotos.length})</h2>
              {(searching || analyzingImages.size > 0) && (
                <span className="analyzing-indicator">
                  <div className="small-spinner"></div>
                  {searching ? 'Searching...' : `Analyzing ${analyzingImages.size} image${analyzingImages.size === 1 ? '' : 's'}...`}
                </span>
              )}
            </div>
            
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search by content: animals, mountains, food, sunset, beach, people..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </div>

        {/* Search examples */}
        {!searchTerm && (
          <div className="search-examples">
            <p>Try searching for:</p>
            <div className="example-tags">
              {['animals', 'mountains', 'food', 'sunset', 'beach', 'people', 'flowers', 'buildings'].map(example => (
                <button
                  key={example}
                  className="example-tag"
                  onClick={() => setSearchTerm(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

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
                    {/* Show AI description preview if available and relevant */}
                    {imageDescriptions[photo.link] && searchTerm && (
                      <div className="ai-match-preview">
                        <Tag size={10} />
                        AI found: {imageDescriptions[photo.link].slice(0, 60)}...
                      </div>
                    )}
                  </div>
                </div>
                {analyzingImages.has(photo.link) && (
                  <div className="analyzing-overlay">
                    <div className="small-spinner"></div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-content">
              <ImageIcon size={48} />
              <p>
                {searchTerm ? 
                  `No photos found matching "${searchTerm}". AI is analyzing your images to find the best matches. Try different keywords like "animals", "landscapes", or "food".` :
                  "No photos found. Start your first trip to capture memories!"
                }
              </p>
            </div>
          )}
        </div>

        {/* Enhanced Image Modal with AI description */}
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
                {/* Show AI description */}
                {imageDescriptions[selectedImage.link] && (
                  <div className="ai-description">
                    <h4>🤖 AI Description:</h4>
                    <p>{imageDescriptions[selectedImage.link]}</p>
                  </div>
                )}
                {analyzingImages.has(selectedImage.link) && (
                  <div className="ai-analyzing">
                    <div className="small-spinner"></div>
                    <span>Analyzing image content...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Videos section view (unchanged)
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