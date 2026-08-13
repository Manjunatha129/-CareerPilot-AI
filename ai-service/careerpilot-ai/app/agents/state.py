from typing import TypedDict, List, Dict, Any, Optional

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

    # Extended Phase 10 fields
    career_direction: Dict[str, Any]
    profile_strength: Dict[str, Any]
    strong_skills: List[Dict[str, Any]]
    developing_skills: List[Dict[str, Any]]
    missing_skills_list: List[Dict[str, Any]]
    priority_skills: List[Dict[str, Any]]
    career_specific_skills: List[Dict[str, Any]]
    role_insights: List[Dict[str, Any]]
    career_gaps: Dict[str, Any]
    recommendations: List[Dict[str, Any]]
    roadmap: Dict[str, Any]
    project_intelligence: Dict[str, Any]

