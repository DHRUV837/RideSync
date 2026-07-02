package com.carpooling.controller;

import com.carpooling.dto.BookRideRequest;
import com.carpooling.dto.BookingStatusUpdateRequest;
import com.carpooling.dto.CreateRideRequest;
import com.carpooling.dto.DriverAnalyticsDto;
import com.carpooling.dto.OtpVerificationRequest;
import com.carpooling.entity.Ride;
import com.carpooling.entity.RideBooking;
import com.carpooling.service.RideService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/rides")
@CrossOrigin(origins = {"http://localhost:5174", "http://localhost:5175"})
public class RideController {

    @Autowired
    private RideService rideService;

    @Autowired
    private com.carpooling.security.JwtTokenProvider jwtTokenProvider;

    @PostMapping("/create")
    public ResponseEntity<Object> createRide(
            @RequestHeader("Authorization") String token,
            @RequestBody CreateRideRequest request) {
        try {
            Long driverId = extractUserIdFromToken(token);
            Ride ride = rideService.createRide(driverId, request);
            return new ResponseEntity<>(ride, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Could not create ride: " + e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/available")
    public ResponseEntity<List<Ride>> getAvailableRides() {
        List<Ride> rides = rideService.getAvailableRides();
        return new ResponseEntity<>(rides, HttpStatus.OK);
    }

    @GetMapping("/search")
    public ResponseEntity<List<Ride>> searchRides(@RequestParam double pickupLat,
                                                 @RequestParam double pickupLon,
                                                 @RequestParam double destinationLat,
                                                 @RequestParam double destinationLon,
                                                 @RequestParam(defaultValue = "5") double maxDistanceKm) {
        List<Ride> rides = rideService.searchRidesByRoute(pickupLat, pickupLon, destinationLat, destinationLon, maxDistanceKm);
        return new ResponseEntity<>(rides, HttpStatus.OK);
    }

    @GetMapping("/{rideId}")
    public ResponseEntity<Ride> getRideById(@PathVariable Long rideId) {
        Ride ride = rideService.getRideById(rideId);
        if (ride != null) {
            return new ResponseEntity<>(ride, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @GetMapping("/{rideId}/optimization-data")
    public ResponseEntity<Object> getOptimizationData(@PathVariable Long rideId) {
        try {
            Map<String, Object> data = rideService.getOptimizationData(rideId);
            return new ResponseEntity<>(data, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Could not fetch optimization data: " + e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/book")
    public ResponseEntity<Object> bookRide(
            @RequestHeader("Authorization") String token,
            @RequestBody BookRideRequest request) {
        try {
            Long riderId = extractUserIdFromToken(token);
            RideBooking booking = rideService.bookRide(riderId, request);
            return new ResponseEntity<>(booking, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Could not book ride: " + e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<RideBooking>> getMyBookings(@RequestHeader("Authorization") String token) {
        Long riderId = extractUserIdFromToken(token);
        List<RideBooking> bookings = rideService.getRiderBookings(riderId);
        return new ResponseEntity<>(bookings, HttpStatus.OK);
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<Ride>> getDriverRides(@PathVariable Long driverId) {
        List<Ride> rides = rideService.getDriverRides(driverId);
        return new ResponseEntity<>(rides, HttpStatus.OK);
    }

    @GetMapping("/driver/{driverId}/requests")
    public ResponseEntity<List<RideBooking>> getDriverRequests(@PathVariable Long driverId) {
        List<RideBooking> requests = rideService.getDriverRequests(driverId);
        return new ResponseEntity<>(requests, HttpStatus.OK);
    }

    @GetMapping("/driver/{driverId}/analytics")
    public ResponseEntity<DriverAnalyticsDto> getDriverAnalytics(@PathVariable Long driverId) {
        DriverAnalyticsDto analytics = rideService.getDriverAnalytics(driverId);
        return new ResponseEntity<>(analytics, HttpStatus.OK);
    }

    @PutMapping("/bookings/{bookingId}/status")
    public ResponseEntity<Object> updateBookingStatus(@PathVariable Long bookingId,
                                                      @RequestBody BookingStatusUpdateRequest request) {
        try {
            RideBooking updated = rideService.updateBookingStatus(bookingId, request);
            return new ResponseEntity<>(updated, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Could not update booking status: " + e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/bookings/{bookingId}/cancel")
    public ResponseEntity<Object> cancelBooking(
            @RequestHeader("Authorization") String token,
            @PathVariable Long bookingId) {
        try {
            Long riderId = extractUserIdFromToken(token);
            RideBooking updated = rideService.cancelBooking(riderId, bookingId);
            return new ResponseEntity<>(updated, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            if (e.getMessage().contains("own bookings")) {
                return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
            }
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Could not cancel booking: " + e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{rideId}/cancel")
    public ResponseEntity<Object> cancelRide(
            @RequestHeader("Authorization") String token,
            @PathVariable Long rideId) {
        try {
            Long driverId = extractUserIdFromToken(token);
            Ride updated = rideService.cancelRide(driverId, rideId);
            return new ResponseEntity<>(updated, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            if (e.getMessage().contains("own rides")) {
                return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
            }
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Could not cancel ride: " + e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/bookings/{bookingId}/verify-otp")
    public ResponseEntity<Object> verifyOtp(@PathVariable Long bookingId,
                                           @RequestBody OtpVerificationRequest request) {
        try {
            RideBooking updated = rideService.verifyOtp(bookingId, request);
            return new ResponseEntity<>(updated, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Could not verify OTP: " + e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/bookings/{bookingId}/complete")
    public ResponseEntity<Object> completeBooking(@PathVariable Long bookingId) {
        try {
            RideBooking updated = rideService.completeBooking(bookingId);
            return new ResponseEntity<>(updated, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Could not complete booking: " + e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        }
    }

    private Long extractUserIdFromToken(String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Authorization header is missing");
        }
        String jwt = token;
        if (token.startsWith("Bearer ")) {
            jwt = token.substring(7).trim();
        }
        if (!jwtTokenProvider.validateToken(jwt)) {
            throw new IllegalArgumentException("Invalid token");
        }
        return jwtTokenProvider.getUserIdFromToken(jwt);
    }
}
