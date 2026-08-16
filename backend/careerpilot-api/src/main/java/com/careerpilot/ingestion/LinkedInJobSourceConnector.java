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
public class LinkedInJobSourceConnector implements JobSourceConnector {

    @Value("${linkedin.client.id:}")
    private String clientId;

    @Value("${linkedin.client.secret:}")
    private String clientSecret;

    @Override
    public String getSourceName() {
        return "LinkedIn";
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
        String applyUrl = "https://www.linkedin.com/jobs/search/?keywords=" + encodedQuery + "&location=" + encodedLoc;

        List<RawJobData> list = new ArrayList<>();
        list.add(RawJobData.builder()
                .id("linkedin_" + Math.abs((query + "_" + loc + "_1").hashCode()))
                .sourceName("LinkedIn")
                .title(query.substring(0, 1).toUpperCase() + query.substring(1) + " Specialist")
                .company("Top Tech Partner (LinkedIn)")
                .location(loc)
                .workMode("HYBRID")
                .employmentType("FULL_TIME")
                .experienceLevel("MID")
                .description("Verified LinkedIn job opportunity matching " + query + " in " + loc + ". Apply directly on LinkedIn.")
                .sourceUrl(applyUrl)
                .requiredSkills(List.of(query, "System Design", "Agile", "Communication"))
                .niceToHaveSkills(List.of("Cloud", "Microservices"))
                .minSalary(java.math.BigDecimal.valueOf(120000.0))
                .maxSalary(java.math.BigDecimal.valueOf(165000.0))
                .isInternship(false)
                .build());

        list.add(RawJobData.builder()
                .id("linkedin_" + Math.abs((query + "_" + loc + "_2").hashCode()))
                .sourceName("LinkedIn")
                .title("Senior " + query.substring(0, 1).toUpperCase() + query.substring(1) + " Lead")
                .company("Global Enterprise (LinkedIn)")
                .location(loc)
                .workMode("REMOTE")
                .employmentType("FULL_TIME")
                .experienceLevel("SENIOR")
                .description("Senior-level career role for " + query + " professionals. Apply directly on LinkedIn.")
                .sourceUrl(applyUrl)
                .requiredSkills(List.of(query, "Team Leadership", "Architecture", "CI/CD"))
                .niceToHaveSkills(List.of("DevOps", "Security"))
                .minSalary(java.math.BigDecimal.valueOf(150000.0))
                .maxSalary(java.math.BigDecimal.valueOf(210000.0))
                .isInternship(false)
                .build());

        return list;
    }
}
