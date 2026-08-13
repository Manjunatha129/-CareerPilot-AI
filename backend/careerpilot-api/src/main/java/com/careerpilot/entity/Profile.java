package com.careerpilot.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    private String headline;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "total_experience_years")
    @Builder.Default
    private Double totalExperienceYears = 0.0;

    @Column(name = "current_location")
    private String currentLocation;

    @Column(name = "target_job_title")
    private String targetJobTitle;

    @Column(name = "preferred_work_mode")
    @Builder.Default
    private String preferredWorkMode = "HYBRID"; // REMOTE, HYBRID, ON_SITE

    @Column(name = "min_expected_salary", precision = 12, scale = 2)
    private BigDecimal minExpectedSalary;

    @Column(name = "education_level")
    private String educationLevel; // BACHELORS, MASTERS, PHD

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
