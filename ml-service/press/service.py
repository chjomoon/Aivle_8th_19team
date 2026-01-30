# press/service.py
import os
import threading
import numpy as np
import glob
import base64
from io import BytesIO

# =========================
# Globals / Config
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

PRESS_CFG = {
    "TF_AVAILABLE": False,

    # press 폴더 안에 모델이 있다고 가정
    "LSTM_PATH": os.path.join(BASE_DIR, "best_lstm_ae.keras"),
    "CNN_PATH": os.path.join(BASE_DIR, "best_cnn_model.keras"),

    "LSTM_LOADED": False,
    "CNN_LOADED": False,

    "LSTM_ERROR": None,
    "CNN_ERROR": None,
}

lstm_ae_model = None
cnn_model = None

model_lock = threading.Lock()

# ✅ LSTM 시계열 버퍼 (T x F)
data_buffer = []

# ✅ threshold 자동 보정용
THRESH_CFG = {
    # 워밍업 동안은 threshold 고정값(초기 구간 anomaly 난발 방지용)
    "DEFAULT_THRESHOLD": 0.05,

    # 워밍업: error를 모아서 threshold를 계산하는 구간
    "WARMUP_SAMPLES": 40,          # 20~80 사이 추천
    "MIN_SAMPLES_TO_SET": 15,      # 최소 이만큼은 모여야 계산
    "STD_MULTIPLIER": 3.0,         # mean + k*std
    "CLAMP_MIN": 0.02,             # threshold 하한
    "CLAMP_MAX": 10.0,             # threshold 상한 (모델에 따라 조절)

    # 업데이트 전략
    "UPDATE_EVERY": 10,            # 워밍업 이후에도 N번마다 threshold 재계산(드리프트 대응)
    "EMA_ALPHA": 0.35,             # 재계산값을 EMA로 부드럽게 반영 (0.2~0.5)
}

threshold_state = {
    "threshold": THRESH_CFG["DEFAULT_THRESHOLD"],
    "errors": [],          # 최근 error 샘플
    "count": 0,            # 총 업데이트 횟수
    "ready": False,        # 워밍업 완료 여부
}

# ✅ 자동 이미지 소스 폴더 (여기에 샘플 이미지 넣으면 순차로 재생)
PRESS_IMAGE_DIR = os.path.join(BASE_DIR, "sample_images")
os.makedirs(PRESS_IMAGE_DIR, exist_ok=True)

# ✅ 순차 재생 상태 (서버 전체에서 공유)
image_seq_state = {
    "files": [],
    "idx": 0,
}


# =========================
# Optional: Pillow (이미지 로딩/리사이즈용)
# =========================
try:
    from PIL import Image  # pip install pillow
    PIL_AVAILABLE = True
except Exception:
    Image = None
    PIL_AVAILABLE = False


# =========================
# TensorFlow / Keras import
# =========================
try:
    import tensorflow as tf
    from tensorflow.keras.models import load_model

    PRESS_CFG["TF_AVAILABLE"] = True

    # (필요하면) 호환성 패치
    class PatchedLSTM(tf.keras.layers.LSTM):
        def __init__(self, **kwargs):
            kwargs.pop("time_major", None)
            super().__init__(**kwargs)

        @classmethod
        def from_config(cls, config):
            config.pop("time_major", None)
            return super().from_config(config)

    tf.keras.layers.LSTM = PatchedLSTM
    tf.keras.utils.get_custom_objects()["LSTM"] = PatchedLSTM

except Exception as e:
    PRESS_CFG["TF_AVAILABLE"] = False
    PRESS_CFG["LSTM_ERROR"] = f"TensorFlow import error: {e}"
    PRESS_CFG["CNN_ERROR"] = f"TensorFlow import error: {e}"
    tf = None
    load_model = None


# =========================
# Helpers
# =========================
def _safe_load_model(path: str, kind: str):
    """
    kind: 'LSTM' or 'CNN'
    """
    if not PRESS_CFG["TF_AVAILABLE"]:
        return None

    if not os.path.exists(path):
        err = f"{kind} model file not found: {path}"
        if kind == "LSTM":
            PRESS_CFG["LSTM_ERROR"] = err
        else:
            PRESS_CFG["CNN_ERROR"] = err
        return None

    try:
        # compile=False: 불필요한 optimizer/loss 복원 문제를 줄임
        m = load_model(path, compile=False)
        return m
    except Exception as e:
        err = f"{kind} load failed: {e}"
        if kind == "LSTM":
            PRESS_CFG["LSTM_ERROR"] = err
        else:
            PRESS_CFG["CNN_ERROR"] = err
        return None


def load_press_models():
    """
    서버 startup에서 1번 호출되는 게 정상.
    """
    global lstm_ae_model, cnn_model

    with model_lock:
        PRESS_CFG["LSTM_LOADED"] = False
        PRESS_CFG["CNN_LOADED"] = False
        PRESS_CFG["LSTM_ERROR"] = None
        PRESS_CFG["CNN_ERROR"] = None

        if not PRESS_CFG["TF_AVAILABLE"]:
            return PRESS_CFG

        lstm_ae_model = _safe_load_model(PRESS_CFG["LSTM_PATH"], "LSTM")
        cnn_model = _safe_load_model(PRESS_CFG["CNN_PATH"], "CNN")

        PRESS_CFG["LSTM_LOADED"] = lstm_ae_model is not None
        PRESS_CFG["CNN_LOADED"] = cnn_model is not None

        if PRESS_CFG["LSTM_LOADED"]:
            shp = lstm_ae_model.input_shape
            if isinstance(shp, list):
                shp = shp[0]
            print(f"[PRESS] LSTM loaded: {PRESS_CFG['LSTM_PATH']} | input={shp}")
        else:
            print(f"[PRESS] LSTM NOT loaded: {PRESS_CFG['LSTM_ERROR']}")

        if PRESS_CFG["CNN_LOADED"]:
            shp = cnn_model.input_shape
            if isinstance(shp, list):
                shp = shp[0]
            print(f"[PRESS] CNN loaded: {PRESS_CFG['CNN_PATH']} | input={shp}")
        else:
            print(f"[PRESS] CNN NOT loaded: {PRESS_CFG['CNN_ERROR']}")

        # ✅ 모델 로드 시 threshold 상태 초기화 (새로 시작)
        _reset_threshold_state()

        # ✅ 모델 로드 시 이미지 리스트도 갱신
        _refresh_image_list()

        return PRESS_CFG


def get_press_status():
    return {
        "press_tf_available": PRESS_CFG.get("TF_AVAILABLE"),
        "press_lstm_loaded": PRESS_CFG.get("LSTM_LOADED"),
        "press_cnn_loaded": PRESS_CFG.get("CNN_LOADED"),
        "press_lstm_path": PRESS_CFG.get("LSTM_PATH"),
        "press_cnn_path": PRESS_CFG.get("CNN_PATH"),
        "press_lstm_error": PRESS_CFG.get("LSTM_ERROR"),
        "press_cnn_error": PRESS_CFG.get("CNN_ERROR"),
        "press_threshold": threshold_state["threshold"],
        "press_threshold_ready": threshold_state["ready"],
        "press_threshold_samples": len(threshold_state["errors"]),
        "press_image_dir": PRESS_IMAGE_DIR,
        "press_pillow_available": PIL_AVAILABLE,
        "press_image_count": len(image_seq_state["files"]),
        "press_image_idx": image_seq_state["idx"],
    }


def _reset_threshold_state():
    threshold_state["threshold"] = THRESH_CFG["DEFAULT_THRESHOLD"]
    threshold_state["errors"] = []
    threshold_state["count"] = 0
    threshold_state["ready"] = False


def _update_threshold(reconstruction_error: float):
    """
    ✅ threshold 자동 보정:
    - 워밍업 동안 error를 모은 뒤 mean + k*std 로 threshold 설정
    - 이후에도 UPDATE_EVERY마다 재계산해서 EMA로 부드럽게 업데이트
    """
    threshold_state["count"] += 1

    errs = threshold_state["errors"]
    errs.append(float(reconstruction_error))
    if len(errs) > THRESH_CFG["WARMUP_SAMPLES"]:
        del errs[: len(errs) - THRESH_CFG["WARMUP_SAMPLES"]]

    if len(errs) < THRESH_CFG["MIN_SAMPLES_TO_SET"]:
        return

    should_recalc = (not threshold_state["ready"]) or (
        threshold_state["count"] % THRESH_CFG["UPDATE_EVERY"] == 0
    )
    if not should_recalc:
        return

    arr = np.array(errs, dtype=np.float32)
    mu = float(arr.mean())
    sd = float(arr.std() + 1e-8)

    proposed = mu + THRESH_CFG["STD_MULTIPLIER"] * sd
    proposed = float(np.clip(proposed, THRESH_CFG["CLAMP_MIN"], THRESH_CFG["CLAMP_MAX"]))

    prev = float(threshold_state["threshold"])
    alpha = float(THRESH_CFG["EMA_ALPHA"])
    new_thr = prev * (1.0 - alpha) + proposed * alpha

    threshold_state["threshold"] = float(new_thr)
    threshold_state["ready"] = True


# =========================
# SIM INPUT BUILDERS
# =========================
def _make_lstm_input_from_model():
    """
    LSTM AE input shape를 보고 (1, T, F) 형태로 시계열 버퍼 생성.
    ✅ 핵심: 매 호출마다 새 샘플을 1개 추가해서 데이터가 '흐르도록' 만든다.
    """
    global data_buffer

    if lstm_ae_model is None:
        return None

    shp = lstm_ae_model.input_shape
    if isinstance(shp, list):
        shp = shp[0]

    if len(shp) != 3 or shp[1] is None or shp[2] is None:
        raise ValueError(f"Unexpected LSTM input_shape: {shp}")

    T = int(shp[1])
    F = int(shp[2])

    if len(data_buffer) == 0:
        data_buffer = [[float(np.random.normal(0, 1)) for _ in range(F)] for _ in range(T)]

    prev = np.array(data_buffer[-1], dtype=np.float32)
    noise = np.random.normal(0, 0.15, size=(F,)).astype(np.float32)
    new_row = (prev + noise).tolist()

    data_buffer.append([float(v) for v in new_row])

    if len(data_buffer) > T:
        data_buffer = data_buffer[-T:]

    x = np.array(data_buffer, dtype=np.float32).reshape(1, T, F)
    return x, T, F


def _make_cnn_input_from_model():
    """
    CNN input shape에 맞춰 랜덤 이미지 생성.
    예) (None, 200, 200, 1)
    """
    if cnn_model is None:
        return None

    shp = cnn_model.input_shape
    if isinstance(shp, list):
        shp = shp[0]

    if len(shp) != 4 or shp[1] is None or shp[2] is None or shp[3] is None:
        raise ValueError(f"Unexpected CNN input_shape: {shp}")

    H = int(shp[1])
    W = int(shp[2])
    C = int(shp[3])

    x = np.random.randint(0, 256, (1, H, W, C), dtype=np.uint8).astype(np.float32) / 255.0
    return x, (H, W, C)


# =========================
# AUTO IMAGE (SEQUENTIAL) HELPERS
# =========================
def _refresh_image_list():
    """
    sample_images 폴더를 스캔해서 파일 리스트 갱신(이름순)
    """
    exts = ("*.jpg", "*.jpeg", "*.png", "*.bmp", "*.webp")
    files = []
    for e in exts:
        files.extend(glob.glob(os.path.join(PRESS_IMAGE_DIR, e)))
    files = sorted(files)

    image_seq_state["files"] = files
    if image_seq_state["idx"] >= len(files):
        image_seq_state["idx"] = 0


def _pick_next_sample_image_path():
    """
    ✅ 호출될 때마다 다음 이미지 선택 (끝이면 처음으로)
    - 폴더에 파일이 추가/삭제될 수 있으니 매번 refresh
    """
    _refresh_image_list()

    files = image_seq_state["files"]
    if not files:
        return None

    path = files[image_seq_state["idx"]]
    image_seq_state["idx"] = (image_seq_state["idx"] + 1) % len(files)
    return path


def skip_to_next_image():
    """
    ✅ 이미지를 1개 건너뛰기 (재검사 시 다른 이미지 사용)
    """
    _refresh_image_list()
    files = image_seq_state["files"]
    if files:
        image_seq_state["idx"] = (image_seq_state["idx"] + 1) % len(files)


def _load_and_preprocess_for_cnn(img_path: str, H: int, W: int, C: int):
    """
    - CNN 입력 (1,H,W,C) 생성
    - 프론트 표시용 image_base64(JPEG) 생성
    """
    if not PIL_AVAILABLE:
        raise RuntimeError("Pillow not available (pip install pillow)")

    img = Image.open(img_path).convert("RGB")
    img_resized = img.resize((W, H))

    arr = np.array(img_resized, dtype=np.float32) / 255.0  # (H,W,3)

    if C == 1:
        arr = arr.mean(axis=2, keepdims=True)  # (H,W,1)
    elif C == 3:
        pass
    else:
        arr = arr[:, :, :C]

    x = arr.reshape(1, H, W, C)

    buf = BytesIO()
    img_resized.save(buf, format="JPEG", quality=85)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    return x, b64


# =========================
# PREDICT (SIM INPUT + REAL MODEL)
# =========================
def predict_vibration_anomaly_sim():
    """
    ✅ 입력은 시계열 시뮬(버퍼가 흐름)
    ✅ 모델 input_shape에 맞춰 생성해서 모델로 reconstruction error 계산
    ✅ threshold 자동 보정 적용
    """
    with model_lock:
        if lstm_ae_model is None:
            s0 = float(np.random.normal(0, 1))
            s1 = float(np.random.normal(0, 1))
            s2 = float(np.random.normal(0, 1))
            return {
                "reconstruction_error": float(np.random.uniform(0.00, 0.04)),
                "is_anomaly": 0.0,
                "threshold": float(threshold_state["threshold"]),
                "sensor_values": {"sensor_0": s0, "sensor_1": s1, "sensor_2": s2},
                "note": "LSTM not loaded -> mock",
                "threshold_ready": threshold_state["ready"],
                "threshold_samples": len(threshold_state["errors"]),
            }

        x, T, F = _make_lstm_input_from_model()

        reconst = lstm_ae_model.predict(x, verbose=0)

        try:
            mse = np.mean(np.power(x - reconst, 2), axis=(1, 2))
            reconstruction_error = float(mse[0])
        except Exception:
            reconstruction_error = float(np.mean((x - reconst) ** 2))

        _update_threshold(reconstruction_error)

        threshold = float(threshold_state["threshold"])
        is_anomaly = 1.0 if reconstruction_error > threshold else 0.0

        flat = x.reshape(T, F)
        s0 = float(flat[-1, 0]) if F >= 1 else 0.0
        s1 = float(flat[-1, 1]) if F >= 2 else 0.0
        s2 = float(flat[-1, 2]) if F >= 3 else 0.0

        shp = lstm_ae_model.input_shape
        if isinstance(shp, list):
            shp = shp[0]

        return {
            "reconstruction_error": reconstruction_error,
            "is_anomaly": is_anomaly,
            "threshold": threshold,
            "sensor_values": {"sensor_0": s0, "sensor_1": s1, "sensor_2": s2},
            "model_input_shape": list(shp),
            "threshold_ready": threshold_state["ready"],
            "threshold_samples": len(threshold_state["errors"]),
        }


async def predict_press_image_sim():
    """
    ✅ 업로드 없이 서버가 자동으로 이미지 가져와서 예측 (순차 재생):
    - press/sample_images 폴더에서 이름순으로 1장씩 순차 선택
    - CNN input shape(H,W,C)에 맞게 리사이즈 후 예측
    - 프론트 표시용 image_base64 포함 반환
    - 폴더 비었거나 Pillow 없으면 랜덤 시뮬 입력으로 fallback
    """
    classes = ["Scratches", "Pitted Surface", "Rolled-in Scale", "Inclusion", "Crazing", "Patches"]

    with model_lock:
        if cnn_model is None:
            probs = np.random.dirichlet(np.ones(len(classes)), size=1)[0]
            idx = int(np.argmax(probs))
            return {
                "predicted_class": classes[idx],
                "confidence": float(probs[idx]),
                "all_scores": dict(zip(classes, [float(p) for p in probs])),
                "note": "CNN not loaded -> mock",
                "image_base64": None,
                "source": None,
            }

        shp = cnn_model.input_shape
        if isinstance(shp, list):
            shp = shp[0]

        if len(shp) != 4 or shp[1] is None or shp[2] is None or shp[3] is None:
            raise ValueError(f"Unexpected CNN input_shape: {shp}")

        H = int(shp[1])
        W = int(shp[2])
        C = int(shp[3])

        img_path = _pick_next_sample_image_path()

        x = None
        image_b64 = None
        source = None

        # 1) sample_images에서 이미지 로딩 시도 (순차)
        if img_path and PIL_AVAILABLE:
            try:
                x, image_b64 = _load_and_preprocess_for_cnn(img_path, H, W, C)
                source = os.path.basename(img_path)
            except Exception as e:
                x = None
                image_b64 = None
                source = None
                print(f"[PRESS] sample image load failed -> fallback: {e}")

        # 2) fallback: 랜덤 시뮬 입력
        if x is None:
            x, (HH, WW, CC) = _make_cnn_input_from_model()
            source = f"sim_random_{HH}x{WW}x{CC}"

        probs = cnn_model.predict(x, verbose=0)[0]
        probs = np.array(probs, dtype=np.float32)

        if probs.ndim != 1:
            probs = probs.reshape(-1)

        # softmax 안 된 출력이면 정규화
        if probs.min() < 0 or probs.max() > 1.0 or abs(float(probs.sum()) - 1.0) > 1e-3:
            e = np.exp(probs - np.max(probs))
            probs = e / (e.sum() + 1e-8)

        idx = int(np.argmax(probs))

        scores = {}
        for i in range(len(probs)):
            k = classes[i] if i < len(classes) else f"class_{i}"
            scores[k] = float(probs[i])

        top_class = classes[idx] if idx < len(classes) else f"class_{idx}"

        note = None
        if not image_seq_state["files"]:
            note = "sample_images empty -> fallback sim"
        elif not PIL_AVAILABLE:
            note = "pillow missing -> fallback sim (pip install pillow)"

        return {
            "predicted_class": top_class,
            "confidence": float(probs[idx]) if idx < len(probs) else 0.0,
            "all_scores": scores,
            "model_input_shape": list(shp),
            "sim_image_shape": [H, W, C],
            "image_base64": image_b64,  # ✅ 프론트 표시용
            "source": source,           # ✅ 파일명 or sim_random...
            "note": note,
            "sequence": {
                "index_next": image_seq_state["idx"],   # 다음에 보여줄 인덱스(디버그용)
                "count": len(image_seq_state["files"]),
            },
        }
