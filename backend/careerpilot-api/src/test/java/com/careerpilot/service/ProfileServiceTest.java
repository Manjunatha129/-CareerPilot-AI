package com.careerpilot.service;

import com.careerpilot.dto.ProfileRequest;
import com.careerpilot.dto.ProfileResponse;
import com.careerpilot.entity.Profile;
import com.careerpilot.entity.Skill;
import com.careerpilot.repository.ProfileRepository;
import com.careerpilot.repository.SkillRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProfileServiceTest {

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private SkillRepository skillRepository;

    @InjectMocks
    private ProfileService profileService;

    @Test
    @DisplayName("Should retrieve user profile and mapped skills")
    public void shouldGetProfileByUserId() {
        Profile profile = Profile.builder()
                .id(1L)
                .userId(10L)
                .headline("Senior Java Developer")
                .totalExperienceYears(3.5)
                .preferredWorkMode("REMOTE")
                .build();

        Skill skill1 = Skill.builder().profileId(1L).skillName("Java").proficiencyLevel("ADVANCED").build();
        Skill skill2 = Skill.builder().profileId(1L).skillName("Git").proficiencyLevel("INTERMEDIATE").build();

        when(profileRepository.findByUserId(10L)).thenReturn(Optional.of(profile));
        when(skillRepository.findByProfileId(1L)).thenReturn(List.of(skill1, skill2));

        ProfileResponse response = profileService.getProfileByUserId(10L);

        assertThat(response.getHeadline()).isEqualTo("Senior Java Developer");
        assertThat(response.getPrimarySkills()).contains("Java");
        assertThat(response.getSecondarySkills()).contains("Git");
    }

    @Test
    @DisplayName("Should update user profile and skills list")
    public void shouldUpdateProfile() {
        Profile profile = Profile.builder()
                .id(1L)
                .userId(10L)
                .headline("Java Developer")
                .build();

        ProfileRequest request = ProfileRequest.builder()
                .headline("Lead Java Architect")
                .totalExperienceYears(5.0)
                .currentLocation("San Francisco, CA")
                .preferredWorkMode("HYBRID")
                .minExpectedSalary(new BigDecimal("130000"))
                .primarySkills(List.of("Java 21", "Spring Boot"))
                .secondarySkills(List.of("Docker", "AWS"))
                .build();

        when(profileRepository.findByUserId(10L)).thenReturn(Optional.of(profile));
        when(profileRepository.save(any(Profile.class))).thenReturn(profile);
        when(skillRepository.findByProfileId(1L)).thenReturn(List.of(
                Skill.builder().profileId(1L).skillName("Java 21").proficiencyLevel("ADVANCED").build()
        ));

        ProfileResponse response = profileService.updateProfile(10L, request);

        assertThat(response.getHeadline()).isEqualTo("Lead Java Architect");
        verify(skillRepository, times(1)).deleteByProfileId(1L);
        verify(skillRepository, atLeastOnce()).save(any(Skill.class));
    }
}
