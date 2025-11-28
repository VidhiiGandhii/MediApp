"""
Text-to-Speech and Translation Microservice
Handles Hindi translation and MP3 speech generation
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import io
import os
from pydantic import BaseModel
import uuid
import time

try:
    from googletrans import Translator
    from gtts import gTTS
    HAS_TRANSLATION = True
except ImportError:
    print("Warning: Translation libraries not installed. Install with: pip install googletrans==4.0.0-rc1 gtts")
    HAS_TRANSLATION = False

app = FastAPI(title="TTS Microservice")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize translator
# Note: In newer async versions of googletrans, this needs to be awaited
if HAS_TRANSLATION:
    translator = Translator()


# Request models
class TranslationRequest(BaseModel):
    text: str
    target_lang: str = 'hi'


class TTSRequest(BaseModel):
    text: str
    lang: str = 'en'


class TranslateAndSpeakRequest(BaseModel):
    text: str


# Temporary storage for generated audio files
TEMP_DIR = "/tmp/tts_audio"
os.makedirs(TEMP_DIR, exist_ok=True)


@app.post("/translate")
async def translate_text(request: TranslationRequest):
    """
    Translate text to a target language (default: Hindi)
    """
    if not HAS_TRANSLATION:
        raise HTTPException(
            status_code=500,
            detail="Translation service not available. Please install required packages."
        )

    try:
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text is required")

        # FIX: Added 'await' here because the library returns a coroutine
        translation = await translator.translate(request.text, dest=request.target_lang)
        
        return {
            "success": True,
            "original_text": request.text,
            "translated_text": translation.text,
            "target_lang": request.target_lang,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation error: {str(e)}")


@app.post("/tts")
async def generate_speech(request: TTSRequest, background_tasks: BackgroundTasks):
    """
    Generate MP3 speech from text using gTTS
    """
    if not HAS_TRANSLATION:
        raise HTTPException(
            status_code=500,
            detail="TTS service not available. Please install: pip install gtts"
        )

    try:
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text is required")

        # Generate speech using gTTS
        # Note: gTTS is synchronous, but usually fast enough for simple use cases.
        # For high load, consider running this in a thread pool.
        tts = gTTS(text=request.text, lang=request.lang, slow=False)

        # Save to BytesIO buffer
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)

        # Save to temp file for serving
        audio_id = str(uuid.uuid4())
        temp_file = os.path.join(TEMP_DIR, f"{audio_id}.mp3")

        with open(temp_file, 'wb') as f:
            f.write(mp3_fp.getvalue())

        # Clean up temp file after 1 hour
        def cleanup_file():
            time.sleep(3600)
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
    """
    Serve generated audio file
    """
    try:
        temp_file = os.path.join(TEMP_DIR, f"{audio_id}.mp3")
        if not os.path.exists(temp_file):
            raise HTTPException(status_code=404, detail="Audio not found")

        return FileResponse(temp_file, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error serving audio: {str(e)}")


@app.post("/translate-and-speak")
async def translate_and_speak(request: TranslateAndSpeakRequest, background_tasks: BackgroundTasks):
    """
    Combined endpoint: translate to Hindi and generate speech
    """
    if not HAS_TRANSLATION:
        raise HTTPException(
            status_code=500,
            detail="Service not available."
        )

    try:
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text is required")

        # Step 1: Translate to Hindi
        # FIX: Added 'await' here because the library returns a coroutine
        translation = await translator.translate(request.text, dest='hi')
        hindi_text = translation.text

        # Step 2: Generate speech in Hindi
        tts = gTTS(text=hindi_text, lang='hi', slow=False)
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)

        # Save to temp file
        audio_id = str(uuid.uuid4())
        temp_file = os.path.join(TEMP_DIR, f"{audio_id}.mp3")

        with open(temp_file, 'wb') as f:
            f.write(mp3_fp.getvalue())

        # Cleanup task
        def cleanup_file():
            time.sleep(3600)
            try:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
            except:
                pass

        background_tasks.add_task(cleanup_file)

        return {
            "success": True,
            "hindi_text": hindi_text,
            "audio_id": audio_id,
            "audio_url": f"/audio/{audio_id}",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Operation failed: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "TTS Microservice",
        "translation_available": HAS_TRANSLATION,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)