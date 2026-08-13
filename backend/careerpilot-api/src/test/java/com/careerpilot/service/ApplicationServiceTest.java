package com.careerpilot.service;

import com.careerpilot.dto.*;
import com.careerpilot.entity.*;
import com.careerpilot.exception.BadRequestException;
import com.careerpilot.exception.ResourceNotFoundException;
import com.careerpilot.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JobRepository jobRepository;

    @Mock
    private ResumeRepository resumeRepository;

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private ApplicationStatusHistoryRepository statusHistoryRepository;

    @Mock
    private HybridMatchingService hybridMatchingService;

    @InjectMocks
    private ApplicationService applicationService;

    private User testUser;
    private Job testJob;
    private Application testApp;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("candidate@example.com")
                .fullName("Candidate User")
                .build();

        testJob = Job.builder()
                .id(10L)
                .title("Java Backend Developer")
                .companyName("TechCorp")
                .location("Remote")
                .workMode("REMOTE")
                .build();

        testApp = Application.builder()
                .id(100L)
                .userId(1L)
                .jobId(10L)
                .status("SAVED")
                .build();
    }

    @Test
    @DisplayName("Should save job for user idempotently")
    void saveJob_Success() {
        when(userRepository.findByEmail("candidate@example.com")).thenReturn(Optional.of(testUser));
        when(jobRepository.findById(10L)).thenReturn(Optional.of(testJob));
        when(applicationRepository.findByUserIdAndJobId(1L, 10L)).thenReturn(Optional.empty());
        when(applicationRepository.save(any())).thenReturn(testApp);

        ApplicationDTO result = applicationService.saveJob("candidate@example.com", 10L);

        assertThat(result).isNotNull();
        assertThat(result.getJobTitle()).isEqualTo("Java Backend Developer");
        assertThat(result.getStatus()).isEqualTo("SAVED");
        verify(statusHistoryRepository).save(any());
    }

    @Test
    @DisplayName("Should create application with status APPLIED and record history")
    void createApplication_Success() {
        when(userRepository.findByEmail("candidate@example.com")).thenReturn(Optional.of(testUser));
        when(jobRepository.findById(10L)).thenReturn(Optional.of(testJob));
        when(applicationRepository.findByUserIdAndJobId(1L, 10L)).thenReturn(Optional.empty());

        Application appliedApp = Application.builder()
                .id(101L)
                .userId(1L)
                .jobId(10L)
                .status("APPLIED")
                .source("LinkedIn")
                .build();

        when(applicationRepository.save(any())).thenReturn(appliedApp);

        ApplicationCreateRequestDTO req = new ApplicationCreateRequestDTO();
        req.setJobId(10L);
        req.setStatus("APPLIED");
        req.setSource("LinkedIn");

        ApplicationDTO result = applicationService.createApplication("candidate@example.com", req);

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("APPLIED");
        verify(statusHistoryRepository).save(any());
    }

    @Test
    @DisplayName("Should update application status and record history")
    void updateStatus_Success() {
        when(userRepository.findByEmail("candidate@example.com")).thenReturn(Optional.of(testUser));
        when(applicationRepository.findById(100L)).thenReturn(Optional.of(testApp));
        when(jobRepository.findById(10L)).thenReturn(Optional.of(testJob));
        when(applicationRepository.save(any())).thenReturn(testApp);

        StatusUpdateRequestDTO req = new StatusUpdateRequestDTO();
        req.setNewStatus("INTERVIEW");
        req.setNote("Technical interview scheduled");

        ApplicationDTO result = applicationService.updateStatus("candidate@example.com", 100L, req);

        assertThat(result).isNotNull();
        assertThat(testApp.getStatus()).isEqualTo("INTERVIEW");
        verify(statusHistoryRepository).save(any());
    }

    @Test
    @DisplayName("Should enforce user isolation when accessing another user's application")
    void getApplicationById_UserIsolationError() {
        User otherUser = User.builder().id(99L).email("other@example.com").build();
        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(otherUser));
        when(applicationRepository.findById(100L)).thenReturn(Optional.of(testApp)); // testApp belongs to user 1L

        assertThatThrownBy(() -> applicationService.getApplicationById("other@example.com", 100L))
                .isInstanceOf(com.careerpilot.exception.BadRequestException.class)
                .hasMessageContaining("Access denied");
    }

    @Test
    @DisplayName("Should calculate accurate deterministic application metrics")
    void getApplicationMetrics_Success() {
        when(userRepository.findByEmail("candidate@example.com")).thenReturn(Optional.of(testUser));

        Application app1 = Application.builder().id(1L).userId(1L).jobId(10L).status("APPLIED").build();
        Application app2 = Application.builder().id(2L).userId(1L).jobId(11L).status("INTERVIEW").build();
        Application app3 = Application.builder().id(3L).userId(1L).jobId(12L).status("OFFER").build();
        Application app4 = Application.builder().id(4L).userId(1L).jobId(13L).status("SAVED").build();

        when(applicationRepository.findByUserIdOrderByUpdatedAtDesc(1L)).thenReturn(List.of(app1, app2, app3, app4));

        ApplicationMetricsDTO metrics = applicationService.getApplicationMetrics("candidate@example.com");

        assertThat(metrics).isNotNull();
        assertThat(metrics.getTotalApplications()).isEqualTo(4);
        assertThat(metrics.getSavedCount()).isEqualTo(1);
        assertThat(metrics.getAppliedCount()).isEqualTo(1);
        assertThat(metrics.getInterviewCount()).isEqualTo(1);
        assertThat(metrics.getOfferCount()).isEqualTo(1);
        assertThat(metrics.getInterviewConversionRate()).isEqualTo(33.3); // 1 interview / 3 active
        assertThat(metrics.getOfferConversionRate()).isEqualTo(33.3); // 1 offer / 3 active
    }
}
