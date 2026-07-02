package com.carpooling.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class OsrmRoutingService {

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String osrmBaseUrl = "https://router.project-osrm.org/route/v1/driving";

    public OsrmRouteSummary getRouteSummary(double startLat, double startLon, double endLat, double endLon) {
        String coordinates = String.format(Locale.US, "%s,%s;%s,%s", startLon, startLat, endLon, endLat);
        String url = osrmBaseUrl + "/" + coordinates + "?overview=full&geometries=geojson&steps=false";

        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new RuntimeException("OSRM request failed with status " + response.statusCode());
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode routeNode = root.path("routes").path(0);
            JsonNode geometryNode = routeNode.path("geometry").path("coordinates");
            JsonNode distanceNode = routeNode.path("distance");
            JsonNode durationNode = routeNode.path("duration");

            List<List<Double>> coordinatesList = new ArrayList<>();
            if (geometryNode.isArray()) {
                for (JsonNode point : geometryNode) {
                    coordinatesList.add(List.of(point.path(0).asDouble(), point.path(1).asDouble()));
                }
            }

            return new OsrmRouteSummary(
                    objectMapper.writeValueAsString(coordinatesList),
                    distanceNode.asDouble() / 1000.0,
                    durationNode.asDouble() / 60.0
            );
        } catch (Exception ex) {
            throw new RuntimeException("Could not fetch OSRM route: " + ex.getMessage(), ex);
        }
    }

    public record OsrmRouteSummary(String geometry, double distanceKm, double durationMinutes) {
    }
}
