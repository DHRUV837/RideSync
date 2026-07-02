import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { rideService } from '../../services/apiService';
import { useApp } from '../../context/AppContext';

// Fix default leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const driverIcon = new L.DivIcon({
  html: `<div style="background:linear-gradient(135deg,#00d4aa,#7c6af5);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;box-shadow:0 0 15px rgba(0,212,170,0.5)">🚗</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const destIcon = new L.DivIcon({
  html: `<div style="background:#f53b6e;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:3px solid white;box-shadow:0 0 12px rgba(245,59,110,0.5)">📍</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Driver moves along the route
const ROUTE = [
  [22.5645, 72.9289],
  [22.5700, 72.9100],
  [22.5900, 72.8800],
  [22.6200, 72.8400],
  [22.6600, 72.8000],
  [22.7000, 72.7500],
  [22.7500, 72.7000],
  [22.8000, 72.6600],
  [22.8600, 72.6200],
  [22.9200, 72.5900],
  [22.9800, 72.5700],
  [23.0225, 72.5714],
];

function parseRouteGeometry(routeGeometry) {
  if (!routeGeometry) return null;

  try {
    const parsed = typeof routeGeometry === 'string' ? JSON.parse(routeGeometry) : routeGeometry;
    if (!Array.isArray(parsed) || parsed.length < 2) return null;

    return parsed.map((point) => {
      if (!Array.isArray(point) || point.length < 2) return point;
      const [lon, lat] = point;
      return [Number(lat), Number(lon)];
    });
  } catch (error) {
    console.error('Unable to parse route geometry:', error);
    return null;
  }
}

function AnimatedMarker({ position }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(position, { animate: true, duration: 1.2 });
  }, [position]);
  return <Marker position={position} icon={driverIcon}><Popup>🚗 Driver is here</Popup></Marker>;
}

export default function LiveTracking() {
  const { addNotification } = useApp();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverPos, setDriverPos] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [eta, setEta] = useState(22);

  useEffect(() => {
    const fetchActiveBooking = async () => {
      try {
        const response = await rideService.getMyBookings();
        const list = response.data || [];
        const active = list.find(b => b.status === 'CONFIRMED' || b.status === 'ONGOING') || list[0];
        setBooking(active);
      } catch (err) {
        console.error('Failed to load active booking:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveBooking();
  }, []);

  const getRouteForBooking = (b) => {
    const geometryRoute = parseRouteGeometry(b?.ride?.routeGeometry);
    if (geometryRoute && geometryRoute.length > 1) {
      return geometryRoute;
    }

    if (!b || !b.ride || !b.ride.startLatitude || !b.ride.endLatitude) {
      return ROUTE;
    }

    const start = [b.ride.startLatitude, b.ride.startLongitude];
    const pickup = [b.pickupLatitude, b.pickupLongitude];
    const dropoff = [b.dropoffLatitude, b.dropoffLongitude];
    const end = [b.ride.endLatitude, b.ride.endLongitude];

    const path = [];
    const steps = 4;

    const interpolate = (p1, p2) => {
      const segs = [];
      for (let i = 0; i <= steps; i++) {
        const pct = i / steps;
        segs.push([
          p1[0] + (p2[0] - p1[0]) * pct,
          p1[1] + (p2[1] - p1[1]) * pct
        ]);
      }
      return segs;
    };

    path.push(...interpolate(start, pickup));
    path.push(...interpolate(pickup, dropoff));
    path.push(...interpolate(dropoff, end));

    return path.filter((val, index, self) =>
      self.findIndex(t => t[0] === val[0] && t[1] === val[1]) === index
    );
  };

  const activeRoute = getRouteForBooking(booking);

  useEffect(() => {
    if (!booking) {
      setDriverPos(0);
      setEta(22);
      setIsMoving(false);
      return;
    }

    setDriverPos(0);
    setEta(Math.max(1, Math.round(booking?.ride?.totalDuration || 22)));
    setIsMoving(false);
  }, [booking?.id]);

  useEffect(() => {
    if (!isMoving) return;
    const interval = setInterval(() => {
      setDriverPos(prev => {
        const next = prev + 1;
        if (next >= activeRoute.length - 1) {
          setIsMoving(false);
          setEta(0);
          return activeRoute.length - 1;
        }

        const progress = next / Math.max(1, activeRoute.length - 1);
        const remainingMinutes = Math.max(1, Math.round((booking?.ride?.totalDuration || 22) * (1 - progress)));
        setEta(remainingMinutes);
        return next;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [isMoving, activeRoute, booking?.ride?.totalDuration]);

  const arrived = driverPos >= activeRoute.length - 1;

  if (loading) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⏳</div>
        <h3>Loading tracking data...</h3>
      </div>
    );
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Live Tracking 📍</h1>
          <p>Real-time driver location</p>
        </div>
        <div className="topbar-right">
          <span className={`badge ${isMoving ? 'badge-success' : arrived ? 'badge-purple' : 'badge-warning'}`}>
            {arrived ? '✅ Arrived' : isMoving ? '🟢 Live' : '⏸ Paused'}
          </span>
        </div>
      </div>

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          {/* Map */}
          <div>
            <div className="map-container" style={{ height: 500 }}>
              <MapContainer center={activeRoute[driverPos] || [22.5645, 72.9289]} zoom={10} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <AnimatedMarker position={activeRoute[driverPos] || [22.5645, 72.9289]} />
                <Marker position={activeRoute[activeRoute.length - 1] || [23.0225, 72.5714]} icon={destIcon}>
                  <Popup>📍 {booking?.ride?.endAddress || 'Destination'}</Popup>
                </Marker>
                <Polyline
                  positions={activeRoute}
                  color="#00d4aa"
                  weight={4}
                  opacity={0.6}
                  dashArray="8,4"
                />
                {/* Traveled path */}
                <Polyline
                  positions={activeRoute.slice(0, driverPos + 1)}
                  color="#00d4aa"
                  weight={5}
                  opacity={1}
                />
              </MapContainer>
            </div>
          </div>

          {/* Info Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Driver Card */}
            <div className="card">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                <div className="sidebar-avatar" style={{ width: 48, height: 48, fontSize: 20 }}>
                  {(booking?.ride?.driver?.user?.fullName || 'D')[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{booking?.ride?.driver?.user?.fullName || 'Driver'}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>⭐ {booking?.ride?.driver?.user?.averageRating || '4.8'} • {booking?.ride?.driver?.vehicleModel || 'Car'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{booking?.ride?.driver?.vehicleNumber || 'Vehicle'}</div>
                </div>
                <a href={`tel:${booking?.ride?.driver?.user?.phoneNumber || ''}`} id="call-driver"
                  style={{ marginLeft: 'auto', background: 'var(--accent-primary-dim)', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 'var(--radius-md)', padding: '8px 12px', color: 'var(--accent-primary)', fontSize: 20, display: 'flex', alignItems: 'center' }}>
                  📞
                </a>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-primary)' }}>
                    {arrived ? '0' : eta}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>mins ETA</div>
                </div>
                <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-secondary)' }}>
                    {Math.round((driverPos / (activeRoute.length - 1)) * (booking?.ride?.totalDistance || 72))} km
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>completed</div>
                </div>
              </div>
            </div>

            {/* Route Progress */}
            <div className="card">
              <h3 style={{ marginBottom: 14, fontSize: 15 }}>Route Progress</h3>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 6, top: 0, bottom: 0, width: 2, background: 'var(--glass-border)' }} />
                <div style={{ position: 'absolute', left: 6, top: 0, width: 2, background: 'var(--accent-primary)', height: `${(driverPos / (activeRoute.length - 1)) * 100}%`, transition: 'height 1s ease' }} />
                {[
                  { label: `${booking?.ride?.startAddress || 'Start'}`, done: true },
                  { label: `${booking?.pickupAddress || 'Pickup'}`, done: driverPos > Math.floor(activeRoute.length / 3) },
                  { label: `${booking?.dropoffAddress || 'Dropoff'}`, done: driverPos > Math.floor(activeRoute.length * 2 / 3) },
                  { label: `${booking?.ride?.endAddress || 'Destination'}`, done: arrived },
                ].map((stop, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, paddingLeft: 22, paddingBottom: i < 3 ? 20 : 0, position: 'relative' }}>
                    <div style={{
                      position: 'absolute', left: 0, width: 14, height: 14, borderRadius: '50%',
                      background: stop.done ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                      border: '2px solid ' + (stop.done ? 'var(--accent-primary)' : 'var(--glass-border)'),
                      transition: 'all 0.5s'
                    }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: stop.done ? 'var(--text-primary)' : 'var(--text-muted)' }}>{stop.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!arrived && (
                <button id="toggle-simulation"
                  className={`btn ${isMoving ? 'btn-secondary' : 'btn-primary'} btn-full`}
                  onClick={() => setIsMoving(m => !m)}>
                  {isMoving ? '⏸ Pause Live Tracking' : '▶ Start Live Tracking'}
                </button>
              )}
              {arrived && (
                <div style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 'var(--radius-md)', padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>🎉</div>
                  <div style={{ fontWeight: 700 }}>You have arrived!</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Don't forget to rate your driver</div>
                </div>
              )}
              <button id="emergency-btn" className="btn btn-danger btn-full">
                🚨 Emergency Contact
              </button>
              <button id="share-ride-link" className="btn btn-ghost btn-full">
                🔗 Share Ride Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
