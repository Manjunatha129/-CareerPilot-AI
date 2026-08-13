package com.careerpilot.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id")
    private Long companyId;

    @Column(name = "company_name")
    private String companyName;

    @Column(nullable = false)
    private String title;

    @Column(name = "source_name")
    @Builder.Default
    private String sourceName = "SEED_DATA";

    @Column(name = "external_job_id")
    private String externalJobId;

    private String location;

    @Column(name = "work_mode")
    @Builder.Default
    private String workMode = "HYBRID"; // REMOTE, HYBRID, ON_SITE

    @Column(name = "employment_type")
    @Builder.Default
    private String employmentType = "FULL_TIME";

    @Column(name = "experience_level")
    private String experienceLevel; // ENTRY, MID, SENIOR

    @Column(name = "min_salary", precision = 12, scale = 2)
    private BigDecimal minSalary;

    @Column(name = "max_salary", precision = 12, scale = 2)
    private BigDecimal maxSalary;

    @Column(name = "description_raw", nullable = false, columnDefinition = "TEXT")
    private String descriptionRaw;

    @Column(name = "parsed_requirements", columnDefinition = "TEXT")
    private String parsedRequirements;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
