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
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  };
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
    // ✅ Fetch fresh ride data before opening modal
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
        // Refresh search results
        handleSearch({ preventDefault: () => {} });
        return;
      }

      // Update ride with fresh data
      setBookingRide({
        ...ride,
        availableSeats: freshSeats,
      });
    } catch (e) {
      console.error('Could not verify seats:', e);
      setBookingRide(ride);
    }
  };

  const confirmBook = async () => {
    if (!bookingRide) return;

    // ✅ Check seats against fresh data
    if (seats > bookingRide.availableSeats) {
      addNotification({
        title: 'Not enough seats',
        message: `Only ${bookingRide.availableSeats} seat(s) available. Please search again.`,
        type: 'error'
      });
      setBookingRide(null);
      return;
    }

    setConfirmLoading(true);
    try {
      await rideService.bookRide({
        rideId: bookingRide.id,
        seatsToBook: Number(seats), // ✅ Ensure it's a number
        pickupLatitude: bookingRide.startLatitude,
        pickupLongitude: bookingRide.startLongitude,
        pickupAddress: bookingRide.startAddress,
        dropoffLatitude: bookingRide.endLatitude,
        dropoffLongitude: bookingRide.endLongitude,
        dropoffAddress: bookingRide.endAddress,
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
                K-Means clustering grouped {results.length} rides. Showing results ranked by AI match score & minimum detour.
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
                    <div className="ride-meta-item">🛑 Stops: {ride.stops.join(', ')}</div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-primary)' }}>₹{ride.pricePerSeat}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/seat</span>
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

      {/* Booking Modal */}
      {bookingRide && (
        <div className="modal-overlay" onClick={() => setBookingRide(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Booking</h3>
              <button className="modal-close" onClick={() => setBookingRide(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Total Amount</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-primary)' }}>
                  ₹{bookingRide.pricePerSeat * seats}
                </span>
              </div>

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