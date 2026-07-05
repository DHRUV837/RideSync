package com.carpooling.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

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
    /** Fare from origin to destination (base fare for the full route). */
    private Double estimatedFare;
    private String departureTime; // ISO format
    /** Optional intermediate stops between origin and destination. */
    private List<RideStopDto> stops;
}
