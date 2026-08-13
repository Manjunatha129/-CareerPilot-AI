package com.careerpilot.repository;

import com.careerpilot.entity.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, Long> {

    List<DocumentChunk> findBySourceType(String sourceType);

    List<DocumentChunk> findByDocumentNameOrderByChunkIndexAsc(String documentName);

    void deleteByDocumentName(String documentName);

    @Query("SELECT d FROM DocumentChunk d WHERE LOWER(d.content) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(d.documentName) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<DocumentChunk> searchByKeyword(@Param("keyword") String keyword);
}
