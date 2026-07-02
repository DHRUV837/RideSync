export default function OptimizationTimeline({ optimizedWaypoints, acceptedRiders, routeSteps }) {
  if (!optimizedWaypoints || optimizedWaypoints.length === 0) return null;

  // Build timeline with rider information
  const timeline = optimizedWaypoints.map((wp, index) => {
    if (wp.id === 'origin' || wp.id === 'start') {
      return {
        ...wp,
        type: 'origin',
        label: 'Driver Start',
        location: 'Start Location',
        order: index,
      };
    }
    if (wp.id === 'destination' || wp.id === 'end') {
      return {
        ...wp,
        type: 'destination',
        label: 'Driver Destination',
        location: 'End Location',
        order: index,
      };
    }

    const riderId = wp.riderId || wp.id?.replace('pickup-', '');
    const rider = acceptedRiders?.find(r => String(r.id) === String(riderId));
    return {
      ...wp,
      type: 'pickup',
      label: `Pickup ${rider?.passengerName || rider?.riderName || wp.riderName || 'Passenger'}`,
      location: rider?.pickupAddress || wp.address || 'Pickup Location',
      pickupAddress: rider?.pickupAddress || wp.address || 'Pickup Location',
      dropAddress: rider?.dropAddress || rider?.dropoffAddress || 'Drop location',
      riderName: rider?.passengerName || rider?.riderName || wp.riderName,
      order: index,
    };
  });

  const pickupCount = timeline.filter(t => t.type === 'pickup').length;

  return (
    <div className="card" style={{ overflow: 'auto', maxHeight: 480 }}>
      <h3 style={{ marginBottom: 20, fontSize: 16, fontWeight: 600 }}>
        Optimized Pickup Sequence
      </h3>
      <div className="route-steps">
        {timeline.map((step, i) => (
          <div key={step.id || i} className="route-step">
            <div className="route-step-indicator">
              <div 
                className="route-step-dot" 
                style={{ 
                  background: step.type === 'origin' ? '#00d4aa' : 
                           step.type === 'destination' ? '#f53b6e' : '#4f9cf9' 
                }} 
              />
              {i < timeline.length - 1 && <div className="route-step-line" />}
            </div>
            <div className="route-step-content" style={{ paddingBottom: i < timeline.length - 1 ? 4 : 0 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600 }}>
                {step.label}
                {step.type === 'pickup' && (
                  <span style={{ 
                    marginLeft: 8, 
                    fontSize: 11, 
                    color: '#4f9cf9',
                    fontWeight: 500 
                  }}>
                    #{timeline.filter((s, idx) => s.type === 'pickup' && idx <= i).length}
                  </span>
                )}
              </h4>
              {step.type === 'pickup' ? (
                <>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0' }}>
                    Pickup: {step.pickupAddress || step.location || 'Pickup location'}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0' }}>
                    Drop: {step.dropAddress || 'Drop location'}
                  </p>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Passenger: {step.riderName || 'Unknown'}
                  </div>
                </>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0' }}>
                  {step.location}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div style={{ 
        marginTop: 16, 
        background: 'rgba(0,212,170,0.08)', 
        borderRadius: 'var(--radius-md)', 
        padding: 14, 
        border: '1px solid rgba(0,212,170,0.2)' 
      }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Route Summary</div>
        <div style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
          🚗 Driver Start<br />
          {timeline.filter(t => t.type === 'pickup').map((pickup, i) => (
            <span key={pickup.id}>
              {i + 1}. {pickup.label} ({pickup.location})<br />
            </span>
          ))}
          📍 Destination
        </div>
      </div>
    </div>
  );
}
