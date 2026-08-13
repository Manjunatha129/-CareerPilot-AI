package com.careerpilot.service;

import com.careerpilot.config.MatchingConfigProperties;
import com.careerpilot.dto.MatchResponseDTO;
import com.careerpilot.entity.*;
import com.careerpilot.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class HybridMatchingServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private ResumeRepository resumeRepository;

    @Mock
    private JobRepository jobRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private JobSkillRepository jobSkillRepository;

    @Mock
    private SkillRepository skillRepository;

    @Spy
    private SkillNormalizationService skillNormalizer = new SkillNormalizationService();

    @Mock
    private AiServiceClient aiServiceClient;

    @Spy
    private MatchingConfigProperties config = new MatchingConfigProperties();

    @InjectMocks
    private HybridMatchingService hybridMatchingService;

    private User testUser;
    private Profile testProfile;
    private Job testJob;

    @BeforeEach
    public void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("candidate@example.com")
                .fullName("Jane Candidate")
                .role("ROLE_USER")
                .build();

        testProfile = Profile.builder()
                .id(1L)
                .userId(1L)
                .targetJobTitle("Senior Java Developer")
                .currentLocation("San Francisco, CA")
                .preferredWorkMode("REMOTE")
                .totalExperienceYears(5.0)
                .educationLevel("BACHELORS")
                .minExpectedSalary(new BigDecimal("120000"))
                .build();

        testJob = Job.builder()
                .id(10L)
                .title("Senior Java Developer")
                .companyName("TechScale Solutions")
                .location("San Francisco, CA")
                .workMode("REMOTE")
                .employmentType("FULL_TIME")
                .experienceLevel("SENIOR")
                .minSalary(new BigDecimal("130000"))
                .maxSalary(new BigDecimal("160000"))
                .descriptionRaw("Looking for a Senior Java Developer with Spring Boot and PostgreSQL expertise.")
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("Should calculate deterministic match score with 6 dimensions and return STRONG_MATCH")
    public void shouldCalculateDeterministicMatchScore() {
        when(userRepository.findByEmail("candidate@example.com")).thenReturn(Optional.of(testUser));
        when(profileRepository.findByUserId(1L)).thenReturn(Optional.of(testProfile));
        when(resumeRepository.findByUserIdAndIsPrimaryTrue(1L)).thenReturn(Optional.empty());
        when(resumeRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(Collections.emptyList());
        when(jobRepository.findById(10L)).thenReturn(Optional.of(testJob));

        Skill cSkill1 = Skill.builder().profileId(1L).skillName("Java").build();
        Skill cSkill2 = Skill.builder().profileId(1L).skillName("Spring Boot").build();
        Skill cSkill3 = Skill.builder().profileId(1L).skillName("PostgreSQL").build();
        when(skillRepository.findByProfileId(any())).thenReturn(List.of(cSkill1, cSkill2, cSkill3));

        JobSkill skill1 = JobSkill.builder().jobId(10L).skillName("Java").isRequired(true).build();
        JobSkill skill2 = JobSkill.builder().jobId(10L).skillName("Spring Boot").isRequired(true).build();
        JobSkill skill3 = JobSkill.builder().jobId(10L).skillName("PostgreSQL").isRequired(true).build();

        when(jobSkillRepository.findByJobId(10L)).thenReturn(List.of(skill1, skill2, skill3));
        when(aiServiceClient.getSemanticSimilarity(any(), any())).thenReturn(85.0);
        when(aiServiceClient.getMatchExplanation(any())).thenReturn("{\"summary\":\"Strong match for Senior Java Developer.\"}");

        MatchResponseDTO response = hybridMatchingService.calculateJobMatch("candidate@example.com", 10L);

        assertThat(response).isNotNull();
        assertThat(response.getOverallScore()).isGreaterThanOrEqualTo(80);
        assertThat(response.getMatchCategory()).isEqualTo("STRONG_MATCH");
        assertThat(response.getBreakdown().getSkillScore()).isEqualTo(100);
        assertThat(response.getBreakdown().getExperienceScore()).isEqualTo(100);
        assertThat(response.getBreakdown().getEducationScore()).isEqualTo(100);
        assertThat(response.getMatchedSkills()).contains("Java", "Spring Boot", "PostgreSQL");
        assertThat(response.isAiAvailable()).isTrue();
    }

    @Test
    @DisplayName("Should handle Gemini AI service failure gracefully without failing deterministic score")
    public void shouldFallbackWhenGeminiServiceFails() {
        when(userRepository.findByEmail("candidate@example.com")).thenReturn(Optional.of(testUser));
        when(profileRepository.findByUserId(1L)).thenReturn(Optional.of(testProfile));
        when(resumeRepository.findByUserIdAndIsPrimaryTrue(1L)).thenReturn(Optional.empty());
        when(resumeRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(Collections.emptyList());
        when(jobRepository.findById(10L)).thenReturn(Optional.of(testJob));
        when(jobSkillRepository.findByJobId(10L)).thenReturn(Collections.emptyList());
        when(aiServiceClient.getSemanticSimilarity(any(), any())).thenReturn(null);
        when(aiServiceClient.getMatchExplanation(any())).thenReturn(null);

        MatchResponseDTO response = hybridMatchingService.calculateJobMatch("candidate@example.com", 10L);

        assertThat(response).isNotNull();
        assertThat(response.getOverallScore()).isBetween(0, 100);
        assertThat(response.isAiAvailable()).isFalse();
        assertThat(response.getAiExplanation()).contains("temporarily unavailable");
    }
}
