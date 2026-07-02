package com.carpooling.service;

import com.carpooling.dto.OptimizeRouteResponse;
import com.carpooling.dto.OptimizationStatisticsDto;
import com.carpooling.dto.PassengerSegmentDto;
import com.carpooling.dto.RouteWaypointDto;
import com.carpooling.entity.Ride;
import com.carpooling.entity.RideBooking;
import com.carpooling.repository.RideBookingRepository;
import com.carpooling.repository.RideRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
                .filter(b -> b.getStatus() == RideBooking.BookingStatus.CONFIRMED || b.getStatus() == RideBooking.BookingStatus.ONGOING)
                .collect(Collectors.toList());

        if (acceptedBookings.isEmpty()) {
            throw new IllegalArgumentException("No accepted riders available for optimization");
        }

        List<RouteWaypointDto> waypoints = new ArrayList<>();
        waypoints.add(buildOriginWaypoint(ride));
        for (RideBooking booking : acceptedBookings) {
            waypoints.add(buildPickupWaypoint(booking));
        }
        waypoints.add(buildDestinationWaypoint(ride));

        Map<String, Object> mlResponse = mlServiceClient.optimizeRoute(waypoints);

        List<RouteWaypointDto> optimizedWaypoints = resolveOptimizedWaypoints(mlResponse, waypoints);
        OptimizationStatisticsDto statistics = resolveStatistics(mlResponse, acceptedBookings.size());
        List<List<Double>> roadPath = extractRoadPath(mlResponse);
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

    private List<List<Double>> extractRoadPath(Map<String, Object> mlResponse) {
        if (mlResponse == null) {
            return List.of();
        }
        Object roadPathObj = mlResponse.get("road_path");
        if (!(roadPathObj instanceof List<?>)) {
            return List.of();
        }
        List<List<Double>> roadPath = new ArrayList<>();
        for (Object segment : (List<?>) roadPathObj) {
            if (segment instanceof List<?>) {
                List<?> point = (List<?>) segment;
                if (point.size() >= 2 && point.get(0) instanceof Number && point.get(1) instanceof Number) {
                    roadPath.add(List.of(
                            ((Number) point.get(0)).doubleValue(),
                            ((Number) point.get(1)).doubleValue()
                    ));
                }
            }
        }
        return roadPath;
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
        long optimizationTime = rawStats.getOrDefault("optimization_time_ms", 0L) instanceof Number ? ((Number) rawStats.get("optimization_time_ms")).longValue() : 0L;
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
