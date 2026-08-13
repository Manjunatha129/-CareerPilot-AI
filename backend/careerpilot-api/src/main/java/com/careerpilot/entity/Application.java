package com.careerpilot.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "applications", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "job_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @Column(name = "resume_id")
    private Long resumeId;

    @Column(nullable = false)
    @Builder.Default
    private String status = "SAVED"; // SAVED, APPLIED, SCREENING, INTERVIEW, TECHNICAL_INTERVIEW, HR_INTERVIEW, OFFER, REJECTED, WITHDRAWN, ACCEPTED

    @Column(name = "applied_date")
    private Instant appliedDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(length = 100)
    private String source; // e.g. "LinkedIn", "Company Portal", "Campus Placement", "Referral"

    @Column(name = "job_url", length = 500)
    private String jobUrl;

    @Column(name = "recruiter_name", length = 150)
    private String recruiterName;

    @Column(name = "recruiter_email", length = 150)
    private String recruiterEmail;

    @Column(name = "current_stage", length = 100)
    private String currentStage;

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
