package com.careerpilot.ingestion;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Component
public class AdzunaJobSourceConnector implements JobSourceConnector {

    @Value("${adzuna.app.id:}")
    private String appId;

    @Value("${adzuna.app.key:}")
    private String appKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public AdzunaJobSourceConnector() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public String getSourceName() {
        return "Adzuna";
    }

    @Override
    public List<RawJobData> fetchRawJobs() {
        return fetchRawJobsByQuery("developer", "us");
    }

    public List<RawJobData> fetchRawJobsByQuery(String search, String countryCode) {
        if (appId == null || appId.isBlank() || appKey == null || appKey.isBlank()) {
            log.debug("Adzuna API credentials not configured (ADZUNA_APP_ID / ADZUNA_APP_KEY). Skipping Adzuna connector.");
            return Collections.emptyList();
        }

        try {
            String cc = (countryCode != null && !countryCode.isBlank()) ? countryCode.toLowerCase().trim() : "us";
            String q = (search != null && !search.isBlank()) ? search.trim() : "developer";

            String url = String.format(
                    "https://api.adzuna.com/v1/api/jobs/%s/search/1?app_id=%s&app_key=%s&results_per_page=20&what=%s",
                    cc, appId.trim(), appKey.trim(), q
            );

            log.info("Fetching real job postings from official Adzuna API...");
            String responseStr = restTemplate.getForObject(url, String.class);
            if (responseStr == null || responseStr.isBlank()) {
                return Collections.emptyList();
            }

            JsonNode root = objectMapper.readTree(responseStr);
            JsonNode resultsNode = root.get("results");
            if (resultsNode == null || !resultsNode.isArray()) {
                return Collections.emptyList();
            }

            List<RawJobData> result = new ArrayList<>();
            for (JsonNode node : resultsNode) {
                String id = node.has("id") ? node.get("id").asText() : null;
                String title = node.has("title") ? node.get("title").asText() : null;
                String applyUrl = node.has("redirect_url") ? node.get("redirect_url").asText() : null;
                String description = node.has("description") ? node.get("description").asText() : null;

                String company = "Company";
                if (node.has("company") && node.get("company").has("display_name")) {
                    company = node.get("company").get("display_name").asText();
                }

                String location = "Remote";
                if (node.has("location") && node.get("location").has("display_name")) {
                    location = node.get("location").get("display_name").asText();
                }

                BigDecimal minSalary = node.has("salary_min") && !node.get("salary_min").isNull() ? new BigDecimal(node.get("salary_min").asText()) : null;
                BigDecimal maxSalary = node.has("salary_max") && !node.get("salary_max").isNull() ? new BigDecimal(node.get("salary_max").asText()) : null;

                RawJobData rawJob = RawJobData.builder()
                        .id(id)
                        .title(title)
                        .company(company)
                        .location(location)
                        .workMode(location.toLowerCase().contains("remote") ? "REMOTE" : "HYBRID")
                        .employmentType("FULL_TIME")
                        .minSalary(minSalary)
                        .maxSalary(maxSalary)
                        .description(description)
                        .sourceName(getSourceName())
                        .sourceUrl(applyUrl)
                        .build();

                result.add(rawJob);
            }

            log.info("Successfully fetched {} real jobs from Adzuna API", result.size());
            return result;
        } catch (Exception e) {
            log.error("Failed to fetch jobs from Adzuna API: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
