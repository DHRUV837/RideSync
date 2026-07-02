import { useState, useEffect } from 'react';
import { rideService ,ratingService} from '../../services/apiService';
import { useApp } from '../../context/AppContext';

export default function DriverHome({ onNavigate }) {
  const { user, addNotification } = useApp();
  const [isOnline, setIsOnline] = useState(true);
  const [rides, setRides] = useState([]);
  const [requests, setRequests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingRideId, setCancellingRideId] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const firstName = user?.name?.split(' ')[0] || 'Driver';
  const pending = requests.filter(r => r.status?.toLowerCase() === 'pending');
  const weekTotal = analytics?.totalThisWeek ?? 0;
  const activeRides = rides.filter(r => r.status === 'PENDING').length;
  const averageRating = analytics?.averageRating || 4.8;
  const totalRatings = analytics?.totalRatings || 0;
  const recentReviews = analytics?.recentReviews ?? [];
  console.log("Analytics:", analytics);
console.log("Recent Reviews:", recentReviews);
  useEffect(() => {
    const loadDriverData = async () => {
      try {
        const [ridesRes, requestsRes, analyticsRes, ratingsRes] = await Promise.allSettled([
          rideService.getDriverRides(user.id),
          rideService.getDriverRequests(user.id),
          rideService.getDriverAnalytics(user.id),
          ratingService.getDriverRatings(user.id),
        ]);

        if (ridesRes.status === 'fulfilled') setRides(ridesRes.value.data || []);
        if (requestsRes.status === 'fulfilled') setRequests(requestsRes.value.data || []);
        if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data || null);
        if (ratingsRes.status === 'fulfilled') setRatings(ratingsRes.value.data || []);

        // Only show toast if all three failed
        if (ridesRes.status === 'rejected' && requestsRes.status === 'rejected') {
          console.error('Failed to load driver data:', ridesRes.reason);
          addNotification({ title: 'Could not load dashboard', message: 'Unable to fetch driver data from the server.', type: 'error' });
        }
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadDriverData();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const toggleOnline = () => {
    setIsOnline(v => !v);
    addNotification({
      title: isOnline ? 'You are Offline' : 'You are Online 🟢',
      message: isOnline ? 'You won\'t receive new ride requests.' : 'Passengers can now find and book your rides.',
      type: isOnline ? 'warning' : 'success',
    });
  };

  const handleCancelRide = async () => {
    if (!cancelModal) return;

    setCancellingRideId(cancelModal.id);
    try {
      await rideService.cancelRide(cancelModal.id);

      setRides(prev => prev.map(r =>
        r.id === cancelModal.id ? { ...r, status: 'CANCELLED' } : r
      ));

      setCancelModal(null);
      addNotification({
        title: 'Ride Cancelled',
        message: 'Your ride has been cancelled successfully.',
        type: 'success'
      });
    } catch (error) {
      console.error('Error cancelling ride:', error);
      const errorMessage = error.response?.data?.error || 'Could not cancel ride';
      addNotification({
        title: 'Cancellation Failed',
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setCancellingRideId(null);
    }
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Hey {firstName} 🚗</h1>
          <p>Manage your rides and earnings</p>
        </div>
        <div className="topbar-right">
          <div className="driver-status-toggle">
            <span style={{ fontSize: 13, fontWeight: 600, color: isOnline ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
              {isOnline ? '🟢 Online' : '⚫ Offline'}
            </span>
            <div className={`toggle-switch ${isOnline ? 'on' : ''}`} onClick={toggleOnline} role="switch" aria-checked={isOnline}>
              <div className="toggle-knob" />
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => onNavigate('create')}>
            ➕ Create Ride
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="stats-grid stagger">
          <div className="stat-card green">
            <div className="stat-icon green">💰</div>
            <div className="stat-value">₹{weekTotal.toLocaleString()}</div>
            <div className="stat-label">This Week</div>
            <div className="stat-change up">↑ 16% vs last week</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-icon purple">🚗</div>
            <div className="stat-value">{loading ? '…' : rides.length}</div>
            <div className="stat-label">Your Rides</div>
            <div className="stat-change up">{loading ? 'Loading…' : `${activeRides} upcoming`}</div>
          </div>
          <div className="stat-card blue">
            <div className="stat-icon blue">📥</div>
            <div className="stat-value">{pending.length}</div>
            <div className="stat-label">Pending Requests</div>
            <div className="stat-change up">{pending.length ? 'Needs review' : 'All clear'}</div>
          </div>
          <div className="stat-card orange">
            <div className="stat-icon orange">⭐</div>
            <div className="stat-value">{loading ? '…' : averageRating.toFixed(1)}</div>
            <div className="stat-label">Driver Rating</div>
            <div className="stat-change up">{loading ? 'Loading…' : `${totalRatings} reviews`}</div>
          </div>
        </div>

        {pending.length > 0 && (
          <div className="alert-banner warning animate-fadeInUp">
            <span className="alert-banner-icon">📥</span>
            <div className="alert-banner-body">
              <strong>{pending.length} passenger request{pending.length > 1 ? 's' : ''} waiting</strong>
              <p>Review and accept to maximize your earnings with minimal detour</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => onNavigate('requests')}>
              Review Requests
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div className="card">
            <div className="section-header">
              <div>
                <h2>Recent Rides</h2>
                <p>Your latest completed trips</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('earnings')}>View All</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(loading ? Array.from({ length: 4 }) : rides.slice(0, 4)).map((ride, index) => (
                <div key={ride?.id ?? `placeholder-${index}`} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--glass-border)',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {ride ? new Date(ride.departureTime).toLocaleDateString() : 'Loading...'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {ride ? `${ride.availableSeats} seats • ${ride.startAddress} → ${ride.endAddress}` : 'Fetching rides...'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>
                      {ride ? `₹${ride.estimatedFare}` : '—'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span className={`badge ${
                        ride?.status === 'PENDING' ? 'badge-primary' :
                        ride?.status === 'CANCELLED' ? 'badge-danger' :
                        ride?.status === 'ONGOING' ? 'badge-warning' :
                        'badge-success'
                      }`}>
                        {ride?.status || 'Loading'}
                      </span>
                      {ride && ride.status === 'PENDING' && ride.status !== 'CANCELLED' && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setCancelModal(ride)}
                          disabled={cancellingRideId === ride.id}
                          style={{ padding: '4px 8px', fontSize: 11 }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

         <div className="card card-gradient">
  <div className="section-header">
    <div>
      <h2>Recent Reviews</h2>
      <p>Latest feedback from passengers</p>
    </div>
  </div>

  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    {recentReviews.length > 0 ? (
      recentReviews.slice(0, 5).map((review, index) => (
        <div
          key={index}
          style={{
            padding: '12px 14px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
            }}
          >
            <strong>{review.riderName}</strong>

            <span
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              {review.date}
            </span>
          </div>

          <div style={{ fontSize: 14, marginBottom: 6 }}>
            {'⭐'.repeat(review.rating)}
          </div>

          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              fontStyle: 'italic',
            }}
          >
            {review.review && review.review.trim() !== ''
              ? `"${review.review}"`
              : 'No written review'}
          </div>
        </div>
      ))
    ) : (
      <div
        style={{
          padding: '20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}
      >
        No reviews yet
      </div>
    )}
  </div>
</div>
        </div>
      </div>

      {/* Cancel Ride Confirmation Modal */}
      {cancelModal && (
        <div className="modal-overlay" onClick={() => setCancelModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cancel Ride</h3>
              <button className="modal-close" onClick={() => setCancelModal(null)}>✕</button>
            </div>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
              <h4 style={{ marginBottom: 8 }}>Are you sure you want to cancel this ride?</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
                {cancelModal.startAddress} → {cancelModal.endAddress}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setCancelModal(null)}
                  style={{ minWidth: 120 }}
                >
                  Keep Ride
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleCancelRide}
                  disabled={cancellingRideId === cancelModal.id}
                  style={{ minWidth: 120, opacity: cancellingRideId === cancelModal.id ? 0.6 : 1 }}
                >
                  {cancellingRideId === cancelModal.id ? 'Cancelling...' : 'Cancel Ride'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
