# welding_image/pipeline.py
import os
from typing import Dict, List, Any, Optional, Tuple

import cv2
from fastapi import HTTPException

from . import models  # ✅ 모듈 import (중요)

# result 이미지 저장 폴더 (원하면 바꿔도 됨)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVE_DIR = os.path.join(BASE_DIR, "runs", "predict")
os.makedirs(SAVE_DIR, exist_ok=True)


def _ensure_models_loaded():
    # ✅ 모델이 None이면 로드
    if models.stage1_model is None or models.stage2_model is None:
        models.load_welding_image_models()


def is_defect(image_path: str, conf: float = 0.05) -> bool:
    _ensure_models_loaded()

    # ✅ ultralytics는 model.predict(...) 권장
    results = models.stage1_model.predict(image_path, conf=conf, verbose=False)
    if not results:
        return False

    for r in results:
        boxes = getattr(r, "boxes", None)
        if boxes is None or len(boxes) == 0:
            continue

        # Stage1 class 구조: 0:defect, 1:normal 이라 했으니
        # names 확인해서 defect만 True
        for cls_id in boxes.cls:
            cls_name = models.stage1_model.names[int(cls_id)]
            if str(cls_name).lower() == "defect":
                return True

    return False


def classify_defect_and_save_image(image_path: str, conf: float = 0.25) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    _ensure_models_loaded()

    results = models.stage2_model.predict(image_path, conf=conf, verbose=False)
    if not results:
        return [], None

    r = results[0]
    boxes = getattr(r, "boxes", None)
    if boxes is None or len(boxes) == 0:
        return [], None

    defects: List[Dict[str, Any]] = []

    for box, cls_id, score in zip(boxes.xyxy, boxes.cls, boxes.conf):
        defects.append(
            {
                "class": models.stage2_model.names[int(cls_id)],
                "confidence": float(score),
                "bbox": [float(x) for x in box],
            }
        )

    # 시각화 결과 저장 (원하면 제거 가능)
    annotated = r.plot()
    if annotated is not None and annotated.ndim == 3:
        annotated = cv2.cvtColor(annotated, cv2.COLOR_RGB2BGR)

    result_path = os.path.join(SAVE_DIR, os.path.basename(image_path))
    cv2.imwrite(result_path, annotated)

    return defects, result_path


def full_pipeline(image_path: str) -> Dict[str, Any]:
    # Stage1
    if not is_defect(image_path):
        return {"status": "NORMAL", "defects": [], "result_image_path": None}

    # Stage2
    defects, result_image_path = classify_defect_and_save_image(image_path)
    return {"status": "DEFECT", "defects": defects, "result_image_path": result_image_path}
