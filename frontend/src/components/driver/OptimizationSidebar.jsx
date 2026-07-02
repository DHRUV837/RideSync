export default function OptimizationSidebar({ 
  selectedRide, 
  rides, 
  onRideChange, 
  onOptimize, 
  optimizing, 
  optimized,
  hasPickupStops 
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Ride Selection */}
      {rides.length > 1 && (
        <div className="card" style={{ padding: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
            Select Ride
          </label>
          <select 
            className="input-field" 
            value={selectedRide?.id || ''} 
            onChange={onRideChange}
            style={{ width: '100%' }}
          >
            {rides.map(r => (
              <option key={r.id} value={r.id}>
                {r.startAddress} → {r.endAddress} ({new Date(r.departureTime).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Optimization Button */}
      <div className="card" style={{ padding: 16 }}>
        {!optimized ? (
          <button 
            className="btn btn-primary" 
            onClick={onOptimize} 
            disabled={optimizing || !hasPickupStops}
            style={{ width: '100%' }}
          >
            {optimizing ? (
              <span style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ animation: 'spin 1s linear infinite', width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity=".3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                Optimizing...
              </span>
            ) : !hasPickupStops ? (
              '🚫 Awaiting Riders'
            ) : (
              '🤖 Run AI Optimizer'
            )}
          </button>
        ) : (
          <div className="badge badge-success" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '12px',
            width: '100%'
          }}>
            ✅ Route Optimized
          </div>
        )}
      </div>

      {/* Ride Info */}
      {selectedRide && (
        <div className="card" style={{ padding: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Ride Details</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>Route: </span>
              <span style={{ fontWeight: 500 }}>{selectedRide.startAddress} → {selectedRide.endAddress}</span>
            </div>
            <div style={{ fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>Departure: </span>
              <span style={{ fontWeight: 500 }}>{new Date(selectedRide.departureTime).toLocaleString()}</span>
            </div>
            <div style={{ fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>Seats: </span>
              <span style={{ fontWeight: 500 }}>{selectedRide.availableSeats}</span>
            </div>
            <div style={{ fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>Status: </span>
              <span style={{ 
                fontWeight: 500,
                color: selectedRide.status === 'ONGOING' ? '#00d4aa' : 
                       selectedRide.status === 'PENDING' ? '#ffa500' : '#666'
              }}>
                {selectedRide.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Accepted Riders Info */}
      {selectedRide?.bookings && selectedRide.bookings.length > 0 && (
        <div className="card" style={{ padding: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Accepted Riders</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {selectedRide.bookings
              .filter(b => b.status === 'CONFIRMED' || b.status === 'ONGOING')
              .map((booking, i) => (
                <div key={booking.id} style={{ 
                  padding: 8, 
                  background: 'var(--bg-card)', 
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--glass-border)'
                }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>
                    {i + 1}. {booking.rider?.user?.fullName || 'Passenger'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Pickup: {booking.pickupAddress}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Dropoff: {booking.dropoffAddress}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
