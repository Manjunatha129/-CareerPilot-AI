package com.careerpilot.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
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
public class ProfileRequest {

    @Size(max = 255, message = "Headline must be under 255 characters")
    private String headline;

    @Size(max = 2000, message = "Summary must be under 2000 characters")
    private String summary;

    @Min(value = 0, message = "Years of experience cannot be negative")
    private Double totalExperienceYears;

    private String currentLocation;

    private String targetJobTitle;

    private String preferredWorkMode; // REMOTE, HYBRID, ON_SITE

    private BigDecimal minExpectedSalary;

    private String educationLevel; // BACHELORS, MASTERS, PHD

    private List<String> primarySkills;

    private List<String> secondarySkills;
}
