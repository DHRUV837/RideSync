package com.carpooling.controller;

import com.carpooling.dto.UserProfileResponse;
import com.carpooling.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = {"http://localhost:5174", "http://localhost:5175"})
public class UserController {

    @Autowired
    private AuthService authService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getProfile(@RequestHeader(value = "Authorization", required = false) String token) {
        if (token == null || token.isBlank()) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        String jwt = token;
        if (token.startsWith("Bearer ")) {
            jwt = token.substring(7);
        }

        if (!authService.validateToken(jwt)) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        Long userId = authService.getUserIdFromToken(jwt);
        UserProfileResponse profile = authService.getUserProfile(userId);

        if (profile == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        return new ResponseEntity<>(profile, HttpStatus.OK);
    }
}
