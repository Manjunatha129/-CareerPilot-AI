from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class ChunkContext(BaseModel):
    documentTitle: str
    sourceType: str
    chunkIndex: int
    content: str
    similarityScore: Optional[float] = None

class RagGenerateRequest(BaseModel):
    query: str
    contexts: List[ChunkContext] = Field(default_factory=list)
    candidateSummary: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = Field(default_factory=list, description="Previous conversation turns for context in follow-up questions")

class RagGenerateResponse(BaseModel):
    answer: str = Field(..., description="Grounded natural-language answer based on retrieved context")
    hasSufficientContext: bool = Field(default=True, description="Whether the retrieved context had sufficient evidence")
    referencedSources: List[str] = Field(default_factory=list, description="List of document titles cited")

class BatchEmbedRequest(BaseModel):
    texts: List[str]

class BatchEmbedResponse(BaseModel):
    embeddings: List[List[float]]
    dimension: int = Field(default=768)
