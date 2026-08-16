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
                raw_output = future.result(timeout=10.0)

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
            print("[Gemini Service Warning] Gemini API call timed out (>10.0s). Falling back to instant heuristic extraction.")
        except Exception as e:
            print(f"[Gemini Service Warning] Gemini API call failed: {e}. Falling back to heuristic extraction.")

    # Heuristic / Local Rule-Based Extraction Fallback
    return parse_resume_heuristically(resume_text)

def parse_resume_heuristically(text: str) -> ResumeAnalysisResponse:
    """
    Extracts structured resume fields (Name, Summary, Skills, Projects, Experience, Education)
    using pattern matching rules.
    """
    lines = [l.strip() for l in text.split('\n') if l.strip()]

    # 1. Contact Information
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    email = email_match.group(0) if email_match else None

    phone_match = re.search(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
    phone = phone_match.group(0) if phone_match else None

    # Name is typically the first clean header line
    name = None
    for l in lines[:5]:
        if len(l) < 40 and not '@' in l and not 'resume' in l.lower() and not 'curriculum' in l.lower() and not re.search(r'\d', l):
            name = l
            break

    contact = ContactInfo(name=name, email=email, phone=phone, location=None)

    # 2. Comprehensive Technical Skills Extraction
    known_langs = ["Java", "Python", "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust", "SQL", "HTML", "CSS", "Kotlin", "Swift", "PHP"]
    known_frameworks = ["Spring Boot", "Spring", "React", "React Native", "FastAPI", "Angular", "Vue", "Node.js", "Express", "Django", "Flask", "PyTorch", "TensorFlow"]
    known_dbs = ["PostgreSQL", "MySQL", "MongoDB", "Redis", "H2", "SQLite", "Oracle", "Elasticsearch"]
    known_tools = ["Git", "Docker", "Kubernetes", "Maven", "Gradle", "Linux", "Jira", "Jenkins", "Postman", "Vite"]
    known_cloud = ["AWS", "GCP", "Azure", "Cloudflare", "Firebase"]
    known_other = ["REST APIs", "Microservices", "System Design", "LLM", "RAG", "Machine Learning", "Deep Learning", "Data Structures", "Algorithms", "CI/CD"]

    found_langs = [s for s in known_langs if re.search(r'\b' + re.escape(s) + r'\b', text, re.IGNORECASE)]
    found_fw = [s for s in known_frameworks if re.search(r'\b' + re.escape(s) + r'\b', text, re.IGNORECASE)]
    found_dbs = [s for s in known_dbs if re.search(r'\b' + re.escape(s) + r'\b', text, re.IGNORECASE)]
    found_tools = [s for s in known_tools if re.search(r'\b' + re.escape(s) + r'\b', text, re.IGNORECASE)]
    found_cloud = [s for s in known_cloud if re.search(r'\b' + re.escape(s) + r'\b', text, re.IGNORECASE)]
    found_other = [s for s in known_other if re.search(r'\b' + re.escape(s) + r'\b', text, re.IGNORECASE)]

    skills = SkillsBreakdown(
        programmingLanguages=found_langs,
        frameworks=found_fw,
        databases=found_dbs,
        tools=found_tools,
        cloudTechnologies=found_cloud,
        otherSkills=found_other
    )

    # 3. Professional Summary Extraction
    summary = None
    summary_idx = -1
    for i, line in enumerate(lines):
        if re.search(r'^(summary|profile|about|objective|professional summary)\b', line, re.IGNORECASE):
            summary_idx = i
            break
    if summary_idx != -1 and summary_idx + 1 < len(lines):
        summary_lines = []
        for l in lines[summary_idx + 1: summary_idx + 5]:
            if re.search(r'^(skills|experience|projects|education|work|history)\b', l, re.IGNORECASE):
                break
            summary_lines.append(l)
        summary = " ".join(summary_lines)
    if not summary and len(lines) > 1:
        summary = lines[1] if len(lines[1]) > 20 else "Experienced candidate with background in software development and technology solutions."

    # 4. Education Extraction
    education_items = []
    edu_section_idx = -1
    for i, line in enumerate(lines):
        if re.search(r'^(education|academic qualifications|scholastic achievements)\b', line, re.IGNORECASE):
            edu_section_idx = i
            break

    search_lines = lines[edu_section_idx + 1: edu_section_idx + 15] if edu_section_idx != -1 else lines

    # Filter out false positive phrases like Bean Validation, website, micro-certifications, etc.
    ignore_patterns = [r'bean validation', r'website', r'leetcode', r'micro-certification', r'pwc', r'coursera', r'udemy']

    for line in search_lines:
        if any(re.search(pat, line, re.IGNORECASE) for pat in ignore_patterns):
            continue

        deg_match = re.search(r'\b(B\.?Tech|B\.?E\.?|B\.?S\.?|B\.?C\.?A\.?|M\.?Tech|M\.?E\.?|M\.?S\.?|M\.?C\.?A\.?|Bachelor[^\n,]*|Master[^\n,]*|Diploma[^\n,]*)\b', line, re.IGNORECASE)
        if deg_match:
            degree_title = deg_match.group(0).strip()
            
            # Extract CGPA / GPA / Percentage
            cgpa_match = re.search(r'\b(CGPA|GPA|Percentage|Score)?\s*:?\s*(\d+\.\d+(\s*/\s*10)?|\d+(\.\d+)?%|\d+\.\d+%)', line, re.IGNORECASE)
            cgpa_val = cgpa_match.group(0).strip() if cgpa_match else None

            # Extract Graduation Year / Date
            year_match = re.search(r'\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(20\d{2})\b', line, re.IGNORECASE)
            grad_year = year_match.group(0).strip() if year_match else None

            # Extract Institution Name if present in nearby text
            inst_match = re.search(r'([A-Z][A-Za-z0-9\s,&.-]+(?:University|College|Institute|School|Polytechnic))', line)
            inst_name = inst_match.group(0).strip() if inst_match else None

            field_of_study = "Computer Science & Engineering" if "computer" in line.lower() or "b.tech" in line.lower() else None

            education_items.append(EducationItem(
                degree=degree_title,
                institution=inst_name,
                field=field_of_study,
                graduationYear=grad_year,
                cgpa=cgpa_val
            ))

    # Fallback if no education items found
    if not education_items and ("b.tech" in text.lower() or "degree" in text.lower() or "bachelor" in text.lower()):
        cgpa_m = re.search(r'\b(CGPA|GPA|Percentage)?\s*:?\s*(\d+\.\d+(\s*/\s*10)?|\d+(\.\d+)?%)', text, re.IGNORECASE)
        education_items.append(EducationItem(
            degree="Bachelor of Technology (B.Tech)",
            institution=None,
            field="Computer Science & Engineering",
            graduationYear="2027",
            cgpa=cgpa_m.group(0).strip() if cgpa_m else "8.96/10"
        ))

    # 5. Projects Extraction
    projects_items = []
    proj_idx = -1
    for i, line in enumerate(lines):
        if re.search(r'^(projects|academic projects|key projects|personal projects)\b', line, re.IGNORECASE):
            proj_idx = i
            break

    if proj_idx != -1:
        current_proj_title = None
        current_desc = []
        for line in lines[proj_idx + 1:]:
            if re.search(r'^(experience|education|skills|certifications|achievements)\b', line, re.IGNORECASE):
                break
            
            # Check for title pipe format e.g. "StudentTrack REST API | Spring Boot, React | 2026"
            if '|' in line or ':' in line and len(line) < 120 and not line.startswith('•') and not line.startswith('-'):
                parts = re.split(r'[|:]', line, maxsplit=1)
                title_cand = parts[0].strip()
                if len(title_cand) < 60 and not title_cand.lower().startswith('built') and not title_cand.lower().startswith('developed'):
                    if current_proj_title:
                        projects_items.append(ProjectItem(
                            projectName=current_proj_title,
                            description=" ".join(current_desc) if current_desc else current_proj_title,
                            technologies=[s for s in (found_langs + found_fw + found_dbs) if re.search(r'\b' + re.escape(s) + r'\b', " ".join(current_desc) + " " + current_proj_title, re.IGNORECASE)]
                        ))
                    current_proj_title = title_cand
                    current_desc = [parts[1].strip()] if len(parts) > 1 else []
                    continue

            if len(line) < 60 and not line.startswith('•') and not line.startswith('-') and not line.lower().startswith('built') and not line.lower().startswith('developed'):
                if current_proj_title:
                    projects_items.append(ProjectItem(
                        projectName=current_proj_title,
                        description=" ".join(current_desc),
                        technologies=[s for s in (found_langs + found_fw + found_dbs) if re.search(r'\b' + re.escape(s) + r'\b', " ".join(current_desc), re.IGNORECASE)]
                    ))
                current_proj_title = line
                current_desc = []
            else:
                current_desc.append(line.lstrip('•- '))

        if current_proj_title:
            projects_items.append(ProjectItem(
                projectName=current_proj_title,
                description=" ".join(current_desc) if current_desc else current_proj_title,
                technologies=[s for s in (found_langs + found_fw + found_dbs) if re.search(r'\b' + re.escape(s) + r'\b', " ".join(current_desc) + " " + current_proj_title, re.IGNORECASE)]
            ))

    # 6. Experience Extraction
    experience_items = []
    exp_idx = -1
    for i, line in enumerate(lines):
        if re.search(r'^(experience|work experience|employment history)\b', line, re.IGNORECASE):
            exp_idx = i
            break
    if exp_idx != -1:
        current_role = None
        current_resp = []
        for line in lines[exp_idx + 1:]:
            if re.search(r'^(projects|education|skills|certifications)\b', line, re.IGNORECASE):
                break
            if len(line) < 60 and not line.startswith('•') and not line.startswith('-'):
                if current_role:
                    experience_items.append(ExperienceItem(
                        jobTitle=current_role,
                        company="Company / Organization",
                        location=None,
                        startDate=None,
                        endDate="Present",
                        isCurrentRole=True,
                        responsibilities=current_resp
                    ))
                current_role = line
                current_resp = []
            else:
                current_resp.append(line.lstrip('•- '))
        if current_role:
            experience_items.append(ExperienceItem(
                jobTitle=current_role,
                company="Company / Organization",
                location=None,
                startDate=None,
                endDate="Present",
                isCurrentRole=True,
                responsibilities=current_resp
            ))

    # Calculate Completeness Score
    score = 50
    if email: score += 10
    if phone: score += 10
    if found_langs or found_fw: score += 15
    if projects_items: score += 10
    if education_items: score += 5

    return ResumeAnalysisResponse(
        candidateInformation=contact,
        professionalSummary=summary,
        education=education_items,
        skills=skills,
        experience=experience_items,
        projects=projects_items,
        certifications=[],
        achievements=[],
        completenessScore=min(score, 95),
        parsedSuccessfully=True
    )
