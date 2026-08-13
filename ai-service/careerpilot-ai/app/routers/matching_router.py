from fastapi import APIRouter, HTTPException
from app.schemas.matching_schema import (
    SemanticSimilarityRequest, SemanticSimilarityResponse,
    MatchExplanationRequest, MatchExplanationResponse
)
from app.services.matching_service import calculate_semantic_similarity, generate_match_explanation

router = APIRouter(prefix="/ai/matching", tags=["Hybrid Matching Engine"])

@router.post("/semantic-similarity", response_model=SemanticSimilarityResponse)
async def semantic_similarity(payload: SemanticSimilarityRequest):
    """
    Computes 768-dimensional vector cosine similarity using gemini-embedding-2 between candidate and job text.
    """
    try:
        score = calculate_semantic_similarity(payload.text1, payload.text2)
        return SemanticSimilarityResponse(similarityScore=score, dimension=768)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Semantic similarity calculation failed: {str(e)}")

@router.post("/explain", response_model=MatchExplanationResponse)
async def match_explanation(payload: MatchExplanationRequest):
    """
    Generates natural-language match explanation from pre-calculated deterministic evidence.
    Does NOT recalculate or alter official match score.
    """
    try:
        explanation = generate_match_explanation(payload)
        return explanation
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Match explanation failed: {str(e)}")
