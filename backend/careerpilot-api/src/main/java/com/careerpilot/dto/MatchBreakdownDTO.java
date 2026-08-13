package com.careerpilot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchBreakdownDTO {
    private int skillScore;
    private int experienceScore;
    private int educationScore;
    private int locationScore;
    private int semanticScore;
    private int preferenceScore;
}
