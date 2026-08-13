# REST API Specifications & Contracts - CareerPilot AI

## 1. Overview & Base Conventions
* **Spring Boot API Base URL**: `http://localhost:8080/api`
* **Python AI Service Base URL**: `http://localhost:8000/api/v1/ai`
* **Authentication**: HTTP Header `Authorization: Bearer <JWT_TOKEN>`
* **Standard Response Wrap**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation executed successfully",
  "timestamp": "2026-08-12T12:00:00Z"
}
```
* **Standard Error Format**:
```json
{
  "timestamp": "2026-08-12T12:00:00Z",
  "status": 404,
  "error": "JOB_NOT_FOUND",
  "message": "Job with ID 123 was not found",
  "path": "/api/jobs/123"
}
```

---

## 2. Spring Boot Core API Endpoints

### 2.1 Authentication (`/api/auth`)
* `POST /api/auth/register`
  * **Request**: `{ "fullName": "Jane Doe", "email": "jane@example.com", "password": "Password123!" }`
  * **Response**: `201 Created` with User DTO & Token.
* `POST /api/auth/login`
  * **Request**: `{ "email": "jane@example.com", "password": "Password123!" }`
  * **Response**: `200 OK` `{ "token": "jwt_string...", "user": { "id": 1, "email": "jane@example.com", "role": "ROLE_CANDIDATE" } }`

### 2.2 Profile Management (`/api/profiles`)
* `GET /api/profiles/me`: Get current candidate profile.
* `PUT /api/profiles/me`: Update profile details (headline, location, skills, preferences).

### 2.3 Resume Intelligence (`/api/resumes`)
* `POST /api/resumes/upload` (Multipart `file` parameter - PDF)
  * Validates PDF magic header and size limit (max 5MB), saves file locally in `uploads/resumes/`, creates `Resume` record in `PROCESSING` status, communicates with FastAPI `/ai/resume/analyze`, and persists structured JSON & `PROCESSED` status.
* `GET /api/resumes`: Retrieve all uploaded resumes for the current authenticated user.
* `GET /api/resumes/{id}`: Retrieve detailed metadata and parsed structured analysis JSON for a specific user-owned resume.
* `DELETE /api/resumes/{id}`: Delete a user-owned resume record and its local physical file.

### 2.4 Jobs Ingestion & Search (`/api/jobs`)
* `POST /api/jobs/ingest/seed`: Idempotently ingests synthetic seed jobs from `sample-data/jobs/seed-jobs.json`. Performs normalization, validation, company deduplication, skill association, and job deduplication.
* `GET /api/jobs`: Paginated multi-filter search endpoint (`?search=java&location=San+Francisco&workMode=HYBRID&employmentType=FULL_TIME&experienceLevel=ENTRY&company=TechScale&source=SEED_DATA&page=0&size=10&sortBy=createdAt&sortDirection=DESC`). Returns `PageResponse<JobDTO>` with `SYNTHETIC / SAMPLE DATA` attribution labels.
* `GET /api/jobs/{id}`: Fetch complete job details by ID, including company information, required skills, and nice-to-have skills.

### 2.5 Hybrid Matching & Recommendations (`/api/jobs/{jobId}/match`)
* `GET /api/jobs/{jobId}/match`: Calculates explainable 6-facet deterministic candidate-job match score for authenticated user (Skill 35%, Experience 20%, Education 10%, Location 10%, Semantic 15% via `gemini-embedding-2`, Preferences 10%). Returns overall score (0-100), category (`STRONG_MATCH`, `GOOD_MATCH`, `PARTIAL_MATCH`, `LOW_MATCH`), breakdown scores, matched skills, missing skills, deterministic strengths/gaps, and fail-safe Gemini explanation.

### 2.6 Application Tracking System (`/api/applications`)
* `GET /api/applications`: Get paginated, status-filtered, searchable applications list for authenticated user (`?status=APPLIED&page=0&size=20&search=Java&sortBy=updatedAt`). Returns `PageResponse<ApplicationDTO>`.
* `GET /api/applications/{id}`: Get application details by ID for authenticated user, including job info, resume name, recruiter details, and full status transition history timeline.
* `POST /api/applications`: Create/Track application record (`{ "jobId": 10, "resumeId": 1, "status": "APPLIED", "source": "LinkedIn", "notes": "Applied via referral" }`).
* `PUT /api/applications/{id}`: Update application notes, source, job URL, recruiter name/email, or current stage.
* `PATCH /api/applications/{id}/status`: Transition application status stage (`{ "newStatus": "INTERVIEW", "note": "Technical round scheduled for Friday" }`). Atomically updates status and records `ApplicationStatusHistory`.
* `DELETE /api/applications/{id}`: Delete application record and history without deleting the underlying Job entity.
* `GET /api/applications/metrics`: Calculate job-search metrics (total applications, saved count, applied count, screening count, interview count, offer count, rejected count, interview conversion rate %, offer conversion rate %, average match score).
* `POST /api/applications/jobs/{jobId}/save`: Idempotently save job for later exploration.
* `DELETE /api/applications/jobs/{jobId}/save`: Unsave job.
* `GET /api/applications/jobs/{jobId}/check`: Check application/saved state for specific job.

### 2.7 Knowledge Base & RAG Intelligence (`/api/knowledge`)
* `POST /api/knowledge/ingest/seed`: Idempotently loads Markdown knowledge documents from `sample-data/knowledge-base/`, cleans text, chunks recursively (500 chars / 50 overlap), generates 768-dim `gemini-embedding-2` embeddings, and indexes in PostgreSQL `document_chunks`.
* `POST /api/knowledge/query`: Executes grounded RAG query (`{ "query": "What is dependency injection?", "topK": 4 }`). Performs vector similarity search, context assembly, anti-hallucination validation, grounded Gemini generation, and source citation formatting (`RagResponseDTO`).
* `GET /api/knowledge/documents`: Lists all ingested `KnowledgeDocument` records and chunk counts.

### 2.8 Multi-Agent Career Intelligence (`/api/career-intelligence`)
* `GET /api/career-intelligence`: Retrieves authenticated candidate's Personal Career Intelligence Dashboard, aggregating profile, resume, job dataset requirements, Phase 7 official match scores, and 3-tier roadmap (`CareerIntelligenceDTO`).
* `POST /api/career-intelligence`: Triggers refresh or custom query analysis for authenticated candidate (`{ "query": "Am I ready for Java backend roles?", "targetJobId": 10 }`). Orchestrates LangGraph multi-agent workflow to return career direction, role insights, skill categorization, 6-dimension gaps matrix, personalized recommendations, project intelligence, and 6-stage roadmap.

---

## 3. Python AI Microservice Endpoints (`http://localhost:8000/api/v1/ai`)

* `POST /api/v1/ai/parse-resume`
  * **Input**: Raw text string of resume.
  * **Output**: `ResumeAnalysisResponse` (Extracted skills, experience years, education, parsed projects).
* `POST /api/v1/ai/analyze-jd`
  * **Input**: Job description text.
  * **Output**: `JobDescriptionAnalysisResponse` (Required skills, experience level, domain, key responsibilities).
* `POST /api/v1/ai/hybrid-match`
  * **Input**: Candidate profile JSON + Job requirements JSON.
  * **Output**: Deterministic weights math + Gemini natural language match explanation.
* `POST /api/v1/ai/skill-gap`
  * **Input**: Candidate skills list + Job required skills list.
  * **Output**: Matched skills, missing critical skills, and learning recommendations.
* `POST /api/v1/ai/interview-questions`
  * **Input**: Job ID / title + Candidate profile.
  * **Output**: Categorized interview prep questions with RAG context snippets.
* `POST /api/v1/ai/assistant/chat`
  * **Input**: `{ "user_id": 1, "message": "How should I prepare for a Senior Java Developer interview?" }`
  * **Output**: Grounded RAG + Multi-Agent answer with citations.
