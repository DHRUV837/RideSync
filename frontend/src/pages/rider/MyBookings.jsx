import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { rideService, ratingService } from '../../services/apiService';
import ComplaintModal from '../../components/ComplaintModal';

export default function MyBookings() {
  const { addNotification } = useApp();
  const [filter, setFilter] = useState('all');
  const [ratingModal, setRatingModal] = useState(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [complaintModal, setComplaintModal] = useState(null);
  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const response = await rideService.getMyBookings();
        const raw = response.data || [];
        const normalized = raw.map((booking) => {
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
            status: status === 'completed' ? 'completed' : status === 'cancelled' ? 'cancelled' : status === 'rejected' ? 'rejected' : status === 'accepted' ? 'accepted' : 'upcoming',
            otp: booking.otp || null,
            rating: booking.rating || null,
          };
        });
        setBookings(normalized);
      } catch (error) {
        console.error('Error loading bookings:', error);
        addNotification({ title: 'Could not load bookings', message: 'Please try again later.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  const statusColors = {
    completed: 'badge-success',
    upcoming: 'badge-blue',
    accepted: 'badge-success',
    cancelled: 'badge-danger',
    rejected: 'badge-danger',
  };

  const submitRating = async () => {
  try {
    await ratingService.submitRating({
      bookingId: ratingModal.id,
      rating: rating,
      review: review
    });

    setBookings(prev =>
      prev.map(b =>
        b.id === ratingModal.id
          ? { ...b, rating: rating, review: review }
          : b
      )
    );

    setRatingModal(null);
    setRating(5);
    setReview('');

    addNotification({
      title: 'Rating Submitted ⭐',
      message: `You gave ${rating} stars to your driver.`,
      type: 'success'
    });

  } catch (error) {

    console.error("Error submitting rating:", error);
    console.log("Status:", error.response?.status);
    console.log("Response:", error.response?.data);

    const errorMessage =
      error.response?.data?.error || "Could not submit rating";

    addNotification({
      title: "Rating Failed",
      message: errorMessage,
      type: "error"
    });
  }
};

  const handleCancelBooking = async () => {
    if (!cancelModal) return;

    setCancellingId(cancelModal.id);
    try {
      await rideService.cancelBooking(cancelModal.id);

      setBookings(prev =>
        prev.map(b =>
          b.id === cancelModal.id
            ? { ...b, status: 'cancelled' }
            : b
        )
      );

      setCancelModal(null);
      addNotification({
        title: 'Booking Cancelled',
        message: 'Your booking has been cancelled successfully.',
        type: 'success'
      });
    } catch (error) {
      console.error('Error cancelling booking:', error);
      const errorMessage = error.response?.data?.error || 'Could not cancel booking';
      addNotification({
        title: 'Cancellation Failed',
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h1>My Bookings 🎫</h1>
          <p>{loading ? 'Loading bookings...' : `${bookings.length} total bookings`}</p>
        </div>
      </div>

      <div className="page-content">
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['all', 'upcoming', 'completed'].map(f => (
            <button key={f} id={`filter-${f}`}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(f)}
              style={{ textTransform: 'capitalize' }}>
              {f === 'all' ? '📋 All' : f === 'upcoming' ? '⏰ Upcoming' : '✅ Completed'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(booking => (
            <div key={booking.id} className="card animate-fadeInUp" id={`booking-${booking.id}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div className="ride-route">
                  <span className="route-dot origin" />
                  <span style={{ fontWeight: 700 }}>{booking.origin}</span>
                  <div className="route-line" style={{ minWidth: 40 }} />
                  <span style={{ fontWeight: 700 }}>{booking.destination}</span>
                  <span className="route-dot dest" />
                </div>
                <span className={`badge ${statusColors[booking.status]}`}>
                  {booking.status}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                <span>🚗 {booking.driverName}</span>
                <span>📅 {booking.date}</span>
                <span>💺 {booking.seats} seat(s)</span>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>₹{booking.amount}</span>
              </div>

              {/* Cancel button for upcoming or accepted bookings */}
              {(booking.status === 'upcoming' || booking.status === 'accepted') && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <button
  className="btn btn-warning btn-sm"
  onClick={() => setComplaintModal(booking)}
>
  🚨 Report Driver
</button>
                  <button
                    id={`cancel-${booking.id}`}
                    className="btn btn-danger btn-sm"
                    onClick={() => setCancelModal(booking)}
                    disabled={cancellingId === booking.id}
                    style={{ opacity: cancellingId === booking.id ? 0.6 : 1 }}
                  >
                    {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                </div>
              )}

              {/* OTP for accepted rides */}
              {booking.status === 'accepted' && (
                <div style={{
                  background: 'var(--accent-primary-dim)',
                  border: '1px solid rgba(0,212,170,0.3)',
                  borderRadius: 'var(--radius-md)', padding: 16,
                  marginBottom: 16, textAlign: 'center'
                }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                    🔐 Share this OTP with your driver to start the ride
                  </div>
                  <div className="otp-display">
                  {(booking.otp || '----').split('').map((d, i) => (
                      <div key={i} className="otp-digit">{d}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rating for completed */}
              {booking.status === 'completed' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {booking.rating ? (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      <div style={{ marginBottom: 4 }}>
                        {'⭐'.repeat(booking.rating)}
                      </div>
                      {booking.review && (
                        <div style={{ fontStyle: 'italic', fontSize: 12 }}>
                          "{booking.review}"
                        </div>
                      )}
                    </div>
                  ) : (
                    <button id={`rate-${booking.id}`} className="btn btn-secondary btn-sm"
                      onClick={() => setRatingModal(booking)}>
                      ⭐ Rate Driver
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm">📋 View Details</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🎫</div>
            <h3>No bookings found</h3>
            <p>Your ride history will appear here</p>
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {ratingModal && (
        <div className="modal-overlay" onClick={() => setRatingModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Rate Your Driver</h3>
              <button className="modal-close" onClick={() => setRatingModal(null)}>✕</button>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>
                <div className="sidebar-avatar" style={{ width: 60, height: 60, fontSize: 24, margin: '0 auto 8px' }}>
                  {ratingModal.driverName[0]}
                </div>
              </div>
              <h4 style={{ marginBottom: 4 }}>{ratingModal.driverName}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
                {ratingModal.origin} → {ratingModal.destination}
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} id={`star-${s}`}
                    onClick={() => setRating(s)}
                    style={{
                      fontSize: 36, background: 'none', border: 'none', cursor: 'pointer',
                      opacity: s <= rating ? 1 : 0.3, transition: 'opacity 0.15s'
                    }}>⭐</button>
                ))}
              </div>
              <div className="input-group" style={{ marginBottom: 20 }}>
                <textarea id="review-text" className="input-field" rows={3}
                  placeholder="Write a review (optional)..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  style={{ resize: 'none' }} />
              </div>
              <button id="submit-rating" className="btn btn-primary btn-full" onClick={submitRating}>
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModal && (
        <div className="modal-overlay" onClick={() => setCancelModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cancel Booking</h3>
              <button className="modal-close" onClick={() => setCancelModal(null)}>✕</button>
            </div>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
              <h4 style={{ marginBottom: 8 }}>Are you sure you want to cancel this booking?</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
                {cancelModal.origin} → {cancelModal.destination}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setCancelModal(null)}
                  style={{ minWidth: 120 }}
                >
                  Keep Booking
                </button>
                <button
                  id="confirm-cancel"
                  className="btn btn-danger"
                  onClick={handleCancelBooking}
                  disabled={cancellingId === cancelModal.id}
                  style={{ minWidth: 120, opacity: cancellingId === cancelModal.id ? 0.6 : 1 }}
                >
                  {cancellingId === cancelModal.id ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ComplaintModal
  open={complaintModal !== null}
  onClose={() => setComplaintModal(null)}
  respondentId={complaintModal?.ride?.driver?.user?.id}
  respondentName={complaintModal?.ride?.driver?.user?.fullName}
  rideId={complaintModal?.ride?.id}
/>
    </>
  );
}
