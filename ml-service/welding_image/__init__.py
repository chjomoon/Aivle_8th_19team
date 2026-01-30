import os
import uuid
import tempfile
import threading
from typing import Dict, Any, Optional, List

from fastapi import UploadFile, HTTPException

from . import models
from .pipeline import full_pipeline

# ✅ 시스템 임시폴더로 저장 (reload 감시 밖)
TEMP_DIR = os.path.join(tempfile.gettempdir(), "welding_image_temp")
os.makedirs(TEMP_DIR, exist_ok=True)

ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

# ✅ 자동 순차 이미지 폴더 (프로젝트의 welding_image/sample_images)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
AUTO_IMAGE_DIR = os.path.join(BASE_DIR, "sample_images")

_auto_lock = threading.Lock()
_auto_state = {
    "files": [],   # type: List[str]
    "idx": 0,
}

def load_welding_image_models():
    models.load_welding_image_models()

def stage1_loaded() -> bool:
    return models.stage1_model is not None

def stage2_loaded() -> bool:
    return models.stage2_model is not None

def _list_auto_files() -> List[str]:
    if not os.path.isdir(AUTO_IMAGE_DIR):
        return []
    files = []
    for fn in sorted(os.listdir(AUTO_IMAGE_DIR)):
        ext = os.path.splitext(fn)[1].lower()
        if ext in ALLOWED_EXT:
            files.append(os.path.join(AUTO_IMAGE_DIR, fn))
    return files

def _get_next_auto_image_path() -> Optional[str]:
    with _auto_lock:
        files = _list_auto_files()
        _auto_state["files"] = files
        if not files:
            return None

        idx = int(_auto_state["idx"]) % len(files)
        path = files[idx]
        _auto_state["idx"] = (idx + 1) % len(files)
        return path

def get_auto_sequence_info() -> Dict[str, int]:
    with _auto_lock:
        files = _auto_state.get("files", []) or _list_auto_files()
        count = len(files)
        next_idx = int(_auto_state.get("idx", 0)) if count else 0
        return {"index_next": next_idx, "count": count}


def skip_to_next_image():
    """
    ✅ 이미지를 1개 건너뛰기 (재검사 시 다른 이미지 사용)
    """
    with _auto_lock:
        files = _list_auto_files()
        _auto_state["files"] = files
        if files:
            _auto_state["idx"] = (_auto_state["idx"] + 1) % len(files)


async def predict_welding_image(file: UploadFile):
    """
    기존 업로드 방식(유지)
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="filename is empty")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"unsupported file type: {ext}")

    # 모델 로드(안 되어있으면)
    if not stage1_loaded() or not stage2_loaded():
        load_welding_image_models()

    tmp_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}{ext}")
    contents = await file.read()
    with open(tmp_path, "wb") as f:
        f.write(contents)

    try:
        return full_pipeline(tmp_path)
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass

def predict_welding_image_auto() -> Dict[str, Any]:
    """
    ✅ 업로드 없이 sample_images 폴더에서 순차적으로 가져와 예측
    반환: pipeline 결과 + source/sequence
    """
    # 모델 로드(안 되어있으면)
    if not stage1_loaded() or not stage2_loaded():
        load_welding_image_models()

    img_path = _get_next_auto_image_path()
    if img_path is None:
        raise HTTPException(
            status_code=404,
            detail=f"no images in {AUTO_IMAGE_DIR} (create folder and add jpg/png files)",
        )

    result = full_pipeline(img_path)
    result["source"] = os.path.basename(img_path)
    result["sequence"] = get_auto_sequence_info()
    result["original_image_path"] = img_path  # main.py에서 URL 만들 때 씀
    return result
