package com.careerpilot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CareerIntelligenceDTO {
    private String status;
    private List<String> executedAgents;
    private String answer;
    private List<String> matchedSkills;
    private List<String> missingSkills;
    private List<String> priorityGaps;
    private Map<String, Object> careerPlan;
    private List<Map<String, Object>> sources;

    // Extended Phase 10 Career Intelligence Fields
    private CareerDirectionDTO careerDirection;
    private ProfileStrengthDTO profileStrength;
    private List<SkillCategoryItemDTO> strongSkills;
    private List<SkillCategoryItemDTO> developingSkills;
    private List<SkillCategoryItemDTO> missingSkillsList;
    private List<SkillCategoryItemDTO> prioritySkills;
    private List<SkillCategoryItemDTO> careerSpecificSkills;
    private List<RoleInsightDTO> roleInsights;
    private CareerGapsDTO careerGaps;
    private List<RecommendationDTO> recommendations;
    private RoadmapDTO roadmap;
    private ProjectIntelligenceDTO projectIntelligence;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CareerDirectionDTO {
        private String primary;
        private String secondary;
        private List<String> reasoning;
        private List<String> improvementAreas;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfileStrengthDTO {
        private Integer overallScore;
        private String experienceLevel;
        private List<String> technicalStrengths;
        private List<String> careerAreas;
        private List<String> profileGaps;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SkillCategoryItemDTO {
        private String name;
        private String category;
        private String priority;
        private String rationale;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleInsightDTO {
        private String roleCategory;
        private Integer suitabilityScore;
        private Integer officialJobMatchScore;
        private List<String> supportingSkills;
        private List<String> missingSkills;
        private String relevantExperience;
        private List<String> improvementAreas;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CareerGapsDTO {
        private String technicalSkills;
        private String experience;
        private String projects;
        private String resume;
        private String interviewReadiness;
        private String roleAlignment;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendationDTO {
        private String category;
        private String action;
        private String reasoning;
        private String priority;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoadmapDTO {
        private List<String> immediate;
        private List<String> shortTerm;
        private List<String> mediumTerm;
        private List<Map<String, Object>> stages;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectIntelligenceDTO {
        private List<String> strongestProjects;
        private List<String> techCoverage;
        private List<String> missingTechExposure;
        private List<String> improvementOpportunities;
    }
}

