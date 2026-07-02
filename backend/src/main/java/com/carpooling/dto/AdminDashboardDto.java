package com.carpooling.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardDto {
    private Long totalUsers;
    private Long totalDrivers;
    private Long totalRiders;
    private Long totalRides;
    private Long activeRides;
    private Long completedRides;
    private Long cancelledRides;
    private Double totalRevenue;
    private Double todayRevenue;
    private Double monthlyRevenue;
    private Long openComplaints;
}
