export default function PassengerRouteCard({ segment, index }) {
  if (!segment) return null;

  return (
    <div style={{
      border: '1px solid rgba(79, 156, 249, 0.2)',
      borderRadius: 'var(--radius-md)',
      padding: 14,
      background: 'rgba(79, 156, 249, 0.06)',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
          {index}. Pickup {segment.passengerName || segment.riderName || 'Passenger'}
        </div>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: '#4f9cf9',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
        }}>
          {index}
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
        Pickup: {segment.pickupAddress || 'Pickup location'}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
        Drop: {segment.dropAddress || segment.dropoffAddress || 'Drop location'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Distance</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{(segment.roadDistanceKm ?? segment.distanceKm ?? 0).toFixed(1)} km</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Fare</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>₹{segment.fare?.toFixed(0) || 0}</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
        Travel time: {(segment.travelTimeMinutes ?? segment.durationMinutes ?? 0).toFixed(0)} min
      </div>
    </div>
  );
}
