package com.carpooling.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ComplaintResponse {

    private Long id;

    private String subject;

    private String description;

    private String status;

    private String respondentName;

    private Long rideId;

    private String resolution;

    private LocalDateTime createdAt;

}