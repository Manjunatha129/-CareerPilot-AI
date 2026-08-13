# Master Implementation Plan (Phases 0 - 12) - CareerPilot AI

## Executive Phase Roadmap & Dependency Chain

```
[Phase 0: Architecture & Planning] (COMPLETED)
        |
        v
[Phase 1: Local Foundation & Workspace Setup] (COMPLETED)
        |
        v
[Phase 2: Database & Spring Boot Backend Core] (COMPLETED)
        |
        v
[Phase 3: Authentication & Career Profile] (COMPLETED)
        |
        v
[Phase 4: React Frontend Foundation] (COMPLETED)
        |
        v
[Phase 5: Resume Intelligence Service] (COMPLETED)
        |
        v
[Phase 6: Job Ingestion & Job Intelligence] (COMPLETED)
        |
        v
[Phase 7: Hybrid Match & Recommendation Engine] (COMPLETED)
        |
        v
[Phase 8: Gemini API Integration & RAG Pipeline] (COMPLETED)
        |
        v
[Phase 9: LangGraph Multi-Agent Engine] (COMPLETED)
        |
        v
[Phase 10: Career Intelligence (Skill Gap, Learning, Prep)] (COMPLETED)
        |
        v
[Phase 11: ATS Application Tracker & Executive Dashboard]
        |
        v
[Phase 12: Testing, Evaluation, Documentation & Release]
```

---

## Phase Specifications

### Phase 0: Master Architecture & Technical Planning
* **Prerequisites**: User prompt requirements & system specifications.
* **Objective**: Define initial architecture, ERD, API endpoints, AI models, data flow, sequence diagrams, and SRS documents.
* **Outputs**: `docs/PROJECT_OVERVIEW.md`, `docs/REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE_DESIGN.md`, `docs/API_DESIGN.md`, `docs/AI_ARCHITECTURE.md`, `docs/RAG_ARCHITECTURE.md`, `docs/AGENT_ARCHITECTURE.md`, `docs/uml/*`, `.env.example`, `.gitignore`, `LICENSE`, `README.md`.
* **Verification**: Verify markdown links and diagram rendering.
* **Acceptance Criteria**: 100% alignment with technical constraints (No Docker, JDK 21, Spring Boot 3, FastAPI, PostgreSQL + pgvector, React + Tailwind, LangGraph, Gemini API via `google-genai`).

---

### Phase 1: Local Development Foundation
* **Prerequisites**: Phase 0 completion. Installed local tools: JDK 21, Maven, Node.js v18+, Python 3.11+, PostgreSQL 16+.
* **Objective**: Initialize project directory structure (`frontend/careerpilot-web`, `backend/careerpilot-api`, `ai-service/careerpilot-ai`, `sample-data`). Create placeholder build configs (`pom.xml`, `package.json`, `pyproject.toml` / `requirements.txt`).
* **Expected Files**:
  * `backend/careerpilot-api/pom.xml`
  * `ai-service/careerpilot-ai/requirements.txt`
  * `frontend/careerpilot-web/package.json`
* **Verification Commands**:
  * Backend build check: `cd backend/careerpilot-api && mvn clean compile`
  * AI Service check: `cd ai-service/careerpilot-ai && python -m venv venv`
  * Frontend check: `cd frontend/careerpilot-web && npm install`
* **Acceptance Criteria**: All build files initialize cleanly without syntax or version errors.

---

### Phase 2: Database Schema & Spring Boot Backend Core
* **Prerequisites**: Phase 1 completion & local PostgreSQL running on `localhost:5432`.
* **Objective**: Enable `pgvector` extension, establish Liquibase or Flyway / JPA DDL schema for all 15 tables, configure Spring Data JPA entities, repositories, and global exception handler.
* **Expected Files**:
  * Entities: `User`, `Profile`, `Resume`, `Skill`, `Company`, `Job`, `JobSkill`, `Application`, `DocumentChunk`.
  * Repositories: `UserRepository`, `ProfileRepository`, `JobRepository`, `ApplicationRepository`.
  * Config: `SecurityConfig`, `CorsConfig`, `GlobalExceptionHandler`.
* **Verification**: `mvn test-compile` and inspect PostgreSQL tables in `careerpilot` database.
* **Acceptance Criteria**: Spring Boot starts successfully on port 8080 and establishes JDBC connection with PostgreSQL.

---

### Phase 3: Authentication & Career Profile Module
* **Prerequisites**: Phase 2 backend core entities.
* **Objective**: Implement JWT-based registration and login, password hashing with BCrypt, user profile CRUD endpoints.
* **Expected APIs**: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/profiles/me`, `PUT /api/profiles/me`.
* **Verification**: Execute integration tests verifying valid registration, duplicate email rejection, invalid password rejection, and JWT validation.
* **Acceptance Criteria**: Secured endpoints block unauthenticated requests with `401 Unauthorized`.

---

### Phase 4: React Frontend Foundation
* **Prerequisites**: Phase 1 frontend directory & Phase 3 auth APIs.
* **Objective**: Set up Vite React application, Tailwind CSS configuration with orange theme (`#F97316`), React Router v6 layout structure (Navbar, Sidebar, Main Layout), Axios API interceptors for JWT, Auth Context provider.
* **Expected Pages**: Landing Page, Login, Register, Profile, Dashboard skeleton.
* **Verification**: `npm run dev` at `http://localhost:5173`.
* **Acceptance Criteria**: Complete login and registration UI flow operating against Spring Boot backend.

---

### Phase 5: Resume Intelligence Service
* **Prerequisites**: Phase 3 profile APIs & Phase 4 frontend.
* **Objective**: Build file upload mechanism (PDF/DOCX) using Apache Tika/PDFBox on Spring Boot, integrate FastAPI `/api/v1/ai/parse-resume` using Gemini structured output, store extracted data in `resumes` table.
* **Expected APIs**: `POST /api/resumes/upload`, `GET /api/resumes/me`.
* **Verification**: Upload sample PDF resumes and verify JSON extraction accuracy of skills and experience.
* **Acceptance Criteria**: Extracted skills populate the candidate's career profile automatically.

---

### Phase 6: Job Ingestion & Job Intelligence Architecture
* **Prerequisites**: Phase 2 database schema.
* **Objective**: Implement source-agnostic `JobSource` connector interface, seed parser for loading sample job postings (`sample-data/jobs/seed-jobs.json`), normalizer, deduplicator, job search & pagination APIs.
* **Expected APIs**: `GET /api/jobs`, `GET /api/jobs/{id}`, `POST /api/jobs/ingest/seed`.
* **Verification**: Verify at least 100 synthetic/sample job postings are stored and searchable by keyword, location, and work mode.
* **Acceptance Criteria**: Fast paginated queries (<50ms response time).

---

### Phase 7: Deterministic + AI Hybrid Matching Engine
* **Prerequisites**: Phase 5 resumes & Phase 6 jobs.
* **Objective**: Build 6-facet mathematical match calculation engine in Spring Boot (Skill 35%, Exp 20%, Edu 10%, Loc 10%, Sem 15%, Pref 10%) and couple with Python Gemini natural language explanation generator.
* **Expected APIs**: `GET /api/matching/jobs`, `GET /api/matching/jobs/{jobId}/breakdown`.
* **Verification**: Unit test match score edge cases (0% match, 100% match, partial skill matches).
* **Acceptance Criteria**: Scores are deterministic, repeatable, and explainable in human terms.

---

### Phase 8: Gemini API Integration & RAG Pipeline
* **Prerequisites**: Python FastAPI setup & PostgreSQL `pgvector`.
* **Objective**: Build centralized `GeminiClient` and `GeminiService` using `google-genai` SDK. Create RAG document chunking & 768-dimensional vector indexing pipeline using `gemini-embedding-2` for `sample-data/knowledge-base/`.
* **Expected APIs**: `/api/v1/ai/assistant/chat`, `/api/v1/ai/rag/query`.
* **Verification**: Query career assistant for interview guidelines and confirm returned context matches indexed chunks with high cosine similarity (>0.70).
* **Acceptance Criteria**: Grounded answers with clear document citations.

---

### Phase 9: LangGraph Multi-Agent System
* **Prerequisites**: Phase 8 Gemini service.
* **Objective**: Build LangGraph autonomous multi-agent state graph (`StateGraph`) containing all 11 agents (Career Manager, Planner, Resume, Job Research, JD Analysis, Matching, Skill Gap, Learning, Interview, Resume Optimization, Recommendation).
* **Verification**: Run multi-agent execution pipeline on a sample candidate profile + target job prompt.
* **Acceptance Criteria**: State transitions smoothly across agents returning a complete career action plan.

---

### Phase 10: Career Intelligence (Skill Gap, Learning & Interview Prep)
* **Prerequisites**: Phase 7 matching & Phase 9 multi-agent engine.
* **Objective**: Implement UI & APIs for Skill Gap visual breakdown, Curated Learning Resource recommendations, Job-Specific Interview Question generation, and Resume Keyword Optimization suggestions.
* **Expected Pages**: Skill Gap Page, Learning Resources Page, Interview Prep Page, Resume Optimization View.
* **Verification**: Select target job -> verify generated interview questions are directly tailored to job requirements.
* **Acceptance Criteria**: Actionable, clear guidance without LLM hallucination of false qualifications.

---

### Phase 11: ATS Application Tracker & Executive Dashboard ✅
* **Status**: **Completed & Fully Verified**
* **Prerequisites**: Phase 3-10 modules.
* **Objective**: Implemented Application Management & ATS Tracker layer (`SAVED`, `APPLIED`, `SCREENING`, `INTERVIEW`, `OFFER`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`), status transition audit history (`ApplicationStatusHistory`), deterministic job-search conversion metrics, interactive ATS Kanban Board and Data Table views, Job Detail page integration (`Save Job` / `Apply / Track`), and Executive Dashboard widgets.
* **APIs Implemented**: `GET/POST/PUT/DELETE /api/applications`, `PATCH /api/applications/{id}/status`, `GET /api/applications/metrics`, `POST/DELETE /api/applications/jobs/{jobId}/save`, `GET /api/applications/jobs/{jobId}/check`.
* **Verification**: All 37 Spring Boot backend unit/integration tests passed (`BUILD SUCCESS`), 15 Python pytest cases passed, Vite frontend build passed (`npm run build`).
* **Acceptance Criteria**: Strict user isolation enforced via Spring Security; official Phase 7 match scores preserved without recalculation; zero external dependencies.

---

### Phase 12: Testing, Evaluation, Documentation & Release
* **Prerequisites**: All previous phases complete.
* **Objective**: Execute end-to-end unit, integration, and UI verification. Document evaluation metrics (Match Precision@K, RAG Context Precision, API Latency). Finalize `docs/interview/` (15 files) and `docs/final-year/` (23 files).
* **Verification**: Execute test suites across Java (`mvn test`), Python (`pytest`), and React.
* **Acceptance Criteria**: Project complete, runnable locally, 100% verified, production-quality documentation.
