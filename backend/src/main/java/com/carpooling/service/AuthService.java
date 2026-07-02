package com.carpooling.service;

import com.carpooling.dto.AuthResponse;
import com.carpooling.dto.LoginRequest;
import com.carpooling.dto.RegisterRequest;
import com.carpooling.dto.UserProfileResponse;
import com.carpooling.entity.DriverProfile;
import com.carpooling.entity.RiderProfile;
import com.carpooling.entity.User;
import com.carpooling.repository.DriverProfileRepository;
import com.carpooling.repository.RiderProfileRepository;
import com.carpooling.repository.UserRepository;
import com.carpooling.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RiderProfileRepository riderProfileRepository;

    @Autowired
    private DriverProfileRepository driverProfileRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return new AuthResponse(null, null, null, null, null, "Email already registered");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(User.UserRole.valueOf(request.getRole().toUpperCase()));
        user.setIsActive(true);
        user.setIsBlocked(false);

        User savedUser = userRepository.save(user);

        if (request.getRole().equalsIgnoreCase("RIDER")) {
            RiderProfile riderProfile = new RiderProfile();
            riderProfile.setUser(savedUser);
            riderProfileRepository.save(riderProfile);
        } else if (request.getRole().equalsIgnoreCase("DRIVER")) {
            DriverProfile driverProfile = new DriverProfile();
            driverProfile.setUser(savedUser);
            driverProfile.setLicenseNumber("LIC-" + savedUser.getId());
            driverProfile.setVehicleNumber("VEH-" + savedUser.getId());
            driverProfile.setVehicleModel("Unknown");
            driverProfile.setVehicleCapacity(4);
            driverProfileRepository.save(driverProfile);
        }

        String token = jwtTokenProvider.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole().toString());

        return new AuthResponse(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getFullName(),
                savedUser.getRole().toString(),
                token,
                "Registration successful"
        );
    }

    public AuthResponse login(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isEmpty()) {
            return new AuthResponse(null, null, null, null, null, "User not found");
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return new AuthResponse(null, null, null, null, null, "Invalid credentials");
        }

        if (user.getIsBlocked()) {
            return new AuthResponse(null, null, null, null, null, "User is blocked");
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole().toString());

        return new AuthResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().toString(),
                token,
                "Login successful"
        );
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId).orElse(null);
    }

    public UserProfileResponse getUserProfile(Long userId) {
        User user = getUserById(userId);
        if (user == null) {
            return null;
        }

        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setRole(user.getRole().name().toLowerCase());
        response.setPhoneNumber(user.getPhoneNumber());
        response.setIsActive(user.getIsActive());
        response.setIsBlocked(user.getIsBlocked());
        response.setProfilePhotoUrl(user.getProfilePhotoUrl());
        response.setAverageRating(user.getAverageRating());

        if (user.getRole() == User.UserRole.RIDER) {
            RiderProfile riderProfile = riderProfileRepository.findByUserId(userId);
            if (riderProfile != null) {
                response.setTotalRidesCompleted(riderProfile.getTotalRidesCompleted());
                response.setCarbonSavingsKg(riderProfile.getCarbonSavingsKg());
                response.setFuelSavingsLiters(riderProfile.getFuelSavingsLiters());
                response.setHomeAddress(riderProfile.getHomeAddress());
                response.setWorkAddress(riderProfile.getWorkAddress());
                response.setIsVerified(riderProfile.getIsVerified());
            }
        } else if (user.getRole() == User.UserRole.DRIVER) {
            DriverProfile driverProfile = driverProfileRepository.findByUserId(userId);
            if (driverProfile != null) {
                response.setVehicleNumber(driverProfile.getVehicleNumber());
                response.setVehicleModel(driverProfile.getVehicleModel());
                response.setVehicleCapacity(driverProfile.getVehicleCapacity());
                response.setIsVerified(driverProfile.getIsVerified());
                response.setTotalEarnings(driverProfile.getTotalEarnings());
                response.setTotalCompletedTrips(driverProfile.getTotalCompletedTrips());
            }
        }

        return response;
    }

    public boolean validateToken(String token) {
        return jwtTokenProvider.validateToken(token);
    }

    public Long getUserIdFromToken(String token) {
        return jwtTokenProvider.getUserIdFromToken(token);
    }
}
