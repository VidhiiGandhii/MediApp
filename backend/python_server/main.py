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

# Request/Response Models
class SymptomRequest(BaseModel):
    symptoms: list[str]
    user_id: Optional[str] = "anonymous"  # ✅ Made optional

class PredictionResponse(BaseModel):
    predicted_disease: str
    confidence_score: float

# Prediction Endpoint
@app.post("/predict", response_model=PredictionResponse)
async def predict_disease(request: SymptomRequest):
    try:
        print(f"📥 Received request - Symptoms: {request.symptoms}, User: {request.user_id}")
        
        if not request.symptoms:
            raise HTTPException(status_code=400, detail="No symptoms provided.")
        
        input_vector = np.zeros(total_symptoms)

        for symptom in request.symptoms:
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

        return PredictionResponse(
            predicted_disease=predicted_disease.strip(),
            confidence_score=confidence_score
        )
    except Exception as e:
        print(f"❌ Prediction error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "✅ Symptom Checker AI Server is running"}