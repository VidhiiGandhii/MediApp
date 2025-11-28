# OCR Microservice

This microservice provides OCR for uploaded images and PDFs.

Requirements:

- Tesseract OCR installed on the host system and available in PATH.
  - Windows: install Tesseract and add to PATH (e.g., `C:\\Program Files\\Tesseract-OCR\\tesseract.exe`).
- poppler-utils (for `pdf2image`) — on Windows provide `poppler` binary and set `POPPLER_PATH` environment variable or put bin in PATH.

Install Python deps:

```bash
python -m pip install -r requirements.txt
```

Run (development):

```bash
uvicorn main:app --reload --port 8001
```

Endpoint:

- POST `/ocr` multipart form field `file` — returns JSON with `extracted_text` and `summary`.
