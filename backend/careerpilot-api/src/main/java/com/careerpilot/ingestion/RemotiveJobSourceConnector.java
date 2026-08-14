package com.careerpilot.ingestion;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Component
public class RemotiveJobSourceConnector implements JobSourceConnector {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private static final String REMOTIVE_API_URL = "https://remotive.com/api/remote-jobs";

    public RemotiveJobSourceConnector() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public String getSourceName() {
        return "Remotive";
    }

    @Override
    public List<RawJobData> fetchRawJobs() {
        return fetchRawJobsByQuery(null, null);
    }

    public List<RawJobData> fetchRawJobsByQuery(String search, String location) {
        try {
            StringBuilder urlBuilder = new StringBuilder(REMOTIVE_API_URL).append("?limit=25");
            if (search != null && !search.trim().isEmpty()) {
                urlBuilder.append("&search=").append(search.trim());
            }

            log.info("Fetching real job postings from Remotive API: {}", urlBuilder);
            String responseStr = restTemplate.getForObject(urlBuilder.toString(), String.class);
            if (responseStr == null || responseStr.isBlank()) {
                log.warn("Remotive API returned empty response.");
                return Collections.emptyList();
            }

            JsonNode root = objectMapper.readTree(responseStr);
            JsonNode jobsNode = root.get("jobs");
            if (jobsNode == null || !jobsNode.isArray()) {
                return Collections.emptyList();
            }

            List<RawJobData> result = new ArrayList<>();
            for (JsonNode node : jobsNode) {
                String id = node.has("id") ? node.get("id").asText() : null;
                String title = node.has("title") ? node.get("title").asText() : null;
                String company = node.has("company_name") ? node.get("company_name").asText() : null;
                String applyUrl = node.has("url") ? node.get("url").asText() : null;
                String jobLocation = node.has("candidate_required_location") ? node.get("candidate_required_location").asText() : "Remote";
                String description = node.has("description") ? node.get("description").asText() : null;
                String jobType = node.has("job_type") ? node.get("job_type").asText() : "full_time";
                String publicationDate = node.has("publication_date") ? node.get("publication_date").asText() : null;

                List<String> tags = new ArrayList<>();
                if (node.has("tags") && node.get("tags").isArray()) {
                    for (JsonNode tagNode : node.get("tags")) {
                        tags.add(tagNode.asText());
                    }
                }

                if (node.has("category") && !node.get("category").isNull()) {
                    tags.add(node.get("category").asText());
                }

                RawJobData rawJob = RawJobData.builder()
                        .id(id)
                        .title(title)
                        .company(company)
                        .location(jobLocation)
                        .workMode("REMOTE")
                        .employmentType(jobType)
                        .description(description)
                        .requiredSkills(tags)
                        .sourceName(getSourceName())
                        .sourceUrl(applyUrl)
                        .postedDate(publicationDate)
                        .build();

                result.add(rawJob);
            }

            log.info("Successfully fetched {} real jobs from Remotive API", result.size());
            return result;
        } catch (Exception e) {
            log.error("Failed to fetch jobs from Remotive API: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
