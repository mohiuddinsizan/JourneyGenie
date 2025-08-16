// File: src/pages/Plan.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import './Plan.css';

const BASE_URL =
  import.meta.env.VITE_BACKEND_URL
    ? import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '')
    : 'http://localhost:8080';

// --- helpers (display-only) ---
const numOrNull = (v) => {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const fmtBdt = (v) => {
  const n = numOrNull(v);
  if (n == null) return null;
  return `৳${Math.round(n).toLocaleString('en-BD')}`;
};

// Weather highlight thresholds (tweak as you like)
const WX_THRESHOLDS = {
  precipProbPct: 60,  // ≥60% chance of rain
  precipMm: 10,       // ≥10 mm rain/day
  windKph: 40,        // ≥40 km/h sustained
  gustKph: 60,        // ≥60 km/h gusts
  uv: 7               // ≥7 high UV
};

// Inline danger style for cells that cross thresholds
const dangerStyle = (bad) =>
  bad
    ? {
        background: '#FF0000',
        color: '#FFFFFF',
        fontWeight: 600,
        borderRadius: 6,
      }
    : {};

// Enhanced Travel Loader Component
const TravelLoader = () => (
  <div className="travel-loader">
    <div className="travel-compass"></div>
    <div className="loader-text">Planning your adventure</div>
  </div>
);

// Or if you want the moving plane on path:
const TravelLoaderPath = () => (
  <div className="travel-loader">
    <div className="travel-path">
      <div className="travel-icon"></div>
    </div>
    <div className="loader-text">Planning your adventure</div>
  </div>
);

// Or simple bouncing dots:
const TravelLoaderDots = () => (
  <div className="travel-loader">
    <div className="travel-dots">
      <div className="travel-dot"></div>
      <div className="travel-dot"></div>
      <div className="travel-dot"></div>
    </div>
    <div className="loader-text">Planning your adventure</div>
  </div>
);

// Use whichever one you like best!

export default function Plan() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    startLocation: '',     // required
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
  const [route, setRoute] = useState(null);
  const [routeErr, setRouteErr] = useState('');
  const [routeLoading, setRouteLoading] = useState(false);

  // Weather state (now fetched from backend)
  const [weather, setWeather] = useState(null);
  const [weatherErr, setWeatherErr] = useState('');
  const [weatherLoading, setWeatherLoading] = useState(false);

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

  // --- NEW: weather fetch via backend controller ---
  const fetchWeather = async (place, startDate, endDate) => {
    try {
      setWeather(null);
      setWeatherErr('');
      setWeatherLoading(true);

      const url = `${BASE_URL}/api/weather?place=${encodeURIComponent(
        place || ''
      )}&start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`;

      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const payload = await res.json();
      setWeather(payload);
      setWeatherErr('');
    } catch (e) {
      console.error('Weather fetch failed:', e);
      setWeather(null);
      setWeatherErr(e?.message || 'Weather unavailable');
    } finally {
      setWeatherLoading(false);
    }
  };

  const fetchRoute = async (startPlace, endPlace, mode = 'driving') => {
    try {
      setRoute(null);
      setRouteErr('');
      setRouteLoading(true);
  
      const url = `${BASE_URL}/api/route?start=${encodeURIComponent(startPlace || '')}&end=${encodeURIComponent(endPlace || '')}&mode=${encodeURIComponent(mode)}`;
      const res = await fetch(url, { method: 'GET', credentials: 'include' });
      if (!res.ok) throw new Error(await res.text());
  
      const data = await res.json();
      setRoute(data);
    } catch (e) {
      console.error('route failed:', e);
      setRoute(null);
      setRouteErr(e?.message || 'Route unavailable');
    } finally {
      setRouteLoading(false);
    }
  };
  
  // Simple WMO weather code mapping (if backend returns numeric code)
  const mapWeatherCode = (c) => {
    switch (c) {
      case 0: return 'Clear';
      case 1: case 2: case 3: return 'Clear/Partly cloudy/Overcast';
      case 45: case 48: return 'Fog';
      case 51: case 53: case 55: return 'Drizzle';
      case 61: case 63: case 65: return 'Rain';
      case 66: case 67: return 'Freezing rain';
      case 71: case 73: case 75: return 'Snow';
      case 77: return 'Snow grains';
      case 80: case 81: case 82: return 'Rain showers';
      case 85: case 86: return 'Snow showers';
      case 95: return 'Thunderstorm';
      case 96: case 99: return 'Thunderstorm w/ hail';
      default: return 'Unknown';
    }
  };

  const handlePreview = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCommitMsg('');
    setPreview(null);
    setWeather(null);
    setWeatherErr('');
  
    // required field guard
    if (!form.startLocation || !form.startLocation.trim()) {
      setLoading(false);
      setError('Please enter your starting location.');
      const el = document.getElementById('startLocationInput');
      if (el) el.focus();
      return;
    }
  
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
  
      // fetch weather right after preview arrives (via backend)
      if (data?.destination && data?.startDate && data?.endDate) {
        fetchWeather(data.destination, data.startDate, data.endDate);
      }
  
      // fetch route here while `data` is in scope
      if (data?.destination && form?.startLocation) {
        fetchRoute(form.startLocation, data.destination, 'driving');
      }
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
    
      const updatedUser = await res.json();
      const { password, ...safeUser } = updatedUser;
      localStorage.setItem('user', JSON.stringify(safeUser));
      window.dispatchEvent(new CustomEvent('tours:updated', { detail: { reason: 'create' } }));
      setCommitMsg('🎉 Tour saved successfully! Your adventure awaits!');
    } catch (err) {
      setError(err.message || 'Failed to save tour');
      console.error('Commit error:', err);
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="plan-page plan-scrollfix">
      {/* Navbar */}
      <nav className="navbar">
        <button onClick={() => navigate('/profile')}>Profile</button>
        <button onClick={() => navigate('/plan')}>Plan</button>
      </nav>

      <div className="plan-card plan-card-fluid">
        <h2>Plan Your Adventure</h2>
        
        <form onSubmit={handlePreview} className="plan-form">
          {/* required field */}
          <input
            id="startLocationInput"
            name="startLocation"
            placeholder="Where are you starting from?"
            value={form.startLocation}
            onChange={onChange}
            required
          />

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

        {/* Enhanced Travel Loader */}
        {loading && <TravelLoader />}

        {/* Preview only when not loading */}
        {!loading && preview && (
          <div className="preview">
            <div className="preview-header">
              <div>
                <h3>
                  {form.startLocation ? `${form.startLocation} → ` : ''}
                  {preview.destination} — {preview.startDate} → {preview.endDate}
                  <span className="badge">{(preview.budget || '').toUpperCase()}</span>
                  {/* Trip total (if backend provides it) */}
                  {fmtBdt(preview.tripTotalBdt ?? preview.trip_total_bdt) && (
                    <span className="badge badge-ml">
                      Total: {fmtBdt(preview.tripTotalBdt ?? preview.trip_total_bdt)}
                    </span>
                  )}
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

            {/* ROUTE MAP */}
            {(routeLoading || route || routeErr) && (
              <div className="section">
                <div className="preview-header preview-header-tight">
                  <div>
                    <h3 className="m-0">
                      Route: {form.startLocation || 'Start'} → {preview?.destination || 'Destination'}
                    </h3>
                    {route && (
                      <p className="muted m-0">
                        {route.profile} • {route.distanceKm} km • {route.durationMin} min
                      </p>
                    )}
                    {routeErr && <p className="muted m-0 text-error">{routeErr}</p>}
                  </div>
                </div>

                {routeLoading && <div className="muted pv-8">Loading route…</div>}

                {!routeLoading && route?.latlngs?.length ? (
                  <div className="map-card">
                    <MapContainer
                      className="map-viewport"
                      // Fit bounds if available, else center on first point
                      bounds={route.bounds ? [
                        [route.bounds[0][0], route.bounds[0][1]],
                        [route.bounds[1][0], route.bounds[1][1]]
                      ] : undefined}
                      center={route.latlngs?.length ? route.latlngs[Math.floor(route.latlngs.length / 2)] : [0,0]}
                      zoom={13}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                      />
                      <Polyline positions={route.latlngs} />
                    </MapContainer>
                  </div>
                ) : (
                  !routeLoading && !routeErr && <div className="muted">No route data.</div>
                )}
              </div>
            )}

            {(weatherLoading || weather || weatherErr) && (
              <div className="section">
                <div className="preview-header preview-header-tight">
                  <div>
                    <h3 className="m-0">
                      Weather in {weather?.place || preview?.destination}
                    </h3>
                    <p className="muted m-0">
                      {preview.startDate} → {preview.endDate}
                      {weather?.note ? ` • ${weather.note}` : ''}
                      {weatherErr ? ` • ${weatherErr}` : ''}
                    </p>
                  </div>
                </div>

                {weatherLoading && <div className="muted pv-8">Loading weather…</div>}

                {!weatherLoading && weather?.days?.length ? (
                  <div className="table-container">
                    <table className="wx-table">
                      <thead>
                        <tr className="thead-pink">
                          <th className="wx-th">Date</th>
                          <th className="wx-th">Cond</th>
                          <th className="wx-th">Temp (°C)</th>
                          <th className="wx-th">Rain&nbsp;Prob</th>
                          <th className="wx-th">Rain (mm)</th>
                          <th className="wx-th">Wind (km/h)</th>
                          <th className="wx-th">Gust (km/h)</th>
                          <th className="wx-th">UV</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weather.days.map((d) => {
                          const cond = d.weather || mapWeatherCode(d.weatherCode);
                          return (
                            <tr key={d.date}>
                              <td className="wx-td">{d.date}</td>
                              <td className="wx-td">{cond}</td>
                              <td className="wx-td">
                                {Math.round(d.tMin)}–{Math.round(d.tMax)}
                              </td>
                              <td className="wx-td" style={dangerStyle(Number(d.precipProb) >= WX_THRESHOLDS.precipProbPct)}>
                                {Math.round(d.precipProb)}%
                              </td>
                              <td className="wx-td" style={dangerStyle(Number(d.precipMm) >= WX_THRESHOLDS.precipMm)}>
                                {Math.round(d.precipMm)}
                              </td>
                              <td className="wx-td" style={dangerStyle(Number(d.windMaxKph) >= WX_THRESHOLDS.windKph)}>
                                {Math.round(d.windMaxKph)}
                              </td>
                              <td className="wx-td" style={dangerStyle(Number(d.gustMaxKph) >= WX_THRESHOLDS.gustKph)}>
                                {Math.round(d.gustMaxKph)}
                              </td>
                              <td className="wx-td" style={dangerStyle(Number(d.uvMax) >= WX_THRESHOLDS.uv)}>
                                {Math.round(d.uvMax)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="muted wx-legend">
                      <span className="wx-swatch" />
                      Highlighted cells show critical weather — be careful out there!
                    </div>
                  </div>
                ) : (
                  !weatherLoading && !weatherErr && <div className="muted">No forecast data.</div>
                )}
              </div>
            )}
            
            <div className="days days--spaced">
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
                      {/* Transportation (with BDT cost if present) */}
                      {day.transportation && (
                        <div className="kv">
                          <span className="k">🚗 Transport</span>
                          <span className="v kv-inline">
                            {day.transportation}
                            {fmtBdt(day.transportationCostBdt ?? day.transportation_cost_bdt) && (
                              <span className="pill">
                                {fmtBdt(day.transportationCostBdt ?? day.transportation_cost_bdt)}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      
                      {/* Hotel (with BDT cost if present) */}
                      {day.hotel && (
                        <div className="kv">
                          <span className="k">🏨 Hotel</span>
                          <span className="v kv-inline">
                            {day.hotel}
                            {fmtBdt(day.hotelCostBdt ?? day.hotel_cost_bdt) && (
                              <span className="pill">
                                {fmtBdt(day.hotelCostBdt ?? day.hotel_cost_bdt)}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      
                      {/* Activities (each with BDT cost if present) */}
                      <div className="activities">
                        <div className="section-title">Activities</div>
                        {Array.isArray(day.activities) && day.activities.length ? (
                          <ul>
                            {day.activities.map((activity, i) => (
                              <li key={i}>
                                <strong>{activity.name}</strong>
                                <div>
                                  {activity.timeOfDay && (
                                    <span className="pill">{activity.timeOfDay}</span>
                                  )}
                                  {/* prefer costBdt; fall back to nothing */}
                                  {fmtBdt(activity.costBdt ?? activity.cost_bdt) && (
                                    <span className="activity-cost">
                                      {fmtBdt(activity.costBdt ?? activity.cost_bdt)}
                                    </span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="muted">No activities suggested.</div>
                        )}
                      </div>

                      {/* Daily total (BDT) */}
                      {fmtBdt(day.dailyTotalBdt ?? day.daily_total_bdt) && (
                        <div style={{ marginTop: 8, textAlign: 'right' }}>
                          <span className="badge">Daily Total: {fmtBdt(day.dailyTotalBdt ?? day.daily_total_bdt)}</span>
                        </div>
                      )}
                      
                      {/* Optional photos preview if provided in AI response */}
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
