package com.careerpilot.service;

import com.careerpilot.dto.ProfileRequest;
import com.careerpilot.dto.ProfileResponse;
import com.careerpilot.entity.Profile;
import com.careerpilot.entity.Skill;
import com.careerpilot.exception.ResourceNotFoundException;
import com.careerpilot.repository.ProfileRepository;
import com.careerpilot.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final SkillRepository skillRepository;

    @Transactional(readOnly = true)
    public ProfileResponse getProfileByUserId(Long userId) {
        Profile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultProfile(userId));

        List<Skill> skills = skillRepository.findByProfileId(profile.getId());
        return mapToProfileResponse(profile, skills);
    }

    @Transactional
    public ProfileResponse updateProfile(Long userId, ProfileRequest request) {
        Profile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultProfile(userId));

        if (request.getHeadline() != null) {
            profile.setHeadline(request.getHeadline());
        }
        if (request.getSummary() != null) {
            profile.setSummary(request.getSummary());
        }
        if (request.getTotalExperienceYears() != null) {
            profile.setTotalExperienceYears(request.getTotalExperienceYears());
        }
        if (request.getCurrentLocation() != null) {
            profile.setCurrentLocation(request.getCurrentLocation());
        }
        if (request.getTargetJobTitle() != null) {
            profile.setTargetJobTitle(request.getTargetJobTitle());
        }
        if (request.getPreferredWorkMode() != null) {
            profile.setPreferredWorkMode(request.getPreferredWorkMode());
        }
        if (request.getMinExpectedSalary() != null) {
            profile.setMinExpectedSalary(request.getMinExpectedSalary());
        }
        if (request.getEducationLevel() != null) {
            profile.setEducationLevel(request.getEducationLevel());
        }

        Profile updatedProfile = profileRepository.save(profile);

        // Update skills if provided
        if (request.getPrimarySkills() != null || request.getSecondarySkills() != null) {
            skillRepository.deleteByProfileId(updatedProfile.getId());

            if (request.getPrimarySkills() != null) {
                for (String skillName : request.getPrimarySkills()) {
                    if (skillName != null && !skillName.isBlank()) {
                        Skill skill = Skill.builder()
                                .profileId(updatedProfile.getId())
                                .skillName(skillName.trim())
                                .proficiencyLevel("ADVANCED")
                                .isVerified(true)
                                .build();
                        skillRepository.save(skill);
                    }
                }
            }

            if (request.getSecondarySkills() != null) {
                for (String skillName : request.getSecondarySkills()) {
                    if (skillName != null && !skillName.isBlank()) {
                        Skill skill = Skill.builder()
                                .profileId(updatedProfile.getId())
                                .skillName(skillName.trim())
                                .proficiencyLevel("INTERMEDIATE")
                                .isVerified(false)
                                .build();
                        skillRepository.save(skill);
                    }
                }
            }
        }

        List<Skill> updatedSkills = skillRepository.findByProfileId(updatedProfile.getId());
        return mapToProfileResponse(updatedProfile, updatedSkills);
    }

    private Profile createDefaultProfile(Long userId) {
        Profile profile = Profile.builder()
                .userId(userId)
                .headline("Candidate Career Profile")
                .totalExperienceYears(0.0)
                .preferredWorkMode("HYBRID")
                .build();
        return profileRepository.save(profile);
    }

    private ProfileResponse mapToProfileResponse(Profile profile, List<Skill> skills) {
        List<String> primarySkills = new ArrayList<>();
        List<String> secondarySkills = new ArrayList<>();

        for (Skill s : skills) {
            if ("ADVANCED".equalsIgnoreCase(s.getProficiencyLevel()) || "EXPERT".equalsIgnoreCase(s.getProficiencyLevel())) {
                primarySkills.add(s.getSkillName());
            } else {
                secondarySkills.add(s.getSkillName());
            }
        }

        return ProfileResponse.builder()
                .id(profile.getId())
                .userId(profile.getUserId())
                .headline(profile.getHeadline())
                .summary(profile.getSummary())
                .totalExperienceYears(profile.getTotalExperienceYears())
                .currentLocation(profile.getCurrentLocation())
                .targetJobTitle(profile.getTargetJobTitle())
                .preferredWorkMode(profile.getPreferredWorkMode())
                .minExpectedSalary(profile.getMinExpectedSalary())
                .educationLevel(profile.getEducationLevel())
                .primarySkills(primarySkills)
                .secondarySkills(secondarySkills)
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
