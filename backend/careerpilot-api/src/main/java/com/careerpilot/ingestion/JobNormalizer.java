package com.careerpilot.ingestion;

import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class JobNormalizer {

    public RawJobData normalize(RawJobData raw) {
        if (raw == null) return null;

        String normalizedTitle = cleanString(raw.getTitle());
        String normalizedCompany = cleanString(raw.getCompany());
        String normalizedLocation = cleanString(raw.getLocation());
        String normalizedDescription = cleanString(raw.getDescription());

        String normalizedWorkMode = normalizeWorkMode(raw.getWorkMode());
        String normalizedEmploymentType = normalizeEmploymentType(raw.getEmploymentType());
        String normalizedExperienceLevel = normalizeExperienceLevel(raw.getExperienceLevel(), normalizedTitle);

        List<String> normalizedReqSkills = normalizeSkills(raw.getRequiredSkills());
        List<String> normalizedNiceSkills = normalizeSkills(raw.getNiceToHaveSkills());

        String sourceName = cleanString(raw.getSourceName());
        if (sourceName == null || sourceName.isEmpty()) {
            sourceName = "SEED_DATA";
        }

        String externalJobId = raw.getId() != null ? raw.getId().toString().trim() : null;

        return RawJobData.builder()
                .id(externalJobId)
                .title(normalizedTitle)
                .company(normalizedCompany)
                .location(normalizedLocation != null ? normalizedLocation : "Remote")
                .workMode(normalizedWorkMode)
                .employmentType(normalizedEmploymentType)
                .experienceLevel(normalizedExperienceLevel)
                .minSalary(raw.getMinSalary())
                .maxSalary(raw.getMaxSalary())
                .description(normalizedDescription)
                .requiredSkills(normalizedReqSkills)
                .niceToHaveSkills(normalizedNiceSkills)
                .sourceName(sourceName)
                .sourceUrl(cleanString(raw.getSourceUrl()))
                .postedDate(cleanString(raw.getPostedDate()))
                .build();
    }

    private String cleanString(String input) {
        if (input == null) return null;
        String trimmed = input.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeWorkMode(String mode) {
        if (mode == null) return "HYBRID";
        String u = mode.toUpperCase();
        if (u.contains("REMOTE")) return "REMOTE";
        if (u.contains("ON_SITE") || u.contains("ONSITE") || u.contains("OFFICE")) return "ON_SITE";
        return "HYBRID";
    }

    private String normalizeEmploymentType(String type) {
        if (type == null) return "FULL_TIME";
        String u = type.toUpperCase();
        if (u.contains("PART")) return "PART_TIME";
        if (u.contains("CONTRACT")) return "CONTRACT";
        if (u.contains("INTERN")) return "INTERNSHIP";
        return "FULL_TIME";
    }

    private String normalizeExperienceLevel(String exp, String title) {
        if (exp != null) {
            String u = exp.toUpperCase();
            if (u.contains("ENTRY") || u.contains("JUNIOR")) return "ENTRY";
            if (u.contains("MID")) return "MID";
            if (u.contains("SENIOR") || u.contains("LEAD") || u.contains("PRINCIPAL")) return "SENIOR";
        }
        if (title != null) {
            String tu = title.toUpperCase();
            if (tu.contains("JUNIOR") || tu.contains("ASSOCIATE") || tu.contains("ENTRY")) return "ENTRY";
            if (tu.contains("SENIOR") || tu.contains("LEAD") || tu.contains("PRINCIPAL") || tu.contains("ARCHITECT")) return "SENIOR";
        }
        return "MID";
    }

    public List<String> normalizeSkills(List<String> rawSkills) {
        if (rawSkills == null || rawSkills.isEmpty()) {
            return Collections.emptyList();
        }

        Set<String> uniqueSkills = new LinkedHashSet<>();
        for (String skill : rawSkills) {
            if (skill != null && !skill.trim().isEmpty()) {
                String clean = skill.trim();
                uniqueSkills.add(clean);
            }
        }
        return new ArrayList<>(uniqueSkills);
    }
}
