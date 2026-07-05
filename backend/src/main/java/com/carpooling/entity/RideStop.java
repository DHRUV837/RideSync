package com.carpooling.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ride_stops")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RideStop {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ride_id", nullable = false)
    @JsonIgnoreProperties("stops")
    private Ride ride;

    @Column(name = "stop_order", nullable = false)
    private Integer stopOrder;

    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @Column(name = "stop_name", nullable = false)
    private String stopName;

    @Column(name = "address", nullable = false)
    private String address;

    @Column(name = "fare_from_origin", nullable = false)
    private Double fareFromOrigin;

    @Column(name = "stop_type")
    private String stopType;

    @Column(name = "is_completed")
    private Boolean isCompleted = false;
}