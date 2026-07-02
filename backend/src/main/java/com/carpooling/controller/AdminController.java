package com.carpooling.controller;

import com.carpooling.dto.*;
import com.carpooling.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = {"http://localhost:5174", "http://localhost:5175"})
public class AdminController {

        @Autowired
        private AdminService adminService;

        @GetMapping("/users")
        public ResponseEntity<List<AdminUserDto>> getUsers() {
            return new ResponseEntity<>(adminService.getAllUsers(), HttpStatus.OK);
        }

        @GetMapping("/complaints")
        public ResponseEntity<List<AdminComplaintDto>> getComplaints() {
            return new ResponseEntity<>(adminService.getAllComplaints(), HttpStatus.OK);
        }

        @PutMapping("/complaints/{complaintId}")
        public ResponseEntity<?> updateComplaint(@PathVariable Long complaintId,
                                                 @RequestBody ComplaintStatusUpdateRequest request) {
            try {
                return new ResponseEntity<>(adminService.updateComplaintStatus(complaintId, request), HttpStatus.OK);
            } catch (IllegalArgumentException e) {
                Map<String, String> error = new HashMap<>();
                error.put("error", e.getMessage());
                return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
            } catch (Exception e) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Could not update complaint: " + e.getMessage());
                return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
            }
        }
        @PutMapping("/complaints/{complaintId}/warn")
        public ResponseEntity<?> warnDriver(@PathVariable Long complaintId) {

            try {

                adminService.warnDriver(complaintId);

                Map<String, String> response = new HashMap<>();
                response.put("message", "Driver warned successfully");

                return ResponseEntity.ok(response);

            } catch (Exception e) {

                Map<String, String> error = new HashMap<>();
                error.put("error", e.getMessage());

                return ResponseEntity.badRequest().body(error);
            }
        }
        @PutMapping("/users/{userId}/status")
        public ResponseEntity<?> updateUserStatus(@PathVariable Long userId,
                                                  @RequestBody UserStatusUpdateRequest request) {
            try {
                return new ResponseEntity<>(adminService.updateUserStatus(userId, request), HttpStatus.OK);
            } catch (IllegalArgumentException e) {
                Map<String, String> error = new HashMap<>();
                error.put("error", e.getMessage());
                return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
            } catch (Exception e) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Could not update user status: " + e.getMessage());
                return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
            }
        }
        @GetMapping("/dashboard")
        public ResponseEntity<AdminDashboardDto> getDashboard() {
            return ResponseEntity.ok(adminService.getDashboardStats());
        }
    @PostMapping("/warn-driver")
    public ResponseEntity<?> warnDriver(
            @RequestBody AdminWarningRequest request) {

        try {

            adminService.warnDriver(request);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Warning sent successfully.");

            return ResponseEntity.ok(response);

        } catch (Exception e) {

            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());

            return ResponseEntity.badRequest().body(error);
        }
    }

}
