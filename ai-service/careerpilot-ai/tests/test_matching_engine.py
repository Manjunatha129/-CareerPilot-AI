import pytest
from app.schemas.matching_schema import MatchExplanationRequest, MatchExplanationResponse
from app.services.matching_service import compute_cosine_similarity, compute_jaccard_fallback, generate_match_explanation

def test_compute_cosine_similarity():
    v1 = [1.0, 0.0, 0.0]
    v2 = [1.0, 0.0, 0.0]
    score = compute_cosine_similarity(v1, v2)
    assert score == 100.0

    v3 = [0.0, 1.0, 0.0]
    score_orthogonal = compute_cosine_similarity(v1, v3)
    assert score_orthogonal == 50.0

def test_jaccard_fallback():
    text1 = "Senior Java Developer Spring Boot PostgreSQL"
    text2 = "Looking for Java Developer with Spring Boot"
    score = compute_jaccard_fallback(text1, text2)
    assert score > 50.0
    assert score <= 100.0

def test_generate_match_explanation_fallback():
    req = MatchExplanationRequest(
        jobTitle="Junior Java Developer",
        companyName="TechScale Solutions",
        overallScore=82,
        matchCategory="STRONG_MATCH",
        skillScore=85,
        experienceScore=90,
        educationScore=100,
        locationScore=80,
        semanticScore=75,
        preferenceScore=70,
        matchedSkills=["Java", "Spring Boot", "PostgreSQL"],
        missingSkills=["Docker"]
    )
    res = generate_match_explanation(req)
    assert isinstance(res, MatchExplanationResponse)
    assert "82%" in res.summary
    assert len(res.strengths) > 0
    assert any("Docker" in w for w in res.weaknesses)
