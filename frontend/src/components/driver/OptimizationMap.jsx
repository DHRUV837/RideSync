import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const makeIcon = (emoji, color) => new L.DivIcon({
  html: `<div style="background:${color};width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${emoji}</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const makeNumberedIcon = (number, color) => new L.DivIcon({
  html: `<div style="background:${color};width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${number}</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const iconMap = {
  origin: makeIcon('🚗', '#00d4aa'),
  pickup: makeIcon('👤', '#4f9cf9'),
  destination: makeIcon('📍', '#f53b6e'),
};

const getPickupNumber = (num) => {
  const numbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
  return numbers[num - 1] || num;
};

function MapController({ center, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 10, { animate: true });
    }
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [center, bounds, map]);
  return null;
}

export default function OptimizationMap({ 
  routeGeometry, 
  optimizedWaypoints, 
  origin, 
  destination,
  acceptedRiders 
}) {
  const center = origin ? [origin.lat, origin.lon] : null;
  const safeOptimizedWaypoints = Array.isArray(optimizedWaypoints) ? optimizedWaypoints : [];
  
  // Calculate bounds from route geometry
  const bounds = routeGeometry && routeGeometry.length > 0 
    ? L.latLngBounds(routeGeometry.map(coord => [coord[0], coord[1]]))
    : null;

  // Build waypoints with rider information
  const waypoints = safeOptimizedWaypoints.map((wp, index) => {
    if (wp.id === 'origin' || wp.id === 'start') {
      return {
        ...wp,
        type: 'origin',
        label: 'Driver Start',
        location: origin?.address || 'Start Location',
      };
    }
    if (wp.id === 'destination' || wp.id === 'end') {
      return {
        ...wp,
        type: 'destination',
        label: 'Driver Destination',
        location: destination?.address || 'End Location',
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

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer 
        center={center || [22.75, 72.75]} 
        zoom={10} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} bounds={bounds} />
        
        {/* Render OSRM route geometry */}
        {routeGeometry && routeGeometry.length > 0 && (
          <Polyline
            positions={routeGeometry}
            color="#00d4aa"
            weight={5}
            opacity={0.9}
            lineCap="round"
            lineJoin="round"
          />
        )}
        
        {/* Render markers */}
        {waypoints.map((wp, i) => {
          let markerIcon = iconMap[wp.type];
          if (wp.type === 'pickup') {
            const pickupIndex = waypoints.filter((w, idx) => w.type === 'pickup' && idx <= i).length;
            markerIcon = makeNumberedIcon(getPickupNumber(pickupIndex), '#4f9cf9');
          }
          
          return (
            <Marker 
              key={wp.id || i} 
              position={[wp.lat, wp.lon]} 
              icon={markerIcon}
            >
              <Popup>
                <div style={{ minWidth: 200 }}>
                  <strong style={{ fontSize: 14 }}>{wp.label}</strong>
                  {wp.type === 'pickup' && (
                    <>
                      <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                        Passenger: {wp.riderName || 'Unknown'}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                        Pickup: {wp.pickupAddress || wp.location || 'Pickup location'}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                        Drop: {wp.dropAddress || 'Drop location'}
                      </div>
                    </>
                  )}
                  {wp.type !== 'pickup' && (
                    <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                      {wp.type === 'origin' ? 'Start Address' : 'Driver Destination'}
                    </div>
                  )}
                  {wp.type !== 'pickup' && (
                    <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                      {wp.location}
                    </div>
                  )}
                  {wp.type === 'pickup' && (
                    <div style={{ marginTop: 4, fontSize: 11, color: '#4f9cf9' }}>
                      Pickup #{waypoints.filter((w, idx) => w.type === 'pickup' && idx <= i).length}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
