import React, { useState } from 'react';
export const shareToFacebook = (tourData) => {
  // Format the content for sharing
  const shareText = `${tourData.title || `Amazing trip to ${tourData.destination}!`}

📍 ${tourData.destination}
📅 ${tourData.startDate} - ${tourData.endDate}
💰 ${tourData.budget}

${tourData.content}

#travel #${tourData.destination.replace(/\s+/g, '')} #travelgram`;

  // Create the Facebook share URL
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareText)}`;
  
  // Open Facebook share dialog in a popup
  const popup = window.open(
    shareUrl,
    'facebook-share-dialog',
    'width=626,height=436,resizable=yes,scrollbars=yes'
  );

  // Optional: Focus on the popup window
  if (popup) {
    popup.focus();
  }

  return popup;
};

/**
 * Alternative method using Web Share API (if supported)
 */
export const shareToFacebookWebAPI = async (tourData) => {
  if (!navigator.share) {
    // Fallback to regular Facebook sharing
    return shareToFacebook(tourData);
  }

  const shareText = `${tourData.title || `Amazing trip to ${tourData.destination}!`}

📍 ${tourData.destination}
📅 ${tourData.startDate} - ${tourData.endDate}  
💰 ${tourData.budget}

${tourData.content}`;

  try {
    await navigator.share({
      title: tourData.title || `Trip to ${tourData.destination}`,
      text: shareText,
      url: window.location.href
    });
    return { success: true };
  } catch (error) {
    // User cancelled or error occurred, fallback to Facebook share
    return shareToFacebook(tourData);
  }
};

// React Component for Facebook Share Modal (simpler version)
export const FacebookShareModal = ({ 
  isOpen, 
  onClose, 
  tourData 
}) => {
  const [shareText, setShareText] = useState('');

  React.useEffect(() => {
    if (isOpen && tourData) {
      const content = `${tourData.title || `Amazing trip to ${tourData.destination}!`}

📍 Destination: ${tourData.destination}
📅 Duration: ${tourData.startDate} - ${tourData.endDate}
💰 Budget: ${tourData.budget}

${tourData.content}

#travel #${tourData.destination.replace(/\s+/g, '')} #travelgram`;
      
      setShareText(content);
    }
  }, [isOpen, tourData]);

  const handleShare = () => {
    const modifiedTourData = {
      ...tourData,
      content: shareText
    };

    shareToFacebook(modifiedTourData);
    onClose();
  };

  const handleWebShare = async () => {
    const modifiedTourData = {
      ...tourData,
      content: shareText
    };

    await shareToFacebookWebAPI(modifiedTourData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="plan-card"
        style={{
          width: '90%',
          maxWidth: 600,
          maxHeight: '80vh',
          overflow: 'auto',
          margin: 20
        }}
      >
        <div className="preview-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Share to Facebook</h3>
          <button onClick={onClose} className="btn">✕</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Preview your share:
          </label>
          <textarea
            value={shareText}
            onChange={(e) => setShareText(e.target.value)}
            style={{
              width: '100%',
              height: 200,
              padding: 12,
              border: '1px solid #ddd',
              borderRadius: 6,
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
            placeholder="What would you like to share about your trip?"
          />
        </div>

        {tourData?.thumbnail && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ marginBottom: 8, fontWeight: 600 }}>Image will be shared:</p>
            <img 
              src={tourData.thumbnail} 
              alt="Tour thumbnail"
              style={{ 
                width: '100%', 
                maxHeight: 200, 
                objectFit: 'cover', 
                borderRadius: 6 
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn">
            Cancel
          </button>
          
          {navigator.share && (
            <button onClick={handleWebShare} className="btn">
              Share (Mobile)
            </button>
          )}
          
          <button onClick={handleShare} className="btn success">
            Share to Facebook
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacebookShareModal;