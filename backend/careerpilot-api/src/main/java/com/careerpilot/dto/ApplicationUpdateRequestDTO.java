package com.careerpilot.dto;

import lombok.Data;

@Data
public class ApplicationUpdateRequestDTO {
    private String status;
    private Long resumeId;
    private String notes;
    private String source;
    private String jobUrl;
    private String recruiterName;
    private String recruiterEmail;
    private String currentStage;
}
