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
    private Boolean isInternship;
    private Integer matchScore;
    private String matchCategory;
    private List<String> matchedSkills;
    private List<String> missingSkills;
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

        String rawSource = (job.getSourceName() != null && !job.getSourceName().isBlank())
                ? job.getSourceName()
                : "SEED_DATA";

        String formattedLabel = formatPlatformLabel(rawSource);
        String directApplyUrl = (job.getSourceUrl() != null && !job.getSourceUrl().isBlank())
                ? job.getSourceUrl()
                : buildPlatformFallbackUrl(rawSource, job.getTitle(), job.getLocation(), job.getCompanyName());

        boolean internshipFlag = "INTERNSHIP".equalsIgnoreCase(job.getEmploymentType())
                || (job.getTitle() != null && (job.getTitle().toLowerCase().contains("intern") || job.getTitle().toLowerCase().contains("trainee")));

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
                .isInternship(internshipFlag)
                .isActive(job.getIsActive())
                .createdAt(job.getCreatedAt())
                .build();
    }

    private static String formatPlatformLabel(String platform) {
        if (platform == null || "SEED_DATA".equalsIgnoreCase(platform)) return "LinkedIn / Indeed";
        if ("Remotive".equalsIgnoreCase(platform)) return "Remotive Jobs";
        if ("Arbeitnow".equalsIgnoreCase(platform)) return "Arbeitnow Jobs";
        if ("Adzuna".equalsIgnoreCase(platform)) return "Adzuna Jobs";
        if ("LinkedIn".equalsIgnoreCase(platform)) return "LinkedIn Jobs";
        if ("Indeed".equalsIgnoreCase(platform)) return "Indeed Jobs";
        if ("Naukri".equalsIgnoreCase(platform)) return "Naukri.com";
        if ("Internshala".equalsIgnoreCase(platform)) return "Internshala";
        return platform;
    }

    private static String buildPlatformFallbackUrl(String platform, String title, String location, String company) {
        String q = (title != null ? title : "Software Engineer");
        String loc = (location != null ? location : "Remote");
        String comp = (company != null ? company : "");

        String encodedQ = URLEncoder.encode(q, StandardCharsets.UTF_8);
        String encodedLoc = URLEncoder.encode(loc, StandardCharsets.UTF_8);

        if ("LinkedIn".equalsIgnoreCase(platform)) {
            return "https://www.linkedin.com/jobs/search/?keywords=" + encodedQ + "&location=" + encodedLoc;
        } else if ("Indeed".equalsIgnoreCase(platform)) {
            return "https://www.indeed.com/jobs?q=" + encodedQ + "&l=" + encodedLoc;
        } else if ("Internshala".equalsIgnoreCase(platform)) {
            String slug = q.toLowerCase().replaceAll("[^a-z0-9]+", "-");
            return "https://internshala.com/internships/matching-preference/keywords-" + slug;
        } else if ("Naukri".equalsIgnoreCase(platform)) {
            String qSlug = q.toLowerCase().replaceAll("[^a-z0-9]+", "-");
            String lSlug = loc.toLowerCase().replaceAll("[^a-z0-9]+", "-");
            return "https://www.naukri.com/" + qSlug + "-jobs-in-" + lSlug;
        } else if ("Remotive".equalsIgnoreCase(platform)) {
            return "https://remotive.com/remote-jobs?search=" + encodedQ;
        } else if ("Adzuna".equalsIgnoreCase(platform)) {
            return "https://www.adzuna.com/search?q=" + encodedQ;
        }
        return "https://www.google.com/search?q=" + URLEncoder.encode(q + " " + comp + " jobs", StandardCharsets.UTF_8);
    }
}
