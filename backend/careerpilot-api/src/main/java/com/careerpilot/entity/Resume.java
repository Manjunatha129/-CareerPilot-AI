package com.careerpilot.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "resumes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "file_type", nullable = false)
    private String fileType; // PDF, DOCX

    @Column(name = "file_size_bytes", nullable = false)
    private Long fileSizeBytes;

    @Column(name = "raw_text", columnDefinition = "TEXT")
    private String rawText;

    @Column(name = "parsed_json", columnDefinition = "TEXT")
    private String parsedJson;

    @Column(name = "completeness_score")
    @Builder.Default
    private Integer completenessScore = 0;

    @Column(name = "is_primary")
    @Builder.Default
    private Boolean isPrimary = true;

    @Column(name = "status")
    @Builder.Default
    private String status = "PROCESSING"; // UPLOADED, PROCESSING, PROCESSED, FAILED

    @Column(name = "content_type")
    private String contentType;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "processed_at")
    private Instant processedAt;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        if (status == null) {
            status = "PROCESSING";
        }
    }
}
