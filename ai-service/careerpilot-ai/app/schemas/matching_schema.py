from typing import List, Optional
from pydantic import BaseModel, Field

class SemanticSimilarityRequest(BaseModel):
    text1: str = Field(..., description="First text (e.g. resume text or candidate summary)")
    text2: str = Field(..., description="Second text (e.g. job description)")

class SemanticSimilarityResponse(BaseModel):
    similarityScore: float = Field(..., ge=0.0, le=100.0, description="Normalized similarity score 0-100")
    dimension: int = Field(default=768)

class MatchExplanationRequest(BaseModel):
    jobTitle: str
    companyName: str = ""
    overallScore: int
    matchCategory: str
    skillScore: int
    experienceScore: int
    educationScore: int
    locationScore: int
    semanticScore: int
    preferenceScore: int
    matchedSkills: List[str] = Field(default_factory=list)
    missingSkills: List[str] = Field(default_factory=list)
    candidateExperienceYears: Optional[float] = None
    jobRequiredExperienceLevel: Optional[str] = None
    candidateEducationLevel: Optional[str] = None

class MatchExplanationResponse(BaseModel):
    summary: str = Field(..., description="Executive summary of why candidate matches this role")
    strengths: List[str] = Field(default_factory=list, description="Key candidate strengths for this job")
    weaknesses: List[str] = Field(default_factory=list, description="Key qualification gaps or missing skills")
    actionableAdvice: List[str] = Field(default_factory=list, description="Actionable tips for candidate")
