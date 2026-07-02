package com.carpooling.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "rider_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RiderProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties("riderProfile")
    private User user;

    @Column(name = "home_latitude")
    private Double homeLatitude;

    @Column(name = "home_longitude")
    private Double homeLongitude;

    @Column(name = "home_address")
    private String homeAddress;

    @Column(name = "work_latitude")
    private Double workLatitude;

    @Column(name = "work_longitude")
    private Double workLongitude;

    @Column(name = "work_address")
    private String workAddress;

    @Column(name = "total_rides_completed")
    private Long totalRidesCompleted = 0L;

    @Column(name = "carbon_savings_kg")
    private Double carbonSavingsKg = 0.0;

    @Column(name = "fuel_savings_liters")
    private Double fuelSavingsLiters = 0.0;

    @Column(name = "is_verified", nullable = false)
    private Boolean isVerified = false;

    @Column(name = "identity_proof_url")
    private String identityProofUrl;

    @Column(name = "preferences")
    private String preferences;
}