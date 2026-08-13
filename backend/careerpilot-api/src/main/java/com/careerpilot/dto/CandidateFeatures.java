package com.careerpilot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateFeatures {
    private Long userId;
    private String fullName;
    private String email;
    private String targetJobTitle;
    private String currentLocation;
    private String preferredWorkMode;
    private Double totalExperienceYears;
    private String educationLevel; // BACHELORS, MASTERS, PHD, DIPLOMA, HIGH_SCHOOL
    private BigDecimal minExpectedSalary;
    private List<String> primarySkills;
    private List<String> secondarySkills;
    private List<String> resumeSkills;
    private String resumeText;
    private String professionalSummary;
}
