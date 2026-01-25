import os, shutil, uuid, time, requests
from datetime import datetime
from ultralytics import YOLO

from .constants import CLASS_NAMES, CLASS_NAMES_KO
from .utils import to_public_url

# 모듈 전역(로드 후 재사용)
model = None

def load_paint_model(base_dir: str):
    """
    base_dir = ml-service 루트 디렉토리 (main.py의 BASE_DIR)
    """
    global model

    model_path = os.path.join(base_dir, "paint", "best.pt")

    save_image_dir  = os.path.join(base_dir, "paint", "detect", "val_predictions", "images")
    save_label_dir  = os.path.join(base_dir, "paint", "detect", "val_predictions", "labels")
    save_result_dir = os.path.join(base_dir, "paint", "detect", "val_predictions", "results")

    os.makedirs(save_image_dir, exist_ok=True)
    os.makedirs(save_label_dir, exist_ok=True)
    os.makedirs(save_result_dir, exist_ok=True)

    model = YOLO(model_path)

    # 로드 후 사용할 경로들을 반환(또는 전역 보관해도 됨)
    return {
        "MODEL_PATH": model_path,
        "SAVE_IMAGE_DIR": save_image_dir,
        "SAVE_LABEL_DIR": save_label_dir,
        "SAVE_RESULT_DIR": save_result_dir,
    }


def _save_to_backend(backend_url: str, analysis_data: dict):
    try:
        r = requests.post(f"{backend_url}/save", json=analysis_data, timeout=5)
        if r.status_code == 200:
            print(f"✅ paint saved: {analysis_data['resultId']}")
        else:
            print(f"⚠️ paint backend save failed: {r.status_code}")
    except Exception as e:
        print(f"❌ paint backend save error: {e}")


def predict_paint_defect(
    *,
    file_obj,                # UploadFile.file 같은 file-like
    original_filename: str,
    base_dir: str,
    save_image_dir: str,
    save_label_dir: str,
    save_result_dir: str,
    backend_url: str = "http://localhost:3001/api/paint-analysis",
):
    """
    FastAPI endpoint가 호출할 핵심 함수
    """
    global model
    if model is None:
        raise RuntimeError("paint model not loaded")

    start_time = time.time()

    img_id = f"pt{uuid.uuid4().hex[:8]}"
    result_id = f"{img_id}_{int(time.time())}"
    img_name = f"{img_id}.jpg"

    image_path = os.path.join(save_image_dir, img_name)

    # 1) 원본 이미지 저장
    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(file_obj, buffer)

    try:
        # 2) YOLO 추론
        results = model.predict(
            source=image_path,
            conf=0.25,
            save=True,
            project=save_result_dir,
            name=img_id
        )
        r = results[0]
        inference_time = int((time.time() - start_time) * 1000)

        public_img_path = to_public_url(image_path, base_dir)

        # 결과 이미지 경로 탐색
        result_img_fs = os.path.join(save_result_dir, img_id, os.path.basename(image_path))
        if not os.path.exists(result_img_fs):
            result_dir = os.path.join(save_result_dir, img_id)
            if os.path.isdir(result_dir):
                files = [f for f in os.listdir(result_dir) if f.lower().endswith((".jpg", ".jpeg", ".png"))]
                if files:
                    result_img_fs = os.path.join(result_dir, files[0])

        public_result_img = to_public_url(result_img_fs, base_dir) if os.path.exists(result_img_fs) else public_img_path

        # 3) 결함 없음
        if len(r.boxes) == 0:
            backend_data = {
                "resultId": result_id,
                "sessionId": f"session_{datetime.now().strftime('%Y%m%d')}",
                "imageFilename": original_filename,
                "imagePath": image_path,
                "imageUrl": public_img_path,
                "resultImageUrl": public_result_img,
                "imageSizeKb": int(os.path.getsize(image_path) / 1024),
                "status": "PASS",
                "primaryDefectType": None,
                "confidence": 100.0,
                "modelVersion": "YOLOv8-best",
                "inferenceTimeMs": inference_time,
                "locationCode": "도장실-A",
                "detectedDefects": []
            }
            _save_to_backend(backend_url, backend_data)

            # 원본 삭제(원하면 유지로 변경 가능)
            if os.path.exists(image_path):
                os.remove(image_path)

            return {
                "status": "success",
                "message": "no defect detected",
                "data": {
                    "result_id": result_id,
                    "img_id": img_id,
                    "img_name": img_name,
                    "img_path": public_img_path,
                    "img_result": public_result_img,
                    "defect_type": -1,
                    "defect_score": 1.0,
                    "label_name": None,
                    "label_path": None,
                    "label_name_text": "없음",
                    "inference_time_ms": inference_time
                }
            }

        # 4) 결함 있음
        best_box = max(r.boxes, key=lambda x: float(x.conf))
        class_id = int(best_box.cls)
        score = float(best_box.conf)

        # 라벨 저장
        label_name = f"{img_id}.txt"
        label_path_fs = os.path.join(save_label_dir, label_name)
        with open(label_path_fs, "w") as f:
            for box in r.boxes:
                cls = int(box.cls)
                conf = float(box.conf)
                xyxy = box.xyxy[0].tolist()
                f.write(f"{cls} {conf:.4f} {xyxy}\n")

        public_label_path = to_public_url(label_path_fs, base_dir)

        detected_defects = []
        for box in r.boxes:
            cls = int(box.cls)
            conf = float(box.conf)
            xyxy = box.xyxy[0].tolist()
            bbox_area = int((xyxy[2] - xyxy[0]) * (xyxy[3] - xyxy[1]))

            severity = "LOW"
            if conf >= 0.9:
                severity = "CRITICAL"
            elif conf >= 0.7:
                severity = "HIGH"
            elif conf >= 0.5:
                severity = "MEDIUM"

            detected_defects.append({
                "resultId": result_id,
                "defectClass": CLASS_NAMES[cls],
                "defectNameKo": CLASS_NAMES_KO[cls],
                "defectNameEn": CLASS_NAMES[cls],
                "confidence": round(conf * 100, 2),
                "bboxX1": int(xyxy[0]),
                "bboxY1": int(xyxy[1]),
                "bboxX2": int(xyxy[2]),
                "bboxY2": int(xyxy[3]),
                "bboxArea": bbox_area,
                "severityLevel": severity
            })

        backend_data = {
            "resultId": result_id,
            "sessionId": f"session_{datetime.now().strftime('%Y%m%d')}",
            "imageFilename": original_filename,
            "imagePath": image_path,
            "imageUrl": public_img_path,
            "resultImageUrl": public_result_img,
            "imageSizeKb": int(os.path.getsize(image_path) / 1024),
            "status": "FAIL",
            "primaryDefectType": CLASS_NAMES[class_id],
            "confidence": round(score * 100, 2),
            "modelVersion": "YOLOv8-best",
            "inferenceTimeMs": inference_time,
            "locationCode": "도장실-A",
            "detectedDefects": detected_defects
        }
        _save_to_backend(backend_url, backend_data)

        if os.path.exists(image_path):
            os.remove(image_path)

        return {
            "status": "success",
            "message": "defect detected",
            "data": {
                "result_id": result_id,
                "img_id": img_id,
                "img_name": img_name,
                "img_path": public_img_path,
                "img_result": public_result_img,
                "defect_type": class_id,
                "defect_score": round(score, 4),
                "label_name": label_name,
                "label_path": public_label_path,
                "label_name_text": CLASS_NAMES[class_id],
                "label_name_ko": CLASS_NAMES_KO[class_id],
                "inference_time_ms": inference_time,
                "detected_defects": detected_defects
            }
        }

    except Exception:
        # 실패 시 원본 삭제
        if os.path.exists(image_path):
            os.remove(image_path)
        raise
