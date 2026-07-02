package com.carpooling.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RideAnalyticsDto {
    private Long totalRides;
    private Long activeRides;
    private Long completedRides;
    private Long cancelledRides;
}
