import { mlService } from './apiService';
import api from './api';
import { fetchDrivingRoute } from './routingService';
import { calculateOptimizationStatistics } from './StatisticsService';

/**
 * OptimizationService - Handles complete route optimization workflow
 * 
 * Workflow:
 * 1. Fetch ride data with accepted riders from Spring Boot
 * 2. Send locations to OR-Tools for pickup sequence optimization
 * 3. Send optimized waypoints to OSRM for real road routing
 * 4. Calculate statistics based on actual route data
 */

export const optimizationService = {
  /**
   * Optimize route using OR-Tools and OSRM
   * @param {Object} rideData - Ride data with origin, destination, and accepted riders
   * @returns {Promise<Object>} Complete optimization results with route and statistics
   */
  async optimizeRoute(rideData) {
    if (rideData?.rideId) {
      try {
        const response = await api.post('/optimize-route', { rideId: rideData.rideId });
        const backendResponse = response?.data;
        if (backendResponse && Array.isArray(backendResponse.passengerSegments)) {
          return {
            ...backendResponse,
            routeGeometry: Array.isArray(backendResponse.roadPath) ? backendResponse.roadPath : [],
            routeSteps: [],
            status: 'success',
          };
        }
      } catch (error) {
        console.warn('Backend optimizer unavailable, falling back to local route optimization:', error);
      }
    }

    const { origin, destination, acceptedRiders } = rideData;

    if (!origin || !destination || !Array.isArray(acceptedRiders) || acceptedRiders.length === 0) {
      throw new Error('Optimization requires an origin, destination, and at least one accepted rider.');
    }

    const normalizedAcceptedRiders = acceptedRiders.map((rider, index) => ({
      id: rider.id ?? rider.bookingId ?? index + 1,
      riderId: rider.riderId ?? rider.bookingId ?? rider.id ?? index + 1,
      riderName: rider.riderName ?? rider.passengerName ?? 'Passenger',
      passengerName: rider.passengerName ?? rider.riderName ?? 'Passenger',
      pickupLat: rider.pickupLat ?? rider.pickupLatitude,
      pickupLon: rider.pickupLon ?? rider.pickupLng ?? rider.pickupLongitude,
      pickupAddress: rider.pickupAddress,
      dropLat: rider.dropLat ?? rider.dropoffLat ?? rider.dropLatitude,
      dropLon: rider.dropLon ?? rider.dropoffLon ?? rider.dropLongitude,
      dropAddress: rider.dropAddress ?? rider.dropoffAddress,
      dropoffAddress: rider.dropoffAddress ?? rider.dropAddress,
      roadDistanceKm: rider.roadDistanceKm ?? rider.distanceKm,
      travelTimeMinutes: rider.travelTimeMinutes ?? rider.durationMinutes,
      fare: rider.fare,
    }));

    const locations = [
      { id: 'origin', lat: origin.lat, lon: origin.lon },
      ...normalizedAcceptedRiders.map((rider) => ({
        id: `pickup-${rider.id}`,
        lat: rider.pickupLat,
        lon: rider.pickupLon,
        riderId: rider.id,
        riderName: rider.riderName,
        pickupAddress: rider.pickupAddress,
      })),
      { id: 'destination', lat: destination.lat, lon: destination.lon },
    ];

    const orToolsStartTime = performance.now();
    const orToolsResponse = await mlService.optimizeRoute({ locations });
    const orToolsEndTime = performance.now();
    const solverTimeMs = Math.round(orToolsEndTime - orToolsStartTime);

    if (orToolsResponse.data.status !== 'success') {
      throw new Error(orToolsResponse.data.message || 'OR-Tools optimization failed');
    }

    const { optimized_sequence, optimized_waypoints, solver, algorithm } = orToolsResponse.data;

    const osrmStartTime = performance.now();
    const osrmRoute = await fetchDrivingRoute(optimized_waypoints);
    const osrmEndTime = performance.now();
    const osrmResponseTimeMs = Math.round(osrmEndTime - osrmStartTime);

    const originalWaypoints = [
      { lat: origin.lat, lon: origin.lon },
      ...normalizedAcceptedRiders.map((rider) => ({ lat: rider.pickupLat, lon: rider.pickupLon })),
      { lat: destination.lat, lon: destination.lon },
    ];

    const originalRoute = await fetchDrivingRoute(originalWaypoints);

    const passengerSegments = normalizedAcceptedRiders.map((rider, index) => ({
      bookingId: rider.id,
      passengerName: rider.passengerName,
      pickupAddress: rider.pickupAddress,
      pickupLat: rider.pickupLat,
      pickupLng: rider.pickupLon,
      dropAddress: rider.dropAddress,
      dropLat: rider.dropLat,
      dropLng: rider.dropLon,
      roadDistanceKm: Math.max(1, Number(((rider.roadDistanceKm || 0) || 0).toFixed(1))),
      travelTimeMinutes: Math.max(1, Number(((rider.travelTimeMinutes || 0) || 0).toFixed(0))),
      fare: Math.max(25, Number(((rider.fare || 0) || 0).toFixed(0))),
      order: index + 1,
    }));

    const statistics = calculateOptimizationStatistics({
      originalDistanceKm: originalRoute.distanceKm,
      optimizedDistanceKm: osrmRoute.distanceKm,
      originalDurationMinutes: originalRoute.durationMinutes,
      optimizedDurationMinutes: osrmRoute.durationMinutes,
      solverTimeMs,
      osrmResponseTimeMs,
      acceptedRiders: normalizedAcceptedRiders.length,
      passengerSegments,
    });

    return {
      status: 'success',
      optimizedSequence: optimized_sequence,
      optimizedWaypoints: optimized_waypoints,
      routeGeometry: osrmRoute.geometry,
      routeSteps: osrmRoute.steps,
      passengerSegments,
      statistics,
      solver,
      algorithm,
      originalRoute: {
        distanceKm: originalRoute.distanceKm,
        durationMinutes: originalRoute.durationMinutes,
      },
      optimizedRoute: {
        distanceKm: osrmRoute.distanceKm,
        durationMinutes: osrmRoute.durationMinutes,
      },
    };
  },

  /**
   * Get optimization data for a specific ride from Spring Boot
   * @param {number} rideId - Ride ID
   * @returns {Promise<Object>} Ride data with accepted riders
   */
  async getOptimizationData(rideId) {
    const response = await api.get(`/rides/${rideId}/optimization-data`);
    return response.data;
  },
};
