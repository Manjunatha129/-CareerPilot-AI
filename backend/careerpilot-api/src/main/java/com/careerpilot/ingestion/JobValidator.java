package com.careerpilot.ingestion;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
public class JobValidator {

    public static class ValidationResult {
        private final boolean valid;
        private final List<String> errors;

        public ValidationResult(boolean valid, List<String> errors) {
            this.valid = valid;
            this.errors = errors;
        }

        public boolean isValid() {
            return valid;
        }

        public List<String> getErrors() {
            return errors;
        }
    }

    public ValidationResult validate(RawJobData job) {
        List<String> errors = new ArrayList<>();

        if (job == null) {
            errors.add("Raw job record is null");
            return new ValidationResult(false, errors);
        }

        if (job.getTitle() == null || job.getTitle().trim().isEmpty()) {
            errors.add("Job title is required and cannot be empty");
        }

        if (job.getCompany() == null || job.getCompany().trim().isEmpty()) {
            errors.add("Company name is required and cannot be empty");
        }

        if (job.getDescription() == null || job.getDescription().trim().length() < 15) {
            errors.add("Job description is missing or too short (minimum 15 characters)");
        }

        if (job.getSourceName() == null || job.getSourceName().trim().isEmpty()) {
            errors.add("Source name is required");
        }

        boolean valid = errors.isEmpty();
        if (!valid) {
            log.warn("Job validation failed for job '{}' at '{}': {}", job.getTitle(), job.getCompany(), errors);
        }

        return new ValidationResult(valid, errors);
    }
}
