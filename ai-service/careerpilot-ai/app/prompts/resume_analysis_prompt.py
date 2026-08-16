RESUME_ANALYSIS_PROMPT = """You are an expert AI Resume Intelligence Parser.

Your task is to analyze the provided candidate resume text and extract clean, structured information.

CRITICAL EXTRACTION GUIDELINES:
CRITICAL CONSTRAINTS - STRICT NO FABRICATION:
1. PROJECTS EXTRACTION:
   - "projectName" MUST be ONLY the concise, clean title/name of the project (e.g., "Student Management System", "StudentTrack REST API", "FlowForge - Project Management Platform", "Portfolio Website").
   - NEVER put full paragraphs, bullet points, or implementation details into "projectName". All implementation details, CRUD operations, architecture notes, and narrative descriptions MUST be in "description".

2. EDUCATION EXTRACTION:
   - Extract real academic degree/diploma programs (e.g. "Bachelor of Technology (B.Tech)", "Diploma in Cloud Computing & Big Data").
   - "institution": Extract the exact College, University, or Institute name (e.g. "Sri Venkateswara University" or full college name). Do NOT put generic "University" if specific college is mentioned.
   - "field": Major or specialization (e.g., "Computer Science and Engineering").
   - "graduationYear": Graduation year or date range (e.g. "May 2027", "June 2024", "2023 - 2027").
   - "cgpa": Extract exact CGPA, GPA, or percentage score mentioned (e.g., "8.96 / 10 CGPA", "93.47%").
   - STRICT NO FAKE EDUCATION: Do NOT create education entries for single words, skills, tools, or micro-certifications (e.g., "Bean Validation", "website", "LeetCode", "PwC Micro-Certifications").

3. GENERAL CONSTRAINTS:
   - Extract ONLY information explicitly present in the candidate's resume text. Do NOT fabricate or assume details.
   - Categorize technical skills accurately into: programmingLanguages, frameworks, databases, tools, cloudTechnologies, and otherSkills.

INPUT RESUME TEXT:
-------------------
{resume_text}
-------------------

Output MUST be a single valid JSON object strictly matching the following schema structure:
{{
  "candidateInformation": {{
    "name": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "location": "string or null"
  }},
  "professionalSummary": "string or null",
  "education": [
    {{
      "degree": "string or null",
      "institution": "string or null",
      "field": "string or null",
      "graduationYear": "string or null",
      "cgpa": "string or null"
    }}
  ],
  "skills": {{
    "programmingLanguages": ["string"],
    "frameworks": ["string"],
    "databases": ["string"],
    "tools": ["string"],
    "cloudTechnologies": ["string"],
    "otherSkills": ["string"]
  }},
  "experience": [
    {{
      "company": "string or null",
      "role": "string or null",
      "duration": "string or null",
      "responsibilities": ["string"]
    }}
  ],
  "projects": [
    {{
      "projectName": "string or null",
      "description": "string or null",
      "technologies": ["string"]
    }}
  ],
  "certifications": [
    {{
      "name": "string or null",
      "issuingOrganization": "string or null",
      "year": "string or null"
    }}
  ],
  "achievements": [
    {{
      "achievement": "string or null",
      "organization": "string or null"
    }}
  ],
  "completenessScore": 85,
  "parsedSuccessfully": true
}}

Return ONLY valid JSON. Do not include markdown code block backticks.
"""
