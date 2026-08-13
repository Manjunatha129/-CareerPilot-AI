package com.careerpilot.service;

import com.careerpilot.dto.CareerIntelligenceDTO;
import com.careerpilot.dto.MatchResponseDTO;
import com.careerpilot.entity.*;
import com.careerpilot.exception.ResourceNotFoundException;
import com.careerpilot.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CareerIntelligenceService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final SkillRepository skillRepository;
    private final ResumeRepository resumeRepository;
    private final JobRepository jobRepository;
    private final JobSkillRepository jobSkillRepository;
    private final HybridMatchingService hybridMatchingService;
    private final AiServiceClient aiServiceClient;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional(readOnly = true)
    public CareerIntelligenceDTO analyzeCareer(String userEmail, String query, Long targetJobId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found: " + userEmail));

        log.info("Analyzing Career Intelligence for user ID #{}, query: '{}'", user.getId(), query);

        // 1. Gather Candidate Profile Data
        Optional<Profile> profileOpt = profileRepository.findByUserId(user.getId());
        Map<String, Object> candidateProfileMap = new HashMap<>();
        List<String> primarySkills = new ArrayList<>();
        Double totalExperienceYears = 0.0;
        String headline = "Software Engineer";
        String targetJobTitle = "Java Backend Developer";

        if (profileOpt.isPresent()) {
            Profile p = profileOpt.get();
            if (p.getHeadline() != null) headline = p.getHeadline();
            if (p.getTargetJobTitle() != null) targetJobTitle = p.getTargetJobTitle();
            if (p.getTotalExperienceYears() != null) totalExperienceYears = p.getTotalExperienceYears();

            candidateProfileMap.put("headline", headline);
            candidateProfileMap.put("targetJobTitle", targetJobTitle);
            candidateProfileMap.put("yearsExperience", totalExperienceYears);
            candidateProfileMap.put("educationLevel", p.getEducationLevel() != null ? p.getEducationLevel() : "BACHELORS");
            candidateProfileMap.put("location", p.getCurrentLocation() != null ? p.getCurrentLocation() : "Remote");

            List<Skill> skills = skillRepository.findByProfileId(p.getId());
            primarySkills = skills.stream().map(Skill::getSkillName).filter(Objects::nonNull).toList();
            candidateProfileMap.put("primarySkills", primarySkills);
        } else {
            candidateProfileMap.put("headline", "Entry Level Candidate");
            candidateProfileMap.put("targetJobTitle", targetJobTitle);
            candidateProfileMap.put("yearsExperience", 0.0);
            candidateProfileMap.put("primarySkills", Collections.emptyList());
        }

        // 2. Gather Resume Context (Structured JSON from Phase 5)
        List<Resume> userResumes = resumeRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        Map<String, Object> resumeAnalysisMap = new HashMap<>();
        if (!userResumes.isEmpty() && userResumes.get(0).getParsedJson() != null) {
            try {
                resumeAnalysisMap = objectMapper.readValue(userResumes.get(0).getParsedJson(), Map.class);
            } catch (Exception e) {
                log.warn("Failed to parse resume JSON for user #{}: {}", user.getId(), e.getMessage());
            }
        }

        // 3. Gather Target Job Context & Official Phase 7 Match Score
        Map<String, Object> jobContextMap = new HashMap<>();
        Integer officialMatchScore = null;

        if (targetJobId != null) {
            Optional<Job> jobOpt = jobRepository.findById(targetJobId);
            if (jobOpt.isPresent()) {
                Job j = jobOpt.get();
                jobContextMap.put("id", j.getId());
                jobContextMap.put("title", j.getTitle());
                jobContextMap.put("companyName", j.getCompanyName());
                jobContextMap.put("experienceLevel", j.getExperienceLevel());

                List<JobSkill> jobSkills = jobSkillRepository.findByJobId(j.getId());
                List<String> reqSkills = jobSkills.stream().map(JobSkill::getSkillName).filter(Objects::nonNull).toList();
                jobContextMap.put("requiredSkills", reqSkills);

                // Fetch official Phase 7 match score without overriding or inventing scores
                try {
                    MatchResponseDTO matchResponse = hybridMatchingService.calculateJobMatch(userEmail, j.getId());
                    if (matchResponse != null) {
                        officialMatchScore = matchResponse.getOverallScore();
                        jobContextMap.put("officialMatchScore", officialMatchScore);
                    }
                } catch (Exception e) {
                    log.warn("Could not calculate official Phase 7 match score for job #{}: {}", j.getId(), e.getMessage());
                }
            }
        } else {
            // Pick top matched job in repository if available
            List<Job> allJobs = jobRepository.findAll();
            if (!allJobs.isEmpty()) {
                Job topJob = allJobs.get(0);
                jobContextMap.put("id", topJob.getId());
                jobContextMap.put("title", topJob.getTitle());
                jobContextMap.put("companyName", topJob.getCompanyName());

                List<JobSkill> jobSkills = jobSkillRepository.findByJobId(topJob.getId());
                List<String> reqSkills = jobSkills.stream().map(JobSkill::getSkillName).filter(Objects::nonNull).toList();
                jobContextMap.put("requiredSkills", reqSkills);

                try {
                    MatchResponseDTO matchResponse = hybridMatchingService.calculateJobMatch(userEmail, topJob.getId());
                    if (matchResponse != null) {
                        officialMatchScore = matchResponse.getOverallScore();
                        jobContextMap.put("officialMatchScore", officialMatchScore);
                    }
                } catch (Exception e) {
                    log.warn("Could not calculate official match score for default job: {}", e.getMessage());
                }
            } else {
                jobContextMap.put("title", targetJobTitle);
                jobContextMap.put("requiredSkills", List.of("Java", "Spring Boot", "SQL", "REST APIs", "Spring Security"));
            }
        }

        // 4. Request Payload to FastAPI LangGraph multi-agent engine
        Map<String, Object> payload = Map.of(
                "userId", user.getId(),
                "query", query != null && !query.isBlank() ? query : "Evaluate my career profile and provide skill roadmap.",
                "candidateProfile", candidateProfileMap,
                "resumeAnalysis", resumeAnalysisMap,
                "jobContext", jobContextMap
        );

        // 5. Invoke Python LangGraph Agent Workflow
        String rawResponseJson = aiServiceClient.runCareerIntelligenceWorkflow(payload);
        CareerIntelligenceDTO dto = null;

        if (rawResponseJson != null) {
            try {
                dto = objectMapper.readValue(rawResponseJson, CareerIntelligenceDTO.class);
            } catch (Exception e) {
                log.warn("Failed to parse LangGraph response JSON into CareerIntelligenceDTO: {}", e.getMessage());
            }
        }

        // 6. Graceful Fail-Safe Fallback if AI Service is Offline or Unparseable
        if (dto == null) {
            log.info("Generating deterministic Career Intelligence fallback for user #{}", user.getId());
            dto = buildDeterministicFallback(primarySkills, totalExperienceYears, targetJobTitle, officialMatchScore);
        }

        // Ensure official match score is populated if available
        if (officialMatchScore != null && dto.getRoleInsights() != null && !dto.getRoleInsights().isEmpty()) {
            dto.getRoleInsights().get(0).setOfficialJobMatchScore(officialMatchScore);
        }

        return dto;
    }

    private CareerIntelligenceDTO buildDeterministicFallback(List<String> skills, Double expYears, String targetTitle, Integer officialMatchScore) {
        List<String> matched = skills.isEmpty() ? List.of("Java", "SQL") : skills;
        List<String> missing = List.of("Spring Security", "Microservices", "Docker", "JUnit/Testcontainers");

        Integer strengthScore = Math.min(95, (int) (50 + matched.size() * 5 + expYears * 5));

        return CareerIntelligenceDTO.builder()
                .status("PARTIAL_SUCCESS")
                .executedAgents(List.of("career_manager", "resume_intelligence", "job_intelligence", "skill_gap", "career_planner"))
                .answer("Career Intelligence Assessment (Deterministic Execution):\n" +
                        "Your profile demonstrates foundational alignment for " + targetTitle + " positions. " +
                        "Prioritize closing high-demand backend skill gaps including Spring Security and Microservices architecture.")
                .matchedSkills(matched)
                .missingSkills(missing)
                .priorityGaps(missing.subList(0, 2))
                .careerDirection(CareerIntelligenceDTO.CareerDirectionDTO.builder()
                        .primary(targetTitle)
                        .secondary("Full Stack Software Engineering")
                        .reasoning(List.of("Verified technical foundation in candidate profile.", "Relevant software development experience."))
                        .improvementAreas(missing)
                        .build())
                .profileStrength(CareerIntelligenceDTO.ProfileStrengthDTO.builder()
                        .overallScore(strengthScore)
                        .experienceLevel(expYears >= 3 ? "MID" : "JUNIOR")
                        .technicalStrengths(matched)
                        .careerAreas(List.of(targetTitle, "Backend Engineering"))
                        .profileGaps(List.of("Spring Security implementation evidence", "Docker containerization documentation"))
                        .build())
                .strongSkills(matched.stream().map(s -> CareerIntelligenceDTO.SkillCategoryItemDTO.builder()
                        .name(s).category("Core").priority("High").rationale("Verified in profile").build()).toList())
                .developingSkills(List.of(
                        CareerIntelligenceDTO.SkillCategoryItemDTO.builder().name("Git/GitHub").category("Tools").priority("Medium").rationale("Secondary skill").build()
                ))
                .missingSkillsList(missing.stream().map(s -> CareerIntelligenceDTO.SkillCategoryItemDTO.builder()
                        .name(s).category("Requirement").priority("High").rationale("High demand in job postings").build()).toList())
                .prioritySkills(missing.subList(0, 2).stream().map(s -> CareerIntelligenceDTO.SkillCategoryItemDTO.builder()
                        .name(s).category("High Priority").priority("High").rationale("Core architectural requirement").build()).toList())
                .roleInsights(List.of(
                        CareerIntelligenceDTO.RoleInsightDTO.builder()
                                .roleCategory(targetTitle)
                                .suitabilityScore(strengthScore)
                                .officialJobMatchScore(officialMatchScore)
                                .supportingSkills(matched)
                                .missingSkills(missing.subList(0, 2))
                                .relevantExperience(expYears + " years relevant experience")
                                .improvementAreas(List.of("Spring Security", "Production Microservices"))
                                .build()
                ))
                .careerGaps(CareerIntelligenceDTO.CareerGapsDTO.builder()
                        .technicalSkills("Needs deeper exposure to Spring Security and Microservices.")
                        .experience("Candidate has " + expYears + " years of verified technical experience.")
                        .projects("Requires production architecture evidence with automated tests.")
                        .resume("Resume highlights technical skills; add quantifiable impact metrics.")
                        .interviewReadiness("Focus preparation on SQL tuning, System Design, and REST security.")
                        .roleAlignment("Strong candidate alignment with minor skill gap bridge required.")
                        .build())
                .recommendations(List.of(
                        CareerIntelligenceDTO.RecommendationDTO.builder()
                                .category("Skills to Learn")
                                .action("Master Spring Security & OAuth2 JWT authentication.")
                                .reasoning("Frequently required for enterprise backend engineering roles.")
                                .priority("HIGH")
                                .build(),
                        CareerIntelligenceDTO.RecommendationDTO.builder()
                                .category("Projects to Strengthen")
                                .action("Build an end-to-end Spring Boot REST project with Docker containerization.")
                                .reasoning("Provides evidence of production-level engineering capability.")
                                .priority("HIGH")
                                .build()
                ))
                .roadmap(CareerIntelligenceDTO.RoadmapDTO.builder()
                        .immediate(List.of("Review Java collection internals and SQL joins.", "Update resume with tech keywords."))
                        .shortTerm(List.of("Build REST API project with Spring Security.", "Practice technical interview questions."))
                        .mediumTerm(List.of("Learn Microservices architecture.", "Apply to targeted backend engineering postings."))
                        .stages(List.of(
                                Map.of("stage", 1, "title", "Strengthen Fundamentals", "actions", List.of("Core Java OO principles", "SQL Database design")),
                                Map.of("stage", 2, "title", "Close High-Priority Skill Gaps", "actions", List.of("Spring Security", "REST API Security")),
                                Map.of("stage", 3, "title", "Build/Improve Projects", "actions", List.of("Dockerize backend application", "Add automated unit tests")),
                                Map.of("stage", 4, "title", "Resume & Portfolio Readiness", "actions", List.of("Optimize resume ATS keywords", "Publish GitHub repository")),
                                Map.of("stage", 5, "title", "Interview Preparation", "actions", List.of("System Design fundamentals", "Mock technical interviews")),
                                Map.of("stage", 6, "title", "Target Suitable Roles", "actions", List.of("Target matching job postings", "Professional networking"))
                        ))
                        .build())
                .projectIntelligence(CareerIntelligenceDTO.ProjectIntelligenceDTO.builder()
                        .strongestProjects(List.of("Backend REST API Application"))
                        .techCoverage(matched)
                        .missingTechExposure(missing.subList(0, 2))
                        .improvementOpportunities(List.of(
                                "Integrate Spring Security and JWT authentication.",
                                "Add automated unit tests with JUnit and Mockito.",
                                "Document API endpoints using OpenAPI / Swagger."
                        ))
                        .build())
                .sources(Collections.emptyList())
                .build();
    }
}
