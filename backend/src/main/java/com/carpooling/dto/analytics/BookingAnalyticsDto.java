package com.carpooling.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingAnalyticsDto {
    private Long totalBookings;
    private Long completedBookings;
    private Long cancelledBookings;
}
