import { useEffect, useState } from 'react';
import { rideService } from '../../services/apiService';
import { useApp } from '../../context/AppContext';

export default function RideHistory() {
  const { user, addNotification } = useApp();

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRideHistory = async () => {
      try {
        const response = await rideService.getDriverRides(user.id);
        setRides(response.data || []);
      } catch (error) {
        console.error("Failed to load ride history:", error);

        addNotification({
          title: "Error",
          message: "Unable to load ride history.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadRideHistory();
    }
  }, [user]);

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Ride History 🚗</h1>
          <p>
            {loading
              ? "Loading rides..."
              : `${rides.length} rides found`}
          </p>
        </div>
      </div>

      <div className="page-content">

        <div className="card">
          <div className="section-header">
            <div>
              <h2>All Driver Rides</h2>
              <p>Your complete ride history</p>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Passengers</th>
                
                  <th>Fare</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: 30 }}>
                      Loading...
                    </td>
                  </tr>
                ) : rides.length > 0 ? (
                  rides.map((ride) => (
                    <tr key={ride.id}>

                      <td>
                        {ride.departureTime
                          ? new Date(ride.departureTime).toLocaleDateString()
                          : "-"}
                      </td>

                      <td>{ride.startAddress}</td>

                      <td>{ride.endAddress}</td>

                     <td>
  {ride.bookings
    ? ride.bookings.reduce((sum, booking) => sum + booking.seatsBooked, 0)
    : 0}
</td>

                      <td style={{ color: "var(--accent-primary)", fontWeight: 700 }}>
                        ₹{ride.estimatedFare}
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            ride.status === "COMPLETED"
                              ? "badge-success"
                              : ride.status === "PENDING"
                              ? "badge-blue"
                              : ride.status === "CANCELLED"
                              ? "badge-danger"
                              : "badge-secondary"
                          }`}
                        >
                          {ride.status}
                        </span>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: 30 }}>
                      No ride history found.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>
        </div>

      </div>
    </>
  );
}