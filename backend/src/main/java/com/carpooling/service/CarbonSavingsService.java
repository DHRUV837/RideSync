package com.carpooling.service;

import com.carpooling.dto.CarbonSavingsDTO;
import com.carpooling.entity.RideBooking;
import com.carpooling.repository.RideBookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CarbonSavingsService {

    private final RideBookingRepository rideBookingRepository;

    private static final double CO2_PER_RIDE = 4.2;
    private static final double FUEL_PER_RIDE = 1.8;
    private static final double PETROL_PRICE = 105.0;

    public CarbonSavingsDTO getCarbonSavings(Long riderUserId) {

        List<RideBooking> bookings =
                rideBookingRepository.findByRiderUserId(riderUserId);

        long completedRides = bookings.stream()
                .filter(b -> b.getStatus() == RideBooking.BookingStatus.COMPLETED)
                .count();

        double carbonSaved = completedRides * CO2_PER_RIDE;
        double fuelSaved = completedRides * FUEL_PER_RIDE;
        double moneySaved = fuelSaved * PETROL_PRICE;

        CarbonSavingsDTO dto = new CarbonSavingsDTO();

        dto.setTotalRidesCompleted((int) completedRides);
        dto.setCarbonSavingsKg(carbonSaved);
        dto.setFuelSavingsLiters(fuelSaved);
        dto.setMoneySaved(moneySaved);

        return dto;
    }
}