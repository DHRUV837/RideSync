package com.carpooling.controller;

import com.carpooling.dto.CarbonSavingsDTO;
import com.carpooling.service.CarbonSavingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/carbon-savings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CarbonSavingsController {

    private final CarbonSavingsService carbonSavingsService;
    @GetMapping("/test")
    public String test() {
        return "Working";
    }
    @GetMapping("/{userId}")
    public ResponseEntity<CarbonSavingsDTO> getCarbonSavings(
            @PathVariable Long userId) {
        System.out.println("Carbon Savings API called");
        System.out.println("Carbon Savings API HIT");
        CarbonSavingsDTO savings =
                carbonSavingsService.getCarbonSavings(userId);

        return ResponseEntity.ok(savings);
    }
}