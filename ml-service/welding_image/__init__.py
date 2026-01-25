import os
import uuid
import tempfile
from fastapi import UploadFile, HTTPException

from . import models
from .pipeline import full_pipeline

# ✅ 시스템 임시폴더로 저장 (reload 감시 밖)
TEMP_DIR = os.path.join(tempfile.gettempdir(), "welding_image_temp")
os.makedirs(TEMP_DIR, exist_ok=True)

ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

def load_welding_image_models():
    models.load_welding_image_models()

def stage1_loaded() -> bool:
    return models.stage1_model is not None

def stage2_loaded() -> bool:
    return models.stage2_model is not None

async def predict_welding_image(file: UploadFile):
    """
    FastAPI endpoint용:
    입력: form-data file=image
    출력(정의서 그대로):
    {
      "status": "NORMAL"|"DEFECT",
      "defects": [{class,confidence,bbox}]
    }
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="filename is empty")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"unsupported file type: {ext}")

    # 모델 로드(안 되어있으면)
    if not stage1_loaded() or not stage2_loaded():
        load_welding_image_models()

    # ✅ 업로드 파일 저장(바이트 방식이 Windows에서 안정적)
    tmp_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}{ext}")
    contents = await file.read()
    with open(tmp_path, "wb") as f:
        f.write(contents)

    try:
        return full_pipeline(tmp_path)
    finally:
        # 임시파일 정리(원하면 주석 처리)
        try:
            os.remove(tmp_path)
        except Exception:
            pass
