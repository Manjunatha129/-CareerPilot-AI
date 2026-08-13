package com.careerpilot.controller;

import com.careerpilot.dto.*;
import com.careerpilot.service.ApplicationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ApplicationDTO>>> getUserApplications(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "updatedAt") String sortBy) {

        String userEmail = getAuthenticatedUserEmail();
        log.info("Fetching applications for user: {}, status: {}, search: {}", userEmail, status, search);

        PageResponse<ApplicationDTO> result = applicationService.getUserApplications(userEmail, status, page, size, search, sortBy);
        return ResponseEntity.ok(ApiResponse.success(result, "Applications retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ApplicationDTO>> getApplicationById(@PathVariable Long id) {
        String userEmail = getAuthenticatedUserEmail();
        ApplicationDTO dto = applicationService.getApplicationById(userEmail, id);
        return ResponseEntity.ok(ApiResponse.success(dto, "Application details retrieved successfully"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ApplicationDTO>> createApplication(
            @RequestBody ApplicationCreateRequestDTO request) {

        String userEmail = getAuthenticatedUserEmail();
        log.info("Creating application for user: {}, jobId: {}", userEmail, request.getJobId());

        ApplicationDTO dto = applicationService.createApplication(userEmail, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(dto, "Application created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ApplicationDTO>> updateApplication(
            @PathVariable Long id,
            @RequestBody ApplicationUpdateRequestDTO request) {

        String userEmail = getAuthenticatedUserEmail();
        ApplicationDTO dto = applicationService.updateApplication(userEmail, id, request);
        return ResponseEntity.ok(ApiResponse.success(dto, "Application updated successfully"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ApplicationDTO>> updateStatus(
            @PathVariable Long id,
            @RequestBody StatusUpdateRequestDTO request) {

        String userEmail = getAuthenticatedUserEmail();
        log.info("Updating status of application #{} to '{}' for user: {}", id, request.getNewStatus(), userEmail);

        ApplicationDTO dto = applicationService.updateStatus(userEmail, id, request);
        return ResponseEntity.ok(ApiResponse.success(dto, "Application status updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteApplication(@PathVariable Long id) {
        String userEmail = getAuthenticatedUserEmail();
        applicationService.deleteApplication(userEmail, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Application deleted successfully"));
    }

    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<ApplicationMetricsDTO>> getMetrics() {
        String userEmail = getAuthenticatedUserEmail();
        ApplicationMetricsDTO metrics = applicationService.getApplicationMetrics(userEmail);
        return ResponseEntity.ok(ApiResponse.success(metrics, "Application metrics calculated successfully"));
    }

    @PostMapping("/jobs/{jobId}/save")
    public ResponseEntity<ApiResponse<ApplicationDTO>> saveJob(@PathVariable Long jobId) {
        String userEmail = getAuthenticatedUserEmail();
        ApplicationDTO dto = applicationService.saveJob(userEmail, jobId);
        return ResponseEntity.ok(ApiResponse.success(dto, "Job saved successfully"));
    }

    @DeleteMapping("/jobs/{jobId}/save")
    public ResponseEntity<ApiResponse<Void>> unsaveJob(@PathVariable Long jobId) {
        String userEmail = getAuthenticatedUserEmail();
        applicationService.unsaveJob(userEmail, jobId);
        return ResponseEntity.ok(ApiResponse.success(null, "Job unsaved successfully"));
    }

    @GetMapping("/jobs/{jobId}/check")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkJobState(@PathVariable Long jobId) {
        String userEmail = getAuthenticatedUserEmail();
        Map<String, Object> state = applicationService.checkJobState(userEmail, jobId);
        return ResponseEntity.ok(ApiResponse.success(state, "Job application state checked"));
    }

    private String getAuthenticatedUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("Unauthenticated request");
        }
        return auth.getName();
    }
}
