import pytest
from app.agents.state import CareerAgentState
from app.agents.graph import career_workflow_app, route_from_manager
from app.agents.nodes import (
    career_manager_node,
    resume_intelligence_node,
    job_intelligence_node,
    skill_gap_node,
    career_planner_node
)

def test_conditional_routing():
    # Knowledge question -> career_planner directly
    state_know: CareerAgentState = {"query": "What is dependency injection?"}
    assert route_from_manager(state_know) == "career_planner"

    # Career assessment question -> resume_intelligence first
    state_career: CareerAgentState = {"query": "What skills am I missing for Java developer roles?"}
    assert route_from_manager(state_career) == "resume_intelligence"

def test_langgraph_full_workflow_execution():
    initial_state: CareerAgentState = {
        "user_id": 1,
        "query": "Am I ready for Java Backend Developer roles?",
        "target_role": "Junior Java Developer",
        "candidate_profile": {"primarySkills": ["Java", "SQL"]},
        "resume_analysis": {"skills": {"frameworks": ["Spring Boot"]}},
        "job_context": {
            "title": "Junior Java Developer",
            "requiredSkills": ["Java", "Spring Boot", "Docker", "PostgreSQL"]
        },
        "matched_skills": [],
        "missing_skills": [],
        "priority_gaps": [],
        "career_plan": {},
        "retrieved_knowledge": [],
        "executed_agents": [],
        "failed_agents": [],
        "current_step": "START",
        "status": "INIT",
        "final_answer": ""
    }

    final_state = career_workflow_app.invoke(initial_state)

    assert final_state["status"] == "SUCCESS"
    assert "career_manager" in final_state["executed_agents"]
    assert "resume_intelligence" in final_state["executed_agents"]
    assert "job_intelligence" in final_state["executed_agents"]
    assert "skill_gap" in final_state["executed_agents"]
    assert "career_planner" in final_state["executed_agents"]

    assert "Docker" in final_state["missing_skills"]
    assert "PostgreSQL" in final_state["missing_skills"]
    assert "Java" in final_state["matched_skills"]
    assert len(final_state["career_plan"]["immediate_actions"]) > 0

def test_no_chain_of_thought_leakage():
    state: CareerAgentState = {
        "user_id": 1,
        "query": "Assess my fit for backend developer",
        "candidate_profile": {"primarySkills": ["Java"]},
        "resume_analysis": {},
        "job_context": {"title": "Backend Dev", "requiredSkills": ["Java", "Redis"]},
        "executed_agents": [],
        "failed_agents": [],
        "current_step": "START",
        "status": "INIT",
        "final_answer": ""
    }
    final_state = career_workflow_app.invoke(state)
    assert len(final_state["final_answer"]) > 20
    assert "Java" in final_state["final_answer"]
    assert "RAG_SYSTEM_PROMPT" not in final_state["final_answer"]
    assert "System:" not in final_state["final_answer"]
