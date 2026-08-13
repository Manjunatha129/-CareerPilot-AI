package com.careerpilot.controller;

import com.careerpilot.dto.ApiResponse;
import com.careerpilot.dto.CareerIntelligenceDTO;
import com.careerpilot.service.CareerIntelligenceService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/career-intelligence")
@RequiredArgsConstructor
public class CareerIntelligenceController {

    private final CareerIntelligenceService careerIntelligenceService;

    @GetMapping
    public ResponseEntity<ApiResponse<CareerIntelligenceDTO>> getCareerIntelligenceDashboard() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();

        log.info("Fetching Career Intelligence dashboard for user: {}", userEmail);

        CareerIntelligenceDTO dto = careerIntelligenceService.analyzeCareer(userEmail, "Career Overview Dashboard", null);
        return ResponseEntity.ok(ApiResponse.success(dto, "Career Intelligence analysis retrieved successfully"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CareerIntelligenceDTO>> runCareerIntelligence(
            @RequestBody(required = false) CareerIntelligenceRequest request) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();

        String query = request != null ? request.getQuery() : null;
        Long targetJobId = request != null ? request.getTargetJobId() : null;

        log.info("Executing Career Intelligence analysis for user: {}, query: '{}', targetJobId: {}", userEmail, query, targetJobId);

        CareerIntelligenceDTO dto = careerIntelligenceService.analyzeCareer(userEmail, query, targetJobId);
        return ResponseEntity.ok(ApiResponse.success(dto, "Career Intelligence workflow executed successfully"));
    }

    @Data
    public static class CareerIntelligenceRequest {
        private String query;
        private Long targetJobId;
    }
}
