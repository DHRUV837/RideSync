package com.carpooling.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RouteMatchingService {

    public boolean isPickupNearRoute(double pickupLat, double pickupLon, String routeGeometryJson, double maxDistanceKm) {
        if (routeGeometryJson == null || routeGeometryJson.isBlank()) {
            return false;
        }

        List<double[]> route = parseGeometry(routeGeometryJson);
        if (route.isEmpty()) {
            return false;
        }

        for (double[] point : route) {
            if (distanceKm(pickupLat, pickupLon, point[1], point[0]) <= maxDistanceKm) {
                return true;
            }
        }

        return false;
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
