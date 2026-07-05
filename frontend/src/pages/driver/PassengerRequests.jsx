import { useState, useEffect } from 'react';
import { rideService } from '../../services/apiService';
import { useApp } from '../../context/AppContext';

export default function PassengerRequests({ onNavigate }) {
  const { user, addNotification } = useApp();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otpInputs, setOtpInputs] = useState({});

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const response = await rideService.getDriverRequests(user.id);
        setRequests(response.data || []);
      } catch (error) {
        console.error('Failed to load passenger requests:', error);
        addNotification({ title: 'Request load failed', message: 'Could not fetch passenger requests.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadRequests();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleAction = async (id, action) => {
    const status = action === 'accepted' ? 'ACCEPTED' : 'REJECTED';
    try {
      await rideService.updateBookingStatus(id, { status });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      const req = requests.find(r => r.id === id);
      addNotification({
        title: action === 'accepted' ? 'Request Accepted ✅' : 'Request Declined',
        message: `${req?.rider?.user?.fullName || 'Passenger'} has been ${action === 'accepted' ? 'accepted' : 'declined'}.`,
        type: action === 'accepted' ? 'success' : 'warning',
      });
    } catch (error) {
      console.error('Could not update request status:', error);
      addNotification({ title: 'Action failed', message: 'Unable to update request status.', type: 'danger' });
    }
  };

  const handleVerifyOtp = async (id) => {
    const otp = otpInputs[id];
    if (!otp || otp.length !== 4) {
      addNotification({ title: 'Invalid OTP', message: 'Please enter a valid 4-digit OTP.', type: 'error' });
      return;
    }
    try {
      await rideService.verifyOtp(id, { otp });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'ONGOING', startedAt: new Date().toISOString() } : r));
      setOtpInputs(prev => ({ ...prev, [id]: '' }));
      addNotification({ title: 'OTP verified. Ride started.', message: 'The ride has been started successfully.', type: 'success' });
    } catch (error) {
      console.error('OTP verification failed:', error);
      const errorMessage = error.response?.data?.error || 'Invalid OTP';
      addNotification({ title: 'OTP Verification Failed', message: errorMessage, type: 'error' });
    }
  };

  const handleCompleteBooking = async (id) => {
    try {
      await rideService.completeBooking(id);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'COMPLETED', completedAt: new Date().toISOString() } : r));
      addNotification({ title: 'Ride Completed', message: 'The ride has been completed successfully.', type: 'success' });
    } catch (error) {
      console.error('Could not complete booking:', error);
      addNotification({ title: 'Action failed', message: 'Unable to complete the ride.', type: 'error' });
    }
  };

  const normalized = requests.map(r => {
    const riderName = r?.rider?.user?.fullName || r?.riderName || 'Passenger';
    const avatar = riderName.charAt(0).toUpperCase();
    return {
      ...r,
      riderName,
      avatar,
      pickup: r.pickupAddress || r?.ride?.startAddress || 'Unknown pickup',
      dropoff: r.dropoffAddress || r?.ride?.endAddress || 'Unknown dropoff',
      requestedAt: r.bookedAt ? new Date(r.bookedAt).toLocaleString() : 'N/A',
      uiStatus: r.status === 'PENDING' ? 'pending' : r.status === 'ACCEPTED' ? 'accepted' : r.status === 'ONGOING' ? 'ongoing' : r.status === 'COMPLETED' ? 'completed' : 'rejected',
      riderRating: r?.rider?.averageRating || 4.8,
      matchScore: r.matchScore ?? 88,
      seats: r.seatsBooked || r.seats || 1,
      detourAdded: r.detourAdded ?? 5,
    };
  });
  const pending = normalized.filter(r => r.uiStatus === 'pending');
  const accepted = normalized.filter(r => r.uiStatus === 'accepted');
  const ongoing = normalized.filter(r => r.uiStatus === 'ongoing');
  const completed = normalized.filter(r => r.uiStatus === 'completed');
  const rejected = normalized.filter(r => r.uiStatus === 'rejected');

  const statusConfig = {
    pending: { label: 'Pending', color: 'badge-warning' },
    accepted: { label: 'Confirmed', color: 'badge-success' },
    ongoing: { label: 'Ongoing', color: 'badge-primary' },
    completed: { label: 'Completed', color: 'badge-success' },
    rejected: { label: 'Declined', color: 'badge-danger' },
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Passenger Requests 📥</h1>
          <p>{pending.length} pending, {accepted.length} confirmed, {ongoing.length} ongoing</p>
        </div>
        <div className="topbar-right">
          {pending.length > 0 && (
            <button id="view-optimized-route" className="btn btn-primary btn-sm" onClick={() => onNavigate('route')}>
              🗺️ View Optimized Route
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <h3>Loading requests…</h3>
            <p>Please wait while we fetch the latest passenger bookings.</p>
          </div>
        ) : (
          <>
            <div style={{
          background: 'linear-gradient(135deg, rgba(124,106,245,0.1), rgba(0,212,170,0.1))',
          border: '1px solid rgba(0,212,170,0.2)', borderRadius: 'var(--radius-lg)',
          padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14
        }}>
          <span style={{ fontSize: 28 }}>🤖</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>AI Ride Matching Analysis</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              Accepting all {pending.length} requests adds only <strong style={{ color: 'var(--accent-primary)' }}>9.1 km total detour</strong>.
              Estimated additional earnings: <strong style={{ color: 'var(--accent-primary)' }}>₹240</strong>
            </div>
          </div>
          <button id="accept-all" className="btn btn-primary btn-sm"
            onClick={() => {
              setRequests(prev => prev.map(r => r.status === 'PENDING' ? { ...r, status: 'ACCEPTED' } : r));
              addNotification({ title: 'All Accepted! ✅', message: 'All pending requests have been accepted.', type: 'success' });
            }}>
            Accept All
          </button>
        </div>

        {/* All Requests */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {normalized.map(req => (
            <div key={req.id} id={`req-${req.id}`} style={{
              background: 'var(--bg-card)', border: `1px solid ${
                req.uiStatus === 'accepted' ? 'rgba(0,212,170,0.3)' :
                req.uiStatus === 'rejected' ? 'rgba(245,59,110,0.2)' : 'var(--glass-border)'
              }`,
              borderRadius: 'var(--radius-lg)', padding: 20,
              transition: 'all 0.3s'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div className="request-avatar"
                  style={{ background: req.uiStatus === 'rejected' ? 'var(--glass-border)' : undefined }}>
                  {req.avatar}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <h4 style={{ fontWeight: 700 }}>{req.riderName}</h4>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>⭐ {req.riderRating}</span>
                    <span className={`badge ${statusConfig[req.uiStatus].color}`}>{statusConfig[req.uiStatus].label}</span>
                    <div className="ai-match-pill" style={{ marginLeft: 'auto', fontSize: 11 }}>
                      🤖 {req.matchScore}% match
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                    <div className="ride-route" style={{ gap: 6 }}>
                      <span className="route-dot origin" style={{ width: 8, height: 8 }} />
                      <span>{req.pickup}</span>
                      <div className="route-line" style={{ minWidth: 24 }} />
                      <span>{req.dropoff}</span>
                      <span className="route-dot dest" style={{ width: 8, height: 8 }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                    <span>💺 {req.seats} seat(s)</span>
                    <span style={{ color: req.detourAdded > '5' ? 'var(--accent-warning)' : 'var(--accent-primary)' }}>
                      📏 +{req.detourAdded} detour
                    </span>
                    <span>🕒 {req.requestedAt}</span>
                  </div>

                  {req.uiStatus === 'pending' && (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button id={`accept-${req.id}`} className="btn btn-primary btn-sm" onClick={() => handleAction(req.id, 'accepted')}>
                        ✅ Accept
                      </button>
                      <button id={`reject-${req.id}`} className="btn btn-danger btn-sm" onClick={() => handleAction(req.id, 'rejected')}>
                        ✕ Decline
                      </button>
                    </div>
                  )}

                  {req.uiStatus === 'accepted' && (
                    <div style={{ marginTop: 12, padding: 12, background: 'rgba(0,212,170,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,212,170,0.2)' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--accent-primary)' }}>
                        🔐 Enter Rider OTP to Start Ride
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <input
                          type="text"
                          placeholder="Enter 4-digit OTP"
                          value={otpInputs[req.id] || ''}
                          onChange={(e) => setOtpInputs(prev => ({ ...prev, [req.id]: e.target.value }))}
                          maxLength={4}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--glass-border)',
                            fontSize: 14,
                            letterSpacing: 4,
                            textAlign: 'center',
                            fontWeight: 700
                          }}
                        />
                        <button
                          id={`verify-otp-${req.id}`}
                          className="btn btn-primary btn-sm"
                          onClick={() => handleVerifyOtp(req.id)}
                        >
                          Verify OTP
                        </button>
                      </div>
                    </div>
                  )}

                  {req.uiStatus === 'ongoing' && (
                    <div style={{ marginTop: 12 }}>
                      <button
                        id={`complete-${req.id}`}
                        className="btn btn-success btn-sm"
                        onClick={() => handleCompleteBooking(req.id)}
                        style={{ width: '100%' }}
                      >
                        ✅ Complete Ride
                      </button>
                    </div>
                  )}

                  {req.uiStatus === 'completed' && (
                    <div style={{ marginTop: 12, padding: 12, background: 'rgba(0,212,170,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,212,170,0.2)', textAlign: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-primary)' }}>
                        ✅ Ride Completed
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {accepted.length > 0 && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button id="btn-view-route" className="btn btn-primary btn-lg" onClick={() => onNavigate('route')}>
              🗺️ View Optimized Route for {accepted.length} Passenger{accepted.length > 1 ? 's' : ''}
            </button>
          </div>
        )}
          </>
        )}
      </div>
    </>
  );
}
