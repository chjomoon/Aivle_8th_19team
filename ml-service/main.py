import os
import shutil
import uuid
import traceback

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
from fastapi.responses import JSONResponse

import press
import battery
import windshield
import engine
from paint import service as paint_service
import body_assembly
from body_assembly import service as body_service

# ✅ welding_image는 "본래 welding-image FastAPI 계약"을 그대로 제공하는 모듈로 구성
from welding_image.pipeline import full_pipeline
from welding_image.schemas import DefectResponse

app = FastAPI(title="ML Service API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# =========================
# Static / Directories (본래와 동일한 방식)
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMP_DIR = os.path.join(BASE_DIR, "temp")
os.makedirs(TEMP_DIR, exist_ok=True)

ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

# ✅ 핵심: BASE_DIR 전체를 /static 으로 서빙
# - temp/xxx.jpg -> /static/temp/xxx.jpg
# - welding_image/runs/predict/yyy.jpg -> /static/welding_image/runs/predict/yyy.jpg
app.mount("/static", StaticFiles(directory=BASE_DIR), name="static")


def to_public_url(abs_path: str) -> str:
    """
    abs_path(절대경로) -> /static/상대경로
    """
    rel = os.path.relpath(abs_path, BASE_DIR).replace("\\", "/")
    return "/static/" + rel


# =========================
# Startup
# =========================
@app.on_event("startup")
def startup_event():
    print("서버 시작: 모델 로딩 중...")
    try:
        battery.load_battery_models()
        windshield.load_windshield_models()
        engine.load_engine_model()
        global PAINT_CFG
        PAINT_CFG = paint_service.load_paint_model(BASE_DIR)
        body_service.load_body_models(BASE_DIR)
        press.load_press_models()

        print("모델 로딩 완료")
    except Exception:
        print("=== STARTUP ERROR ===")
        traceback.print_exc()
        raise


# =========================
# Health
# =========================
@app.get("/")
def read_root():
    return {"message": "ML Service API is running"}

@app.get("/health")
def health():
    return {
        "status": "ok",
        "battery_models_loaded": getattr(battery, "model", None) is not None,
        "windshield_left_loaded": getattr(windshield, "left_model", None) is not None,
        "windshield_right_loaded": getattr(windshield, "right_model", None) is not None,
        "engine_loaded": getattr(engine, "model", None) is not None,
        "paint_loaded": getattr(paint_service, "model", None) is not None,
        **press.get_press_status(),
        **body_service.get_body_status(),
    }


# =========================
# Battery (기존 유지)
# =========================
@app.post("/predict")
def predict_battery_endpoint(data: battery.BatteryPredictionRequest):
    try:
        result = battery.predict_battery_quality(data)
        return {"prediction": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# Windshield (기존 유지)
# =========================
@app.post("/api/v1/smartfactory/windshield")
async def predict_windshield_endpoint(
    side: str = Form(...),
    file: UploadFile = File(...),
):
    try:
        s = side.strip().lower()
        if s not in ("left", "right"):
            raise HTTPException(status_code=400, detail="side must be 'Left' or 'Right'")

        csv_bytes = await file.read()
        prediction, judgement = windshield.predict_from_csv(s, csv_bytes)
        return {"prediction": prediction, "judgement": judgement}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# Engine (기존 유지)
# =========================
@app.post("/api/v1/smartfactory/engine")
async def predict_engine_endpoint(file: UploadFile = File(...)):
    try:
        arff_bytes = await file.read()
        prediction, judgement = engine.predict_from_arff(arff_bytes)
        return {"prediction": prediction, "judgement": judgement}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# Welding Image (본래 welding-image FastAPI 계약과 동일)
# - 입력: file
# - 출력: status, defects, original_image_url, result_image_url
# =========================
async def _welding_predict_core(file: UploadFile) -> DefectResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is empty")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    temp_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}{ext}")

    # ✅ 원본 저장
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # ✅ pipeline 실행
    # result = {"status": ..., "defects": ..., "result_image_path": ...}
    result = full_pipeline(temp_path)

    # ✅ 원본 이미지 URL
    original_url = to_public_url(temp_path)

    # ✅ 결과 이미지 URL (runs/predict에 저장된 경로를 /static/... 으로 노출)
    result_url = None
    if result.get("result_image_path"):
        result_url = to_public_url(result["result_image_path"])

    return DefectResponse(
        status=result["status"],
        defects=result["defects"],
        original_image_url=original_url,
        result_image_url=result_url,
    )


# ✅ 본래 경로
@app.post("/api/v1/welding/image", response_model=DefectResponse)
async def predict_welding_original(file: UploadFile = File(...)):
    try:
        return await _welding_predict_core(file)
    except HTTPException:
        raise
    except Exception as e:
        print("=== WELDING ERROR ===")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ✅ 통합 경로(프론트가 쓰는 경로)
@app.post("/api/v1/smartfactory/welding/image", response_model=DefectResponse)
async def predict_welding_smartfactory(file: UploadFile = File(...)):
    try:
        return await _welding_predict_core(file)
    except HTTPException:
        raise
    except Exception as e:
        print("=== WELDING ERROR ===")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/smartfactory/paint")
async def predict_paint_endpoint(file: UploadFile = File(...)):
    try:
        if PAINT_CFG is None:
            raise HTTPException(status_code=500, detail="paint config not initialized")

        result = paint_service.predict_paint_defect(
            file_obj=file.file,
            original_filename=file.filename,
            base_dir=BASE_DIR,
            save_image_dir=PAINT_CFG["SAVE_IMAGE_DIR"],
            save_label_dir=PAINT_CFG["SAVE_LABEL_DIR"],
            save_result_dir=PAINT_CFG["SAVE_RESULT_DIR"],
            backend_url="http://localhost:3001/api/paint-analysis",  # 필요하면 env로 빼기
        )
        return JSONResponse(status_code=200, content=result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# =========================
# PRESS APIs (SIM INPUT)
# =========================
@app.post("/api/v1/smartfactory/press/vibration")
def predict_press_vibration():
    try:
        return press.predict_vibration_anomaly_sim()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/smartfactory/press/image")
async def predict_press_image():
    try:
        return await press.predict_press_image_sim()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/v1/smartfactory/body/inspect")
async def body_inspect(
    part: str = Form(...),
    file: UploadFile = File(...),
    conf: float = Form(0.25),
):
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="Filename is empty")

        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXT:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

        # 원본 저장 (기존 temp 저장 방식 유지)
        temp_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}{ext}")
        contents = await file.read()
        with open(temp_path, "wb") as f:
            f.write(contents)

        pred = body_service.predict_part(part.strip().lower(), contents, conf=float(conf))
        out_path = body_service.save_annotated_image(pred["annotated_bgr"], BASE_DIR, filename_prefix=part)

        return {
            "part": pred["part"],
            "pass_fail": pred["pass_fail"],
            "detections": pred["detections"],
            "original_image_url": to_public_url(temp_path),
            "result_image_url": to_public_url(out_path),
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/smartfactory/body/inspect/batch")
async def body_inspect_batch(
    door_file: UploadFile = File(None),
    bumper_file: UploadFile = File(None),
    headlamp_file: UploadFile = File(None),
    taillamp_file: UploadFile = File(None),
    radiator_file: UploadFile = File(None),
    conf: float = Form(0.25),
):
    try:
        mapping = {
            "door": door_file,
            "bumper": bumper_file,
            "headlamp": headlamp_file,
            "taillamp": taillamp_file,
            "radiator": radiator_file,
        }

        results = {}
        for part, uf in mapping.items():
            if uf is None:
                results[part] = None
                continue

            ext = os.path.splitext(uf.filename)[1].lower()
            if ext not in ALLOWED_EXT:
                results[part] = {"error": f"Unsupported file type: {ext}"}
                continue

            temp_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}{ext}")
            contents = await uf.read()
            with open(temp_path, "wb") as f:
                f.write(contents)

            pred = body_service.predict_part(part, contents, conf=float(conf))
            out_path = body_service.save_annotated_image(pred["annotated_bgr"], BASE_DIR, filename_prefix=part)

            results[part] = {
                "part": pred["part"],
                "pass_fail": pred["pass_fail"],
                "detections": pred["detections"],
                "original_image_url": to_public_url(temp_path),
                "result_image_url": to_public_url(out_path),
            }

        return {"results": results}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
