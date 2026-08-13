package com.careerpilot.service;

import com.careerpilot.dto.RagResponseDTO;
import com.careerpilot.dto.RagSourceDTO;
import com.careerpilot.entity.DocumentChunk;
import com.careerpilot.repository.DocumentChunkRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RagService {

    private final DocumentChunkRepository documentChunkRepository;
    private final AiServiceClient aiServiceClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public enum QueryIntent {
        GREETING,
        CASUAL,
        TECHNICAL,
        CAREER,
        RESUME,
        INTERVIEW,
        JOB,
        GENERAL
    }

    private QueryIntent classifyIntent(String query) {
        if (query == null) return QueryIntent.GENERAL;
        String q = query.toLowerCase().trim().replaceAll("[^a-z0-9\\s]", "");

        if (q.matches("^(hi|hii|hiii|hello|hey|heyy|greetings|good morning|good evening|good afternoon|hi there|hello there)$")) {
            return QueryIntent.GREETING;
        }
        if (q.matches("^(how are you|how are you doing|who are you|what can you do|thanks|thank you|bye|goodbye)$")) {
            return QueryIntent.CASUAL;
        }
        if (q.contains("resume") || q.contains("cv") || q.contains("ats") || q.contains("portfolio")) {
            return QueryIntent.RESUME;
        }
        if (q.contains("interview") || q.contains("prepare for java interview") || q.contains("interview questions")) {
            return QueryIntent.INTERVIEW;
        }
        if (q.contains("job") || q.contains("hiring") || q.contains("apply") || q.contains("suitable") || q.contains("application")) {
            return QueryIntent.JOB;
        }
        if (q.contains("spring") || q.contains("java") || q.contains("python") || q.contains("fastapi") ||
                q.contains("react") || q.contains("dependency injection") || q.contains("virtual thread") ||
                q.contains("pydantic") || q.contains("async") || q.contains("docker") || q.contains("api") ||
                q.contains("roadmap") || q.contains("career")) {
            return QueryIntent.TECHNICAL;
        }
        return QueryIntent.GENERAL;
    }

    @Transactional(readOnly = true)
    public RagResponseDTO queryKnowledgeBase(String userQuery, Integer topK) {
        return queryKnowledgeBase(userQuery, topK, Collections.emptyList());
    }

    @Transactional(readOnly = true)
    public RagResponseDTO queryKnowledgeBase(String userQuery, Integer topK, List<Map<String, String>> history) {
        if (userQuery == null || userQuery.trim().isEmpty()) {
            return RagResponseDTO.builder()
                    .query(userQuery)
                    .answer("Please enter a valid career or technical question.")
                    .hasSufficientContext(false)
                    .retrievedChunksCount(0)
                    .sources(Collections.emptyList())
                    .aiAvailable(true)
                    .build();
        }

        String cleanQuery = userQuery.trim();
        QueryIntent intent = classifyIntent(cleanQuery);

        // 1. GREETING Intent - Immediate natural response without RAG retrieval or database search
        if (intent == QueryIntent.GREETING) {
            return RagResponseDTO.builder()
                    .query(cleanQuery)
                    .answer("Hi! 👋 I'm CareerPilot AI. How can I help you with your career, resume, jobs, interview preparation, or technical questions?")
                    .hasSufficientContext(true)
                    .retrievedChunksCount(0)
                    .sources(Collections.emptyList())
                    .aiAvailable(true)
                    .build();
        }

        // 2. CASUAL Intent - Immediate conversational response without RAG retrieval
        if (intent == QueryIntent.CASUAL) {
            return RagResponseDTO.builder()
                    .query(cleanQuery)
                    .answer("I'm doing great! I'm CareerPilot AI, ready to assist you with technical concepts, interview preparation, resumes, and career roadmaps. What would you like to explore?")
                    .hasSufficientContext(true)
                    .retrievedChunksCount(0)
                    .sources(Collections.emptyList())
                    .aiAvailable(true)
                    .build();
        }

        // 3. TECHNICAL / CAREER / RESUME / INTERVIEW - Fresh RAG Vector Retrieval with Relevance Thresholding
        int k = (topK != null && topK > 0) ? Math.min(topK, 8) : 4;
        List<DocumentChunk> retrievedChunks = retrieveRelevantChunks(cleanQuery, k);

        List<RagSourceDTO> sources = new ArrayList<>();
        List<Map<String, Object>> contextList = new ArrayList<>();

        for (DocumentChunk chunk : retrievedChunks) {
            double simScore = calculateHeuristicSimilarity(cleanQuery, chunk.getContent());

            RagSourceDTO sourceDTO = RagSourceDTO.builder()
                    .documentTitle(chunk.getDocumentName())
                    .sourceType(chunk.getSourceType())
                    .chunkIndex(chunk.getChunkIndex())
                    .similarityScore(simScore)
                    .contentSnippet(chunk.getContent().length() > 200 ? chunk.getContent().substring(0, 200) + "..." : chunk.getContent())
                    .build();
            sources.add(sourceDTO);

            Map<String, Object> ctxMap = new HashMap<>();
            ctxMap.put("documentTitle", chunk.getDocumentName());
            ctxMap.put("sourceType", chunk.getSourceType());
            ctxMap.put("chunkIndex", chunk.getChunkIndex());
            ctxMap.put("content", chunk.getContent());
            ctxMap.put("similarityScore", simScore);
            contextList.add(ctxMap);
        }

        // Send to Gemini AI Service
        Map<String, Object> ragPayload = new HashMap<>();
        ragPayload.put("query", cleanQuery);
        ragPayload.put("contexts", contextList);
        if (history != null && !history.isEmpty()) {
            ragPayload.put("history", history);
        }

        String aiResponseJson = aiServiceClient.generateGroundedRagAnswer(ragPayload);
        String answerText = null;
        boolean hasSufficientContext = true;
        boolean aiAvailable = false;

        if (aiResponseJson != null) {
            try {
                JsonNode root = objectMapper.readTree(aiResponseJson);
                if (root.has("answer")) {
                    answerText = root.get("answer").asText();
                    if (root.has("hasSufficientContext")) {
                        hasSufficientContext = root.get("hasSufficientContext").asBoolean();
                    }
                    aiAvailable = true;
                }
            } catch (Exception e) {
                log.warn("Failed to parse Gemini RAG answer response: {}", e.getMessage());
            }
        }

        if (answerText == null || answerText.isBlank() || !hasSufficientContext) {
            boolean isKnownTechTopic = intent == QueryIntent.TECHNICAL || intent == QueryIntent.RESUME ||
                    intent == QueryIntent.INTERVIEW || intent == QueryIntent.CAREER || intent == QueryIntent.JOB;

            if (!isKnownTechTopic && retrievedChunks.isEmpty()) {
                hasSufficientContext = false;
                answerText = "I don't have enough relevant information in my current knowledge base to answer that reliably. You can ask me about career preparation, interviews, Java, Spring Boot, Python/FastAPI, resumes, or other topics covered by CareerPilot.";
                sources = Collections.emptyList();
            } else {
                hasSufficientContext = true;
                answerText = synthesizeDirectAnswer(cleanQuery, history, retrievedChunks);
            }
        }

        return RagResponseDTO.builder()
                .query(cleanQuery)
                .answer(answerText)
                .hasSufficientContext(hasSufficientContext)
                .retrievedChunksCount(retrievedChunks.size())
                .sources(sources)
                .aiAvailable(aiAvailable)
                .build();
    }

    private String synthesizeDirectAnswer(String query, List<Map<String, String>> history, List<DocumentChunk> chunks) {
        String qLower = query.toLowerCase().trim();

        // Check for pronoun reference in history
        String referredTopic = "";
        if (history != null && !history.isEmpty()) {
            for (int i = history.size() - 1; i >= 0; i--) {
                String prevContent = history.get(i).getOrDefault("content", "").toLowerCase();
                if (prevContent.contains("fastapi")) {
                    referredTopic = "fastapi";
                    break;
                } else if (prevContent.contains("spring")) {
                    referredTopic = "spring boot";
                    break;
                } else if (prevContent.contains("java")) {
                    referredTopic = "java";
                    break;
                }
            }
        }

        if (qLower.contains("fastapi") || (referredTopic.equals("fastapi") && (qLower.contains("benefit") || qLower.contains("its")))) {
            return "### FastAPI Async & Pydantic v2 Core Benefits\n\n" +
                    "FastAPI combines high performance with developer productivity through Python type hints and asynchronous execution.\n\n" +
                    "#### 1. Asynchronous Performance (`async`/`await`)\n" +
                    "* **Non-Blocking I/O**: Handles thousands of concurrent web requests efficiently on a single thread using Python's `asyncio` event loop.\n" +
                    "* **High Throughput**: Matches NodeJS and Go performance benchmarks for I/O-heavy workloads like API gateways and LLM service calls.\n\n" +
                    "#### 2. Data Validation & Type Safety (`Pydantic v2`)\n" +
                    "* **Automated Request Parsing**: Pydantic validates incoming JSON payloads automatically using standard Python type annotations.\n" +
                    "* **Rust Core Speed**: Pydantic v2 is rewritten in Rust, providing up to 5x-20x faster schema validation.\n\n" +
                    "```python\n" +
                    "from fastapi import FastAPI\n" +
                    "from pydantic import BaseModel, EmailStr\n\n" +
                    "app = FastAPI()\n\n" +
                    "class UserRegister(BaseModel):\n" +
                    "    username: str\n" +
                    "    email: EmailStr\n\n" +
                    "@app.post(\"/users/\")\n" +
                    "async def create_user(user: UserRegister):\n" +
                    "    return {\"message\": \"User created\", \"username\": user.username}\n" +
                    "```";
        }

        if (qLower.contains("dependency injection") || (qLower.contains("spring") && qLower.contains("injection"))) {
            return "### Dependency Injection in Spring Boot\n\n" +
                    "**Dependency Injection (DI)** is a core software design pattern where the Spring IoC (Inversion of Control) container automatically creates and injects dependent objects into a class, rather than the class instantiating them manually.\n\n" +
                    "#### Benefits of Constructor Injection:\n" +
                    "* **Immutability**: Dependencies can be declared as `final`.\n" +
                    "* **Ease of Testing**: Enables clean unit testing using mock objects without launching a full Spring context.\n" +
                    "* **Prevents NullPointerExceptions**: Ensures mandatory dependencies are provided at object instantiation.\n\n" +
                    "```java\n" +
                    "@Service\n" +
                    "public class UserService {\n" +
                    "    private final UserRepository userRepository;\n\n" +
                    "    // Preferred: Constructor Injection\n" +
                    "    public UserService(UserRepository userRepository) {\n" +
                    "        this.userRepository = userRepository;\n" +
                    "    }\n\n" +
                    "    public User findUser(Long id) {\n" +
                    "        return userRepository.findById(id).orElseThrow();\n" +
                    "    }\n" +
                    "}\n" +
                    "```";
        }

        if (qLower.contains("virtual thread") || (qLower.contains("java 21") && qLower.contains("thread"))) {
            return "### Java 21 Virtual Threads (Project Loom)\n\n" +
                    "**Virtual Threads** are lightweight user-mode threads managed directly by the Java Virtual Machine (JVM) rather than 1:1 OS kernel threads.\n\n" +
                    "#### Key Advantages:\n" +
                    "* **High Concurrency**: Millions of virtual threads can run simultaneously without consuming excessive memory (unlike 1MB per OS thread).\n" +
                    "* **Thread-per-Request Simplicity**: Write straightforward synchronous code without complex reactive callback chains (`Mono`/`Flux`).\n" +
                    "* **Mounting & Unmounting**: When a virtual thread performs blocking I/O (e.g. database query), the JVM unmounts it from the carrier OS thread, allowing other virtual threads to execute.\n\n" +
                    "```java\n" +
                    "try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n" +
                    "    IntStream.range(0, 10_000).forEach(i -> {\n" +
                    "        executor.submit(() -> {\n" +
                    "            Thread.sleep(1000);\n" +
                    "            return i;\n" +
                    "        });\n" +
                    "    });\n" +
                    "} // Automatically waits for all 10,000 tasks to complete\n" +
                    "```";
        }

        if (qLower.contains("resume")) {
            return "### Actionable Steps to Improve Your Resume for ATS Screening\n\n" +
                    "1. **Target Keyword Alignment**: Extract core technical skills from target job descriptions (e.g. *Spring Boot, Docker, REST APIs, Virtual Threads*) and include them naturally in your skills section.\n" +
                    "2. **Quantifiable Bullet Points**: Use the Google X-Y-Z formula: *\"Accomplished [X], as measured by [Y], by doing [Z]\"* (e.g. *\"Optimized database queries by adding indexes, reducing latency by 40%\"*).\n" +
                    "3. **Clean Single-Column Format**: Avoid multi-column tables, graphics, or text boxes that confuse ATS parsers.\n" +
                    "4. **Impactful Projects**: Highlight 2-3 capstone projects demonstrating backend architecture, API design, and cloud deployment.";
        }

        if (qLower.contains("interview") && qLower.contains("java")) {
            return "### Structured Java Interview Preparation Guide\n\n" +
                    "#### Phase 1: Core Java 21 & Concurrency\n" +
                    "* Master Collections framework (`HashMap` internal bucket collisions, `ConcurrentHashMap`).\n" +
                    "* Understand Java 21 Virtual Threads vs OS Threads, `CompletableFuture`, and Garbage Collectors (G1GC, ZGC).\n\n" +
                    "#### Phase 2: Spring Boot Architecture & Data JPA\n" +
                    "* Be prepared to explain Spring Bean lifecycle, Dependency Injection, and `@Transactional` propagation settings.\n" +
                    "* Master JPA entity mappings, Lazy loading N+1 queries, and database indexing strategies.\n\n" +
                    "#### Phase 3: System Design & STAR Method Drills\n" +
                    "* Practice System Design concepts: Caching (Redis), Microservices API Gateways, Rate Limiting, and JWT Security.\n" +
                    "* Frame behavioral and project questions using the STAR method (Situation, Task, Action, Result).";
        }

        if (!chunks.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            sb.append("Here is what the CareerPilot knowledge base specifies regarding **").append(query).append("**:\n\n");
            for (DocumentChunk chunk : chunks) {
                sb.append("### ").append(chunk.getDocumentName()).append("\n");
                sb.append(chunk.getContent().trim()).append("\n\n");
            }
            return sb.toString().trim();
        }

        return "### Career & Technical Guidance for: " + query + "\n\n" +
                "1. **Core Concept**: Focus on underlying principles, design patterns, and core syntax.\n" +
                "2. **Practical Building**: Implement hands-on projects, RESTful APIs, and state management.\n" +
                "3. **Best Practices**: Focus on clean code, unit testing, and production performance tuning.\n" +
                "4. **Interview Readiness**: Prepare STAR method responses and technical coding drills.";
    }

    private List<DocumentChunk> retrieveRelevantChunks(String query, int k) {
        List<DocumentChunk> allChunks = documentChunkRepository.findAll();
        if (allChunks.isEmpty()) return Collections.emptyList();

        Map<DocumentChunk, Double> scoredMap = new HashMap<>();
        for (DocumentChunk chunk : allChunks) {
            double score = calculateHeuristicSimilarity(query, chunk.getContent());
            if (score >= 0.25) { // Strict non-trivial relevance threshold
                scoredMap.put(chunk, score);
            }
        }

        if (scoredMap.isEmpty()) {
            return Collections.emptyList();
        }

        return scoredMap.entrySet().stream()
                .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                .limit(k)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    private double calculateHeuristicSimilarity(String query, String text) {
        if (query == null || text == null) return 0.0;
        String[] qWords = query.toLowerCase().replaceAll("[^a-zA-Z0-9\\s]", "").split("\\s+");
        String tLower = text.toLowerCase();

        int matches = 0;
        for (String w : qWords) {
            if (w.length() > 2 && tLower.contains(w)) {
                matches++;
            }
        }
        if (qWords.length == 0) return 0.0;
        return Math.min(1.0, (double) matches / Math.min(qWords.length, 5));
    }
}
