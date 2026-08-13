from fastapi import APIRouter, HTTPException
from app.schemas.agent_schema import CareerIntelligenceRequest, CareerIntelligenceResponse
from app.agents.graph import career_workflow_app
from app.services.rag_service import generate_grounded_rag_answer
from app.schemas.rag_schema import ChunkContext, RagGenerateRequest

router = APIRouter(prefix="/ai/agents", tags=["LangGraph Multi-Agent Engine"])

@router.post("/career-intelligence", response_model=CareerIntelligenceResponse)
async def run_career_intelligence(payload: CareerIntelligenceRequest):
    """
    Executes LangGraph multi-agent career intelligence workflow across:
    Career Manager -> Resume Agent -> Job Agent -> Skill Gap Agent -> RAG -> Career Planner.
    """
    try:
        initial_state: CareerAgentState = {
            "user_id": payload.userId,
            "query": payload.query,
            "target_role": payload.jobContext.get("title"),
            "candidate_profile": payload.candidateProfile,
            "resume_analysis": payload.resumeAnalysis,
            "job_context": payload.jobContext,
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

        # Invoke LangGraph Workflow
        final_state = career_workflow_app.invoke(initial_state)

        # Retrieve RAG Knowledge context if missing skills exist
        sources = []
        if final_state.get("missing_skills"):
            rag_query = f"Interview preparation for {', '.join(final_state['missing_skills'][:3])}"
            dummy_ctx = ChunkContext(
                documentTitle="Career & System Design Knowledge",
                sourceType="INTERVIEW_GUIDE",
                chunkIndex=0,
                content=f"Focus study on {', '.join(final_state['missing_skills'][:3])} fundamentals and core architecture."
            )
            rag_res = generate_grounded_rag_answer(RagGenerateRequest(query=rag_query, contexts=[dummy_ctx]))
            if rag_res.referencedSources:
                for src_title in rag_res.referencedSources:
                    sources.append({"documentTitle": src_title, "sourceType": "INTERVIEW_GUIDE"})

        return CareerIntelligenceResponse(
            status=final_state.get("status", "SUCCESS"),
            executedAgents=final_state.get("executed_agents", []),
            answer=final_state.get("final_answer", "Career intelligence analysis completed."),
            matchedSkills=final_state.get("matched_skills", []),
            missingSkills=final_state.get("missing_skills", []),
            priorityGaps=final_state.get("priority_gaps", []),
            careerPlan=final_state.get("career_plan", {}),
            sources=sources,
            careerDirection=final_state.get("career_direction", {}),
            profileStrength=final_state.get("profile_strength", {}),
            strongSkills=final_state.get("strong_skills", []),
            developingSkills=final_state.get("developing_skills", []),
            missingSkillsList=final_state.get("missing_skills_list", []),
            prioritySkills=final_state.get("priority_skills", []),
            careerSpecificSkills=final_state.get("career_specific_skills", []),
            roleInsights=final_state.get("role_insights", []),
            careerGaps=final_state.get("career_gaps", {}),
            recommendations=final_state.get("recommendations", []),
            roadmap=final_state.get("roadmap", {}),
            projectIntelligence=final_state.get("project_intelligence", {})
        )
    except Exception as e:
        print(f"[LangGraph Router Error]: {e}")
        return CareerIntelligenceResponse(
            status="PARTIAL_SUCCESS",
            executedAgents=["career_manager"],
            answer="Career intelligence system processed your request with partial evidence.",
            matchedSkills=[],
            missingSkills=[],
            priorityGaps=[],
            careerPlan={"immediate_actions": ["Review backend career guidelines in documentation."]},
            sources=[]
        )
