package com.carpooling.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RideStopDto {
    private String stopName;
    private Double latitude;
    private Double longitude;
    private String address;
    private Integer stopOrder;
    private Double fareFromOrigin;
}
