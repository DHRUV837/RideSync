package com.carpooling.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RouteMatchingService {

    /**
     * Check if a rider's route matches the driver's route with direction validation.
     * Returns true only if:
     * 1. Both pickup and destination are near the route
     * 2. Pickup occurs before destination along the route
     * 3. Rider travels in the same direction as the driver
     */
    public boolean isRouteMatch(double pickupLat, double pickupLon, double destinationLat, double destinationLon,
                                String routeGeometryJson, double maxDistanceKm) {
        List<double[]> route = parseGeometry(routeGeometryJson);

        System.out.println("Route points parsed = " + route.size());

        int pickupIndex = findNearestPointIndex(pickupLat, pickupLon, route, maxDistanceKm);
        int destinationIndex = findNearestPointIndex(destinationLat, destinationLon, route, maxDistanceKm);

        System.out.println("Pickup Index = " + pickupIndex);
        System.out.println("Destination Index = " + destinationIndex);

        if (pickupIndex == -1 || destinationIndex == -1) {
            System.out.println("FAILED: Could not find pickup or destination on route");
            return false;
        }

        if (pickupIndex >= destinationIndex) {
            System.out.println("FAILED: Pickup comes after destination");
            return false;
        }

        double riderBearing = calculateBearing(
                pickupLat, pickupLon,
                destinationLat, destinationLon);

        double routeBearing = calculateRouteBearing(
                route,
                pickupIndex,
                destinationIndex);

        System.out.println("Rider Bearing = " + riderBearing);
        System.out.println("Route Bearing = " + routeBearing);

        double bearingDifference = Math.abs(normalizeAngle(riderBearing - routeBearing));

        System.out.println("Bearing Difference = " + Math.toDegrees(bearingDifference));

        if (bearingDifference > Math.PI / 4) {
            System.out.println("FAILED: Bearing mismatch");
            return false;
        }

        System.out.println("MATCH SUCCESS");
        return true;
    }

    /**
     * Find the index of the nearest point on the route within maxDistanceKm.
     * Returns -1 if no point is within the threshold.
     */
    private int findNearestPointIndex(double lat, double lon, List<double[]> route, double maxDistanceKm) {
        int nearestIndex = -1;
        double minDistance = maxDistanceKm;

        for (int i = 0; i < route.size(); i++) {
            double[] point = route.get(i);
            double distance = distanceKm(lat, lon, point[1], point[0]);
            if (distance < minDistance) {
                minDistance = distance;
                nearestIndex = i;
            }
        }

        return nearestIndex;
    }

    /**
     * Calculate the average bearing of the route segment between two indices.
     */
    private double calculateRouteBearing(List<double[]> route, int startIndex, int endIndex) {
        if (startIndex >= endIndex || startIndex < 0 || endIndex >= route.size()) {
            return 0;
        }

        // Calculate bearing from start to end of segment
        double[] start = route.get(startIndex);
        double[] end = route.get(endIndex);
        return calculateBearing(start[1], start[0], end[1], end[0]);
    }

    /**
     * Calculate bearing between two points in radians.
     */
    private double calculateBearing(double lat1, double lon1, double lat2, double lon2) {
        double dLon = Math.toRadians(lon2 - lon1);
        lat1 = Math.toRadians(lat1);
        lat2 = Math.toRadians(lat2);

        double y = Math.sin(dLon) * Math.cos(lat2);
        double x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        
        return Math.atan2(y, x);
    }

    /**
     * Normalize angle to range [-π, π].
     */
    private double normalizeAngle(double angle) {
        while (angle > Math.PI) {
            angle -= 2 * Math.PI;
        }
        while (angle < -Math.PI) {
            angle += 2 * Math.PI;
        }
        return angle;
    }

    private List<double[]> parseGeometry(String routeGeometryJson) {
        List<double[]> points = new ArrayList<>();
        String content = routeGeometryJson.replace("\n", "").trim();

        if (!content.startsWith("[") || !content.endsWith("]")) {
            return points;
        }

        String body = content.substring(1, content.length() - 1).trim();
        if (body.isEmpty()) {
            return points;
        }

        String[] segments = body.split("],");
        for (String segment : segments) {
            String cleaned = segment.replace("[", "").replace("]", "").trim();
            if (cleaned.isEmpty()) {
                continue;
            }
            String[] values = cleaned.split(",");
            if (values.length >= 2) {
                try {
                    points.add(new double[]{Double.parseDouble(values[0].trim()), Double.parseDouble(values[1].trim())});
                } catch (NumberFormatException ignored) {
                }
            }
        }

        return points;
    }

    private double distanceKm(double lat1, double lon1, double lat2, double lon2) {
        double earthRadiusKm = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }
}
