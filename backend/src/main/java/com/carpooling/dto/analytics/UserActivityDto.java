package com.carpooling.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserActivityDto {
    private Long newUsersThisMonth;
    private Long newDriversThisMonth;
    private Long newRidersThisMonth;
}
