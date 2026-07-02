package com.carpooling.dto;

import lombok.Data;

@Data
public class AdminWarningRequest {

    private Long driverUserId;

    private String title;

    private String message;

}