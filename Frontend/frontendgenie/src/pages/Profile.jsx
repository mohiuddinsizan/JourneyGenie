// File: src/pages/TourGuideApp.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, Calendar, DollarSign, Users, Star, Clock, CheckCircle, Plus, Image, RefreshCw, List, CheckSquare, Video } from 'lucide-react';
import './Profile.css';
import { useNavigate } from 'react-router-dom';

/**
 * DB-backed version.
 * - Reads full user (with tours/days/activities/photos) from localStorage after login
 * - Optionally can fetch from /user/me if you add that endpoint
 * - Assigns tour thumbnails from 10 local assets: ../assets/tour-thumbnail-1..10.(png/jpg/jpeg/webp)
 *   in a circular way using tour.id (stable) and falls back to index if id is missing
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

// Auto-import thumbnails using Vite's import.meta.glob. Ensure files exist:
// ../assets/tour-thumbnail-1.jpg ... tour-thumbnail-10.jpg (or .png/.jpeg/.webp)
const importedThumbs = import.meta.glob('../assets/tour-thumbnail-*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
});

// Sort by the numeric part so 1..10 are in order regardless of extension
const TOUR_THUMBS = Object.entries(importedThumbs)
  .sort(([a], [b]) => {
    const na = parseInt(a.match(/tour-thumbnail-([0-9]+)/)?.[1] ?? '0', 10);
    const nb = parseInt(b.match(/tour-thumbnail-([0-9]+)/)?.[1] ?? '0', 10);
    return na - nb;
  })
  .map(([, url]) => url);

const getTourThumb = (tour, idx) => {
  if (!TOUR_THUMBS.length) return null; // graceful fallback; card will just have no bg image
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

const TourGuideApp = () => {
  const navigate = useNavigate();

  const [currentView, setCurrentView] = useState('profile');
  const [selectedTour, setSelectedTour] = useState(null);

  const [userData, setUserData] = useState(null); // full user object from backend
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Input state handled in child component to avoid re-render on typing
  const [confirmDlg, setConfirmDlg] = useState({ open: false, tourId: null, dayId: null, activityId: null });

  // ————————————————————————————————————————————————————————————————
  // Data loading strategies
  // ————————————————————————————————————————————————————————————————

  // 1) Load from localStorage (the login response you already have).
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

  // Read user again from localStorage and update state — useful after creating a new tour
  const refreshFromStorage = () => {
    const stored = loadUserFromLocalStorage();
    if (stored) {
      setUserData(stored);
      setTours(normalizeTours(stored.tours));
    }
  };

  // 2) (Optional) Load from API using a cookie-based session/JWT (if you expose /user/me).
  const fetchUserFromApi = async () => {
    const res = await fetch(`${API_BASE}/user/me`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (res.status === 401 || res.status === 403) {
      throw new Error('NOT_AUTHENTICATED');
    }
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
          return;
        }
      } catch (e) {
        if (!cancelled) {
          if ((e && e.message) === 'NOT_AUTHENTICATED') {
            const stored = loadUserFromLocalStorage();
            if (stored) {
              setUserData(stored);
              setTours(normalizeTours(stored.tours));
              setLoading(false);
              return;
            }
            setError('No login found. Please log in.');
          } else {
            setError((e && e.message) || 'Failed to load user');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep UI in sync only when app explicitly signals it (no refresh on typing)
  useEffect(() => {
    const onToursUpdated = () => refreshFromStorage();
    window.addEventListener('tours:updated', onToursUpdated);
    return () => {
      window.removeEventListener('tours:updated', onToursUpdated);
    };
  }, []);

  // ————————————————————————————————————————————————————————————————
  // Navigation handlers
  // ————————————————————————————————————————————————————————————————

  const handleShowDetails = (tour) => {
    setSelectedTour(tour);
    setCurrentView('tourdetails');
  };

  const handleBack = () => {
    setCurrentView('profile');
    setSelectedTour(null);
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handlePlanClick = () => {
    navigate('/plan');
  };

  // ————————————————————————————————————————————————————————————————
  // Activity mutations
  // ————————————————————————————————————————————————————————————————
  const markActivityDone = async (tourId, dayId, activityId) => {
    const url = `${API_BASE}/activity/${activityId}/complete`; // POST now

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

      // Backend returns UPDATED USER
      const updatedUser = await res.json();
      const { password, ...safeUser } = updatedUser || {};

      // Replace app state from source of truth
      setUserData(safeUser);
      setTours(normalizeTours(safeUser.tours || []));

      // Keep the open tour in sync (find by id)
      setSelectedTour(prev => {
        if (!prev) return prev;
        const next = (safeUser.tours || []).find(t => t.id === prev.id);
        return next ? { ...next, thumbnail: getTourThumb(next, 0) } : prev;
      });

      // Persist + notify listeners
      localStorage.setItem('user', JSON.stringify(safeUser));
      window.dispatchEvent(new CustomEvent('tours:updated', { detail: { reason: 'activity-completed', activityId } }));
    } catch (err) {
      console.error('[markActivityDone] fetch failed:', err);
      alert(err?.message || 'Failed to complete activity');
    }
  };

  // Add Activity (no re-render on typing)
// Accept optional textOverride so child input can pass its value without touching parent state.
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
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        description: text, // must match ActivityDTO
        dayid: dayId,      // must match ActivityDTO
      }),
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

// Add Photo (child handles typing; we only run on submit)
const addPhoto = async (tourId, dayId, urlOverride) => {
  const link = (urlOverride ?? '').trim();
  if (!link) {
    alert('Please paste a photo URL.');
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/photo/add`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ link, dayid: dayId }),
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
    window.dispatchEvent(new CustomEvent('tours:updated', { detail: { reason: 'photo-added', dayId } }));
  } catch (e) {
    console.error('[addPhoto] failed:', e);
    alert(e?.message || 'Failed to add photo');
  }
};

// Upload Photo file -> backend (Cloudinary)
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
      body: fd, // do NOT set Content-Type; browser will set multipart boundary
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
    window.dispatchEvent(new CustomEvent('tours:updated', { detail: { reason: 'photo-uploaded', dayId } }));
  } catch (e) {
    console.error('[uploadPhotoFile] failed:', e);
    alert(e?.message || 'Failed to upload photo');
  }
};

// Derived stats
  const totalTours = tours.length;
  const rating = userData?.rating ?? null; // optional
  const joinDate = userData?.joinDate ?? null; // optional

  // Initials for avatar
  const initials = useMemo(() => {
    const name = userData?.name || '';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }, [userData?.name]);

  if (loading) {
    return (
      <div className="plan-page">
        <div className="navbar">
          <button onClick={handleProfileClick}>Profile</button>
          <button onClick={handlePlanClick}>Plan</button>
          <button onClick={refreshFromStorage} title="Refresh from local data">
            <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <RefreshCw size={16} /> Refresh
            </span>
          </button>
        </div>
        <div className="plan-card">
          <p>Loading your profile…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="plan-page">
        <div className="navbar">
          <button onClick={handleProfileClick}>Profile</button>
          <button onClick={handlePlanClick}>Plan</button>
          <button onClick={refreshFromStorage} title="Refresh from local data">
            <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <RefreshCw size={16} /> Refresh
            </span>
          </button>
        </div>
        <div className="plan-card">
          <h2>We couldn't load your account</h2>
          <p className="muted">{error}</p>
          <button className="btn success" onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      </div>
    );
  }

  const ProfilePage = () => (
    <div className="plan-page">
      <div className="navbar">
        <button onClick={handleProfileClick}>Profile</button>
        <button onClick={handlePlanClick}>Plan</button>
        <button onClick={refreshFromStorage} title="Refresh from local data">
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <RefreshCw size={16} /> Refresh
          </span>
        </button>
      </div>

      <div className="plan-card">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar">{initials || '?'}</div>

          <div className="profile-info">
            <h1 className="profile-name">{userData?.name || '—'}</h1>
            <p className="profile-email">{userData?.email || '—'}</p>

            <div className="profile-stats">
              <div className="kv">
                <div className="k">
                  <Users size={16} /> Tours
                </div>
                <div className="v">{totalTours}</div>
              </div>
              <div className="kv">
                <div className="k">
                  <Star size={16} /> Rating
                </div>
                <div className="v">{rating ? `${rating} ⭐` : '—'}</div>
              </div>
              <div className="kv">
                <div className="k">
                  <Calendar size={16} /> Joined
                </div>
                <div className="v">{joinDate ? new Date(joinDate).toLocaleDateString() : '—'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tours Section */}
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
                      <span>
                        {tour.startDate} - {tour.endDate}
                      </span>
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

    // Day filtering controls
    const [dayMode, setDayMode] = useState('all'); // 'all' | 'selected'
    const [selectedDays, setSelectedDays] = useState(new Set()); // store day.id values

    const dayCount = selectedTour.days?.length || 0;

    const daysToRender = useMemo(() => {
      const list = selectedTour.days || [];
      if (dayMode === 'all') return list;
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

    return (
      <div className="plan-page">
        <div className="navbar">
          <button onClick={handleBack}>← Back to Profile</button>
          <button>Edit Tour</button>
          <button>Share</button>
        </div>

        <div className="plan-card">
          {/* Tour Header */}
          <div className="preview">
            <div className="preview-header">
              <div>
                <h3>
                  {(selectedTour.destination || '').toUpperCase()}
                  <span className="badge">{selectedTour.days?.length || 0} days</span>
                </h3>
                <div className="muted">
                  {selectedTour.startDate} to {selectedTour.endDate} • Budget: {selectedTour.budget}
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', margin: '12px 0 8px' }}>
              <button
                type="button"
                className={`btn ${dayMode === 'all' ? 'success' : ''}`}
                onClick={() => setDayMode('all')}
                title="Show all days"
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <List size={16} /> All Days
                </span>
              </button>
              <button
                type="button"
                className={`btn ${dayMode === 'selected' ? 'success' : ''}`}
                onClick={() => setDayMode('selected')}
                title="Show only selected days"
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <CheckSquare size={16} /> Selected Days
                </span>
              </button>
              {dayMode === 'selected' && (
                <span className="muted" style={{ marginLeft: 4 }}>
                  Choose which days to display below
                </span>
              )}
            </div>

            {/* Day selector (only in Selected mode) */}
            {dayMode === 'selected' && (
              <div className="day-selector" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '0 0 12px 0' }}>
                {(selectedTour.days || []).map((d, i) => (
                  <label
                    key={d.id}
                    className="chip"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                    title={`Toggle Day ${i + 1}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDays.has(d.id)}
                      onChange={() => toggleDay(d.id)}
                      style={{ accentColor: '#ec4899' }}
                    />
                    Day {i + 1}
                    <span className="pill">{new Date(d.date).toLocaleDateString()}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Tour Days */}
            <div className="days">
              {daysToRender.length ? (
                daysToRender.map((day, index) => (
                  <div key={day.id} className="day-card">
                    <div className="day-head">
                      <h4>
                        <span className="day-number">{(selectedTour.days || []).findIndex(d => d.id === day.id) + 1}</span>
                        Day {(selectedTour.days || []).findIndex(d => d.id === day.id) + 1} - {new Date(day.date).toLocaleDateString()}
                      </h4>
                      <div className="chip">
                        {day.activities?.filter((a) => a.status === 'done').length || 0} /{' '}
                        {day.activities?.length || 0} completed
                      </div>
                    </div>

                    <div className="day-content">
                      {/* Activities (always render) */}
                      <div className="activities">
                        <h4 className="section-title">Activities</h4>
                        {day.activities && day.activities.length > 0 ? (
                          <ul>
                            {day.activities.map((activity) => (
                              <li key={activity.id}>
                                <strong>{activity.description}</strong>
                                <div className="activity-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
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

                        {/* Add Activity UI */}
                        <AddActivityRow onAdd={(desc) => addActivity(selectedTour.id, day.id, desc)} />
                      </div>

                      {/* Photos */}
                      {day.photos && (
                        <div className="photos">
                          {day.photos.length > 0 && (
                            <div className="photos-grid">
                              {day.photos.map((photo) => (
                                <img key={photo.id} src={photo.link} alt="Tour moment" />
                              ))}
                            </div>
                          )}

                          {/* Add Photo Button */}
                          <AddPhotoRow onUpload={(file) => uploadPhotoFile(selectedTour.id, day.id, file)} />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="muted" style={{ padding: '8px 0' }}>
                  {dayMode === 'selected' ? 'No days selected. Use the checkboxes above.' : 'No days to show.'}
                </div>
              )}
            </div>

            {/* Video Section (dummy for now) */}
            <div className="video-section" style={{ marginTop: 16 }}>
              <h4 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Video size={18} /> Trip Video
              </h4>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  paddingTop: '56.25%', // 16:9
                  borderRadius: 12,
                  overflow: 'hidden',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
                  marginTop: 8,
                }}
              >
                <iframe
                  src="https://www.youtube.com/embed/Scxs7L0vhZ4"
                  title="Trip Video"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
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

// Fancy centered confirm modal (theme-friendly)
const ConfirmModal = React.memo(function ConfirmModal({ title, message, onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel, onConfirm]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div className="plan-card" role="dialog" aria-modal="true" style={{ width: 'min(520px, 100%)' }}>
        <div className="preview-header" style={{ marginBottom: 8 }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <CheckCircle size={20} /> {title}
            </h3>
          </div>
        </div>
        <div className="muted" style={{ marginBottom: 16 }}>{message}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn success" onClick={onConfirm}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={16} /> Mark done
            </span>
          </button>
        </div>
      </div>
    </div>
  );
});

// Child component to prevent parent re-render on every keystroke
const AddActivityRow = React.memo(function AddActivityRow({ onAdd }) {
  const [value, setValue] = useState('');
  const submit = () => {
    onAdd(value);
    setValue('');
  };
  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };
  return (
    <div className="add-activity" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
      <input
        type="text"
        placeholder="Enter a new activity..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        style={{
          flex: 1,
          padding: '10px 12px',
          borderRadius: 10,
          border: '1px solid #e5e7eb',
          outline: 'none',
        }}
      />
      <button
        type="button"
        className="btn success"
        onClick={submit}
        title="Add Activity"
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Add Activity
        </span>
      </button>
    </div>
  );
});

// Child component: Add Photo (UPLOAD ONLY)
const AddPhotoRow = React.memo(function AddPhotoRow({ onUpload }) {
  const [fileName, setFileName] = useState('');
  const [fileObj, setFileObj] = useState(null);
  const inputRef = React.useRef(null);

  const submitFile = () => {
    if (!fileObj) return alert('Choose a file');
    onUpload(fileObj);
    setFileObj(null);
    setFileName('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="add-activity" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
      <label className="btn" style={{ cursor: 'pointer' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Image size={16} /> {fileName || 'Choose image'}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            setFileObj(f || null);
            setFileName(f ? f.name : '');
          }}
        />
      </label>
      <button type="button" className="btn success" onClick={submitFile} title="Upload Photo" style={{ width: 160 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Image size={16} /> Upload
        </span>
      </button>
    </div>
  );
});

export default TourGuideApp;
