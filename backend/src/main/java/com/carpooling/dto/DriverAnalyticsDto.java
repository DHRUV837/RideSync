package com.carpooling.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriverAnalyticsDto {

    private Double totalThisMonth;
    private Double totalThisWeek;
    private Double avgPerRide;
    private Double avgPerPassenger;
    private Integer totalRides;
    private Integer totalPassengers;
    private Double averageRating;
    private Long totalRatings;

    private List<TrendPoint> weeklyEarnings;
    private List<TrendPoint> monthlyTrend;
    private List<RecentRideDto> recentRides;

    // NEW FIELD
    private List<RecentReviewDto> recentReviews;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendPoint {
        private String label;
        private Double value;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentRideDto {
        private String date;
        private Integer passengers;
        private String distance;
        private Double earnings;
        private String status;
    }

    // NEW CLASS
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentReviewDto {
        private String riderName;
        private Integer rating;
        private String review;
        private String date;
    }
}