package com.carpooling.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriverPerformanceDto {
    private List<DriverRatingDto> topRatedDrivers;
    private List<DriverRatingDto> lowestRatedDrivers;
    private List<DriverTripsDto> driversByCompletedTrips;
}
