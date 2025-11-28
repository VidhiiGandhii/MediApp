# OCR + TTS Microservice

This microservice provides OCR text extraction for PDFs and TTS (text-to-speech) audio generation.

## No System Dependencies Required
Unlike traditional Tesseract-based OCR, this service uses:
- **pdfplumber** for PDF text extraction (pure Python, no system binary)
- **gTTS** for text-to-speech (Google Text-to-Speech, no native install needed)

## Installation

### 1. Create Virtual Environment
```bash
cd backend/ocr_service
python -m venv .venv

# On Windows (PowerShell):
.venv\Scripts\activate

# On Windows (cmd):
.venv\Scripts\activate

# On macOS/Linux:
source .venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

## Running the Service

### Development Mode (with auto-reload)
```bash
uvicorn main:app --reload --port 8001
```

### Production Mode
```bash
uvicorn main:app --port 8001 --workers 4
```

## API Endpoints

### POST /ocr
Extract text from a PDF or image file.

**Request:**
- Multipart form field `file` with PDF or image file

**Response:**
```json
{
  "success": true,
  "fileName": "report.pdf",
  "contentType": "application/pdf",
  "extracted_text": "Full extracted text from the PDF...",
  "summary": "First 800 characters as summary..."
}
```

**Example:**
```bash
curl -X POST http://localhost:8001/ocr -F "file=@report.pdf"
```

### POST /tts
Generate speech (MP3) from text.

**Request:**
```json
{
  "text": "Your text here",
  "lang": "hi",
  "translate": false
}
```

**Parameters:**
- `text` (string, required): Text to convert to speech
- `lang` (string, default="hi"): Language code (e.g., "hi" for Hindi, "en" for English)
- `translate` (boolean, default=false): If true, translate text to target language first

**Response:** Binary MP3 audio stream (Content-Type: audio/mpeg)

**Example:**
```bash
curl -X POST http://localhost:8001/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "lang": "en"}' \
  --output output.mp3
```

## Testing

### Test PDF Extraction
```bash
# Using curl:
curl -X POST http://localhost:8001/ocr -F "file=@test_text.pdf"

# Using Python:
import requests
with open('test_text.pdf', 'rb') as f:
    resp = requests.post('http://localhost:8001/ocr', files={'file': f})
    print(resp.json())
```

### Test TTS
```bash
curl -X POST http://localhost:8001/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "This is a test", "lang": "en"}' \
  --output test_audio.mp3
```

## Notes

- **PDF Support**: pdfplumber works best for "digital" PDFs (text-searchable). Scanned PDFs use tesseract.js on the Node backend.
- **TTS Quality**: gTTS uses Google's free service. For production, consider upgrading to a paid TTS API.
- **Language Support**: gTTS supports 100+ languages. See https://gtts.readthedocs.io/ for language codes.
- **Performance**: First TTS request may take 2-5s. Subsequent calls are faster due to caching.
