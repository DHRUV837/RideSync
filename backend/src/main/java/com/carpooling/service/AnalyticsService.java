package com.carpooling.service;

import com.carpooling.dto.analytics.*;
import com.carpooling.entity.*;
import com.carpooling.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserRepository userRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final RiderProfileRepository riderProfileRepository;
    private final RideRepository rideRepository;
    private final RideBookingRepository rideBookingRepository;
    private final ComplaintRepository complaintRepository;
    private final RatingRepository ratingRepository;

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("MMM yyyy");

    public AnalyticsDashboardDto getCompleteAnalytics() {
        AnalyticsDashboardDto dashboard = new AnalyticsDashboardDto();
        dashboard.setPlatformOverview(getPlatformOverview());
        dashboard.setRideAnalytics(getRideAnalytics());
        dashboard.setRevenueAnalytics(getRevenueAnalytics());
        dashboard.setComplaintAnalytics(getComplaintAnalytics());
        dashboard.setBookingAnalytics(getBookingAnalytics());
        dashboard.setDriverPerformance(getDriverPerformance());
        dashboard.setUserActivity(getUserActivity());
        dashboard.setMonthlyGrowth(getMonthlyGrowth());
        return dashboard;
    }

    public PlatformOverviewDto getPlatformOverview() {
        PlatformOverviewDto overview = new PlatformOverviewDto();
        overview.setTotalUsers(userRepository.count());
        overview.setTotalDrivers(userRepository.countByRole(User.UserRole.DRIVER));
        overview.setTotalRiders(userRepository.countByRole(User.UserRole.RIDER));
        overview.setVerifiedDrivers(driverProfileRepository.countByIsVerifiedTrue());
        overview.setBlockedUsers(userRepository.countByIsBlockedTrue());
        return overview;
    }

    public RideAnalyticsDto getRideAnalytics() {
        RideAnalyticsDto analytics = new RideAnalyticsDto();
        analytics.setTotalRides(rideRepository.count());
        analytics.setActiveRides(rideRepository.countByStatus(Ride.RideStatus.ONGOING));
        analytics.setCompletedRides(rideRepository.countByStatus(Ride.RideStatus.COMPLETED));
        analytics.setCancelledRides(rideRepository.countByStatus(Ride.RideStatus.CANCELLED));
        return analytics;
    }

    public RevenueAnalyticsDto getRevenueAnalytics() {
        RevenueAnalyticsDto analytics = new RevenueAnalyticsDto();
        
        Double totalRevenue = rideBookingRepository.getTotalRevenue();
        analytics.setTotalRevenue(totalRevenue != null ? BigDecimal.valueOf(totalRevenue).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO);
        
        Double todayRevenue = rideBookingRepository.getTodayRevenue();
        analytics.setTodayRevenue(todayRevenue != null ? BigDecimal.valueOf(todayRevenue).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO);
        
        Double currentMonthRevenue = rideBookingRepository.getCurrentMonthRevenue();
        analytics.setCurrentMonthRevenue(currentMonthRevenue != null ? BigDecimal.valueOf(currentMonthRevenue).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO);
        
        return analytics;
    }

    public ComplaintAnalyticsDto getComplaintAnalytics() {
        ComplaintAnalyticsDto analytics = new ComplaintAnalyticsDto();
        analytics.setPendingComplaints(complaintRepository.countByStatus(Complaint.ComplaintStatus.PENDING));
        analytics.setUnderReview(complaintRepository.countByStatus(Complaint.ComplaintStatus.UNDER_REVIEW));
        analytics.setResolved(complaintRepository.countByStatus(Complaint.ComplaintStatus.RESOLVED));
        analytics.setRejected(complaintRepository.countByStatus(Complaint.ComplaintStatus.REJECTED));
        return analytics;
    }

    public BookingAnalyticsDto getBookingAnalytics() {
        BookingAnalyticsDto analytics = new BookingAnalyticsDto();
        analytics.setTotalBookings(rideBookingRepository.count());
        analytics.setCompletedBookings(rideBookingRepository.countByStatus(RideBooking.BookingStatus.COMPLETED));
        analytics.setCancelledBookings(rideBookingRepository.countByStatus(RideBooking.BookingStatus.CANCELLED));
        return analytics;
    }

    public DriverPerformanceDto getDriverPerformance() {
        DriverPerformanceDto performance = new DriverPerformanceDto();
        
        List<DriverProfile> topRated = driverProfileRepository.findTop5ByOrderByAverageRatingDesc();
        performance.setTopRatedDrivers(topRated.stream()
                .limit(5)
                .map(this::mapToDriverRatingDto)
                .collect(Collectors.toList()));
        
        List<DriverProfile> lowestRated = driverProfileRepository.findTop5ByOrderByAverageRatingAsc();
        performance.setLowestRatedDrivers(lowestRated.stream()
                .limit(5)
                .map(this::mapToDriverRatingDto)
                .collect(Collectors.toList()));
        
        List<DriverProfile> topByTrips = driverProfileRepository.findTop5ByOrderByTotalCompletedTripsDesc();
        performance.setDriversByCompletedTrips(topByTrips.stream()
                .limit(5)
                .map(this::mapToDriverTripsDto)
                .collect(Collectors.toList()));
        
        return performance;
    }

    public UserActivityDto getUserActivity() {
        UserActivityDto activity = new UserActivityDto();
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        
        activity.setNewUsersThisMonth(userRepository.countByCreatedAtAfter(startOfMonth));
        activity.setNewDriversThisMonth(driverProfileRepository.countByUserCreatedAtAfter(startOfMonth));
        activity.setNewRidersThisMonth(riderProfileRepository.countByUserCreatedAtAfter(startOfMonth));
        
        return activity;
    }

    public MonthlyGrowthDto getMonthlyGrowth() {
        MonthlyGrowthDto growth = new MonthlyGrowthDto();
        
        LocalDateTime sixMonthsAgo = LocalDateTime.now().minusMonths(6);
        
        List<MonthlyRideCountDto> rideCounts = new ArrayList<>();
        List<Object[]> rideResults = rideRepository.countRidesByMonth(sixMonthsAgo);
        for (Object[] result : rideResults) {
            LocalDateTime month = (LocalDateTime) result[0];
            Long count = (Long) result[1];
            rideCounts.add(new MonthlyRideCountDto(month.format(MONTH_FORMATTER), count != null ? count : 0L));
        }
        growth.setMonthlyRideCounts(rideCounts);
        
        List<MonthlyRevenueDto> revenues = new ArrayList<>();
        List<Object[]> revenueResults = rideBookingRepository.getRevenueByMonth(sixMonthsAgo);
        for (Object[] result : revenueResults) {
            LocalDateTime month = (LocalDateTime) result[0];
            Double revenue = (Double) result[1];
            revenues.add(new MonthlyRevenueDto(month.format(MONTH_FORMATTER), 
                    revenue != null ? BigDecimal.valueOf(revenue).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO));
        }
        growth.setMonthlyRevenues(revenues);
        
        return growth;
    }

    public List<RideStatusDistributionDto> getRideStatusDistribution() {
        List<RideStatusDistributionDto> distribution = new ArrayList<>();
        distribution.add(new RideStatusDistributionDto("PENDING", rideRepository.countByStatus(Ride.RideStatus.PENDING)));
        distribution.add(new RideStatusDistributionDto("ONGOING", rideRepository.countByStatus(Ride.RideStatus.ONGOING)));
        distribution.add(new RideStatusDistributionDto("COMPLETED", rideRepository.countByStatus(Ride.RideStatus.COMPLETED)));
        distribution.add(new RideStatusDistributionDto("CANCELLED", rideRepository.countByStatus(Ride.RideStatus.CANCELLED)));
        return distribution;
    }

    public List<ComplaintStatusDistributionDto> getComplaintStatusDistribution() {
        List<ComplaintStatusDistributionDto> distribution = new ArrayList<>();
        distribution.add(new ComplaintStatusDistributionDto("PENDING", complaintRepository.countByStatus(Complaint.ComplaintStatus.PENDING)));
        distribution.add(new ComplaintStatusDistributionDto("UNDER_REVIEW", complaintRepository.countByStatus(Complaint.ComplaintStatus.UNDER_REVIEW)));
        distribution.add(new ComplaintStatusDistributionDto("RESOLVED", complaintRepository.countByStatus(Complaint.ComplaintStatus.RESOLVED)));
        distribution.add(new ComplaintStatusDistributionDto("REJECTED", complaintRepository.countByStatus(Complaint.ComplaintStatus.REJECTED)));
        return distribution;
    }

    private DriverRatingDto mapToDriverRatingDto(DriverProfile driver) {
        DriverRatingDto dto = new DriverRatingDto();
        dto.setDriverId(driver.getId());
        dto.setDriverName(driver.getUser() != null ? driver.getUser().getFullName() : "Unknown");
        dto.setAverageRating(driver.getAverageRating() != null ? driver.getAverageRating() : 0.0);
        dto.setTotalRatings(driver.getTotalRatings() != null ? driver.getTotalRatings() : 0L);
        return dto;
    }

    private DriverTripsDto mapToDriverTripsDto(DriverProfile driver) {
        DriverTripsDto dto = new DriverTripsDto();
        dto.setDriverId(driver.getId());
        dto.setDriverName(driver.getUser() != null ? driver.getUser().getFullName() : "Unknown");
        dto.setCompletedTrips(driver.getTotalCompletedTrips() != null ? driver.getTotalCompletedTrips() : 0L);
        return dto;
    }
}
