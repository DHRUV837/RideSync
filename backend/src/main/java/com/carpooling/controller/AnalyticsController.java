package com.carpooling.controller;

import com.carpooling.dto.analytics.*;
import com.carpooling.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/analytics")
@CrossOrigin(origins = {"http://localhost:5174", "http://localhost:5175"})
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    public ResponseEntity<AnalyticsDashboardDto> getCompleteAnalytics() {
        return ResponseEntity.ok(analyticsService.getCompleteAnalytics());
    }

    @GetMapping("/platform-overview")
    public ResponseEntity<PlatformOverviewDto> getPlatformOverview() {
        return ResponseEntity.ok(analyticsService.getPlatformOverview());
    }

    @GetMapping("/ride-analytics")
    public ResponseEntity<RideAnalyticsDto> getRideAnalytics() {
        return ResponseEntity.ok(analyticsService.getRideAnalytics());
    }

    @GetMapping("/revenue-analytics")
    public ResponseEntity<RevenueAnalyticsDto> getRevenueAnalytics() {
        return ResponseEntity.ok(analyticsService.getRevenueAnalytics());
    }

    @GetMapping("/complaint-analytics")
    public ResponseEntity<ComplaintAnalyticsDto> getComplaintAnalytics() {
        return ResponseEntity.ok(analyticsService.getComplaintAnalytics());
    }

    @GetMapping("/booking-analytics")
    public ResponseEntity<BookingAnalyticsDto> getBookingAnalytics() {
        return ResponseEntity.ok(analyticsService.getBookingAnalytics());
    }

    @GetMapping("/driver-performance")
    public ResponseEntity<DriverPerformanceDto> getDriverPerformance() {
        return ResponseEntity.ok(analyticsService.getDriverPerformance());
    }

    @GetMapping("/user-activity")
    public ResponseEntity<UserActivityDto> getUserActivity() {
        return ResponseEntity.ok(analyticsService.getUserActivity());
    }

    @GetMapping("/monthly-growth")
    public ResponseEntity<MonthlyGrowthDto> getMonthlyGrowth() {
        return ResponseEntity.ok(analyticsService.getMonthlyGrowth());
    }

    @GetMapping("/ride-status-distribution")
    public ResponseEntity<List<RideStatusDistributionDto>> getRideStatusDistribution() {
        return ResponseEntity.ok(analyticsService.getRideStatusDistribution());
    }

    @GetMapping("/complaint-status-distribution")
    public ResponseEntity<List<ComplaintStatusDistributionDto>> getComplaintStatusDistribution() {
        return ResponseEntity.ok(analyticsService.getComplaintStatusDistribution());
    }
}
