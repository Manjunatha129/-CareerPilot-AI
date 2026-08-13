package com.careerpilot.controller;

import com.careerpilot.dto.ApiResponse;
import com.careerpilot.dto.MatchResponseDTO;
import com.careerpilot.service.HybridMatchingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class MatchingController {

    private final HybridMatchingService hybridMatchingService;

    @GetMapping("/{jobId}/match")
    public ResponseEntity<ApiResponse<MatchResponseDTO>> getJobMatch(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("jobId") Long jobId
    ) {
        String email = userDetails.getUsername();
        MatchResponseDTO matchResult = hybridMatchingService.calculateJobMatch(email, jobId);
        return ResponseEntity.ok(ApiResponse.success(matchResult, "Job match calculated successfully"));
    }

    @PostMapping("/match/custom")
    public ResponseEntity<ApiResponse<MatchResponseDTO>> getCustomJobMatch(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody com.careerpilot.dto.CustomMatchRequestDTO request
    ) {
        String email = userDetails.getUsername();
        MatchResponseDTO matchResult = hybridMatchingService.calculateCustomJobMatch(email, request);
        return ResponseEntity.ok(ApiResponse.success(matchResult, "Custom job description match calculated successfully"));
    }
}
