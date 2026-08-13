package com.careerpilot.service;

import com.careerpilot.dto.CareerIntelligenceDTO;
import com.careerpilot.dto.MatchResponseDTO;
import com.careerpilot.entity.*;
import com.careerpilot.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CareerIntelligenceServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private SkillRepository skillRepository;

    @Mock
    private ResumeRepository resumeRepository;

    @Mock
    private JobRepository jobRepository;

    @Mock
    private JobSkillRepository jobSkillRepository;

    @Mock
    private HybridMatchingService hybridMatchingService;

    @Mock
    private AiServiceClient aiServiceClient;

    @InjectMocks
    private CareerIntelligenceService careerIntelligenceService;

    private User testUser;
    private Profile testProfile;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(100L)
                .email("candidate@example.com")
                .fullName("Test Candidate")
                .role("ROLE_USER")
                .build();

        testProfile = Profile.builder()
                .id(200L)
                .userId(100L)
                .headline("Java Developer")
                .targetJobTitle("Java Backend Developer")
                .totalExperienceYears(3.0)
                .educationLevel("BACHELORS")
                .build();
    }

    @Test
    @DisplayName("Should generate complete Career Intelligence with profile, skills, and official Phase 7 match score")
    void analyzeCareer_CompleteUser() {
        when(userRepository.findByEmail("candidate@example.com")).thenReturn(Optional.of(testUser));
        when(profileRepository.findByUserId(100L)).thenReturn(Optional.of(testProfile));
        when(skillRepository.findByProfileId(200L)).thenReturn(List.of(
                Skill.builder().id(1L).profileId(200L).skillName("Java").proficiencyLevel("ADVANCED").build(),
                Skill.builder().id(2L).profileId(200L).skillName("Spring Boot").proficiencyLevel("INTERMEDIATE").build()
        ));
        when(resumeRepository.findByUserIdOrderByCreatedAtDesc(100L)).thenReturn(Collections.emptyList());

        Job testJob = Job.builder()
                .id(50L)
                .title("Java Backend Developer")
                .companyName("Tech Corp")
                .experienceLevel("MID")
                .build();

        when(jobRepository.findById(50L)).thenReturn(Optional.of(testJob));
        when(jobSkillRepository.findByJobId(50L)).thenReturn(List.of(
                JobSkill.builder().jobId(50L).skillName("Java").isRequired(true).build(),
                JobSkill.builder().jobId(50L).skillName("Spring Security").isRequired(true).build()
        ));

        MatchResponseDTO matchResponse = MatchResponseDTO.builder()
                .jobId(50L)
                .overallScore(85)
                .matchCategory("STRONG_MATCH")
                .build();

        when(hybridMatchingService.calculateJobMatch("candidate@example.com", 50L)).thenReturn(matchResponse);
        when(aiServiceClient.runCareerIntelligenceWorkflow(any())).thenReturn(null); // Fallback execution

        CareerIntelligenceDTO result = careerIntelligenceService.analyzeCareer(
                "candidate@example.com",
                "Assess my Java Backend readiness",
                50L
        );

        assertThat(result).isNotNull();
        assertThat(result.getCareerDirection()).isNotNull();
        assertThat(result.getCareerDirection().getPrimary()).isEqualTo("Java Backend Developer");
        assertThat(result.getMatchedSkills()).contains("Java", "Spring Boot");
        assertThat(result.getRoleInsights()).isNotEmpty();
        assertThat(result.getRoleInsights().get(0).getOfficialJobMatchScore()).isEqualTo(85);
        assertThat(result.getRoadmap()).isNotNull();
        assertThat(result.getRoadmap().getImmediate()).isNotEmpty();
    }

    @Test
    @DisplayName("Should degrade gracefully when user has no profile or resume")
    void analyzeCareer_EmptyProfile() {
        when(userRepository.findByEmail("newuser@example.com")).thenReturn(Optional.of(User.builder().id(999L).email("newuser@example.com").build()));
        when(profileRepository.findByUserId(999L)).thenReturn(Optional.empty());
        when(resumeRepository.findByUserIdOrderByCreatedAtDesc(999L)).thenReturn(Collections.emptyList());
        when(jobRepository.findAll()).thenReturn(Collections.emptyList());
        when(aiServiceClient.runCareerIntelligenceWorkflow(any())).thenReturn(null);

        CareerIntelligenceDTO result = careerIntelligenceService.analyzeCareer(
                "newuser@example.com",
                "Career evaluation",
                null
        );

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("PARTIAL_SUCCESS");
        assertThat(result.getProfileStrength().getOverallScore()).isGreaterThan(0);
        assertThat(result.getCareerGaps()).isNotNull();
    }
}
