package com.careerpilot.repository;

import com.careerpilot.entity.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

    List<Job> findByIsActiveTrue();

    Optional<Job> findByExternalJobIdAndSourceName(String externalJobId, String sourceName);

    Optional<Job> findByCompanyIdAndTitleIgnoreCaseAndLocationIgnoreCase(Long companyId, String title, String location);

    @Query("SELECT j FROM Job j WHERE j.isActive = true AND " +
           "(:search IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(j.descriptionRaw) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(j.companyName) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:location IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
           "(:workMode IS NULL OR LOWER(j.workMode) LIKE LOWER(CONCAT('%', :workMode, '%')) OR LOWER(REPLACE(j.workMode, '_', '')) LIKE LOWER(CONCAT('%', REPLACE(:workMode, '_', ''), '%'))) AND " +
           "(:employmentType IS NULL OR LOWER(j.employmentType) LIKE LOWER(CONCAT('%', :employmentType, '%')) OR LOWER(REPLACE(j.employmentType, '_', '')) LIKE LOWER(CONCAT('%', REPLACE(:employmentType, '_', ''), '%'))) AND " +
           "(:experienceLevel IS NULL OR LOWER(j.experienceLevel) LIKE LOWER(CONCAT('%', :experienceLevel, '%'))) AND " +
           "(:company IS NULL OR LOWER(j.companyName) LIKE LOWER(CONCAT('%', :company, '%'))) AND " +
           "(:source IS NULL OR LOWER(j.sourceName) LIKE LOWER(CONCAT('%', :source, '%')))")
    Page<Job> searchJobs(
            @Param("search") String search,
            @Param("location") String location,
            @Param("workMode") String workMode,
            @Param("employmentType") String employmentType,
            @Param("experienceLevel") String experienceLevel,
            @Param("company") String company,
            @Param("source") String source,
            Pageable pageable
    );
}
