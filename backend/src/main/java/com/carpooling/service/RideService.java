package com.carpooling.service;
import com.carpooling.entity.Rating;
import com.carpooling.dto.BookRideRequest;
import com.carpooling.dto.BookingStatusUpdateRequest;
import com.carpooling.dto.CreateRideRequest;
import com.carpooling.dto.DriverAnalyticsDto;
import com.carpooling.dto.OtpVerificationRequest;
import com.carpooling.entity.*;
import com.carpooling.entity.DriverProfile;
import com.carpooling.entity.RideBooking;
import com.carpooling.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RideService {

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private RideBookingRepository rideBookingRepository;

    @Autowired
    private DriverProfileRepository driverProfileRepository;

    @Autowired
    private RiderProfileRepository riderProfileRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private RatingRepository ratingRepository;

    @Autowired
    private RouteMatchingService routeMatchingService;

    @Autowired
    private OsrmRoutingService osrmRoutingService;

    public Ride createRide(Long driverId, CreateRideRequest request) {
        DriverProfile driver = driverProfileRepository.findByUserId(driverId);

        if (driver == null) {
            throw new RuntimeException("Driver not found");
        }

        Ride ride = new Ride();
        ride.setDriver(driver);
        ride.setStartLatitude(request.getStartLatitude());
        ride.setStartLongitude(request.getStartLongitude());
        ride.setStartAddress(request.getStartAddress());
        ride.setEndLatitude(request.getEndLatitude());
        ride.setEndLongitude(request.getEndLongitude());
        ride.setEndAddress(request.getEndAddress());
        ride.setAvailableSeats(request.getAvailableSeats());
        ride.setEstimatedFare(request.getEstimatedFare());

        DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;
        ride.setDepartureTime(LocalDateTime.parse(request.getDepartureTime(), formatter));
        ride.setStatus(Ride.RideStatus.PENDING);

        try {
            OsrmRoutingService.OsrmRouteSummary routeSummary = osrmRoutingService.getRouteSummary(
                    request.getStartLatitude(), request.getStartLongitude(), request.getEndLatitude(), request.getEndLongitude()
            );
            ride.setRouteGeometry(routeSummary.geometry());
            ride.setTotalDistance(routeSummary.distanceKm());
            ride.setTotalDuration(Math.round(routeSummary.durationMinutes()));
        } catch (Exception ignored) {
            ride.setRouteGeometry("[]");
            ride.setTotalDistance(estimateDistanceKm(request.getStartLatitude(), request.getStartLongitude(), request.getEndLatitude(), request.getEndLongitude()));
            ride.setTotalDuration(Math.round(ride.getTotalDistance() / 35.0 * 60));
        }

        return rideRepository.save(ride);
    }

    public List<Ride> getAvailableRides() {
        return rideRepository.findByAvailableSeatsGreaterThan(0);
    }

    public List<Ride> searchRidesByRoute(double pickupLat, double pickupLon, double destinationLat, double destinationLon, double maxDistanceKm) {
        List<Ride> allAvailableRides = rideRepository.findByAvailableSeatsGreaterThan(0);
        List<Ride> matchedRides = new ArrayList<>();

        for (Ride ride : allAvailableRides) {
            if (ride.getRouteGeometry() == null || ride.getRouteGeometry().isBlank()) {
                continue;
            }

            boolean nearPickup = routeMatchingService.isPickupNearRoute(pickupLat, pickupLon, ride.getRouteGeometry(), maxDistanceKm);
            boolean nearDestination = routeMatchingService.isPickupNearRoute(destinationLat, destinationLon, ride.getRouteGeometry(), maxDistanceKm);
            if (nearPickup || nearDestination) {
                matchedRides.add(ride);
            }
        }

        return matchedRides;
    }

    public Ride getRideById(Long rideId) {
        return rideRepository.findById(rideId).orElse(null);
    }

    private String buildRouteGeometry(double startLat, double startLon, double endLat, double endLon) {
        List<double[]> points = new ArrayList<>();
        points.add(new double[]{startLon, startLat});
        points.add(new double[]{(startLon + endLon) / 2.0, (startLat + endLat) / 2.0});
        points.add(new double[]{endLon, endLat});
        return points.toString();
    }

    private double estimateDistanceKm(double startLat, double startLon, double endLat, double endLon) {
        double earthRadiusKm = 6371.0;
        double dLat = Math.toRadians(endLat - startLat);
        double dLon = Math.toRadians(endLon - startLon);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(startLat)) * Math.cos(Math.toRadians(endLat))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }

    public List<Ride> getDriverRides(Long driverId) {
        return rideRepository.findByDriverUserId(driverId);
    }

    public List<RideBooking> getDriverRequests(Long driverId) {
        return rideBookingRepository.findByRideDriverUserIdAndStatuses(
                driverId,
                List.of(
                        RideBooking.BookingStatus.PENDING,
                        RideBooking.BookingStatus.CONFIRMED,
                        RideBooking.BookingStatus.ONGOING
                )
        );
    }

    public DriverAnalyticsDto getDriverAnalytics(Long driverId) {

        List<Ride> rides = rideRepository.findByDriverUserId(driverId);
        List<RideBooking> bookings = rideBookingRepository.findByRideDriverUserId(driverId);

        double totalEarnings = bookings.stream()
                .mapToDouble(RideBooking::getFare)
                .sum();

        int totalPassengers = bookings.stream()
                .mapToInt(RideBooking::getSeatsBooked)
                .sum();

        int totalRides = rides.size();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfWeek = now.with(DayOfWeek.MONDAY).toLocalDate().atStartOfDay();
        LocalDateTime startOfMonth = now.withDayOfMonth(1).toLocalDate().atStartOfDay();

        double totalThisWeek = bookings.stream()
                .filter(b -> b.getBookedAt() != null && !b.getBookedAt().isBefore(startOfWeek))
                .mapToDouble(RideBooking::getFare)
                .sum();

        double totalThisMonth = bookings.stream()
                .filter(b -> b.getBookedAt() != null && !b.getBookedAt().isBefore(startOfMonth))
                .mapToDouble(RideBooking::getFare)
                .sum();

        Map<String, Double> weeklyEarningsMap = bookings.stream()
                .filter(b -> b.getBookedAt() != null)
                .collect(Collectors.groupingBy(
                        b -> b.getBookedAt().getDayOfWeek().name().substring(0, 3),
                        Collectors.summingDouble(RideBooking::getFare)
                ));

        Map<String, Double> monthlyTrendMap = bookings.stream()
                .filter(b -> b.getBookedAt() != null)
                .collect(Collectors.groupingBy(
                        b -> b.getBookedAt().getMonth().name().substring(0, 3),
                        Collectors.summingDouble(RideBooking::getFare)
                ));

        List<DriverAnalyticsDto.TrendPoint> weeklyEarnings = List.of(
                new DriverAnalyticsDto.TrendPoint("Mon", weeklyEarningsMap.getOrDefault("MON", 0.0)),
                new DriverAnalyticsDto.TrendPoint("Tue", weeklyEarningsMap.getOrDefault("TUE", 0.0)),
                new DriverAnalyticsDto.TrendPoint("Wed", weeklyEarningsMap.getOrDefault("WED", 0.0)),
                new DriverAnalyticsDto.TrendPoint("Thu", weeklyEarningsMap.getOrDefault("THU", 0.0)),
                new DriverAnalyticsDto.TrendPoint("Fri", weeklyEarningsMap.getOrDefault("FRI", 0.0)),
                new DriverAnalyticsDto.TrendPoint("Sat", weeklyEarningsMap.getOrDefault("SAT", 0.0)),
                new DriverAnalyticsDto.TrendPoint("Sun", weeklyEarningsMap.getOrDefault("SUN", 0.0))
        );

        List<DriverAnalyticsDto.TrendPoint> monthlyTrend = List.of(
                new DriverAnalyticsDto.TrendPoint("Jan", monthlyTrendMap.getOrDefault("JAN", 0.0)),
                new DriverAnalyticsDto.TrendPoint("Feb", monthlyTrendMap.getOrDefault("FEB", 0.0)),
                new DriverAnalyticsDto.TrendPoint("Mar", monthlyTrendMap.getOrDefault("MAR", 0.0)),
                new DriverAnalyticsDto.TrendPoint("Apr", monthlyTrendMap.getOrDefault("APR", 0.0)),
                new DriverAnalyticsDto.TrendPoint("May", monthlyTrendMap.getOrDefault("MAY", 0.0)),
                new DriverAnalyticsDto.TrendPoint("Jun", monthlyTrendMap.getOrDefault("JUN", 0.0))
        );

        Map<Long, Integer> ridePassengers = bookings.stream()
                .filter(b -> b.getRide() != null)
                .collect(Collectors.groupingBy(
                        b -> b.getRide().getId(),
                        Collectors.summingInt(RideBooking::getSeatsBooked)
                ));

        List<DriverAnalyticsDto.RecentRideDto> recentRides = rides.stream()
                .sorted((a, b) -> b.getDepartureTime().compareTo(a.getDepartureTime()))
                .limit(5)
                .map(ride -> {
                    double rideEarnings = bookings.stream()
                            .filter(b -> b.getRide() != null && b.getRide().getId().equals(ride.getId()))
                            .mapToDouble(RideBooking::getFare)
                            .sum();

                    return new DriverAnalyticsDto.RecentRideDto(
                            ride.getDepartureTime().toLocalDate().toString(),
                            ridePassengers.getOrDefault(ride.getId(), 0),
                            ride.getTotalDistance() != null ? ride.getTotalDistance() + " km" : "TBD",
                            rideEarnings,
                            ride.getStatus().name().toLowerCase()
                    );
                })
                .collect(Collectors.toList());

        DriverProfile driver = driverProfileRepository.findByUserId(driverId);

        double averageRating = driver != null ? driver.getAverageRating() : 0.0;
        long totalRatings = driver != null ? driver.getTotalRatings() : 0L;

        List<DriverAnalyticsDto.RecentReviewDto> recentReviews = driver == null
                ? List.of()
                : ratingRepository.findByDriverIdOrderByCreatedAtDesc(driver.getId())
                .stream()
                .limit(5)
                .map(r -> new DriverAnalyticsDto.RecentReviewDto(
                        r.getRider().getUser().getFullName(),
                        r.getRating(),
                        r.getReview(),
                        r.getCreatedAt().toLocalDate().toString()
                ))
                .collect(Collectors.toList());

        return new DriverAnalyticsDto(
                totalThisMonth,
                totalThisWeek,
                totalRides > 0 ? totalEarnings / totalRides : 0.0,
                totalPassengers > 0 ? totalEarnings / totalPassengers : 0.0,
                totalRides,
                totalPassengers,
                averageRating,
                totalRatings,
                weeklyEarnings,
                monthlyTrend,
                recentRides,
                recentReviews
        );
    }
    @Transactional
    public RideBooking bookRide(Long riderId, BookRideRequest request) {
        RiderProfile rider = riderProfileRepository.findByUserId(riderId);
        if (rider == null) {
            throw new RuntimeException("Rider profile not found. Please ensure you are registered as a rider.");
        }

        Ride ride = rideRepository.findById(request.getRideId())
                .orElseThrow(() -> new RuntimeException("Ride not found"));

        if (ride.getAvailableSeats() == null || ride.getAvailableSeats() <= 0) {
            throw new RuntimeException("This ride has no available seats. Please select another ride.");
        }

        if (ride.getAvailableSeats() < request.getSeatsToBook()) {
            throw new RuntimeException("Not enough seats available. Only " + ride.getAvailableSeats() + " seat(s) remaining.");
        }

        RideBooking booking = new RideBooking();
        booking.setRide(ride);
        booking.setRider(rider);
        booking.setPickupLatitude(request.getPickupLatitude());
        booking.setPickupLongitude(request.getPickupLongitude());
        booking.setPickupAddress(request.getPickupAddress());
        booking.setDropoffLatitude(request.getDropoffLatitude());
        booking.setDropoffLongitude(request.getDropoffLongitude());
        booking.setDropoffAddress(request.getDropoffAddress());
        booking.setSeatsBooked(request.getSeatsToBook());
        booking.setFare(ride.getEstimatedFare() * request.getSeatsToBook());
        booking.setStatus(RideBooking.BookingStatus.PENDING); // ✅ Fixed
        booking.setBookedAt(LocalDateTime.now());

        // Generate 4-digit OTP
        String otp = String.format("%04d", (int)(Math.random() * 10000));
        booking.setOtp(otp);

        ride.setAvailableSeats(ride.getAvailableSeats() - request.getSeatsToBook());
        rideRepository.save(ride);

        return rideBookingRepository.save(booking);
    }

    public List<RideBooking> getRiderBookings(Long riderId) {
        return rideBookingRepository.findByRiderUserId(riderId);
    }

    public Ride updateRideStatus(Long rideId, Ride.RideStatus status) {
        Ride ride = rideRepository.findById(rideId).orElse(null);
        if (ride != null) {
            ride.setStatus(status);
            return rideRepository.save(ride);
        }
        return null;
    }

    public RideBooking updateBookingStatus(Long bookingId, BookingStatusUpdateRequest request) {
        RideBooking booking = rideBookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        // ✅ Fixed — convert String to BookingStatus enum
        RideBooking.BookingStatus newStatus = RideBooking.BookingStatus.valueOf(
                request.getStatus().toUpperCase()
        );

        // ✅ Fixed — compare enum to enum
        if (RideBooking.BookingStatus.CANCELLED.equals(newStatus)) {
            Ride ride = booking.getRide();
            if (ride != null) {
                ride.setAvailableSeats(ride.getAvailableSeats() + booking.getSeatsBooked());
                rideRepository.save(ride);
            }
        }

        // ✅ Fixed — set the actual newStatus not hardcoded PENDING
        booking.setStatus(newStatus);
        return rideBookingRepository.save(booking);
    }

    @Transactional
    public RideBooking cancelBooking(Long riderId, Long bookingId) {
        RideBooking booking = rideBookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        // Verify booking belongs to the rider
        if (!booking.getRider().getUser().getId().equals(riderId)) {
            throw new IllegalArgumentException("You can only cancel your own bookings");
        }

        // Verify booking status allows cancellation
        RideBooking.BookingStatus currentStatus = booking.getStatus();
        if (currentStatus != RideBooking.BookingStatus.PENDING && currentStatus != RideBooking.BookingStatus.CONFIRMED) {
            throw new IllegalArgumentException("Booking cannot be cancelled. Current status: " + currentStatus);
        }

        // Update booking status and set cancelled timestamp
        booking.setStatus(RideBooking.BookingStatus.CANCELLED);
        booking.setCancelledAt(LocalDateTime.now());

        // Restore seats to the ride
        Ride ride = booking.getRide();
        if (ride != null) {
            ride.setAvailableSeats(ride.getAvailableSeats() + booking.getSeatsBooked());
            rideRepository.save(ride);

            // Create notification for driver
            String passengerName = booking.getRider().getUser().getFullName();
            String startCity = ride.getStartAddress();
            String destinationCity = ride.getEndAddress();
            String message = String.format("%s cancelled their booking for your ride from %s to %s.",
                    passengerName, startCity, destinationCity);

            notificationService.createNotification(
                    ride.getDriver().getUser().getId(),
                    "Booking Cancelled",
                    message,
                    "BOOKING_CANCELLED",
                    bookingId
            );
        }

        return rideBookingRepository.save(booking);
    }

    @Transactional
    public Ride cancelRide(Long driverId, Long rideId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new IllegalArgumentException("Ride not found"));

        // Verify ride belongs to the driver
        if (!ride.getDriver().getUser().getId().equals(driverId)) {
            throw new IllegalArgumentException("You can only cancel your own rides");
        }

        // Verify ride status allows cancellation
        Ride.RideStatus currentStatus = ride.getStatus();
        if (currentStatus != Ride.RideStatus.PENDING) {
            throw new IllegalArgumentException("Ride cannot be cancelled. Current status: " + currentStatus);
        }

        // Update ride status
        ride.setStatus(Ride.RideStatus.CANCELLED);

        // Cancel all bookings for this ride
        List<RideBooking> bookings = rideBookingRepository.findByRideId(rideId);
        for (RideBooking booking : bookings) {
            if (booking.getStatus() != RideBooking.BookingStatus.CANCELLED &&
                booking.getStatus() != RideBooking.BookingStatus.COMPLETED) {
                booking.setStatus(RideBooking.BookingStatus.CANCELLED);
                booking.setCancelledAt(LocalDateTime.now());
                rideBookingRepository.save(booking);

                // Create notification for each rider
                String riderName = booking.getRider().getUser().getFullName();
                String startCity = ride.getStartAddress();
                String destinationCity = ride.getEndAddress();
                String dateTime = ride.getDepartureTime().format(
                        DateTimeFormatter.ofPattern("dd MMM yyyy, h:mm a")
                );
                String message = String.format(
                        "Your ride from %s to %s scheduled on %s has been cancelled by the driver.",
                        startCity, destinationCity, dateTime
                );

                notificationService.createNotification(
                        booking.getRider().getUser().getId(),
                        "Ride Cancelled",
                        message,
                        "RIDE_CANCELLED",
                        rideId
                );
            }
        }

        return rideRepository.save(ride);
    }

    @Transactional
    public RideBooking verifyOtp(Long bookingId, OtpVerificationRequest request) {

        RideBooking booking = rideBookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (!booking.getOtp().equals(request.getOtp())) {
            throw new IllegalArgumentException("Invalid OTP");
        }

        booking.setStatus(RideBooking.BookingStatus.ONGOING);
        booking.setStartedAt(LocalDateTime.now());

        // NEW
        Ride ride = booking.getRide();
        ride.setStatus(Ride.RideStatus.ONGOING);
        rideRepository.save(ride);
         ride = booking.getRide();

        if (ride != null) {
            ride.setStatus(Ride.RideStatus.ONGOING);
            rideRepository.save(ride);
        }

        return rideBookingRepository.save(booking);
    }
    @Transactional
    public RideBooking completeBooking(Long bookingId) {

        RideBooking booking = rideBookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        booking.setStatus(RideBooking.BookingStatus.COMPLETED);
        booking.setCompletedAt(LocalDateTime.now());

        // NEW
        Ride ride = booking.getRide();
        ride.setStatus(Ride.RideStatus.COMPLETED);
        rideRepository.save(ride);

        // Driver statistics
        DriverProfile driver = ride.getDriver();

        if (driver != null) {
            driver.setTotalCompletedTrips(driver.getTotalCompletedTrips() + 1);
            driver.setTotalRidesCompleted(driver.getTotalRidesCompleted() + 1);
            driver.setTotalEarnings(driver.getTotalEarnings() + booking.getFare());

            driverProfileRepository.save(driver);
        }
         ride = booking.getRide();

        if (ride != null) {
            ride.setStatus(Ride.RideStatus.COMPLETED);
            rideRepository.save(ride);
        }

        return rideBookingRepository.save(booking);
    }

    public Map<String, Object> getOptimizationData(Long rideId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new IllegalArgumentException("Ride not found"));

        // Get accepted riders (CONFIRMED or ONGOING status)
        List<RideBooking> acceptedBookings = rideBookingRepository.findByRideId(rideId)
                .stream()
                .filter(b -> b.getStatus() == RideBooking.BookingStatus.CONFIRMED || 
                           b.getStatus() == RideBooking.BookingStatus.ONGOING)
                .collect(Collectors.toList());

        // Build accepted riders data
        List<Map<String, Object>> acceptedRiders = acceptedBookings.stream()
                .map(booking -> {
                    Map<String, Object> riderData = new java.util.HashMap<>();
                    String passengerName = booking.getRider() != null && booking.getRider().getUser() != null
                            ? booking.getRider().getUser().getFullName()
                            : "Passenger";
                    riderData.put("id", booking.getId());
                    riderData.put("bookingId", booking.getId());
                    riderData.put("riderId", booking.getRider() != null && booking.getRider().getUser() != null ? booking.getRider().getUser().getId() : null);
                    riderData.put("riderName", passengerName);
                    riderData.put("passengerName", passengerName);
                    riderData.put("pickupLat", booking.getPickupLatitude());
                    riderData.put("pickupLng", booking.getPickupLongitude());
                    riderData.put("pickupLon", booking.getPickupLongitude());
                    riderData.put("pickupAddress", booking.getPickupAddress());
                    riderData.put("dropLat", booking.getDropoffLatitude());
                    riderData.put("dropLng", booking.getDropoffLongitude());
                    riderData.put("dropoffLat", booking.getDropoffLatitude());
                    riderData.put("dropoffLon", booking.getDropoffLongitude());
                    riderData.put("dropAddress", booking.getDropoffAddress());
                    riderData.put("dropoffAddress", booking.getDropoffAddress());
                    riderData.put("roadDistanceKm", 0.0);
                    riderData.put("travelTimeMinutes", 0.0);
                    riderData.put("fare", booking.getFare());
                    return riderData;
                })
                .collect(Collectors.toList());

        // Build response
        Map<String, Object> data = new java.util.HashMap<>();
        data.put("rideId", ride.getId());
        data.put("origin", Map.of(
                "lat", ride.getStartLatitude(),
                "lon", ride.getStartLongitude(),
                "address", ride.getStartAddress()
        ));
        data.put("destination", Map.of(
                "lat", ride.getEndLatitude(),
                "lon", ride.getEndLongitude(),
                "address", ride.getEndAddress()
        ));
        data.put("acceptedRiders", acceptedRiders);
        data.put("totalAcceptedRiders", acceptedRiders.size());

        return data;
    }
}