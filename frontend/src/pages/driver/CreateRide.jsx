import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { rideService } from '../../services/apiService';

const geocodeLocation = async (address) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&limit=10&q=${encodeURIComponent(address)}`
  );

  const data = await response.json();

  if (!data.length) {
    throw new Error(`Location not found: ${address}`);
  }

  // Select best result by priority: city > town > municipality > suburb > village > fallback
  const result =
    data.find(r => r.type === "city") ??
    data.find(r => r.type === "town") ??
    data.find(r => r.type === "municipality") ??
    data.find(r => r.type === "suburb") ??
    data.find(r => r.type === "village") ??
    data[0];

  console.log("Selected geocoding result:", result);

  return {
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon),
    address: result.display_name,
  };
};

const emptyStop = (order) => ({
  stopName: '',
  location: '',
  latitude: null,
  longitude: null,
  address: '',
  stopOrder: order,
  fareFromOrigin: '',
});

export default function CreateRide({ onNavigate }) {
  const { addNotification } = useApp();
  const today = new Date();
  const defaultDate = today.toISOString().split('T')[0];
  const defaultTime = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

  const [form, setForm] = useState({
    origin: '',
    destination: '',
    date: defaultDate,
    time: defaultTime,
    seats: 3,
    price: '',
    notes: '',
  });
  const [stops, setStops] = useState([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const resequenceStops = (items) =>
    items.map((stop, index) => ({ ...stop, stopOrder: index + 1 }));

  const addStop = () => {
    setStops((prev) => resequenceStops([...prev, emptyStop(prev.length + 1)]));
  };

  const removeStop = (index) => {
    setStops((prev) => resequenceStops(prev.filter((_, i) => i !== index)));
  };

  const updateStop = (index, field, value) => {
    setStops((prev) =>
      prev.map((stop, i) => (i === index ? { ...stop, [field]: value } : stop))
    );
  };

  const moveStop = (index, direction) => {
    setStops((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return resequenceStops(next);
    });
  };

  const validateStep1 = () => {
    if (!form.origin.trim() || !form.destination.trim()) {
      addNotification({
        title: 'Missing route',
        message: 'Please enter both origin and destination.',
        type: 'error',
      });
      return false;
    }
    if (!form.price || Number(form.price) <= 0) {
      addNotification({
        title: 'Invalid base fare',
        message: 'Enter the fare from origin to destination.',
        type: 'error',
      });
      return false;
    }
    return true;
  };

  const validateStops = () => {
    const baseFare = Number(form.price);
    let previousFare = 0;

    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      if (!stop.stopName.trim()) {
        addNotification({
          title: 'Stop name required',
          message: `Enter a name for stop ${i + 1}.`,
          type: 'error',
        });
        return false;
      }
      if (!stop.location.trim()) {
        addNotification({
          title: 'Stop location required',
          message: `Enter a location for ${stop.stopName || `stop ${i + 1}`}.`,
          type: 'error',
        });
        return false;
      }
      const fare = Number(stop.fareFromOrigin);
      if (!fare || fare <= 0) {
        addNotification({
          title: 'Invalid stop fare',
          message: `Enter fare from origin for ${stop.stopName}.`,
          type: 'error',
        });
        return false;
      }
      if (fare >= baseFare) {
        addNotification({
          title: 'Fare too high',
          message: `${stop.stopName} fare must be less than the destination base fare (₹${baseFare}).`,
          type: 'error',
        });
        return false;
      }
      if (fare <= previousFare) {
        addNotification({
          title: 'Fares must increase',
          message: 'Each stop fare from origin must be greater than the previous stop.',
          type: 'error',
        });
        return false;
      }
      previousFare = fare;
    }
    return true;
  };

  const geocodeStops = async () => {
    const geocoded = [];
    for (const stop of stops) {
      const coords = await geocodeLocation(stop.location);
      geocoded.push({
        stopName: stop.stopName.trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
        address: coords.address,
        stopOrder: stop.stopOrder,
        fareFromOrigin: Number(stop.fareFromOrigin),
      });
    }
    return geocoded;
  };

  const handleCreate = async () => {
    setLoading(true);

    try {
      const start = await geocodeLocation(form.origin);
      const end = await geocodeLocation(form.destination);
      const geocodedStops = stops.length > 0 ? await geocodeStops() : [];

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
        stops: geocodedStops,
      });

      addNotification({
        title: 'Ride Created! 🚗',
        message: geocodedStops.length
          ? `Your ride with ${geocodedStops.length} intermediate stop(s) is now live.`
          : 'Your ride is now live.',
        type: 'success',
      });

      onNavigate('dashboard');
    } catch (error) {
      console.error(error);
      addNotification({
        title: 'Ride creation failed',
        message: error.response?.data?.error || error.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const routePreview = [
    form.origin || 'Origin',
    ...stops.map((s) => s.stopName || 'Stop'),
    form.destination || 'Destination',
  ].join(' → ');

  const stepLabels = [
    { n: 1, label: 'Route Details' },
    { n: 2, label: 'Intermediate Stops' },
    { n: 3, label: 'Review & Publish' },
  ];

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Create a Ride ➕</h1>
          <p>Define your route, stops, and fares from origin</p>
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: 760, margin: '0 auto' }}>
        <div className="steps" style={{ marginBottom: 32 }}>
          {stepLabels.map((s, i, arr) => (
            <div key={s.n} style={{ display: 'contents' }}>
              <div className={`step ${step === s.n ? 'active' : step > s.n ? 'done' : ''}`}>
                <div className="step-circle">{step > s.n ? '✓' : s.n}</div>
                <span className="step-label">{s.label}</span>
              </div>
              {i < arr.length - 1 && <div className="step-connector" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="card animate-fadeInUp">
            <h3 style={{ marginBottom: 24 }}>Route & Schedule</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="input-group">
                  <label className="input-label">From (Origin)</label>
                  <div className="input-with-icon">
                    <span className="input-icon">📍</span>
                    <input
                      className="input-field"
                      value={form.origin}
                      onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
                      placeholder="e.g. Petlad"
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">To (Destination)</label>
                  <div className="input-with-icon">
                    <span className="input-icon">🎯</span>
                    <input
                      className="input-field"
                      value={form.destination}
                      onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                      placeholder="e.g. Ahmedabad"
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="input-group">
                  <label className="input-label">Date</label>
                  <input
                    className="input-field"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Departure Time</label>
                  <input
                    className="input-field"
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="input-group">
                  <label className="input-label">Available Seats</label>
                  <select
                    className="input-field"
                    value={form.seats}
                    onChange={(e) => setForm((f) => ({ ...f, seats: Number(e.target.value) }))}
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n} seat{n > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Base Fare — Origin → Destination (₹)</label>
                  <div className="input-with-icon">
                    <span className="input-icon">₹</span>
                    <input
                      className="input-field"
                      type="number"
                      min="1"
                      value={form.price}
                      onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                      placeholder="e.g. 140"
                    />
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Notes (optional)</label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="e.g. AC car, no smoking, luggage allowed..."
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  style={{ resize: 'none' }}
                />
              </div>

              <button
                className="btn btn-primary btn-full"
                onClick={() => validateStep1() && setStep(2)}
              >
                Next: Add Stops →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card animate-fadeInUp">
            <h3 style={{ marginBottom: 8 }}>Intermediate Stops</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
              Add cities along your route. Each stop stores the fare from your origin ({form.origin || 'origin'}).
              Example: Nadiad = ₹40, Anand = ₹70 when destination is ₹{form.price || '—'}.
            </p>

            <div
              style={{
                background: 'rgba(0,212,170,0.06)',
                border: '1px solid rgba(0,212,170,0.2)',
                borderRadius: 'var(--radius-md)',
                padding: 14,
                marginBottom: 20,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {routePreview}
            </div>

            {stops.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: 32,
                  color: 'var(--text-muted)',
                  fontSize: 14,
                  marginBottom: 16,
                }}
              >
                No intermediate stops yet. You can skip this step or add stops riders can book between.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
              {stops.map((stop, index) => (
                <div
                  key={`stop-${index}`}
                  style={{
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 13 }}>Stop {stop.stopOrder}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: '4px 8px', fontSize: 12 }}
                        onClick={() => moveStop(index, -1)}
                        disabled={index === 0}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: '4px 8px', fontSize: 12 }}
                        onClick={() => moveStop(index, 1)}
                        disabled={index === stops.length - 1}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: '4px 8px', fontSize: 12, color: 'var(--accent-danger, #f53b6e)' }}
                        onClick={() => removeStop(index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="input-group">
                      <label className="input-label">Stop Name</label>
                      <input
                        className="input-field"
                        value={stop.stopName}
                        onChange={(e) => updateStop(index, 'stopName', e.target.value)}
                        placeholder="e.g. Nadiad"
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Fare from Origin (₹)</label>
                      <input
                        className="input-field"
                        type="number"
                        min="1"
                        value={stop.fareFromOrigin}
                        onChange={(e) => updateStop(index, 'fareFromOrigin', e.target.value)}
                        placeholder="e.g. 40"
                      />
                    </div>
                  </div>
                  <div className="input-group" style={{ marginTop: 12 }}>
                    <label className="input-label">Location (city or address)</label>
                    <input
                      className="input-field"
                      value={stop.location}
                      onChange={(e) => updateStop(index, 'location', e.target.value)}
                      placeholder="e.g. Nadiad, Gujarat"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-full"
              style={{ marginBottom: 20 }}
              onClick={addStop}
            >
              + Add Stop
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  if (stops.length > 0 && !validateStops()) return;
                  setStep(3);
                }}
              >
                Next: Review →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card animate-fadeInUp">
            <h3 style={{ marginBottom: 24 }}>Review & Publish</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Route', value: routePreview },
                { label: 'Date & Time', value: `${form.date} at ${form.time}` },
                { label: 'Seats Available', value: `${form.seats} seats` },
                { label: 'Base Fare (Origin → Destination)', value: `₹${form.price}` },
                { label: 'Intermediate Stops', value: stops.length ? `${stops.length} stop(s)` : 'None' },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingBottom: 16,
                    borderBottom: '1px solid var(--glass-border)',
                  }}
                >
                  <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {stops.length > 0 && (() => {
              // Build the fare ladder for matrix computation
              const baseFare = Number(form.price);
              const ladder = [
                { name: form.origin || 'Origin', fareFromOrigin: 0 },
                ...stops.map((s) => ({ name: s.stopName || 'Stop', fareFromOrigin: Number(s.fareFromOrigin) || 0 })),
                { name: form.destination || 'Destination', fareFromOrigin: baseFare },
              ];

              // Compute all forward segments
              const segments = [];
              for (let i = 0; i < ladder.length; i++) {
                for (let j = i + 1; j < ladder.length; j++) {
                  segments.push({
                    from: ladder[i].name,
                    to: ladder[j].name,
                    fare: ladder[j].fareFromOrigin - ladder[i].fareFromOrigin,
                  });
                }
              }

              return (
                <>
                  {/* Fares from origin */}
                  <div
                    style={{
                      background: 'rgba(79,156,249,0.08)',
                      border: '1px solid rgba(79,156,249,0.2)',
                      borderRadius: 'var(--radius-md)',
                      padding: 16,
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Stop Fares from Origin</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span>{form.origin || 'Origin'}</span>
                        <span>₹0</span>
                      </div>
                      {stops.map((stop) => (
                        <div
                          key={stop.stopOrder}
                          style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}
                        >
                          <span>{stop.stopName}</span>
                          <span>₹{stop.fareFromOrigin}</span>
                        </div>
                      ))}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 13,
                          fontWeight: 700,
                          paddingTop: 8,
                          borderTop: '1px solid rgba(79,156,249,0.2)',
                        }}
                      >
                        <span>{form.destination || 'Destination'}</span>
                        <span>₹{form.price}</span>
                      </div>
                    </div>
                  </div>

                  {/* M3: Dynamic Fare Matrix (Auto-Calculated) */}
                  <div
                    style={{
                      background: 'rgba(0,212,170,0.06)',
                      border: '1px solid rgba(0,212,170,0.2)',
                      borderRadius: 'var(--radius-md)',
                      padding: 16,
                      marginBottom: 24,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                      💰 Dynamic Fare Matrix (Auto-Calculated)
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                      Riders booking between any two stops will see these fares.
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: '6px 16px',
                        fontSize: 13,
                      }}
                    >
                      {segments.map((seg, i) => (
                        <React.Fragment key={i}>
                          <span>
                            {seg.from} → {seg.to}
                          </span>
                          <span style={{ fontWeight: 700, color: 'var(--accent-primary)', textAlign: 'right' }}>
                            ₹{seg.fare}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}

            <div
              style={{
                background: 'rgba(124,106,245,0.08)',
                border: '1px solid rgba(124,106,245,0.2)',
                borderRadius: 'var(--radius-md)',
                padding: 16,
                marginBottom: 24,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>🛣️ Road Route</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                OSRM will compute the driving route through all stops when you publish.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setStep(2)}>
                ← Back
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleCreate}
                disabled={loading}
              >
                {loading ? 'Publishing…' : '🚀 Publish Ride'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
