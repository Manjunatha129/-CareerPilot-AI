package com.careerpilot.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "careerpilot.matching.weights")
public class MatchingConfigProperties {
    /** Weight for skill coverage match (Default 35%) */
    private double skillWeight = 0.35;

    /** Weight for experience level alignment (Default 20%) */
    private double experienceWeight = 0.20;

    /** Weight for education degree tier alignment (Default 10%) */
    private double educationWeight = 0.10;

    /** Weight for location and work mode compatibility (Default 10%) */
    private double locationWeight = 0.10;

    /** Weight for semantic JD embedding similarity (Default 15%) */
    private double semanticWeight = 0.15;

    /** Weight for user candidate target role & salary preferences (Default 10%) */
    private double preferenceWeight = 0.10;
}
