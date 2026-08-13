package com.careerpilot.repository;

import com.careerpilot.entity.Job;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
public class JobRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private JobRepository jobRepository;

    @Test
    @DisplayName("Should search jobs by keyword and location filter")
    public void shouldSearchJobsWithFilters() {
        Job javaJob = Job.builder()
                .title("Senior Java Developer")
                .location("San Francisco, CA")
                .workMode("REMOTE")
                .experienceLevel("SENIOR")
                .descriptionRaw("Looking for a Java developer with Spring Boot expertise.")
                .isActive(true)
                .build();

        Job pythonJob = Job.builder()
                .title("Python Engineer")
                .location("New York, NY")
                .workMode("ON_SITE")
                .experienceLevel("MID")
                .descriptionRaw("FastAPI backend developer role.")
                .isActive(true)
                .build();

        entityManager.persist(javaJob);
        entityManager.persist(pythonJob);
        entityManager.flush();

        Page<Job> result = jobRepository.searchJobs("Java", null, "REMOTE", null, null, null, null, PageRequest.of(0, 10));

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getTitle()).contains("Java");
    }
}
