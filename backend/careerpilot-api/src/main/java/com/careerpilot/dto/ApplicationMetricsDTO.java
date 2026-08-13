package com.careerpilot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationMetricsDTO {
    private Long totalApplications;
    private Long savedCount;
    private Long appliedCount;
    private Long screeningCount;
    private Long interviewCount;
    private Long offerCount;
    private Long rejectedCount;
    private Long acceptedCount;
    private Double interviewConversionRate; // (interviews / applied) * 100
    private Double offerConversionRate;     // (offers / applied) * 100
    private Integer averageMatchScore;
}
