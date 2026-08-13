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
public class JobFeatures {
    private Long jobId;
    private String title;
    private String companyName;
    private String location;
    private String workMode; // REMOTE, HYBRID, ON_SITE
    private String employmentType;
    private String experienceLevel; // ENTRY, MID, SENIOR
    private BigDecimal minSalary;
    private BigDecimal maxSalary;
    private String descriptionRaw;
    private List<String> requiredSkills;
    private List<String> niceToHaveSkills;
}
