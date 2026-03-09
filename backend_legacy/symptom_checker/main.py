import json
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os

app = FastAPI()

# Load Models and Data
try:
    model = joblib.load(os.path.join(os.path.dirname(__file__), "models", "model.pkl"))
    label_encoder = joblib.load(os.path.join(os.path.dirname(__file__), "models", "label_encoder.pkl"))
    with open(os.path.join(os.path.dirname(__file__), "models", "symptom_index.json"), "r") as f:
        symptom_index = json.load(f)
except Exception as e:
    raise Exception(f"Failed to load model or data files: {str(e)}")

total_symptoms = len(symptom_index)

# Provide a simple utility to extract symptoms from free text by checking for
# presence of symptom keywords in the submitted text. This is a lightweight
# heuristic to let the frontend submit free-form text (instead of a prepared
# symptom list) and still get predictions.
def extract_symptoms_from_text(text: str):
    found = []
    if not text:
        return found
    lowered = text.lower()
    for sym in symptom_index.keys():
        token = sym.replace('_', ' ').lower()
        if token and token in lowered:
            found.append(sym)
    return found

# Request/Response Models
class SymptomRequest(BaseModel):
    symptoms: list[str]
    user_id: Optional[str] = "anonymous"  # ✅ Made optional

class PredictionResponse(BaseModel):
    predicted_disease: str
    confidence_score: float

@app.post("/predict")
@app.post("/api/predict")
async def predict_disease(request: dict):
    try:
        # Accept either: { "symptoms": [..], "user_id": ".." }
        # or: { "text": "free form user text", "user_id": ".." }
        symptoms = []
        user_id = request.get('user_id', 'anonymous')

        if 'symptoms' in request and isinstance(request['symptoms'], list):
            symptoms = [s for s in request['symptoms'] if isinstance(s, str)]
        elif 'text' in request and isinstance(request['text'], str):
            symptoms = extract_symptoms_from_text(request['text'])

        print(f"📥 Received prediction request - Symptoms: {symptoms}, User: {user_id}")

        if not symptoms:
            # No symptoms found — return an empty prediction payload with found_symptoms empty
            return {
                "found_symptoms": [],
                "predicted_disease": "",
                "confidence_score": 0.0,
            }

        input_vector = np.zeros(total_symptoms)
        for symptom in symptoms:
            if symptom in symptom_index:
                index = symptom_index[symptom]
                input_vector[index] = 1
                print(f"✅ Mapped '{symptom}' to index {index}")
            else:
                print(f"⚠️  Warning: Symptom '{symptom}' not found in symptom_index.")

        input_vector = input_vector.reshape(1, -1)
        prediction_proba = model.predict_proba(input_vector)
        confidence_score = float(np.max(prediction_proba))
        predicted_index = int(np.argmax(prediction_proba))
        predicted_disease = label_encoder.inverse_transform([predicted_index])[0]

        print(f"🎯 Prediction: {predicted_disease} (Confidence: {confidence_score:.2%})")

        return {
            "found_symptoms": symptoms,
            "predicted_disease": predicted_disease.strip(),
            "confidence_score": confidence_score,
        }
    except Exception as e:
        print(f"❌ Prediction error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

# CORS - Allow frontend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "message": "✅ Symptom Checker AI Server is running",
        "total_symptoms": total_symptoms,
        "endpoints": {
            "POST /predict": "Predict disease from symptoms",
            "GET /": "Health check"
        }
    }


@app.get('/api/symptoms')
def list_symptoms():
    """Return a list of available symptom keys to help the frontend present
    quick replies and perform simple matching.
    """
    try:
        return list(symptom_index.keys())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list symptoms: {str(e)}")

@app.get("/health")
def health_check():
    """Health check endpoint for deployment monitoring"""
    return {"status": "healthy"}