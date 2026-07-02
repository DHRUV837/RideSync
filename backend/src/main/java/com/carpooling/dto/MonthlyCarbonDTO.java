package com.carpooling.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MonthlyCarbonDTO {

    private String month;
    private double carbonSaved;
}