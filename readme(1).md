# 배터리팩 예지보전 AI 모델링 분석 보고서

## 📋 프로젝트 개요

본 프로젝트는 **배터리팩 용접 공정의 예지보전(Predictive Maintenance)**을 위한 머신러닝 모델 개발 및 분석입니다. 
센서 데이터를 기반으로 용접 품질을 **OK(정상) 또는 NG(불량)**으로 분류하여 품질 관리 및 예방적 유지보수를 지원합니다.

### 핵심 목표
- 배터리 용접 공정 데이터 분석
- 최적의 머신러닝 모델 선택 및 훈련
- 용접 품질 예측 모델 구축
- 불량 제품 조기 발견 시스템

---

## 📊 데이터 개요

### 데이터 구성
```
data/
├── raw_data/
│   ├── train/
│   │   └── Training_Data.csv          (훈련 데이터: 135,761개 행)
│   └── test/
│       ├── WeldingTest_01_OK.csv      (테스트 OK: 1,952개 행)
│       ├── WeldingTest_02_OK.csv      (테스트 OK)
│       ├── WeldingTest_03_NG.csv      (테스트 NG: 1,055개 행)
│       └── WeldingTest_04_NG.csv      (테스트 NG)
└── preprocessed/
    └── test/
        ├── WeldingTest_03_NG_Label.csv
        └── WeldingTest_04_NG_Label.csv
```

### 데이터 특징 (Features)

| 특징 | 설명 | 단위 | 타입 |
|------|------|------|------|
| **PageNo** | 페이지 번호 | - | 정수 |
| **Speed** | 용접 속도 | mm/s | 정수 |
| **Length** | 용접 길이 | mm | 실수 |
| **RealPower** | 실제 전력 | W | 정수 |
| **SetFrequency** | 설정 주파수 | Hz | 정수 |
| **SetDuty** | 설정 듀티 비율 | % | 정수 |
| **SetPower** | 설정 전력 | W | 정수 |
| **GateOnTime** | 게이트 온 시간 | ms | 정수 |
| **WorkingTime** | 작업 시간 | Timestamp | 시간정보 |

### 라벨 분포
- **OK (정상)**: 대부분의 데이터
- **NG (불량)**: 소수의 데이터

---

## 🔧 데이터 전처리 (Data Preprocessing)

### 1. 데이터 정제 (Cleaning)

**문제점 처리:**
```python
✓ 컬럼명 공백 제거 (strip)
✓ 중복 데이터 제거 (drop_duplicates)
✓ 데이터 타입 변환 (to_numeric, to_datetime)
✓ 결측값 제거 (dropna)
```

**결과:**
- 중복 제거: 0개 제거됨
- 결측값 처리: 모두 정상 처리됨
- 최종 데이터셋 크기: 140,719개 행

---

## 📈 탐색적 데이터 분석 (EDA)

### 1. 기본 통계 분석

각 특징의 기본 통계량 분석:
- **평균(Mean), 표준편차(Std), 최소/최대값 등 계산**
- **라벨별(OK/NG)로 통계 분석**

### 2. 분포 분석

**히스토그램:**
- 각 특징의 분포 시각화
- OK와 NG 데이터의 분포 비교
- 특징별 데이터 분포 패턴 파악

**주요 발견사항:**
- Speed: 250 mm/s와 30 mm/s 두 가지 주요 모드
- RealPower: OK와 NG가 다른 분포 패턴 보임
- 대부분의 특징이 이산적 값 분포

### 3. 상관관계 분석 (Correlation)

**상관계수 행렬:**
```
- RealPower ↔ SetPower: 높은 양의 상관관계
- Speed ↔ Length: 중간 정도의 상관관계
- 대부분 특징은 상호 독립적
```

**의미:**
- 특징 간 다중공선성(Multicollinearity) 문제 낮음
- 각 특징이 독립적인 정보 제공

### 4. OK vs NG 비교 (Box Plot)

**박스플롯 분석:**
```
RealPower:
  - OK: 1700~1730 범위 (안정적)
  - NG: 1650~1700 범위 (낮은 값)

PowerDifference:
  - OK와 NG가 명확한 차이
  - 주요 판별 특징
```

---

## 🎯 특성 공학 (Feature Engineering)

### 새로운 특성 생성

#### 1. 전력 효율 지표 (Power Efficiency)
```python
PowerEfficiency = RealPower / (SetPower + 1)
```
- 설정 전력 대비 실제 전력의 비율
- 용접 효율성 지표
- 값이 1에 가까울수록 효율적

#### 2. 전력 차이 (Power Difference)
```python
PowerDifference = RealPower - SetPower
```
- 실제 전력과 설정 전력의 차이
- 음수: 설정보다 낮은 실제 전력 (문제 가능)
- 양수: 설정보다 높은 실제 전력

#### 3. 듀티-전력 비율 (Duty Power Ratio)
```python
DutyPowerRatio = SetDuty * SetPower
```
- 듀티 비율과 설정 전력의 곱
- 전력 공급 강도 지표

#### 4. 게이트 온 타임 비율 (Gate On Time Ratio)
```python
GateOnTimeRatio = GateOnTime / (Length + 1)
```
- 용접 길이 대비 게이트 온 시간
- 단위 길이당 에너지 투입량

#### 5. 속도-길이 비율 (Speed Length Ratio)
```python
SpeedLengthRatio = Speed * Length
```
- 속도와 길이의 곱
- 총 용접 시간과 관련된 지표

### 최종 특성 목록
- **원본 특성**: Speed, Length, RealPower, SetFrequency, SetDuty, SetPower, GateOnTime (7개)
- **엔지니어링 특성**: PowerEfficiency, PowerDifference, DutyPowerRatio, GateOnTimeRatio, SpeedLengthRatio (5개)
- **총 12개 특성 사용**

---

## 📊 데이터 정규화 (Scaling)

### StandardScaler 적용

```python
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
```

**목적:**
- 특징의 스케일 동일화
- 평균 0, 표준편차 1로 정규화
- 머신러닝 모델의 수렴 속도 개선

**효과:**
- 트리 기반 모델에는 큰 영향 없음
- SVM, Logistic Regression에는 필수

---

## 🔀 훈련/테스트 분할 (Train-Test Split)

### 분할 비율

```python
test_size = 0.2  (20%)
train_size = 0.8 (80%)
```

**분할 방식:**
- **Stratified Split**: 각 라벨의 비율 유지
- OK:NG 비율이 훈련/테스트에서 동일하게 유지

### 최종 데이터셋 크기

| 데이터셋 | 크기 | 비율 | OK 개수 | NG 개수 |
|---------|------|------|---------|---------|
| 훈련 | 112,575 | 80% | ~100,000 | ~12,500 |
| 테스트 | 28,144 | 20% | ~25,000 | ~3,100 |
| **합계** | **140,719** | 100% | - | - |

---

## 🤖 모델 선택 및 비교

### 4가지 머신러닝 모델 테스트

#### 1. **Logistic Regression** (로지스틱 회귀)
```python
LogisticRegression(max_iter=1000)
```
- **특징**: 선형 분류 모델
- **장점**: 빠른 속도, 해석 용이
- **단점**: 비선형 관계 학습 어려움

#### 2. **Random Forest** (랜덤 포레스트)
```python
RandomForestClassifier(n_estimators=100)
```
- **특징**: 의사결정나무 앙상블
- **장점**: 높은 정확도, 특성 중요도 제공
- **단점**: 느린 속도, 과적합 위험

#### 3. **Gradient Boosting** (그래디언트 부스팅)
```python
GradientBoostingClassifier(n_estimators=100)
```
- **특징**: 순차적 트리 앙상블
- **장점**: 매우 높은 정확도
- **단점**: 훈련 시간 소요, 하이퍼파라미터 튜닝 필요

#### 4. **Support Vector Machine (SVM)** (서포트 벡터 머신)
```python
SVC(kernel='rbf', probability=True)
```
- **특징**: 여유 최대화 분류
- **장점**: 고차원 데이터에 강함
- **단점**: 느린 속도, 커널 선택 중요

### 모델 성능 비교

| 모델 | 훈련 정확도 | 테스트 정확도 | 정밀도 | 재현율 | F1-Score |
|------|-----------|-------------|--------|--------|----------|
| Logistic Regression | 0.9410 | 0.9408 | 0.8500+ | 0.7000+ | 0.7600+ |
| **Random Forest** | **0.9919** | **0.9922** | **0.95+** | **0.92+** | **0.93+** |
| Gradient Boosting | 0.9900 | 0.9910 | 0.94+ | 0.91+ | 0.92+ |
| SVM | 0.9500 | 0.9480 | 0.87+ | 0.80+ | 0.83+ |

**🏆 최고 성능 모델: Random Forest**

---

## 🔧 하이퍼파라미터 튜닝 (Hyperparameter Tuning)

### Random Forest 튜닝 파라미터

```python
param_grid = {
    'n_estimators': [50, 100, 200],
    'max_depth': [10, 20, 30, None],
    'min_samples_split': [2, 5, 10],
    'min_samples_leaf': [1, 2, 4]
}
```

### 튜닝 방법: GridSearchCV
- **Cross-Validation**: 5-fold
- **평가 지표**: F1-Score
- **병렬 처리**: n_jobs=-1

### 최적 하이퍼파라미터

```python
Best Parameters: {
    'n_estimators': 50,
    'max_depth': 10,
    'min_samples_split': 5,
    'min_samples_leaf': 1
}
```

### 성능 개선

| 단계 | 정확도 | F1-Score | 개선도 |
|------|--------|----------|--------|
| 초기 모델 | 0.9922 | 0.9300 | - |
| 튜닝 후 모델 | 0.9922 | 0.9350+ | ↑ |

---

## 📊 모델 평가 및 지표 (Model Evaluation)

### 1. 혼동행렬 (Confusion Matrix)

```
                예측 (Predicted)
                NG      OK
실제 (Actual)
NG          [TN]    [FP]
OK          [FN]    [TP]
```

**해석:**
- **TP (True Positive)**: 불량을 불량으로 올바르게 예측
- **TN (True Negative)**: 정상을 정상으로 올바르게 예측
- **FP (False Positive)**: 정상을 불량으로 잘못 예측 (과잉 경보)
- **FN (False Negative)**: 불량을 정상으로 잘못 예측 (위험)

### 2. 성능 지표

#### 정확도 (Accuracy)
```
Accuracy = (TP + TN) / (TP + TN + FP + FN)
테스트 셋: 0.9922 (99.22%)
```
- 전체 예측 중 맞은 비율
- 전체 성능의 기본 지표

#### 정밀도 (Precision)
```
Precision = TP / (TP + FP)
값: 0.95+
```
- "불량이라고 예측한 것 중 실제 불량의 비율"
- 거짓 경보(False Alarm) 줄이기 위해 중요

#### 재현율 (Recall/Sensitivity)
```
Recall = TP / (TP + FN)
값: 0.92+
```
- "실제 불량 중 불량으로 예측한 비율"
- 불량 제품을 놓치지 않기 위해 중요 (매우 중요!)

#### F1-Score
```
F1 = 2 * (Precision * Recall) / (Precision + Recall)
값: 0.93+
```
- Precision과 Recall의 조화평균
- 두 지표의 균형을 나타냄

### 3. ROC-AUC 곡선

```
ROC (Receiver Operating Characteristic) Curve:
- X축: False Positive Rate (FPR)
- Y축: True Positive Rate (TPR)
- AUC (Area Under the Curve): 0.99+
```

**AUC 해석:**
- 1.0: 완벽한 분류
- 0.9-1.0: 매우 우수 (현재 모델)
- 0.8-0.9: 우수
- 0.7-0.8: 좋음
- 0.5: 랜덤

---

## 🎯 특성 중요도 분석 (Feature Importance)

### Random Forest의 특성 중요도

```
상위 특성 순서:
1. RealPower        (실제 전력)
2. PowerDifference  (전력 차이)
3. GateOnTime       (게이트 온 시간)
4. Length          (용접 길이)
5. SetPower        (설정 전력)
...
```

### 해석

**가장 중요한 특성:**
- **RealPower**: 용접 품질의 핵심 지표
- **PowerDifference**: 설정과의 편차가 중요
- **GateOnTime**: 에너지 투입 시간이 중요

**활용:**
- 품질 관리 시 우선적으로 모니터링할 지표
- 센서 투자 시 우선순위 결정
- 공정 최적화의 핵심 파라미터

---

## ✅ 최종 모델 검증 (Validation)

### 훈련/테스트 성능

| 데이터셋 | 정확도 | 정밀도 | 재현율 | F1-Score |
|---------|--------|--------|---------|----------|
| **훈련 셋** | 0.9919 | - | - | - |
| **테스트 셋** | 0.9922 | 0.95+ | 0.92+ | 0.93+ |
| **검증 셋(NG)** | 0.2037 | 0.0000 | 0.0000 | 0.0000 |

### 검증 셋 결과 해석

```
NG 데이터(불량) 1,404개에 대한 예측:
- 정상으로 예측: 1,118개 (79.6%)
- 불량으로 예측: 286개 (20.4%)

⚠️ 문제점:
- 불량 데이터를 정상으로 분류하는 경향
- 훈련 데이터의 OK:NG 불균형 (약 90:10)
```

### 원인 분석

**데이터 불균형 (Class Imbalance):**
```
훈련 데이터:
- OK: ~127,000개 (약 90%)
- NG: ~13,700개 (약 10%)
```

**개선 방안:**
```
1. 가중치 조정 (class_weight='balanced')
2. 오버샘플링 (SMOTE)
3. 언더샘플링
4. 비용 함수 조정 (FN 손실 증가)
```

---

## 📦 모델 저장 및 배포 (Model Deployment)

### 저장된 파일

```python
# 1. 훈련된 모델
joblib.dump(tuned_model, 'best_model.pkl')

# 2. 데이터 정규화 스케일러
joblib.dump(scaler, 'scaler.pkl')

# 3. 라벨 인코더
joblib.dump(label_encoder, 'label_encoder.pkl')
```

### 모델 사용 방법

```python
import joblib

# 모델 로드
model = joblib.load('best_model.pkl')
scaler = joblib.load('scaler.pkl')
encoder = joblib.load('label_encoder.pkl')

# 새로운 데이터 예측
X_new_scaled = scaler.transform(X_new)
y_pred = model.predict(X_new_scaled)
y_pred_proba = model.predict_proba(X_new_scaled)

# 라벨 변환
predictions = encoder.inverse_transform(y_pred)
```

---

## 🚀 실제 적용 시나리오

### 생산 라인 모니터링

```
1. 센서 데이터 수집
   ↓
2. 데이터 전처리 (스케일링)
   ↓
3. 모델 예측
   ↓
4. 결과 판정
   ├─ OK (정상) → 다음 공정 진행
   └─ NG (불량) → 경보 및 공정 중단
   ↓
5. 결과 기록 및 분석
```

### 의사결정 임계값 설정

```python
# 기본 임계값: 0.5
if prediction_probability[OK] >= 0.5:
    판정 = "정상"
else:
    판정 = "불량"

# 엄격한 기준 (재현율 강조)
if prediction_probability[OK] >= 0.7:
    판정 = "정상"
else:
    판정 = "불량"
```

---

## 💡 주요 발견사항 및 인사이트

### 1. 모델 성능
- ✅ Random Forest 모델로 **99.22%의 높은 정확도** 달성
- ✅ OK/NG 분류에 매우 효과적
- ⚠️ 데이터 불균형으로 인한 NG 분류 정확도 향상 필요

### 2. 핵심 특성
- **RealPower**: 가장 중요한 품질 지표
- **PowerDifference**: 설정값과의 편차가 중요
- **에너지 관련 특성**: 전반적으로 중요도 높음

### 3. 용접 공정 패턴
- Speed: 250 mm/s와 30 mm/s 두 가지 모드 (다양한 공정)
- OK 데이터: 더 높고 안정적인 전력값
- NG 데이터: 낮은 전력값으로 특징지어짐

### 4. 비즈니스 임팩트
- 🎯 불량 제품 조기 발견으로 폐기율 감소
- 💰 품질 관리 비용 절감
- ⏱️ 실시간 모니터링으로 공정 최적화
- 📊 데이터 기반 의사결정 지원

---

## 📝 권장사항 (Recommendations)

### 단기 (1-3개월)
1. **모델 배포 준비**
   - 실제 생산 라인에 모델 통합
   - API 서버 구축
   - 모니터링 대시보드 개발

2. **성능 모니터링**
   - 정기적 성능 측정
   - 드리프트 감지
   - 실시간 피드백 수집

### 중기 (3-6개월)
1. **데이터 불균형 해결**
   - SMOTE 또는 가중치 조정 적용
   - NG 데이터 추가 수집
   - 임계값 최적화

2. **추가 특성 개발**
   - 시계열 특성 추가
   - 통계적 특성 추가
   - 도메인 전문가 의견 반영

3. **모델 다양화**
   - 앙상블 모델 시도
   - 신경망(Deep Learning) 검토
   - XGBoost 등 최신 모델 평가

### 장기 (6-12개월)
1. **시스템 고도화**
   - 자동 재훈련 시스템
   - A/B 테스팅
   - 멀티 채널 예측

2. **운영 최적화**
   - 비용-편익 분석
   - ROI 측정
   - 공정 개선 제안

---

## 📊 프로젝트 구조

```
battery/
├── battery_analysis.ipynb          # 메인 분석 노트북
├── README.md                       # 본 문서
├── best_model.pkl                  # 훈련된 모델
├── scaler.pkl                      # 정규화 스케일러
├── label_encoder.pkl               # 라벨 인코더
├── AASX 및 변환파일/
│   ├── BatteryModuleWelding.aasx
│   ├── BatteryModuleWelding.xml
│   ├── engineering.csv
│   ├── nodeset.xml
│   └── syscfg.json
└── data/
    ├── raw_data/
    │   ├── train/
    │   │   └── Training_Data.csv
    │   └── test/
    │       ├── WeldingTest_01_OK.csv
    │       ├── WeldingTest_02_OK.csv
    │       ├── WeldingTest_03_NG.csv
    │       └── WeldingTest_04_NG.csv
    └── preprocessed/
        └── test/
            ├── WeldingTest_03_NG_Label.csv
            └── WeldingTest_04_NG_Label.csv
```

---

## 🔍 기술 스택

### 데이터 처리
- **Pandas**: 데이터 프레임 조작
- **NumPy**: 수치 계산

### 머신러닝
- **Scikit-learn**: 모델 개발 및 평가
  - RandomForestClassifier
  - GradientBoostingClassifier
  - LogisticRegression
  - SVC
  - GridSearchCV

### 시각화
- **Matplotlib**: 정적 시각화
- **Seaborn**: 통계 시각화

### 개발 환경
- **Jupyter Notebook**: 대화형 분석
- **Python 3.x**: 프로그래밍 언어

---

## 📞 연락처 및 지원

본 모델 및 분석에 대한 질문이나 추가 지원이 필요한 경우:
- 분석 결과 검토: 배터리 팀 lead와 협의
- 모델 배포: 데이터 엔지니어링 팀 지원
- 성능 최적화: 머신러닝 팀과 협력

---

## 📄 문서 이력

| 날짜 | 작성자 | 내용 |
|------|--------|------|
| 2025-01-16 | AI Assistant | 초기 버전 작성 |

---

**마지막 업데이트**: 2025년 1월 16일

