// File: src/pages/TourGuideApp.jsx
import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import {
  MapPin, Calendar, DollarSign, Users, Star, Wallet, Clock, CheckCircle, Plus, Image,
  RefreshCw, List, CheckSquare, Video, LogOut, Share2, BookOpen
} from 'lucide-react';
import { FacebookShareModal } from '../components/FacebookShareHandler';
import './Profile.css';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.REACT_APP_API_URL || 'http://localhost:8080';

const LOGOUT_ENDPOINTS = [
  `${API_BASE}/user/logout`,
  `${API_BASE}/logout`,
  `${API_BASE}/auth/logout`,
];

// Try common routes until one works (HTTP 200/204)
async function serverLogout() {
  for (const url of LOGOUT_ENDPOINTS) {
    try {
      const res = await fetch(url, { method: 'POST', credentials: 'include' });
      if (res.ok || res.status === 204) return true;
      if (res.status !== 404) return true; // treat other statuses as attempted
    } catch { /* keep trying */ }
  }
  return false;
}

const importedThumbs = import.meta.glob('../assets/tour-thumbnail-*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
});
const TOUR_THUMBS = Object.entries(importedThumbs)
  .sort(([a], [b]) => {
    const na = parseInt(a.match(/tour-thumbnail-([0-9]+)/)?.[1] ?? '0', 10);
    const nb = parseInt(b.match(/tour-thumbnail-([0-9]+)/)?.[1] ?? '0', 10);
    return na - nb;
  })
  .map(([, url]) => url);

const getTourThumb = (tour, idx) => {
  if (!TOUR_THUMBS.length) return null;
  const key = Number.isFinite(Number(tour?.id)) ? Number(tour.id) : idx;
  return TOUR_THUMBS[key % TOUR_THUMBS.length];
};

function normalizeTours(rawTours = []) {
  return rawTours.map((t, idx) => ({
    ...t,
    thumbnail: getTourThumb(t, idx),
    days: (t.days || []).map((d) => ({ ...d, activities: d.activities || [], photos: d.photos || [] })),
  }));
}

/** ---------- Modal helpers ---------- */
function ModalPortal({ children }) {
  return ReactDOM.createPortal(children, document.body);
}

function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [active]);
}
/** ----------------------------------- */

const TourGuideApp = () => {
  const navigate = useNavigate();

  const [currentView, setCurrentView] = useState('profile');
  const [selectedTour, setSelectedTour] = useState(null);

  const [userData, setUserData] = useState(null);
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDlg, setConfirmDlg] = useState({ open: false, tourId: null, dayId: null, activityId: null });

  // Generate Video state
  const [genVideoLoading, setGenVideoLoading] = useState(false);
  const [genVideoError, setGenVideoError] = useState('');
  const [showVideoTokenAlert, setShowVideoTokenAlert] = useState(false);  // To control the video token alert visibility
  const [videoTokenAlertMessage, setVideoTokenAlertMessage] = useState("");  // To store the video token alert message
  const [showVideoConfirmation, setShowVideoConfirmation] = useState(false);  // For confirmation modal
  const [videoConfirmationTourId, setVideoConfirmationTourId] = useState(null);  // Store tour ID for confirmation


  // view modes: 'all' | 'selected' | 'blog' | 'vlog'
  const [dayMode, setDayMode] = useState('all');
  const [selectedDays, setSelectedDays] = useState(new Set());

  // blog creation loading state
  const [blogLoading, setBlogLoading] = useState(false);

  // Add under: const [blogLoading, setBlogLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');


  // Facebook Share Modal state
  const [showFacebookModal, setShowFacebookModal] = useState(false);



  const loadUserFromLocalStorage = () => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
      return null;
    }
  };

  const refreshFromStorage = () => {
    const stored = loadUserFromLocalStorage();
    if (stored) {
      setUserData(stored);
      setTours(normalizeTours(stored.tours));
    }
  };

  const fetchUserFromApi = async () => {
    const res = await fetch(`${API_BASE}/user/me`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (res.status === 401 || res.status === 403) throw new Error('NOT_AUTHENTICATED');
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to fetch user');
    }
    return await res.json();
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUser = await fetchUserFromApi();
        if (!cancelled) {
          setUserData(apiUser);
          setTours(normalizeTours(apiUser.tours));
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          if ((e && e.message) === 'NOT_AUTHENTICATED') {
            const stored = loadUserFromLocalStorage();
            if (stored) {
              setUserData(stored);
              setTours(normalizeTours(stored.tours));
              setLoading(false);
            } else {
              setError('No login found. Please log in.');
            }
          } else {
            setError((e && e.message) || 'Failed to load user');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onToursUpdated = () => refreshFromStorage();
    window.addEventListener('tours:updated', onToursUpdated);
    return () => {
      window.removeEventListener('tours:updated', onToursUpdated);
    };
  }, []);

  const handleShowDetails = (tour) => {
    setSelectedTour(tour);
    setCurrentView('tourdetails');
  };
  // Just modify your existing handleBack function to this:
  const handleBack = async () => {
    setCurrentView('profile');
    setSelectedTour(null);

    // Refresh token balance when going back to profile
    try {
      const res = await fetch(`${API_BASE}/token/balance`, {
        method: 'GET',
        credentials: 'include',
      });

      if (res.ok) {
        const tokenData = await res.json();
        setUserData(prev => prev ? { ...prev, token: tokenData.tokens } : prev);
      }
    } catch (error) {
      console.error('Failed to refresh token balance:', error);
    }
  };

  // ====== Generate Video action ======
  async function generateVideo(tourId) {
    if (!tourId) return;

    setGenVideoLoading(true);
    setGenVideoError('');

    try {
      console.log('Sending request to generate video...');

      const res = await fetch(`${API_BASE}/tour/${tourId}/video/generate`, {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });

      console.log('Response received:', res);

      if (!res.ok) {
        const errorText = await res.text();
        console.log('Error Text:', errorText);

        if (errorText.toLowerCase().includes('insufficient tokens')) {
          // Show alert if tokens are insufficient
          setVideoTokenAlertMessage("You need at least 10 tokens to generate a video.");
          setShowVideoTokenAlert(true);  // Show the alert modal
        } else {
          setGenVideoError(errorText || `HTTP ${res.status}`);
        }
        return;
      }

      console.log('Video generation started successfully');

      // Proceed with the successful response handling
      const updatedUser = await res.json();
      const { password, ...safeUser } = updatedUser || {};
      setUserData(safeUser);

      const updatedTours = normalizeTours(safeUser.tours || []);
      setTours(updatedTours);

      if (selectedTour) {
        const nt = updatedTours.find(t => String(t.id) === String(selectedTour.id));
        if (nt) setSelectedTour({ ...nt, thumbnail: getTourThumb(nt, 0) });
        else setSelectedTour(null);
      }

      try { localStorage.setItem('user', JSON.stringify(safeUser)); } catch { }
      window.dispatchEvent(new CustomEvent('tours:updated', { detail: { reason: 'video-generated', tourId } }));
    } catch (e) {
      console.error('generateVideo failed:', e);
      setGenVideoError(e?.message || 'Failed to generate video');
      setVideoTokenAlertMessage(e?.message || 'Failed to generate video');
      setShowVideoTokenAlert(true);  // Show alert if error occurs
    } finally {
      setGenVideoLoading(false);
    }
  }


  //=============Facebook Share Modal handlers ============

  const handleFacebookShare = async () => {
    if (!selectedTour?.id) return;

    // Check if blog exists
    const hasBlog = !!(selectedTour?.blog && String(selectedTour.blog).trim().length);

    if (!hasBlog) {
      setAlertMessage("Please generate a blog first before sharing to Facebook.");
      setShowAlert(true);
      return;
    }

    // Open Facebook share modal
    setShowFacebookModal(true);
  };




  // ===================================

  const markActivityDone = async (tourId, dayId, activityId) => {
    const url = `${API_BASE}/activity/${activityId}/complete`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const updatedUser = await res.json();
      const { password, ...safeUser } = updatedUser || {};
      setUserData(safeUser);
      setTours(normalizeTours(safeUser.tours || []));
      setSelectedTour(prev => {
        if (!prev) return prev;
        const next = (safeUser.tours || []).find(t => t.id === prev.id);
        return next ? { ...next, thumbnail: getTourThumb(next, 0) } : prev;
      });
      localStorage.setItem('user', JSON.stringify(safeUser));
      window.dispatchEvent(new CustomEvent('tours:updated', { detail: { reason: 'activity-completed', activityId } }));
    } catch (err) {
      console.error('[markActivityDone] fetch failed:', err);
      alert(err?.message || 'Failed to complete activity');
    }
  };

  const addActivity = async (tourId, dayId, textOverride) => {
    const text = (textOverride ?? '').trim();
    if (!text) {
      alert('Please enter an activity description.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/activity/add`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ description: text, dayid: dayId }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `HTTP ${res.status}`);
      }
      const updatedUser = await res.json();
      const { password, ...safeUser } = updatedUser || {};
      setUserData(safeUser);
      setTours(normalizeTours(safeUser.tours || []));
      setSelectedTour(prev => {
        if (!prev) return prev;
        const next = (safeUser.tours || []).find(t => t.id === prev.id);
        return next ? { ...next, thumbnail: getTourThumb(next, 0) } : prev;
      });
      localStorage.setItem('user', JSON.stringify(safeUser));
      window.dispatchEvent(new CustomEvent('tours:updated', { detail: { reason: 'activity-added', dayId } }));
    } catch (e) {
      console.error('[addActivity] failed:', e);
      alert(e?.message || 'Failed to add activity');
    }
  };

  // ========================photo upload =========================

  const uploadPhotoFile = async (tourId, dayId, file) => {
    if (!file) {
      alert('Please choose an image file.');
      return;
    }
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('dayid', String(dayId));
      const res = await fetch(`${API_BASE}/photo/upload`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `HTTP ${res.status}`);
      }
      const payload = await res.json();

      if (payload && (payload.tours || payload.email || payload.id)) {
        const { password, ...safeUser } = payload || {};
        setUserData(safeUser);
        setTours(normalizeTours(safeUser.tours || []));
        setSelectedTour(prev => {
          if (!prev) return prev;
          const next = (safeUser.tours || []).find(t => t.id === prev.id);
          return next ? { ...next, thumbnail: getTourThumb(next, 0) } : prev;
        });
        try { localStorage.setItem('user', JSON.stringify(safeUser)); } catch { }
      } else {
        const photoId = payload?.photoId ?? payload?.id ?? Date.now();
        const photoUrl = payload?.photoUrl ?? payload?.url ?? payload?.link;

        setSelectedTour(prev => {
          if (!prev || prev.id !== tourId) return prev;
          const updated = {
            ...prev,
            days: (prev.days || []).map(d => {
              if (String(d.id) !== String(dayId)) return d;
              const photos = Array.isArray(d.photos) ? [...d.photos] : [];
              photos.push({ id: photoId, link: photoUrl });
              return { ...d, photos };
            })
          };
          return updated;
        });

        setTours(prevTours => (prevTours || []).map(t => {
          if (t.id !== tourId) return t;
          return {
            ...t,
            days: (t.days || []).map(d => {
              if (String(d.id) !== String(dayId)) return d;
              const photos = Array.isArray(d.photos) ? [...d.photos] : [];
              photos.push({ id: photoId, link: photoUrl });
              return { ...d, photos };
            })
          };
        }));

        setUserData(prev => {
          if (!prev) return prev;
          const nextUser = {
            ...prev,
            tours: (prev.tours || []).map(t => {
              if (t.id !== tourId) return t;
              return {
                ...t,
                days: (t.days || []).map(d => {
                  if (String(d.id) !== String(dayId)) return d;
                  const photos = Array.isArray(d.photos) ? [...d.photos] : [];
                  photos.push({ id: photoId, link: photoUrl });
                  return { ...d, photos };
                })
              };
            })
          };
          try { localStorage.setItem('user', JSON.stringify(nextUser)); } catch { }
          return nextUser;
        });
      }

      window.dispatchEvent(new CustomEvent('tours:updated', { detail: { reason: 'photo-uploaded', dayId } }));
    } catch (e) {
      console.error('[uploadPhotoFile] failed:', e);
      alert(e?.message || 'Failed to upload photo');
    }
  };



  const totalTours = tours.length;
  const rating = userData?.rating ?? null;
  const balance = userData?.token ?? null;
  const joinDate = userData?.joinDate ?? null;

  const initials = useMemo(() => {
    const name = userData?.name || '';
    return name.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase();
  }, [userData?.name]);

  if (loading) {
    return (
      <div className="plan-page">
        <div className="plan-card">
          <p>Loading your profile…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="plan-page">
        <div className="plan-card">
          <h2>🔒 Login Required</h2>
          <p className="muted">You need to log in to see your tours and profile.</p>
          <button
            className="btn success"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }


  const ProfilePage = () => (
    <div className="plan-page">
      <div className="plan-card">
        <div className="profile-header">
          <div className="profile-avatar">{initials || '?'}</div>
          <div className="profile-info">
            <h1 className="profile-name">{userData?.name || '—'}</h1>
            <p className="profile-email">{userData?.email || '—'}</p>

            <div className="profile-stats">
              <div className="kv">
                <div className="k"><Users size={16} /> Tours</div>
                <div className="v">{totalTours}</div>
              </div>
              <div className="kv">
                <div className="k"><Star size={16} /> Rating</div>
                <div className="v">{rating ? `${rating} ⭐` : '4.8'}</div>
              </div>
              <div className="kv">
                <div className="k"><Wallet size={16} /> Balance</div>
                <div className="v">{balance ? `${balance}` : '0.00'}</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="tours-section-title">
            <MapPin size={24} className="icon-pink" />
            <h2>My Tours ({totalTours})</h2>
          </div>

          <div className="tours-grid">
            {tours.map((tour) => (
              <div key={tour.id} className="tour-card">
                <div
                  className="tour-thumbnail"
                  style={tour.thumbnail ? { backgroundImage: `url(${tour.thumbnail})` } : undefined}
                >
                  <div className="tour-duration-badge">{tour.days?.length || 0} days</div>
                  {tour.video && <div className="tour-video-indicator">▶</div>}
                </div>

                <div className="tour-card-content">
                  <h3 className="tour-title">{(tour.destination || '').toUpperCase()}</h3>

                  <div className="tour-details">
                    <div className="tour-detail-row">
                      <Calendar size={16} />
                      <span>{tour.startDate} - {tour.endDate}</span>
                    </div>
                    <div className="tour-detail-row">
                      <DollarSign size={16} />
                      <span>{tour.budget}</span>
                    </div>
                  </div>

                  <button className="btn success" onClick={() => handleShowDetails(tour)}>
                    Show Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const TourDetailsPage = () => {
    if (!selectedTour) return null;

    // Title edit modal state
    const [editOpen, setEditOpen] = useState(false);
    const [newTitle, setNewTitle] = useState(selectedTour?.title || '');
    useEffect(() => { setNewTitle(selectedTour?.title || ''); }, [selectedTour?.title]);

    const daysToRender = useMemo(() => {
      const list = selectedTour.days || [];
      if (dayMode === 'all') return list;
      if (dayMode !== 'selected') return []; // blog/vlog -> nothing
      if (!selectedDays.size) return [];
      return list.filter((d) => selectedDays.has(d.id));
    }, [dayMode, selectedTour, selectedDays]);

    const toggleDay = (id) => {
      setSelectedDays((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    };

    const saveTitle = async () => {
      const title = (newTitle || '').trim();
      if (!title) { alert('Please enter a title'); return; }
      try {
        const res = await fetch(`${API_BASE}/tour/title`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ tourid: selectedTour.id, title })
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `HTTP ${res.status}`);
        }
        const payload = await res.json();

        if (payload && (payload.tours || payload.email || payload.id)) {
          const { password, ...safeUser } = payload || {};
          setUserData(safeUser);
          const updatedTours = normalizeTours(safeUser.tours || []);
          setTours(updatedTours);
          const updatedSel = updatedTours.find(t => t.id === selectedTour.id) || { ...selectedTour, title };
          setSelectedTour({ ...updatedSel, thumbnail: getTourThumb(updatedSel, 0) });
          try { localStorage.setItem('user', JSON.stringify(safeUser)); } catch { }
        } else {
          setSelectedTour(prev => prev ? { ...prev, title } : prev);
          setTours(prev => (prev || []).map(t => t.id === selectedTour.id ? { ...t, title } : t));
          setUserData(prev => {
            if (!prev) return prev;
            const nextUser = { ...prev, tours: (prev.tours || []).map(t => t.id === selectedTour.id ? { ...t, title } : t) };
            try { localStorage.setItem('user', JSON.stringify(nextUser)); } catch { }
            return nextUser;
          });
        }
        setEditOpen(false);
      } catch (e) {
        console.error('[update title] failed]:', e);
        alert(e?.message || 'Failed to update title');
      }
    };

    // photos presence (for Generate Video button state)
    const hasAnyPhotos = useMemo(() => {
      return !!(selectedTour?.days || []).some(d => (d.photos || []).length > 0);
    }, [selectedTour]);

    // Blog helpers
    const hasBlog = !!(selectedTour?.blog && String(selectedTour.blog).trim().length);


    // const onCreateBlog = async () => {
    //   if (!selectedTour?.id || blogLoading) return;

    //   // Check token balance first
    //   const tokenResponse = await fetch(`${API_BASE}/token/balance`, {
    //     method: 'GET',
    //     credentials: 'include',
    //   });

    //   if (!tokenResponse.ok) {
    //     alert("Error checking token balance.");
    //     return;
    //   }

    //   const tokenData = await tokenResponse.json();
    //   const currentTokens = tokenData.tokens;

    //   if (currentTokens < 5) {
    //     alert("You need at least 5 tokens to generate a blog.");
    //     return; // Exit early if there are insufficient tokens
    //   }

    //   setBlogLoading(true);

    //   try {
    //     const token = localStorage.getItem('token'); // optional bearer, cookies are already included
    //     const res = await fetch(`${API_BASE}/api/blog/generate/${selectedTour.id}`, {
    //       method: 'POST',
    //       credentials: 'include',
    //       headers: {
    //         Accept: 'application/json',
    //         ...(token ? { Authorization: `Bearer ${token}` } : {}),
    //       },
    //     });

    //     if (!res.ok) {
    //       const t = await res.text();
    //       alert(t || `Failed to generate blog (HTTP ${res.status})`);
    //       return;
    //     }

    //     const updatedUser = await res.json();
    //     const { password, ...safeUser } = updatedUser || {};
    //     setUserData(safeUser);
    //     const updatedTours = normalizeTours(safeUser.tours || []);
    //     setTours(updatedTours);
    //     const nt = updatedTours.find(t => String(t.id) === String(selectedTour.id));
    //     if (nt) setSelectedTour({ ...nt, thumbnail: getTourThumb(nt, 0) });
    //     try { localStorage.setItem('user', JSON.stringify(safeUser)); } catch { }
    //     window.dispatchEvent(new CustomEvent('tours:updated', { detail: { reason: 'blog-generated', tourId: selectedTour.id } }));
    //     setDayMode('blog'); // stay on Blog tab
    //   } catch (e) {
    //     console.error('Error calling blog API', e);
    //     alert(e?.message || 'Error calling blog API');
    //   } finally {
    //     setBlogLoading(false);
    //   }
    // };

    const onCreateBlog = async () => {
      if (!selectedTour?.id || blogLoading) return;

      // Check token balance first
      const tokenResponse = await fetch(`${API_BASE}/token/balance`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!tokenResponse.ok) {
        alert("Error checking token balance.");
        return;
      }

      const tokenData = await tokenResponse.json();
      const currentTokens = tokenData.tokens;

      if (currentTokens < 5) {
        setAlertMessage("You need at least 5 tokens to generate a blog.");
        setShowAlert(true); // Show alert if tokens are insufficient
        return; // Exit early if there are insufficient tokens
      }

      // Show confirmation modal for token deduction
      setShowConfirmation(true);
    };

    const handleConfirm = async () => {
      setBlogLoading(true);
      setShowConfirmation(false); // Hide confirmation modal

      try {
        const token = localStorage.getItem('token'); // Optional bearer, cookies are already included
        const res = await fetch(`${API_BASE}/api/blog/generate/${selectedTour.id}`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          const t = await res.text();
          alert(t || `Failed to generate blog (HTTP ${res.status})`);
          return;
        }

        const updatedUser = await res.json();
        const { password, ...safeUser } = updatedUser || {};
        setUserData(safeUser);
        const updatedTours = normalizeTours(safeUser.tours || []);
        setTours(updatedTours);
        const nt = updatedTours.find(t => String(t.id) === String(selectedTour.id));
        if (nt) setSelectedTour({ ...nt, thumbnail: getTourThumb(nt, 0) });
        try { localStorage.setItem('user', JSON.stringify(safeUser)); } catch { }
        window.dispatchEvent(new CustomEvent('tours:updated', { detail: { reason: 'blog-generated', tourId: selectedTour.id } }));
        setDayMode('blog'); // Stay on Blog tab
      } catch (e) {
        console.error('Error calling blog API', e);
        alert(e?.message || 'Error calling blog API');
      } finally {
        setBlogLoading(false);
      }
    };

    const handleCancel = () => {
      setShowConfirmation(false); // Hide confirmation modal
    };

    const handleCloseAlert = () => {
      setShowAlert(false); // Close insufficient token alert
    };



    return (
      <div className="plan-page">


        <div className="plan-card">
          <div className="preview">
            {/* HEADER with Actions: Edit Title + Generate Video */}
            <div className="preview-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <h3>
                  {(selectedTour.destination || '').toUpperCase()}
                  <span className="badge">{selectedTour.days?.length || 0} days</span>
                </h3>
                <div className="muted">
                  {selectedTour.startDate} to {selectedTour.endDate} • Budget: {selectedTour.budget}
                </div>
                {selectedTour.title ? <div className="muted">Title: {selectedTour.title}</div> : null}
              </div>

              <div className="tg-flex-gap8" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

                {/* FACEBOOK SHARE BUTTON */}
                <button
                  className="btn success"
                  onClick={handleFacebookShare}
                  title="Share your tour on Facebook"
                  disabled={!selectedTour?.blog}
                >
                  <span className="tg-inlinecenter-6">
                    <Share2 size={16} /> Post
                  </span>
                </button>

                <button
                  className="btn success"
                  onClick={() => {
                    if (!hasAnyPhotos) return;
                    setVideoConfirmationTourId(selectedTour.id);
                    setShowVideoConfirmation(true);
                  }}
                  disabled={genVideoLoading || !hasAnyPhotos}
                  title={hasAnyPhotos ? "Create a video from all tour photos" : "Add photos to enable video"}
                >
                  {genVideoLoading ? (
                    <span className="tg-inlinecenter-6">
                      <RefreshCw size={16} className="tg-spin" /> Generating…
                    </span>
                  ) : (
                    <span className="tg-inlinecenter-6">
                      <Video size={16} /> Generate Video
                    </span>
                  )}
                </button>

                
              </div>
            </div>

            {/* Filter bar with four modes */}
            <div className="filter-bar tg-filter-bar">
              <button
                type="button"
                className={`btn ${dayMode === 'all' ? 'success' : ''}`}
                onClick={() => setDayMode('all')}
                title="Show all days"
              >
                <span className="tg-inlinecenter-6"><List size={16} /> All Days</span>
              </button>
              <button
                type="button"
                className={`btn ${dayMode === 'selected' ? 'success' : ''}`}
                onClick={() => setDayMode('selected')}
                title="Show only selected days"
              >
                <span className="tg-inlinecenter-6"><CheckSquare size={16} /> Selected Days</span>
              </button>
              <button
                type="button"
                className={`btn ${dayMode === 'blog' ? 'success' : ''}`}
                onClick={() => setDayMode('blog')}
                title="Show blog"
              >
                <span className="tg-inlinecenter-6"><BookOpen size={16} /> Blog</span>
              </button>
              <button
                type="button"
                className={`btn ${dayMode === 'vlog' ? 'success' : ''}`}
                onClick={() => setDayMode('vlog')}
                title="Show video only"
              >
                <span className="tg-inlinecenter-6"><Video size={16} /> Vlog</span>
              </button>
              <button
                type="button"
                className={`btn`}
                onClick={handleBack}
              >
                <span className="tg-inlinecenter-6"> ← Back to Profile</span>
              </button>
              {dayMode === 'selected' && (
                <span className="muted tg-ml-4">Choose day to display activities .</span>
              )}
            </div>

            {/* Day selector (only when "Selected Days") */}
            {dayMode === 'selected' && (
              <div className="day-selector tg-day-selector">
                {(selectedTour.days || []).map((d, i) => (
                  <label key={d.id} className="chip tg-chip-toggle" title={`Toggle Day ${i + 1}`}>
                    <input
                      type="checkbox"
                      checked={selectedDays.has(d.id)}
                      onChange={() => toggleDay(d.id)}
                    />
                    Day {i + 1}
                    <span className="pill">{new Date(d.date).toLocaleDateString()}</span>
                  </label>
                ))}
              </div>
            )}


            {showVideoConfirmation && (
              <ModalPortal>
                <div className="fixed inset-0 z-[1000] bg-black/40">
                  <div
                    role="dialog"
                    aria-modal="true"
                    className="plan-card tg-dialog-narrow max-h-[80vh] overflow-auto"
                    style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="preview-header tg-tight">
                      <h3 className="tg-h3-icons">Generate Video?</h3>
                    </div>
                    <div className="muted" style={{ marginBottom: 16 }}>
                      Generating a video will deduct 10 tokens from your balance. Proceed?
                    </div>
                    <div className="tg-flex-gap8" style={{ justifyContent: 'flex-end' }}>
                      <button type="button" className="btn" onClick={() => setShowVideoConfirmation(false)}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn success"
                        onClick={() => {
                          generateVideo(videoConfirmationTourId);  // Trigger the video generation
                          setShowVideoConfirmation(false);  // Close the confirmation modal
                        }}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              </ModalPortal>
            )}


            {/* ACTIVITIES PAGE (All/Selected) */}
            {(dayMode === 'all' || dayMode === 'selected') && (
              <div className="days">
                {(daysToRender || []).length ? (
                  daysToRender.map((day) => (
                    <div key={day.id} className="day-card">
                      <div className="day-head">
                        <h4>
                          <span className="day-number">
                            {(selectedTour.days || []).findIndex(d => d.id === day.id) + 1}
                          </span>
                          Day {(selectedTour.days || []).findIndex(d => d.id === day.id) + 1} - {new Date(day.date).toLocaleDateString()}
                        </h4>
                        <div className="chip">
                          {day.activities?.filter((a) => a.status === 'done').length || 0} / {day.activities?.length || 0} completed
                        </div>
                      </div>

                      <div className="day-content">
                        <div className="activities">
                          <h4 className="section-title">Activities</h4>
                          {day.activities && day.activities.length > 0 ? (
                            <ul>
                              {day.activities.map((activity) => (
                                <li key={activity.id}>
                                  <strong>{activity.description}</strong>
                                  <div className="tg-activity-actions">
                                    {activity.status === 'done' ? (
                                      <>
                                        <CheckCircle size={18} />
                                        <span className="pill">done</span>
                                      </>
                                    ) : (
                                      <>
                                        <Clock size={18} />
                                        <span className="pill">pending</span>
                                        <button
                                          type="button"
                                          className="btn success"
                                          onClick={() => setConfirmDlg({ open: true, tourId: selectedTour.id, dayId: day.id, activityId: activity.id })}
                                          title="Mark this activity as done"
                                        >
                                          <span className="tg-inlinecenter-6">
                                            <CheckCircle size={16} /> Mark done
                                          </span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="muted">No activities yet for this day.</p>
                          )}

                          <AddActivityRow onAdd={(desc) => addActivity(selectedTour.id, day.id, desc)} />
                        </div>

                        {day.photos && (
                          <div className="photos">
                            {day.photos.length > 0 && (
                              <div className="photos-grid">
                                {day.photos.map((photo) => (
                                  <img key={photo.id} src={photo.link} alt="Tour moment" />
                                ))}
                              </div>
                            )}
                            <AddPhotoRow onUpload={(file) => uploadPhotoFile(selectedTour.id, day.id, file)} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="muted tg-pv-8">
                    {dayMode === 'selected' ? 'No days selected. Use the checkboxes above.' : 'No days to show.'}
                  </div>
                )}
              </div>
            )}

            {/* BLOG PAGE */}
            {dayMode === 'blog' && (
              <div className="tg-mt-16">
                <h4 className="section-title tg-inlinecenter-8">
                  <BookOpen size={18} /> Blog
                </h4>

                {hasBlog ? (
                  <div className="kv" style={{ whiteSpace: 'pre-wrap' }}>
                    <div className="k">Memory</div>
                    <div className="v">{selectedTour.blog}</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                    <button
                      type="button"
                      className={`btn success ${blogLoading ? 'tg-disabled' : ''}`}
                      onClick={onCreateBlog}
                      disabled={blogLoading}
                      title={blogLoading ? 'Creating Blog…' : 'Create Blog'}
                    >
                      <span className="tg-inlinecenter-6">
                        {blogLoading ? (
                          <>
                            <RefreshCw size={16} className="tg-spin" /> Creating Blog…
                          </>
                        ) : (
                          <>Create Blog</>
                        )}
                      </span>
                    </button>
                  </div>
                )}

                {/* Confirm 5-token deduction */}
                {showConfirmation && (
                  <ModalPortal>
                    <div className="fixed inset-0 z-[1000] bg-black/40">
                      <div
                        role="dialog"
                        aria-modal="true"
                        className="plan-card tg-dialog-narrow max-h-[80vh] overflow-auto"
                        style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                      >
                        <div className="preview-header tg-tight">
                          <h3 className="tg-h3-icons">Deduct 5 tokens?</h3>
                        </div>
                        <div className="muted" style={{ marginBottom: 16 }}>
                          Generating a blog will deduct <strong>5</strong> tokens from your balance. Proceed?
                        </div>
                        <div className="tg-flex-gap8" style={{ justifyContent: 'flex-end' }}>
                          <button type="button" className="btn" onClick={handleCancel}>Cancel</button>
                          <button type="button" className="btn success" onClick={handleConfirm}>
                            Confirm
                          </button>
                        </div>
                      </div>
                    </div>
                  </ModalPortal>
                )}

                {/* Fancy alert (insufficient tokens / errors) */}
                {showAlert && (
                  <ModalPortal>
                    <div className="fixed inset-0 z-[1000] bg-black/40">
                      <div
                        role="alertdialog"
                        aria-modal="true"
                        className="plan-card tg-dialog-narrow max-h-[80vh] overflow-auto"
                        style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                      >
                        <div className="preview-header tg-tight">
                          <h3 className="tg-h3-icons">Notice</h3>
                        </div>
                        <div className="muted" style={{ marginBottom: 16 }}>{alertMessage}</div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                          <button type="button" className="btn success" onClick={handleCloseAlert}>OK</button>
                        </div>
                      </div>
                    </div>
                  </ModalPortal>
                )}
              </div>
            )}

            {/* VLOG PAGE (video only) */}
            {dayMode === 'vlog' && (
              <div className="video-section tg-video">
                <h4 className="section-title tg-inlinecenter-8">
                  <Video size={18} /> Trip Vlog
                </h4>
                <div className="tg-video-frame">
                  {selectedTour?.video ? (
                    <video className="tg-video-iframe" src={selectedTour.video} controls playsInline preload="metadata" />
                  ) : (
                    <iframe
                      src="https://www.youtube.com/embed/Scxs7L0vhZ4"
                      title="Trip Vlog"
                      className="tg-video-iframe"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  )}
                </div>
                {genVideoError && <p className="muted text-error" style={{ marginTop: 8 }}>{genVideoError}</p>}
              </div>
            )}

            {showVideoTokenAlert && (
              <ModalPortal>
                <div className="fixed inset-0 z-[1000] bg-black/40">
                  <div
                    role="alertdialog"
                    aria-modal="true"
                    className="plan-card tg-dialog-narrow max-h-[80vh] overflow-auto"
                    style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="preview-header tg-tight">
                      <h3 className="tg-h3-icons">Insufficient Tokens</h3>
                    </div>
                    <div className="muted" style={{ marginBottom: 16 }}>
                      {videoTokenAlertMessage}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button type="button" className="btn success" onClick={() => setShowVideoTokenAlert(false)}>
                        OK
                      </button>
                    </div>
                  </div>
                </div>
              </ModalPortal>
            )}

            {/* Facebook Share Modal */}
            {showFacebookModal && (
              <ModalPortal>
                <div className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center p-4">
                  <div className="relative max-h-[90vh] max-w-[90vw] overflow-auto">
                    <FacebookShareModal
                      isOpen={showFacebookModal}
                      onClose={() => setShowFacebookModal(false)}
                      tourData={{
                        title: selectedTour.title,
                        content: selectedTour.blog,
                        destination: selectedTour.destination,
                        startDate: selectedTour.startDate,
                        endDate: selectedTour.endDate,
                        budget: selectedTour.budget,
                        thumbnail: selectedTour.thumbnail,
                      }}
                    />
                  </div>
                </div>
              </ModalPortal>
            )}


            {/* Edit Title Modal */}
            {typeof editOpen !== 'undefined' && editOpen && (
              <EditTitleModal
                open={editOpen}
                titleValue={newTitle}
                onChangeTitle={setNewTitle}
                onCancel={() => setEditOpen(false)}
                onSave={saveTitle}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div>{currentView === 'profile' ? <ProfilePage /> : <TourDetailsPage />}</div>
      {confirmDlg.open && (
        <ConfirmModal
          title="Complete activity?"
          message="Mark this activity as done? This action can't be undone."
          onCancel={() => setConfirmDlg((p) => ({ ...p, open: false }))}
          onConfirm={async () => {
            await markActivityDone(confirmDlg.tourId, confirmDlg.dayId, confirmDlg.activityId);
            setConfirmDlg((p) => ({ ...p, open: false }));
          }}
        />
      )}
    </>
  );
};

const ConfirmModal = React.memo(function ConfirmModal({ title, message, onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel, onConfirm]);

  // lock body scroll while open
  useBodyScrollLock(true);

  return (
    <ModalPortal>
      {/* Full-viewport overlay */}
      <div className="fixed inset-0 z-[1000] bg-black/40">
        {/* Centered dialog */}
        <div
          role="dialog"
          aria-modal="true"
          className="plan-card tg-dialog-narrow max-h-[80vh] overflow-auto"
          style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <div className="preview-header tg-tight">
            <div>
              <h3 className="tg-h3-icons">
                <CheckCircle size={20} /> {title}
              </h3>
            </div>
          </div>
          <div className="muted" style={{ marginBottom: 16 }}>{message}</div>
          <div className="tg-flex-gap8" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onCancel}>Cancel</button>
            <button type="button" className="btn success" onClick={onConfirm}>
              <span className="tg-inlinecenter-6">
                <CheckCircle size={16} /> Mark done
              </span>
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
});

const EditTitleModal = React.memo(function EditTitleModal({ open, titleValue, onChangeTitle, onCancel, onSave }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onSave();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel, onSave]);

  if (!open) return null;

  // lock body scroll while open
  useBodyScrollLock(true);

  return (
    <ModalPortal>
      {/* Full-viewport overlay */}
      <div className="fixed inset-0 z-[1000] bg-black/40">
        {/* Centered dialog */}
        <div
          role="dialog"
          aria-modal="true"
          className="plan-card tg-dialog-narrow max-h-[80vh] overflow-auto"
          style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <div className="preview-header tg-tight">
            <div><h3 className="tg-h3-icons">Edit Tour Title</h3></div>
          </div>
          <div className="tg-flex-gap8" style={{ marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Enter tour title"
              value={titleValue}
              onChange={(e) => onChangeTitle(e.target.value)}
              className="tg-input"
            />
          </div>
          <div className="tg-flex-gap8" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onCancel}>Cancel</button>
            <button type="button" className="btn success" onClick={onSave}>Save</button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
});

const AddActivityRow = React.memo(function AddActivityRow({ onAdd }) {
  const [value, setValue] = useState('');
  const submit = () => { onAdd(value); setValue(''); };
  const onKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } };
  return (
    <div className="add-activity tg-row tg-mt-12">
      <input
        type="text"
        placeholder="Enter a new activity..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        className="tg-input"
      />
      <button type="button" className="btn success" onClick={submit} title="Add Activity">
        <span className="tg-inlinecenter-6"><Plus size={16} /> Add Activity</span>
      </button>
    </div>
  );
});

const AddPhotoRow = React.memo(function AddPhotoRow({ onUpload }) {
  const [fileName, setFileName] = useState('');
  const [fileObj, setFileObj] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Modal states
  const [showPhotoUploadConfirmation, setShowPhotoUploadConfirmation] = useState(false);
  const [showPhotoUploadAlert, setShowPhotoUploadAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const inputRef = React.useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const resetSelection = () => {
    setFileObj(null);
    setFileName('');
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  // Check token balance
  const checkTokenBalance = async () => {
    try {
      const res = await fetch(`${API_BASE}/token/balance`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch token balance');
      }

      const data = await res.json();
      return data.tokens || 0;
    } catch (error) {
      console.error('Error checking token balance:', error);
      return 0;
    }
  };

  const submitFile = async () => {
    if (!fileObj || uploading) return alert('Choose a file');

    // Check token balance first
    const tokenBalance = await checkTokenBalance();

    if (tokenBalance < 1) {
      setAlertMessage('Insufficient tokens. You need at least 1 token to upload a photo.');
      setShowPhotoUploadAlert(true);
      return;
    }

    // Show confirmation modal
    setShowPhotoUploadConfirmation(true);
  };

  const handleConfirm = async () => {
    setShowPhotoUploadConfirmation(false);

    try {
      setUploading(true);
      await onUpload(fileObj);
      resetSelection();
    } catch (e) {
      console.error('upload error:', e);
      // Show error in alert modal
      setAlertMessage(e?.message || 'Failed to upload photo');
      setShowPhotoUploadAlert(true);
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setShowPhotoUploadConfirmation(false);
  };

  const handleCloseAlert = () => {
    setShowPhotoUploadAlert(false);
    setAlertMessage('');
  };

  return (
    <>
      <div className="add-activity tg-row tg-mt-12" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        {/* 🔹 Buttons Row */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Choose file */}
          <label className={`btn tg-pointer ${uploading ? 'tg-disabled' : ''}`}>
            <span className="tg-inlinecenter-6">
              <Image size={16} /> {fileName || 'Choose image'}
            </span>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFileObj(f);
                  setFileName(f.name);
                  setPreviewUrl(URL.createObjectURL(f));
                } else {
                  resetSelection();
                }
              }}
            />
          </label>

          {/* Upload button */}
          <div style={{ display: 'flex' }} >
            <button
              type="button"
              className="btn success cancel-btn"
              onClick={submitFile}
              style={{ width: 160 }}
              disabled={uploading || !fileObj}
            >
              {uploading ? (
                <span className="tg-inlinecenter-6">
                  <RefreshCw size={16} className="tg-spin" /> Uploading…
                </span>
              ) : (
                <span className="tg-inlinecenter-6">
                  <Image size={16} /> Upload
                </span>
              )}
            </button>

            {/* Cancel button (only when file selected) */}
            {fileObj && !uploading && (
              <button
                type="button"
                className="btn success cancel-btn"
                onClick={resetSelection}
                style={{ width: 120, marginLeft: '12px' }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* 🔹 Preview below */}
        {previewUrl && (
          <div style={{ marginTop: '12px' }}>
            <img
              src={previewUrl}
              alt="Preview"
              style={{
                maxHeight: '120px',
                borderRadius: '8px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
            />
          </div>
        )}
      </div>

      {/* Photo Upload Confirmation Modal */}
      {showPhotoUploadConfirmation && (
        <ModalPortal>
          <div className="fixed inset-0 z-[1000] bg-black/40">
            <div
              role="dialog"
              aria-modal="true"
              className="plan-card tg-dialog-narrow max-h-[80vh] overflow-auto"
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            >
              <div className="preview-header tg-tight">
                <h3 className="tg-h3-icons">Deduct 1 token?</h3>
              </div>
              <div className="muted" style={{ marginBottom: 16 }}>
                Uploading a photo will deduct <strong>1</strong> token from your balance. Proceed?
              </div>
              <div className="tg-flex-gap8" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={handleCancel}>Cancel</button>
                <button type="button" className="btn success" onClick={handleConfirm}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Photo Upload Alert Modal */}
      {showPhotoUploadAlert && (
        <ModalPortal>
          <div className="fixed inset-0 z-[1000] bg-black/40">
            <div
              role="alertdialog"
              aria-modal="true"
              className="plan-card tg-dialog-narrow max-h-[80vh] overflow-auto"
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            >
              <div className="preview-header tg-tight">
                <h3 className="tg-h3-icons">Notice</h3>
              </div>
              <div className="muted" style={{ marginBottom: 16 }}>{alertMessage}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn success" onClick={handleCloseAlert}>OK</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
});


export default TourGuideApp;