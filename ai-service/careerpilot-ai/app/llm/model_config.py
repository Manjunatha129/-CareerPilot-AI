import os
from dotenv import load_dotenv

load_dotenv()

class ModelConfig:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "gemini-embedding-2")
    EMBEDDING_DIMENSION: int = int(os.getenv("EMBEDDING_DIMENSION", "768"))
    
    TEMPERATURE: float = 0.2
    MAX_OUTPUT_TOKENS: int = 4096

config = ModelConfig()
