package com.carpooling.service;

import com.carpooling.dto.*;
import com.carpooling.entity.Complaint;
import com.carpooling.entity.RideBooking;
import com.carpooling.entity.User;
import com.carpooling.entity.DriverProfile;
import com.carpooling.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.time.LocalDate;
import java.time.YearMonth;

import com.carpooling.entity.Ride;
import com.carpooling.entity.RideBooking;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private DriverProfileRepository driverProfileRepository;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private RideBookingRepository bookingRepository;

    public List<AdminUserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapUserToDto)
                .collect(Collectors.toList());
    }

    public List<AdminComplaintDto> getAllComplaints() {
        return complaintRepository.findAll().stream()
                .map(this::mapComplaintToDto)
                .collect(Collectors.toList());
    }

    public AdminComplaintDto updateComplaintStatus(Long complaintId, ComplaintStatusUpdateRequest request) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        Complaint.ComplaintStatus status = Complaint.ComplaintStatus.valueOf(request.getStatus().toUpperCase());
        complaint.setStatus(status);
        if (request.getResolution() != null) {
            complaint.setResolution(request.getResolution());
        }
        if (status == Complaint.ComplaintStatus.RESOLVED || status == Complaint.ComplaintStatus.REJECTED) {
            complaint.setResolvedAt(LocalDateTime.now());
        }
        complaintRepository.save(complaint);

// Notify the complainant (Rider/Driver who submitted the complaint)
        if (status == Complaint.ComplaintStatus.RESOLVED) {

            notificationService.createNotification(
                    complaint.getComplainant().getId(),
                    "Complaint Resolved",
                    "Your complaint regarding \"" + complaint.getSubject()
                            + "\" has been resolved by the administrator.",
                    "COMPLAINT_RESOLVED",
                    complaint.getId()
            );

        }
        else if (status == Complaint.ComplaintStatus.REJECTED) {

            notificationService.createNotification(
                    complaint.getComplainant().getId(),
                    "Complaint Rejected",
                    "Your complaint regarding \"" + complaint.getSubject()
                            + "\" has been rejected by the administrator.",
                    "COMPLAINT_REJECTED",
                    complaint.getId()
            );

        }

        return mapComplaintToDto(complaint);
    }
    public void warnDriver(Long complaintId) {

        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        User driverUser = complaint.getRespondent();

        DriverProfile driver = driverProfileRepository.findByUserId(driverUser.getId());

        if (driver == null) {
            throw new RuntimeException("Driver profile not found");
        }

        int warnings = driver.getWarningCount() == null ? 0 : driver.getWarningCount();

        warnings++;

        driver.setWarningCount(warnings);

        driverProfileRepository.save(driver);

        notificationService.createNotification(
                driverUser.getId(),
                "Administrator Warning",
                "You have received an official warning regarding complaint: \""
                        + complaint.getSubject() + "\".\nCurrent warnings: "
                        + warnings + "/3",
                "WARNING",
                complaint.getId()
        );

        if (warnings >= 3) {

            driverUser.setIsBlocked(true);
            driverUser.setIsActive(false);

            userRepository.save(driverUser);

            notificationService.createNotification(
                    driverUser.getId(),
                    "Account Blocked",
                    "Your account has been blocked after receiving 3 warnings.",
                    "ACCOUNT_BLOCKED",
                    complaint.getId()
            );
        }
    }
    public AdminUserDto updateUserStatus(Long userId, UserStatusUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (request.getIsBlocked() != null) {
            user.setIsBlocked(request.getIsBlocked());
            user.setIsActive(!request.getIsBlocked());
        }

        if (request.getIsVerified() != null && user.getRole() == User.UserRole.DRIVER) {
            DriverProfile driver = driverProfileRepository.findByUserId(userId);
            if (driver != null) {
                driver.setIsVerified(request.getIsVerified());
                if (request.getIsVerified()) {
                    driver.setVerificationDate(LocalDateTime.now());
                }
                driverProfileRepository.save(driver);
            }
        }

        userRepository.save(user);
        return mapUserToDto(user);
    }

    private AdminUserDto mapUserToDto(User user) {
        String status = "active";
        if (user.getIsBlocked()) {
            status = "blocked";
        } else if (user.getRole() == User.UserRole.DRIVER) {
            DriverProfile driver = driverProfileRepository.findByUserId(user.getId());
            if (driver != null && driver.getIsVerified()) {
                status = "verified";
            } else {
                status = "pending";
            }
        } else if (!user.getIsActive()) {
            status = "inactive";
        }

        return new AdminUserDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getRole().name().toLowerCase(),
                status,
                user.getIsBlocked(),
                user.getCreatedAt()
        );
    }

    private AdminComplaintDto mapComplaintToDto(Complaint complaint) {
        return new AdminComplaintDto(
                complaint.getId(),
                complaint.getSubject(),
                complaint.getDescription(),
                complaint.getStatus().name().toLowerCase(),
                complaint.getResolution(),
                complaint.getCreatedAt(),
                complaint.getComplainant().getFullName(),
                complaint.getComplainant().getEmail(),
                complaint.getRespondent().getFullName(),
                complaint.getRespondent().getEmail(),
                complaint.getRide() != null ? complaint.getRide().getId() : null
        );
    }
    public AdminDashboardDto getDashboardStats() {

        long totalUsers = userRepository.count();

        long totalDrivers = userRepository.findAll()
                .stream()
                .filter(u -> u.getRole() == User.UserRole.DRIVER)
                .count();

        long totalRiders = userRepository.findAll()
                .stream()
                .filter(u -> u.getRole() == User.UserRole.RIDER)
                .count();

        long totalRides = rideRepository.count();

        long activeRides = rideRepository.findAll()
                .stream()
                .filter(r -> r.getStatus() == Ride.RideStatus.ONGOING)
                .count();

        long completedRides = rideRepository.findAll()
                .stream()
                .filter(r -> r.getStatus() == Ride.RideStatus.COMPLETED)
                .count();

        long cancelledRides = rideRepository.findAll()
                .stream()
                .filter(r -> r.getStatus() == Ride.RideStatus.CANCELLED)
                .count();

        double totalRevenue = bookingRepository.findAll()
                .stream()
                .filter(b -> b.getStatus() == RideBooking.BookingStatus.COMPLETED)
                .mapToDouble(RideBooking::getFare)
                .sum();

        double todayRevenue = bookingRepository.findAll()
                .stream()
                .filter(b ->
                        b.getStatus() == RideBooking.BookingStatus.COMPLETED &&
                                b.getCompletedAt() != null &&
                                b.getCompletedAt().toLocalDate().equals(LocalDate.now()))
                .mapToDouble(RideBooking::getFare)
                .sum();

        YearMonth currentMonth = YearMonth.now();

        double monthlyRevenue = bookingRepository.findAll()
                .stream()
                .filter(b ->
                        b.getStatus() == RideBooking.BookingStatus.COMPLETED &&
                                b.getCompletedAt() != null &&
                                YearMonth.from(b.getCompletedAt()).equals(currentMonth))
                .mapToDouble(RideBooking::getFare)
                .sum();


        long openComplaints = complaintRepository.findAll()
                .stream()
                .filter(c ->
                        c.getStatus() == Complaint.ComplaintStatus.PENDING ||
                                c.getStatus() == Complaint.ComplaintStatus.UNDER_REVIEW
                )
                .count();
        return new AdminDashboardDto(
                totalUsers,
                totalDrivers,
                totalRiders,
                totalRides,
                activeRides,
                completedRides,
                cancelledRides,
                totalRevenue,
                todayRevenue,
                monthlyRevenue,
                openComplaints
        );
    }
    public void warnDriver( AdminWarningRequest request){

        User driver = userRepository.findById(request.getDriverUserId())
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        if (driver.getRole() != User.UserRole.DRIVER) {
            throw new RuntimeException("Selected user is not a driver.");
        }

        notificationService.createNotification(
                driver.getId(),
                request.getTitle(),
                request.getMessage(),
                "ADMIN_WARNING",
                null
        );
    }
}
