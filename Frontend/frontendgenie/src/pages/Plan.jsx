// src/pages/Plan.jsx
import React, { useState } from 'react';
import './Plan.css';

// Determine backend URL; adjust port if needed
const BASE_URL =
  import.meta.env.VITE_BACKEND_URL
    ? import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '')
    : 'http://localhost:8080';

export default function Plan() {
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

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handlePreview = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setCommitMsg(''); setPreview(null);
    try {
      const res = await fetch(`${BASE_URL}/api/plan/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // if logged in, include JWT cookie
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPreview(data);
    } catch (err) {
      setError(err.message || 'Preview failed');
    } finally {
      setLoading(false);
    }
  };

const handleCommit = async () => {
  if (!preview) return;
  setError(''); setCommitMsg('');

  try {
    const res = await fetch(`${BASE_URL}/api/plan/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // send JWT cookie
      body: JSON.stringify({
        destination: form.destination,
        startDate: form.startDate,
        endDate: form.endDate,
        budget: form.budget,
        plan: preview,
      }),
    });

    if (!res.ok) throw new Error(await res.text());
    await res.json();
    setCommitMsg('Tour saved!');
  } catch (err) {
    setError(err.message || 'Failed to save tour');
  }
};


  return (
    <div className="plan-page">
      <div className="plan-card">
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

        {preview && (
          <div className="preview">
            <div className="preview-header">
              <div>
                <h3>
                  {preview.destination} — {preview.startDate} → {preview.endDate}
                  <span className="badge">{(preview.budget || '').toUpperCase()}</span>
                </h3>
                <p className="muted">AI-generated itinerary (not saved yet)</p>
              </div>
              <button className="btn success" onClick={handleCommit}>
                Start Tour
              </button>
            </div>
            <div className="days">
              {preview.days?.length ? (
                preview.days.map((d, idx) => (
                  <div className="day-card" key={idx}>
                    <div className="day-head">
                      <h4>Day {idx + 1} — {d.date}</h4>
                      <span className="chip">{d.title}</span>
                    </div>
                    <div className="kv">
                      <span className="k">Transportation:</span>
                      <span className="v">{d.transportation}</span>
                    </div>
                    <div className="kv">
                      <span className="k">Hotel:</span>
                      <span className="v">{d.hotel || '—'}</span>
                    </div>
                    <div className="activities">
                      <div className="section-title">Activities</div>
                      {d.activities?.length ? (
                        <ul>
                          {d.activities.map((a, i) => (
                            <li key={i}>
                              <strong>{a.name}</strong>
                              {a.timeOfDay ? <span className="pill">{a.timeOfDay}</span> : null}
                              {a.cost ? <span className="muted"> — {a.cost}</span> : null}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="muted">No activities suggested.</div>
                      )}
                    </div>
                    {d.photoLinks?.length ? (
                      <div className="photos">
                        {d.photoLinks.slice(0, 4).map((url, i) => (
                          <img src={url} alt="" key={i} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="muted">No days returned.</div>
              )}
            </div>
            {commitMsg && <div className="success-msg">{commitMsg}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
