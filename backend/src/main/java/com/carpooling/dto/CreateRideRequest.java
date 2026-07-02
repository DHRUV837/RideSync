package com.carpooling.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateRideRequest {
    private Double startLatitude;
    private Double startLongitude;
    private String startAddress;
    private Double endLatitude;
    private Double endLongitude;
    private String endAddress;
    private Integer availableSeats;
    private Double estimatedFare;
    private String departureTime; // ISO format
}
