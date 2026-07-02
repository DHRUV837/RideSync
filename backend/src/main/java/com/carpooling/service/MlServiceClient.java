package com.carpooling.service;

import com.carpooling.dto.RouteWaypointDto;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class MlServiceClient {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${ml-service.url:http://localhost:5000}")
    private String mlServiceUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, Object> optimizeRoute(List<RouteWaypointDto> waypoints) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("locations", waypoints.stream().map(w -> Map.of(
                    "id", w.getId(),
                    "lat", w.getLatitude(),
                    "lon", w.getLongitude()
            )).toList());

            String requestBody = objectMapper.writeValueAsString(payload);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(mlServiceUrl + "/api/optimize-route"))
                    .timeout(Duration.ofSeconds(20))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() != 200) {
                throw new IllegalStateException("ML service returned status " + response.statusCode() + ": " + response.body());
            }

            return objectMapper.readValue(response.body(), new TypeReference<>() {});
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to call ML service: " + ex.getMessage(), ex);
        }
    }
}
