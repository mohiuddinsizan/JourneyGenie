import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Plan.css';

const BASE_URL =
  import.meta.env.VITE_BACKEND_URL
    ? import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '')
    : 'http://localhost:8080';

export default function Plan() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    budget: 'mid',
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [commitMsg, setCommitMsg] = useState('');
  const [error, setError] = useState('');
  const [committing, setCommitting] = useState(false);

  // Page styling fix on mount
  useEffect(() => {
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    
    const root = document.getElementById('root');
    if (root) {
      root.style.overflow = 'auto';
      root.style.height = 'auto';
      root.style.minHeight = '100vh';
    }
  }, []);

  // Scroll to preview when ready
  useEffect(() => {
    if (preview) {
      const previewElement = document.querySelector('.preview');
      if (previewElement) {
        setTimeout(() => {
          previewElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }, 100);
      }
    }
  }, [preview]);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handlePreview = async (e) => {
    e.preventDefault();
    setLoading(true); 
    setError(''); 
    setCommitMsg(''); 
    setPreview(null);
    
    try {
      const res = await fetch(`${BASE_URL}/api/plan/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Server error: ${res.status}`);
      }
      
      const data = await res.json();
      setPreview(data);
    } catch (err) {
      setError(err.message || 'Preview failed');
      console.error('Preview error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!preview) return;
    
    setError(''); 
    setCommitMsg('');
    setCommitting(true);

    try {
      const res = await fetch(`${BASE_URL}/api/plan/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(preview),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Server error: ${res.status}`);
      }
      
      await res.json();
      setCommitMsg('🎉 Tour saved successfully! Your adventure awaits!');
    } catch (err) {
      setError(err.message || 'Failed to save tour');
      console.error('Commit error:', err);
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div 
      className="plan-page" 
      style={{
        overflow: 'auto',
        height: 'auto',
        minHeight: '100vh',
        maxHeight: 'none'
      }}
    >
      {/* Navbar */}
      <nav className="navbar">
        <button onClick={() => navigate('/profile')}>Profile</button>
        <button onClick={() => navigate('/plan')}>Tour</button>
      </nav>

      <div 
        className="plan-card"
        style={{
          overflow: 'visible',
          height: 'auto',
          maxHeight: 'none'
        }}
      >
        <h2>Plan Your Adventure</h2>
        
        <form onSubmit={handlePreview} className="plan-form">
          <input
            name="destination"
            placeholder="Where do you want to go?"
            value={form.destination}
            onChange={onChange}
            required
          />
          
          <div className="row">
            <div className="col">
              <label>Start date</label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={onChange}
                required
              />
            </div>
            <div className="col">
              <label>End date</label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={onChange}
                required
              />
            </div>
          </div>
          
          <div className="row">
            <div className="col">
              <label>Budget</label>
              <select name="budget" value={form.budget} onChange={onChange}>
                <option value="low">Low</option>
                <option value="mid">Mid</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          
          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? 'Generating…' : 'Generate My Tour Plan'}
          </button>
        </form>

        {error && <div className="error">{error}</div>}
        {commitMsg && <div className="success-msg">{commitMsg}</div>}

        {/* Loader while fetching */}
        {loading && (
          <div className="travel-loader">
            <div className="travel-cloud one"></div>
            <div className="travel-cloud two"></div>
            <div className="travel-mountain small"></div>
            <div className="travel-mountain big"></div>
          </div>
        )}

        {/* Preview only when not loading */}
        {!loading && preview && (
          <div className="preview">
            <div className="preview-header">
              <div>
                <h3>
                  {preview.destination} — {preview.startDate} → {preview.endDate}
                  <span className="badge">{(preview.budget || '').toUpperCase()}</span>
                </h3>
                <p className="muted">AI-generated itinerary (not saved yet)</p>
              </div>
              <button 
                className="btn success" 
                onClick={handleCommit}
                disabled={committing}
              >
                {committing ? 'Starting Tour...' : 'Start Tour'}
              </button>
            </div>
            
            <div className="days">
              {preview.days?.length ? (
                preview.days.map((day, idx) => (
                  <div className="day-card" key={idx}>
                    <div className="day-head">
                      <h4>
                        <span className="day-number">{idx + 1}</span>
                        {day.date}
                      </h4>
                      {day.title && <span className="chip">{day.title}</span>}
                    </div>
                    
                    <div className="day-content">
                      {day.transportation && (
                        <div className="kv">
                          <span className="k">🚗 Transport</span>
                          <span className="v">{day.transportation}</span>
                        </div>
                      )}
                      
                      {day.hotel && (
                        <div className="kv">
                          <span className="k">🏨 Hotel</span>
                          <span className="v">{day.hotel}</span>
                        </div>
                      )}
                      
                      <div className="activities">
                        <div className="section-title">Activities</div>
                        {day.activities?.length ? (
                          <ul>
                            {day.activities.map((activity, i) => (
                              <li key={i}>
                                <strong>{activity.name}</strong>
                                <div>
                                  {activity.timeOfDay && (
                                    <span className="pill">{activity.timeOfDay}</span>
                                  )}
                                  {activity.cost && (
                                    <span className="activity-cost">{activity.cost}</span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="muted">No activities suggested.</div>
                        )}
                      </div>
                      
                      {day.photoLinks?.length && (
                        <div className="photos">
                          <div className="photos-grid">
                            {day.photoLinks.slice(0, 4).map((url, i) => (
                              <img src={url} alt={`Day ${idx + 1} photo ${i + 1}`} key={i} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="muted">No days returned.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
