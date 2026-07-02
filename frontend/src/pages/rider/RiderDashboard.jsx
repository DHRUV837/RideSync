import { useState } from 'react'
import { rideService } from '../../services/apiService'
import '../../styles/rider.css'

export default function RiderDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('search')
  const [rides, setRides] = useState([])
  const [searchFilters, setSearchFilters] = useState({
    pickup: '',
    dropoff: '',
    date: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSearchRides = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await rideService.getAvailableRides()
      setRides(response.data)
    } catch (error) {
      console.error('Error fetching rides:', error)
      alert('Failed to fetch rides. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Search Rides
        </button>
        <button
          className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          📋 My Bookings
        </button>
        <button
          className={`tab-btn ${activeTab === 'carbon' ? 'active' : ''}`}
          onClick={() => setActiveTab('carbon')}
        >
          🌱 Carbon Savings
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'search' && (
          <div className="search-section">
            <h2>Search Available Rides</h2>
            <form onSubmit={handleSearchRides} className="search-form">
              <div className="form-row">
                <div className="form-group">
                  <label>📍 Pickup Location</label>
                  <input
                    type="text"
                    placeholder="Enter pickup location"
                    value={searchFilters.pickup}
                    onChange={(e) =>
                      setSearchFilters({ ...searchFilters, pickup: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>📍 Dropoff Location</label>
                  <input
                    type="text"
                    placeholder="Enter dropoff location"
                    value={searchFilters.dropoff}
                    onChange={(e) =>
                      setSearchFilters({ ...searchFilters, dropoff: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>📅 Date</label>
                  <input
                    type="date"
                    value={searchFilters.date}
                    onChange={(e) =>
                      setSearchFilters({ ...searchFilters, date: e.target.value })
                    }
                  />
                </div>
                <button type="submit" className="search-btn" disabled={loading}>
                  {loading ? '🔄 Searching...' : '🔍 Search'}
                </button>
              </div>
            </form>

            <div className="rides-grid">
              {rides.length > 0 ? (
                rides.map((ride) => (
                  <div key={ride.id} className="ride-card">
                    <div className="ride-header">
                      <h3>🚗 {ride.startAddress}</h3>
                      <span className="ride-fare">₹{ride.estimatedFare}</span>
                    </div>
                    <p className="ride-route">→ {ride.endAddress}</p>
                    <div className="ride-details">
                      <span>⏰ {new Date(ride.departureTime).toLocaleString()}</span>
                      <span>🪑 {ride.availableSeats} seats</span>
                    </div>
                    <button className="book-btn">Book Now</button>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No rides available. Try searching!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bookings-section">
            <h2>My Bookings</h2>
            <div className="empty-state">
              <p>No bookings yet. Search and book a ride!</p>
            </div>
          </div>
        )}

        {activeTab === 'carbon' && (
          <div className="carbon-section">
            <h2>🌱 Your Carbon Savings</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Fuel Saved</h3>
                <p className="stat-value">12.5 L</p>
              </div>
              <div className="stat-card">
                <h3>CO₂ Reduced</h3>
                <p className="stat-value">65 kg</p>
              </div>
              <div className="stat-card">
                <h3>Money Saved</h3>
                <p className="stat-value">₹2,500</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

