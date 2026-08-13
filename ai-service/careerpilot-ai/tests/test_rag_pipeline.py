import pytest
from app.schemas.rag_schema import ChunkContext, RagGenerateRequest, RagGenerateResponse
from app.services.rag_service import generate_fallback_embedding, generate_embeddings_batch, generate_grounded_rag_answer

def test_generate_fallback_embedding():
    text = "Dependency Injection in Spring Boot"
    vec = generate_fallback_embedding(text, 768)
    assert len(vec) == 768
    assert all(isinstance(x, float) for x in vec)

def test_generate_embeddings_batch():
    texts = ["Java Spring Boot Guide", "FastAPI Asynchronous Architecture"]
    embeds = generate_embeddings_batch(texts)
    assert len(embeds) == 2
    assert len(embeds[0]) == 768

def test_grounded_rag_answer_with_context():
    ctx = ChunkContext(
        documentTitle="Java Spring Guide",
        sourceType="INTERVIEW_GUIDE",
        chunkIndex=0,
        content="Dependency Injection (DI) allows inversion of control via @Autowired or constructor injection."
    )
    req = RagGenerateRequest(query="What is dependency injection?", contexts=[ctx])
    res = generate_grounded_rag_answer(req)
    assert isinstance(res, RagGenerateResponse)
    assert res.hasSufficientContext is True
    assert "Java Spring Guide" in res.referencedSources

def test_anti_hallucination_insufficient_context():
    req = RagGenerateRequest(query="What is Apple stock price?", contexts=[])
    res = generate_grounded_rag_answer(req)
    assert res.hasSufficientContext is False
    assert "does not contain sufficient information" in res.answer
    assert len(res.referencedSources) == 0
