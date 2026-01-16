from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import os

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os

# Get the directory where main.py is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load models using absolute paths
MODEL_PATH = os.path.join(BASE_DIR, "best_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "scaler.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "label_encoder.pkl")

model = None
scaler = None
encoder = None

def load_models():
    global model, scaler, encoder
    try:
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        encoder = joblib.load(ENCODER_PATH)
        print("Models loaded successfully")
    except Exception as e:
        print(f"Error loading models: {e}")

load_models()

class PredictionRequest(BaseModel):
    Speed: int
    Length: float
    RealPower: float
    SetFrequency: int = 1000
    SetDuty: int = 100
    SetPower: int
    GateOnTime: int

@app.post("/predict")
def predict(data: PredictionRequest):
    if not model or not scaler:
        raise HTTPException(status_code=500, detail="Models not loaded")
    
    # Feature Engineering
    # 12 Features total:
    # Original: Speed, Length, RealPower, SetFrequency, SetDuty, SetPower, GateOnTime
    # Engineered: PowerEfficiency, PowerDifference, DutyPowerRatio, GateOnTimeRatio, SpeedLengthRatio
    
    try:
        df = pd.DataFrame([data.dict()])
        
        # Calculate engineered features
        df['PowerEfficiency'] = df['RealPower'] / (df['SetPower'] + 1)
        df['PowerDifference'] = df['RealPower'] - df['SetPower']
        df['DutyPowerRatio'] = df['SetDuty'] * df['SetPower']
        df['GateOnTimeRatio'] = df['GateOnTime'] / (df['Length'] + 1)
        df['SpeedLengthRatio'] = df['Speed'] * df['Length']
        
        # Ensure correct column order
        feature_order = [
            'Speed', 'Length', 'RealPower', 'SetFrequency', 'SetDuty', 'SetPower', 'GateOnTime',
            'PowerEfficiency', 'PowerDifference', 'DutyPowerRatio', 'GateOnTimeRatio', 'SpeedLengthRatio'
        ]
        
        X = df[feature_order]
        X_scaled = scaler.transform(X)
        
        prediction = model.predict(X_scaled)
        prediction_label = encoder.inverse_transform(prediction)[0]
        
        # Probability if available
        # prediction_proba = model.predict_proba(X_scaled).max()
        
        return {
            "prediction": prediction_label,
            # "confidence": float(prediction_proba)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": model is not None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
