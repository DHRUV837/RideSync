package com.carpooling.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyGrowthDto {
    private List<MonthlyRideCountDto> monthlyRideCounts;
    private List<MonthlyRevenueDto> monthlyRevenues;
}
