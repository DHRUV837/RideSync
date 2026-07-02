package com.carpooling.dto;

import lombok.Data;

@Data
public class ComplaintRequest {

    private Long respondentId;

    private Long rideId;

    private String subject;

    private String description;
}