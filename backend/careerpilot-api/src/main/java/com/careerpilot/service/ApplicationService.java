package com.careerpilot.service;

import com.careerpilot.dto.*;
import com.careerpilot.entity.*;
import com.careerpilot.exception.BadRequestException;
import com.careerpilot.exception.ResourceNotFoundException;
import com.careerpilot.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final ResumeRepository resumeRepository;
    private final ApplicationRepository applicationRepository;
    private final ApplicationStatusHistoryRepository statusHistoryRepository;
    private final HybridMatchingService hybridMatchingService;

    @Transactional
    public ApplicationDTO saveJob(String userEmail, Long jobId) {
        User user = getUserByEmail(userEmail);
        Job job = getJobById(jobId);

        Optional<Application> existingOpt = applicationRepository.findByUserIdAndJobId(user.getId(), job.getId());
        Application app;
        if (existingOpt.isPresent()) {
            app = existingOpt.get();
            log.info("Job #{} already tracked by user #{}, current status: {}", jobId, user.getId(), app.getStatus());
        } else {
            app = Application.builder()
                    .userId(user.getId())
                    .jobId(job.getId())
                    .status("SAVED")
                    .build();
            app = applicationRepository.save(app);

            // Add history entry
            saveStatusHistory(app.getId(), null, "SAVED", "Job saved for later exploration.");
            log.info("Saved job #{} for user #{}", jobId, user.getId());
        }

        return mapToDTO(app, userEmail, job);
    }

    @Transactional
    public ApplicationDTO createApplication(String userEmail, ApplicationCreateRequestDTO request) {
        User user = getUserByEmail(userEmail);
        Job job = getJobById(request.getJobId());

        // Validate resume ownership if resumeId provided
        if (request.getResumeId() != null) {
            validateResumeOwnership(user.getId(), request.getResumeId());
        }

        Optional<Application> existingOpt = applicationRepository.findByUserIdAndJobId(user.getId(), job.getId());
        Application app;
        String initialStatus = request.getStatus() != null && !request.getStatus().isBlank() ? request.getStatus() : "APPLIED";

        if (existingOpt.isPresent()) {
            app = existingOpt.get();
            String prevStatus = app.getStatus();
            app.setStatus(initialStatus);
            if ("APPLIED".equalsIgnoreCase(initialStatus) && app.getAppliedDate() == null) {
                app.setAppliedDate(Instant.now());
            }
            if (request.getResumeId() != null) app.setResumeId(request.getResumeId());
            if (request.getNotes() != null) app.setNotes(request.getNotes());
            if (request.getSource() != null) app.setSource(request.getSource());
            if (request.getJobUrl() != null) app.setJobUrl(request.getJobUrl());
            if (request.getRecruiterName() != null) app.setRecruiterName(request.getRecruiterName());
            if (request.getRecruiterEmail() != null) app.setRecruiterEmail(request.getRecruiterEmail());

            app = applicationRepository.save(app);
            saveStatusHistory(app.getId(), prevStatus, initialStatus, "Application updated to " + initialStatus);
        } else {
            app = Application.builder()
                    .userId(user.getId())
                    .jobId(job.getId())
                    .resumeId(request.getResumeId())
                    .status(initialStatus)
                    .appliedDate("APPLIED".equalsIgnoreCase(initialStatus) ? Instant.now() : null)
                    .notes(request.getNotes())
                    .source(request.getSource() != null ? request.getSource() : "CareerPilot Web")
                    .jobUrl(request.getJobUrl())
                    .recruiterName(request.getRecruiterName())
                    .recruiterEmail(request.getRecruiterEmail())
                    .build();

            app = applicationRepository.save(app);
            saveStatusHistory(app.getId(), null, initialStatus, "Application tracked with status " + initialStatus);
        }

        return mapToDTO(app, userEmail, job);
    }

    @Transactional
    public ApplicationDTO updateStatus(String userEmail, Long applicationId, StatusUpdateRequestDTO request) {
        User user = getUserByEmail(userEmail);
        Application app = getApplicationByIdAndUser(applicationId, user.getId());

        String previousStatus = app.getStatus();
        String newStatus = request.getNewStatus();

        if (newStatus == null || newStatus.isBlank()) {
            throw new IllegalArgumentException("New status cannot be empty.");
        }

        app.setStatus(newStatus);
        if ("APPLIED".equalsIgnoreCase(newStatus) && app.getAppliedDate() == null) {
            app.setAppliedDate(Instant.now());
        }

        app = applicationRepository.save(app);

        saveStatusHistory(app.getId(), previousStatus, newStatus, request.getNote() != null ? request.getNote() : "Status updated to " + newStatus);
        log.info("Application #{} status updated from {} to {} by user #{}", applicationId, previousStatus, newStatus, user.getId());

        Job job = jobRepository.findById(app.getJobId()).orElse(null);
        return mapToDTO(app, userEmail, job);
    }

    @Transactional
    public ApplicationDTO updateApplication(String userEmail, Long applicationId, ApplicationUpdateRequestDTO request) {
        User user = getUserByEmail(userEmail);
        Application app = getApplicationByIdAndUser(applicationId, user.getId());

        if (request.getResumeId() != null) {
            validateResumeOwnership(user.getId(), request.getResumeId());
            app.setResumeId(request.getResumeId());
        }

        if (request.getStatus() != null && !request.getStatus().equalsIgnoreCase(app.getStatus())) {
            String prevStatus = app.getStatus();
            app.setStatus(request.getStatus());
            saveStatusHistory(app.getId(), prevStatus, request.getStatus(), "Status updated during application edit");
        }

        if (request.getNotes() != null) app.setNotes(request.getNotes());
        if (request.getSource() != null) app.setSource(request.getSource());
        if (request.getJobUrl() != null) app.setJobUrl(request.getJobUrl());
        if (request.getRecruiterName() != null) app.setRecruiterName(request.getRecruiterName());
        if (request.getRecruiterEmail() != null) app.setRecruiterEmail(request.getRecruiterEmail());
        if (request.getCurrentStage() != null) app.setCurrentStage(request.getCurrentStage());

        app = applicationRepository.save(app);

        Job job = jobRepository.findById(app.getJobId()).orElse(null);
        return mapToDTO(app, userEmail, job);
    }

    @Transactional(readOnly = true)
    public PageResponse<ApplicationDTO> getUserApplications(
            String userEmail, String status, int page, int size, String search, String sortBy) {

        User user = getUserByEmail(userEmail);

        Sort sort = Sort.by(Sort.Direction.DESC, "updatedAt");
        if ("newest".equalsIgnoreCase(sortBy) || "created_at".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Direction.DESC, "createdAt");
        } else if ("oldest".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Direction.ASC, "createdAt");
        } else if ("applied_date".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Direction.DESC, "appliedDate");
        }

        Pageable pageable = PageRequest.of(page, size, sort);
        String statusFilter = status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status) ? status.toUpperCase() : null;

        Page<Application> appPage = applicationRepository.findFilteredApplications(user.getId(), statusFilter, pageable);

        List<ApplicationDTO> dtos = appPage.getContent().stream().map(app -> {
            Job j = jobRepository.findById(app.getJobId()).orElse(null);
            return mapToDTO(app, userEmail, j);
        }).collect(Collectors.toList());

        // Perform in-memory search filtering if search term provided
        if (search != null && !search.isBlank()) {
            String lowerSearch = search.toLowerCase();
            dtos = dtos.stream().filter(d ->
                    (d.getJobTitle() != null && d.getJobTitle().toLowerCase().contains(lowerSearch)) ||
                    (d.getCompanyName() != null && d.getCompanyName().toLowerCase().contains(lowerSearch)) ||
                    (d.getNotes() != null && d.getNotes().toLowerCase().contains(lowerSearch))
            ).collect(Collectors.toList());
        }

        return PageResponse.<ApplicationDTO>builder()
                .content(dtos)
                .page(appPage.getNumber())
                .size(appPage.getSize())
                .totalElements((long) dtos.size())
                .totalPages(appPage.getTotalPages())
                .last(appPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public ApplicationDTO getApplicationById(String userEmail, Long applicationId) {
        User user = getUserByEmail(userEmail);
        Application app = getApplicationByIdAndUser(applicationId, user.getId());
        Job job = jobRepository.findById(app.getJobId()).orElse(null);
        return mapToDTO(app, userEmail, job);
    }

    @Transactional
    public void deleteApplication(String userEmail, Long applicationId) {
        User user = getUserByEmail(userEmail);
        Application app = getApplicationByIdAndUser(applicationId, user.getId());

        // Delete status history first
        statusHistoryRepository.deleteByApplicationId(app.getId());
        // Delete application record
        applicationRepository.delete(app);
        log.info("Deleted application #{} for user #{}", applicationId, user.getId());
    }

    @Transactional
    public void unsaveJob(String userEmail, Long jobId) {
        User user = getUserByEmail(userEmail);
        Optional<Application> appOpt = applicationRepository.findByUserIdAndJobId(user.getId(), jobId);
        if (appOpt.isPresent() && "SAVED".equalsIgnoreCase(appOpt.get().getStatus())) {
            statusHistoryRepository.deleteByApplicationId(appOpt.get().getId());
            applicationRepository.delete(appOpt.get());
            log.info("Unsaved job #{} for user #{}", jobId, user.getId());
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> checkJobState(String userEmail, Long jobId) {
        User user = getUserByEmail(userEmail);
        Optional<Application> appOpt = applicationRepository.findByUserIdAndJobId(user.getId(), jobId);

        Map<String, Object> res = new HashMap<>();
        if (appOpt.isPresent()) {
            res.put("tracked", true);
            res.put("applicationId", appOpt.get().getId());
            res.put("status", appOpt.get().getStatus());
            res.put("isSaved", "SAVED".equalsIgnoreCase(appOpt.get().getStatus()));
            res.put("isApplied", !"SAVED".equalsIgnoreCase(appOpt.get().getStatus()));
        } else {
            res.put("tracked", false);
            res.put("isSaved", false);
            res.put("isApplied", false);
        }
        return res;
    }

    @Transactional(readOnly = true)
    public ApplicationMetricsDTO getApplicationMetrics(String userEmail) {
        User user = getUserByEmail(userEmail);

        List<Application> apps = applicationRepository.findByUserIdOrderByUpdatedAtDesc(user.getId());

        long total = apps.size();
        long saved = apps.stream().filter(a -> "SAVED".equalsIgnoreCase(a.getStatus())).count();
        long applied = apps.stream().filter(a -> "APPLIED".equalsIgnoreCase(a.getStatus())).count();
        long screening = apps.stream().filter(a -> "SCREENING".equalsIgnoreCase(a.getStatus())).count();
        long interview = apps.stream().filter(a -> "INTERVIEW".equalsIgnoreCase(a.getStatus()) || "TECHNICAL_INTERVIEW".equalsIgnoreCase(a.getStatus()) || "HR_INTERVIEW".equalsIgnoreCase(a.getStatus())).count();
        long offer = apps.stream().filter(a -> "OFFER".equalsIgnoreCase(a.getStatus())).count();
        long accepted = apps.stream().filter(a -> "ACCEPTED".equalsIgnoreCase(a.getStatus())).count();
        long rejected = apps.stream().filter(a -> "REJECTED".equalsIgnoreCase(a.getStatus())).count();

        long activeAppliedTotal = total - saved;
        double interviewRate = activeAppliedTotal > 0 ? ((double) interview / activeAppliedTotal) * 100.0 : 0.0;
        double offerRate = activeAppliedTotal > 0 ? ((double) offer / activeAppliedTotal) * 100.0 : 0.0;

        // Calculate average match score for tracked jobs
        int sumScore = 0;
        int scoreCount = 0;
        for (Application a : apps) {
            try {
                MatchResponseDTO matchRes = hybridMatchingService.calculateJobMatch(userEmail, a.getJobId());
                if (matchRes != null) {
                    sumScore += matchRes.getOverallScore();
                    scoreCount++;
                }
            } catch (Exception e) {
                // Ignore match calculation exceptions for metrics
            }
        }
        int avgMatchScore = scoreCount > 0 ? sumScore / scoreCount : 0;

        return ApplicationMetricsDTO.builder()
                .totalApplications(total)
                .savedCount(saved)
                .appliedCount(applied)
                .screeningCount(screening)
                .interviewCount(interview)
                .offerCount(offer)
                .rejectedCount(rejected)
                .acceptedCount(accepted)
                .interviewConversionRate(Math.round(interviewRate * 10.0) / 10.0)
                .offerConversionRate(Math.round(offerRate * 10.0) / 10.0)
                .averageMatchScore(avgMatchScore)
                .build();
    }

    // Helper Methods
    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found: " + email));
    }

    private Job getJobById(Long jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job posting not found: id=" + jobId));
    }

    private Application getApplicationByIdAndUser(Long applicationId, Long userId) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: id=" + applicationId));
        if (!app.getUserId().equals(userId)) {
            throw new BadRequestException("Access denied: Application does not belong to authenticated user.");
        }
        return app;
    }

    private void validateResumeOwnership(Long userId, Long resumeId) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found: id=" + resumeId));
        if (!resume.getUserId().equals(userId)) {
            throw new BadRequestException("Access denied: Resume does not belong to authenticated user.");
        }
    }

    private void saveStatusHistory(Long applicationId, String prevStatus, String newStatus, String note) {
        ApplicationStatusHistory history = ApplicationStatusHistory.builder()
                .applicationId(applicationId)
                .previousStatus(prevStatus)
                .newStatus(newStatus)
                .changedAt(Instant.now())
                .note(note)
                .build();
        statusHistoryRepository.save(history);
    }

    private ApplicationDTO mapToDTO(Application app, String userEmail, Job job) {
        String jobTitle = job != null ? job.getTitle() : "Engineering Position";
        String companyName = job != null ? job.getCompanyName() : "Company";
        String location = job != null ? job.getLocation() : "Remote";
        String workMode = job != null ? job.getWorkMode() : "HYBRID";

        Integer officialMatchScore = null;
        if (job != null) {
            try {
                MatchResponseDTO matchRes = hybridMatchingService.calculateJobMatch(userEmail, job.getId());
                if (matchRes != null) {
                    officialMatchScore = matchRes.getOverallScore();
                }
            } catch (Exception e) {
                log.warn("Match score calculation skipped for application #{}: {}", app.getId(), e.getMessage());
            }
        }

        String resumeFileName = null;
        if (app.getResumeId() != null) {
            Optional<Resume> resumeOpt = resumeRepository.findById(app.getResumeId());
            if (resumeOpt.isPresent()) {
                resumeFileName = resumeOpt.get().getFileName();
            }
        }

        List<ApplicationStatusHistory> historyList = statusHistoryRepository.findByApplicationIdOrderByChangedAtDesc(app.getId());
        List<ApplicationDTO.StatusHistoryDTO> historyDTOs = historyList.stream().map(h -> ApplicationDTO.StatusHistoryDTO.builder()
                .id(h.getId())
                .applicationId(h.getApplicationId())
                .previousStatus(h.getPreviousStatus())
                .newStatus(h.getNewStatus())
                .changedAt(h.getChangedAt())
                .note(h.getNote())
                .build()).collect(Collectors.toList());

        return ApplicationDTO.builder()
                .id(app.getId())
                .userId(app.getUserId())
                .jobId(app.getJobId())
                .jobTitle(jobTitle)
                .companyName(companyName)
                .location(location)
                .workMode(workMode)
                .officialMatchScore(officialMatchScore)
                .resumeId(app.getResumeId())
                .resumeFileName(resumeFileName)
                .status(app.getStatus())
                .appliedDate(app.getAppliedDate())
                .notes(app.getNotes())
                .source(app.getSource())
                .jobUrl(app.getJobUrl())
                .recruiterName(app.getRecruiterName())
                .recruiterEmail(app.getRecruiterEmail())
                .currentStage(app.getCurrentStage())
                .createdAt(app.getCreatedAt())
                .updatedAt(app.getUpdatedAt())
                .history(historyDTOs)
                .build();
    }
}
