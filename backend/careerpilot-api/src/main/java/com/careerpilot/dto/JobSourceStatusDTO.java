package com.careerpilot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobSourceStatusDTO {
    private String id;
    private String name;
    private String type; // API, AGGREGATOR, PARTNER, SEED
    private boolean isConnected;
    private boolean isConfigured;
    private String statusMessage;
    private int fetchedCount;
}
