package com.careerpilot.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "candidate_skills")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "profile_id", nullable = false)
    private Long profileId;

    @Column(name = "skill_name", nullable = false)
    private String skillName;

    @Column(name = "proficiency_level")
    @Builder.Default
    private String proficiencyLevel = "INTERMEDIATE"; // BEGINNER, INTERMEDIATE, ADVANCED, EXPERT

    @Column(name = "years_experience")
    private Double yearsExperience;

    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = false;
}
