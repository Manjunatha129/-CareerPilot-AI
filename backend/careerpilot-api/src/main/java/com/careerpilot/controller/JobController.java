package com.careerpilot.controller;

import com.careerpilot.dto.ApiResponse;
import com.careerpilot.dto.JobDTO;
import com.careerpilot.dto.PageResponse;
import com.careerpilot.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    @PostMapping("/ingest/seed")
    public ResponseEntity<ApiResponse<String>> ingestSeedJobs() {
        int importedCount = jobService.ingestSeedJobs();
        return ResponseEntity.ok(ApiResponse.success(
                "Successfully ingested/updated " + importedCount + " seed job postings",
                "Seed jobs import completed"
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

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<JobDTO>> getJobById(@PathVariable("id") Long id) {
        JobDTO job = jobService.getJobById(id);
        return ResponseEntity.ok(ApiResponse.success(job, "Job details retrieved successfully"));
    }
}
