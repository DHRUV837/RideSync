package com.carpooling.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String email;
    private String fullName;
    private String role;
    private String phoneNumber;
    private Boolean isActive;
    private Boolean isBlocked;
    private String profilePhotoUrl;
    private Double averageRating;
    private Long totalRidesCompleted;
    private Double carbonSavingsKg;
    private Double fuelSavingsLiters;
    private String homeAddress;
    private String workAddress;
    private String vehicleNumber;
    private String vehicleModel;
    private Integer vehicleCapacity;
    private Boolean isVerified;
    private Double totalEarnings;
    private Long totalCompletedTrips;
}
