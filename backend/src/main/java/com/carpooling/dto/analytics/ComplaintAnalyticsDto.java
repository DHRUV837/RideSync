package com.carpooling.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintAnalyticsDto {
    private Long pendingComplaints;
    private Long underReview;
    private Long resolved;
    private Long rejected;
}
