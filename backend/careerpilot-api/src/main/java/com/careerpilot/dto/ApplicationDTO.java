package com.careerpilot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationDTO {
    private Long id;
    private Long userId;
    private Long jobId;
    private String jobTitle;
    private String companyName;
    private String location;
    private String workMode;
    private Integer officialMatchScore; // Phase 7 score reference
    private Long resumeId;
    private String resumeFileName;
    private String status;
    private Instant appliedDate;
    private String notes;
    private String source;
    private String jobUrl;
    private String recruiterName;
    private String recruiterEmail;
    private String currentStage;
    private Instant createdAt;
    private Instant updatedAt;
    private List<StatusHistoryDTO> history;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusHistoryDTO {
        private Long id;
        private Long applicationId;
        private String previousStatus;
        private String newStatus;
        private Instant changedAt;
        private String note;
    }
}
