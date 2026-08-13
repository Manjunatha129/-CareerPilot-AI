package com.careerpilot.controller;

import com.careerpilot.dto.ApiResponse;
import com.careerpilot.dto.ResumeDTO;
import com.careerpilot.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<ResumeDTO>> uploadResume(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file
    ) {
        String email = userDetails.getUsername();
        ResumeDTO resume = resumeService.uploadAndAnalyzeResume(email, file);
        return ResponseEntity.ok(ApiResponse.success(resume, "Resume uploaded and analyzed successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ResumeDTO>>> getUserResumes(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String email = userDetails.getUsername();
        List<ResumeDTO> resumes = resumeService.getUserResumes(email);
        return ResponseEntity.ok(ApiResponse.success(resumes, "User resumes retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ResumeDTO>> getResumeById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("id") Long id
    ) {
        String email = userDetails.getUsername();
        ResumeDTO resume = resumeService.getResumeById(email, id);
        return ResponseEntity.ok(ApiResponse.success(resume, "Resume details retrieved successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteResume(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("id") Long id
    ) {
        String email = userDetails.getUsername();
        resumeService.deleteResume(email, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Resume deleted successfully"));
    }
}
