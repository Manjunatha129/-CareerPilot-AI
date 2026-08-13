package com.careerpilot.dto;

import com.careerpilot.entity.Resume;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeDTO {
    private Long id;
    private Long userId;
    private String fileName;
    private String fileType;
    private Long fileSizeBytes;
    private String status; // UPLOADED, PROCESSING, PROCESSED, FAILED
    private String contentType;
    private String rawText;
    private String parsedJson;
    private Integer completenessScore;
    private Boolean isPrimary;
    private String errorMessage;
    private Instant processedAt;
    private Instant createdAt;

    public static ResumeDTO fromEntity(Resume resume) {
        if (resume == null) return null;
        return ResumeDTO.builder()
                .id(resume.getId())
                .userId(resume.getUserId())
                .fileName(resume.getFileName())
                .fileType(resume.getFileType())
                .fileSizeBytes(resume.getFileSizeBytes())
                .status(resume.getStatus())
                .contentType(resume.getContentType())
                .rawText(resume.getRawText())
                .parsedJson(resume.getParsedJson())
                .completenessScore(resume.getCompletenessScore())
                .isPrimary(resume.getIsPrimary())
                .errorMessage(resume.getErrorMessage())
                .processedAt(resume.getProcessedAt())
                .createdAt(resume.getCreatedAt())
                .build();
    }
}
