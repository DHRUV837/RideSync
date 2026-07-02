package com.carpooling.repository;

import com.carpooling.entity.RideBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface RideBookingRepository extends JpaRepository<RideBooking, Long> {

    @Query("SELECT rb FROM RideBooking rb WHERE rb.ride.id = :rideId")
    List<RideBooking> findByRideId(@Param("rideId") Long rideId);

    @Query("SELECT rb FROM RideBooking rb WHERE rb.rider.id = :riderId")
    List<RideBooking> findByRiderId(@Param("riderId") Long riderId);

    @Query("SELECT rb FROM RideBooking rb WHERE rb.rider.user.id = :userId")
    List<RideBooking> findByRiderUserId(@Param("userId") Long userId);

    @Query("SELECT rb FROM RideBooking rb WHERE rb.ride.driver.user.id = :userId")
    List<RideBooking> findByRideDriverUserId(@Param("userId") Long userId);

    @Query("SELECT rb FROM RideBooking rb WHERE rb.ride.driver.user.id = :userId AND rb.status = :status")
    List<RideBooking> findByRideDriverUserIdAndStatus(
            @Param("userId") Long userId,
            @Param("status") RideBooking.BookingStatus status
    );
    @Query("""
SELECT rb
FROM RideBooking rb
WHERE rb.ride.driver.user.id = :userId
AND rb.status IN :statuses
ORDER BY rb.bookedAt DESC
""")
    List<RideBooking> findByRideDriverUserIdAndStatuses(
            @Param("userId") Long userId,
            @Param("statuses") List<RideBooking.BookingStatus> statuses
    );
    long count();

    long countByStatus(RideBooking.BookingStatus status);
    
    @Query("SELECT SUM(rb.fare) FROM RideBooking rb WHERE rb.status = 'COMPLETED'")
    Double getTotalRevenue();
    
    @Query("SELECT SUM(rb.fare) FROM RideBooking rb WHERE rb.status = 'COMPLETED' AND DATE(rb.completedAt) = CURRENT_DATE")
    Double getTodayRevenue();
    
    @Query("SELECT SUM(rb.fare) FROM RideBooking rb WHERE rb.status = 'COMPLETED' AND " +
           "FUNCTION('DATE_TRUNC', 'month', rb.completedAt) = FUNCTION('DATE_TRUNC', 'month', CURRENT_DATE)")
    Double getCurrentMonthRevenue();
    
    @Query("SELECT FUNCTION('DATE_TRUNC', 'month', rb.completedAt) as month, SUM(rb.fare) as revenue " +
           "FROM RideBooking rb WHERE rb.status = 'COMPLETED' AND rb.completedAt >= :startDate " +
           "GROUP BY FUNCTION('DATE_TRUNC', 'month', rb.completedAt) " +
           "ORDER BY month ASC")
    List<Object[]> getRevenueByMonth(@Param("startDate") LocalDateTime startDate);
}