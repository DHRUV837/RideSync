package com.carpooling.repository;

import com.carpooling.entity.Ride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface RideRepository extends JpaRepository<Ride, Long> {
    
    @Query("SELECT r FROM Ride r WHERE r.driver.user.id = :driverId AND r.status = :status")
    List<Ride> findByDriverUserIdAndStatus(@Param("driverId") Long driverId, @Param("status") Ride.RideStatus status);
    
    @Query("SELECT r FROM Ride r WHERE r.driver.user.id = :userId")
    List<Ride> findByDriverUserId(@Param("userId") Long userId);
    
    @Query("SELECT r FROM Ride r WHERE r.status = :status AND r.departureTime > :time")
    List<Ride> findAvailableRides(@Param("status") Ride.RideStatus status, @Param("time") LocalDateTime time);
    
    List<Ride> findByAvailableSeatsGreaterThan(Integer seats);
    long countByStatus(Ride.RideStatus status);

    @Query("SELECT COUNT(r) FROM Ride r")
    long getTotalRides();
    long count();
    
    @Query("SELECT FUNCTION('DATE_TRUNC', 'month', r.createdAt) as month, COUNT(r) as rideCount " +
           "FROM Ride r WHERE r.createdAt >= :startDate " +
           "GROUP BY FUNCTION('DATE_TRUNC', 'month', r.createdAt) " +
           "ORDER BY month ASC")
    List<Object[]> countRidesByMonth(@Param("startDate") LocalDateTime startDate);
}
