from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class CareerIntelligenceRequest(BaseModel):
    userId: Optional[int] = None
    query: str = Field(..., description="User career query or assessment prompt")
    candidateProfile: Dict[str, Any] = Field(default_factory=dict)
    resumeAnalysis: Dict[str, Any] = Field(default_factory=dict)
    jobContext: Dict[str, Any] = Field(default_factory=dict)

class CareerIntelligenceResponse(BaseModel):
    status: str = Field(..., description="Workflow execution status (SUCCESS, PARTIAL_SUCCESS, FAILED)")
    executedAgents: List[str] = Field(default_factory=list, description="List of executed agent node names")
    answer: str = Field(..., description="Executive career assessment answer")
    matchedSkills: List[str] = Field(default_factory=list)
    missingSkills: List[str] = Field(default_factory=list)
    priorityGaps: List[str] = Field(default_factory=list)
    careerPlan: Dict[str, Any] = Field(default_factory=dict)
    sources: List[Dict[str, Any]] = Field(default_factory=list)

    # Phase 10 Extended Career Intelligence Fields
    careerDirection: Dict[str, Any] = Field(default_factory=dict)
    profileStrength: Dict[str, Any] = Field(default_factory=dict)
    strongSkills: List[Dict[str, Any]] = Field(default_factory=list)
    developingSkills: List[Dict[str, Any]] = Field(default_factory=list)
    missingSkillsList: List[Dict[str, Any]] = Field(default_factory=list)
    prioritySkills: List[Dict[str, Any]] = Field(default_factory=list)
    careerSpecificSkills: List[Dict[str, Any]] = Field(default_factory=list)
    roleInsights: List[Dict[str, Any]] = Field(default_factory=list)
    careerGaps: Dict[str, Any] = Field(default_factory=dict)
    recommendations: List[Dict[str, Any]] = Field(default_factory=list)
    roadmap: Dict[str, Any] = Field(default_factory=dict)
    projectIntelligence: Dict[str, Any] = Field(default_factory=dict)

