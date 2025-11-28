# MediApp OCR + TTS Integration — Complete Setup & Run Guide

## Overview
This guide covers how to run the **MediApp** project with:
- **Frontend**: React Native (Expo) — handles document upload & chat UI
- **Node.js Backend**: Express + MongoDB — manages files, documents, and chat history
- **Python OCR Service**: FastAPI — extracts text from PDFs and generates speech (TTS)

---

## Architecture Summary

```
Frontend (React Native/Expo)
    ↓
Node.js Server (Express, Auth, GridFS)
    ├→ Python OCR Service (pdfplumber, gTTS)
    └→ MongoDB Atlas
```

### Data Flow
1. **Upload File** → Frontend → Node `/api/upload-with-ocr`
2. **Node determines file type**:
   - **PDF** → Python `/ocr` (pdfplumber extraction)
   - **Image** → tesseract.js (Node-side OCR)
3. **Node requests TTS** → Python `/tts` → MP3 returned
4. **Node saves** Document + ChatMessage + audio → MongoDB GridFS
5. **Chat Screen** → Node `/api/chat/messages` → Display summaries & play audio

---

## Prerequisites

- **Git** (version control)
- **Node.js** (v16+) with npm
- **Python** (v3.9+) with pip
- **MongoDB Atlas** account (free tier OK) or local MongoDB
- **Expo CLI** (for React Native development)

### Quick Install (if not already installed)
```bash
# Node.js (Windows)
# Download from https://nodejs.org/ or use Chocolatey:
choco install nodejs -y

# Python (Windows)
# Download from https://python.org/ or use Chocolatey:
choco install python -y

# Expo CLI
npm install -g expo-cli

# Git
choco install git -y
```

---

## Setup Instructions

### 1. Clone & Enter Repository
```bash
git clone https://github.com/VidhiiGandhii/MediApp.git
cd MediApp
```

### 2. Python OCR Service Setup

#### Install Python Dependencies
```bash
cd backend/ocr_service
python -m venv .venv

# On Windows (PowerShell):
.venv\Scripts\activate

# Or Windows (cmd):
.venv\Scripts\activate

# On macOS/Linux:
source .venv/bin/activate

# Install requirements
pip install -r requirements.txt
```

#### Run Python OCR Service
```bash
# Make sure venv is activated, then:
uvicorn main:app --port 8001

# Expected output:
# INFO:     Uvicorn running on http://127.0.0.1:8001 (Press CTRL+C to quit)
```

### 3. Node.js Backend Setup

#### Create `.env` File
In the `backend/node_server/` directory, create a `.env` file:

```bash
cd backend/node_server
```

Create `.env` with:
```
MONGO_URI=mongodb+srv://<USERNAME>:<PASSWORD>@cluster.mongodb.net/mediapp?retryWrites=true&w=majority
JWT_SECRET=your_secret_jwt_key_here_change_in_production
PORT=3000
NODE_ENV=development
OCR_SERVICE_URL=http://localhost:8001
```

**Note**: Replace `<USERNAME>` and `<PASSWORD>` with your MongoDB Atlas credentials. Get your connection string from MongoDB Atlas → "Connect" → "Drivers".

#### Install Node Dependencies
```bash
npm install
```

#### Run Node Backend
```bash
# In backend/node_server:
node server.js

# Expected output:
# 🚀 MediApp Node.js Backend Started Successfully!
# 📍 Local:       http://localhost:3000
```

### 4. Frontend (Expo) Setup

#### Update API Configuration
Edit `config/api.ts`:
```typescript
// For development (local):
export const API_URL = 'http://localhost:3000';

// For production (Render):
// export const API_URL = 'https://your-render-url.onrender.com';
```

#### Install Frontend Dependencies
```bash
# From project root:
npm install
# or
yarn install
```

#### Run Frontend
```bash
# From project root:
npx expo start

# You'll see a menu. Press:
# 'i' for iOS (simulator) or
# 'a' for Android (emulator) or
# 'j' for web preview
```

---

## Running Everything Together (Development)

### Terminal Setup (Recommended)

Open **4 separate terminals**:

**Terminal 1 — Python OCR Service:**
```bash
cd backend/ocr_service
.venv\Scripts\activate  # Windows
python -m venv .venv    # If venv not created
pip install -r requirements.txt
uvicorn main:app --port 8001
```

**Terminal 2 — Node.js Backend:**
```bash
cd backend/node_server
npm install
node server.js
```

**Terminal 3 — Frontend (Expo):**
```bash
npx expo start
# Press 'a' for Android emulator or 'i' for iOS simulator
```

**Terminal 4 (Optional) — Monitoring:**
```bash
# Watch for errors or use curl to test endpoints:
curl -X POST http://localhost:3000/api/health
```

---

## Testing the Flow

### Quick Test: Upload a PDF

1. **Start all 3 services** (see above)
2. **Open the app** (Expo) and **log in**
3. **Go to "Upload Documents" tab**
4. **Upload a PDF** (or use the sample in `backend/ocr_service/test_text.pdf`)
5. **Wait for processing** (OCR + TTS)
6. **Check "OCR Chat" tab** to see results
7. **Play the audio summary** 🎵

---

## Troubleshooting

### Issue: "Cannot connect to MongoDB"
**Solution**: Check MONGO_URI in `.env`. Ensure:
- Credentials are URL-encoded (special chars use %xx)
- IP address is whitelisted in MongoDB Atlas (allow 0.0.0.0 for dev)
- Network connection is active

### Issue: "OCR Service Not Found"
**Solution**: Ensure Python service is running:
```bash
curl http://localhost:8001/docs  # Should show Swagger API docs
```

### Issue: "Token Expired / Auth Error"
**Solution**: Re-login in the app. Ensure JWT_SECRET is consistent across all Node instances.

### Issue: Audio won't play on frontend
**Solution**: Ensure headers include Authorization token. Check network tab in browser DevTools. Verify gTTS is running on Python service.

---

## Deployment: Render + Local Dev Conflict?

### **Short Answer**: No conflict if you configure correctly.

You're running two separate backends:
- **Local**: `http://localhost:3000` (for development)
- **Render**: `https://your-app.onrender.com` (for production)

### Configuration Approach:

**Option A: Environment-based (Recommended)**

Update `config/api.ts`:
```typescript
const ENV = process.env.NODE_ENV || 'development';

export const API_URL = ENV === 'production' 
  ? 'https://your-render-app.onrender.com'
  : 'http://localhost:3000';
```

**Option B: Build-time configuration**

Use Expo's `.env` file:
```
# .env.local (development)
EXPO_PUBLIC_API_URL=http://localhost:3000

# .env.production (production build)
EXPO_PUBLIC_API_URL=https://your-render-app.onrender.com
```

Then access in code:
```typescript
import Constants from 'expo-constants';
export const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';
```

### When to Use Which:
- **Developing locally** → `API_URL = http://localhost:3000`
- **Testing production build** → `API_URL = https://render-url.onrender.com`
- **Deploying to production** → Build with production `.env`, deploy to Render

---

## Database Schema

### Document (GridFS File + Metadata)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  fileName: String,
  fileId: ObjectId (GridFS ref),
  fileType: String,
  fileSize: Number,
  category: String,
  description: String,
  ocrText: String,           // Full extracted text
  ocrSummary: String,        // Short summary
  uploadedAt: Date
}
```

### ChatMessage (OCR Results + Audio)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  documentId: ObjectId (ref to Document),
  summary: String,           // For display
  fullText: String,          // Original OCR text
  audioFileId: ObjectId,     // GridFS ref to MP3
  createdAt: Date
}
```

---

## API Endpoints

### Node.js Backend

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST   | `/api/upload-with-ocr` | ✓ | Upload file, OCR, TTS, create chat |
| GET    | `/api/chat/messages` | ✓ | List user's chat messages |
| GET    | `/api/chat/:id/audio` | ✓ | Stream audio MP3 |
| GET    | `/api/documents` | ✓ | List user's documents |
| DELETE | `/api/documents/:id` | ✓ | Delete a document |

### Python OCR Service

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/ocr` | Extract text from PDF or image |
| POST   | `/tts` | Generate MP3 speech from text (Hindi/English) |

---

## Performance Tips

1. **PDF Size**: Keep PDFs under 50 MB (configured in `backend/node_server`)
2. **Audio Generation**: First TTS call may take 5-10s. Subsequent calls cache results.
3. **Rendering**: If Render is slow to boot, use Render's "Disk" to reduce cold starts
4. **Local Testing**: Use a local MongoDB instance for faster I/O

```bash
# If you have Docker, run local MongoDB:
docker run -d -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password mongo
# Then MONGO_URI=mongodb://admin:password@localhost:27017/mediapp
```

---

## Next Steps

1. ✅ **Run all 3 services** (Python, Node, Expo)
2. ✅ **Upload a test document** (PDF or image)
3. ✅ **Check OCR Chat** tab for results
4. ✅ **Play audio summary** 
5. ✅ **Deploy to Render** when ready (Node backend only; Python stays local or use separate service)

---

## Support & Issues

For bugs or questions:
1. Check error logs in each terminal
2. Verify all services are running
3. Ensure `.env` has correct credentials
4. Clear app cache: `Expo > Dev Client > Clear Cache`
5. Restart all services

---

## Summary of Files Added/Modified

### New Files
- `backend/ocr_service/main.py` (FastAPI OCR + TTS)
- `backend/node_server/models/ChatMessage.js` (Chat schema)
- `backend/node_server/routes/chatRoutes.js` (Chat endpoints)
- `backend/node_server/controllers/ocrController.js` (Enhanced)
- `app/screens/OCRChat.tsx` (New chat screen)
- `app/(tabs)/ocrChat.tsx` (Tab route)

### Modified Files
- `backend/node_server/routes/index.js` (Added chat routes)
- `app/(tabs)/_layout.tsx` (Added OCR Chat tab)
- `backend/ocr_service/requirements.txt` (Updated deps)

---

Happy coding! 🎉
