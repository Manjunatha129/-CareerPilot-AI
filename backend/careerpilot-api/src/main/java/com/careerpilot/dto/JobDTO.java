package com.careerpilot.dto;

import com.careerpilot.entity.Company;
import com.careerpilot.entity.Job;
import com.careerpilot.entity.JobSkill;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobDTO {
    private Long id;
    private Long companyId;
    private String companyName;
    private String companyIndustry;
    private String companyWebsite;
    private String title;
    private String sourceName; // e.g. LinkedIn, Naukri, Indeed
    private String sourceLabel; // e.g. LinkedIn Jobs, Naukri.com, Indeed Jobs
    private String applyUrl; // Direct job application URL
    private String externalJobId;
    private String location;
    private String workMode; // REMOTE, HYBRID, ON_SITE
    private String employmentType; // FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP
    private String experienceLevel; // ENTRY, MID, SENIOR
    private BigDecimal minSalary;
    private BigDecimal maxSalary;
    private String description;
    private List<String> requiredSkills;
    private List<String> niceToHaveSkills;
    private Boolean isActive;
    private Instant createdAt;

    public static JobDTO fromEntity(Job job, Company company, List<JobSkill> jobSkills) {
        if (job == null) return null;

        List<String> required = jobSkills != null ? jobSkills.stream()
                .filter(s -> Boolean.TRUE.equals(s.getIsRequired()))
                .map(JobSkill::getSkillName)
                .collect(Collectors.toList()) : List.of();

        List<String> optional = jobSkills != null ? jobSkills.stream()
                .filter(s -> Boolean.FALSE.equals(s.getIsRequired()))
                .map(JobSkill::getSkillName)
                .collect(Collectors.toList()) : List.of();

        String rawSource = (job.getSourceName() != null && !job.getSourceName().isBlank() && !"SEED_DATA".equalsIgnoreCase(job.getSourceName()))
                ? job.getSourceName()
                : resolvePlatformByTitle(job.getTitle(), job.getId());

        String formattedLabel = formatPlatformLabel(rawSource);
        String directApplyUrl = buildApplyUrl(rawSource, job.getTitle(), job.getLocation());

        return JobDTO.builder()
                .id(job.getId())
                .companyId(job.getCompanyId())
                .companyName(company != null ? company.getName() : job.getCompanyName())
                .companyIndustry(company != null ? company.getIndustry() : null)
                .companyWebsite(company != null ? company.getWebsite() : null)
                .title(job.getTitle())
                .sourceName(rawSource)
                .sourceLabel(formattedLabel)
                .applyUrl(directApplyUrl)
                .externalJobId(job.getExternalJobId())
                .location(job.getLocation())
                .workMode(job.getWorkMode())
                .employmentType(job.getEmploymentType())
                .experienceLevel(job.getExperienceLevel())
                .minSalary(job.getMinSalary())
                .maxSalary(job.getMaxSalary())
                .description(job.getDescriptionRaw())
                .requiredSkills(required)
                .niceToHaveSkills(optional)
                .isActive(job.getIsActive())
                .createdAt(job.getCreatedAt())
                .build();
    }

    private static String resolvePlatformByTitle(String title, Long jobId) {
        if (jobId == null) return "LinkedIn";
        long rem = jobId % 3;
        if (rem == 1) return "LinkedIn";
        if (rem == 2) return "Naukri";
        return "Indeed";
    }

    private static String formatPlatformLabel(String platform) {
        if ("Naukri".equalsIgnoreCase(platform)) return "Naukri.com";
        if ("Indeed".equalsIgnoreCase(platform)) return "Indeed Jobs";
        if ("Glassdoor".equalsIgnoreCase(platform)) return "Glassdoor";
        return "LinkedIn Jobs";
    }

    private static String buildApplyUrl(String platform, String title, String location) {
        try {
            String query = URLEncoder.encode(title + " " + (location != null ? location : ""), StandardCharsets.UTF_8);
            if ("Naukri".equalsIgnoreCase(platform)) {
                return "https://www.naukri.com/" + URLEncoder.encode(title.toLowerCase().replace(" ", "-"), StandardCharsets.UTF_8) + "-jobs";
            }
            if ("Indeed".equalsIgnoreCase(platform)) {
                return "https://www.indeed.com/jobs?q=" + query;
            }
            return "https://www.linkedin.com/jobs/search/?keywords=" + query;
        } catch (Exception e) {
            return "https://www.linkedin.com/jobs/";
        }
    }
}
