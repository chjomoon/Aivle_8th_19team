
  # 자동차 공정 리스크 예측 플랫폼

  This is a code bundle for 자동차 공정 리스크 예측 플랫폼.

  ## Running the code
  백엔드 빌드 및 실행: <br>
  cd backend <br>
  ./gradlew bootRun <br>
  ML 서비스 실행: <br>
  python -m uvicorn ml-service.main:app --host 0.0.0.0 --port 8000 --reload <br>
  프론트엔드 실행: <br>
  cd frontend <br>
  npm run dev <br>
  
  
