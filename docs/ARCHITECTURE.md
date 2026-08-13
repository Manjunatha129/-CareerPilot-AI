# Enterprise Architecture Specification - CareerPilot AI

## 1. System Overview & Architectural Topology

CareerPilot AI follows a modular, 3-Tier Micro-Component Architecture designed for high maintainability, robust security, and clear separation of concerns:

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|                       React 18 + TypeScript + Vite + Tailwind                     |
|                                (http://localhost:5173)                            |
+-----------------------------------------------------------------------------------+
                                          |
                                          | REST API (JSON / JWT Bearer)
                                          v
+-----------------------------------------------------------------------------------+
|                                 BACKEND SERVICES                                  |
|                         Spring Boot 3.x (Java 21)                                 |
|                                (http://localhost:8080)                            |
|                                                                                   |
|  [ Security / Auth ]  [ Profile Service ]  [ Job Ingestion ]  [ Hybrid Matcher ]  |
|  [ Application ATS ]  [ REST Controllers ] [ JPA Repositories] [ DTO Mappers ]     |
+-----------------------------------------------------------------------------------+
           |                                                       |
           | JDBC                                                  | REST (HTTP/JSON)
           v                                                       v
+-----------------------+                        +----------------------------------+
|    DATABASE LAYER     |                        |           AI SERVICE             |
| PostgreSQL 16         |                        | Python 3.11+ FastAPI             |
| + pgvector Extension  |                        | (http://localhost:8000)          |
| (localhost:5432)      |                        |                                  |
|                       |                        |  [ Gemini Service Client ]        |
|  - Relational Tables  |                        |  [ LangGraph Multi-Agent Engine] |
|  - 768-dim Embeddings |                        |  [ RAG Vector Retrieval Service] |
+-----------------------+                        +----------------------------------+
                                                                   |
                                                                   | HTTPS (google-genai)
                                                                   v
                                                         +-------------------+
                                                         |  Google Gemini    |
                                                         |  API Cloud        |
                                                         +-------------------+
```

---

## 2. Technology Stack & Responsibilities

### Tier 1: Frontend Client (`frontend/careerpilot-web`)
* **Technology**: React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Axios, Recharts.
* **Responsibilities**:
  * Render modern, responsive SaaS application pages (Dashboard, Job Search, Match Breakdown, Application Kanban, AI Career Assistant).
  * Maintain client state (Auth context, current profile, selected job state).
  * Direct communication strictly with the Spring Boot backend API.
  * *Constraint*: Zero exposure of third-party API keys or AI credentials.

### Tier 2: Backend Core Services (`backend/careerpilot-api`)
* **Technology**: Java 21, Spring Boot 3.x, Spring Data JPA, Spring Security, JWT, Lombok, Apache Tika/PDFBox.
* **Responsibilities**:
  * Execute deterministic business rules (User authentication, password encryption via BCrypt, Profile CRUD, Job ingestion normalization).
  * Compute mathematical deterministic job-match scoring across 6 weighted dimensions.
  * Manage PostgreSQL database transactions and application status state machines.
  * Delegate specialized AI tasks (resume deep parsing, RAG query, interview generation, agent execution) to the Python AI Service via internal HTTP REST calls.

### Tier 3: AI & Multi-Agent Microservice (`ai-service/careerpilot-ai`)
* **Technology**: Python 3.11+, FastAPI, LangGraph, LangChain core modules, `google-genai` SDK, Pydantic v2.
* **Responsibilities**:
  * Manage Google Gemini API integration using a centralized `GeminiClient` / `GeminiService` pattern.
  * Execute LangGraph autonomous multi-agent workflows.
  * Run vector embeddings (using configurable `gemini-embedding-2`, 768-dim) and similarity retrievals against PostgreSQL `pgvector`.
  * Validate all AI inputs and outputs strictly using Pydantic response schemas.

### Tier 4: Database Layer
* **Technology**: PostgreSQL 16 with native `pgvector` extension enabled on `localhost:5432`.
* **Responsibilities**:
  * Store ACID relational entities (`users`, `profiles`, `resumes`, `jobs`, `applications`).
  * Store vector embedding chunks (`document_chunks` table with 768-dimensional `vector` columns for RAG matching `gemini-embedding-2`).

---

## 3. Communication Protocols & Inter-Service API Contracts

1. **Client to Backend**: Standard HTTP/1.1 REST APIs. Authorization via `Authorization: Bearer <JWT>` header. Content type: `application/json` (or `multipart/form-data` for resume file uploads).
2. **Backend to AI Service**: Server-to-server internal REST requests (`http://localhost:8000/api/v1/ai/...`). Backend includes standard request headers. Response format strictly validated JSON.
3. **AI Service to Gemini API**: Official `google-genai` Python SDK over TLS HTTPS. Uses environment configured model `GEMINI_MODEL` and API key `GEMINI_API_KEY`.

---

## 4. Fault Tolerance & Graceful Degradation Strategy

The system is designed with **Resilience-First Patterns**:

```
                  +--------------------------------+
                  |  Client Request to Backend     |
                  +--------------------------------+
                                  |
               Is AI Service / Gemini API available?
                                 / \
                                /   \
                        YES    /     \   NO / TIMEOUT
                              v       v
            +-------------------+   +------------------------------------+
            | Full AI Multi-    |   | Graceful Degradation Mode          |
            | Agent / RAG Output|   | - Deterministic Match Score (0-100)|
            +-------------------+   | - Rule-based Skill Gap Intersect   |
                                    | - Fallback Static Prep Guidance    |
                                    | - Informative UI Warning Banner    |
                                    +------------------------------------+
```

* **AI Service Offline**: If the Python service is unreachable, Spring Boot catches the `ResourceAccessException` / `HttpClientErrorException`, logs a warning, and returns standard deterministic responses. The React UI displays deterministic match scores with a badge: *"AI Insights temporarily in basic mode"*.
* **Gemini API Errors / Rate Limits**: The `GeminiService` implements retry logic with exponential backoff for transient errors, and catches JSON parsing failures via secondary correction prompts.
