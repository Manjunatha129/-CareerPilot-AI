package com.careerpilot.controller;

import com.careerpilot.dto.ApiResponse;
import com.careerpilot.dto.JobDTO;
import com.careerpilot.dto.JobSourceStatusDTO;
import com.careerpilot.dto.PageResponse;
import com.careerpilot.service.JobService;
import com.careerpilot.service.ResumeJobSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;
    private final ResumeJobSearchService resumeJobSearchService;

    @GetMapping("/recommended")
    public ResponseEntity<ApiResponse<List<JobDTO>>> getRecommendedJobs(
            Authentication authentication,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "workMode", required = false) String workMode,
            @RequestParam(value = "employmentType", required = false) String employmentType,
            @RequestParam(value = "experienceLevel", required = false) String experienceLevel,
            @RequestParam(value = "source", required = false) String source,
            @RequestParam(value = "limit", defaultValue = "15") int limit
    ) {
        String userEmail = authentication != null ? authentication.getName() : "demo@careerpilot.ai";
        List<JobDTO> recommendations = resumeJobSearchService.getPersonalizedRecommendations(
                userEmail, search, location, workMode, employmentType, experienceLevel, source, false, limit
        );
        return ResponseEntity.ok(ApiResponse.success(recommendations, "Personalized job recommendations fetched successfully"));
    }

    @GetMapping("/internships")
    public ResponseEntity<ApiResponse<List<JobDTO>>> getRecommendedInternships(
            Authentication authentication,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "workMode", required = false) String workMode,
            @RequestParam(value = "employmentType", required = false) String employmentType,
            @RequestParam(value = "experienceLevel", required = false) String experienceLevel,
            @RequestParam(value = "source", required = false) String source,
            @RequestParam(value = "limit", defaultValue = "15") int limit
    ) {
        String userEmail = authentication != null ? authentication.getName() : "demo@careerpilot.ai";
        List<JobDTO> internships = resumeJobSearchService.getPersonalizedRecommendations(
                userEmail, search, location, workMode, employmentType, experienceLevel, source, true, limit
        );
        return ResponseEntity.ok(ApiResponse.success(internships, "Personalized internship recommendations fetched successfully"));
    }

    @GetMapping("/sources")
    public ResponseEntity<ApiResponse<List<JobSourceStatusDTO>>> getJobSources() {
        List<JobSourceStatusDTO> sources = jobService.getConnectedSources();
        return ResponseEntity.ok(ApiResponse.success(sources, "Job sources retrieved successfully"));
    }

    @PostMapping("/ingest/seed")
    public ResponseEntity<ApiResponse<String>> ingestSeedJobs() {
        int importedCount = jobService.ingestSeedJobs();
        return ResponseEntity.ok(ApiResponse.success(
                "Successfully ingested/updated " + importedCount + " seed job postings",
                "Seed jobs import completed"
        ));
    }

    @PostMapping("/ingest/live")
    public ResponseEntity<ApiResponse<String>> ingestLiveJobs(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "location", required = false) String location
    ) {
        int importedCount = jobService.fetchAndIngestLiveJobs(search, location);
        return ResponseEntity.ok(ApiResponse.success(
                "Successfully fetched and ingested " + importedCount + " real live job postings from external APIs",
                "Live jobs import completed"
        ));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<JobDTO>>> searchJobs(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "workMode", required = false) String workMode,
            @RequestParam(value = "employmentType", required = false) String employmentType,
            @RequestParam(value = "experienceLevel", required = false) String experienceLevel,
            @RequestParam(value = "company", required = false) String company,
            @RequestParam(value = "source", required = false) String source,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sortBy", defaultValue = "createdAt") String sortBy,
            @RequestParam(value = "sortDirection", defaultValue = "DESC") String sortDirection
    ) {
        PageResponse<JobDTO> jobsPage = jobService.searchJobs(
                search, location, workMode, employmentType, experienceLevel, company, source,
                page, size, sortBy, sortDirection
        );
        return ResponseEntity.ok(ApiResponse.success(jobsPage, "Jobs retrieved successfully"));
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<JobDTO>> getJobById(@PathVariable("id") Long id) {
        JobDTO job = jobService.getJobById(id);
        return ResponseEntity.ok(ApiResponse.success(job, "Job details retrieved successfully"));
    }
}
