package com.carpooling.repository;

import com.carpooling.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    Optional<Rating> findByBookingId(Long bookingId);
    List<Rating> findByDriverId(Long driverId);
    List<Rating> findByDriverIdOrderByCreatedAtDesc(Long driverId);
}
