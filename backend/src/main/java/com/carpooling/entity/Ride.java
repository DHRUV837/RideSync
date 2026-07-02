package com.carpooling.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "rides")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ride {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "driver_id", nullable = false)
    private DriverProfile driver;

    @Column(nullable = false)
    private Double startLatitude;

    @Column(nullable = false)
    private Double startLongitude;

    @Column(nullable = false)
    private String startAddress;

    @Column(nullable = false)
    private Double endLatitude;

    @Column(nullable = false)
    private Double endLongitude;

    @Column(nullable = false)
    private String endAddress;

    @Column(nullable = false)
    private Integer availableSeats;

    @Column(nullable = false)
    private Double estimatedFare;

    @Column(nullable = false)
    private LocalDateTime departureTime;

    private LocalDateTime arrivalTime;

    @Column(nullable = false, columnDefinition = "ride_status")
    @Enumerated(EnumType.STRING)
    private RideStatus status; // PENDING, ONGOING, COMPLETED, CANCELLED

    @Column(columnDefinition = "TEXT")
    private String optimizedRoute; // JSON

    @Column(columnDefinition = "TEXT")
    private String routeGeometry; // encoded OSRM geometry as JSON array

    private Double totalDistance; // in km

    private Long totalDuration; // in minutes

    @OneToMany(mappedBy = "ride", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("ride")
    private List<RideStop> stops;

    @OneToMany(mappedBy = "ride", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("ride")
    private List<RideBooking> bookings;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum RideStatus {
        PENDING, ONGOING, COMPLETED, CANCELLED
    }
}
