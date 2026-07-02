package com.carpooling.dto;

import lombok.Data;

import java.util.List;

@Data
public class CarbonSavingsDTO {

    private int totalRidesCompleted;

    private double carbonSavingsKg;

    private double fuelSavingsLiters;

    private double moneySaved;

    private List<MonthlyCarbonDTO> monthlySavings;
}