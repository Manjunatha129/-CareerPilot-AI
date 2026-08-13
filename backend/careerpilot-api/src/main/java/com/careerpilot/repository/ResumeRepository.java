package com.careerpilot.repository;

import com.careerpilot.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {
    List<Resume> findByUserId(Long userId);
    List<Resume> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Resume> findByIdAndUserId(Long id, Long userId);
    Optional<Resume> findByUserIdAndIsPrimaryTrue(Long userId);
}
