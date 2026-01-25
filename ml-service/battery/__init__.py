import joblib
import pandas as pd
import numpy as np
import os
from pydantic import BaseModel

# 현재 파일(__init__.py)이 있는 디렉토리 == 모델 파일이 있는 battery 폴더
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 모델 및 전처리 객체 경로 설정 (같은 폴더 내 위치)
MODEL_PATH = os.path.join(BASE_DIR, "best_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "scaler.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "label_encoder.pkl")

# 전역 변수로 모델 객체 선언
model = None
scaler = None
encoder = None

def load_battery_models():
    """
    배터리 용접 품질 예측을 위한 모델, 스케일러, 인코더를 로드합니다.
    서버 시작 시 한 번만 호출하면 됩니다.
    """
    global model, scaler, encoder
    try:
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
            scaler = joblib.load(SCALER_PATH)
            encoder = joblib.load(ENCODER_PATH)
            print(f"[Battery Package] 모델 로딩 완료: {BASE_DIR}")
            return True
        else:
            print(f"[Battery Error] 모델 파일을 찾을 수 없습니다: {MODEL_PATH}")
            return False
    except Exception as e:
        print(f"[Battery Error] 모델 로딩 중 오류 발생: {e}")
        return False

# 입력 데이터 스키마 정의 (Pydantic 모델)
class BatteryPredictionRequest(BaseModel):
    Speed: int
    Length: float
    RealPower: float
    SetFrequency: int = 1000
    SetDuty: int = 100
    SetPower: int
    GateOnTime: int

def predict_battery_quality(data: BatteryPredictionRequest):
    """
    배터리 용접 데이터를 입력받아 품질(OK/NG)을 예측합니다.
    내부적으로 파생 변수 생성(Feature Engineering)과 스케일링을 수행합니다.
    """
    if not model or not scaler:
        # 혹시 로드가 안되었다면 시도
        if not load_battery_models():
             raise Exception("모델이 로드되지 않았습니다.")

    try:
        # 1. 입력 데이터를 DataFrame으로 변환
        df = pd.DataFrame([data.dict()])
        
        # 2. 파생 변수 생성 (Feature Engineering)
        df['PowerEfficiency'] = df['RealPower'] / (df['SetPower'] + 1)
        df['PowerDifference'] = df['RealPower'] - df['SetPower']
        df['DutyPowerRatio'] = df['SetDuty'] * df['SetPower']
        df['GateOnTimeRatio'] = df['GateOnTime'] / (df['Length'] + 1)
        df['SpeedLengthRatio'] = df['Speed'] * df['Length']
        
        # 3. 컬럼 순서 정렬
        feature_order = [
            'Speed', 'Length', 'RealPower', 'SetFrequency', 'SetDuty', 'SetPower', 'GateOnTime',
            'PowerEfficiency', 'PowerDifference', 'DutyPowerRatio', 'GateOnTimeRatio', 'SpeedLengthRatio'
        ]
        
        X = df[feature_order]

        # 4. 데이터 스케일링
        X_scaled = scaler.transform(X)
        
        # 5. 예측 수행
        prediction = model.predict(X_scaled)
        
        # 6. 결과 라벨 변환
        prediction_label = encoder.inverse_transform(prediction)[0]
        
        return prediction_label
        
    except Exception as e:
        raise Exception(f"예측 처리 중 오류 발생: {str(e)}")
