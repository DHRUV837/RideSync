import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom car icon for driver
const makeDriverIcon = () => new L.DivIcon({
  html: `
    <div style="
      background: linear-gradient(135deg, #00d4aa, #00b894);
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 4px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    ">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
      </svg>
    </div>
  `,
  className: '',
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

// Green numbered pickup markers
const makePickupIcon = (number) => new L.DivIcon({
  html: `
    <div style="
      background: linear-gradient(135deg, #00d4aa, #00b894);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 700;
      color: white;
      border: 3px solid white;
      box-shadow: 0 3px 10px rgba(0,212,170,0.4);
    ">
      ${number}
    </div>
  `,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Red numbered dropoff markers
const makeDropoffIcon = (number) => new L.DivIcon({
  html: `
    <div style="
      background: linear-gradient(135deg, #f53b6e, #e91e63);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 700;
      color: white;
      border: 3px solid white;
      box-shadow: 0 3px 10px rgba(245,59,110,0.4);
    ">
      ${number}
    </div>
  `,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Destination marker
const makeDestinationIcon = () => new L.DivIcon({
  html: `
    <div style="
      background: linear-gradient(135deg, #f53b6e, #e91e63);
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 4px solid white;
      box-shadow: 0 3px 10px rgba(245,59,110,0.4);
    ">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    </div>
  `,
  className: '',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

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

// Map Legend Component
function MapLegend() {
  return (
    <div style={{
      position: 'absolute',
      top: 20,
      right: 20,
      background: 'rgba(255, 255, 255, 0.95)',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
      fontSize: '12px',
      minWidth: '140px'
    }}>
      <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '13px' }}>Legend</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00d4aa, #00b894)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          color: 'white'
        }}>🚗</div>
        <span>Driver</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00d4aa, #00b894)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          color: 'white',
          fontWeight: 700
        }}>1</div>
        <span>Pickup</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f53b6e, #e91e63)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          color: 'white',
          fontWeight: 700
        }}>1</div>
        <span>Dropoff</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 24,
          height: 4,
          borderRadius: 2,
          background: '#00d4aa'
        }}></div>
        <span>Route</span>
      </div>
    </div>
  );
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

  // Build dropoff markers from accepted riders
  const dropoffMarkers = acceptedRiders?.map((rider, index) => {
    const lat = rider.dropoffLat || rider.dropoffLatitude;
    const lon = rider.dropoffLon || rider.dropoffLongitude;
    const hasValidCoords = lat && lon && !isNaN(lat) && !isNaN(lon) && Math.abs(lat) > 0.1 && Math.abs(lon) > 0.1;
    return {
      type: 'dropoff',
      label: `Dropoff ${rider.riderName || 'Passenger'}`,
      location: rider.dropoffAddress || 'Dropoff Location',
      lat: lat,
      lon: lon,
      riderName: rider.riderName,
      pickupNumber: index + 1,
      hasCoords: hasValidCoords,
    };
  }) || [];

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
        <MapLegend />
        
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
        
        {/* Render origin marker */}
        {origin && (
          <Marker 
            position={[origin.lat, origin.lon]} 
            icon={makeDriverIcon()}
          >
            <Popup>
              <div style={{ minWidth: 220, padding: '4px 0' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  marginBottom: 8,
                  paddingBottom: 8,
                  borderBottom: '1px solid #eee'
                }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00d4aa, #00b894)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px'
                  }}>🚗</div>
                  <strong style={{ fontSize: 15 }}>Driver Start</strong>
                </div>
                <div style={{ fontSize: 13, color: '#333', marginBottom: 4 }}>
                  <span style={{ color: '#666', fontWeight: 500 }}>Location:</span> {origin.address}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Render pickup markers */}
        {waypoints.filter(wp => wp.type === 'pickup').map((wp, i) => {
          const pickupIndex = waypoints.filter((w, idx) => w.type === 'pickup' && idx <= i).length;
          return (
            <Marker 
              key={`pickup-${wp.id || i}`} 
              position={[wp.lat, wp.lon]} 
              icon={makePickupIcon(pickupIndex)}
            >
              <Popup>
                <div style={{ minWidth: 240, padding: '4px 0' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    marginBottom: 8,
                    paddingBottom: 8,
                    borderBottom: '1px solid #eee'
                  }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #00d4aa, #00b894)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: 'white'
                    }}>{pickupIndex}</div>
                    <div>
                      <strong style={{ fontSize: 15 }}>Pickup #{pickupIndex}</strong>
                      <div style={{ fontSize: 12, color: '#666' }}>{wp.riderName || 'Passenger'}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: '#333', marginBottom: 4 }}>
                    <span style={{ color: '#666', fontWeight: 500 }}>📍 Pickup:</span> {wp.pickupAddress || wp.location}
                  </div>
                  <div style={{ fontSize: 13, color: '#333', marginBottom: 4 }}>
                    <span style={{ color: '#666', fontWeight: 500 }}>🎯 Dropoff:</span> {wp.dropAddress || 'Drop location'}
                  </div>
                  {wp.fare && (
                    <div style={{ 
                      marginTop: 8,
                      padding: '6px 10px',
                      background: 'rgba(0,212,170,0.1)',
                      borderRadius: '4px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#00d4aa'
                    }}>
                      💰 Fare: ₹{wp.fare}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Render dropoff markers */}
        {dropoffMarkers.filter(d => d.hasCoords).map((dropoff, i) => (
          <Marker 
            key={`dropoff-${i}`} 
            position={[dropoff.lat, dropoff.lon]} 
            icon={makeDropoffIcon(dropoff.pickupNumber)}
          >
            <Popup>
              <div style={{ minWidth: 220, padding: '4px 0' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  marginBottom: 8,
                  paddingBottom: 8,
                  borderBottom: '1px solid #eee'
                }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f53b6e, #e91e63)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: 'white'
                  }}>{dropoff.pickupNumber}</div>
                  <div>
                    <strong style={{ fontSize: 15 }}>Dropoff #{dropoff.pickupNumber}</strong>
                    <div style={{ fontSize: 12, color: '#666' }}>{dropoff.riderName || 'Passenger'}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#333' }}>
                  <span style={{ color: '#666', fontWeight: 500 }}>📍 Location:</span> {dropoff.location}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render destination marker */}
        {destination && (
          <Marker 
            position={[destination.lat, destination.lon]} 
            icon={makeDestinationIcon()}
          >
            <Popup>
              <div style={{ minWidth: 220, padding: '4px 0' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  marginBottom: 8,
                  paddingBottom: 8,
                  borderBottom: '1px solid #eee'
                }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f53b6e, #e91e63)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px'
                  }}>📍</div>
                  <strong style={{ fontSize: 15 }}>Driver Destination</strong>
                </div>
                <div style={{ fontSize: 13, color: '#333' }}>
                  <span style={{ color: '#666', fontWeight: 500 }}>Location:</span> {destination.address}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
