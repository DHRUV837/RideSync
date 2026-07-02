package com.carpooling.service;

import com.carpooling.dto.SubmitRatingRequest;
import com.carpooling.entity.DriverProfile;
import com.carpooling.entity.Rating;
import com.carpooling.entity.RideBooking;
import com.carpooling.entity.RiderProfile;
import com.carpooling.repository.DriverProfileRepository;
import com.carpooling.repository.RatingRepository;
import com.carpooling.repository.RideBookingRepository;
import com.carpooling.repository.RiderProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RatingService {

    @Autowired
    private RatingRepository ratingRepository;

    @Autowired
    private RideBookingRepository rideBookingRepository;

    @Autowired
    private DriverProfileRepository driverProfileRepository;

    @Autowired
    private RiderProfileRepository riderProfileRepository;

    @Transactional
    public String submitRating(Long riderId, SubmitRatingRequest request) {

        System.out.println("====== submitRating() called ======");
        // Validate rating range
        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        // Find booking
        RideBooking booking = rideBookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        // Debug IDs
        System.out.println("JWT User ID: " + riderId);
        System.out.println("Booking RiderProfile ID: " + booking.getRider().getId());
        System.out.println("Booking User ID: " + booking.getRider().getUser().getId());

        // Verify booking belongs to the rider
        if (!booking.getRider().getUser().getId().equals(riderId)) {
            throw new IllegalArgumentException("You can only rate your own bookings");
        }

        // Verify booking is completed
        if (!RideBooking.BookingStatus.COMPLETED.equals(booking.getStatus())) {
            throw new IllegalArgumentException("Only completed rides can be rated");
        }

        // Verify booking hasn't been rated already
        if (ratingRepository.findByBookingId(request.getBookingId()).isPresent()) {
            throw new IllegalArgumentException("This booking has already been rated");
        }

        // Get driver profile
        DriverProfile driver = booking.getRide().getDriver();
        RiderProfile rider = booking.getRider();

        // Create Rating
        Rating rating = new Rating();
        rating.setBooking(booking);
        rating.setDriver(driver);
        rating.setRider(rider);
        rating.setRating(request.getRating());
        rating.setReview(request.getReview());

        System.out.println("Before saving rating...");
        Rating saved = ratingRepository.saveAndFlush(rating);

        System.out.println("After saving rating...");
        System.out.println("Saved Rating ID: " + saved.getId());
        System.out.println("Total Ratings in DB: " + ratingRepository.count());

        // Update driver's average rating
        recalculateDriverRating(driver);

        return "Rating submitted successfully.";
    }

    private void recalculateDriverRating(DriverProfile driver) {

        List<Rating> driverRatings = ratingRepository.findByDriverId(driver.getId());

        System.out.println("Driver Ratings Found: " + driverRatings.size());

        if (driverRatings.isEmpty()) {
            driver.setAverageRating(0.0);
            driver.setTotalRatings(0L);
        } else {

            double sum = driverRatings.stream()
                    .mapToInt(Rating::getRating)
                    .sum();

            double average = sum / driverRatings.size();

            driver.setAverageRating(Math.round(average * 10.0) / 10.0);
            driver.setTotalRatings((long) driverRatings.size());
        }

        driverProfileRepository.save(driver);

        System.out.println("Driver Average Rating Updated: " + driver.getAverageRating());
    }

    public List<Rating> getDriverRatings(Long driverId) {
        return ratingRepository.findByDriverIdOrderByCreatedAtDesc(driverId);
    }
}