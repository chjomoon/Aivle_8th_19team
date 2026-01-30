import os
import uuid
from typing import Dict, Any, List, Optional

import cv2
from ultralytics import YOLO

import glob

MODELS: Dict[str, YOLO] = {}
CFG: Dict[str, Any] = {
    "LOADED": False,
    "ERROR": None,
    "MODEL_PATHS": {},
    "SAVE_DIR": None,
}

ALLOWED_PARTS = {"door", "bumper", "headlamp", "taillamp", "radiator"}

def load_body_models(base_dir: str):
    """
    base_dir = ml-service 폴더 절대경로 (main.py에서 BASE_DIR 넘겨줄 것)
    """
    try:
        body_dir = os.path.join(base_dir, "body_assembly")
        model_dir = os.path.join(body_dir, "models")
        save_dir  = os.path.join(body_dir, "runs")
        os.makedirs(save_dir, exist_ok=True)

        paths = {
            "door": os.path.join(model_dir, "door_best.pt"),
            "bumper": os.path.join(model_dir, "bumper_best.pt"),
            "headlamp": os.path.join(model_dir, "headlamp_best.pt"),
            "taillamp": os.path.join(model_dir, "taillamp_best.pt"),
            "radiator": os.path.join(model_dir, "radiator_best.pt"),
        }

        # 파일 존재 체크
        for k, p in paths.items():
            if not os.path.exists(p):
                raise FileNotFoundError(f"[body_assembly] missing model: {k} -> {p}")

        # 모델 로딩
        MODELS.clear()
        for part, p in paths.items():
            MODELS[part] = YOLO(p)

        CFG["MODEL_PATHS"] = paths
        CFG["SAVE_DIR"] = save_dir
        CFG["LOADED"] = True
        CFG["ERROR"] = None

        return True

    except Exception as e:
        CFG["LOADED"] = False
        CFG["ERROR"] = str(e)
        raise


def get_body_status() -> Dict[str, Any]:
    return {
        "body_loaded": CFG["LOADED"],
        "body_error": CFG["ERROR"],
        "body_models": list(MODELS.keys()),
    }


def _decode_image(image_bytes: bytes):
    import numpy as np
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid image bytes")
    return img


def predict_part(
    part: str,
    image_bytes: bytes,
    conf: float = 0.25,
    iou: float = 0.45,
    max_det: int = 100,
) -> Dict[str, Any]:
    """
    return:
      - pass_fail: PASS/FAIL
      - detections: [{cls,name,conf,bbox[x1,y1,x2,y2]}]
      - annotated_bgr: (np.ndarray) annotated image (for saving)
    """
    if part not in ALLOWED_PARTS:
        raise ValueError(f"part must be one of {sorted(ALLOWED_PARTS)}")

    if not CFG["LOADED"] or part not in MODELS:
        raise RuntimeError("Body models not loaded")

    img = _decode_image(image_bytes)
    model = MODELS[part]

    # ultralytics inference
    results = model.predict(
        source=img,
        conf=conf,
        iou=iou,
        max_det=max_det,
        verbose=False
    )

    r0 = results[0]
    names = r0.names  # class idx -> name

    detections: List[Dict[str, Any]] = []
    if r0.boxes is not None and len(r0.boxes) > 0:
        for b in r0.boxes:
            cls_id = int(b.cls.item())
            conf_v = float(b.conf.item())
            x1, y1, x2, y2 = map(float, b.xyxy[0].tolist())
            detections.append({
                "cls": cls_id,
                "name": names.get(cls_id, str(cls_id)),
                "conf": round(conf_v, 4),
                "bbox": [round(x1, 2), round(y1, 2), round(x2, 2), round(y2, 2)]
            })

    pass_fail = "FAIL" if len(detections) > 0 else "PASS"

    # annotated image (ultralytics plot은 RGB로 그려주는데 cv2 저장은 BGR)
    annotated = r0.plot()  # numpy array (RGB)
    annotated_bgr = cv2.cvtColor(annotated, cv2.COLOR_RGB2BGR)

    return {
        "part": part,
        "pass_fail": pass_fail,
        "detections": detections,
        "annotated_bgr": annotated_bgr
    }


def save_annotated_image(annotated_bgr, base_dir: str, filename_prefix: str = "body"):
    save_dir = CFG["SAVE_DIR"] or os.path.join(base_dir, "body_assembly", "runs")
    os.makedirs(save_dir, exist_ok=True)

    out_name = f"{filename_prefix}_{uuid.uuid4().hex}.jpg"
    out_path = os.path.join(save_dir, out_name)
    cv2.imwrite(out_path, annotated_bgr)
    return out_path

AUTO_STATE: Dict[str, Any] = {
    "INDEX": {  # part별 다음 인덱스
        "door": 0,
        "bumper": 0,
        "headlamp": 0,
        "taillamp": 0,
        "radiator": 0,
    }
}

def _list_sample_images(base_dir: str, part: str) -> List[str]:
    """
    ml-service/body_assembly/samples/{part}/*.jpg|png...
    """
    sample_dir = os.path.join(base_dir, "body_assembly", "samples", part)
    exts = ("*.jpg", "*.jpeg", "*.png", "*.bmp", "*.webp")
    paths: List[str] = []
    for ext in exts:
        paths.extend(glob.glob(os.path.join(sample_dir, ext)))
    paths = sorted(paths)
    return paths


def skip_to_next_image(part: str):
    """
    ✅ 특정 파트의 이미지를 1개 건너뛰기 (재검사 시 다른 이미지 사용)
    """
    part = part.strip().lower()
    if part in ALLOWED_PARTS:
        AUTO_STATE["INDEX"][part] = AUTO_STATE["INDEX"].get(part, 0) + 1


def predict_part_auto(
    part: str,
    base_dir: str,
    conf: float = 0.25,
    iou: float = 0.45,
    max_det: int = 100,
) -> Dict[str, Any]:
    """
    samples 폴더에서 part별 이미지를 순차로 꺼내서 predict_part 수행
    return에 source/sequence/original_image_path 포함
    """
    part = part.strip().lower()
    if part not in ALLOWED_PARTS:
        raise ValueError(f"part must be one of {sorted(ALLOWED_PARTS)}")

    if not CFG["LOADED"] or part not in MODELS:
        raise RuntimeError("Body models not loaded")

    sample_paths = _list_sample_images(base_dir, part)
    if not sample_paths:
        raise FileNotFoundError(
            f"[body_assembly] no sample images: {os.path.join(base_dir, 'body_assembly', 'samples', part)}"
        )

    idx = int(AUTO_STATE["INDEX"].get(part, 0))
    if idx >= len(sample_paths):
        idx = 0

    chosen_path = sample_paths[idx]
    AUTO_STATE["INDEX"][part] = idx + 1  # 다음 호출 대비

    with open(chosen_path, "rb") as f:
        image_bytes = f.read()

    pred = predict_part(part, image_bytes, conf=conf, iou=iou, max_det=max_det)
    pred["source"] = chosen_path
    pred["sequence"] = {"index_next": AUTO_STATE["INDEX"][part], "count": len(sample_paths)}
    pred["original_image_path"] = chosen_path
    return pred