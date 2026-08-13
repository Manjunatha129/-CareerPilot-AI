package com.careerpilot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {
    private Long id;
    private Long userId;
    private String headline;
    private String summary;
    private Double totalExperienceYears;
    private String currentLocation;
    private String targetJobTitle;
    private String preferredWorkMode;
    private BigDecimal minExpectedSalary;
    private String educationLevel;
    private List<String> primarySkills;
    private List<String> secondarySkills;
    private Instant createdAt;
    private Instant updatedAt;
}
