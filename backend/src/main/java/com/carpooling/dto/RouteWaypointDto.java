package com.carpooling.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RouteWaypointDto {
    private String id;
    private String type;
    private Double latitude;
    private Double longitude;
    private String label;
    private String address;
    private Long riderId;
    private String riderName;
}
