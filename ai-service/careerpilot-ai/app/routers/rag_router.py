from fastapi import APIRouter, HTTPException
from app.schemas.rag_schema import (
    BatchEmbedRequest, BatchEmbedResponse,
    RagGenerateRequest, RagGenerateResponse
)
from app.services.rag_service import generate_embeddings_batch, generate_grounded_rag_answer

router = APIRouter(prefix="/ai/rag", tags=["RAG Knowledge Engine"])

@router.post("/embed", response_model=BatchEmbedResponse)
async def embed_texts(payload: BatchEmbedRequest):
    """
    Generates 768-dimensional float embeddings using gemini-embedding-2.
    """
    try:
        embeddings = generate_embeddings_batch(payload.texts)
        return BatchEmbedResponse(embeddings=embeddings, dimension=768)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")

@router.post("/generate-answer", response_model=RagGenerateResponse)
async def generate_answer(payload: RagGenerateRequest):
    """
    Generates grounded natural-language answer using retrieved context snippets and Gemini API.
    Enforces strict anti-hallucination constraints.
    """
    try:
        response = generate_grounded_rag_answer(payload)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG generation failed: {str(e)}")
