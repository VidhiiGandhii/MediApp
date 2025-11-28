# Symptom Checker AI Service

ML-based disease prediction from symptoms using FastAPI.

## Features

- 📋 Disease prediction from symptom list
- 🤖 Pre-trained ML model with scikit-learn
- 🔄 CORS enabled for frontend integration
- 📊 Confidence scores for predictions
- ⚡ Fast async endpoints

## Setup

### Prerequisites

- Python 3.8+
- Virtual environment

### Installation

1. **Create and activate virtual environment:**

   ```bash
   python -m venv venv

   # Windows PowerShell
   .venv\Scripts\Activate.ps1

   # Windows CMD
   .venv\Scripts\activate.bat

   # macOS/Linux
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Running the Service

### Development Mode

```bash
uvicorn main:app --port 8002 --reload
```

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8002
```

The service will be available at `http://localhost:8002`

## API Endpoints

### 1. Health Check

```http
GET /health
```

**Response:**

```json
{
  "status": "healthy"
}
```

### 2. Root Endpoint

```http
GET /
```

**Response:**

```json
{
  "message": "✅ Symptom Checker AI Server is running",
  "total_symptoms": 132,
  "endpoints": {
    "POST /predict": "Predict disease from symptoms",
    "GET /": "Health check"
  }
}
```

### 3. Predict Disease

```http
POST /predict
```

**Request Body:**

```json
{
  "symptoms": ["fever", "cough", "headache"],
  "user_id": "user_123" // Optional, defaults to "anonymous"
}
```

**Response:**

```json
{
  "predicted_disease": "Common Cold",
  "confidence_score": 0.85
}
```

**Error Responses:**

- `400`: No symptoms provided
- `500`: Prediction error

## Model Information

- **Model Type**: Pre-trained classifier (scikit-learn)
- **Total Symptoms**: 132
- **Model File**: `models/model.pkl`
- **Label Encoder**: `models/label_encoder.pkl`
- **Symptom Index**: `models/symptom_index.json`

## Frontend Integration

Add this to your Node backend to call the symptom checker:

```javascript
const SYMPTOM_SERVICE_URL =
  process.env.SYMPTOM_SERVICE_URL || "http://localhost:8002";

// In your route handler:
const response = await fetch(`${SYMPTOM_SERVICE_URL}/predict`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    symptoms: userSymptoms,
    user_id: req.user.id,
  }),
});

const result = await response.json();
// result = { predicted_disease, confidence_score }
```

## Troubleshooting

| Issue                                            | Solution                                                  |
| ------------------------------------------------ | --------------------------------------------------------- |
| `ModuleNotFoundError: No module named 'fastapi'` | Run `pip install -r requirements.txt` in activated venv   |
| `FileNotFoundError: models/model.pkl`            | Ensure models directory exists with all .pkl files        |
| `Connection refused`                             | Check if service is running on port 8002                  |
| `CORS errors from frontend`                      | Service has CORS middleware enabled (allow_origins=["*"]) |

## Notes

- Service auto-loads model on startup (cached in memory for fast predictions)
- Invalid symptoms are logged with warnings but don't block prediction
- Confidence scores range from 0.0 to 1.0
- User ID is optional and used for logging/analytics only

## Next Steps

1. Run locally: `uvicorn main:app --port 8002 --reload`
2. Test endpoint: POST to `http://localhost:8002/predict`
3. Integrate with Node backend via `SYMPTOM_SERVICE_URL` env var
4. Deploy to production with proper logging and monitoring
