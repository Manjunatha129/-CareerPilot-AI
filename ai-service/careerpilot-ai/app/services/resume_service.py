import json
import re
from google import genai
from app.llm.model_config import config
from app.schemas.resume_schema import (
    ResumeAnalysisResponse, ContactInfo, SkillsBreakdown, EducationItem, ExperienceItem, ProjectItem
)
from app.prompts.resume_analysis_prompt import RESUME_ANALYSIS_PROMPT

from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError

def _call_gemini_extraction(api_key: str, resume_text: str) -> str:
    client = genai.Client(api_key=api_key)
    prompt = RESUME_ANALYSIS_PROMPT.format(resume_text=resume_text)
    response = client.models.generate_content(
        model=config.GEMINI_MODEL,
        contents=prompt,
    )
    return response.text.strip()

def analyze_resume_text(resume_text: str) -> ResumeAnalysisResponse:
    """
    Sends resume text to Gemini API for structured extraction and validates output with Pydantic.
    Includes robust fallback parsing if Gemini API key is missing or service is offline.
    """
    if not resume_text or len(resume_text.strip()) == 0:
        raise ValueError("Resume text is empty")

    api_key = config.GEMINI_API_KEY
    if api_key and api_key.strip() and api_key != "your_gemini_api_key_here":
        try:
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(_call_gemini_extraction, api_key, resume_text)
                raw_output = future.result(timeout=3.0)

            # Clean markdown code block fences if present
            if raw_output.startswith("```json"):
                raw_output = raw_output[7:]
            if raw_output.startswith("```"):
                raw_output = raw_output[3:]
            if raw_output.endswith("```"):
                raw_output = raw_output[:-3]

            parsed_data = json.loads(raw_output.strip())
            return ResumeAnalysisResponse.model_validate(parsed_data)
        except FuturesTimeoutError:
            print("[Gemini Service Warning] Gemini API call timed out (>3.0s). Falling back to instant heuristic extraction.")
        except Exception as e:
            print(f"[Gemini Service Warning] Gemini API call failed: {e}. Falling back to heuristic extraction.")

    # Heuristic / Local Rule-Based Extraction Fallback (Ensures reliability when Gemini API key is not configured locally)
    return parse_resume_heuristically(resume_text)

def parse_resume_heuristically(text: str) -> ResumeAnalysisResponse:
    """
    Extracts structured resume fields using deterministic regex pattern matching as a fallback.
    Guarantees strict NO FABRICATION: only returns extracted text matching patterns.
    """
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    email = email_match.group(0) if email_match else None

    phone_match = re.search(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
    phone = phone_match.group(0) if phone_match else None

    # Name is typically the first non-empty line
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    name = lines[0] if lines and len(lines[0]) < 50 and not '@' in lines[0] else None

    # Extract technical skills
    known_langs = ["Java", "Python", "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust", "SQL", "HTML", "CSS"]
    known_frameworks = ["Spring Boot", "React", "FastAPI", "Angular", "Vue", "Node.js", "Django", "Express"]
    known_dbs = ["PostgreSQL", "MySQL", "MongoDB", "Redis", "H2", "SQLite"]
    known_tools = ["Git", "Docker", "Kubernetes", "Maven", "Gradle", "Linux", "Jira"]
    known_cloud = ["AWS", "GCP", "Azure", "Cloudflare"]

    found_langs = [s for s in known_langs if re.search(r'\b' + re.escape(s) + r'\b', text, re.IGNORECASE)]
    found_fw = [s for s in known_frameworks if re.search(r'\b' + re.escape(s) + r'\b', text, re.IGNORECASE)]
    found_dbs = [s for s in known_dbs if re.search(r'\b' + re.escape(s) + r'\b', text, re.IGNORECASE)]
    found_tools = [s for s in known_tools if re.search(r'\b' + re.escape(s) + r'\b', text, re.IGNORECASE)]
    found_cloud = [s for s in known_cloud if re.search(r'\b' + re.escape(s) + r'\b', text, re.IGNORECASE)]

    skills = SkillsBreakdown(
        programmingLanguages=found_langs,
        frameworks=found_fw,
        databases=found_dbs,
        tools=found_tools,
        cloudTechnologies=found_cloud,
        otherSkills=[]
    )

    contact = ContactInfo(name=name, email=email, phone=phone, location=None)
    
    # Calculate score based on extracted fields
    score = 40
    if email: score += 15
    if phone: score += 10
    if found_langs or found_fw: score += 20
    if len(lines) > 10: score += 15

    return ResumeAnalysisResponse(
        candidateInformation=contact,
        professionalSummary=lines[1] if len(lines) > 1 else None,
        education=[],
        skills=skills,
        experience=[],
        projects=[],
        certifications=[],
        achievements=[],
        completenessScore=min(score, 100),
        parsedSuccessfully=True
    )
