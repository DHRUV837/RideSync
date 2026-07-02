package com.carpooling.controller;

import com.carpooling.dto.ComplaintRequest;
import com.carpooling.dto.ComplaintResponse;
import com.carpooling.security.JwtTokenProvider;
import com.carpooling.service.ComplaintService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/complaints")
@CrossOrigin(origins = {
        "http://localhost:5174",
        "http://localhost:5175"
})
public class ComplaintController {

    @Autowired
    private ComplaintService complaintService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    /**
     * Create Complaint
     */
    @PostMapping
    public ResponseEntity<ComplaintResponse> createComplaint(
            @RequestBody ComplaintRequest request,
            HttpServletRequest httpRequest) {

        String token = httpRequest.getHeader("Authorization").substring(7);

        Long userId = jwtTokenProvider.getUserIdFromToken(token);

        ComplaintResponse response =
                complaintService.createComplaint(userId, request);

        return ResponseEntity.ok(response);
    }

    /**
     * Logged in user's complaints
     */
    @GetMapping("/my")
    public ResponseEntity<List<ComplaintResponse>> getMyComplaints(
            HttpServletRequest httpRequest) {

        String token = httpRequest.getHeader("Authorization").substring(7);

        Long userId = jwtTokenProvider.getUserIdFromToken(token);

        return ResponseEntity.ok(
                complaintService.getUserComplaints(userId)
        );
    }
}