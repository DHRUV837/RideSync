package com.carpooling.controller;

import com.carpooling.dto.SubmitRatingRequest;
import com.carpooling.entity.Rating;
import com.carpooling.security.JwtTokenProvider;
import com.carpooling.service.RatingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ratings")
@CrossOrigin(origins = {"http://localhost:5174", "http://localhost:5175"})
public class RatingController {

    @Autowired
    private RatingService ratingService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @PostMapping
    public ResponseEntity<Object> submitRating(@RequestBody SubmitRatingRequest request,
                                               @RequestHeader("Authorization") String token) {
        try {
            Long riderId = extractUserIdFromToken(token);
            String message = ratingService.submitRating(riderId, request);
            Map<String, String> response = new HashMap<>();
            response.put("message", message);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Could not submit rating: " + e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<Object> getDriverRatings(@PathVariable Long driverId) {
        try {
            List<Rating> ratings = ratingService.getDriverRatings(driverId);
            return new ResponseEntity<>(ratings, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Could not fetch ratings: " + e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        }
    }

    private Long extractUserIdFromToken(String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Authorization header is missing");
        }
        String jwt = token;
        if (token.startsWith("Bearer ")) {
            jwt = token.substring(7).trim();
        }
        if (!jwtTokenProvider.validateToken(jwt)) {
            throw new IllegalArgumentException("Invalid token");
        }
        return jwtTokenProvider.getUserIdFromToken(jwt);
    }
}
