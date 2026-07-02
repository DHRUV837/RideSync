package com.carpooling.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsDashboardDto {
    private PlatformOverviewDto platformOverview;
    private RideAnalyticsDto rideAnalytics;
    private RevenueAnalyticsDto revenueAnalytics;
    private ComplaintAnalyticsDto complaintAnalytics;
    private BookingAnalyticsDto bookingAnalytics;
    private DriverPerformanceDto driverPerformance;
    private UserActivityDto userActivity;
    private MonthlyGrowthDto monthlyGrowth;
}
