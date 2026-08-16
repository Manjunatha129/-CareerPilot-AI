from typing import List, Optional
from pydantic import BaseModel, Field

class ContactInfo(BaseModel):
    name: Optional[str] = Field(None, description="Full name of the candidate")
    email: Optional[str] = Field(None, description="Candidate email address")
    phone: Optional[str] = Field(None, description="Contact phone number")
    location: Optional[str] = Field(None, description="City, state, or country of candidate")

class EducationItem(BaseModel):
    degree: Optional[str] = Field(None, description="Degree name (e.g. B.Tech, M.S., Diploma)")
    institution: Optional[str] = Field(None, description="University, College, or School name")
    field: Optional[str] = Field(None, description="Field of study or major")
    graduationYear: Optional[str] = Field(None, description="Graduation year or date range (e.g. 2027 or May 2027)")
    cgpa: Optional[str] = Field(None, description="CGPA, GPA, percentage, or score (e.g. 8.96/10 or 93.47%)")

class SkillsBreakdown(BaseModel):
    programmingLanguages: List[str] = Field(default_factory=list, description="Programming languages (e.g. Java, Python, TypeScript)")
    frameworks: List[str] = Field(default_factory=list, description="Frameworks & libraries (e.g. Spring Boot, React, FastAPI)")
    databases: List[str] = Field(default_factory=list, description="Databases (e.g. PostgreSQL, Redis, MongoDB)")
    tools: List[str] = Field(default_factory=list, description="Developer tools & platforms (e.g. Git, Docker, Kubernetes)")
    cloudTechnologies: List[str] = Field(default_factory=list, description="Cloud platforms & services (e.g. AWS, GCP, Azure)")
    otherSkills: List[str] = Field(default_factory=list, description="Other technical or domain skills")

class ExperienceItem(BaseModel):
    company: Optional[str] = Field(None, description="Company or organization name")
    role: Optional[str] = Field(None, description="Job title or role")
    duration: Optional[str] = Field(None, description="Employment date range")
    responsibilities: List[str] = Field(default_factory=list, description="Bullet points of key accomplishments/responsibilities")

class ProjectItem(BaseModel):
    projectName: Optional[str] = Field(None, description="Title of the project")
    description: Optional[str] = Field(None, description="Summary of project goals and implementation")
    technologies: List[str] = Field(default_factory=list, description="Technologies used in the project")

class CertificationItem(BaseModel):
    name: Optional[str] = Field(None, description="Certification name")
    issuingOrganization: Optional[str] = Field(None, description="Organization issuing the certificate")
    year: Optional[str] = Field(None, description="Year earned")

class AchievementItem(BaseModel):
    achievement: Optional[str] = Field(None, description="Award or achievement description")
    organization: Optional[str] = Field(None, description="Issuing body or event")

class ResumeAnalysisResponse(BaseModel):
    candidateInformation: ContactInfo = Field(default_factory=ContactInfo)
    professionalSummary: Optional[str] = Field(None, description="Professional summary extracted from resume")
    education: List[EducationItem] = Field(default_factory=list)
    skills: SkillsBreakdown = Field(default_factory=SkillsBreakdown)
    experience: List[ExperienceItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    certifications: List[CertificationItem] = Field(default_factory=list)
    achievements: List[AchievementItem] = Field(default_factory=list)
    completenessScore: int = Field(default=80, ge=0, le=100, description="Overall resume completeness score")
    parsedSuccessfully: bool = Field(default=True)
