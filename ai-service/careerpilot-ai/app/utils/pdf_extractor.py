import io
import re
from pypdf import PdfReader

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """
    Extracts and cleans raw text from PDF binary content.
    Raises ValueError if PDF is empty, unreadable, or corrupted.
    """
    if not pdf_bytes or len(pdf_bytes) == 0:
        raise ValueError("Uploaded file is empty.")

    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        extracted_pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_pages.append(text)
        
        full_text = "\n".join(extracted_pages)
        cleaned_text = clean_extracted_text(full_text)
        
        if not cleaned_text or len(cleaned_text.strip()) < 20:
            raise ValueError("Extracted text is empty or unreadable. The PDF may be scanned or image-only.")

        return cleaned_text
    except ValueError as ve:
        raise ve
    except Exception as e:
        raise ValueError(f"Failed to parse PDF document: {str(e)}")

def clean_extracted_text(text: str) -> str:
    """
    Cleans extracted text by normalizing whitespace and line breaks while preserving paragraph boundaries.
    """
    if not text:
        return ""
    
    # Replace non-breaking spaces and tabs with standard space
    text = text.replace('\xa0', ' ').replace('\t', ' ')
    
    # Remove excessive blank lines (3 or more -> 2)
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Trim each line and collapse multiple horizontal spaces
    lines = [re.sub(r'[ ]{2,}', ' ', line).strip() for line in text.split('\n')]
    cleaned = "\n".join(lines).strip()
    
    return cleaned
