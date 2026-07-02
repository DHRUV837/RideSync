import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { rideService } from '../../services/apiService';

const geocodeLocation = async (address) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`
  );

  const data = await response.json();

  if (!data.length) {
    throw new Error(`Location not found: ${address}`);
  }

  return {
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon),
    address: data[0].display_name,
  };
};

export default function CreateRide({ onNavigate }) {
  const { addNotification } = useApp();
  const today = new Date();
  const defaultDate = today.toISOString().split('T')[0];
  const defaultTime = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

  const [form, setForm] = useState({
    origin: '', destination: '',
    date: defaultDate, time: defaultTime, seats: 3, price: '',
    notes: ''
  });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
const handleCreate = async () => {
  setLoading(true);

  try {
    const start = await geocodeLocation(form.origin);
    const end = await geocodeLocation(form.destination);
    console.log("Start:", start);
console.log("End:", end);
console.log({
  startLatitude: start.latitude,
  startLongitude: start.longitude,
  endLatitude: end.latitude,
  endLongitude: end.longitude,
});
    await rideService.createRide({
      startLatitude: start.latitude,
      startLongitude: start.longitude,
      startAddress: start.address,

      endLatitude: end.latitude,
      endLongitude: end.longitude,
      endAddress: end.address,

      availableSeats: Number(form.seats),
      estimatedFare: Number(form.price),
      departureTime: `${form.date}T${form.time}:00`,
    });

    addNotification({
      title: "Ride Created! 🚗",
      message: "Your ride is now live.",
      type: "success",
    });

    onNavigate("dashboard");

  } catch (error) {
    console.error(error);

    addNotification({
      title: "Ride creation failed",
      message: error.message,
      type: "error",
    });

  } finally {
    setLoading(false);
  }
};

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Create a Ride ➕</h1>
          <p>Set up your route and let AI find matching passengers</p>
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Steps */}
        <div className="steps" style={{ marginBottom: 32 }}>
          {[
            { n: 1, label: 'Route Details' },
            { n: 2, label: 'Review & Publish' },
          ].map((s, i, arr) => (
            <>
              <div key={s.n} className={`step ${step === s.n ? 'active' : step > s.n ? 'done' : ''}`}>
                <div className="step-circle">{step > s.n ? '✓' : s.n}</div>
                <span className="step-label">{s.label}</span>
              </div>
              {i < arr.length - 1 && <div className="step-connector" key={`c-${i}`} />}
            </>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="card animate-fadeInUp">
            <h3 style={{ marginBottom: 24 }}>Route & Schedule</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="input-group">
                  <label className="input-label">From (Origin)</label>
                  <div className="input-with-icon">
                    <span className="input-icon">📍</span>
                    <input id="origin" className="input-field" value={form.origin}
                      onChange={e => setForm(f => ({ ...f, origin: e.target.value }))} placeholder="Enter your start location" />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">To (Destination)</label>
                  <div className="input-with-icon">
                    <span className="input-icon">🎯</span>
                    <input id="destination" className="input-field" value={form.destination}
                      onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} placeholder="Enter your destination" />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="input-group">
                  <label className="input-label">Date</label>
                  <input id="ride-date" className="input-field" type="date" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Departure Time</label>
                  <input id="ride-time" className="input-field" type="time" value={form.time}
                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="input-group">
                  <label className="input-label">Available Seats</label>
                  <select id="ride-seats" className="input-field" value={form.seats}
                    onChange={e => setForm(f => ({ ...f, seats: Number(e.target.value) }))}>
                    {[1,2,3,4].map(n => <option key={n} value={n}>{n} seat{n>1?'s':''}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Price per Seat (₹)</label>
                  <div className="input-with-icon">
                    <span className="input-icon">₹</span>
                    <input id="ride-price" className="input-field" type="number" value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Notes (optional)</label>
                <textarea id="ride-notes" className="input-field" rows={2}
                  placeholder="e.g. AC car, no smoking, luggage allowed..."
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ resize: 'none' }} />
              </div>

              <button id="next-step-1" className="btn btn-primary btn-full" onClick={() => setStep(2)}>
                Next: Review & Publish →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="card animate-fadeInUp">
            <h3 style={{ marginBottom: 24 }}>Review & Publish</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Route', value: `${form.origin} → ${form.destination}` },
                { label: 'Date & Time', value: `${form.date} at ${form.time}` },
                { label: 'Seats Available', value: `${form.seats} seats` },
                { label: 'Price per Seat', value: `₹${form.price}` },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--glass-border)' }}>
                  <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(0,212,170,0.07)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 24 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Expected Earnings</div>
              <div style={{ display: 'flex', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Min (1 passenger)</div>
                  <div style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: 18 }}>₹{form.price}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Max (full)</div>
                  <div style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: 18 }}>₹{form.price * form.seats}</div>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(124,106,245,0.08)', border: '1px solid rgba(124,106,245,0.2)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 24 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>🤖 AI Route Optimization</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Once you accept passenger requests, OR-Tools will automatically optimize the pickup sequence to minimize total distance and time.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button id="publish-ride" className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreate} disabled={loading}>
                {loading
                  ? <svg style={{ animation: 'spin 1s linear infinite', width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity=".3" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                  : '🚀 Publish Ride'
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
