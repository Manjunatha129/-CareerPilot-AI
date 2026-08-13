package com.careerpilot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RagSourceDTO {
    private String documentTitle;
    private String sourceType;
    private int chunkIndex;
    private double similarityScore;
    private String contentSnippet;
}
