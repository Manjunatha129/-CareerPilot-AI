# CareerPilot AI — Technical Interview & Architecture Guide

> **Master Technical Interview Reference**  
> *Prepared for final project presentation, technical defense, system design interviews, and engineering architecture walkthroughs.*

---

## 1. Executive Elevators & Project Summaries

### 30-Second Elevator Pitch
"CareerPilot AI is an enterprise-grade, multi-agent AI career intelligence and job application management platform. It unifies structured resume parsing, a deterministic 6-facet job-match engine (Skill 35%, Experience 20%, Education 10%, Location 10%, Semantic 15%, Preferences 10%), pgvector RAG interview preparation, a 5-agent LangGraph workflow, and an ATS application tracking board. Unlike opaque scanners or generic chatbots, CareerPilot AI provides transparent, evidence-grounded recommendations without hallucinating candidate qualifications."

### 1-Minute Project Overview
"Job seekers face significant challenges: fragmented portals, opaque automated screening, difficulty identifying technical skill gaps, and tracking applications on spreadsheets. CareerPilot AI solves this by unifying the entire candidate lifecycle into a single platform. Built with React 18, Spring Boot 3 (Java 21), PostgreSQL 16 with pgvector, and FastAPI with Python 3.11, the platform executes a deterministic mathematical match score, runs an evidence-based RAG knowledge pipeline over vector embeddings (gemini-embedding-2), orchestrates a stateful multi-agent system via LangGraph, and tracks applications across controlled ATS lifecycle states (SAVED to OFFER). All operations enforce strict user isolation and resilience-first fallbacks."

### 3-Minute Comprehensive Architecture Pitch
"Architecturally, CareerPilot AI is built on a 3-tier micro-component topology:
1. **Frontend Tier (React 18 + TypeScript + Vite + Tailwind)**: Provides a responsive SaaS client communicating with Spring Boot over REST APIs with JWT authentication.
2. **Backend Core Tier (Spring Boot 3.x + Java 21 + PostgreSQL 16)**: Handles core business logic, user security, deterministic job-matching, JPA persistence, and application ATS tracking. It delegates AI workloads via server-to-server REST calls to FastAPI.
3. **AI & Multi-Agent Tier (FastAPI + LangGraph + google-genai SDK)**: Runs a 5-agent state graph (Career Manager, Resume Agent, Job Agent, Skill Gap Agent, Career Planner) and pgvector cosine similarity search.

Crucially, we separate deterministic scoring from AI natural language explanations. The 6-facet match score is computed mathematically in Java/Python to prevent LLM score distortion. If the Gemini API or AI service is offline, the platform degrades gracefully by returning deterministic scores and structured fallbacks without crashing."

---

## 2. Technical Stack Justifications

| Component | Choice | Justification / Technical Rationale |
| :--- | :--- | :--- |
| **Backend Core** | **Spring Boot 3 (Java 21)** | Enterprise stability, robust dependency injection, strong type safety, Spring Security JWT isolation, and high-throughput JPA database transactions. |
| **AI Microservice**| **FastAPI (Python 3.11)** | Asynchronous performance, native compatibility with LangGraph, LangChain, PyPDF, and official `google-genai` SDK ecosystem. |
| **AI Engine** | **LangGraph Multi-Agent**| Stateful, graph-based agent orchestration enabling conditional routing, parallel node execution, typed state validation, and cycle management. |
| **LLM Provider** | **Google Gemini 2.5 Flash** | Fast inference latency, large context window, cost efficiency, and structured Pydantic schema generation capabilities. |
| **Vector DB** | **PostgreSQL 16 `pgvector`** | Eliminates dedicated vector database overhead (like Pinecone/Weaviate). Allows relational metadata and vector embeddings (768-dim) to exist in the same ACID database. |
| **Embedding Model** | **`gemini-embedding-2`** | High-precision 768-dimensional dense vector embeddings aligned with Gemini text models. |
| **Frontend** | **React 18 + TypeScript + Vite**| Component modularity, static type checking, fast Vite HMR build performance, and responsive Tailwind styling. |

---

## 3. Core Technical Subsystems & Deep Dives

### 3.1 Deterministic + AI Hybrid Job Matching Engine (Phase 7)
The match engine combines mathematical precision with generative natural language explanations:

$$\text{Final Match Score} = (S_{\text{skill}} \times 0.35) + (S_{\text{exp}} \times 0.20) + (S_{\text{edu}} \times 0.10) + (S_{\text{loc}} \times 0.10) + (S_{\text{sem}} \times 0.15) + (S_{\text{pref}} \times 0.10)$$

- **Rule 1**: The score is bounded between $0$ and $100\%$.
- **Rule 2**: Gemini API provides explanatory advice ONLY and NEVER overrides the mathematical match score.
- **Rule 3**: If Gemini fails or times out, the deterministic score and breakdown return cleanly with a fallback explanation notice.

### 3.2 Evidence-Grounded RAG Pipeline (Phase 8)
- Documents in `sample-data/knowledge-base/` are chunked (500 characters, 50-character overlap).
- Indexed as 768-dimensional dense vectors in PostgreSQL `document_chunks` using `gemini-embedding-2`.
- Retrived using cosine similarity:
  
$$\text{Similarity}(A, B) = \frac{A \cdot B}{\|A\| \|B\|}$$

- Strict anti-hallucination rule: If similarity is $<0.70$ or context is missing, the system explicitly responds: *"Knowledge Base context insufficient to answer this query accurately."*

### 3.3 LangGraph Multi-Agent Engine (Phase 9)
1. **Career Manager Node**: Parses user query intent and routes state.
2. **Resume Intelligence Node**: Extracts and normalizes profile evidence.
3. **Job Intelligence Node**: Extracts role requirements and domain expectations.
4. **Skill Gap Node**: Performs set-difference analysis ($S_{\text{job}} \setminus S_{\text{candidate}}$).
5. **Career Planner Node**: Generates a 3-tier, 6-stage roadmap (Immediate, Short-Term, Medium-Term).

### 3.4 ATS Application Management & Dashboard (Phase 11)
- Application lifecycle state machine: `SAVED` → `APPLIED` → `SCREENING` → `INTERVIEW` → `OFFER` → `ACCEPTED` / `REJECTED` / `WITHDRAWN`.
- Status transition audit history logged atomically in `ApplicationStatusHistory`.
- Non-destructive deletion: Deleting an application removes tracking data without affecting the underlying `Job` posting.
- Deterministic job-search metrics (interview rate %, offer conversion %, avg match score).

---

## 4. Technical Interview Questions & Answers

### Backend & Security (Spring Boot / Java)
**Q: How is user isolation enforced across the application?**  
*A: User isolation is enforced at the Security Context layer. Authentication tokens (JWT Bearer) are validated on every request by Spring Security. Controllers retrieve the authenticated email via `SecurityContextHolder.getContext().getAuthentication().getName()` and query records filtering strictly by `user_id`. Controllers never trust client-supplied user IDs in request bodies or path variables.*

**Q: Why use BCrypt for password hashing instead of SHA-256?**  
*A: SHA-256 is a fast cryptographic hash function vulnerable to brute-force and GPU-accelerated rainbow table attacks. BCrypt incorporates a configurable work factor (cost) and automatic salt generation, rendering brute-force attacks computationally infeasible.*

### Database & Vector Search (PostgreSQL + pgvector)
**Q: Why use `pgvector` inside PostgreSQL instead of a specialized vector database like Pinecone?**  
*A: Using `pgvector` allows relational tables (`users`, `jobs`, `applications`) and vector embeddings (`document_chunks`) to reside in a single PostgreSQL database. This simplifies infrastructure, eliminates dual-database sync latency, supports transactional consistency (ACID), and reduces operational costs.*

**Q: What index type is used for vector search?**  
*A: HNSW (Hierarchical Navigable Small World) index with `vector_cosine_ops` (`m=16, ef_construction=64`). HNSW offers logarithmic query time complexity $O(\log N)$ for approximate nearest neighbor search.*

### AI & Multi-Agent Architecture (LangGraph + Gemini)
**Q: How do you prevent LLM hallucinations in candidate recommendations?**  
*A: We enforce a 3-layer anti-hallucination defense: (1) Skill set-difference calculation is executed deterministically in Python/Java code before sending data to Gemini; (2) RAG retrieval enforces a minimum cosine similarity threshold ($>0.70$) with required source citations; (3) Pydantic schemas enforce typed output validation.*

**Q: What happens if the Gemini API service is down or rate-limited?**  
*A: The system implements resilient fallback paths. The backend detects HTTP timeouts/503 errors and serves deterministic score breakdowns, fallback career advice, and pre-computed roadmap structures directly from Spring Boot/PostgreSQL.*
