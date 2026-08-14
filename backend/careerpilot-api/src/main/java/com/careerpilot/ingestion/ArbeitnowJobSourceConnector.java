package com.careerpilot.ingestion;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Component
public class ArbeitnowJobSourceConnector implements JobSourceConnector {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private static final String ARBEITNOW_API_URL = "https://www.arbeitnow.com/api/v1/jobs";

    public ArbeitnowJobSourceConnector() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public String getSourceName() {
        return "Arbeitnow";
    }

    @Override
    public List<RawJobData> fetchRawJobs() {
        return fetchRawJobsByQuery(null, null);
    }

    public List<RawJobData> fetchRawJobsByQuery(String search, String location) {
        try {
            log.info("Fetching real job postings from Arbeitnow API...");
            String responseStr = restTemplate.getForObject(ARBEITNOW_API_URL, String.class);
            if (responseStr == null || responseStr.isBlank()) {
                return Collections.emptyList();
            }

            JsonNode root = objectMapper.readTree(responseStr);
            JsonNode dataNode = root.get("data");
            if (dataNode == null || !dataNode.isArray()) {
                return Collections.emptyList();
            }

            List<RawJobData> result = new ArrayList<>();
            for (JsonNode node : dataNode) {
                String id = node.has("slug") ? node.get("slug").asText() : null;
                String title = node.has("title") ? node.get("title").asText() : null;
                String company = node.has("company_name") ? node.get("company_name").asText() : null;
                String applyUrl = node.has("url") ? node.get("url").asText() : null;
                String jobLocation = node.has("location") ? node.get("location").asText() : "Global";
                String description = node.has("description") ? node.get("description").asText() : null;
                boolean isRemote = node.has("remote") && node.get("remote").asBoolean();

                List<String> tags = new ArrayList<>();
                if (node.has("tags") && node.get("tags").isArray()) {
                    for (JsonNode tagNode : node.get("tags")) {
                        tags.add(tagNode.asText());
                    }
                }

                if (search != null && !search.trim().isEmpty()) {
                    String query = search.toLowerCase().trim();
                    boolean matches = (title != null && title.toLowerCase().contains(query)) ||
                            (company != null && company.toLowerCase().contains(query)) ||
                            tags.stream().anyMatch(t -> t.toLowerCase().contains(query));
                    if (!matches) continue;
                }

                RawJobData rawJob = RawJobData.builder()
                        .id(id)
                        .title(title)
                        .company(company)
                        .location(jobLocation)
                        .workMode(isRemote ? "REMOTE" : "HYBRID")
                        .employmentType("FULL_TIME")
                        .description(description)
                        .requiredSkills(tags)
                        .sourceName(getSourceName())
                        .sourceUrl(applyUrl)
                        .build();

                result.add(rawJob);
            }

            log.info("Successfully fetched {} matching real jobs from Arbeitnow API", result.size());
            return result;
        } catch (Exception e) {
            log.error("Failed to fetch jobs from Arbeitnow API: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
