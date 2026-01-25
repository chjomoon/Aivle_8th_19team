# welding_image/models.py
import os
from ultralytics import YOLO

stage1_model = None
stage2_model = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STAGE1_WEIGHT = os.path.join(BASE_DIR, "stage1_best.pt")
STAGE2_WEIGHT = os.path.join(BASE_DIR, "stage2_best.pt")

def load_welding_image_models():
    """
    stage1_best.pt, stage2_best.pt를 welding_image 폴더에서 로드.
    여러 번 호출돼도 1번만 로드되도록 보호.
    """
    global stage1_model, stage2_model

    if not os.path.exists(STAGE1_WEIGHT):
        raise FileNotFoundError(f"stage1 weight not found: {STAGE1_WEIGHT}")
    if not os.path.exists(STAGE2_WEIGHT):
        raise FileNotFoundError(f"stage2 weight not found: {STAGE2_WEIGHT}")

    if stage1_model is None:
        stage1_model = YOLO(STAGE1_WEIGHT)

    if stage2_model is None:
        stage2_model = YOLO(STAGE2_WEIGHT)
