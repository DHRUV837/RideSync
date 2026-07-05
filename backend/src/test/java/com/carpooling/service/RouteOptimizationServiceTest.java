package com.carpooling.service;

import com.carpooling.dto.OptimizeRouteResponse;
import com.carpooling.entity.Ride;
import com.carpooling.entity.RideBooking;
import com.carpooling.entity.RiderProfile;
import com.carpooling.entity.User;
import com.carpooling.repository.RideBookingRepository;
import com.carpooling.repository.RideRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RouteOptimizationServiceTest {

    @Mock
    private RideRepository rideRepository;

    @Mock
    private RideBookingRepository rideBookingRepository;

    @Mock
    private MlServiceClient mlServiceClient;

    @Mock
    private OsrmRoutingService osrmRoutingService;

    @InjectMocks
    private RouteOptimizationService routeOptimizationService;

    @Test
    void optimizeRideUsesPassengerBookingCoordinatesForSegments() {
        Ride ride = new Ride();
        ride.setId(1L);
        ride.setStartLatitude(22.3);
        ride.setStartLongitude(72.9);
        ride.setEndLatitude(23.0);
        ride.setEndLongitude(72.6);
        ride.setEstimatedFare(120.0);

        User user = new User();
        user.setId(10L);
        user.setFullName("Veer");

        RiderProfile riderProfile = new RiderProfile();
        riderProfile.setId(7L);
        riderProfile.setUser(user);

        RideBooking booking = new RideBooking();
        booking.setId(99L);
        booking.setRide(ride);
        booking.setRider(riderProfile);
        booking.setPickupLatitude(22.31);
        booking.setPickupLongitude(72.91);
        booking.setPickupAddress("Petlad");
        booking.setDropoffLatitude(22.5);
        booking.setDropoffLongitude(72.8);
        booking.setDropoffAddress("Nadiad");
        booking.setStatus(RideBooking.BookingStatus.ACCEPTED);

        when(rideRepository.findById(1L)).thenReturn(Optional.of(ride));
        when(rideBookingRepository.findByRideId(1L)).thenReturn(List.of(booking));
        when(mlServiceClient.optimizeRoute(org.mockito.ArgumentMatchers.any())).thenReturn(Map.of(
                "optimized_route", List.of("start", "pickup-99", "end"),
                "statistics", Map.of()
        ));
        when(osrmRoutingService.getRouteSummary(22.31, 72.91, 22.5, 72.8)).thenReturn(new OsrmRoutingService.OsrmRouteSummary("[]", 18.5, 24.0));

        OptimizeRouteResponse response = routeOptimizationService.optimizeRide(1L);

        assertEquals(1, response.getPassengerSegments().size());
        assertEquals("Veer", response.getPassengerSegments().get(0).getPassengerName());
        assertEquals("Petlad", response.getPassengerSegments().get(0).getPickupAddress());
        assertEquals("Nadiad", response.getPassengerSegments().get(0).getDropAddress());
        assertEquals(18.5, response.getPassengerSegments().get(0).getRoadDistanceKm());
        assertEquals(24.0, response.getPassengerSegments().get(0).getTravelTimeMinutes());
    }
}
