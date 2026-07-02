package com.carpooling.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PassengerSegmentDto {
    private Long bookingId;
    private String passengerName;
    private String pickupAddress;
    private Double pickupLat;
    private Double pickupLng;
    private String dropAddress;
    private Double dropLat;
    private Double dropLng;
    private Double roadDistanceKm;
    private Double travelTimeMinutes;
    private Double fare;
    private Integer order;
}
