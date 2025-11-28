from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.responses import JSONResponse, StreamingResponse
from typing import List
from PIL import Image
import io
import os
import pdfplumber
from gtts import gTTS
import tempfile
from deep_translator import GoogleTranslator
app = FastAPI(title="OCR Service")

# Initialize EasyOCR reader lazily to avoid heavy startup cost
_easyocr_reader = None

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extract text from a digital PDF using pdfplumber. If extraction fails or returns empty,
    return empty string; scanned PDFs should be handled by the Node tesseract.js flow (faster
    and avoids heavy Python ML deps)."""
    text = ''
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name
        
        with pdfplumber.open(tmp_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ''
                text += page_text + "\n"
        
        os.unlink(tmp_path)
    except Exception:
        text = ''
    return text


def simple_sentence_summary(text: str, max_sentences: int = 5) -> str:
    """Naive sentence-based summarizer: split text into sentences and return
    the first `max_sentences` non-empty sentences joined into a short summary.
    This avoids adding heavy NLP deps while producing a concise human-friendly
    summary for TTS and chat displays.
    """
    if not text:
        return ''

    # Normalize newlines and whitespace
    import re
    normalized = re.sub(r"\s+", " ", text.replace('\r', '\n'))

    # Split on sentence-ending punctuation followed by space (simple heuristic)
    sentences = re.split(r'(?<=[\.!?])\s+', normalized)
    # Filter out very short fragments
    sentences = [s.strip() for s in sentences if s and len(s.strip()) > 20]
    if not sentences:
        # fallback: take first 800 chars
        return (text or '').strip()[:800]

    return ' '.join(sentences[:max_sentences]).strip()


@app.post('/ocr')
async def ocr_endpoint(file: UploadFile = File(...)):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail='Empty file')

    try:
        extracted_text = ''

        if file.content_type == 'application/pdf' or (file.filename and file.filename.lower().endswith('.pdf')):
            extracted_text = extract_text_from_pdf_bytes(content)
        else:
            # This service focuses on PDF text extraction and TTS.
            # For image OCR (scanned images) use the Node.js tesseract.js route instead.
            raise HTTPException(status_code=400, detail='Only PDF text extraction supported by this service')

        # Simple summary: extract first few meaningful sentences
        summary = simple_sentence_summary(extracted_text, max_sentences=5)

        return JSONResponse({
            'success': True,
            'fileName': file.filename,
            'contentType': file.content_type,
            'extracted_text': extracted_text,
            'summary': summary
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f'OCR failed: {str(e)}')


@app.post('/tts')
async def tts_endpoint(payload: dict = Body(...)):
    """Generate speech from provided text. Accepts JSON body with keys:
       { "text": "...", "lang": "hi", "translate": false }
       Returns an MP3 stream.
    """
    text = (payload or {}).get('text', '')
    lang = (payload or {}).get('lang', 'hi')
    translate = (payload or {}).get('translate', False)

    if not text:
        raise HTTPException(status_code=400, detail='No text provided')

    try:
        final_text = text
        if translate:
           translated = GoogleTranslator(source='auto', target=lang).translate(text)
           final_text = translated

        tts = gTTS(text=final_text, lang=lang)
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        return StreamingResponse(mp3_fp, media_type='audio/mpeg')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'TTS failed: {str(e)}')


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8001)
