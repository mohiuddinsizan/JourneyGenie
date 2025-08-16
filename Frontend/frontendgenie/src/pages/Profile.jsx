// File: src/pages/TourGuideApp.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  MapPin, Calendar, DollarSign, Users, Star, Clock, CheckCircle, Plus, Image,
  RefreshCw, List, CheckSquare, Video, LogOut
} from 'lucide-react';
import './Profile.css';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

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
  const handleBack = () => {
    setCurrentView('profile');
    setSelectedTour(null);
  };
  const handleProfileClick = () => navigate('/profile');
  const handlePlanClick = () => navigate('/plan');
  const handleLogout = async () => {
    try {
      await serverLogout();
    } catch (e) {
      console.warn('Server logout failed (continuing):', e);
    } finally {
      try { localStorage.removeItem('user'); } catch {}
      setUserData(null);
      setTours([]);
      setSelectedTour(null);
      setCurrentView('profile');
      window.dispatchEvent(new CustomEvent('tours:updated', { detail: { reason: 'logout' } }));
      window.location.replace('/');
    }
  };

  // ====== Generate Video action ======
  async function generateVideo(tourId) {
    if (!tourId) return;

    setGenVideoLoading(true);
    setGenVideoError('');

    try {
      const res = await fetch(`${API_BASE}/tour/${tourId}/video/generate`, {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        const t = (await res.text()) || '';
        // Map backend message to friendly UI copy
        if (t.toLowerCase().includes('no photos')) {
          setGenVideoError('You still have no photos for this tour. Add some to generate a video.');
        } else {
          setGenVideoError(t || `HTTP ${res.status}`);
        }
        return;
      }

      // Expect UPDATED USER back
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

      try { localStorage.setItem('user', JSON.stringify(safeUser)); } catch {}
      window.dispatchEvent(new CustomEvent('tours:updated', { detail: { reason: 'video-generated', tourId } }));
    } catch (e) {
      console.error('generateVideo failed:', e);
      setGenVideoError(e?.message || 'Failed to generate video');
      alert(e?.message || 'Failed to generate video');
    } finally {
      setGenVideoLoading(false);
    }
  }
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
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
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
        try { localStorage.setItem('user', JSON.stringify(safeUser)); } catch {}
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
          try { localStorage.setItem('user', JSON.stringify(nextUser)); } catch {}
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
  const joinDate = userData?.joinDate ?? null;

  const initials = useMemo(() => {
    const name = userData?.name || '';
    return name.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase();
  }, [userData?.name]);

  if (loading) {
    return (
      <div className="plan-page">
        <div className="navbar">
          <button onClick={handleProfileClick}>Profile</button>
          <button onClick={handlePlanClick}>Plan</button>
          <button onClick={handleLogout} title="Log out">
            <span className="tg-inlinecenter-6"><LogOut size={16} /> Logout</span>
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
          <button onClick={handleLogout} title="Log out">
            <span className="tg-inlinecenter-6"><LogOut size={16} /> Logout</span>
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
        <button onClick={handleLogout} title="Log out">
          <span className="tg-inlinecenter-6"><LogOut size={16} /> Logout</span>
        </button>
      </div>

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
                <div className="v">{rating ? `${rating} ⭐` : '—'}</div>
              </div>
              <div className="kv">
                <div className="k"><Calendar size={16} /> Joined</div>
                <div className="v">{joinDate ? new Date(joinDate).toLocaleDateString() : '—'}</div>
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

    const [dayMode, setDayMode] = useState('all');
    const [selectedDays, setSelectedDays] = useState(new Set());

    // Title edit modal state
    const [editOpen, setEditOpen] = useState(false);
    const [newTitle, setNewTitle] = useState(selectedTour?.title || '');
    useEffect(() => { setNewTitle(selectedTour?.title || ''); }, [selectedTour?.title]);

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
          try { localStorage.setItem('user', JSON.stringify(safeUser)); } catch {}
        } else {
          setSelectedTour(prev => prev ? { ...prev, title } : prev);
          setTours(prev => (prev || []).map(t => t.id === selectedTour.id ? { ...t, title } : t));
          setUserData(prev => {
            if (!prev) return prev;
            const nextUser = { ...prev, tours: (prev.tours || []).map(t => t.id === selectedTour.id ? { ...t, title } : t) };
            try { localStorage.setItem('user', JSON.stringify(nextUser)); } catch {}
            return nextUser;
          });
        }
        setEditOpen(false);
      } catch (e) {
        console.error('[update title] failed:', e);
        alert(e?.message || 'Failed to update title');
      }
    };

    // has any photos? (used to show hint + disable video gen)
    const hasAnyPhotos = useMemo(() => {
      return !!(selectedTour?.days || []).some(d => (d.photos || []).length > 0);
    }, [selectedTour]);

    return (
      <div className="plan-page">
        <div className="navbar">
          <button onClick={handleBack}>← Back to Profile</button>
          <button onClick={() => setEditOpen(true)}>Edit Tour</button>

          {/* Generate Video */}
          <button
            className="btn success"
            onClick={() => generateVideo(selectedTour.id)}
            disabled={genVideoLoading || !hasAnyPhotos}
            title={hasAnyPhotos ? 'Create a video from all tour photos' : 'Add photos to enable video'}
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

        <div className="plan-card">
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
                {selectedTour.title ? <div className="muted">Title: {selectedTour.title}</div> : null}
              </div>
            </div>

            {!hasAnyPhotos && (
              <div className="muted tg-pv-8">
                You still have no photos for this tour. Add some to generate a video.
              </div>
            )}

            <div className="filter-bar tg-filter-bar">
              <button
                type="button"
                className={`btn ${dayMode === 'all' ? 'success' : ''}`}
                onClick={() => setDayMode('all')}
                title="Show all days"
              >
                <span className="tg-inlinecenter-6">
                  <List size={16} /> All Days
                </span>
              </button>
              <button
                type="button"
                className={`btn ${dayMode === 'selected' ? 'success' : ''}`}
                onClick={() => setDayMode('selected')}
                title="Show only selected days"
              >
                <span className="tg-inlinecenter-6">
                  <CheckSquare size={16} /> Selected Days
                </span>
              </button>
              {dayMode === 'selected' && (
                <span className="muted tg-ml-4">Choose which days to display below</span>
              )}
            </div>

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

            {/* Video section: show Cloudinary video if present, else dummy YouTube */}
            <div className="video-section tg-video">
              <h4 className="section-title tg-inlinecenter-8">
                <Video size={18} /> Trip Video
              </h4>
              <div className="tg-video-frame">
                {selectedTour?.video ? (
                  <video
                    className="tg-video-iframe"
                    src={selectedTour.video}
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <iframe
                    src="https://www.youtube.com/embed/Scxs7L0vhZ4"
                    title="Trip Video"
                    className="tg-video-iframe"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                )}
              </div>
              {genVideoError && <p className="muted text-error" style={{ marginTop: 8 }}>{genVideoError}</p>}
            </div>

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

  return (
    <div className="tg-backdrop">
      <div className="plan-card tg-dialog-narrow" role="dialog" aria-modal="true">
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
  );
});

const EditTitleModal = React.memo(function EditTitleModal({ open, titleValue, onChangeTitle, onCancel, onSave }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onSave();
    };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel, onSave]);

  if (!open) return null;
  return (
    <div className="tg-backdrop">
      <div className="plan-card tg-dialog-narrow" role="dialog" aria-modal="true">
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
  const [uploading, setUploading] = useState(false);
  const inputRef = React.useRef(null);

  const submitFile = async () => {
    if (!fileObj || uploading) return alert('Choose a file');
    try {
      setUploading(true);
      await onUpload(fileObj);   // await to control spinner
      setFileObj(null);
      setFileName('');
      if (inputRef.current) inputRef.current.value = '';
    } catch (e) {
      console.error('upload error:', e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="add-activity tg-row tg-mt-12">
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
            setFileObj(f || null);
            setFileName(f ? f.name : '');
          }}
        />
      </label>

      <button
        type="button"
        className="btn success"
        onClick={submitFile}
        title="Upload Photo"
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
    </div>
  );
});

export default TourGuideApp;
