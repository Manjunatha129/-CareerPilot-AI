# CareerPilot AI — AI Intelligence Platform

> **Multi-Agent AI Career Intelligence & Job Application Management System**  
> *A full-stack, enterprise-grade platform unifying structured resume parsing, deterministic 6-facet job matching, pgvector RAG interview preparation, a 5-agent LangGraph workflow, and an ATS application tracking system.*

---

## 1. Project Overview
**CareerPilot AI** is a comprehensive, production-quality AI career assistant designed for final-year students, fresh graduates, and early-career job seekers. It empowers candidates to understand their career fit, evaluate their suitability for target job postings, identify missing technical skills, receive personalized learning recommendations and roadmaps, and track their job applications across an ATS Kanban board.

---

## 2. Core Project Aim
> *"CareerPilot AI is an AI-powered career intelligence and job application management platform that analyzes a candidate's profile, resume, skills, projects, and career preferences, evaluates their suitability for relevant job roles, identifies skill gaps, provides personalized career recommendations and a roadmap, and helps them track and manage their job applications."*

---

## 3. Problem Statement
Students and early-career candidates often struggle to understand:
- Which job roles fit their technical profile and experience level.
- Why they are or are not suitable for specific postings.
- Which specific technical skills they are missing for target roles.
- What skills, projects, or learning resources they should focus on next.
- How to optimize their resume and highlight relevant experience.
- How to track submitted job applications, interview stages, and recruiter contacts.

CareerPilot AI addresses these challenges by combining:
`Resume Intelligence` + `Job Intelligence` + `Deterministic Matching` + `pgvector RAG` + `LangGraph Multi-Agent AI` + `Career Intelligence` + `ATS Application Tracking`.

---

## 4. Key Features
1. **JWT Authentication & Security**: Secure BCrypt password hashing and user context isolation.
2. **Resume Intelligence & PDF Extraction**: PDF parsing, structured JSON extraction, and AI completeness scoring.
3. **Source-Agnostic Job Ingestion**: Idempotent ingestion, normalization, and deduplication of job postings.
4. **Deterministic + AI Hybrid Matching**: 6-facet weighted compatibility scoring (0–100%) paired with Gemini explanations.
5. **Set-Difference Skill Gap Analysis**: Transparent identification of matched vs missing required skills.
6. **Curated Learning Recommendations**: Skill-targeted learning resources (Coursera, Udemy, YouTube, Official Docs).
7. **RAG-Powered Interview Prep**: Job-specific interview questions grounded in knowledge documents.
8. **RAG Career Knowledge Assistant**: Interactive AI assistant backed by PostgreSQL `pgvector` dense search (`gemini-embedding-2`).
9. **LangGraph Multi-Agent Engine**: 5 autonomous agents orchestrating stateful career guidance workflows.
10. **ATS Application Board & Command Center**: Dual view modes (Kanban Board & Data Table), status history audit logs, and job-search conversion metrics.

---

## 5. System Architecture & Topology

```
                                     USER
                                      │
                                      ▼
                           REACT 18 WEB FRONTEND
                          (TypeScript + Vite + Tailwind)
                               (http://localhost:5173)
                                      │
                                      │ REST API (JSON / JWT Bearer)
                                      v
                           SPRING BOOT 3 CORE BACKEND
                             (Java 21 + Spring Security)
                               (http://localhost:8080)
                                      │
             ┌────────────────────────┼────────────────────────┐
             │                        │                        │
             v                        v                        v
      POSTGRESQL 16             JOB INGESTION             FASTAPI AI SERVICE
       + pgvector                ARCHITECTURE               (Python 3.11+)
     (localhost:5432)          (Seed/JSON/APIs)            (http://localhost:8000)
             │                                                 │
             │                                ┌────────────────┼────────────────┐
             │                                ▼                ▼                ▼
             │                          RAG PIPELINE      LANGGRAPH AGENTS  GEMINI CLOUD
             └───────────────────────► (pgvector 768d)      (5 Agents Graph) (google-genai)
```

---

## 6. Deterministic + AI Hybrid Match Formula (Phase 7)

$$\text{Final Score} = (S_{\text{skill}} \times 0.35) + (S_{\text{exp}} \times 0.20) + (S_{\text{edu}} \times 0.10) + (S_{\text{loc}} \times 0.10) + (S_{\text{sem}} \times 0.15) + (S_{\text{pref}} \times 0.10)$$

- **Bounded Score**: Computed score is strictly bounded between $0$ and $100\%$.
- **Score Integrity**: Google Gemini API provides explanatory advice ONLY and NEVER overrides the official score.
- **Fail-Safe Operation**: If Gemini is unreachable, the platform cleanly returns the mathematical score breakdown and structured recommendations without failing.

---

## 7. LangGraph Multi-Agent System (Phase 9)

```
                    START
                      │
                      ▼
             Career Manager Node
                      │
           (Conditional Routing)
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
  Resume Agent    Job Agent    Direct RAG
        │             │             │
        └─────────────┼─────────────┘
                      ▼
               Skill Gap Agent
                      │
                      ▼
               RAG Knowledge Node
                      │
                      ▼
             Career Planner Agent
                      │
                      ▼
                     END
```

---

## 8. Technology Stack

- **Frontend Client**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router v6, Axios.
- **Backend Core**: Java 21, Spring Boot 3.x, Spring Data JPA, Spring Security, JWT, Lombok, Apache Tika/PDFBox.
- **AI Microservice**: Python 3.11+, FastAPI, LangGraph, LangChain, `google-genai` SDK, Pydantic v2.
- **Database & Vector Search**: PostgreSQL 16 with native `pgvector` extension enabled on `localhost:5432`.

---

## 9. Project Directory Structure

```
AI Intelligence Platform/
├── backend/
│   └── careerpilot-api/             # Spring Boot 3.x Java 21 Microservice
│       ├── src/main/java/com/careerpilot/
│       │   ├── controller/          # REST Controllers
│       │   ├── dto/                 # Request/Response Data Transfer Objects
│       │   ├── entity/              # JPA Domain Entities
│       │   ├── exception/           # Exception Handlers
│       │   ├── repository/          # JPA Repositories
│       │   ├── security/            # JWT & Security Configuration
│       │   └── service/             # Business Logic & Math Match Engine
│       └── src/test/java/           # JUnit 5 & Mockito Unit Tests
│
├── frontend/
│   └── careerpilot-web/             # React 18 + TypeScript + Vite Client
│       └── src/
│           ├── api/                 # Axios API Clients
│           ├── components/          # Reusable UI Components
│           ├── context/             # Auth Context & State
│           ├── layouts/             # Navigation Layouts
│           └── pages/               # Application Pages (Applications, Jobs, etc.)
│
├── ai-service/
│   └── careerpilot-ai/              # FastAPI Python Microservice
│       ├── app/
│       │   ├── agents/              # LangGraph 5-Agent Workflows
│       │   ├── core/                # Config & Gemini API Client
│       │   ├── rag/                 # pgvector RAG Pipeline
│       │   ├── schemas/             # Pydantic Response Schemas
│       │   └── services/            # Deep Parsing & Matching Services
│       └── tests/                   # Pytest Test Suite
│
├── sample-data/                     # Synthetic Seed Jobs & Knowledge Base
├── docs/                            # Architecture, API Design, UML & Interview Guides
├── .env.example                     # Environment Configuration Template
├── .gitignore                       # Git Exclusion Patterns
└── README.md                        # Master Project Documentation
```

---

## 10. Local Installation & Setup Instructions

### Prerequisites
- Java 21 JDK (`C:\Program Files\Java\jdk-21`)
- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 16 with `pgvector` extension installed

### 1. Database Setup
```sql
CREATE DATABASE careerpilot;
\c careerpilot;
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and set your credentials:
```bash
GEMINI_API_KEY=your_actual_gemini_api_key
```

### 3. Start Python AI Microservice
```bash
cd ai-service/careerpilot-ai
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Start Spring Boot Core Backend
```bash
cd backend/careerpilot-api
mvn spring-boot:run
```

### 5. Start React Frontend Client
```bash
cd frontend/careerpilot-web
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 11. Testing Instructions

### Run Python Pytest Suite
```bash
cd ai-service/careerpilot-ai
.\venv\Scripts\pytest
```
*Result: 15 / 15 Passed*

### Run Spring Boot Maven Tests
```bash
cd backend/careerpilot-api
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
& "C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2023.3.2\plugins\maven\lib\maven3\bin\mvn.cmd" clean test
```
*Result: 37 / 37 Passed (`BUILD SUCCESS`)*

### Run Frontend Production Build
```bash
cd frontend/careerpilot-web
npm run build
```
*Result: Built successfully in 5.29s (0 errors)*

---

## 12. Recommended Demonstration Flow (20 Steps)

1. **Landing Page (`/`)**: View value proposition and core features.
2. **Register (`/register`)**: Create candidate account with email & password.
3. **Login (`/login`)**: Authenticate and receive JWT token.
4. **Dashboard (`/dashboard`)**: View profile completeness and platform action cards.
5. **Profile (`/profile`)**: Manage target job title, experience years, skills, and work mode.
6. **Resume (`/resume`)**: Upload PDF resume file.
7. **Resume Analysis**: View extracted skills, experience years, and AI completeness score.
8. **Jobs Explorer (`/jobs`)**: Search normalized job postings with multi-filters.
9. **Job Detail (`/jobs/:id`)**: View job requirements, salary estimate, and company details.
10. **Analyze Match**: Trigger 6-facet match score engine (35% Skill, 20% Exp, 10% Edu, 10% Loc, 15% Sem, 10% Pref).
11. **Match Breakdown**: Inspect matched skills, missing skills, and Gemini explanation.
12. **Career Intelligence (`/career-intelligence`)**: Open multi-agent career dashboard.
13. **Skill Gap Analysis**: View set-difference skills breakdown.
14. **Curated Learning**: Review targeted learning resources (Coursera, Udemy, Docs).
15. **Career Roadmap**: Explore 6-stage roadmap (Immediate, Short-Term, Medium-Term).
16. **Save Job**: Save job for later exploration from Job Detail page.
17. **Track Application**: Track job application with default status `APPLIED`.
18. **Applications Dashboard (`/applications`)**: View job-search conversion metrics.
19. **ATS Board View**: Move application state to `INTERVIEW` on Kanban board.
20. **Status History Modal**: View chronological status transition audit log.

---

## 13. Known System Limitations
- **Job Data Source**: Currently uses synthetic seed job ingestion (`sample-data/jobs/seed-jobs.json`). External portal APIs can be attached.
- **External Portal Submission**: Application tracking is managed within CareerPilot AI; external portal auto-submission is not executed without job site partner APIs.
- **Gemini Quota**: AI feature responsiveness depends on Google Gemini API quota availability; deterministic fallbacks guarantee basic operation.

---

## 14. Future Enhancements
- Real-time job board API connectors (LinkedIn, Indeed, Glassdoor APIs).
- Automated interview calendar integration (Google Calendar / Outlook).
- Interactive mock video interview recorder with AI audio feedback.
- Candidate referral and recruiter portal integration.

---

## 15. Author & License
Developed as an enterprise-grade AI project demonstration for final-year engineering evaluation and technical interviews. All rights reserved.
