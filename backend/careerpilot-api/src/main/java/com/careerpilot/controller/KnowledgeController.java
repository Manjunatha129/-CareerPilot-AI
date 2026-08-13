package com.careerpilot.controller;

import com.careerpilot.dto.ApiResponse;
import com.careerpilot.dto.RagResponseDTO;
import com.careerpilot.entity.KnowledgeDocument;
import com.careerpilot.repository.KnowledgeDocumentRepository;
import com.careerpilot.service.DocumentIngestionService;
import com.careerpilot.service.RagService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/knowledge")
@RequiredArgsConstructor
public class KnowledgeController {

    private final DocumentIngestionService ingestionService;
    private final RagService ragService;
    private final KnowledgeDocumentRepository knowledgeDocumentRepository;

    @PostMapping("/ingest/seed")
    public ResponseEntity<ApiResponse<List<KnowledgeDocument>>> ingestSeedDocuments() {
        List<KnowledgeDocument> ingestedDocs = ingestionService.ingestKnowledgeBaseSeedDocuments();
        return ResponseEntity.ok(ApiResponse.success(
                ingestedDocs,
                "Successfully ingested " + ingestedDocs.size() + " knowledge base documents."
        ));
    }

    @PostMapping("/query")
    public ResponseEntity<ApiResponse<RagResponseDTO>> queryKnowledgeBase(@RequestBody RagQueryRequest request) {
        RagResponseDTO response = ragService.queryKnowledgeBase(request.getQuery(), request.getTopK(), request.getHistory());
        return ResponseEntity.ok(ApiResponse.success(response, "RAG query executed successfully"));
    }

    @GetMapping("/documents")
    public ResponseEntity<ApiResponse<List<KnowledgeDocument>>> getIngestedDocuments() {
        List<KnowledgeDocument> docs = knowledgeDocumentRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success(docs, "Fetched " + docs.size() + " knowledge documents"));
    }

    @Data
    public static class RagQueryRequest {
        private String query;
        private Integer topK = 4;
        private List<Map<String, String>> history;
    }
}
