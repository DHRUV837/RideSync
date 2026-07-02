package com.carpooling.repository;

import com.carpooling.entity.RiderProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface RiderProfileRepository extends JpaRepository<RiderProfile, Long> {
    RiderProfile findByUserId(Long userId);
    
    @Query("SELECT COUNT(r) FROM RiderProfile r WHERE r.user.createdAt >= :date")
    long countByUserCreatedAtAfter(@Param("date") LocalDateTime date);
}
