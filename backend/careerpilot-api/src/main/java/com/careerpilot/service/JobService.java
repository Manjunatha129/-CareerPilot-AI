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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobService {

    private final SeedJobSourceConnector seedJobSourceConnector;
    private final RemotiveJobSourceConnector remotiveJobSourceConnector;
    private final ArbeitnowJobSourceConnector arbeitnowJobSourceConnector;
    private final AdzunaJobSourceConnector adzunaJobSourceConnector;
    private final JobNormalizer jobNormalizer;
    private final JobValidator jobValidator;
    private final JobDeduplicator jobDeduplicator;

    private final JobRepository jobRepository;
    private final CompanyRepository companyRepository;
    private final JobSkillRepository jobSkillRepository;

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "createdAt", "created_at", "title", "companyName", "company_name", "location", "minSalary", "maxSalary"
    );

    /**
     * Idempotently ingests synthetic seed jobs from sample-data/jobs/seed-jobs.json.
     * Prevents duplicate rows on multiple runs.
     */
    @Transactional
    public int ingestSeedJobs() {
        log.info("Starting idempotent seed job ingestion...");
        List<RawJobData> rawJobs = seedJobSourceConnector.fetchRawJobs();
        return processAndPersistRawJobs(rawJobs);
    }

    /**
     * Fetches real live job postings from public/official job APIs (Remotive, Arbeitnow, Adzuna).
     */
    @Transactional
    public int fetchAndIngestLiveJobs(String search, String location) {
        log.info("Fetching real job listings from external APIs (search='{}', location='{}')...", search, location);
        List<RawJobData> liveJobs = new ArrayList<>();
        try {
            liveJobs.addAll(remotiveJobSourceConnector.fetchRawJobsByQuery(search, location));
        } catch (Exception e) {
            log.warn("Remotive API fetch error: {}", e.getMessage());
        }
        try {
            liveJobs.addAll(arbeitnowJobSourceConnector.fetchRawJobsByQuery(search, location));
        } catch (Exception e) {
            log.warn("Arbeitnow API fetch error: {}", e.getMessage());
        }
        try {
            liveJobs.addAll(adzunaJobSourceConnector.fetchRawJobsByQuery(search, "us"));
        } catch (Exception e) {
            log.warn("Adzuna API fetch error: {}", e.getMessage());
        }

        if (!liveJobs.isEmpty()) {
            return processAndPersistRawJobs(liveJobs);
        }
        return 0;
    }

    @Transactional
    public int processAndPersistRawJobs(List<RawJobData> rawJobs) {
        int processedCount = 0;

        for (RawJobData raw : rawJobs) {
            RawJobData normalized = jobNormalizer.normalize(raw);
            JobValidator.ValidationResult validation = jobValidator.validate(normalized);
            if (!validation.isValid()) {
                log.warn("Skipping invalid raw job (id={}): {}", raw.getId(), validation.getErrors());
                continue;
            }

            // 1. Resolve Company (find or create)
            Company company = companyRepository.findByNameIgnoreCase(normalized.getCompany())
                    .orElseGet(() -> {
                        Company newComp = Company.builder()
                                .name(normalized.getCompany())
                                .location(normalized.getLocation())
                                .build();
                        return companyRepository.save(newComp);
                    });

            // 2. Check Deduplication
            Optional<Job> existingJobOpt = jobDeduplicator.findExistingJob(normalized, company.getId());

            Job jobToSave;
            if (existingJobOpt.isPresent()) {
                jobToSave = existingJobOpt.get();
                log.info("Updating existing duplicate job #{} ('{}' at '{}')", jobToSave.getId(), normalized.getTitle(), company.getName());
                jobToSave.setCompanyId(company.getId());
                jobToSave.setCompanyName(company.getName());
                jobToSave.setTitle(normalized.getTitle());
                jobToSave.setLocation(normalized.getLocation());
                jobToSave.setWorkMode(normalized.getWorkMode());
                jobToSave.setEmploymentType(normalized.getEmploymentType());
                jobToSave.setExperienceLevel(normalized.getExperienceLevel());
                jobToSave.setMinSalary(normalized.getMinSalary());
                jobToSave.setMaxSalary(normalized.getMaxSalary());
                jobToSave.setSourceUrl(normalized.getSourceUrl());
                jobToSave.setDescriptionRaw(normalized.getDescription());
            } else {
                log.info("Inserting new job posting ('{}' at '{}')", normalized.getTitle(), company.getName());
                jobToSave = Job.builder()
                        .companyId(company.getId())
                        .companyName(company.getName())
                        .title(normalized.getTitle())
                        .sourceName(normalized.getSourceName())
                        .externalJobId(normalized.getId())
                        .sourceUrl(normalized.getSourceUrl())
                        .location(normalized.getLocation())
                        .workMode(normalized.getWorkMode())
                        .employmentType(normalized.getEmploymentType())
                        .experienceLevel(normalized.getExperienceLevel())
                        .minSalary(normalized.getMinSalary())
                        .maxSalary(normalized.getMaxSalary())
                        .descriptionRaw(normalized.getDescription())
                        .isActive(true)
                        .build();
            }

            Job savedJob = jobRepository.save(jobToSave);

            // 3. Associate Required & Nice-to-Have Skills
            jobSkillRepository.deleteByJobId(savedJob.getId());
            List<JobSkill> skillsToSave = new ArrayList<>();

            if (normalized.getRequiredSkills() != null) {
                for (String skillName : normalized.getRequiredSkills()) {
                    skillsToSave.add(JobSkill.builder()
                            .jobId(savedJob.getId())
                            .skillName(skillName)
                            .isRequired(true)
                            .weight(1.0)
                            .build());
                }
            }

            if (normalized.getNiceToHaveSkills() != null) {
                for (String skillName : normalized.getNiceToHaveSkills()) {
                    skillsToSave.add(JobSkill.builder()
                            .jobId(savedJob.getId())
                            .skillName(skillName)
                            .isRequired(false)
                            .weight(0.5)
                            .build());
                }
            }

            if (!skillsToSave.isEmpty()) {
                jobSkillRepository.saveAll(skillsToSave);
            }

            processedCount++;
        }

        log.info("Finished job ingestion. Successfully processed {} jobs.", processedCount);
        return processedCount;
    }

    @Transactional
    public PageResponse<JobDTO> searchJobs(
            String search,
            String location,
            String workMode,
            String employmentType,
            String experienceLevel,
            String company,
            String source,
            int page,
            int size,
            String sortBy,
            String sortDirection
    ) {
        String cleanSearch = cleanString(search);
        String cleanLocation = cleanString(location);

        // Fetch live jobs from real open-source APIs if search term is provided or DB is empty
        if (cleanSearch != null || cleanLocation != null || jobRepository.count() == 0) {
            fetchAndIngestLiveJobs(cleanSearch != null ? cleanSearch : "developer", cleanLocation);
        }

        String cleanSort = (sortBy != null && ALLOWED_SORT_FIELDS.contains(sortBy)) ? sortBy : "createdAt";
        Sort.Direction direction = "ASC".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, cleanSort));

        Page<Job> jobPage = jobRepository.searchJobs(
                cleanSearch,
                cleanLocation,
                cleanString(workMode),
                cleanString(employmentType),
                cleanString(experienceLevel),
                cleanString(company),
                cleanString(source),
                pageable
        );

        Page<JobDTO> dtoPage = jobPage.map(job -> {
            Company comp = job.getCompanyId() != null ? companyRepository.findById(job.getCompanyId()).orElse(null) : null;
            List<JobSkill> skills = jobSkillRepository.findByJobId(job.getId());
            return JobDTO.fromEntity(job, comp, skills);
        });

        return PageResponse.fromPage(dtoPage);
    }

    @Transactional(readOnly = true)
    public JobDTO getJobById(Long id) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job posting not found (id=" + id + ")"));

        Company company = job.getCompanyId() != null ? companyRepository.findById(job.getCompanyId()).orElse(null) : null;
        List<JobSkill> skills = jobSkillRepository.findByJobId(job.getId());

        return JobDTO.fromEntity(job, company, skills);
    }

    private String cleanString(String s) {
        if (s == null || s.trim().isEmpty()) return null;
        return s.trim();
    }
}
