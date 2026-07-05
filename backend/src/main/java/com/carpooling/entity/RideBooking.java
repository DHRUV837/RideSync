package com.carpooling.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "ride_bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RideBooking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ride_id", nullable = false)
    @JsonIgnoreProperties("bookings")
    private Ride ride;

    @ManyToOne
    @JoinColumn(name = "rider_id", nullable = false)
    private RiderProfile rider;

    @Column(nullable = false)
    private Double pickupLatitude;

    @Column(nullable = false)
    private Double pickupLongitude;

    @Column(nullable = false)
    private String pickupAddress;

    @Column(nullable = false)
    private Double dropoffLatitude;

    @Column(nullable = false)
    private Double dropoffLongitude;

    @Column(nullable = false)
    private String dropoffAddress;

    @Column(nullable = false, columnDefinition = "integer default 0")
    private Integer pickupStopSequence = 0;

    @Column(nullable = false, columnDefinition = "integer default 0")
    private Integer dropoffStopSequence = 0;

    @Column(nullable = false)
    private Integer seatsBooked;

    @Column(nullable = false)
    private Double fare;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "booking_status", nullable = false)
    private BookingStatus status;  // PENDING, ACCEPTED, CONFIRMED, ONGOING, COMPLETED, CANCELLED, REJECTED

    @Column(nullable = false)
    private LocalDateTime bookedAt;

    private String otp;

    private LocalDateTime acceptedAt;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    private LocalDateTime cancelledAt;

    public enum BookingStatus {
        PENDING, ACCEPTED, CONFIRMED, ONGOING, COMPLETED, CANCELLED, REJECTED
    }
}
