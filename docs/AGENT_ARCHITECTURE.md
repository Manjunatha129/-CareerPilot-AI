# Multi-Agent Workflow Architecture - CareerPilot AI

## 1. LangGraph Multi-Agent Orchestration Framework

CareerPilot AI uses **LangGraph** to coordinate multi-step autonomous workflows across specialized AI agents. Rather than using a single monolithic prompt, tasks are distributed to domain-specific agents operating on a shared state.

```
                                USER REQUEST
                                     |
                                     v
                        +--------------------------+
                        |   Career Manager Agent   |
                        |   (Router & Supervisor)  |
                        +--------------------------+
                                     |
                                     v
                        +--------------------------+
                        |      Planner Agent       |
                        | (Workflow Execution Plan)|
                        +--------------------------+
                                     |
     +-------------------------------+-------------------------------+
     |                               |                               |
     v                               v                               v
+------------------+        +------------------+        +------------------+
| Resume Analysis  |        | Job Research     |        |   JD Analysis    |
| Agent            |        | Agent            |        |   Agent          |
+------------------+        +------------------+        +------------------+
     |                               |                               |
     +-------------------------------+-------------------------------+
                                     |
                                     v
                        +--------------------------+
                        |      Matching Agent      |
                        |  (Hybrid Match & Reasoning|
                        +--------------------------+
                                     |
     +-------------------------------+-------------------------------+
     |                               |                               |
     v                               v                               v
+------------------+        +------------------+        +------------------+
| Skill Gap Agent  |        | Learning Agent   |        | Interview Agent  |
+------------------+        +------------------+        +------------------+
     |                               |                               |
     +-------------------------------+-------------------------------+
                                     |
                                     v
                        +--------------------------+
                        |  Resume Optimization    |
                        |  Agent                   |
                        +--------------------------+
                                     |
                                     v
                        +--------------------------+
                        |  Recommendation Agent    |
                        |  (Final Career Roadmap)  |
                        +--------------------------+
```

---

## 2. Inventory of Specialized Agents

1. **Career Manager Agent (Supervisor)**: Orchestrates the overall session, receives user goals, and routes control flow between specialized child agents.
2. **Planner Agent**: Evaluates the candidate's input state and constructs an execution sequence plan.
3. **Resume Analysis Agent**: Extracts structured technical skills, experience metrics, projects, and formatting quality scores from uploaded resumes.
4. **Job Research Agent**: Fetches and filters normalized job postings matching the candidate's initial criteria from the PostgreSQL job repository.
5. **JD Analysis Agent**: Deeply parses target job descriptions into mandatory skills, nice-to-have skills, experience tiers, and key responsibilities.
6. **Matching Agent**: Merges deterministic scoring metrics with Gemini semantic evaluation to generate explainable match breakdowns.
7. **Skill Gap Agent**: Performs set-difference analysis between candidate skills and job requirements to pinpoint critical skill deficiencies.
8. **Learning Agent**: Maps identified skill gaps to verified courses, tutorials, and project ideas from the learning resources repository.
9. **Interview Agent**: Generates job-tailored technical, behavioral, and situational interview questions with RAG-retrieved answer hints.
10. **Resume Optimization Agent**: Suggests targeted resume bullet-point modifications to align candidate achievements with target job keywords.
11. **Recommendation Agent**: Synthesizes output from all agents into a unified, actionable career roadmap.

---

## 3. Shared State Schema (`CareerAgentState`)

LangGraph nodes pass and mutate a strongly-typed Python `TypedDict` state dictionary:

```python
class CareerAgentState(TypedDict):
    user_id: Optional[int]
    query: str
    target_role: Optional[str]
    candidate_profile: Dict[str, Any]
    resume_analysis: Dict[str, Any]
    job_context: Dict[str, Any]
    matched_skills: List[str]
    missing_skills: List[str]
    priority_gaps: List[str]
    career_plan: Dict[str, Any]
    retrieved_knowledge: List[Dict[str, Any]]
    executed_agents: List[str]
    failed_agents: List[str]
    current_step: str
    status: str
    final_answer: str
```

---

## 4. Phase 9 Multi-Agent Graph Topology

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
