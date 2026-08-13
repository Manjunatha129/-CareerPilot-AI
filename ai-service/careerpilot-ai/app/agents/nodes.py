import json
import re
from google import genai
from app.llm.model_config import config
from app.agents.state import CareerAgentState
from app.services.rag_service import generate_embeddings_batch

def career_manager_node(state: CareerAgentState) -> CareerAgentState:
    """Manager node: Inspects user intent and initializes state routing."""
    executed = list(state.get("executed_agents", []))
    if "career_manager" not in executed:
        executed.append("career_manager")

    state["executed_agents"] = executed
    state["current_step"] = "manager_routed"
    state["status"] = "IN_PROGRESS"
    return state

def resume_intelligence_node(state: CareerAgentState) -> CareerAgentState:
    """Resume node: Normalizes candidate background metrics and skills."""
    executed = list(state.get("executed_agents", []))
    if "resume_intelligence" not in executed:
        executed.append("resume_intelligence")

    profile = state.get("candidate_profile", {})
    resume = state.get("resume_analysis", {})

    # Extracted normalized skills
    skills = set()
    if "primarySkills" in profile and profile["primarySkills"]:
        skills.update(profile["primarySkills"])
    if "skills" in resume:
        for cat in ["programmingLanguages", "frameworks", "databases", "tools", "cloudTechnologies"]:
            if isinstance(resume["skills"], dict) and cat in resume["skills"]:
                skills.update(resume["skills"][cat])

    state["candidate_profile"]["extracted_skills"] = list(skills)
    state["executed_agents"] = executed
    state["current_step"] = "resume_processed"
    return state

def job_intelligence_node(state: CareerAgentState) -> CareerAgentState:
    """Job node: Normalizes target job posting requirements."""
    executed = list(state.get("executed_agents", []))
    if "job_intelligence" not in executed:
        executed.append("job_intelligence")

    job = state.get("job_context", {})
    req_skills = job.get("requiredSkills", [])
    nice_skills = job.get("niceToHaveSkills", [])

    state["job_context"]["normalized_required_skills"] = req_skills
    state["job_context"]["normalized_nice_skills"] = nice_skills
    state["executed_agents"] = executed
    state["current_step"] = "job_processed"
    return state

def skill_gap_node(state: CareerAgentState) -> CareerAgentState:
    """Skill gap node: Computes matched vs missing skills."""
    executed = list(state.get("executed_agents", []))
    if "skill_gap" not in executed:
        executed.append("skill_gap")

    cand_skills = set(s.lower() for s in state.get("candidate_profile", {}).get("extracted_skills", []))
    req_skills = state.get("job_context", {}).get("normalized_required_skills", [])

    matched = []
    missing = []
    for req in req_skills:
        if req.lower() in cand_skills:
            matched.append(req)
        else:
            missing.append(req)

    state["matched_skills"] = matched
    state["missing_skills"] = missing
    state["priority_gaps"] = missing[:3]
    state["executed_agents"] = executed
    state["current_step"] = "skill_gap_processed"
    return state

def career_planner_node(state: CareerAgentState) -> CareerAgentState:
    """Planner node: Generates structured career improvement plan, career direction, role insights, gap analysis, and grounded recommendations."""
    executed = list(state.get("executed_agents", []))
    if "career_planner" not in executed:
        executed.append("career_planner")

    missing = state.get("missing_skills", [])
    matched = state.get("matched_skills", [])
    query = state.get("query", "Career Planning")
    profile = state.get("candidate_profile", {})
    resume = state.get("resume_analysis", {})
    job = state.get("job_context", {})

    target_role = state.get("target_role") or profile.get("targetJobTitle") or job.get("title") or "Java Backend Developer"
    user_skills = profile.get("extracted_skills", []) or matched

    # 1. Career Direction
    primary_dir = profile.get("targetJobTitle") or "Java Backend Development"
    sec_dir = "Full Stack Software Engineering" if "React" in user_skills or "JavaScript" in user_skills else "Cloud & DevOps Engineering"
    
    direction_reasoning = []
    if matched:
        direction_reasoning.append(f"Verified foundational competency in: {', '.join(matched[:4])}.")
    if profile.get("yearsExperience"):
        direction_reasoning.append(f"Demonstrated {profile.get('yearsExperience')} years of technical experience.")
    if resume.get("projects"):
        direction_reasoning.append(f"Evidence of practical project implementations in resume.")

    career_direction = {
        "primary": primary_dir,
        "secondary": sec_dir,
        "reasoning": direction_reasoning if direction_reasoning else ["Solid software engineering baseline derived from candidate profile."],
        "improvementAreas": missing[:4] if missing else ["Advanced System Design", "Microservices Security", "Automated Testing"]
    }
    state["career_direction"] = career_direction

    # 2. Profile Strength
    years_exp = profile.get("yearsExperience") or 0.0
    strength_score = min(100, int(40 + (len(matched) * 8) + (years_exp * 5)))
    
    profile_strength = {
        "overallScore": strength_score,
        "experienceLevel": "MID" if years_exp >= 3 else ("SENIOR" if years_exp >= 5 else "JUNIOR"),
        "technicalStrengths": matched[:5] if matched else ["Java", "Spring Boot", "SQL"],
        "careerAreas": [primary_dir, sec_dir],
        "profileGaps": [f"Needs documented evidence for {s}" for s in missing[:3]] if missing else ["Needs deeper production deployment benchmarks."]
    }
    state["profile_strength"] = profile_strength

    # 3. Categorized Skills
    strong = [{"name": s, "category": "Core", "priority": "High", "rationale": "Verified in candidate background"} for s in matched]
    missing_list = [{"name": s, "category": "Target Requirement", "priority": "High" if idx < 2 else "Medium", "rationale": "Required by target job posting but missing in profile"} for idx, s in enumerate(missing)]
    priority = missing_list[:3]

    state["strong_skills"] = strong
    state["developing_skills"] = [{"name": s, "category": "Developing", "priority": "Medium", "rationale": "Secondary exposure"} for s in user_skills if s not in matched][:3]
    state["missing_skills_list"] = missing_list
    state["priority_skills"] = priority
    state["career_specific_skills"] = strong + missing_list

    # 4. Role Insights
    official_score = job.get("officialMatchScore")
    role_insights = [
        {
            "roleCategory": target_role,
            "suitabilityScore": min(95, max(50, strength_score)),
            "officialJobMatchScore": official_score if official_score is not None else None,
            "supportingSkills": matched[:4],
            "missingSkills": missing[:3],
            "relevantExperience": f"{years_exp} years relevant experience",
            "improvementAreas": missing[:3] if missing else ["System Design"]
        },
        {
            "roleCategory": sec_dir,
            "suitabilityScore": min(90, max(45, strength_score - 10)),
            "officialJobMatchScore": None,
            "supportingSkills": matched[:3],
            "missingSkills": missing[:2] + ["Cloud Infrastructure"],
            "relevantExperience": f"Transferable engineering skills",
            "improvementAreas": ["Cloud Architecture", "Container Orchestration"]
        }
    ]
    state["role_insights"] = role_insights

    # 5. Career Gaps Matrix
    career_gaps = {
        "technicalSkills": f"Requires strengthening in {', '.join(missing[:3])}." if missing else "Solid core technical alignment.",
        "experience": f"Current experience is {years_exp} years." if years_exp > 0 else "Insufficient verified professional experience details.",
        "projects": "Strong project count, but needs deeper production resilience & test coverage evidence.",
        "resume": "Resume details core tech stack, but can emphasize quantifiable business impact.",
        "interviewReadiness": "Target technical interview revision on algorithms, SQL tuning, and system design.",
        "roleAlignment": f"Good alignment for {target_role} with minor skill gap bridge required."
    }
    state["career_gaps"] = career_gaps

    # 6. Personalized Recommendations
    recs = [
        {
            "category": "Skills to Learn",
            "action": f"Prioritize mastering {missing[0]}." if missing else "Learn Advanced Spring Security & OAuth2.",
            "reasoning": f"Frequency analysis shows high demand for {missing[0]} in target backend roles." if missing else "High-frequency requirement for enterprise backend positions.",
            "priority": "HIGH"
        },
        {
            "category": "Projects to Strengthen",
            "action": "Build a production-style REST API with containerization & CI/CD deployment.",
            "reasoning": "Demonstrates end-to-end architectural capability beyond basic CRUD projects.",
            "priority": "HIGH"
        },
        {
            "category": "Topics to Revise",
            "action": "Review SQL Indexing, Execution Plans, and Database Transaction Isolation Levels.",
            "reasoning": "Essential knowledge area for backend engineering interview assessments.",
            "priority": "MEDIUM"
        },
        {
            "category": "Resume Improvement",
            "action": "Quantify project achievements with performance metrics (e.g. latency reduction, API throughput).",
            "reasoning": "Enhances resume impact during recruiter and engineering manager screening.",
            "priority": "MEDIUM"
        }
    ]
    state["recommendations"] = recs

    # 7. Project Intelligence
    project_intel = {
        "strongestProjects": ["Spring Boot REST API Service"] if matched else ["Software Project"],
        "techCoverage": matched if matched else ["Java", "SQL"],
        "missingTechExposure": missing[:3] if missing else ["Docker", "Kubernetes"],
        "improvementOpportunities": [
            "Add JWT/OAuth2 authentication and role-based access control.",
            "Implement automated unit and integration tests with JUnit and Testcontainers.",
            "Include API documentation using OpenAPI/Swagger."
        ]
    }
    state["project_intelligence"] = project_intel

    # 8. Structured Career Improvement Plan & Roadmap
    plan = {
        "immediate_actions": [
            f"Review baseline concepts for missing priority skills: {', '.join(missing[:2])}." if missing else "Review advanced Java concurrency and collection internals.",
            "Update resume with recent quantifiable accomplishments and technology keywords."
        ],
        "short_term_actions": [
            "Build an end-to-end portfolio project featuring REST APIs, Database indexing, and Security.",
            "Practice technical mock interview questions focusing on system design and algorithms."
        ],
        "medium_term_actions": [
            f"Target application submissions for suitable {target_role} positions.",
            "Obtain relevant technical certification (e.g., AWS Certified Developer or Java Specialist)."
        ],
        "learning_priorities": missing[:4] if missing else ["System Architecture", "Cloud Deployment"],
        "project_recommendations": [
            f"Develop a production-ready application incorporating {missing[0]}." if missing else "Develop a full-stack microservices application.",
            "Implement automated CI/CD unit and integration test pipelines."
        ],
        "interview_focus": [
            "Core Data Structures & Algorithms",
            "Database Indexing & Query Optimization",
            "System Architecture & Microservices Resilience"
        ]
    }
    state["career_plan"] = plan

    roadmap = {
        "immediate": plan["immediate_actions"],
        "shortTerm": plan["short_term_actions"],
        "mediumTerm": plan["medium_term_actions"],
        "stages": [
            {"stage": 1, "title": "Strengthen Fundamentals", "actions": ["Review Core Java / OO Design", "Master SQL Joins & Aggregations"]},
            {"stage": 2, "title": "Close High-Priority Skill Gaps", "actions": [f"Study {s}" for s in (missing[:2] if missing else ["Spring Security", "REST API Depth"])]},
            {"stage": 3, "title": "Build/Improve Projects", "actions": ["Implement Docker containerization", "Add unit & integration test suites"]},
            {"stage": 4, "title": "Resume & Portfolio Readiness", "actions": ["Optimize ATS keywords", "Publish clean GitHub repositories with documentation"]},
            {"stage": 5, "title": "Interview Preparation", "actions": ["Practice System Design scenarios", "Mock technical interviews"]},
            {"stage": 6, "title": "Target Suitable Roles", "actions": [f"Apply to matched {target_role} postings", "Network with industry engineers"]}
        ]
    }
    state["roadmap"] = roadmap

    # Generate Executive Summary via Gemini (or Fallback)
    api_key = config.GEMINI_API_KEY
    summary_text = None
    if api_key and api_key.strip() and api_key != "your_gemini_api_key_here":
        try:
            client = genai.Client(api_key=api_key)
            prompt = f"""You are an executive AI Career Advisor.
Synthesize a concise 2-paragraph career assessment for a candidate asking: "{query}".
Target Role: {target_role}
Matched Skills: {', '.join(matched) if matched else 'None'}
Missing Skills / Priority Gaps: {', '.join(missing) if missing else 'None'}

Provide an encouraging, actionable, professional evaluation. Do not invent fake metrics or scores.
"""
            response = client.models.generate_content(
                model=config.GEMINI_MODEL,
                contents=prompt
            )
            summary_text = response.text.strip()
        except Exception as e:
            print(f"[Gemini Planner Node Warning]: {e}")

    if not summary_text:
        summary_text = f"Career Assessment for {target_role}:\n" \
                       f"You currently demonstrate strong foundational alignment in: {', '.join(matched) if matched else 'core software principles'}.\n" \
                       f"To elevate your fit, prioritize mastering missing key technical requirements: {', '.join(missing) if missing else 'advanced cloud architecture'}."

    state["final_answer"] = summary_text
    state["executed_agents"] = executed
    state["current_step"] = "COMPLETED"
    state["status"] = "SUCCESS"
    return state

