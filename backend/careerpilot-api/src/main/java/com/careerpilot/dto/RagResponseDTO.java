package com.careerpilot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RagResponseDTO {
    private String query;
    private String answer;
    private boolean hasSufficientContext;
    private int retrievedChunksCount;
    private List<RagSourceDTO> sources;
    private boolean aiAvailable;
}
