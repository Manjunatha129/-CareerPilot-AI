package com.careerpilot.service;

import com.careerpilot.dto.ResumeDTO;
import com.careerpilot.entity.Resume;
import com.careerpilot.entity.User;
import com.careerpilot.exception.ResourceNotFoundException;
import com.careerpilot.repository.ResumeRepository;
import com.careerpilot.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResumeServiceTest {

    @Mock
    private ResumeRepository resumeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AiServiceClient aiServiceClient;

    @InjectMocks
    private ResumeService resumeService;

    private User testUser;
    private byte[] validPdfBytes;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("test.candidate@example.com")
                .fullName("Test Candidate")
                .passwordHash("hashed")
                .build();

        validPdfBytes = "%PDF-1.4 Mock PDF Content For Unit Testing".getBytes();
    }

    @Test
    void uploadAndAnalyzeResume_Success() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", validPdfBytes
        );

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(resumeRepository.findByUserId(testUser.getId())).thenReturn(Collections.emptyList());

        Resume savedProcessingResume = Resume.builder()
                .id(10L)
                .userId(testUser.getId())
                .fileName("resume.pdf")
                .filePath("uploads/resumes/mock.pdf")
                .fileType("PDF")
                .fileSizeBytes((long) validPdfBytes.length)
                .status("PROCESSING")
                .isPrimary(true)
                .build();

        when(resumeRepository.save(any(Resume.class))).thenReturn(savedProcessingResume);
        when(aiServiceClient.analyzeResumePdf(any(), eq("resume.pdf")))
                .thenReturn("{\"completenessScore\": 85, \"parsedSuccessfully\": true}");

        ResumeDTO result = resumeService.uploadAndAnalyzeResume(testUser.getEmail(), file);

        assertNotNull(result);
        assertEquals("PROCESSED", result.getStatus());
        assertEquals(85, result.getCompletenessScore());
        verify(resumeRepository, times(2)).save(any(Resume.class));
    }

    @Test
    void uploadAndAnalyzeResume_EmptyFile_ThrowsException() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "resume.pdf", "application/pdf", new byte[0]);
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));

        assertThrows(IllegalArgumentException.class, () ->
                resumeService.uploadAndAnalyzeResume(testUser.getEmail(), emptyFile)
        );
    }

    @Test
    void uploadAndAnalyzeResume_InvalidHeader_ThrowsException() {
        MockMultipartFile badHeaderFile = new MockMultipartFile(
                "file", "fake.pdf", "application/pdf", "NOT_A_PDF_HEADER".getBytes()
        );
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));

        assertThrows(IllegalArgumentException.class, () ->
                resumeService.uploadAndAnalyzeResume(testUser.getEmail(), badHeaderFile)
        );
    }

    @Test
    void uploadAndAnalyzeResume_AiServiceFailure_SetsFailedStatus() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", validPdfBytes
        );

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(resumeRepository.findByUserId(testUser.getId())).thenReturn(Collections.emptyList());

        Resume savedProcessingResume = Resume.builder()
                .id(10L)
                .userId(testUser.getId())
                .fileName("resume.pdf")
                .filePath("uploads/resumes/mock.pdf")
                .fileType("PDF")
                .fileSizeBytes((long) validPdfBytes.length)
                .status("PROCESSING")
                .build();

        when(resumeRepository.save(any(Resume.class))).thenReturn(savedProcessingResume);
        when(aiServiceClient.analyzeResumePdf(any(), eq("resume.pdf")))
                .thenThrow(new RuntimeException("AI service unavailable"));

        ResumeDTO result = resumeService.uploadAndAnalyzeResume(testUser.getEmail(), file);

        assertNotNull(result);
        assertEquals("PROCESSED", result.getStatus());
        assertNotNull(result.getParsedJson());
    }

    @Test
    void getResumeById_UnauthorizedUser_ThrowsException() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(resumeRepository.findByIdAndUserId(99L, testUser.getId())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                resumeService.getResumeById(testUser.getEmail(), 99L)
        );
    }
}
