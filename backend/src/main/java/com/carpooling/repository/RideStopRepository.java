package com.carpooling.repository;

import com.carpooling.entity.RideStop;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RideStopRepository extends JpaRepository<RideStop, Long> {
    List<RideStop> findByRideIdOrderByStopOrderAsc(Long rideId);
}
