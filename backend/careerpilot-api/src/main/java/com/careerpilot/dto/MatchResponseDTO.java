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
public class MatchResponseDTO {
    private Long jobId;
    private String jobTitle;
    private String companyName;
    private int overallScore; // 0-100 deterministic
    private String matchCategory; // STRONG_MATCH, GOOD_MATCH, PARTIAL_MATCH, LOW_MATCH
    private MatchBreakdownDTO breakdown;
    private List<String> matchedSkills;
    private List<String> missingSkills;
    private List<String> niceToHaveMatchedSkills;
    private List<String> strengths;
    private List<String> gaps;
    private String aiExplanation;
    private boolean aiAvailable;
}
