package com.carpooling.repository;

import com.carpooling.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhoneNumber(String phoneNumber);
    long countByRole(User.UserRole role);
    long countByIsBlockedTrue();
    long countByCreatedAtAfter(LocalDateTime date);
}
