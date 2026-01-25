# ml-service/windshield/__init__.py
import io
import os
import numpy as np
import joblib
import pandas as pd

left_model = None
right_model = None

BASE_DIR = os.path.dirname(__file__)

# ✅ 0/1 의미 매핑 (팀 기준에 맞게 선택)
# 예시 A) 1=PASS(정상), 0=FAIL(불량)
PASS_LABEL = int(os.getenv("WINDSHIELD_PASS_LABEL", "1"))  # 필요하면 환경변수로 바꿀 수 있게

def load_windshield_models():
    global left_model, right_model

    left_path = os.path.join(BASE_DIR, "svm_left_model.pkl")
    right_path = os.path.join(BASE_DIR, "svm_right_model.pkl")

    left_model = joblib.load(left_path)
    right_model = joblib.load(right_path)

    print(f"[Windshield Package] 모델 로딩 완료: {BASE_DIR}")

def _parse_csv_bytes(csv_bytes: bytes) -> np.ndarray:
    df = pd.read_csv(io.BytesIO(csv_bytes), header=None)
    return df.to_numpy(dtype=np.float32)

def predict_from_csv(side: str, csv_bytes: bytes):
    """
    분류 모델(0/1) 예측.
    Return:
      prediction: int (0 or 1)
      judgement : "PASS" | "FAIL"
    """
    side = (side or "").strip().lower()
    if side not in ("left", "right"):
        raise ValueError('side must be "left" or "right"')

    if side == "left" and left_model is None:
        raise RuntimeError("Left model not loaded")
    if side == "right" and right_model is None:
        raise RuntimeError("Right model not loaded")

    X = _parse_csv_bytes(csv_bytes)
    if X.ndim != 2 or X.shape[0] < 1:
        raise ValueError("CSV is empty or invalid")

    x1 = X[0:1, :]  # 첫 행만 예측 (지금 로직 유지)

    model = left_model if side == "left" else right_model
    pred_raw = model.predict(x1)[0]

    # ✅ 0/1로 강제 변환 + 검증
    try:
        pred = int(pred_raw)
    except Exception:
        raise ValueError(f"model.predict output is not int-like: {pred_raw}")

    if pred not in (0, 1):
        raise ValueError(f"prediction must be 0 or 1, got: {pred}")

    judgement = "PASS" if pred == PASS_LABEL else "FAIL"
    return pred, judgement
