package com.carpooling.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDto {
    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String role;
    private String status;
    private Boolean isBlocked;
    private LocalDateTime joinedAt;
}
