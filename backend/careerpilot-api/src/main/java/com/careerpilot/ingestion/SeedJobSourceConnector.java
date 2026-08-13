package com.careerpilot.ingestion;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.List;

@Slf4j
@Component
public class SeedJobSourceConnector implements JobSourceConnector {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String getSourceName() {
        return "SEED_DATA";
    }

    @Override
    public List<RawJobData> fetchRawJobs() {
        // Try multiple standard relative locations for sample-data/jobs/seed-jobs.json
        Path[] candidatePaths = new Path[] {
                Paths.get("sample-data/jobs/seed-jobs.json"),
                Paths.get("../sample-data/jobs/seed-jobs.json"),
                Paths.get("../../sample-data/jobs/seed-jobs.json"),
                Paths.get("c:/Users/manju/Downloads/AI Intelligence Platform/sample-data/jobs/seed-jobs.json")
        };

        for (Path path : candidatePaths) {
            if (Files.exists(path)) {
                try {
                    log.info("Loading seed jobs from file: {}", path.toAbsolutePath());
                    List<RawJobData> rawJobs = objectMapper.readValue(path.toFile(), new TypeReference<List<RawJobData>>() {});
                    for (RawJobData raw : rawJobs) {
                        if (raw.getSourceName() == null) {
                            raw.setSourceName(getSourceName());
                        }
                    }
                    log.info("Successfully loaded {} raw seed jobs from disk", rawJobs.size());
                    return rawJobs;
                } catch (Exception e) {
                    log.error("Failed to parse seed jobs JSON from path {}: {}", path, e.getMessage());
                }
            }
        }

        // Fallback: Check classpath if packaged
        try (InputStream is = getClass().getResourceAsStream("/seed-jobs.json")) {
            if (is != null) {
                log.info("Loading seed jobs from classpath resource /seed-jobs.json");
                List<RawJobData> rawJobs = objectMapper.readValue(is, new TypeReference<List<RawJobData>>() {});
                for (RawJobData raw : rawJobs) {
                    if (raw.getSourceName() == null) {
                        raw.setSourceName(getSourceName());
                    }
                }
                return rawJobs;
            }
        } catch (Exception e) {
            log.error("Failed to load seed jobs from classpath: {}", e.getMessage());
        }

        log.warn("Could not locate sample-data/jobs/seed-jobs.json. Returning empty seed list.");
        return Collections.emptyList();
    }
}
