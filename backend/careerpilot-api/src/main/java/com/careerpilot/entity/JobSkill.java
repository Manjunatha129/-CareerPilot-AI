package com.careerpilot.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "job_skills")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @Column(name = "skill_name", nullable = false)
    private String skillName;

    @Column(name = "is_required")
    @Builder.Default
    private Boolean isRequired = true;

    @Builder.Default
    private Double weight = 1.0;
}
