package com.carpooling.service;
import com.carpooling.entity.Rating;
import com.carpooling.dto.BookRideRequest;
import com.carpooling.dto.BookingStatusUpdateRequest;
import com.carpooling.dto.CreateRideRequest;
import com.carpooling.dto.RideStopDto;
import com.carpooling.dto.DriverAnalyticsDto;
import com.carpooling.dto.OtpVerificationRequest;
import com.carpooling.entity.*;
import com.carpooling.entity.DriverProfile;
import com.carpooling.entity.RideBooking;
import com.carpooling.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;

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

    @Autowired
    private FareService fareService;

    @Transactional
    public Ride createRide(Long driverId, CreateRideRequest request) {
        DriverProfile driver = driverProfileRepository.findByUserId(driverId);

        if (driver == null) {
            throw new RuntimeException("Driver not found");
        }

        validateCreateRideRequest(request);

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

        List<RideStopDto> stopDtos = request.getStops() != null ? request.getStops() : List.of();
        List<RideStop> rideStops = buildRideStops(ride, stopDtos);
        ride.setStops(rideStops);

        List<OsrmRoutingService.LatLon> routeWaypoints = buildRouteWaypoints(request, stopDtos);
        try {
            OsrmRoutingService.OsrmRouteSummary routeSummary = osrmRoutingService.getRouteSummaryThroughWaypoints(routeWaypoints);
            ride.setRouteGeometry(routeSummary.geometry());
            ride.setTotalDistance(routeSummary.distanceKm());
            ride.setTotalDuration(Math.round(routeSummary.durationMinutes()));
        } catch (Exception ignored) {
            ride.setRouteGeometry(buildFallbackGeometry(routeWaypoints));
            ride.setTotalDistance(estimateTotalDistanceKm(routeWaypoints));
            ride.setTotalDuration(Math.round(ride.getTotalDistance() / 35.0 * 60));
        }

        return rideRepository.save(ride);
    }

    private void validateCreateRideRequest(CreateRideRequest request) {
        if (request.getStartLatitude() == null || request.getStartLongitude() == null
                || request.getEndLatitude() == null || request.getEndLongitude() == null) {
            throw new IllegalArgumentException("Origin and destination coordinates are required");
        }
        if (request.getEstimatedFare() == null || request.getEstimatedFare() <= 0) {
            throw new IllegalArgumentException("Base fare must be greater than zero");
        }
        if (request.getAvailableSeats() == null || request.getAvailableSeats() <= 0) {
            throw new IllegalArgumentException("At least one available seat is required");
        }

        List<RideStopDto> stops = request.getStops();
        if (stops == null || stops.isEmpty()) {
            return;
        }

        List<RideStopDto> sorted = stops.stream()
                .sorted(Comparator.comparing(RideStopDto::getStopOrder))
                .toList();

        double previousFare = 0;
        for (int i = 0; i < sorted.size(); i++) {
            RideStopDto stop = sorted.get(i);
            if (stop.getStopName() == null || stop.getStopName().isBlank()) {
                throw new IllegalArgumentException("Each stop must have a name");
            }
            if (stop.getLatitude() == null || stop.getLongitude() == null) {
                throw new IllegalArgumentException("Each stop must include coordinates");
            }
            if (stop.getStopOrder() == null || stop.getStopOrder() != i + 1) {
                throw new IllegalArgumentException("Stop sequence numbers must be consecutive starting from 1");
            }
            if (stop.getFareFromOrigin() == null || stop.getFareFromOrigin() <= 0) {
                throw new IllegalArgumentException("Each stop must have a fare from origin greater than zero");
            }
            if (stop.getFareFromOrigin() >= request.getEstimatedFare()) {
                throw new IllegalArgumentException("Intermediate stop fares must be less than the destination base fare");
            }
            if (stop.getFareFromOrigin() <= previousFare) {
                throw new IllegalArgumentException("Stop fares from origin must increase along the route");
            }
            previousFare = stop.getFareFromOrigin();
        }
    }

    private List<RideStop> buildRideStops(Ride ride, List<RideStopDto> stopDtos) {
        if (stopDtos == null || stopDtos.isEmpty()) {
            return new ArrayList<>();
        }

        return stopDtos.stream()
                .sorted(Comparator.comparing(RideStopDto::getStopOrder))
                .map(dto -> {
                    RideStop stop = new RideStop();
                    stop.setRide(ride);
                    stop.setStopOrder(dto.getStopOrder());
                    stop.setStopName(dto.getStopName().trim());
                    stop.setLatitude(dto.getLatitude());
                    stop.setLongitude(dto.getLongitude());
                    stop.setAddress(dto.getAddress() != null && !dto.getAddress().isBlank()
                            ? dto.getAddress()
                            : dto.getStopName());
                    stop.setFareFromOrigin(dto.getFareFromOrigin());
                    stop.setStopType("INTERMEDIATE");
                    stop.setIsCompleted(false);
                    return stop;
                })
                .collect(Collectors.toList());
    }

    private List<OsrmRoutingService.LatLon> buildRouteWaypoints(CreateRideRequest request, List<RideStopDto> stopDtos) {
        List<OsrmRoutingService.LatLon> waypoints = new ArrayList<>();
        waypoints.add(new OsrmRoutingService.LatLon(request.getStartLatitude(), request.getStartLongitude()));

        if (stopDtos != null) {
            stopDtos.stream()
                    .sorted(Comparator.comparing(RideStopDto::getStopOrder))
                    .forEach(stop -> waypoints.add(new OsrmRoutingService.LatLon(stop.getLatitude(), stop.getLongitude())));
        }

        waypoints.add(new OsrmRoutingService.LatLon(request.getEndLatitude(), request.getEndLongitude()));
        return waypoints;
    }

    private String buildFallbackGeometry(List<OsrmRoutingService.LatLon> waypoints) {
        List<double[]> points = waypoints.stream()
                .map(wp -> new double[]{wp.longitude(), wp.latitude()})
                .toList();
        return points.toString();
    }

    private double estimateTotalDistanceKm(List<OsrmRoutingService.LatLon> waypoints) {
        double total = 0;
        for (int i = 0; i < waypoints.size() - 1; i++) {
            OsrmRoutingService.LatLon from = waypoints.get(i);
            OsrmRoutingService.LatLon to = waypoints.get(i + 1);
            total += estimateDistanceKm(from.latitude(), from.longitude(), to.latitude(), to.longitude());
        }
        return total;
    }

    public List<Ride> getAvailableRides() {
        return rideRepository.findByAvailableSeatsGreaterThan(0);
    }

    public List<Ride> searchRidesByRoute(
            double pickupLat,
            double pickupLon,
            double destinationLat,
            double destinationLon,
            String date,
            double maxDistanceKm){
        LocalDate searchDate = LocalDate.parse(date);

        List<Ride> allAvailableRides =
                rideRepository.findByAvailableSeatsGreaterThan(0)
                        .stream()
                        .filter(r -> r.getDepartureTime().toLocalDate().equals(searchDate))
                        .toList();
        System.out.println("========== SEARCH ==========");
        System.out.println("Search date = " + searchDate);
        System.out.println("Rides after date filter = " + allAvailableRides.size());

        for (Ride ride : allAvailableRides) {
            System.out.println("----------------------");
            System.out.println("Ride ID = " + ride.getId());
            System.out.println("Departure = " + ride.getDepartureTime());
            System.out.println("Available Seats = " + ride.getAvailableSeats());
            System.out.println("Geometry Null? " + (ride.getRouteGeometry() == null));
            System.out.println("Geometry Length = " +
                    (ride.getRouteGeometry() == null ? 0 : ride.getRouteGeometry().length()));
        }
        List<Ride> matchedRides = new ArrayList<>();

        for (Ride ride : allAvailableRides) {
            if (ride.getRouteGeometry() == null || ride.getRouteGeometry().isBlank()) {
                continue;
            }

            // Use enhanced route matching with direction validation
            boolean isMatch = routeMatchingService.isRouteMatch(pickupLat, pickupLon, destinationLat, destinationLon, ride.getRouteGeometry(), maxDistanceKm);
            if (isMatch) {
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
                        RideBooking.BookingStatus.ACCEPTED,
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

        if (ride.getDriver().getUser().getId().equals(riderId)) {
            throw new RuntimeException("Drivers cannot book their own ride.");
        }

        boolean alreadyBooked = rideBookingRepository.findByRideId(ride.getId()).stream()
                .anyMatch(b -> b.getRider().getUser().getId().equals(riderId) &&
                        (b.getStatus() == RideBooking.BookingStatus.PENDING ||
                         b.getStatus() == RideBooking.BookingStatus.ACCEPTED ||
                         b.getStatus() == RideBooking.BookingStatus.ONGOING));
        if (alreadyBooked) {
            throw new RuntimeException("You already have an active booking for this ride.");
        }

        if (request.getPickupStopSequence() != null && request.getDropoffStopSequence() != null &&
            request.getPickupStopSequence() >= request.getDropoffStopSequence()) {
            throw new RuntimeException("Pickup stop must be before dropoff stop.");
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
        // M3: Dynamic fare — compute segment fare between pickup and dropoff stops
        Double segmentFare = fareService.calculateFare(ride, request.getPickupAddress(), request.getDropoffAddress());
        double perSeatFare = (segmentFare != null) ? segmentFare : ride.getEstimatedFare();
        booking.setFare(perSeatFare * request.getSeatsToBook());
        booking.setStatus(RideBooking.BookingStatus.PENDING); // ✅ Fixed
        booking.setBookedAt(LocalDateTime.now());

        // Generate 4-digit OTP
        String otp = String.format("%04d", (int)(Math.random() * 10000));
        booking.setOtp(otp);

        booking.setPickupStopSequence(request.getPickupStopSequence() != null ? request.getPickupStopSequence() : 0);
        booking.setDropoffStopSequence(request.getDropoffStopSequence() != null ? request.getDropoffStopSequence() : 0);
        // Note: Seats are now only deducted when the booking is ACCEPTED.

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

        RideBooking.BookingStatus oldStatus = booking.getStatus();
        RideBooking.BookingStatus newStatus = RideBooking.BookingStatus.valueOf(
                request.getStatus().toUpperCase()
        );

        if (newStatus == RideBooking.BookingStatus.ACCEPTED && oldStatus == RideBooking.BookingStatus.PENDING) {
            Ride ride = booking.getRide();
            if (ride.getAvailableSeats() < booking.getSeatsBooked()) {
                throw new IllegalArgumentException("Not enough available seats to accept this booking.");
            }
            ride.setAvailableSeats(ride.getAvailableSeats() - booking.getSeatsBooked());
            rideRepository.save(ride);
            booking.setAcceptedAt(LocalDateTime.now());
        } else if (newStatus == RideBooking.BookingStatus.CANCELLED &&
                  (oldStatus == RideBooking.BookingStatus.ACCEPTED || oldStatus == RideBooking.BookingStatus.CONFIRMED || oldStatus == RideBooking.BookingStatus.ONGOING)) {
            Ride ride = booking.getRide();
            if (ride != null) {
                ride.setAvailableSeats(ride.getAvailableSeats() + booking.getSeatsBooked());
                rideRepository.save(ride);
            }
        }

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
        if (currentStatus != RideBooking.BookingStatus.PENDING && currentStatus != RideBooking.BookingStatus.ACCEPTED && currentStatus != RideBooking.BookingStatus.CONFIRMED) {
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
                .filter(b -> b.getStatus() == RideBooking.BookingStatus.ACCEPTED || 
                           b.getStatus() == RideBooking.BookingStatus.CONFIRMED ||
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