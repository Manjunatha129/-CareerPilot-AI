package com.careerpilot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobSearchProfile {
    private Long userId;
    private String candidateName;
    private String candidateEmail;
    @Builder.Default
    private List<String> primarySkills = new ArrayList<>();
    @Builder.Default
    private List<String> secondarySkills = new ArrayList<>();
    @Builder.Default
    private List<String> technologies = new ArrayList<>();
    private String degree;
    private String educationLevel;
    private Double experienceYears;
    private String experienceLevel;
    @Builder.Default
    private List<String> preferredRoles = new ArrayList<>();
    @Builder.Default
    private List<String> preferredLocations = new ArrayList<>();
    private String preferredWorkMode;
    private Boolean internshipEligible;
    @Builder.Default
    private List<String> searchQueries = new ArrayList<>();
}
