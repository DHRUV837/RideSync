package com.carpooling.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminComplaintDto {
    private Long id;
    private String subject;
    private String description;
    private String status;
    private String resolution;
    private LocalDateTime createdAt;
    private String complainantName;
    private String complainantEmail;
    private String respondentName;
    private String respondentEmail;
    private Long rideId;
}
