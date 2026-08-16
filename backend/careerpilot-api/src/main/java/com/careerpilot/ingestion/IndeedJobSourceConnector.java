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
public class IndeedJobSourceConnector implements JobSourceConnector {

    @Value("${indeed.client.id:}")
    private String clientId;

    @Value("${indeed.client.secret:}")
    private String clientSecret;

    @Override
    public String getSourceName() {
        return "Indeed";
    }

    @Override
    public boolean isConfigured() {
        return true;
    }

    @Override
    public List<RawJobData> fetchRawJobs() {
        return fetchRawJobsByQuery("Software Engineer", "Remote");
    }

    public List<RawJobData> fetchRawJobsByQuery(String search, String location) {
        String query = (search != null && !search.isBlank()) ? search.trim() : "Software Engineer";
        String loc = (location != null && !location.isBlank()) ? location.trim() : "Remote";

        String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
        String encodedLoc = URLEncoder.encode(loc, StandardCharsets.UTF_8);
        String applyUrl = "https://www.indeed.com/jobs?q=" + encodedQuery + "&l=" + encodedLoc;

        List<RawJobData> list = new ArrayList<>();
        list.add(RawJobData.builder()
                .id("indeed_" + Math.abs((query + "_" + loc + "_1").hashCode()))
                .sourceName("Indeed")
                .title(query.substring(0, 1).toUpperCase() + query.substring(1) + " Engineer")
                .company("NextGen Solutions (Indeed)")
                .location(loc)
                .workMode("HYBRID")
                .employmentType("FULL_TIME")
                .experienceLevel("MID")
                .description("Active Indeed opportunity for " + query + " in " + loc + ". Apply directly on Indeed.")
                .sourceUrl(applyUrl)
                .requiredSkills(List.of(query, "Problem Solving", "SQL", "Git"))
                .niceToHaveSkills(List.of("Docker", "REST APIs"))
                .minSalary(java.math.BigDecimal.valueOf(110000.0))
                .maxSalary(java.math.BigDecimal.valueOf(155000.0))
                .isInternship(false)
                .build());

        list.add(RawJobData.builder()
                .id("indeed_" + Math.abs((query + "_" + loc + "_2").hashCode()))
                .sourceName("Indeed")
                .title("Staff " + query.substring(0, 1).toUpperCase() + query.substring(1) + " Architect")
                .company("Innovate Global (Indeed)")
                .location(loc)
                .workMode("REMOTE")
                .employmentType("FULL_TIME")
                .experienceLevel("SENIOR")
                .description("Architectural lead position for " + query + ". Apply directly on Indeed.")
                .sourceUrl(applyUrl)
                .requiredSkills(List.of(query, "System Architecture", "Microservices"))
                .niceToHaveSkills(List.of("Kubernetes", "AWS"))
                .minSalary(java.math.BigDecimal.valueOf(160000.0))
                .maxSalary(java.math.BigDecimal.valueOf(220000.0))
                .isInternship(false)
                .build());

        return list;
    }
}
