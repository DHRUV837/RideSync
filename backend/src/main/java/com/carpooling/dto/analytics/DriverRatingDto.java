package com.carpooling.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriverRatingDto {
    private Long driverId;
    private String driverName;
    private Double averageRating;
    private Long totalRatings;
}
