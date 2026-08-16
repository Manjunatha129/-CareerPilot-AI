package com.careerpilot.service;

import com.careerpilot.dto.JobDTO;
import com.careerpilot.dto.PageResponse;
import com.careerpilot.entity.Company;
import com.careerpilot.entity.Job;
import com.careerpilot.entity.JobSkill;
import com.careerpilot.exception.ResourceNotFoundException;
import com.careerpilot.ingestion.*;
import com.careerpilot.repository.CompanyRepository;
import com.careerpilot.repository.JobRepository;
import com.careerpilot.repository.JobSkillRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    @Mock
    private SeedJobSourceConnector seedJobSourceConnector;

    @Mock
    private RemotiveJobSourceConnector remotiveJobSourceConnector;

    @Mock
    private ArbeitnowJobSourceConnector arbeitnowJobSourceConnector;

    @Mock
    private AdzunaJobSourceConnector adzunaJobSourceConnector;

    @Spy
    private JobNormalizer jobNormalizer = new JobNormalizer();

    @Spy
    private JobValidator jobValidator = new JobValidator();

    @Mock
    private JobDeduplicator jobDeduplicator;

    @Mock
    private JobRepository jobRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private JobSkillRepository jobSkillRepository;

    @InjectMocks
    private JobService jobService;

    private RawJobData sampleRawJob;

    @BeforeEach
    void setUp() {
        sampleRawJob = RawJobData.builder()
                .id("1")
                .company("TechScale Solutions")
                .title("Junior Java Developer")
                .location("San Francisco, CA")
                .workMode("HYBRID")
                .employmentType("FULL_TIME")
                .experienceLevel("ENTRY")
                .minSalary(new BigDecimal("85000"))
                .maxSalary(new BigDecimal("110000"))
                .description("Build RESTful APIs using Spring Boot, write unit tests with JUnit 5, and work with PostgreSQL database systems.")
                .requiredSkills(List.of("Java", "Spring Boot", "PostgreSQL"))
                .niceToHaveSkills(List.of("Docker", "JUnit"))
                .sourceName("SEED_DATA")
                .build();
    }

    @Test
    void processAndPersistRawJobs_NewJob_Success() {
        Company mockCompany = Company.builder().id(10L).name("TechScale Solutions").build();
        when(companyRepository.findByNameIgnoreCase("TechScale Solutions")).thenReturn(Optional.empty());
        when(companyRepository.save(any(Company.class))).thenReturn(mockCompany);

        when(jobDeduplicator.findExistingJob(any(RawJobData.class), eq(10L))).thenReturn(Optional.empty());

        Job savedJob = Job.builder()
                .id(100L)
                .companyId(10L)
                .companyName("TechScale Solutions")
                .title("Junior Java Developer")
                .sourceName("SEED_DATA")
                .externalJobId("1")
                .build();

        when(jobRepository.save(any(Job.class))).thenReturn(savedJob);

        int count = jobService.processAndPersistRawJobs(List.of(sampleRawJob));

        assertEquals(1, count);
        verify(jobRepository, times(1)).save(any(Job.class));
        verify(jobSkillRepository, times(1)).saveAll(anyList());
    }

    @Test
    void processAndPersistRawJobs_IdempotentDuplicateUpdate() {
        Company mockCompany = Company.builder().id(10L).name("TechScale Solutions").build();
        when(companyRepository.findByNameIgnoreCase("TechScale Solutions")).thenReturn(Optional.of(mockCompany));

        Job existingJob = Job.builder()
                .id(100L)
                .companyId(10L)
                .companyName("TechScale Solutions")
                .title("Junior Java Developer")
                .sourceName("SEED_DATA")
                .externalJobId("1")
                .build();

        when(jobDeduplicator.findExistingJob(any(RawJobData.class), eq(10L))).thenReturn(Optional.of(existingJob));
        when(jobRepository.save(any(Job.class))).thenReturn(existingJob);

        int count = jobService.processAndPersistRawJobs(List.of(sampleRawJob));

        assertEquals(1, count);
        verify(jobRepository, times(1)).save(existingJob);
    }

    @Test
    void searchJobs_ReturnsPaginatedResult() {
        Job job = Job.builder()
                .id(100L)
                .companyId(10L)
                .companyName("TechScale Solutions")
                .title("Junior Java Developer")
                .sourceName("SEED_DATA")
                .workMode("HYBRID")
                .location("San Francisco, CA")
                .descriptionRaw("Test description for search")
                .build();

        Company company = Company.builder().id(10L).name("TechScale Solutions").build();
        List<JobSkill> skills = List.of(
                JobSkill.builder().jobId(100L).skillName("Java").isRequired(true).build()
        );

        when(jobRepository.searchJobs(any(), any(), any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(job)));
        when(companyRepository.findById(10L)).thenReturn(Optional.of(company));
        when(jobSkillRepository.findByJobId(100L)).thenReturn(skills);

        PageResponse<JobDTO> pageResponse = jobService.searchJobs(
                "Java", null, null, null, null, null, null, 0, 10, "createdAt", "DESC"
        );

        assertNotNull(pageResponse);
        assertEquals(1, pageResponse.getContent().size());
        assertEquals("Junior Java Developer", pageResponse.getContent().get(0).getTitle());
        assertEquals("LinkedIn / Indeed", pageResponse.getContent().get(0).getSourceLabel());
    }

    @Test
    void getJobById_NotFound_ThrowsException() {
        when(jobRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> jobService.getJobById(999L));
    }
}
