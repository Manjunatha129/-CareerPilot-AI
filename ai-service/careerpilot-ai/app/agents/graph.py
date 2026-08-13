from langgraph.graph import StateGraph, START, END
from app.agents.state import CareerAgentState
from app.agents.nodes import (
    career_manager_node,
    resume_intelligence_node,
    job_intelligence_node,
    skill_gap_node,
    career_planner_node
)

def route_from_manager(state: CareerAgentState) -> str:
    """Conditional router: Directs workflow based on query intent."""
    query = state.get("query", "").lower()
    # If pure knowledge query without career planning intent, route directly to planner
    if ("what is" in query or "explain" in query) and "missing" not in query and "plan" not in query and "ready" not in query:
        return "career_planner"
    return "resume_intelligence"

def build_career_graph():
    workflow = StateGraph(CareerAgentState)

    # 1. Add Agent Nodes
    workflow.add_node("career_manager", career_manager_node)
    workflow.add_node("resume_intelligence", resume_intelligence_node)
    workflow.add_node("job_intelligence", job_intelligence_node)
    workflow.add_node("skill_gap", skill_gap_node)
    workflow.add_node("career_planner", career_planner_node)

    # 2. Add Edges & Conditional Routing
    workflow.add_edge(START, "career_manager")

    workflow.add_conditional_edges(
        "career_manager",
        route_from_manager,
        {
            "resume_intelligence": "resume_intelligence",
            "career_planner": "career_planner"
        }
    )

    workflow.add_edge("resume_intelligence", "job_intelligence")
    workflow.add_edge("job_intelligence", "skill_gap")
    workflow.add_edge("skill_gap", "career_planner")
    workflow.add_edge("career_planner", END)

    return workflow.compile()

career_workflow_app = build_career_graph()
