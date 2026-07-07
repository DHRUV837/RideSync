package com.carpooling.service;

import com.carpooling.dto.OptimizeRouteResponse;
import com.carpooling.dto.OptimizationStatisticsDto;
import com.carpooling.dto.PassengerSegmentDto;
import com.carpooling.dto.RouteWaypointDto;
import com.carpooling.entity.Ride;
import com.carpooling.entity.RideBooking;
import com.carpooling.entity.RideStop;
import com.carpooling.repository.RideBookingRepository;
import com.carpooling.repository.RideRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RouteOptimizationService {

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private RideBookingRepository rideBookingRepository;

    @Autowired
    private MlServiceClient mlServiceClient;

    @Autowired
    private OsrmRoutingService osrmRoutingService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public OptimizeRouteResponse optimizeRide(Long rideId) {
        if (rideId == null) {
            throw new IllegalArgumentException("Ride ID is required for optimization");
        }

        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new IllegalArgumentException("Ride not found"));

        List<RideBooking> acceptedBookings = rideBookingRepository.findByRideId(rideId).stream()
                .filter(b -> b.getStatus() == RideBooking.BookingStatus.ACCEPTED || b.getStatus() == RideBooking.BookingStatus.CONFIRMED || b.getStatus() == RideBooking.BookingStatus.ONGOING)
                .collect(Collectors.toList());

        if (acceptedBookings.isEmpty()) {
            throw new IllegalArgumentException("No accepted riders available for optimization");
        }

        // DEBUG: Print driver route
        System.out.println("=== DEBUG: Driver Route ===");
        System.out.println("Origin: " + ride.getStartLatitude() + ", " + ride.getStartLongitude() + " (" + ride.getStartAddress() + ")");
        System.out.println("Driver Intermediate Stops:");
        if (ride.getStops() != null) {
            ride.getStops().stream()
                .sorted(java.util.Comparator.comparing(RideStop::getStopOrder))
                .forEach(stop -> System.out.println("  Stop " + stop.getStopOrder() + ": " + stop.getLatitude() + ", " + stop.getLongitude() + " (" + stop.getStopName() + ")"));
        } else {
            System.out.println("  No driver stops");
        }
        System.out.println("Destination: " + ride.getEndLatitude() + ", " + ride.getEndLongitude() + " (" + ride.getEndAddress() + ")");

        // DEBUG: Print accepted rider pickups
        System.out.println("=== DEBUG: Accepted Rider Pickups ===");
        for (RideBooking booking : acceptedBookings) {
            String riderName = booking.getRider() != null && booking.getRider().getUser() != null
                ? booking.getRider().getUser().getFullName()
                : "Passenger";
            System.out.println("Rider: " + riderName);
            System.out.println("  Pickup: " + booking.getPickupLatitude() + ", " + booking.getPickupLongitude() + " (" + booking.getPickupAddress() + ")");
            System.out.println("  Dropoff: " + booking.getDropoffLatitude() + ", " + booking.getDropoffLongitude() + " (" + booking.getDropoffAddress() + ")");
        }

        // Build waypoints for OR-Tools optimization (origin → rider pickups → destination)
        List<RouteWaypointDto> optimizationWaypoints = new ArrayList<>();

// Origin
        optimizationWaypoints.add(buildOriginWaypoint(ride));

// Driver intermediate stops
        if (ride.getStops() != null && !ride.getStops().isEmpty()) {
            ride.getStops().stream()
                    .sorted(Comparator.comparing(RideStop::getStopOrder))
                    .forEach(stop -> optimizationWaypoints.add(
                            new RouteWaypointDto(
                                    "driver-stop-" + stop.getId(),
                                    "driver_stop",
                                    stop.getLatitude(),
                                    stop.getLongitude(),
                                    stop.getStopName(),
                                    stop.getStopName(),
                                    null,
                                    null
                            )
                    ));
        }

// Rider pickups
        for (RideBooking booking : acceptedBookings) {
            optimizationWaypoints.add(buildPickupWaypoint(booking));
        }

// Destination
        optimizationWaypoints.add(buildDestinationWaypoint(ride));        System.out.println("===== WAYPOINTS SENT TO ML =====");
        for (RouteWaypointDto wp : optimizationWaypoints) {
            System.out.println(
                    wp.getId() + " | " +
                            wp.getType() + " | " +
                            wp.getLabel() + " | " +
                            wp.getLatitude() + "," +
                            wp.getLongitude()
            );
        }
        Map<String, Object> mlResponse = mlServiceClient.optimizeRoute(optimizationWaypoints);

        List<RouteWaypointDto> optimizedWaypoints = resolveOptimizedWaypoints(mlResponse, optimizationWaypoints);
        OptimizationStatisticsDto statistics = resolveStatistics(mlResponse, acceptedBookings.size());
        
        // Get OSRM geometry through: origin → driver stops → optimized rider pickups → destination
        List<List<Double>> roadPath = getOptimizedRouteGeometryWithDriverStops(ride, optimizedWaypoints);
        
        // DEBUG: Confirm geometry sent to frontend
        System.out.println("=== DEBUG: Geometry Sent to Frontend ===");
        System.out.println("Geometry object: roadPath (List<List<Double>>)");
        System.out.println("Number of coordinates in roadPath: " + (roadPath != null ? roadPath.size() : 0));
        System.out.println("Geometry source: OSRM response through driver stops + optimized rider pickups");
        
        List<PassengerSegmentDto> passengerSegments = buildPassengerSegments(acceptedBookings, optimizedWaypoints, ride);

        return new OptimizeRouteResponse(
                rideId,
                optimizedWaypoints,
                roadPath,
                passengerSegments,
                statistics
        );
    }

    private List<PassengerSegmentDto> buildPassengerSegments(List<RideBooking> acceptedBookings,
                                                             List<RouteWaypointDto> optimizedWaypoints,
                                                             Ride ride) {
        List<PassengerSegmentDto> segments = new ArrayList<>();
        for (RouteWaypointDto waypoint : optimizedWaypoints) {
            if (!"pickup".equals(waypoint.getType())) {
                continue;
            }

            RideBooking booking = acceptedBookings.stream()
                    .filter(candidate -> candidate.getRider() != null && candidate.getRider().getId() != null)
                    .filter(candidate -> waypoint.getRiderId() != null && waypoint.getRiderId().equals(candidate.getRider().getId()))
                    .findFirst()
                    .orElse(null);

            if (booking == null) {
                continue;
            }

            String passengerName = booking.getRider() != null && booking.getRider().getUser() != null
                    ? booking.getRider().getUser().getFullName()
                    : (waypoint.getRiderName() != null ? waypoint.getRiderName() : "Passenger");
            Double pickupLat = booking.getPickupLatitude();
            Double pickupLon = booking.getPickupLongitude();
            Double dropLat = booking.getDropoffLatitude();
            Double dropLon = booking.getDropoffLongitude();

            OsrmRoutingService.OsrmRouteSummary segmentRouteSummary = null;
            if (pickupLat != null && pickupLon != null && dropLat != null && dropLon != null) {
                segmentRouteSummary = osrmRoutingService.getRouteSummary(pickupLat, pickupLon, dropLat, dropLon);
            }

            double roadDistanceKm = segmentRouteSummary != null
                    ? segmentRouteSummary.distanceKm()
                    : calculateDistanceKm(pickupLat, pickupLon, dropLat, dropLon);
            double travelTimeMinutes = segmentRouteSummary != null
                    ? segmentRouteSummary.durationMinutes()
                    : (roadDistanceKm > 0 ? Math.round((roadDistanceKm / 35.0) * 60.0) : 0.0);
            double fare = Math.max(25.0, Math.round(roadDistanceKm * 1.5 * 10.0) / 10.0);

            segments.add(new PassengerSegmentDto(
                    booking.getId(),
                    passengerName,
                    booking.getPickupAddress(),
                    pickupLat,
                    pickupLon,
                    booking.getDropoffAddress(),
                    dropLat,
                    dropLon,
                    roadDistanceKm,
                    travelTimeMinutes,
                    fare,
                    segments.size() + 1
            ));
        }

        return segments;
    }

    private double calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        double earthRadiusKm = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }

    private List<List<Double>> getOptimizedRouteGeometryWithDriverStops(Ride ride, List<RouteWaypointDto> optimizedWaypoints) {
        try {
            // Build OSRM waypoints: origin → driver stops → optimized rider pickups → destination
            List<OsrmRoutingService.LatLon> osrmWaypoints = new ArrayList<>();
            
            // Add origin
            osrmWaypoints.add(new OsrmRoutingService.LatLon(ride.getStartLatitude(), ride.getStartLongitude()));
            
            // Add driver's planned stops (sorted by stopOrder)
            if (ride.getStops() != null) {
                ride.getStops().stream()
                    .sorted(java.util.Comparator.comparing(RideStop::getStopOrder))
                    .forEach(stop -> osrmWaypoints.add(new OsrmRoutingService.LatLon(stop.getLatitude(), stop.getLongitude())));
            }
            
            // Add optimized rider pickups (only pickup type, excluding driver stops)
            for (RouteWaypointDto wp : optimizedWaypoints) {
                if ("pickup".equals(wp.getType())) {
                    osrmWaypoints.add(new OsrmRoutingService.LatLon(wp.getLatitude(), wp.getLongitude()));
                }
            }
            
            // Add destination
            osrmWaypoints.add(new OsrmRoutingService.LatLon(ride.getEndLatitude(), ride.getEndLongitude()));
            
            // DEBUG: Print final waypoint list sent to OSRM
            System.out.println("=== DEBUG: Final OSRM Waypoint List ===");
            for (int i = 0; i < osrmWaypoints.size(); i++) {
                OsrmRoutingService.LatLon wp = osrmWaypoints.get(i);
                System.out.println("  Waypoint " + i + ": " + wp.latitude() + ", " + wp.longitude());
            }
            
            OsrmRoutingService.OsrmRouteSummary routeSummary = osrmRoutingService.getRouteSummaryThroughWaypoints(osrmWaypoints);
            
            // Parse geometry from OSRM response
            String geometryJson = routeSummary.geometry();
            if (geometryJson == null || geometryJson.isBlank()) {
                return List.of();
            }
            
            List<List<Double>> coordinates = objectMapper.readValue(geometryJson, new TypeReference<List<List<Double>>>() {});
            return coordinates;
        } catch (Exception ex) {
            // Fallback to empty list if OSRM fails
            return List.of();
        }
    }

    private RouteWaypointDto buildOriginWaypoint(Ride ride) {
        return new RouteWaypointDto(
                "start",
                "origin",
                ride.getStartLatitude(),
                ride.getStartLongitude(),
                "Ride Start",
                ride.getStartAddress(),
                null,
                null
        );
    }

    private RouteWaypointDto buildPickupWaypoint(RideBooking booking) {
        String riderName = booking.getRider() != null && booking.getRider().getUser() != null
                ? booking.getRider().getUser().getFullName()
                : "Passenger";

        return new RouteWaypointDto(
                "pickup-" + booking.getId(),
                "pickup",
                booking.getPickupLatitude(),
                booking.getPickupLongitude(),
                "Pickup " + riderName,
                booking.getPickupAddress(),
                booking.getRider() != null ? booking.getRider().getId() : null,
                riderName
        );
    }

    private RouteWaypointDto buildDestinationWaypoint(Ride ride) {
        return new RouteWaypointDto(
                "end",
                "dest",
                ride.getEndLatitude(),
                ride.getEndLongitude(),
                "Ride End",
                ride.getEndAddress(),
                null,
                null
        );
    }

    private List<RouteWaypointDto> resolveOptimizedWaypoints(Map<String, Object> mlResponse,
                                                             List<RouteWaypointDto> orderedWaypoints) {
        if (mlResponse == null) {
            return orderedWaypoints;
        }

        List<String> optimizedIds = new ArrayList<>();
        Object optimizedRouteObj = mlResponse.get("optimized_route");

        if (optimizedRouteObj instanceof List<?>) {
            for (Object item : (List<?>) optimizedRouteObj) {
                optimizedIds.add(String.valueOf(item));
            }
        }

        if (optimizedIds.isEmpty()) {
            return orderedWaypoints;
        }

        Map<String, RouteWaypointDto> waypointMap = orderedWaypoints.stream()
                .collect(Collectors.toMap(RouteWaypointDto::getId, w -> w));

        List<RouteWaypointDto> optimized = new ArrayList<>();
        for (String id : optimizedIds) {
            RouteWaypointDto waypoint = waypointMap.get(id);
            if (waypoint != null) {
                optimized.add(waypoint);
            }
        }

        return optimized.isEmpty() ? orderedWaypoints : optimized;
    }

    private OptimizationStatisticsDto resolveStatistics(Map<String, Object> mlResponse, int acceptedRiders) {
        if (mlResponse == null) {
            return null;
        }

        Map<String, Object> rawStats = objectMapper.convertValue(
                mlResponse.getOrDefault("statistics", Map.of()),
                new TypeReference<>() {}
        );

        double originalDistance = extractDouble(rawStats.get("original_distance_km"));
        double optimizedDistance = extractDouble(rawStats.get("optimized_distance_km"));
        double distanceSaved = extractDouble(rawStats.get("distance_saved_km"));
        double distanceSavedPercent = extractDouble(rawStats.get("distance_saved_percent"));
        double fuelSaved = extractDouble(rawStats.get("fuel_saved_liters"));
        double moneySaved = extractDouble(rawStats.get("money_saved_rupees"));
        double timeSaved = extractDouble(rawStats.get("time_saved_minutes"));
        double estimatedDuration = extractDouble(rawStats.get("estimated_duration_minutes"));
        Object optimizationTimeObj = rawStats.get("optimization_time_ms");

        long optimizationTime =
                optimizationTimeObj instanceof Number
                        ? ((Number) optimizationTimeObj).longValue()
                        : 0L;
        System.out.println(rawStats);
        String solver = String.valueOf(rawStats.getOrDefault("solver", "Google OR-Tools"));
        String algorithm = String.valueOf(rawStats.getOrDefault("algorithm", "PATH_CHEAPEST_ARC"));

        return new OptimizationStatisticsDto(
                round(originalDistance),
                round(optimizedDistance),
                round(distanceSaved),
                round(distanceSavedPercent),
                round(fuelSaved),
                round(moneySaved),
                round(timeSaved),
                round(estimatedDuration),
                solver,
                algorithm,
                optimizationTime,
                acceptedRiders,
                acceptedRiders
        );
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private double extractDouble(Object value) {
        if (value == null) {
            return 0.0;
        }
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        try {
            return Double.parseDouble(value.toString());
        } catch (Exception ex) {
            return 0.0;
        }
    }
}
