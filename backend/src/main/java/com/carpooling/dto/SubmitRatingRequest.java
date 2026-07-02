package com.carpooling.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmitRatingRequest {
    private Long bookingId;
    private Integer rating;
    private String review;
}
