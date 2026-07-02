package com.carpooling.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlatformOverviewDto {
    private Long totalUsers;
    private Long totalDrivers;
    private Long totalRiders;
    private Long verifiedDrivers;
    private Long blockedUsers;
}
