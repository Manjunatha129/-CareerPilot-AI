package com.careerpilot.controller;

import com.careerpilot.dto.ApiResponse;
import com.careerpilot.dto.CareerIntelligenceDTO;
import com.careerpilot.service.CareerIntelligenceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class CareerIntelligenceControllerTest {

    @Mock
    private CareerIntelligenceService careerIntelligenceService;

    @Mock
    private Authentication authentication;

    @Mock
    private SecurityContext securityContext;

    @InjectMocks
    private CareerIntelligenceController controller;

    @BeforeEach
    public void setUp() {
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    @DisplayName("Should execute multi-agent career intelligence workflow for authenticated candidate")
    public void shouldExecuteCareerIntelligenceWorkflow() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("candidate@careerpilot.ai");

        CareerIntelligenceDTO mockDto = CareerIntelligenceDTO.builder()
                .status("SUCCESS")
                .executedAgents(List.of("career_manager", "resume_intelligence", "job_intelligence", "skill_gap", "career_planner"))
                .answer("Ready for Java backend")
                .matchedSkills(List.of("Java"))
                .missingSkills(List.of("Docker"))
                .build();

        when(careerIntelligenceService.analyzeCareer("candidate@careerpilot.ai", "Am I ready for Java Backend roles?", null))
                .thenReturn(mockDto);

        CareerIntelligenceController.CareerIntelligenceRequest req = new CareerIntelligenceController.CareerIntelligenceRequest();
        req.setQuery("Am I ready for Java Backend roles?");

        ResponseEntity<ApiResponse<CareerIntelligenceDTO>> responseEntity = controller.runCareerIntelligence(req);

        assertThat(responseEntity).isNotNull();
        assertThat(responseEntity.getBody()).isNotNull();
        assertThat(responseEntity.getBody().isSuccess()).isTrue();

        CareerIntelligenceDTO dto = responseEntity.getBody().getData();
        assertThat(dto.getStatus()).isEqualTo("SUCCESS");
        assertThat(dto.getExecutedAgents()).contains("career_manager", "skill_gap", "career_planner");
        assertThat(dto.getMissingSkills()).contains("Docker");
    }

    @Test
    @DisplayName("Should retrieve dashboard analysis via GET endpoint")
    public void shouldGetCareerIntelligenceDashboard() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("candidate@careerpilot.ai");

        CareerIntelligenceDTO mockDto = CareerIntelligenceDTO.builder()
                .status("SUCCESS")
                .answer("Dashboard loaded")
                .build();

        when(careerIntelligenceService.analyzeCareer("candidate@careerpilot.ai", "Career Overview Dashboard", null))
                .thenReturn(mockDto);

        ResponseEntity<ApiResponse<CareerIntelligenceDTO>> responseEntity = controller.getCareerIntelligenceDashboard();

        assertThat(responseEntity).isNotNull();
        assertThat(responseEntity.getBody()).isNotNull();
        assertThat(responseEntity.getBody().isSuccess()).isTrue();
        assertThat(responseEntity.getBody().getData().getAnswer()).isEqualTo("Dashboard loaded");
    }
}
