package com.carpooling.controller;

import com.carpooling.dto.OptimizeRouteRequest;
import com.carpooling.dto.OptimizeRouteResponse;
import com.carpooling.service.RouteOptimizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/optimize-route")
@CrossOrigin(origins = {"http://localhost:5174", "http://localhost:5175"})
public class RouteOptimizationController {

    @Autowired
    private RouteOptimizationService routeOptimizationService;

    @PostMapping
    public ResponseEntity<Object> optimizeRoute(@RequestBody OptimizeRouteRequest request) {
        try {
            OptimizeRouteResponse response = routeOptimizationService.optimizeRide(request.getRideId());
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            e.printStackTrace();   // <-- ADD THIS

            Map<String, String> error = new HashMap<>();
            error.put("error", "Could not optimize route: " + e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);

        }
    }
}
