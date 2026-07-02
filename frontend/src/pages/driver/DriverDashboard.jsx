import { useState, useEffect } from 'react'
import { rideService, ratingService } from '../../services/apiService'
import '../../styles/driver.css'

export default function DriverDashboard({ user }) {
  console.log('DriverDashboard rendered with user:', user)
  const [activeTab, setActiveTab] = useState('create')
  const [isOnline, setIsOnline] = useState(false)
  const [myRides, setMyRides] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    startAddress: '',
    endAddress: '',
    departureTime: '',
    estimatedFare: '',
    availableSeats: 1,
  })

  useEffect(() => {
    console.log('useEffect triggered, user.id:', user?.id)
    const loadAnalytics = async () => {
      try {
        const response = await rideService.getDriverAnalytics(user.id)
        setAnalytics(response.data)
      } catch (error) {
        console.error('Error loading analytics:', error)
      }
    }
    const loadRatings = async () => {
      try {
        console.log('Loading ratings for driver ID:', user.id)
        const response = await ratingService.getDriverRatings(user.id)
        console.log('Ratings response:', response.data)
        setRatings(response.data || [])
      } catch (error) {
        console.error('Error loading ratings:', error)
      }
    }
    if (user?.id) {
      loadAnalytics()
      loadRatings()
    }
  }, [user?.id])

  const handleCreateRide = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await rideService.createRide({
        startLatitude: 22.55,
        startLongitude: 72.93,
        startAddress: formData.startAddress,
        endLatitude: 23.03,
        endLongitude: 72.58,
        endAddress: formData.endAddress,
        availableSeats: Number(formData.availableSeats),
        estimatedFare: Number(formData.estimatedFare),
        departureTime: formData.departureTime,
      })
      alert('Ride created successfully!')
      setFormData({
        startAddress: '',
        endAddress: '',
        departureTime: '',
        estimatedFare: '',
        availableSeats: 1,
      })
    } catch (error) {
      console.error('Error creating ride:', error)
      alert('Failed to create ride. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFetchMyRides = async () => {
    setLoading(true)
    try {
      const response = await rideService.getDriverRides(user.id)
      setMyRides(response.data)
    } catch (error) {
      console.error('Error fetching rides:', error)
      alert('Failed to fetch rides.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          ➕ Create Ride
        </button>
        <button
          className={`tab-btn ${activeTab === 'rides' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('rides')
            handleFetchMyRides()
          }}
        >
          🚗 My Rides
        </button>
        <button
          className={`tab-btn ${activeTab === 'earnings' ? 'active' : ''}`}
          onClick={() => setActiveTab('earnings')}
        >
          💰 Earnings
        </button>
        <button
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          📞 Requests
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'create' && (
          <div className="create-ride-section">
            <h2>Create a New Ride</h2>
            <form onSubmit={handleCreateRide} className="create-form">
              <div className="form-row">
                <div className="form-group">
                  <label>📍 Start Location</label>
                  <input
                    type="text"
                    placeholder="Enter pickup location"
                    value={formData.startAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, startAddress: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>📍 End Location</label>
                  <input
                    type="text"
                    placeholder="Enter dropoff location"
                    value={formData.endAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, endAddress: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>⏰ Departure Time</label>
                  <input
                    type="datetime-local"
                    value={formData.departureTime}
                    onChange={(e) =>
                      setFormData({ ...formData, departureTime: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>💵 Estimated Fare (₹)</label>
                  <input
                    type="number"
                    placeholder="Enter fare"
                    value={formData.estimatedFare}
                    onChange={(e) =>
                      setFormData({ ...formData, estimatedFare: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>🪑 Available Seats</label>
                  <select
                    value={formData.availableSeats}
                    onChange={(e) =>
                      setFormData({ ...formData, availableSeats: parseInt(e.target.value) })
                    }
                  >
                    <option value={1}>1 seat</option>
                    <option value={2}>2 seats</option>
                    <option value={3}>3 seats</option>
                    <option value={4}>4 seats</option>
                  </select>
                </div>
                <button type="submit" className="create-btn" disabled={loading}>
                  {loading ? '🔄 Creating...' : '✅ Create Ride'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Recent Reviews Section - Always visible on dashboard */}
        <div style={{ marginTop: 30 }}>
          <h2>⭐ Recent Reviews</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {ratings.length > 0 ? (
              ratings.slice(0, 5).map((rating) => (
                <div key={rating.id} style={{
                  padding: '16px',
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--glass-border)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ fontSize: 18 }}>
                      {'⭐'.repeat(rating.rating)}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(rating.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {rating.review && (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      "{rating.review}"
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }}>
                No reviews yet
              </div>
            )}
          </div>
        </div>

        {activeTab === 'rides' && (
          <div className="rides-section">
            <h2>My Rides</h2>
            <div className="rides-grid">
              {myRides.length > 0 ? (
                myRides.map((ride) => (
                  <div key={ride.id} className="ride-card">
                    <div className="ride-header">
                      <h3>🚗 {ride.startAddress}</h3>
                      <span className="status-badge">📍 Active</span>
                    </div>
                    <p className="ride-route">→ {ride.endAddress}</p>
                    <div className="ride-details">
                      <span>⏰ {new Date(ride.departureTime).toLocaleString()}</span>
                      <span>🪑 {ride.availableSeats} seats available</span>
                    </div>
                    <div className="ride-footer">
                      <span className="ride-fare">₹{ride.estimatedFare}</span>
                      <button className="manage-btn">Manage</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No active rides. Create one to get started!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="earnings-section">
            <h2>💰 Your Earnings</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>This Week</h3>
                <p className="stat-value">₹2,360</p>
              </div>
              <div className="stat-card">
                <h3>This Month</h3>
                <p className="stat-value">₹8,920</p>
              </div>
              <div className="stat-card">
                <h3>Total Rides</h3>
                <p className="stat-value">47</p>
              </div>
              <div className="stat-card">
                <h3>Avg Rating</h3>
                <p className="stat-value">⭐ {analytics?.averageRating?.toFixed(1) || '0.0'}</p>
              </div>
            </div>

            <div style={{ marginTop: 30 }}>
              <h2>⭐ Recent Reviews</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                {console.log('Rendering ratings:', ratings)}
                {ratings.length > 0 ? (
                  ratings.slice(0, 5).map((rating) => (
                    <div key={rating.id} style={{
                      padding: '16px',
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--glass-border)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{ fontSize: 18 }}>
                          {'⭐'.repeat(rating.rating)}
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {new Date(rating.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {rating.review && (
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          "{rating.review}"
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }}>
                    No reviews yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="requests-section">
            <h2>📞 Passenger Requests</h2>
            <div className="empty-state">
              <p>No pending requests. Go online to receive bookings!</p>
            </div>
            <div style={{ marginTop: 20 }}>
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={`online-btn ${isOnline ? 'active' : ''}`}
              >
                {isOnline ? '🟢 Go Offline' : '⚪ Go Online'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
