# Project Overview: CareerPilot AI

## 1. Project Title & Vision
**CareerPilot AI**: Multi-Agent AI Career & Job Intelligence Platform.

**Vision**: Build a unified, enterprise-grade intelligent career platform designed specifically for students, fresh graduates, entry-level job seekers, and early-career professionals. CareerPilot AI bridges the gap between fragmented job search workflows, opaque ATS screening algorithms, and unstructured skill development by unifying profile creation, resume parsing, job ingestion, hybrid match scoring, skill-gap analysis, personalized learning pathways, RAG-grounded career assistance, and application tracking into a single, cohesive software product.

---

## 2. Core Problem Statement
Job seekers currently navigate a fragmented ecosystem:
1. **Tool Proliferation**: Searching multiple job portals (LinkedIn, Indeed, Glassdoor), manually reviewing long job descriptions (JDs), using separate resume builders, seeking interview prep materials on disparate platforms, and tracking applications manually on spreadsheets.
2. **Opacity of Matching**: Job boards provide opaque "Match Percentages" without breaking down why a candidate is or isn't a fit. Candidates are left guessing what skills or experiences are missing.
3. **Lack of Actionable Guidance**: Generic AI chatbots produce ungrounded, generic resume tips or hallucinations without considering actual market requirements or the candidate's exact background.
4. **Time & Effort Overhead**: Re-formatting resumes, writing tailored cover letters, identifying course recommendations, and tracking application statuses across dozens of companies is repetitive and exhausting.

---

## 3. The Proposed Solution & Value Proposition
CareerPilot AI unifies the end-to-end job application lifecycle into one intelligent workflow.

> **Core Value Proposition**:  
> *"Understand the candidate, understand the job, explain the match, identify what is missing, recommend what to learn, and prepare the candidate for the opportunity."*

### Key Innovations
* **Deterministic + Semantic Hybrid Match Engine**: Job-match scores are NOT left to raw LLM guesses. A deterministic math engine calculates a transparent 0-100 score based on 6 weighted facets (Skill Match 35%, Experience 20%, Education 10%, Location 10%, Semantic JD Match 15%, User Preferences 10%), paired with Gemini-driven natural language explanations.
* **LangGraph Multi-Agent Workflows**: A team of specialized autonomous agents (Planner, Resume Analyzer, JD Analyzer, Matcher, Skill Gap Analyzer, Learning Advisor, Interview Coach, Resume Optimizer) collaborate to execute multi-step career guidance.
* **Evidence-Grounded RAG Pipeline**: Uses PostgreSQL + `pgvector` and Google Gemini API to query an indexed repository of company insights, verified interview questions, resume guidelines, and learning resources—eliminating AI hallucinations.
* **Source-Agnostic Job Ingestion Architecture**: Normalizes, validates, and deduplicates job postings from multiple sources (seed dataset, JSON imports, public APIs) into a unified PostgreSQL schema.
* **Full-Stack SaaS UX/UI**: Clean modern design built with React, TypeScript, Tailwind CSS, and Recharts—featuring dark/light neutral gray tones with energetic orange accents (`#F97316`), structured cards, interactive radar charts, and kanban application tracking.

---

## 4. Target Users
* **Primary Users**: Final-year undergraduate/graduate students, fresh graduates, entry-level job seekers, and early-career professionals (0–3 years experience).
* **Secondary/Future Users**: College placement cells, university career guidance centers, bootcamp training organizations, and independent career coaches.

---

## 5. End-to-End Core User Product Flow
```
Landing Page
   ↓
Register / Login (JWT Authentication)
   ↓
Career Profile Setup (Target roles, locations, preferences)
   ↓
Upload & Parse Resume (PDF/DOCX extraction & structure analysis)
   ↓
Executive Dashboard (Metrics, recommended jobs, quick actions)
   ↓
Job Search & Recommendations (Hybrid filter & match scoring)
   ↓
Select Specific Job & Detailed Description Analysis
   ↓
Explainable Job-Match Score (6-facet radar chart & breakdown)
   ↓
Matched vs. Missing Skills Identification
   ↓
Skill Gap Analysis & Targeted Learning Recommendations
   ↓
Job-Specific Interview Question Generation (RAG-backed)
   ↓
Targeted Resume Optimization Suggestions
   ↓
Save / Track Application (Kanban pipeline: SAVED → APPLIED → INTERVIEW → OFFER)
   ↓
RAG-Powered AI Career Assistant (Context-aware career Q&A)
```

---

## 6. Technology Stack Overview

| Layer | Technology | Key Responsibility |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Axios, Recharts | Interactive SaaS UI, client routing, match visualizers, Kanban boards |
| **Backend API** | Java 21, Spring Boot 3.x, Maven, Spring Security, JWT, JPA/Hibernate, Lombok | Authentication, user profiles, business rules, job ingestion, deterministic matching |
| **Database** | PostgreSQL 16 + `pgvector` extension | Relational storage (users, jobs, applications) + 768-dim vector embeddings |
| **AI Microservice** | Python 3.11+, FastAPI, LangGraph, LangChain, Google GenAI SDK (`google-genai`) | Multi-agent orchestration, RAG retrieval, Gemini LLM prompts, Pydantic validation |
| **LLM Provider** | Google Gemini API (`gemini-2.5-flash` configured via environment variables) | Structured JSON extraction, skill gap reasoning, interview prep, assistant responses |

---

## 7. Non-Negotiable System Principles & Ethics
1. **No Docker / Local Development Native**: Runs natively on Windows/macOS/Linux using JDK 21, Node.js 18+, Python 3.11+, and PostgreSQL.
2. **Strict Server-Side Gemini API Key Containment**: API keys never reach the frontend bundle.
3. **No Hallucinated Candidate Credentials**: AI is strictly constrained to candidate-verified data.
4. **Deterministic Score Integrity**: Match scores are mathematical and explainable, never arbitrary LLM text outputs.
5. **No Automated Application Submission**: Application actions require human authorization.
