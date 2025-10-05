import json

import joblib
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Initialize the FastAPI app
app = FastAPI()

# --- Load Models and Data ---
model = joblib.load("models/model.pkl")
label_encoder = joblib.load("models/label_encoder.pkl")

with open("models/symptom_index.json", "r") as f:
    symptom_index = json.load(f)

total_symptoms = len(symptom_index)

# --- Request/Response Models ---
class SymptomRequest(BaseModel):
    symptoms: list[str]

class PredictionResponse(BaseModel):
    predicted_disease: str
    confidence_score: float

# --- Prediction Endpoint ---
@app.post("/predict", response_model=PredictionResponse)
def predict_disease(request: SymptomRequest):
    input_vector = np.zeros(total_symptoms)

    for symptom in request.symptoms:
        if symptom in symptom_index:
            index = symptom_index[symptom]
            input_vector[index] = 1

    input_vector = input_vector.reshape(1, -1)

    prediction_proba = model.predict_proba(input_vector)
    confidence_score = float(np.max(prediction_proba))
    predicted_index = int(np.argmax(prediction_proba))

    predicted_disease = label_encoder.inverse_transform([predicted_index])[0]

    return PredictionResponse(
        predicted_disease=predicted_disease.strip(),
        confidence_score=confidence_score
    )

# --- CORS (Allow Node.js/React Native) ---
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