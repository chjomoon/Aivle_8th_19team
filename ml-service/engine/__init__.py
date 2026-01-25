# ml-service/engine/__init__.py
import os
import numpy as np

import arff  # liac-arff
from tensorflow.keras.models import load_model

model = None

BASE_DIR = os.path.dirname(__file__)

# ✅ 0/1 의미 매핑 (기본: 1=정상, 0=비정상)
NORMAL_LABEL = int(os.getenv("ENGINE_NORMAL_LABEL", "1"))  # 필요시 0으로 바꾸면 "0=정상"도 가능


def load_engine_model():
    global model
    model_path = os.path.join(BASE_DIR, "cnn_best_model.h5")
    model = load_model(model_path)
    print(f"[Engine Package] 모델 로딩 완료: {model_path}")


def _parse_arff_bytes(arff_bytes: bytes) -> np.ndarray:
    """
    ARFF bytes -> numpy
    FordA는 label 컬럼이 포함될 수 있어서:
    - 마지막 컬럼이 {0,1} 또는 {1,-1} 같은 label 패턴이면 자동 제거
    """
    text = arff_bytes.decode("utf-8", errors="ignore")
    obj = arff.loads(text)

    data = obj.get("data", None)
    if not data:
        raise ValueError("ARFF is empty or invalid")

    X = np.array(data, dtype=np.float32)

    if X.ndim == 2 and X.shape[1] >= 2:
        last_col = X[:, -1]
        uniq = set(np.unique(last_col).tolist())

        # ✅ label 후보 패턴(0/1 또는 -1/1)이면 마지막 컬럼 제거
        if uniq.issubset({0.0, 1.0}) or uniq.issubset({-1.0, 1.0}):
            X = X[:, :-1]

    return X


def _ensure_model_input_shape(x1: np.ndarray) -> np.ndarray:
    """
    - (1, T) -> (1, T, 1)
    """
    if x1.ndim == 2:
        return x1[..., np.newaxis]
    if x1.ndim == 3:
        return x1
    raise ValueError(f"Invalid input shape: {x1.shape}")


def _postprocess_to_01(y: np.ndarray) -> int:
    """
    모델 출력 -> 0/1로 변환
    - sigmoid: (1,1)  score>=0.5 => 1 else 0
    - softmax: (1,2)  argmax
    """
    y = np.array(y)

    # sigmoid
    if y.ndim == 2 and y.shape[1] == 1:
        score = float(y[0, 0])
        return 1 if score >= 0.5 else 0

    # softmax (2-class)
    if y.ndim == 2 and y.shape[1] >= 2:
        return int(np.argmax(y[0]))

    # fallback
    score = float(y.reshape(-1)[0])
    return 1 if score >= 0.5 else 0


def predict_from_arff(arff_bytes: bytes):
    """
    Return:
      prediction: int (0 or 1)
      judgement : "NORMAL" | "ABNORMAL"
    """
    global model
    if model is None:
        raise RuntimeError("Engine model not loaded")

    X = _parse_arff_bytes(arff_bytes)
    if X.ndim != 2 or X.shape[0] < 1:
        raise ValueError("ARFF is empty or invalid")

    x1 = X[0:1, :]  # ✅ 첫 행만 예측 (windshield 로직 유지)
    x1 = _ensure_model_input_shape(x1)

    y = model.predict(x1, verbose=0)
    pred = _postprocess_to_01(y)

    if pred not in (0, 1):
        raise ValueError(f"prediction must be 0 or 1, got: {pred}")

    judgement = "NORMAL" if pred == NORMAL_LABEL else "ABNORMAL"
    return pred, judgement
