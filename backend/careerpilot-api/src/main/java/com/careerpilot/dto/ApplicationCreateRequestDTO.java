package com.careerpilot.dto;

import lombok.Data;

@Data
public class ApplicationCreateRequestDTO {
    private Long jobId;
    private Long resumeId;
    private String status; // SAVED, APPLIED
    private String source;
    private String jobUrl;
    private String notes;
    private String recruiterName;
    private String recruiterEmail;
}
