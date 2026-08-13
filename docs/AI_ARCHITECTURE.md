# AI Service & Gemini Integration Architecture - CareerPilot AI

## 1. Centralized Gemini Client Architecture

All AI capabilities interface with Google's Gemini API via an encapsulated service layer (`app/llm/`). Lower-level code does NOT instantiate raw API calls directly.

```
+-------------------------------------------------------------------------+
|                        FastAPI Endpoints / Agents                       |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                            GeminiService                                |
|  - Prompts management & formatting                                      |
|  - Structured output parsing & Pydantic validation                      |
|  - Retry logic & fallback error handling                                |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                            GeminiClient                                 |
|  - Singleton Client initialization via `google-genai` SDK               |
|  - Configurable model parameter (`GEMINI_MODEL`)                        |
|  - API Key injection from environment (`GEMINI_API_KEY`)                |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                         Google Gemini API Cloud                         |
+-------------------------------------------------------------------------+
```

### Key Python Module Structure:
```
ai-service/careerpilot-ai/app/llm/
├── gemini_client.py   # Manages google-genai client connection
├── gemini_service.py  # High-level domain AI operations
├── model_config.py    # Environment settings (GEMINI_MODEL, EMBEDDING_MODEL=gemini-embedding-2, max_tokens, temp)
└── prompts/           # System prompt templates
    ├── resume_prompts.py
    ├── jd_prompts.py
    ├── match_prompts.py
    ├── interview_prompts.py
    └── assistant_prompts.py
```

---

## 2. Structured Pydantic Output Validation & Resilience

To prevent LLM formatting unpredictability, all Gemini requests specify structured JSON outputs validated against strict Pydantic v2 schemas:

1. **`ResumeAnalysisResponse`**: List of extracted technical/soft skills, total calculated experience, education list, project breakdown, and formatting feedback points.
2. **`JobDescriptionAnalysisResponse`**: Key requirements list, mandatory vs preferred skills, experience tier, job domain.
3. **`MatchExplanationResponse`**: Overall summary, key strengths list, key qualification gaps list, actionable tips.
4. **`InterviewQuestionsResponse`**: List of questions broken down into `TECHNICAL`, `BEHAVIORAL`, `SYSTEM_DESIGN`, `SITUATIONAL` with guidance hints.
5. **`ResumeOptimizationResponse`**: Specific bullet-point rewrite suggestions comparing original resume text with target job keywords.

### Validation Retry Mechanism:
```
Gemini Response -> Pydantic Schema Validation
      |
      |-- Valid JSON --> Return Response Data
      |
      +-- JSON Invalid / Schema Error
              |
              v
       Retry with Schema Correction Prompt (Max 2 Attempts)
              |
              |-- Success --> Return Response Data
              |-- Fail    --> Controlled Fallback Error Response
```

---

## 3. Hybrid Deterministic + AI Match Engine Formulation

Match scores are calculated mathematically in Spring Boot (or deterministic Python module) to ensure **100% explainability and consistency**.

### Weighting Breakdown:

$$\text{Final Score} = w_{\text{skill}} S + w_{\text{exp}} E + w_{\text{edu}} D + w_{\text{loc}} L + w_{\text{sem}} M_{\text{sem}} + w_{\text{pref}} P$$

| Component | Weight ($w$) | Metric Calculation Method |
|---|---|---|
| **Skill Match ($S$)** | **35%** | Jaccard / Overlap similarity between candidate skills and required job skills: $\frac{|\text{CandidateSkills} \cap \text{JobRequiredSkills}|}{|\text{JobRequiredSkills}|}$ |
| **Experience Match ($E$)** | **20%** | Ratio of candidate experience years to job required experience years (capped at 1.0). |
| **Education Match ($D$)** | **10%** | Ordinal tier match (Bachelors=1, Masters=2, PhD=3). 1.0 if candidate level $\ge$ job requirement. |
| **Location / Mode Match ($L$)** | **10%** | 1.0 for Remote or Exact City Match; 0.5 for Same State/Region; 0.0 otherwise. |
| **Semantic JD Match ($M_{\text{sem}}$)**| **15%** | Cosine similarity between resume text vector embedding and job description vector embedding. |
| **User Preference Match ($P$)**| **10%** | Alignment with candidate target title and minimum expected salary threshold. |

Gemini's role in matching is strictly **explanatory**—translating these calculated numerical scores into clear, encouraging natural language advice.

---

## 4. Anti-Hallucination Guardrails
1. **Strict Context Constraints**: Prompts instruct Gemini: *"You are an objective career advisor. Rely ONLY on the candidate profile and job description provided. Do NOT fabricate skills, certifications, or work experience."*
2. **Explicit Null Indicators**: If a candidate resume lacks education or years of experience, the structured output returns `null` or empty arrays rather than guessing.

---

## 5. Phase 10 Career Intelligence Layer Architecture

The Phase 10 Career Intelligence Engine acts as the top-level synthesis layer over candidate profile, resume intelligence, job dataset requirements, Phase 7 official match results, Phase 8 RAG knowledge, and Phase 9 LangGraph multi-agent execution.

### Key Capabilities:
- **Career Profile Intelligence**: Structured representation of strength, experience level, and gaps. Explicitly represents unavailable data as `null` or `Insufficient data`.
- **Role Intelligence**: Categorized role suitability (Java Backend, Full Stack, Cloud, etc.) grounded by **OFFICIAL JOB MATCH SCORE** (Phase 7 formula) vs **CAREER INTELLIGENCE INSIGHT**.
- **Skill Prioritization Mechanism**: Transparent categorization (Strong, Developing, Missing, High-Priority, Career-Specific) based on job dataset frequency, candidate skill gaps, and target role prerequisites.
- **Career Gap Analysis**: 6-dimension evaluation across Technical Skills, Experience, Projects, Resume, Interview Readiness, and Role Alignment.
- **Personalized Recommendations & 3-Tier Roadmap**: Immediate, Short-Term, and Medium-Term stages (1 to 6) providing grounded, actionable guidance.
- **Project Intelligence**: Evaluation of existing candidate projects, tech coverage, missing tech exposure, and recommended depth improvements.

