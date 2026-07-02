package com.carpooling.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OptimizationStatisticsDto {
    private Double originalDistanceKm;
    private Double optimizedDistanceKm;
    private Double distanceSavedKm;
    private Double distanceSavedPercent;
    private Double fuelSavedLiters;
    private Double moneySavedRupees;
    private Double timeSavedMinutes;
    private Double estimatedDurationMinutes;
    private String solver;
    private String algorithm;
    private Long optimizationTimeMs;
    private Integer numberOfPickups;
    private Integer numberOfAcceptedRiders;
}
