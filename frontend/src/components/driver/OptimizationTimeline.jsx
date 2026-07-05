export default function OptimizationTimeline({ optimizedWaypoints, acceptedRiders, routeSteps }) {
  if (!optimizedWaypoints || optimizedWaypoints.length === 0) return null;

  // Build timeline with pickup and dropoff sequence
  const timeline = [];
  
  optimizedWaypoints.forEach((wp, index) => {
    if (wp.id === 'origin' || wp.id === 'start') {
      timeline.push({
        ...wp,
        type: 'origin',
        label: 'Driver Start',
        location: 'Start Location',
        order: timeline.length,
      });
    } else if (wp.id === 'destination' || wp.id === 'end') {
      timeline.push({
        ...wp,
        type: 'destination',
        label: 'Driver Destination',
        location: 'End Location',
        order: timeline.length,
      });
    } else {
      // For each pickup waypoint, add both pickup and dropoff entries
      const riderId = wp.riderId || wp.id?.replace('pickup-', '');
      const rider = acceptedRiders?.find(r => String(r.id) === String(riderId));
      const pickupNumber = timeline.filter(t => t.type === 'pickup').length + 1;
      
      // Add pickup entry
      timeline.push({
        ...wp,
        type: 'pickup',
        label: `Pickup ${rider?.passengerName || rider?.riderName || wp.riderName || 'Passenger'}`,
        location: rider?.pickupAddress || wp.address || 'Pickup Location',
        pickupAddress: rider?.pickupAddress || wp.address || 'Pickup Location',
        dropAddress: rider?.dropAddress || rider?.dropoffAddress || 'Drop location',
        riderName: rider?.passengerName || rider?.riderName || wp.riderName,
        order: timeline.length,
        sequenceNumber: pickupNumber,
      });
      
      // Add dropoff entry
      timeline.push({
        ...wp,
        type: 'dropoff',
        label: `Dropoff ${rider?.passengerName || rider?.riderName || wp.riderName || 'Passenger'}`,
        location: rider?.dropAddress || rider?.dropoffAddress || 'Drop location',
        riderName: rider?.passengerName || rider?.riderName || wp.riderName,
        order: timeline.length,
        sequenceNumber: pickupNumber,
      });
    }
  });

  return (
    <div className="card" style={{ overflow: 'auto', maxHeight: 480 }}>
      <h3 style={{ marginBottom: 20, fontSize: 16, fontWeight: 600 }}>
        Optimized Route Sequence
      </h3>
      <div className="route-steps">
        {timeline.map((step, i) => (
          <div key={`${step.type}-${step.order}`} className="route-step">
            <div className="route-step-indicator">
              <div 
                className="route-step-dot" 
                style={{ 
                  background: step.type === 'origin' ? '#00d4aa' : 
                           step.type === 'destination' ? '#f53b6e' : 
                           step.type === 'pickup' ? '#00d4aa' : '#f53b6e'
                }} 
              />
              {i < timeline.length - 1 && <div className="route-step-line" />}
            </div>
            <div className="route-step-content" style={{ paddingBottom: i < timeline.length - 1 ? 4 : 0 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600 }}>
                {step.type === 'origin' && '🚗 Driver Start'}
                {step.type === 'pickup' && `📍 Pickup #${step.sequenceNumber} - ${step.riderName || 'Passenger'}`}
                {step.type === 'dropoff' && `🎯 Dropoff #${step.sequenceNumber} - ${step.riderName || 'Passenger'}`}
                {step.type === 'destination' && '🏁 Driver Destination'}
              </h4>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0' }}>
                {step.location}
              </p>
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
            <span key={pickup.order}>
              📍 Pickup #{i + 1}: {pickup.riderName || 'Passenger'}<br />
              🎯 Dropoff #{i + 1}: {pickup.riderName || 'Passenger'}<br />
            </span>
          ))}
          🏁 Driver Destination
        </div>
      </div>
    </div>
  );
}
