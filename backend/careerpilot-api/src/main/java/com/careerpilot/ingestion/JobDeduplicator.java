package com.careerpilot.ingestion;

import com.careerpilot.entity.Job;
import com.careerpilot.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class JobDeduplicator {

    private final JobRepository jobRepository;

    /**
     * Checks if a job record already exists in PostgreSQL based on external ID + source or company + title + location.
     * @return Existing Job if found, otherwise Optional.empty()
     */
    public Optional<Job> findExistingJob(RawJobData normalizedJob, Long companyId) {
        if (normalizedJob == null) return Optional.empty();

        // 1. Check external ID + source
        if (normalizedJob.getId() != null && !normalizedJob.getId().isEmpty()) {
            Optional<Job> byExternalId = jobRepository.findByExternalJobIdAndSourceName(
                    normalizedJob.getId(), normalizedJob.getSourceName()
            );
            if (byExternalId.isPresent()) {
                log.debug("Found existing job by external ID ({}) and source ({})", normalizedJob.getId(), normalizedJob.getSourceName());
                return byExternalId;
            }
        }

        // 2. Check company ID + title + location
        if (companyId != null && normalizedJob.getTitle() != null && normalizedJob.getLocation() != null) {
            Optional<Job> byComposite = jobRepository.findByCompanyIdAndTitleIgnoreCaseAndLocationIgnoreCase(
                    companyId, normalizedJob.getTitle(), normalizedJob.getLocation()
            );
            if (byComposite.isPresent()) {
                log.debug("Found existing job by composite key (company #{}, title '{}', location '{}')", companyId, normalizedJob.getTitle(), normalizedJob.getLocation());
                return byComposite;
            }
        }

        return Optional.empty();
    }
}
