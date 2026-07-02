package com.carpooling.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "complaints")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Complaint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "complainant_id", nullable = false)
    private User complainant;

    @ManyToOne
    @JoinColumn(name = "respondent_id", nullable = false)
    private User respondent;

    @ManyToOne
    @JoinColumn(name = "ride_id")
    private Ride ride;

    @Column(nullable = false)
    private String subject;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(nullable = false, columnDefinition = "complaint_status")
    @Enumerated(EnumType.STRING)
    private ComplaintStatus status; // PENDING, UNDER_REVIEW, RESOLVED, REJECTED

    private String resolution;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime resolvedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum ComplaintStatus {
        PENDING, UNDER_REVIEW, RESOLVED, REJECTED
    }
}
