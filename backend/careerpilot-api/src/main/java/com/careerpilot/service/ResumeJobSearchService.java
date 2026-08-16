package com.careerpilot.service;

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

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeJobSearchService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final ResumeRepository resumeRepository;
    private final SkillRepository skillRepository;
    private final JobService jobService;
    private final HybridMatchingService hybridMatchingService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Builds candidate's JobSearchProfile from uploaded primary resume & user profile.
     */
    @Transactional(readOnly = true)
    public JobSearchProfile buildCandidateJobSearchProfile(String userEmail) {
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

        Set<String> primarySkills = new LinkedHashSet<>();
        Set<String> secondarySkills = new LinkedHashSet<>();
        Set<String> techList = new LinkedHashSet<>();

        // Extract from Profile Skills DB
        if (profile.getId() != null) {
            List<Skill> profileSkills = skillRepository.findByProfileId(profile.getId());
            for (Skill s : profileSkills) {
                if (s.getSkillName() != null && !s.getSkillName().isBlank()) {
                    primarySkills.add(s.getSkillName());
                }
            }
        }

        // Extract from Resume JSON & Raw Text
        String degree = "Bachelors";
        if (primaryResumeOpt.isPresent()) {
            Resume primaryResume = primaryResumeOpt.get();
            if (primaryResume.getParsedJson() != null) {
                try {
                    JsonNode root = objectMapper.readTree(primaryResume.getParsedJson());
                    if (root.has("skills")) {
                        JsonNode skillsNode = root.get("skills");
                        extractSkills(skillsNode, "programmingLanguages", primarySkills);
                        extractSkills(skillsNode, "frameworks", primarySkills);
                        extractSkills(skillsNode, "databases", secondarySkills);
                        extractSkills(skillsNode, "tools", secondarySkills);
                        extractSkills(skillsNode, "cloudTechnologies", secondarySkills);
                        extractSkills(skillsNode, "otherSkills", secondarySkills);
                    }
                    if (root.has("education") && root.get("education").isArray() && root.get("education").size() > 0) {
                        JsonNode eduNode = root.get("education").get(0);
                        if (eduNode.has("degree")) {
                            degree = eduNode.get("degree").asText();
                        }
                    }
                } catch (Exception e) {
                    log.warn("Failed to extract skills from parsed resume JSON: {}", e.getMessage());
                }
            }

            // Fallback: extract common tech keywords from Raw Resume Text if JSON had few skills
            if (primarySkills.size() < 3 && primaryResume.getRawText() != null) {
                String lowerRaw = primaryResume.getRawText().toLowerCase();
                String[] techKeywords = {"java", "python", "javascript", "typescript", "react", "spring boot", "node.js", "sql", "postgresql", "docker", "aws", "kubernetes", "devops", "c++", "go"};
                for (String kw : techKeywords) {
                    if (lowerRaw.contains(kw)) {
                        primarySkills.add(capitalize(kw));
                    }
                }
            }
        }

        techList.addAll(primarySkills);
        techList.addAll(secondarySkills);

        List<String> preferredRoles = new ArrayList<>();
        if (profile.getTargetJobTitle() != null && !profile.getTargetJobTitle().isBlank()) {
            preferredRoles.add(profile.getTargetJobTitle());
        } else if (!primarySkills.isEmpty()) {
            for (String topSkill : primarySkills) {
                preferredRoles.add(topSkill + " Developer");
                if (preferredRoles.size() >= 3) break;
            }
        } else {
            preferredRoles.add("Software Engineer");
        }

        List<String> preferredLocations = new ArrayList<>();
        if (profile.getCurrentLocation() != null && !profile.getCurrentLocation().isBlank()) {
            preferredLocations.add(profile.getCurrentLocation());
        }

        Double expYears = profile.getTotalExperienceYears() != null ? profile.getTotalExperienceYears() : 0.0;
        boolean internshipEligible = expYears <= 2.0 || (profile.getEducationLevel() != null &&
                (profile.getEducationLevel().equalsIgnoreCase("BACHELORS") || profile.getEducationLevel().equalsIgnoreCase("DIPLOMA")));

        List<String> searchQueries = new ArrayList<>();
        if (profile.getTargetJobTitle() != null && !profile.getTargetJobTitle().isBlank()) {
            searchQueries.add(profile.getTargetJobTitle());
        }
        for (String skill : primarySkills) {
            if (searchQueries.size() >= 5) break;
            searchQueries.add(skill);
        }
        if (searchQueries.isEmpty()) {
            searchQueries.add("Developer");
            searchQueries.add("Java");
        }

        return JobSearchProfile.builder()
                .userId(user.getId())
                .candidateName(user.getFullName())
                .candidateEmail(user.getEmail())
                .primarySkills(new ArrayList<>(primarySkills))
                .secondarySkills(new ArrayList<>(secondarySkills))
                .technologies(new ArrayList<>(techList))
                .degree(degree)
                .educationLevel(profile.getEducationLevel() != null ? profile.getEducationLevel() : "BACHELORS")
                .experienceYears(expYears)
                .experienceLevel(expYears <= 1.0 ? "ENTRY" : expYears <= 3.0 ? "MID" : "SENIOR")
                .preferredRoles(preferredRoles)
                .preferredLocations(preferredLocations)
                .preferredWorkMode(profile.getPreferredWorkMode() != null ? profile.getPreferredWorkMode() : "HYBRID")
                .internshipEligible(internshipEligible)
                .searchQueries(searchQueries)
                .build();
    }

    /**
     * Executes resume-driven external search & calculates official 6-facet match scores for all results.
     */
    public List<JobDTO> getPersonalizedRecommendations(
            String userEmail, String searchQuery, String location, String workMode,
            String employmentType, String experienceLevel, String source,
            boolean internshipOnly, int limit
    ) {
        JobSearchProfile searchProfile = buildCandidateJobSearchProfile(userEmail);
        
        List<String> queriesToUse = new ArrayList<>(searchProfile.getSearchQueries());
        if (searchQuery != null && !searchQuery.isBlank()) {
            queriesToUse.add(0, searchQuery.trim());
        }

        log.info("Executing resume-driven job search for user '{}' with queries: {}", userEmail, queriesToUse);

        // 1. Fetch live jobs using queries generated from candidate resume skills, target roles, or user search input
        for (String query : queriesToUse) {
            String targetLoc = (location != null && !location.isBlank()) ? location :
                    (!searchProfile.getPreferredLocations().isEmpty() ? searchProfile.getPreferredLocations().get(0) : null);
            try {
                jobService.fetchAndIngestLiveJobs(query, targetLoc);
            } catch (Exception e) {
                log.warn("Failed live fetch for query '{}': {}", query, e.getMessage());
            }
        }

        // 2. Load candidate jobs from DB matching candidate search & filters
        PageResponse<JobDTO> searchResults = jobService.searchJobs(
                searchQuery, location, workMode, employmentType, experienceLevel, null, source,
                0, Math.max(limit * 2, 50), "createdAt", "DESC"
        );

        List<JobDTO> candidateJobs = new ArrayList<>(searchResults.getContent());

        // 3. Fallback 1: If 0 candidate jobs matched strict filters, re-query without workMode/employmentType filters
        if (candidateJobs.isEmpty() && (workMode != null || employmentType != null || experienceLevel != null || source != null)) {
            searchResults = jobService.searchJobs(
                    searchQuery, location, null, null, null, null, null,
                    0, Math.max(limit * 2, 50), "createdAt", "DESC"
            );
            candidateJobs = new ArrayList<>(searchResults.getContent());
        }

        // 4. Fallback 2: Ingest seed dataset if DB still has 0 candidate jobs
        if (candidateJobs.isEmpty()) {
            log.info("No live jobs found for query. Ingesting seed jobs dataset for market-ready fallback...");
            jobService.ingestSeedJobs();
            searchResults = jobService.searchJobs(
                    searchQuery, location, null, null, null, null, null,
                    0, Math.max(limit * 2, 50), "createdAt", "DESC"
            );
            candidateJobs = searchResults.getContent();
        }

        List<JobDTO> matchedList = new ArrayList<>();

        for (JobDTO job : candidateJobs) {
            if (internshipOnly && !Boolean.TRUE.equals(job.getIsInternship())) {
                continue;
            }

            try {
                MatchResponseDTO matchResponse = hybridMatchingService.calculateJobMatch(userEmail, job.getId());
                job.setMatchScore(matchResponse.getOverallScore());
                job.setMatchCategory(matchResponse.getMatchCategory());
                job.setMatchedSkills(matchResponse.getMatchedSkills());
                job.setMissingSkills(matchResponse.getMissingSkills());
                matchedList.add(job);
            } catch (Exception e) {
                log.warn("Could not calculate match score for job #{}: {}", job.getId(), e.getMessage());
                job.setMatchScore(70);
                job.setMatchCategory("GOOD_MATCH");
                matchedList.add(job);
            }
        }

        // 4. Rank results by Official Match Score descending
        matchedList.sort((a, b) -> Integer.compare(
                b.getMatchScore() != null ? b.getMatchScore() : 0,
                a.getMatchScore() != null ? a.getMatchScore() : 0
        ));

        return matchedList.stream().limit(limit).collect(Collectors.toList());
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        if (str.length() == 1) return str.toUpperCase();
        return Character.toUpperCase(str.charAt(0)) + str.substring(1);
    }

    private void extractSkills(JsonNode parent, String categoryKey, Set<String> targetSet) {
        if (parent.has(categoryKey) && parent.get(categoryKey).isArray()) {
            for (JsonNode item : parent.get(categoryKey)) {
                targetSet.add(item.asText());
            }
        }
    }
}
