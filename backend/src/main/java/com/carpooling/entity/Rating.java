package com.carpooling.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "ratings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Rating {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    @JsonIgnoreProperties("rating")
    private RideBooking booking;

    @ManyToOne
    @JoinColumn(name = "driver_id", nullable = false)
    @JsonIgnoreProperties("ratings")
    private DriverProfile driver;

    @ManyToOne
    @JoinColumn(name = "rider_id", nullable = false)
    @JsonIgnoreProperties("ratings")
    private RiderProfile rider;

    @Column(nullable = false)
    private Integer rating; // 1-5

    @Column(columnDefinition = "TEXT")
    private String review;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
