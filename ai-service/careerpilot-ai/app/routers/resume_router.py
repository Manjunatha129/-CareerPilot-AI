from fastapi import APIRouter, File, UploadFile, HTTPException, Body
from pydantic import BaseModel
from typing import Optional
from app.utils.pdf_extractor import extract_text_from_pdf_bytes
from app.services.resume_service import analyze_resume_text
from app.schemas.resume_schema import ResumeAnalysisResponse

router = APIRouter(prefix="/ai/resume", tags=["Resume Intelligence"])

class TextAnalysisRequest(BaseModel):
    text: str

@router.post("/analyze", response_model=ResumeAnalysisResponse)
async def analyze_resume(
    file: Optional[UploadFile] = File(None),
    payload: Optional[TextAnalysisRequest] = Body(None)
):
    """
    Extracts text from an uploaded PDF resume (or accepts raw text) and returns structured analysis.
    """
    resume_text = ""

    if file:
        if not file.filename.endswith(".pdf") and file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF files are supported for resume analysis.")
        
        contents = await file.read()
        try:
            resume_text = extract_text_from_pdf_bytes(contents)
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))
    elif payload and payload.text:
        resume_text = payload.text
    else:
        raise HTTPException(status_code=400, detail="Please upload a PDF file or provide resume text.")

    try:
        analysis = analyze_resume_text(resume_text)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume analysis failed: {str(e)}")
