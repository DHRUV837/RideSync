package com.carpooling.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OptimizeRouteResponse {
    private Long rideId;
    private List<RouteWaypointDto> optimizedWaypoints;
    private List<List<Double>> roadPath;
    private List<PassengerSegmentDto> passengerSegments;
    private OptimizationStatisticsDto statistics;
}
