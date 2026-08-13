# Sequence Diagrams - CareerPilot AI

## 1. Resume Upload & Parsing Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as Client (React Web)
    participant Spring as Spring Boot Backend (8080)
    participant Storage as Local File Storage (uploads/resumes/)
    participant DB as PostgreSQL / H2 DB
    participant PyAI as FastAPI AI Service (8000)
    participant Gemini as Google Gemini API Cloud

    User->>Spring: POST /api/resumes/upload (PDF Multipart File)
    Spring->>Spring: Validate file (non-empty, magic header %PDF-, max 5MB)
    Spring->>Storage: Save file to uploads/resumes/{uuid}_{name}.pdf
    Spring->>DB: Save Resume record (status = PROCESSING)
    Spring->>PyAI: POST /ai/resume/analyze (file bytes)
    PyAI->>PyAI: Extract text via pypdf & clean whitespace
    PyAI->>Gemini: generate_content(RESUME_ANALYSIS_PROMPT, resume_text)
    Gemini-->>PyAI: Structured JSON (Candidate info, Skills, Experience, Edu)
    PyAI->>PyAI: Validate JSON against Pydantic ResumeAnalysisResponse
    PyAI-->>Spring: Validated Resume JSON
    Spring->>DB: UPDATE Resume (parsed_json, completeness_score, status = PROCESSED)
    Spring-->>User: 200 OK (ResumeDTO with parsed JSON & score)
```

---

## 2. Job Ingestion & Search Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as Client (React Web)
    participant Spring as Spring Boot Backend (8080)
    participant Ingestion as Ingestion Pipeline (Connector/Normalizer/Validator/Deduplicator)
    participant DB as PostgreSQL DB (5432)

    User->>Spring: POST /api/jobs/ingest/seed
    Spring->>Ingestion: fetchRawJobs() from sample-data/jobs/seed-jobs.json
    Ingestion->>Ingestion: Normalize fields & validate mandatory fields
    Ingestion->>DB: Find or create Company (case-insensitive name)
    Ingestion->>DB: Check deduplication (external ID + source or company + title + location)
    Ingestion->>DB: UPSERT Job & JobSkills (Idempotent)
    Spring-->>User: 200 OK ("Successfully ingested/updated 10 seed job postings")

    User->>Spring: GET /api/jobs?search=java&workMode=REMOTE&page=0&size=10
    Spring->>DB: SELECT jobs with filters & pagination
    DB-->>Spring: Page<Job> result
    Spring-->>User: 200 OK (PageResponse<JobDTO> with SYNTHETIC DATA label)
```

---

## 3. Hybrid Job Recommendation Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as Client (React Web)
    participant Spring as Spring Boot Backend (8080)
    participant DB as PostgreSQL DB (5432)
    participant PyAI as FastAPI AI Service (8000)
    participant Gemini as Google Gemini API Cloud

    User->>Spring: GET /api/jobs/{jobId}/match
    Spring->>DB: SELECT Candidate Profile, Skills, Primary Resume, & Job Details
    DB-->>Spring: Profile, Resume, & Job Data
    Spring->>PyAI: POST /ai/matching/semantic-similarity (Resume Text, Job Description)
    PyAI->>Gemini: embed_content(gemini-embedding-2, 768 dims)
    Gemini-->>PyAI: Embeddings & Cosine Similarity Score
    PyAI-->>Spring: Semantic Similarity Score (0-100)
    Spring->>Spring: Compute 6-Facet Formula (Skill 35%, Exp 20%, Edu 10%, Loc 10%, Sem 15%, Pref 10%)
    Spring->>PyAI: POST /ai/matching/explain (Pre-calculated Score & Evidence)
    PyAI->>Gemini: generate_content(MATCH_EXPLANATION_PROMPT, evidence)
    Gemini-->>PyAI: Match Explanation JSON (Summary, Strengths, Gaps, Advice)
    PyAI-->>Spring: Explanation Payload (or Fallback if Offline)
    Spring-->>User: 200 OK (MatchResponseDTO with Score 82%, 6 Breakdown Bars, Skills, AI Explanation)
```

---

## 4. Grounded RAG Query & Citation Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as Client (React Web)
    participant Spring as Spring Boot Backend (8080)
    participant DB as PostgreSQL pgvector DB (5432)
    participant PyAI as FastAPI AI Service (8000)
    participant Gemini as Google Gemini API Cloud

    User->>Spring: POST /api/knowledge/query ({ query: "What is dependency injection?", topK: 4 })
    Spring->>DB: Vector Similarity / Keyword Retrieval on document_chunks
    DB-->>Spring: Top-K Relevant Document Chunks
    alt 0 Matching Chunks (Out-of-scope query)
        Spring-->>User: 200 OK (hasSufficientContext = false, Insufficient Knowledge Notice)
    else Relevant Chunks Found
        Spring->>PyAI: POST /ai/rag/generate-answer (Query & Formatted Context Blocks)
        PyAI->>Gemini: generate_content(RAG_SYSTEM_PROMPT, query, context)
        Gemini-->>PyAI: Grounded Answer JSON + Referenced Sources
        PyAI-->>Spring: Grounded Answer Payload
        Spring-->>User: 200 OK (RagResponseDTO with Answer, Citations, & Sources)
    end
```

---

## 5. Multi-Agent Career Intelligence Sequence (Phase 10)

```mermaid
sequenceDiagram
    autonumber
    actor User as Client (React Web)
    participant Spring as Spring Boot Backend (8080)
    participant Matching as Phase 7 Hybrid Match Engine
    participant DB as PostgreSQL DB (5432)
    participant PyAI as FastAPI AI Service (8000)
    participant LangGraph as LangGraph Engine (5-Agent Graph)
    participant Gemini as Google Gemini API Cloud

    User->>Spring: GET /api/career-intelligence or POST /api/career-intelligence/analyze
    Spring->>DB: Fetch authenticated user Profile, Skills, Primary Resume JSON, & Job Postings
    DB-->>Spring: Candidate & Job Dataset
    Spring->>Matching: calculateJobMatch(userEmail, jobId)
    Matching-->>Spring: Official Phase 7 Match Score (Skill 35%, Exp 20%, Edu 10%, Loc 10%, Sem 15%, Pref 10%)
    Spring->>PyAI: POST /ai/agents/career-intelligence (Candidate + Job + Official Match Score)
    PyAI->>LangGraph: career_workflow_app.invoke(initial_state)
    
    note over LangGraph: 1. Career Manager Node (Intent & State Init)
    note over LangGraph: 2. Resume Intelligence Node (Skills & Experience Normalization)
    note over LangGraph: 3. Job Intelligence Node (Job Dataset Requirements)
    note over LangGraph: 4. Skill Gap Node (Matched vs Missing & Priority Gaps)
    
    LangGraph->>Gemini: 5. Career Planner Node (Direction, Role Insights, Gaps, Roadmap)
    Gemini-->>LangGraph: Grounded Assessment Text & Recommendations
    LangGraph-->>PyAI: Final CareerAgentState (Status = SUCCESS)
    PyAI-->>Spring: CareerIntelligenceResponse JSON (with RAG Citations)
    Spring-->>User: 200 OK (CareerIntelligenceDTO with Overview, Role Insights, 6 Gaps, 3-Tier Roadmap)
```

