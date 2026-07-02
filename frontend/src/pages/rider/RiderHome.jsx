import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { rideService } from '../../services/apiService';
import { carbonService } from "../../services/apiService";
import '../../styles/rider.css';

export default function RiderHome({ onNavigate }) {
  const { user, addNotification } = useApp();
  const [availableRides, setAvailableRides] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
const [dashboardLoading, setDashboardLoading] = useState(true);
const [carbonStats, setCarbonStats] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const firstName = user?.name?.split(' ')[0] || 'there';

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Fetch available rides and bookings; use allSettled so one failure won't hide the other
        const [ridesResult, bookingsResult, carbonResult] =
await Promise.allSettled([
    rideService.getAvailableRides(),
    rideService.getMyBookings(),
    carbonService.getCarbonSavings(user.id)
]);

        if (ridesResult.status === 'fulfilled') {
          setAvailableRides(ridesResult.value.data || []);
        }

        if (bookingsResult.status === 'fulfilled') {
          const bookingsData = bookingsResult.value.data || [];
          const normalizedBookings = bookingsData.map((booking) => {
            const ride = booking.ride || {};
            const status = booking.status?.toLowerCase();
            return {
              ...booking,
              origin: ride.startAddress,
              destination: ride.endAddress,
              driverName: ride.driver?.user?.fullName || 'Driver',
              date: ride.departureTime ? new Date(ride.departureTime).toLocaleString() : 'TBD',
              seats: booking.seatsBooked,
              amount: booking.fare,
              statusLabel: status === 'completed' ? 'Completed' : status === 'cancelled' ? 'Cancelled' : 'Upcoming',
            };
          });
          if (carbonResult.status === "fulfilled") {
    setCarbonStats(carbonResult.value.data);
}
          setBookings(normalizedBookings);
          setUpcoming(normalizedBookings.filter((b) => b.status?.toLowerCase() !== 'completed' && b.status?.toLowerCase() !== 'cancelled'));
        }

        // Only show error if BOTH calls failed
        if (ridesResult.status === 'rejected' && bookingsResult.status === 'rejected') {
          console.error('Failed to load rider dashboard:', ridesResult.reason);
          addNotification({ title: 'Dashboard unavailable', message: 'Could not connect to the server. Please try again.', type: 'error' });
        }
      } finally {
        setDashboardLoading(false);
        setLoading(false);
      }
    };

    loadDashboard();
  }, [addNotification]);

const carbonSaved = carbonStats?.carbonSavingsKg ?? 0;
const fuelSaved = carbonStats?.fuelSavingsLiters ?? 0;

  const quickActions = [
    { id: 'search', icon: '🔍', label: 'Find a Ride', desc: 'AI-matched routes', color: 'green' },
    { id: 'tracking', icon: '📍', label: 'Live Track', desc: 'Follow your driver', color: 'purple' },
    { id: 'bookings', icon: '🎫', label: 'My Bookings', desc: `${bookings.length} total`, color: 'blue' },
    { id: 'carbon', icon: '🌿', label: 'Eco Impact', desc: `${carbonSaved} kg CO₂ reduced`, color: 'orange' },
  ];

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Welcome back, {firstName} 👋</h1>
          <p>Your smart carpooling dashboard</p>
        </div>
        <div className="topbar-right">
          <button className="btn btn-primary" onClick={() => onNavigate('search')}>
            🔍 Find a Ride
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="stats-grid stagger">
          <div className="stat-card green">
            <div className="stat-icon green">🚗</div>
            <div className="stat-value">{dashboardLoading ? '…' : availableRides.length}</div>
            <div className="stat-label">Available Rides</div>
            <div className="stat-change up">Find your next trip</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-icon purple">💰</div>
            <div className="stat-value">{dashboardLoading ? '…' : bookings.length}</div>
            <div className="stat-label">Your Bookings</div>
            <div className="stat-change up">Manage your trips</div>
          </div>
          <div className="stat-card blue">
            <div className="stat-icon blue">💨</div>
            <div className="stat-value">
    {dashboardLoading ? "..." : carbonSaved.toFixed(1)} kg
</div>
            <div className="stat-label">CO₂ Reduced</div>
            <div className="stat-change up">Green impact</div>
          </div>
          <div className="stat-card orange">
            <div className="stat-icon orange">⏰</div>
            <div className="stat-value">{dashboardLoading ? '…' : upcoming.length}</div>
            <div className="stat-label">Upcoming Rides</div>
            <div className="stat-change up">{upcoming.length ? 'Upcoming trip' : 'Book one now'}</div>
          </div>
        </div>

        <div className="section-header">
          <div>
            <h2>Quick Actions</h2>
            <p>Jump to what you need</p>
          </div>
        </div>

        <div className="quick-actions-grid stagger">
          {quickActions.map(action => (
            <button
              key={action.id}
              className={`quick-action-card ${action.color}`}
              onClick={() => onNavigate(action.id)}
            >
              <span className="quick-action-icon">{action.icon}</span>
              <div className="quick-action-text">
                <strong>{action.label}</strong>
                <span>{action.desc}</span>
              </div>
              <span className="quick-action-arrow">→</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 32 }}>
          <div className="card">
            <div className="section-header">
              <div>
                <h2>Upcoming Ride</h2>
                <p>{upcoming.length ? 'Your next trip' : 'No rides scheduled'}</p>
              </div>
              {upcoming.length > 0 && (
                <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('tracking')}>
                  Track Live
                </button>
              )}
            </div>
            {upcoming.length > 0 ? (
              <div className="ride-card" style={{ cursor: 'default' }}>
                <div className="ride-route" style={{ marginBottom: 12 }}>
                  <span className="route-dot origin" />
                  <span>{upcoming[0].origin}</span>
                  <div className="route-line" />
                  <span>{upcoming[0].destination}</span>
                  <span className="route-dot dest" />
                </div>
                <div className="ride-meta">
                  <div className="ride-meta-item">🚗 {upcoming[0].driverName}</div>
                  <div className="ride-meta-item">📅 {upcoming[0].date}</div>
                  <div className="ride-meta-item">🔐 OTP: {upcoming[0].otp || 'TBD'}</div>
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <div className="empty-state-icon">🗺️</div>
                <h3>No upcoming rides</h3>
                <p>Search for available rides on your route</p>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => onNavigate('search')}>
                  Search Rides
                </button>
              </div>
            )}
          </div>

          <div className="carbon-card">
            <h3 style={{ marginBottom: 8, fontSize: 16 }}>Your Green Impact 🌍</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              Every shared ride helps reduce traffic and emissions
            </p>
            <div className="carbon-stat">
              <div className="carbon-stat-item">
               <span>{fuelSaved.toFixed(1)}L</span>
                <small>Fuel Saved</small>
              </div>
              <div className="carbon-stat-item">
                <span>{carbonSaved.toFixed(1)} kg</span>
                <small>CO₂ Reduced</small>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 20 }} onClick={() => onNavigate('carbon')}>
              View Full Report →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
