package com.careerpilot.ingestion;

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
public class RawJobData {
    private String id; // Could be integer or string in source
    private String company;
    private String title;
    private String location;
    private String workMode;
    private String employmentType;
    private String experienceLevel;
    private BigDecimal minSalary;
    private BigDecimal maxSalary;
    private String description;
    private List<String> requiredSkills;
    private List<String> niceToHaveSkills;
    private String sourceName;
    private String sourceUrl;
    private String postedDate;
}
