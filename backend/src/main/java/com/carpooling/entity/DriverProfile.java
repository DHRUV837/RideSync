package com.carpooling.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "driver_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriverProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties("driverProfile")
    private User user;

    @Column(name = "license_number", nullable = false, unique = true)
    private String licenseNumber;

    @Column(name = "vehicle_number", nullable = false, unique = true)
    private String vehicleNumber;

    @Column(name = "vehicle_model", nullable = false)
    private String vehicleModel;

    @Column(name = "vehicle_capacity", nullable = false)
    private Integer vehicleCapacity;

    @Column(name = "vehicle_color")
    private String vehicleColor;

    @Column(name = "is_verified", nullable = false)
    private Boolean isVerified = false;

    @Column(name = "verification_date")
    private LocalDateTime verificationDate;

    @Column(name = "license_photo_url")
    private String licensePhotoUrl;

    @Column(name = "vehicle_photo_url")
    private String vehiclePhotoUrl;

    @Column(name = "total_rides_completed")
    private Long totalRidesCompleted = 0L;

    @Column(name = "total_earnings")
    private Double totalEarnings = 0.0;

    @Column(name = "ongoing_commission")
    private Double ongoingCommission = 0.0;

    @Column(name = "is_online")
    private Boolean isOnline = false;

    @Column(name = "current_latitude")
    private Double currentLatitude;

    @Column(name = "current_longitude")
    private Double currentLongitude;

    @Column(name = "total_completed_trips")
    private Long totalCompletedTrips = 0L;

    @Column(name = "average_rating")
    private Double averageRating = 0.0;

    @Column(name = "total_ratings")
    private Long totalRatings = 0L;
    @Column(name = "warning_count")
    private Integer warningCount = 0;
}