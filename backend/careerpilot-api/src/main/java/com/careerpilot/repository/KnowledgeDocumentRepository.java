package com.careerpilot.repository;

import com.careerpilot.entity.KnowledgeDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KnowledgeDocumentRepository extends JpaRepository<KnowledgeDocument, Long> {
    Optional<KnowledgeDocument> findByTitle(String title);
    Optional<KnowledgeDocument> findByFilePath(String filePath);
}
