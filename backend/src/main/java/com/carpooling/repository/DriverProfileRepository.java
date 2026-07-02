package com.carpooling.repository;

import com.carpooling.entity.DriverProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface DriverProfileRepository extends JpaRepository<DriverProfile, Long> {
    DriverProfile findByUserId(Long userId);
    long countByIsVerifiedTrue();
    
    @Query("SELECT COUNT(d) FROM DriverProfile d WHERE d.user.createdAt >= :date")
    long countByUserCreatedAtAfter(@Param("date") LocalDateTime date);
    
    @Query("SELECT d FROM DriverProfile d ORDER BY d.averageRating DESC")
    List<DriverProfile> findTop5ByOrderByAverageRatingDesc();
    
    @Query("SELECT d FROM DriverProfile d ORDER BY d.averageRating ASC")
    List<DriverProfile> findTop5ByOrderByAverageRatingAsc();
    
    @Query("SELECT d FROM DriverProfile d ORDER BY d.totalCompletedTrips DESC")
    List<DriverProfile> findTop5ByOrderByTotalCompletedTripsDesc();
}
