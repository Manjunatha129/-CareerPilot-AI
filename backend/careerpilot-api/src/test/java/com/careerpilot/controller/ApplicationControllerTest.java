package com.careerpilot.controller;

import com.careerpilot.dto.*;
import com.careerpilot.service.ApplicationService;
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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ApplicationControllerTest {

    @Mock
    private ApplicationService applicationService;

    @Mock
    private Authentication authentication;

    @Mock
    private SecurityContext securityContext;

    @InjectMocks
    private ApplicationController controller;

    @BeforeEach
    public void setUp() {
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("candidate@example.com");
    }

    @Test
    @DisplayName("Should retrieve applications list for authenticated user")
    public void shouldGetUserApplications() {
        PageResponse<ApplicationDTO> page = PageResponse.<ApplicationDTO>builder()
                .content(List.of(ApplicationDTO.builder().id(100L).status("APPLIED").build()))
                .totalElements(1L)
                .build();

        when(applicationService.getUserApplications(eq("candidate@example.com"), any(), anyInt(), anyInt(), any(), any()))
                .thenReturn(page);

        ResponseEntity<ApiResponse<PageResponse<ApplicationDTO>>> response = controller.getUserApplications(
                null, 0, 20, null, "updatedAt"
        );

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getData().getContent()).hasSize(1);
    }

    @Test
    @DisplayName("Should create new application for authenticated user")
    public void shouldCreateApplication() {
        ApplicationDTO dto = ApplicationDTO.builder().id(101L).status("APPLIED").build();
        when(applicationService.createApplication(eq("candidate@example.com"), any())).thenReturn(dto);

        ApplicationCreateRequestDTO req = new ApplicationCreateRequestDTO();
        req.setJobId(10L);
        req.setStatus("APPLIED");

        ResponseEntity<ApiResponse<ApplicationDTO>> response = controller.createApplication(req);

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getData().getId()).isEqualTo(101L);
    }

    @Test
    @DisplayName("Should update application status")
    public void shouldUpdateStatus() {
        ApplicationDTO dto = ApplicationDTO.builder().id(100L).status("INTERVIEW").build();
        when(applicationService.updateStatus(eq("candidate@example.com"), eq(100L), any())).thenReturn(dto);

        StatusUpdateRequestDTO req = new StatusUpdateRequestDTO();
        req.setNewStatus("INTERVIEW");

        ResponseEntity<ApiResponse<ApplicationDTO>> response = controller.updateStatus(100L, req);

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData().getStatus()).isEqualTo("INTERVIEW");
    }

    @Test
    @DisplayName("Should delete application")
    public void shouldDeleteApplication() {
        ResponseEntity<ApiResponse<Void>> response = controller.deleteApplication(100L);

        verify(applicationService).deleteApplication("candidate@example.com", 100L);
        assertThat(response.getBody().isSuccess()).isTrue();
    }
}
