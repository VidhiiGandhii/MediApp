from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import io
import uuid
import time
from gtts import gTTS

# Try to import translation libraries
try:
    from googletrans import Translator
    HAS_TRANSLATION = True
except ImportError:
    print("Warning: Translation libraries not installed. Install with: pip install googletrans==4.0.0-rc1")
    HAS_TRANSLATION = False

# Initialize FastAPI app
app = FastAPI(title="TTS Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize translator if available
translator = Translator() if HAS_TRANSLATION else None

# Request models
class TranslationRequest(BaseModel):
    text: str
    target_lang: str = 'hi'

class TTSRequest(BaseModel):
    text: str
    lang: str = 'en'

# Temporary storage for audio files
TEMP_DIR = "temp_audio"
os.makedirs(TEMP_DIR, exist_ok=True)

@app.post("/translate")
async def translate_text(request: TranslationRequest):
    if not HAS_TRANSLATION:
        raise HTTPException(
            status_code=500,
            detail="Translation service not available. Please install required packages."
        )

    try:
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text is required")

        translation = translator.translate(request.text, dest=request.target_lang)
        
        return {
            "success": True,
            "original_text": request.text,
            "translated_text": translation.text,
            "target_lang": request.target_lang,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation error: {str(e)}")

@app.post("/generate")
async def generate_speech(request: TTSRequest, background_tasks: BackgroundTasks):
    try:
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text is required")

        # Generate speech
        tts = gTTS(text=request.text, lang=request.lang, slow=False)
        
        # Save to bytes buffer
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)

        # Generate unique filename
        audio_id = str(uuid.uuid4())
        temp_file = os.path.join(TEMP_DIR, f"{audio_id}.mp3")

        # Save to file
        with open(temp_file, "wb") as f:
            f.write(mp3_fp.getvalue())

        # Schedule cleanup
        def cleanup_file():
            time.sleep(300)  # Clean up after 5 minutes
            try:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
            except:
                pass

        background_tasks.add_task(cleanup_file)

        return {
            "success": True,
            "audio_id": audio_id,
            "audio_url": f"/audio/{audio_id}",
            "lang": request.lang,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS generation error: {str(e)}")

@app.get("/audio/{audio_id}")
async def get_audio(audio_id: str):
    try:
        temp_file = os.path.join(TEMP_DIR, f"{audio_id}.mp3")
        if not os.path.exists(temp_file):
            raise HTTPException(status_code=404, detail="Audio not found")
        
        return FileResponse(
            temp_file,
            media_type="audio/mpeg",
            filename=f"speech_{audio_id}.mp3"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error serving audio: {str(e)}")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "TTS Service",
        "translation_available": HAS_TRANSLATION,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)