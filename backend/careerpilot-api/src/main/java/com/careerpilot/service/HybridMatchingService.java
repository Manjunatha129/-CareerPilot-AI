package com.careerpilot.service;

import com.careerpilot.config.MatchingConfigProperties;
import com.careerpilot.dto.*;
import com.careerpilot.entity.*;
import com.careerpilot.exception.ResourceNotFoundException;
import com.careerpilot.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class HybridMatchingService {

    private final MatchingConfigProperties config;
    private final SkillNormalizationService skillNormalizer;
    private final AiServiceClient aiServiceClient;

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final ResumeRepository resumeRepository;
    private final JobRepository jobRepository;
    private final CompanyRepository companyRepository;
    private final JobSkillRepository jobSkillRepository;
    private final SkillRepository skillRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional(readOnly = true)
    public MatchResponseDTO calculateJobMatch(String userEmail, Long jobId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        Profile profile = profileRepository.findByUserId(user.getId())
                .orElseGet(() -> Profile.builder().userId(user.getId()).build());

        Optional<Resume> primaryResumeOpt = resumeRepository.findByUserIdAndIsPrimaryTrue(user.getId());
        if (primaryResumeOpt.isEmpty()) {
            List<Resume> userResumes = resumeRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
            if (!userResumes.isEmpty()) {
                primaryResumeOpt = Optional.of(userResumes.get(0));
            }
        }

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job posting not found (id=" + jobId + ")"));

        Company company = job.getCompanyId() != null ? companyRepository.findById(job.getCompanyId()).orElse(null) : null;
        List<JobSkill> jobSkills = jobSkillRepository.findByJobId(job.getId());

        // 1. Build Candidate Features
        Set<String> candidateSkillSet = extractCandidateSkills(profile, primaryResumeOpt);
        Double totalExperienceYears = profile.getTotalExperienceYears() != null ? profile.getTotalExperienceYears() : 0.0;
        String educationLevel = profile.getEducationLevel() != null ? profile.getEducationLevel() : "BACHELORS";
        String currentLocation = profile.getCurrentLocation();
        String preferredWorkMode = profile.getPreferredWorkMode() != null ? profile.getPreferredWorkMode() : "HYBRID";
        String targetJobTitle = profile.getTargetJobTitle();
        BigDecimal minExpectedSalary = profile.getMinExpectedSalary();
        String resumeText = primaryResumeOpt.map(Resume::getRawText).orElse(profile.getSummary());

        // 2. Build Job Features
        Set<String> requiredSkillSet = skillNormalizer.normalizeSkillSet(
                jobSkills.stream().filter(s -> Boolean.TRUE.equals(s.getIsRequired())).map(JobSkill::getSkillName).collect(Collectors.toList())
        );
        Set<String> niceToHaveSkillSet = skillNormalizer.normalizeSkillSet(
                jobSkills.stream().filter(s -> Boolean.FALSE.equals(s.getIsRequired())).map(JobSkill::getSkillName).collect(Collectors.toList())
        );

        // 3. Compute 6 Deterministic Dimensions
        // Skill Match (35%)
        List<String> matchedSkills = new ArrayList<>();
        List<String> missingSkills = new ArrayList<>();
        for (String req : requiredSkillSet) {
            if (candidateSkillSet.contains(req)) {
                matchedSkills.add(req);
            } else {
                missingSkills.add(req);
            }
        }

        List<String> niceMatched = new ArrayList<>();
        for (String nice : niceToHaveSkillSet) {
            if (candidateSkillSet.contains(nice)) {
                niceMatched.add(nice);
            }
        }

        double reqCoverage = requiredSkillSet.isEmpty() ? 100.0 : ((double) matchedSkills.size() / requiredSkillSet.size()) * 100.0;
        double niceCoverage = niceToHaveSkillSet.isEmpty() ? 100.0 : ((double) niceMatched.size() / niceToHaveSkillSet.size()) * 100.0;
        int skillScore = (int) Math.round(niceToHaveSkillSet.isEmpty() ? reqCoverage : (reqCoverage * 0.85) + (niceCoverage * 0.15));
        skillScore = boundScore(skillScore);

        // Experience Match (20%)
        double requiredExpYears = mapExperienceLevelToYears(job.getExperienceLevel());
        int experienceScore = totalExperienceYears >= requiredExpYears
                ? 100
                : boundScore((int) Math.round((totalExperienceYears / requiredExpYears) * 100.0));

        // Education Match (10%)
        int candidateEduTier = mapEducationToTier(educationLevel);
        int jobEduTier = 3; // Default Bachelors
        int educationScore = candidateEduTier >= jobEduTier
                ? 100
                : boundScore((int) Math.round(((double) candidateEduTier / jobEduTier) * 100.0));

        // Location Match (10%)
        int locationScore = 50;
        if ("REMOTE".equalsIgnoreCase(job.getWorkMode())) {
            locationScore = 100;
        } else if (currentLocation != null && job.getLocation() != null &&
                currentLocation.toLowerCase().contains(job.getLocation().toLowerCase())) {
            locationScore = 100;
        } else if (preferredWorkMode.equalsIgnoreCase(job.getWorkMode())) {
            locationScore = 75;
        } else {
            locationScore = 40;
        }

        // User Preferences Match (10%)
        int preferenceScore = 0;
        if (targetJobTitle != null && job.getTitle() != null &&
                (job.getTitle().toLowerCase().contains(targetJobTitle.toLowerCase()) ||
                 targetJobTitle.toLowerCase().contains(job.getTitle().toLowerCase()))) {
            preferenceScore += 50;
        } else {
            preferenceScore += 25;
        }

        if (minExpectedSalary == null || job.getMaxSalary() == null ||
                minExpectedSalary.compareTo(job.getMaxSalary()) <= 0) {
            preferenceScore += 50;
        } else {
            preferenceScore += 20;
        }
        preferenceScore = boundScore(preferenceScore);

        // Semantic JD Match (15%)
        Double semanticSim = aiServiceClient.getSemanticSimilarity(resumeText, job.getDescriptionRaw());
        int semanticScore = semanticSim != null ? boundScore((int) Math.round(semanticSim)) : 65;

        // 4. Weighted Formula & Category
        double weightedSum = (skillScore * config.getSkillWeight()) +
                             (experienceScore * config.getExperienceWeight()) +
                             (educationScore * config.getEducationWeight()) +
                             (locationScore * config.getLocationWeight()) +
                             (semanticScore * config.getSemanticWeight()) +
                             (preferenceScore * config.getPreferenceWeight());

        int overallScore = boundScore((int) Math.round(weightedSum));
        String matchCategory = determineCategory(overallScore);

        MatchBreakdownDTO breakdown = MatchBreakdownDTO.builder()
                .skillScore(skillScore)
                .experienceScore(experienceScore)
                .educationScore(educationScore)
                .locationScore(locationScore)
                .semanticScore(semanticScore)
                .preferenceScore(preferenceScore)
                .build();

        // 5. Deterministic Strengths & Gaps
        List<String> strengths = new ArrayList<>();
        if (!matchedSkills.isEmpty()) {
            strengths.add("Strong skill overlap in required areas: " + String.join(", ", matchedSkills));
        }
        if (experienceScore >= 80) {
            strengths.add("Experience level (" + totalExperienceYears + " yrs) meets target role requirement.");
        }
        if (locationScore >= 80) {
            strengths.add("Compatible location and work mode arrangement (" + job.getWorkMode() + ").");
        }

        List<String> gaps = new ArrayList<>();
        if (!missingSkills.isEmpty()) {
            gaps.add("Required skills not verified on candidate profile: " + String.join(", ", missingSkills));
        }
        if (experienceScore < 60) {
            gaps.add("Candidate total experience (" + totalExperienceYears + " yrs) is below job requirement (" + requiredExpYears + " yrs).");
        }

        // 6. Fail-safe Gemini AI Explanation
        Map<String, Object> evidenceMap = new HashMap<>();
        evidenceMap.put("jobTitle", job.getTitle());
        evidenceMap.put("companyName", company != null ? company.getName() : job.getCompanyName());
        evidenceMap.put("overallScore", overallScore);
        evidenceMap.put("matchCategory", matchCategory);
        evidenceMap.put("skillScore", skillScore);
        evidenceMap.put("experienceScore", experienceScore);
        evidenceMap.put("educationScore", educationScore);
        evidenceMap.put("locationScore", locationScore);
        evidenceMap.put("semanticScore", semanticScore);
        evidenceMap.put("preferenceScore", preferenceScore);
        evidenceMap.put("matchedSkills", matchedSkills);
        evidenceMap.put("missingSkills", missingSkills);

        String aiResponseJson = aiServiceClient.getMatchExplanation(evidenceMap);
        String aiExplanationText = null;
        boolean aiAvailable = false;

        if (aiResponseJson != null) {
            try {
                JsonNode json = objectMapper.readTree(aiResponseJson);
                if (json.has("summary")) {
                    aiExplanationText = json.get("summary").asText();
                    aiAvailable = true;
                }
            } catch (Exception e) {
                log.warn("Failed to parse Gemini explanation response: {}", e.getMessage());
            }
        }

        if (aiExplanationText == null) {
            aiExplanationText = "Calculated deterministic match score of " + overallScore + "% (" + matchCategory.replace('_', ' ') + "). AI natural-language explanation is temporarily unavailable.";
        }

        return MatchResponseDTO.builder()
                .jobId(job.getId())
                .jobTitle(job.getTitle())
                .companyName(company != null ? company.getName() : job.getCompanyName())
                .overallScore(overallScore)
                .matchCategory(matchCategory)
                .breakdown(breakdown)
                .matchedSkills(matchedSkills)
                .missingSkills(missingSkills)
                .niceToHaveMatchedSkills(niceMatched)
                .strengths(strengths)
                .gaps(gaps)
                .aiExplanation(aiExplanationText)
                .aiAvailable(aiAvailable)
                .build();
    }

    @Transactional(readOnly = true)
    public MatchResponseDTO calculateCustomJobMatch(String userEmail, CustomMatchRequestDTO request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        Profile profile = profileRepository.findByUserId(user.getId())
                .orElseGet(() -> Profile.builder().userId(user.getId()).build());

        Optional<Resume> primaryResumeOpt = resumeRepository.findByUserIdAndIsPrimaryTrue(user.getId());
        if (primaryResumeOpt.isEmpty()) {
            List<Resume> userResumes = resumeRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
            if (!userResumes.isEmpty()) {
                primaryResumeOpt = Optional.of(userResumes.get(0));
            }
        }

        String jobTitle = request.getJobTitle() != null && !request.getJobTitle().isBlank() ? request.getJobTitle() : "Custom Position";
        String companyName = request.getCompanyName() != null && !request.getCompanyName().isBlank() ? request.getCompanyName() : "Target Company";
        String jdText = request.getJobDescription() != null ? request.getJobDescription() : "";
        String location = request.getLocation() != null ? request.getLocation() : "Remote";
        String workMode = request.getWorkMode() != null ? request.getWorkMode() : "HYBRID";
        String expLevel = request.getExperienceLevel() != null ? request.getExperienceLevel() : "MID";

        Set<String> candidateSkillSet = extractCandidateSkills(profile, primaryResumeOpt);
        Double totalExperienceYears = profile.getTotalExperienceYears() != null ? profile.getTotalExperienceYears() : 0.0;
        String educationLevel = profile.getEducationLevel() != null ? profile.getEducationLevel() : "BACHELORS";
        String resumeText = primaryResumeOpt.map(Resume::getRawText).orElse(profile.getSummary());

        Set<String> requiredSkillSet = extractSkillsFromJdText(jdText);

        List<String> matchedSkills = new ArrayList<>();
        List<String> missingSkills = new ArrayList<>();
        for (String req : requiredSkillSet) {
            if (candidateSkillSet.contains(req)) {
                matchedSkills.add(req);
            } else {
                missingSkills.add(req);
            }
        }

        double reqCoverage = requiredSkillSet.isEmpty() ? 85.0 : ((double) matchedSkills.size() / requiredSkillSet.size()) * 100.0;
        int skillScore = boundScore((int) Math.round(reqCoverage));

        double requiredExpYears = mapExperienceLevelToYears(expLevel);
        int experienceScore = totalExperienceYears >= requiredExpYears
                ? 100
                : boundScore((int) Math.round((totalExperienceYears / requiredExpYears) * 100.0));

        int candidateEduTier = mapEducationToTier(educationLevel);
        int educationScore = candidateEduTier >= 3 ? 100 : boundScore((int) Math.round(((double) candidateEduTier / 3) * 100.0));

        int locationScore = "REMOTE".equalsIgnoreCase(workMode) ? 100 : 75;
        int preferenceScore = 85;

        Double semanticSim = aiServiceClient.getSemanticSimilarity(resumeText, jdText);
        int semanticScore = semanticSim != null ? boundScore((int) Math.round(semanticSim)) : 70;

        double weightedSum = (skillScore * config.getSkillWeight()) +
                             (experienceScore * config.getExperienceWeight()) +
                             (educationScore * config.getEducationWeight()) +
                             (locationScore * config.getLocationWeight()) +
                             (semanticScore * config.getSemanticWeight()) +
                             (preferenceScore * config.getPreferenceWeight());

        int overallScore = boundScore((int) Math.round(weightedSum));
        String matchCategory = determineCategory(overallScore);

        MatchBreakdownDTO breakdown = MatchBreakdownDTO.builder()
                .skillScore(skillScore)
                .experienceScore(experienceScore)
                .educationScore(educationScore)
                .locationScore(locationScore)
                .semanticScore(semanticScore)
                .preferenceScore(preferenceScore)
                .build();

        List<String> strengths = new ArrayList<>();
        if (!matchedSkills.isEmpty()) {
            strengths.add("Matching technical skills verified on resume: " + String.join(", ", matchedSkills));
        }
        if (experienceScore >= 80) {
            strengths.add("Candidate experience level (" + totalExperienceYears + " yrs) aligns with requirements.");
        }

        List<String> gaps = new ArrayList<>();
        if (!missingSkills.isEmpty()) {
            gaps.add("Required job skills missing from uploaded resume: " + String.join(", ", missingSkills));
        }

        Map<String, Object> evidenceMap = new HashMap<>();
        evidenceMap.put("jobTitle", jobTitle);
        evidenceMap.put("companyName", companyName);
        evidenceMap.put("overallScore", overallScore);
        evidenceMap.put("matchCategory", matchCategory);
        evidenceMap.put("skillScore", skillScore);
        evidenceMap.put("experienceScore", experienceScore);
        evidenceMap.put("educationScore", educationScore);
        evidenceMap.put("locationScore", locationScore);
        evidenceMap.put("semanticScore", semanticScore);
        evidenceMap.put("preferenceScore", preferenceScore);
        evidenceMap.put("matchedSkills", matchedSkills);
        evidenceMap.put("missingSkills", missingSkills);

        String aiResponseJson = aiServiceClient.getMatchExplanation(evidenceMap);
        String aiExplanationText = null;
        boolean aiAvailable = false;

        if (aiResponseJson != null) {
            try {
                JsonNode json = objectMapper.readTree(aiResponseJson);
                if (json.has("summary")) {
                    aiExplanationText = json.get("summary").asText();
                    aiAvailable = true;
                }
            } catch (Exception e) {
                log.warn("Failed to parse Gemini explanation response: {}", e.getMessage());
            }
        }

        if (aiExplanationText == null) {
            aiExplanationText = "Calculated custom JD match score of " + overallScore + "% (" + matchCategory.replace('_', ' ') + ") against uploaded candidate resume.";
        }

        return MatchResponseDTO.builder()
                .jobId(0L)
                .jobTitle(jobTitle)
                .companyName(companyName)
                .overallScore(overallScore)
                .matchCategory(matchCategory)
                .breakdown(breakdown)
                .matchedSkills(matchedSkills)
                .missingSkills(missingSkills)
                .niceToHaveMatchedSkills(Collections.emptyList())
                .strengths(strengths)
                .gaps(gaps)
                .aiExplanation(aiExplanationText)
                .aiAvailable(aiAvailable)
                .build();
    }

    private Set<String> extractSkillsFromJdText(String jdText) {
        Set<String> extracted = new HashSet<>();
        if (jdText == null || jdText.isBlank()) return extracted;

        List<Skill> allMasterSkills = skillRepository.findAll();
        String lowerJd = jdText.toLowerCase();
        for (Skill s : allMasterSkills) {
            if (s.getSkillName() != null && s.getSkillName().length() > 1) {
                String skLower = s.getSkillName().toLowerCase();
                if (lowerJd.contains(skLower)) {
                    extracted.add(s.getSkillName());
                }
            }
        }

        String[] commonTech = {
            "Java", "Python", "JavaScript", "TypeScript", "React", "Node.js", "Spring Boot",
            "FastAPI", "SQL", "PostgreSQL", "MongoDB", "Docker", "Kubernetes", "AWS", "Machine Learning",
            "AI", "PyTorch", "TensorFlow", "REST API", "Microservices", "Git", "System Design"
        };
        for (String tech : commonTech) {
            if (lowerJd.contains(tech.toLowerCase())) {
                extracted.add(tech);
            }
        }

        return skillNormalizer.normalizeSkillSet(extracted);
    }

    private Set<String> extractCandidateSkills(Profile profile, Optional<Resume> primaryResumeOpt) {
        Set<String> rawSkills = new HashSet<>();
        if (profile.getId() != null) {
            List<Skill> profileSkills = skillRepository.findByProfileId(profile.getId());
            for (Skill s : profileSkills) {
                if (s.getSkillName() != null) {
                    rawSkills.add(s.getSkillName());
                }
            }
        }

        if (primaryResumeOpt.isPresent() && primaryResumeOpt.get().getParsedJson() != null) {
            try {
                JsonNode root = objectMapper.readTree(primaryResumeOpt.get().getParsedJson());
                if (root.has("skills")) {
                    JsonNode skillsNode = root.get("skills");
                    extractSkillsFromCategoryNode(skillsNode, "programmingLanguages", rawSkills);
                    extractSkillsFromCategoryNode(skillsNode, "frameworks", rawSkills);
                    extractSkillsFromCategoryNode(skillsNode, "databases", rawSkills);
                    extractSkillsFromCategoryNode(skillsNode, "tools", rawSkills);
                    extractSkillsFromCategoryNode(skillsNode, "cloudTechnologies", rawSkills);
                }
            } catch (Exception e) {
                log.warn("Failed to parse parsedJson for candidate skills: {}", e.getMessage());
            }
        }

        return skillNormalizer.normalizeSkillSet(rawSkills);
    }

    private void extractSkillsFromCategoryNode(JsonNode parent, String categoryKey, Set<String> targetSet) {
        if (parent.has(categoryKey) && parent.get(categoryKey).isArray()) {
            for (JsonNode item : parent.get(categoryKey)) {
                targetSet.add(item.asText());
            }
        }
    }

    private double mapExperienceLevelToYears(String expLevel) {
        if (expLevel == null) return 1.0;
        switch (expLevel.toUpperCase()) {
            case "MID": return 3.0;
            case "SENIOR": return 5.0;
            case "ENTRY":
            default: return 1.0;
        }
    }

    private int mapEducationToTier(String edu) {
        if (edu == null) return 3;
        switch (edu.toUpperCase()) {
            case "PHD": return 5;
            case "MASTERS": return 4;
            case "BACHELORS": return 3;
            case "DIPLOMA": return 2;
            case "HIGH_SCHOOL": return 1;
            default: return 3;
        }
    }

    private int boundScore(int score) {
        return Math.min(100, Math.max(0, score));
    }

    private String determineCategory(int score) {
        if (score >= 80) return "STRONG_MATCH";
        if (score >= 60) return "GOOD_MATCH";
        if (score >= 40) return "PARTIAL_MATCH";
        return "LOW_MATCH";
    }
}
