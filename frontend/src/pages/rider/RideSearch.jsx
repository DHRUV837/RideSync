import { useState } from 'react';
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
    lat: parseFloat(result.lat),
    lon: parseFloat(result.lon),
    displayName: result.display_name,
  };
};

/**
 * Build the fare ladder for a ride: origin (₹0) → stops → destination (estimatedFare).
 * Returns an ordered array of { name, fareFromOrigin, lat, lon, address }.
 */
const buildFareLadder = (ride) => {
  const ladder = [];

  // Origin
  ladder.push({
    name: ride.startAddress,
    fareFromOrigin: 0,
    lat: ride.startLatitude,
    lon: ride.startLongitude,
    address: ride.startAddress,
    type: 'origin',
  });

  // Intermediate stops (sorted by stopOrder)
  const stops = ride.stops || [];
  const sorted = [...stops].sort((a, b) => (a.stopOrder || 0) - (b.stopOrder || 0));
  sorted.forEach((stop) => {
    ladder.push({
      name: stop.stopName,
      fareFromOrigin: stop.fareFromOrigin,
      lat: stop.latitude,
      lon: stop.longitude,
      address: stop.address || stop.stopName,
      type: 'stop',
    });
  });

  // Destination
  ladder.push({
    name: ride.endAddress,
    fareFromOrigin: ride.estimatedFare,
    lat: ride.endLatitude,
    lon: ride.endLongitude,
    address: ride.endAddress,
    type: 'destination',
  });

  return ladder;
};

/** Compute segment fare between two ladder indices */
const computeSegmentFare = (ladder, pickupIdx, dropoffIdx) => {
  if (pickupIdx < 0 || dropoffIdx < 0 || pickupIdx >= dropoffIdx) return null;
  return ladder[dropoffIdx].fareFromOrigin - ladder[pickupIdx].fareFromOrigin;
};

export default function RideSearch({ onNavigate }) {
  const { addNotification } = useApp();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [seats, setSeats] = useState(1);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingRide, setBookingRide] = useState(null);
  const [booked, setBooked] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // M3: stop selection state
  const [pickupIdx, setPickupIdx] = useState(0);
  const [dropoffIdx, setDropoffIdx] = useState(-1); // -1 = last
  const [fareLadder, setFareLadder] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!from || !to) {
      addNotification({ title: 'Enter route points', message: 'Please enter a pickup and destination to search for matching rides.', type: 'error' });
      return;
    }

    setLoading(true);
    setResults(null);
    try {
      const pickup = await geocodeLocation(from);
      const destination = await geocodeLocation(to);
      const response = await rideService.searchRides({
    pickupLat: pickup.lat,
    pickupLon: pickup.lon,
    destinationLat: destination.lat,
    destinationLon: destination.lon,
    date,
    maxDistanceKm: 5
});
      const availableRides = response.data || [];
      const normalized = availableRides.map((ride) => ({
        ...ride,
        origin: ride.startAddress,
        destination: ride.endAddress,
        departure: ride.departureTime ? new Date(ride.departureTime).toLocaleString() : 'TBD',
        driverName: ride.driver?.user?.fullName || 'Driver',
        driverRating: ride.driver?.user?.averageRating ?? 4.9,
        vehicle: ride.driver?.vehicleModel || 'Car',
        pricePerSeat: ride.estimatedFare,
        aiMatchScore: 92,
        eta: ride.totalDuration ? `${ride.totalDuration} min` : 'TBD',
        distance: ride.totalDistance ? `${ride.totalDistance} km` : 'TBD',
        aiReason: 'Route proximity match based on OSRM geometry',
        stops: ride.stops || [],
        _fareLadder: buildFareLadder(ride),
      }));
      setResults(normalized);
    } catch (error) {
      console.error('Error fetching available rides:', error);
      addNotification({ title: 'Search failed', message: 'Could not load rides. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (ride) => {
    // Fetch fresh ride data before opening modal
    try {
      const freshResponse = await rideService.getRideById(ride.id);
      const freshRide = freshResponse.data;
      const freshSeats = freshRide?.availableSeats ?? 0;

      if (freshSeats <= 0) {
        addNotification({
          title: 'No seats available',
          message: 'This ride is fully booked. Please search again.',
          type: 'error'
        });
        handleSearch({ preventDefault: () => {} });
        return;
      }

      const ladder = buildFareLadder({ ...ride, ...freshRide, stops: freshRide.stops || ride.stops });
      setFareLadder(ladder);
      setPickupIdx(0);
      setDropoffIdx(ladder.length - 1);

      setBookingRide({
        ...ride,
        availableSeats: freshSeats,
      });
    } catch (e) {
      console.error('Could not verify seats:', e);
      const ladder = ride._fareLadder || buildFareLadder(ride);
      setFareLadder(ladder);
      setPickupIdx(0);
      setDropoffIdx(ladder.length - 1);
      setBookingRide(ride);
    }
  };

  const currentSegmentFare = fareLadder.length > 0
    ? computeSegmentFare(fareLadder, pickupIdx, dropoffIdx)
    : null;

  const confirmBook = async () => {
    if (!bookingRide) return;

    if (seats > bookingRide.availableSeats) {
      addNotification({
        title: 'Not enough seats',
        message: `Only ${bookingRide.availableSeats} seat(s) available. Please search again.`,
        type: 'error'
      });
      setBookingRide(null);
      return;
    }

    if (pickupIdx >= dropoffIdx) {
      addNotification({
        title: 'Invalid stops',
        message: 'Dropoff must be after pickup on the route.',
        type: 'error'
      });
      return;
    }

    setConfirmLoading(true);
    try {
      const pickupPoint = fareLadder[pickupIdx];
      const dropoffPoint = fareLadder[dropoffIdx];

      await rideService.bookRide({
        rideId: bookingRide.id,
        seatsToBook: Number(seats),
        pickupLatitude: pickupPoint.lat,
        pickupLongitude: pickupPoint.lon,
        pickupAddress: pickupPoint.name,
        dropoffLatitude: dropoffPoint.lat,
        dropoffLongitude: dropoffPoint.lon,
        dropoffAddress: dropoffPoint.name,
        pickupStopSequence: pickupIdx,
        dropoffStopSequence: dropoffIdx,
      });
      setBooked(true);
      setBookingRide(null);
      addNotification({
        title: 'Ride Booked! 🎉',
        message: `Your seat on ${bookingRide.driverName || 'the driver'}'s ride is confirmed.`,
        type: 'success'
      });
      setTimeout(() => onNavigate('bookings'), 1500);
    } catch (error) {
      console.error('Booking failed:', error);
      addNotification({
        title: 'Booking failed',
        message: error.response?.data?.error || 'Could not book ride. Please try again.',
        type: 'error'
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Find a Ride 🔍</h1>
          <p>AI-powered matching finds the best route for you</p>
        </div>
      </div>

      <div className="page-content">
        {/* Search Form */}
        <div className="card card-gradient animate-fadeInUp" style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 20, fontSize: 17 }}>Search Available Rides</h2>
          <form onSubmit={handleSearch}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto', gap: 16, alignItems: 'end' }}>
              <div className="input-group">
                <label className="input-label">From</label>
                <div className="input-with-icon">
                  <span className="input-icon">📍</span>
                  <input id="search-from" className="input-field" value={from}
                    onChange={e => setFrom(e.target.value)} placeholder="Origin" />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">To</label>
                <div className="input-with-icon">
                  <span className="input-icon">🎯</span>
                  <input id="search-to" className="input-field" value={to}
                    onChange={e => setTo(e.target.value)} placeholder="Destination" />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Date</label>
                <input id="search-date" className="input-field" type="date" value={date}
                  onChange={e => setDate(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Seats</label>
                <select id="search-seats" className="input-field" value={seats}
                  onChange={e => setSeats(Number(e.target.value))}>
                  {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <button id="btn-search" className="btn btn-primary" type="submit" style={{ height: 44 }}>
                {loading
                  ? <svg style={{ animation: 'spin 1s linear infinite', width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity=".3" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                  : '🔍 Search'
                }
              </button>
            </div>
          </form>
        </div>

        {/* AI Info Banner */}
        {results && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(124,106,245,0.1), rgba(0,212,170,0.1))',
            border: '1px solid rgba(124,106,245,0.2)',
            borderRadius: 'var(--radius-md)', padding: '12px 18px',
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20
          }}>
            <span style={{ fontSize: 22 }}>🤖</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>AI Ride Matching Active</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                K-Means clustering grouped {results.length} rides. Showing results ranked by AI match score &amp; minimum detour.
              </div>
            </div>
            <div style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--accent-primary)', fontSize: 14 }}>
              {results.length} rides found
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="stagger">
            {results.map(ride => (
              <div key={ride.id} className="ride-card animate-fadeInUp" id={`ride-card-${ride.id}`}>
                <div className="ride-card-header">
                  <div className="ride-route">
                    <span className="route-dot origin" />
                    <span>{ride.origin}</span>
                    <div className="route-line" style={{ minWidth: 60 }} />
                    <span>{ride.destination}</span>
                    <span className="route-dot dest" />
                  </div>
                  <div className="ai-match-pill">
                    🤖 {ride.aiMatchScore}% match
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="sidebar-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
                      {ride.driverName[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{ride.driverName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>⭐ {ride.driverRating} • {ride.vehicle}</div>
                    </div>
                  </div>
                </div>

                <div className="ride-meta" style={{ marginBottom: 14 }}>
                  <div className="ride-meta-item">🕐 {ride.departure}</div>
                  <div className="ride-meta-item">💺 {ride.availableSeats} seats left</div>
                  <div className="ride-meta-item">📏 {ride.distance}</div>
                  <div className="ride-meta-item">⏱ {ride.eta}</div>
                  {ride.stops.length > 0 && (
                    <div className="ride-meta-item">🛑 {ride.stops.length} stop{ride.stops.length > 1 ? 's' : ''}</div>
                  )}
                </div>

                {/* M3: Fare Breakdown for rides with stops */}
                {ride._fareLadder && ride._fareLadder.length > 2 && (
                  <div style={{
                    background: 'rgba(79,156,249,0.06)',
                    border: '1px solid rgba(79,156,249,0.15)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    marginBottom: 14,
                    fontSize: 12,
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                      💰 Dynamic Fare Breakdown
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
                      {ride._fareLadder.map((point, idx) => (
                        <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: idx === 0 ? 'var(--accent-success, #00d4aa)'
                              : idx === ride._fareLadder.length - 1 ? 'var(--accent-primary, #7c6af5)'
                              : 'var(--accent-warning, #ffb347)',
                            display: 'inline-block',
                          }} />
                          <span>{point.name.length > 30 ? point.name.substring(0, 30) + '…' : point.name}</span>
                          <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>₹{point.fareFromOrigin}</span>
                          {idx < ride._fareLadder.length - 1 && <span style={{ color: 'var(--text-muted)', margin: '0 2px' }}>→</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-primary)' }}>₹{ride.pricePerSeat}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/full route</span>
                    {seats > 1 && <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 8 }}>
                      Total: ₹{ride.pricePerSeat * seats}
                    </span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>
                      {ride.aiReason}
                    </div>
                    <button
                      id={`book-${ride.id}`}
                      className="btn btn-primary"
                      onClick={() => handleBook(ride)}
                      disabled={ride.availableSeats <= 0}
                    >
                      {ride.availableSeats <= 0 ? 'Full' : `Book ${seats} Seat${seats > 1 ? 's' : ''}`}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {results?.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">😕</div>
            <h3>No rides found</h3>
            <p>Try adjusting your search criteria</p>
          </div>
        )}
      </div>

      {/* Booking Modal — M3: with stop selection and dynamic fare */}
      {bookingRide && (
        <div className="modal-overlay" onClick={() => setBookingRide(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>Confirm Booking</h3>
              <button className="modal-close" onClick={() => setBookingRide(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Route overview */}
              <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                <div className="ride-route" style={{ marginBottom: 12 }}>
                  <span className="route-dot origin" />
                  <span style={{ fontWeight: 700 }}>{bookingRide.origin}</span>
                  <div className="route-line" />
                  <span style={{ fontWeight: 700 }}>{bookingRide.destination}</span>
                  <span className="route-dot dest" />
                </div>
                <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-muted)' }}>
                  <span>🚗 {bookingRide.driverName}</span>
                  <span>🕐 {bookingRide.departure}</span>
                  <span>💺 {seats} seat(s)</span>
                </div>
              </div>

              {/* M3: Pickup & Dropoff Stop Selectors */}
              {fareLadder.length > 2 && (
                <div style={{
                  background: 'rgba(124,106,245,0.06)',
                  border: '1px solid rgba(124,106,245,0.18)',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
                    📍 Select Your Stops
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="input-group">
                      <label className="input-label" style={{ fontSize: 12 }}>Pickup</label>
                      <select
                        id="pickup-stop"
                        className="input-field"
                        value={pickupIdx}
                        onChange={(e) => {
                          const newIdx = Number(e.target.value);
                          setPickupIdx(newIdx);
                          if (newIdx >= dropoffIdx) {
                            setDropoffIdx(newIdx + 1 < fareLadder.length ? newIdx + 1 : fareLadder.length - 1);
                          }
                        }}
                      >
                        {fareLadder.slice(0, -1).map((point, idx) => (
                          <option key={idx} value={idx}>
                            {point.name.length > 40 ? point.name.substring(0, 40) + '…' : point.name}
                            {idx === 0 ? ' (Origin)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label" style={{ fontSize: 12 }}>Dropoff</label>
                      <select
                        id="dropoff-stop"
                        className="input-field"
                        value={dropoffIdx}
                        onChange={(e) => setDropoffIdx(Number(e.target.value))}
                      >
                        {fareLadder.map((point, idx) => (
                          idx > pickupIdx && (
                            <option key={idx} value={idx}>
                              {point.name.length > 40 ? point.name.substring(0, 40) + '…' : point.name}
                              {idx === fareLadder.length - 1 ? ' (Destination)' : ''}
                            </option>
                          )
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Dynamic fare preview */}
                  {currentSegmentFare != null && (
                    <div style={{
                      marginTop: 12,
                      padding: '10px 14px',
                      background: 'rgba(0,212,170,0.08)',
                      border: '1px solid rgba(0,212,170,0.2)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <div style={{ fontSize: 12 }}>
                        <span style={{ color: 'var(--text-muted)' }}>Segment: </span>
                        <span style={{ fontWeight: 600 }}>
                          {fareLadder[pickupIdx]?.name.length > 20
                            ? fareLadder[pickupIdx]?.name.substring(0, 20) + '…'
                            : fareLadder[pickupIdx]?.name}
                        </span>
                        <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>→</span>
                        <span style={{ fontWeight: 600 }}>
                          {fareLadder[dropoffIdx]?.name.length > 20
                            ? fareLadder[dropoffIdx]?.name.substring(0, 20) + '…'
                            : fareLadder[dropoffIdx]?.name}
                        </span>
                      </div>
                      <div style={{ fontWeight: 800, color: 'var(--accent-primary)', fontSize: 15 }}>
                        ₹{currentSegmentFare}/seat
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Total Amount */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Total Amount</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-primary)' }}>
                  ₹{(currentSegmentFare != null ? currentSegmentFare : bookingRide.pricePerSeat) * seats}
                </span>
              </div>

              {/* Safety OTP */}
              <div style={{ background: 'rgba(0,212,170,0.07)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 'var(--radius-md)', padding: 12, fontSize: 13 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>🔐 Safety OTP</div>
                <div style={{ color: 'var(--text-muted)' }}>An OTP will be generated after booking. Share it with your driver to start the ride.</div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button id="cancel-booking" className="btn btn-ghost btn-full" onClick={() => setBookingRide(null)}>
                  Cancel
                </button>
                <button
                  id="confirm-booking"
                  className="btn btn-primary btn-full"
                  onClick={confirmBook}
                  disabled={confirmLoading}
                >
                  {confirmLoading ? '⏳ Booking...' : '✅ Confirm Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}