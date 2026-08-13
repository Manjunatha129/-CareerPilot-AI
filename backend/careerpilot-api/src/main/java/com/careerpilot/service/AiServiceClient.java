package com.careerpilot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class AiServiceClient {

    private final RestTemplate restTemplate;
    private final String aiServiceUrl;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AiServiceClient(
            @Value("${careerpilot.ai.service-url:http://localhost:8000}") String aiServiceUrl) {
        this.restTemplate = new RestTemplate();
        this.aiServiceUrl = aiServiceUrl;
    }

    public String analyzeResumePdf(byte[] fileBytes, String originalFilename) {
        String endpoint = aiServiceUrl + "/ai/resume/analyze";
        log.info("Sending resume ({}) to AI service at {}", originalFilename, endpoint);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        ByteArrayResource contentsAsResource = new ByteArrayResource(fileBytes) {
            @Override
            public String getFilename() {
                return originalFilename != null ? originalFilename : "resume.pdf";
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", contentsAsResource);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(endpoint, requestEntity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("Successfully received resume analysis response from AI service.");
                return response.getBody();
            } else {
                log.error("AI service returned non-2xx status: {}", response.getStatusCode());
                throw new RuntimeException("AI Service returned status code: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Failed to communicate with AI service at {}: {}", endpoint, e.getMessage());
            throw new RuntimeException("AI service communication error: " + e.getMessage(), e);
        }
    }

    /**
     * Calls Python AI Service to calculate gemini-embedding-2 cosine similarity.
     */
    public Double getSemanticSimilarity(String text1, String text2) {
        String endpoint = aiServiceUrl + "/ai/matching/semantic-similarity";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> body = Map.of(
                "text1", text1 != null ? text1 : "",
                "text2", text2 != null ? text2 : ""
        );

        HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(endpoint, requestEntity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode json = objectMapper.readTree(response.getBody());
                if (json.has("similarityScore")) {
                    return json.get("similarityScore").asDouble();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to get semantic similarity from AI service: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Calls Python AI Service to generate Gemini natural-language match explanation.
     */
    public String getMatchExplanation(Map<String, Object> matchEvidence) {
        String endpoint = aiServiceUrl + "/ai/matching/explain";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(matchEvidence, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(endpoint, requestEntity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.warn("Failed to get match explanation from AI service: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Calls Python AI Service to generate 768-dim embeddings for a batch of texts.
     */
    public String getBatchEmbeddings(java.util.List<String> texts) {
        String endpoint = aiServiceUrl + "/ai/rag/embed";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of("texts", texts);
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(endpoint, requestEntity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.warn("Failed to generate batch embeddings from AI service: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Calls Python AI Service to generate grounded RAG answer from context chunks.
     */
    public String generateGroundedRagAnswer(Map<String, Object> ragPayload) {
        String endpoint = aiServiceUrl + "/ai/rag/generate-answer";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(ragPayload, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(endpoint, requestEntity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.warn("Failed to generate grounded RAG answer from AI service: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Calls Python AI Service to execute LangGraph multi-agent career intelligence workflow.
     */
    public String runCareerIntelligenceWorkflow(Map<String, Object> payload) {
        String endpoint = aiServiceUrl + "/ai/agents/career-intelligence";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(endpoint, requestEntity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.warn("Failed to run LangGraph multi-agent workflow from AI service: {}", e.getMessage());
        }
        return null;
    }
}
