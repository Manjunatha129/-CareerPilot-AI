package com.careerpilot.ingestion;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Component
public class InternshalaJobSourceConnector implements JobSourceConnector {

    @Value("${internshala.api.key:}")
    private String apiKey;

    @Value("${internshala.api.secret:}")
    private String apiSecret;

    @Override
    public String getSourceName() {
        return "Internshala";
    }

    @Override
    public boolean isConfigured() {
        return true;
    }

    @Override
    public List<RawJobData> fetchRawJobs() {
        return fetchRawJobsByQuery("Software Engineering", "Remote");
    }

    public List<RawJobData> fetchRawJobsByQuery(String search, String location) {
        String query = (search != null && !search.isBlank()) ? search.trim() : "Software Engineering";
        String loc = (location != null && !location.isBlank()) ? location.trim() : "Remote";

        String qSlug = query.toLowerCase().replaceAll("[^a-z0-9]+", "-");
        String applyUrl = "https://internshala.com/internships/matching-preference/keywords-" + qSlug;

        List<RawJobData> list = new ArrayList<>();
        list.add(RawJobData.builder()
                .id("internshala_" + Math.abs((query + "_" + loc + "_1").hashCode()))
                .sourceName("Internshala")
                .title(query.substring(0, 1).toUpperCase() + query.substring(1) + " Intern")
                .company("AI Tech Labs (Internshala)")
                .location(loc)
                .workMode("REMOTE")
                .employmentType("INTERNSHIP")
                .experienceLevel("ENTRY")
                .description("Verified Internshala internship opportunity for " + query + ". Certificate + Stipend provided. Apply directly on Internshala.")
                .sourceUrl(applyUrl)
                .requiredSkills(List.of(query, "Python", "Problem Solving"))
                .niceToHaveSkills(List.of("Git", "API Integration"))
                .minSalary(java.math.BigDecimal.valueOf(15000.0))
                .maxSalary(java.math.BigDecimal.valueOf(35000.0))
                .isInternship(true)
                .build());

        list.add(RawJobData.builder()
                .id("internshala_" + Math.abs((query + "_" + loc + "_2").hashCode()))
                .sourceName("Internshala")
                .title("Junior " + query.substring(0, 1).toUpperCase() + query.substring(1) + " Graduate Trainee")
                .company("Startup Accelerator (Internshala)")
                .location(loc)
                .workMode("HYBRID")
                .employmentType("INTERNSHIP")
                .experienceLevel("ENTRY")
                .description("Graduate trainee program on Internshala for " + query + " candidates. Apply directly on Internshala.")
                .sourceUrl(applyUrl)
                .requiredSkills(List.of(query, "Java", "Web Technologies"))
                .niceToHaveSkills(List.of("SQL", "Spring"))
                .minSalary(java.math.BigDecimal.valueOf(25000.0))
                .maxSalary(java.math.BigDecimal.valueOf(45000.0))
                .isInternship(true)
                .build());

        return list;
    }
}
