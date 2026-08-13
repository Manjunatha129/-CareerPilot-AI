from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from app.llm.model_config import config
from app.routers import resume_router, matching_router, rag_router, agent_router

app = FastAPI(
    title="CareerPilot AI Microservice",
    description="Multi-Agent AI Career & Job Intelligence API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume_router.router)
app.include_router(matching_router.router)
app.include_router(rag_router.router)
app.include_router(agent_router.router)

@app.get("/")
def read_root():
    return {
        "service": "CareerPilot AI Microservice",
        "status": "online",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "gemini_model": config.GEMINI_MODEL,
        "embedding_model": config.EMBEDDING_MODEL,
        "embedding_dimension": config.EMBEDDING_DIMENSION,
        "timestamp": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
