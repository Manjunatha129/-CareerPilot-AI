# Software Requirements Specification (SRS) - CareerPilot AI

## 1. Local Prerequisites & Environment Requirements
* **Operating System**: Windows 10/11, macOS 12+, or Linux (Ubuntu 22.04+)
* **JDK**: OpenJDK 21 LTS
* **Build Tool**: Apache Maven 3.9+
* **Node Environment**: Node.js v18.x or v20.x LTS, `npm` v9+
* **Python**: Python 3.11+ with `pip` and virtualenv (`venv`)
* **Database**: PostgreSQL 16+ with `pgvector` extension enabled locally on `localhost:5432`
* **Version Control**: Git 2.40+

---

## 2. Functional Requirements (FR)

### Module 1: Authentication & User Management
* **FR-1.1**: The system must allow new users (candidates) to register using Full Name, Email, and Password with BCrypt password hashing.
* **FR-1.2**: The system must authenticate users via JWT (JSON Web Token) containing user ID, email, and role, expiring in 24 hours.
* **FR-1.3**: The system must restrict all protected backend endpoints to authenticated JWT bearers.

### Module 2: Career Profile Management
* **FR-2.1**: The system must allow candidates to create and update a Career Profile including headline, summary, years of experience, current location, target job titles, target industries, preferred work modes (REMOTE, HYBRID, ON_SITE), and minimum target salary.
* **FR-2.2**: The system must allow users to manage a structured list of technical skills, soft skills, certifications, and education history.

### Module 3: Resume Upload & Intelligence
* **FR-3.1**: The system must support uploading candidate resumes in PDF and DOCX formats (max 5MB file size).
* **FR-3.2**: The system must parse raw text from uploaded files using Apache Tika or PDFBox/POI.
* **FR-3.3**: The AI service must extract structured candidate data (extracted skills, experience breakdown, education, projects, contact info) validated via Pydantic (`ResumeAnalysisResponse`).
* **FR-3.4**: The system must calculate a Resume Completeness Score and provide actionable formatting and keyword suggestions.

### Module 4: Job Source & Ingestion Architecture
* **FR-4.1**: The system must support a source-agnostic job ingestion pipeline via a unified `JobSource` connector interface.
* **FR-4.2**: The system must ingest, normalize, validate, and deduplicate job postings from seed JSON files and public job datasets into PostgreSQL.
* **FR-4.3**: Each job record must store title, company, location, work mode, salary range, employment type, full raw description, extracted required skills, experience level required, and creation timestamp.

### Module 5: Hybrid Job-Match & Explainable Recommendation Engine
* **FR-5.1**: The system must calculate a deterministic Job Match Score (0–100%) using a weighted formula:
  * **Skill Match**: 35%
  * **Experience Match**: 20%
  * **Education Match**: 10%
  * **Location & Work Mode Match**: 10%
  * **Semantic Description Similarity**: 15%
  * **User Preferences Match**: 10%
* **FR-5.2**: The AI Service must generate natural language explanations explaining *why* the candidate scored high or low, highlighting specific strengths and gaps.
* **FR-5.3**: Match scoring weights must be configurable via application settings without breaking business logic.

### Module 6: Skill Gap Analysis & Learning Pathways
* **FR-6.1**: The system must compare candidate skills against job-required skills to produce a breakdown of Matched Skills, Partial Skills, and Critical Missing Skills.
* **FR-6.2**: The system must recommend curated learning resources (courses, documentation, tutorials, practice projects) mapped directly to identified skill gaps.

### Module 7: Interview Preparation & Resume Optimization
* **FR-7.1**: The AI service must generate job-specific interview questions categorized into Technical, Behavioral, System Design, and Situational questions.
* **FR-7.2**: The system must utilize RAG context (indexed company technical blogs, interview guides) to enrich interview question hints and expected answers.
* **FR-7.3**: The system must provide bullet-point optimization suggestions tailored to align a candidate's resume with a targeted job description without fabricating credentials.

### Module 8: Application Tracking System (ATS Kanban)
* **FR-8.1**: Candidates must be able to save jobs and transition them across application stages: `SAVED` → `APPLYING` → `APPLIED` → `ASSESSMENT` → `INTERVIEW` → `OFFER` → `REJECTED` → `WITHDRAWN`.
* **FR-8.2**: Users must be able to log notes, interview dates, contact person details, and offer details for each application record.

### Module 9: RAG & Multi-Agent AI Career Assistant
* **FR-9.1**: The system must feature a RAG pipeline utilizing PostgreSQL `pgvector` (768-dimensional embeddings generated via configurable `gemini-embedding-2`) to index career knowledge, learning resources, and interview material.
* **FR-9.2**: The system must deploy a multi-agent workflow powered by LangGraph (Career Manager, Planner, Resume Agent, JD Agent, Matching Agent, Skill Gap Agent, Learning Agent, Interview Agent) to execute multi-turn career strategy queries.
* **FR-9.3**: The AI Career Assistant chat interface must allow natural language Q&A, citing evidence-grounded sources from the vector database.

---

## 3. Non-Functional Requirements (NFR)

* **NFR-1 (Performance)**: Deterministic job matching for 100+ jobs must execute in under 200ms. AI multi-agent responses must stream or return within 3.5 seconds.
* **NFR-2 (Security)**: Password hashes must use BCrypt with cost factor 10. Gemini API keys must reside strictly in server `.env` variables.
* **NFR-3 (Reliability & Fault Tolerance)**: If the Python AI service or Gemini API is unreachable, core application functions (Auth, Profile, Job Search, Application Tracking, Deterministic Matching) must continue operating cleanly with appropriate UI fallback warnings.
* **NFR-4 (Explainability)**: Every match recommendation must provide transparent mathematical scores alongside structured AI explanations.
* **NFR-5 (Data Integrity & Validation)**: All input APIs must validate DTOs (e.g., `@NotNull`, `@Email`, `@Size`). All LLM responses must undergo Pydantic schema validation.
* **NFR-6 (Usability & Design)**: Responsive web layout supporting viewport resolutions from 360px mobile to 4K desktop, adhering to WCAG 2.1 AA accessibility standards, featuring a professional white/gray/orange theme (`#F97316`).
* **NFR-7 (Maintainability)**: Clear separation of concerns: Spring Boot owns relational logic; Python owns AI orchestration; React owns UI.
* **NFR-8 (Scalability)**: Support database indexing on foreign keys and vector fields (`HNSW` or `IVFFlat` index on `pgvector`).
* **NFR-9 (Testability)**: Comprehensive unit and integration test coverage across Java backend (`JUnit 5`, `Mockito`) and Python AI service (`pytest`).
* **NFR-10 (No Docker Dependency)**: Fully executable locally via native commands (`mvn spring-boot:run`, `uvicorn main:app --reload`, `npm run dev`).
