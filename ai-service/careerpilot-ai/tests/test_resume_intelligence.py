import pytest
from app.utils.pdf_extractor import clean_extracted_text, extract_text_from_pdf_bytes
from app.schemas.resume_schema import ResumeAnalysisResponse, SkillsBreakdown, ContactInfo
from app.services.resume_service import analyze_resume_text, parse_resume_heuristically
from app.prompts.resume_analysis_prompt import RESUME_ANALYSIS_PROMPT

def test_clean_extracted_text():
    raw = "John   Doe\n\n\n\nSoftware   Engineer\xa0\xa0\tJava"
    cleaned = clean_extracted_text(raw)
    assert "John Doe" in cleaned
    assert "Software Engineer  Java" in cleaned or "Software Engineer" in cleaned

def test_empty_pdf_bytes_raises_error():
    with pytest.raises(ValueError, match="Uploaded file is empty"):
        extract_text_from_pdf_bytes(b"")

def test_resume_prompt_construction():
    prompt = RESUME_ANALYSIS_PROMPT.format(resume_text="Jane Doe Java Engineer")
    assert "INPUT RESUME TEXT:" in prompt
    assert "Jane Doe Java Engineer" in prompt
    assert "STRICT NO FABRICATION:" in prompt

def test_pydantic_schema_validation():
    schema = ResumeAnalysisResponse(
        candidateInformation=ContactInfo(name="Alex Rivera", email="alex@example.com"),
        professionalSummary="Senior Engineer",
        skills=SkillsBreakdown(programmingLanguages=["Java", "Python"]),
        completenessScore=90
    )
    assert schema.candidateInformation.name == "Alex Rivera"
    assert "Java" in schema.skills.programmingLanguages
    assert schema.completenessScore == 90

def test_heuristic_parsing_no_fabrication():
    sample_text = """
    Alex Rivera
    Email: alex.rivera@example.com
    Phone: (555) 123-4567
    
    Technical Skills:
    Languages: Java 21, Python, TypeScript
    Frameworks: Spring Boot, React, FastAPI
    Databases: PostgreSQL, Redis
    Tools: Git, Docker
    """
    result = parse_resume_heuristically(sample_text)
    assert result.candidateInformation.email == "alex.rivera@example.com"
    assert "Java" in result.skills.programmingLanguages
    assert "Spring Boot" in result.skills.frameworks
    assert "PostgreSQL" in result.skills.databases
    assert "Docker" in result.skills.tools
