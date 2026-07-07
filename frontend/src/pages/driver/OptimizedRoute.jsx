import { useState, useEffect, useMemo } from 'react';
import { rideService } from '../../services/apiService';
import { optimizationService } from '../../services/optimizationService';
import { useApp } from '../../context/AppContext';
import OptimizationMap from '../../components/driver/OptimizationMap';
import OptimizationStatistics from '../../components/driver/OptimizationStatistics';
import OptimizationTimeline from '../../components/driver/OptimizationTimeline';
import OptimizationSidebar from '../../components/driver/OptimizationSidebar';
import PassengerRouteCard from '../../components/driver/PassengerRouteCard';

export default function OptimizedRoute() {
  const { user, addNotification } = useApp();
  const [rides, setRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [optimized, setOptimized] = useState(false);
  const [routeData, setRouteData] = useState(null);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const response = await rideService.getDriverRides(user.id);
        const driverRides = response.data || [];
        setRides(driverRides);
        const active = driverRides.find(r => r.status === 'PENDING' || r.status === 'ONGOING') || driverRides[0];
        setSelectedRide(active);
      } catch (err) {
        console.error('Failed to load rides:', err);
        addNotification({ title: 'Failed to load rides', message: 'Could not load your rides from the server.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) {
      fetchRides();
    } else {
      setLoading(false);
    }
  }, [user?.id, addNotification]);

  const confirmedBookings = useMemo(() => {
    if (!selectedRide) return [];

    return (selectedRide.bookings || []).filter(b =>
      ['ACCEPTED', 'ONGOING'].includes(b.status)
    );
  }, [selectedRide]);
  const hasPickupStops = confirmedBookings.length > 0;

  const handleRideChange = (e) => {
    const rideId = Number(e.target.value);
    const ride = rides.find(r => r.id === rideId);
    setSelectedRide(ride);
    setOptimized(false);
    setRouteData(null);
  };

  const handleOptimize = async () => {
    if (!selectedRide || !hasPickupStops) return;

    setOptimizing(true);
    try {
      const rideData = await optimizationService.getOptimizationData(selectedRide.id).catch(() => ({
        rideId: selectedRide.id,
        origin: {
          lat: selectedRide.startLatitude,
          lon: selectedRide.startLongitude,
          address: selectedRide.startAddress,
        },
        destination: {
          lat: selectedRide.endLatitude,
          lon: selectedRide.endLongitude,
          address: selectedRide.endAddress,
        },
        acceptedRiders: confirmedBookings.map(booking => ({
          id: booking.id,
          riderId: booking.rider?.id,
          riderName: booking.rider?.user?.fullName || 'Passenger',
          pickupLat: booking.pickupLatitude,
          pickupLon: booking.pickupLongitude,
          pickupAddress: booking.pickupAddress,
          dropoffLat: booking.dropoffLatitude,
          dropoffLon: booking.dropoffLongitude,
          dropoffAddress: booking.dropoffAddress,
        })),
      }));

      const result = await optimizationService.optimizeRoute(rideData);
      setRouteData(result);
      setOptimized(true);
      addNotification({ title: 'Optimization Complete', message: 'Route optimized successfully using OR-Tools and OSRM.', type: 'success' });
    } catch (err) {
      console.error('Route optimization failed:', err);
      addNotification({ title: 'Optimization Failed', message: 'Unable to compute optimized route. Please try again.', type: 'error' });
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔄</div>
          <div style={{ color: 'var(--text-muted)' }}>Loading rides...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Smart Route Optimization 🗺️</h1>
          <p>AI-powered pickup sequencing with real road routing (OR-Tools + OSRM)</p>
        </div>
      </div>

      <div className="page-content">
        {!hasPickupStops ? (
          <div style={{
            background: 'rgba(0,212,170,0.08)',
            border: '1px solid rgba(0,212,170,0.2)',
            borderRadius: 'var(--radius-lg)',
            padding: '40px',
            textAlign: 'center',
            maxWidth: 600,
            margin: '0 auto'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h3 style={{ marginBottom: 8 }}>Route Already Optimal</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              No accepted riders yet. Once riders request and are accepted, OR-Tools will optimize the pickup sequence.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
            {/* Sidebar */}
            <OptimizationSidebar
              selectedRide={selectedRide}
              rides={rides}
              onRideChange={handleRideChange}
              onOptimize={handleOptimize}
              optimizing={optimizing}
              optimized={optimized}
              hasPickupStops={hasPickupStops}
            />

            {/* Main Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {optimized && routeData?.statistics && (
                <OptimizationStatistics statistics={routeData.statistics} />
              )}

              {optimized && routeData?.passengerSegments?.length > 0 && (
                <div className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16 }}>Passenger Route Plan</h3>
                      <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
                        Optimized pickup order based on accepted passengers only.
                      </p>
                    </div>
                  </div>
                  {routeData.passengerSegments.map((segment, index) => (
                    <PassengerRouteCard key={segment.bookingId || index} segment={segment} index={index + 1} />
                  ))}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
                {/* Map */}
                <div className="map-container" style={{ height: 500 }}>
                  <OptimizationMap
                    routeGeometry={optimized ? routeData?.routeGeometry : selectedRide?.routeGeometry}
                    optimizedWaypoints={routeData?.optimizedWaypoints}
                    origin={selectedRide ? {
                      lat: selectedRide.startLatitude,
                      lon: selectedRide.startLongitude,
                      address: selectedRide.startAddress,
                    } : null}
                    destination={selectedRide ? {
                      lat: selectedRide.endLatitude,
                      lon: selectedRide.endLongitude,
                      address: selectedRide.endAddress,
                    } : null}
                    acceptedRiders={confirmedBookings.map(booking => ({
                      id: booking.id,
                      riderName: booking.rider?.user?.fullName || 'Passenger',
                      pickupAddress: booking.pickupAddress,
                      dropoffAddress: booking.dropoffAddress,
                      dropoffLat: booking.dropoffLatitude,
                      dropoffLon: booking.dropoffLongitude,
                      fare: routeData?.passengerSegments?.find(segment => segment.bookingId === booking.id)?.fare,
                    }))}
                  />
                </div>

                {/* Timeline */}
                {optimized && routeData?.optimizedWaypoints ? (
                  <OptimizationTimeline
                    optimizedWaypoints={routeData.optimizedWaypoints}
                    acceptedRiders={confirmedBookings.map(booking => ({
                      id: booking.id,
                      riderName: booking.rider?.user?.fullName || 'Passenger',
                      pickupAddress: booking.pickupAddress,
                      dropoffAddress: booking.dropoffAddress,
                      distanceKm: routeData.passengerSegments?.find(segment => segment.bookingId === booking.id)?.distanceKm,
                      fare: routeData.passengerSegments?.find(segment => segment.bookingId === booking.id)?.fare,
                    }))}
                    routeSteps={routeData.routeSteps}
                  />
                ) : (
                  <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 500 }}>
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: 40, marginBottom: 16 }}>🗺️</div>
                      <div>Click "Run AI Optimizer" to optimize pickup sequence</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
