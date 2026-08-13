import json
import math
import re
from google import genai
from app.llm.model_config import config
from app.schemas.matching_schema import (
    MatchExplanationRequest, MatchExplanationResponse
)
from app.prompts.match_explanation_prompt import MATCH_EXPLANATION_PROMPT

def compute_cosine_similarity(vec1: list, vec2: list) -> float:
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    similarity = dot_product / (norm1 * norm2)
    # Cosine similarity is [-1, 1], normalize to [0, 100]
    normalized = max(0.0, min(100.0, (similarity + 1.0) / 2.0 * 100.0))
    return round(normalized, 2)

def compute_jaccard_fallback(text1: str, text2: str) -> float:
    words1 = set(re.findall(r'\w+', text1.lower()))
    words2 = set(re.findall(r'\w+', text2.lower()))
    if not words1 or not words2:
        return 50.0
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    similarity = len(intersection) / len(union) if union else 0.0
    # Rescale Jaccard word overlap to 0-100 score
    return round(min(100.0, similarity * 250.0), 2)

def calculate_semantic_similarity(text1: str, text2: str) -> float:
    if not text1 or not text2 or len(text1.strip()) == 0 or len(text2.strip()) == 0:
        return 50.0

    api_key = config.GEMINI_API_KEY
    if api_key and api_key.strip() and api_key != "your_gemini_api_key_here":
        try:
            client = genai.Client(api_key=api_key)
            res1 = client.models.embed_content(
                model=config.EMBEDDING_MODEL,
                contents=text1[:2000]
            )
            res2 = client.models.embed_content(
                model=config.EMBEDDING_MODEL,
                contents=text2[:2000]
            )
            
            vec1 = res1.embedding.values
            vec2 = res2.embedding.values
            return compute_cosine_similarity(vec1, vec2)
        except Exception as e:
            print(f"[Gemini Embedding Warning] Failed to compute Gemini embeddings: {e}. Falling back to Jaccard text similarity.")

    return compute_jaccard_fallback(text1, text2)

def generate_match_explanation(payload: MatchExplanationRequest) -> MatchExplanationResponse:
    api_key = config.GEMINI_API_KEY
    if api_key and api_key.strip() and api_key != "your_gemini_api_key_here":
        try:
            client = genai.Client(api_key=api_key)
            prompt = MATCH_EXPLANATION_PROMPT.format(
                jobTitle=payload.jobTitle,
                companyName=payload.companyName,
                overallScore=payload.overallScore,
                matchCategory=payload.matchCategory,
                skillScore=payload.skillScore,
                experienceScore=payload.experienceScore,
                educationScore=payload.educationScore,
                locationScore=payload.locationScore,
                semanticScore=payload.semanticScore,
                preferenceScore=payload.preferenceScore,
                matchedSkills=", ".join(payload.matchedSkills) if payload.matchedSkills else "None",
                missingSkills=", ".join(payload.missingSkills) if payload.missingSkills else "None"
            )

            response = client.models.generate_content(
                model=config.GEMINI_MODEL,
                contents=prompt,
            )

            raw_output = response.text.strip()
            if raw_output.startswith("```json"):
                raw_output = raw_output[7:]
            if raw_output.startswith("```"):
                raw_output = raw_output[3:]
            if raw_output.endswith("```"):
                raw_output = raw_output[:-3]

            parsed_data = json.loads(raw_output.strip())
            return MatchExplanationResponse.model_validate(parsed_data)
        except Exception as e:
            print(f"[Gemini Explanation Warning] Gemini API call failed: {e}. Returning heuristic explanation.")

    # Fallback explanation if Gemini API key missing or network fails
    strengths = []
    if payload.matchedSkills:
        strengths.append(f"Strong overlap in key skills: {', '.join(payload.matchedSkills[:4])}.")
    if payload.experienceScore >= 80:
        strengths.append("Candidate experience level aligns well with role requirements.")
    if payload.locationScore >= 80:
        strengths.append("Location and work arrangement are compatible.")
    if not strengths:
        strengths.append("Candidate profile evaluated against job posting requirement baseline.")

    weaknesses = []
    if payload.missingSkills:
        weaknesses.append(f"Missing or unverified required skills: {', '.join(payload.missingSkills[:4])}.")
    if payload.experienceScore < 60:
        weaknesses.append("Total experience years are below target job level expectation.")

    return MatchExplanationResponse(
        summary=f"Calculated match score of {payload.overallScore}% ({payload.matchCategory}) for {payload.jobTitle}.",
        strengths=strengths,
        weaknesses=weaknesses,
        actionableAdvice=[
            f"Focus on gaining hands-on experience in missing skills: {', '.join(payload.missingSkills[:3])}."
            if payload.missingSkills else "Highlight recent technical project deliverables during interviews."
        ]
    )
