package com.carpooling.controller;

import com.carpooling.entity.Notification;
import com.carpooling.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
@CrossOrigin(origins = {"http://localhost:5174", "http://localhost:5175"})
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private com.carpooling.security.JwtTokenProvider jwtTokenProvider;

    @GetMapping
    public ResponseEntity<Object> getUserNotifications(@RequestHeader("Authorization") String token) {
        try {
            Long userId = extractUserIdFromToken(token);
            List<Notification> notifications = notificationService.getUserNotifications(userId);
            return new ResponseEntity<>(notifications, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Could not fetch notifications: " + e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/unread")
    public ResponseEntity<Object> getUnreadNotifications(@RequestHeader("Authorization") String token) {
        try {
            Long userId = extractUserIdFromToken(token);
            List<Notification> notifications = notificationService.getUnreadNotifications(userId);
            return new ResponseEntity<>(notifications, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Could not fetch unread notifications: " + e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/unread/count")
    public ResponseEntity<Object> getUnreadCount(@RequestHeader("Authorization") String token) {
        try {
            Long userId = extractUserIdFromToken(token);
            Long count = notificationService.getUnreadCount(userId);
            Map<String, Long> response = new HashMap<>();
            response.put("count", count);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Could not fetch unread count: " + e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Object> markAsRead(@PathVariable Long notificationId) {
        try {
            Notification notification = notificationService.markAsRead(notificationId);
            return new ResponseEntity<>(notification, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Could not mark notification as read: " + e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/read-all")
    public ResponseEntity<Object> markAllAsRead(@RequestHeader("Authorization") String token) {
        try {
            Long userId = extractUserIdFromToken(token);
            notificationService.markAllAsRead(userId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "All notifications marked as read");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Could not mark all notifications as read: " + e.getMessage());
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
