package com.careerpilot.repository;

import com.careerpilot.entity.Application;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    List<Application> findByUserIdOrderByUpdatedAtDesc(Long userId);

    List<Application> findByUserIdAndStatus(Long userId, String status);

    Optional<Application> findByUserIdAndJobId(Long userId, Long jobId);

    Boolean existsByUserIdAndJobId(Long userId, Long jobId);

    Long countByUserId(Long userId);

    Long countByUserIdAndStatus(Long userId, String status);

    @Query("SELECT a FROM Application a WHERE a.userId = :userId " +
           "AND (:status IS NULL OR a.status = :status)")
    Page<Application> findFilteredApplications(
            @Param("userId") Long userId,
            @Param("status") String status,
            Pageable pageable
    );
}
