package com.careerpilot.service;

import com.careerpilot.entity.DocumentChunk;
import com.careerpilot.entity.KnowledgeDocument;
import com.careerpilot.repository.DocumentChunkRepository;
import com.careerpilot.repository.KnowledgeDocumentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentIngestionService {

    private final KnowledgeDocumentRepository knowledgeDocumentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final AiServiceClient aiServiceClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public List<KnowledgeDocument> ingestKnowledgeBaseSeedDocuments() {
        log.info("Starting ingestion of knowledge base seed documents...");
        Path baseDirPath = resolveKnowledgeBaseDirectory();
        File baseDir = baseDirPath.toFile();

        if (!baseDir.exists() || !baseDir.isDirectory()) {
            log.warn("Knowledge base directory not found at: {}", baseDirPath.toAbsolutePath());
            return Collections.emptyList();
        }

        List<KnowledgeDocument> ingestedDocs = new ArrayList<>();
        try (Stream<Path> paths = Files.walk(baseDirPath)) {
            List<File> mdFiles = paths.filter(Files::isRegularFile)
                    .filter(p -> p.toString().endsWith(".md"))
                    .map(Path::toFile)
                    .collect(Collectors.toList());

            for (File mdFile : mdFiles) {
                try {
                    KnowledgeDocument doc = ingestSingleFile(mdFile);
                    if (doc != null) {
                        ingestedDocs.add(doc);
                    }
                } catch (Exception e) {
                    log.error("Failed to ingest file {}: {}", mdFile.getName(), e.getMessage(), e);
                }
            }
        } catch (Exception e) {
            log.error("Error reading knowledge base directory: {}", e.getMessage(), e);
        }

        log.info("Finished knowledge base ingestion. Total documents processed: {}", ingestedDocs.size());
        return ingestedDocs;
    }

    @Transactional
    public KnowledgeDocument ingestSingleFile(File file) throws Exception {
        String content = Files.readString(file.toPath());
        if (content.trim().isEmpty()) return null;

        String relativePath = file.getPath().replace("\\", "/");
        String filename = file.getName();
        String title = extractTitle(content, filename);
        String sourceType = determineSourceType(relativePath);

        // Delete existing document & chunks for idempotency
        Optional<KnowledgeDocument> existingOpt = knowledgeDocumentRepository.findByFilePath(relativePath);
        KnowledgeDocument doc;
        if (existingOpt.isPresent()) {
            doc = existingOpt.get();
            documentChunkRepository.deleteByDocumentName(doc.getTitle());
        } else {
            doc = KnowledgeDocument.builder()
                    .title(title)
                    .sourceType(sourceType)
                    .filePath(relativePath)
                    .status("PROCESSING")
                    .chunkCount(0)
                    .build();
            doc = knowledgeDocumentRepository.save(doc);
        }

        // Recursive Section-Aware Chunking (500 chars, 50 overlap)
        List<String> chunks = splitIntoChunks(content, 500, 50);
        if (chunks.isEmpty()) {
            doc.setStatus("FAILED");
            return knowledgeDocumentRepository.save(doc);
        }

        // Persist Chunks
        List<DocumentChunk> entityChunks = new ArrayList<>();
        for (int i = 0; i < chunks.size(); i++) {
            DocumentChunk chunk = DocumentChunk.builder()
                    .documentId(doc.getId())
                    .documentName(title)
                    .sourceType(sourceType)
                    .chunkIndex(i)
                    .content(chunks.get(i))
                    .metadata("{\"filePath\":\"" + relativePath + "\", \"chunkIndex\":" + i + "}")
                    .build();
            entityChunks.add(chunk);
        }

        documentChunkRepository.saveAll(entityChunks);

        doc.setStatus("COMPLETED");
        doc.setChunkCount(entityChunks.size());
        return knowledgeDocumentRepository.save(doc);
    }

    private String extractTitle(String content, String filename) {
        String[] lines = content.split("\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.startsWith("# ")) {
                return trimmed.substring(2).trim();
            }
        }
        return filename.replace(".md", "").replace("-", " ");
    }

    private String determineSourceType(String filePath) {
        String lower = filePath.toLowerCase();
        if (lower.contains("interview")) return "INTERVIEW_GUIDE";
        if (lower.contains("resume")) return "RESUME_GUIDE";
        if (lower.contains("career")) return "CAREER";
        return "SOFTWARE_ENGINEERING";
    }

    public List<String> splitIntoChunks(String text, int maxChunkSize, int overlap) {
        if (text == null || text.trim().isEmpty()) return Collections.emptyList();

        List<String> chunks = new ArrayList<>();
        // Split by sections first (headers starting with ## or #)
        String[] sections = text.split("(?=\n##? )");

        for (String section : sections) {
            String cleanSec = section.trim();
            if (cleanSec.isEmpty()) continue;

            if (cleanSec.length() <= maxChunkSize) {
                chunks.add(cleanSec);
            } else {
                // Further split large section into sub-chunks with overlap
                int start = 0;
                while (start < cleanSec.length()) {
                    int end = Math.min(start + maxChunkSize, cleanSec.length());
                    if (end < cleanSec.length()) {
                        int lastSpace = cleanSec.lastIndexOf(' ', end);
                        if (lastSpace > start + 200) {
                            end = lastSpace;
                        }
                    }
                    String chunkText = cleanSec.substring(start, end).trim();
                    if (!chunkText.isEmpty()) {
                        chunks.add(chunkText);
                    }
                    start = end > start + overlap ? end - overlap : end;
                }
            }
        }

        return chunks;
    }

    private Path resolveKnowledgeBaseDirectory() {
        Path p1 = Paths.get("sample-data", "knowledge-base");
        if (Files.exists(p1) && Files.isDirectory(p1)) return p1;

        Path p2 = Paths.get("..", "sample-data", "knowledge-base");
        if (Files.exists(p2) && Files.isDirectory(p2)) return p2;

        Path p3 = Paths.get("..", "..", "sample-data", "knowledge-base");
        if (Files.exists(p3) && Files.isDirectory(p3)) return p3;

        Path current = Paths.get("").toAbsolutePath();
        while (current != null) {
            Path candidate = current.resolve("sample-data").resolve("knowledge-base");
            if (Files.exists(candidate) && Files.isDirectory(candidate)) {
                return candidate;
            }
            current = current.getParent();
        }
        return p1;
    }
}
