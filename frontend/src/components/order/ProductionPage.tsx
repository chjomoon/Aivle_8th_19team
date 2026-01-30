import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { orderApi, OrderDto } from "../../api/order";
import {
  Factory,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  ChevronRight,
  RefreshCcw,
  Hammer,
  Car,
  Paintbrush,
  Wrench,
  ClipboardCheck,
  ExternalLink,
  XCircle,
} from "lucide-react";

// ML API 기본 URL (Spring Boot)
const ML_API_BASE = "http://localhost:3001/api/v1/ml";

// 공정 단계 정의 (duration: 밀리초 단위 소요 시간)
const PIPELINE_STAGES = [
  {
    id: "press",
    name: "프레스",
    icon: Hammer,
    description: "철판 성형 및 스탬핑",
    mlEndpoints: ["/press/vibration", "/press/image"],
    detailPage: "/press",
    duration: { min: 15000, max: 20000 }, // 15-20초
  },
  {
    id: "body",
    name: "차체",
    icon: Car,
    description: "용접 및 차체 조립",
    mlEndpoints: ["/welding/image/auto", "/body/inspect/batch/auto"],
    detailPage: "/body",
    duration: { min: 25000, max: 35000 }, // 25-35초 (용접은 더 오래 걸림)
  },
  {
    id: "paint",
    name: "도장",
    icon: Paintbrush,
    description: "도장 및 코팅",
    mlEndpoints: ["/paint/auto"],
    detailPage: "/paint",
    duration: { min: 20000, max: 30000 }, // 20-30초
  },
  {
    id: "assembly",
    name: "의장",
    icon: Wrench,
    description: "내장재 및 부품 조립",
    mlEndpoints: [], // 윈드실드/엔진은 파일 업로드 필요하므로 시뮬레이션
    detailPage: "/windshield",
    duration: { min: 15000, max: 25000 }, // 15-25초
  },
  {
    id: "inspection",
    name: "검사",
    icon: ClipboardCheck,
    description: "최종 품질 검사",
    mlEndpoints: [],
    detailPage: "/dashboard",
    duration: { min: 10000, max: 15000 }, // 10-15초
  },
];

type StageStatus = "waiting" | "running" | "completed" | "error" | "stopped";

type StageResult = {
  status: StageStatus;
  mlResults?: any[];
  hasAnomaly?: boolean;
  message?: string;
  startedAt?: number; // timestamp
  estimatedDuration?: number; // ms
  retryCount?: number; // 재시도 횟수 (다른 데이터 사용을 위해)
};

type ProductionItem = {
  orderId: number;
  vehicleModelId: number;
  orderQty: number;
  currentStage: number;
  stageResults: StageResult[];
  startedAt?: string;
  completedAt?: string;
  isStopped?: boolean; // 이상 감지로 중단됨
};

// ML API 호출 함수 (offset: 몇 번째 데이터를 사용할지)
async function callMLApi(endpoint: string, offset: number = 0): Promise<any> {
  try {
    // offset 파라미터를 추가하여 다른 데이터 사용
    const separator = endpoint.includes("?") ? "&" : "?";
    const url = `${ML_API_BASE}${endpoint}${separator}offset=${offset}`;
    const res = await fetch(url, { method: "POST" });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`ML API call failed: ${endpoint}`, error);
    throw error;
  }
}

// ML 결과에서 이상 여부 판단
function checkAnomaly(result: any): boolean {
  if (!result) return false;

  // 다양한 ML 응답 형식 처리
  if (result.is_anomaly === 1) return true;
  if (result.status === "DEFECT" || result.status === "FAIL" || result.status === "ABNORMAL") return true;
  if (result.judgement === "FAIL" || result.judgement === "ABNORMAL") return true;
  if (result.pass_fail === "FAIL") return true;
  if (result.prediction === 1) return true;

  // body inspection 결과
  if (result.results) {
    const parts = Object.values(result.results);
    return parts.some((p: any) => p?.pass_fail === "FAIL");
  }

  return false;
}

function StageProgressBar({ startedAt, duration }: { startedAt: number; duration: number }) {
  const [progress, setProgress] = useState(0);
  const [remainingSec, setRemainingSec] = useState(Math.ceil(duration / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      setRemainingSec(Math.max(0, Math.ceil((duration - elapsed) / 1000)));
    }, 100);

    return () => clearInterval(interval);
  }, [startedAt, duration]);

  return (
    <div className="w-full flex flex-col items-center gap-0.5">
      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-[9px] text-slate-400">{remainingSec}초</span>
    </div>
  );
}

function StageIcon({ stage, result, isActive }: { stage: typeof PIPELINE_STAGES[0]; result: StageResult; isActive: boolean }) {
  const Icon = stage.icon;
  const baseClass = "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-md";

  if (result.status === "completed" && !result.hasAnomaly) {
    return (
      <div className={`${baseClass} bg-green-500 text-white`}>
        <CheckCircle2 className="w-6 h-6" />
      </div>
    );
  }
  if (result.status === "completed" && result.hasAnomaly) {
    return (
      <div className={`${baseClass} bg-orange-500 text-white`}>
        <AlertTriangle className="w-6 h-6" />
      </div>
    );
  }
  if (result.status === "running") {
    return (
      <div className={`${baseClass} bg-blue-500 text-white animate-pulse`}>
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  if (result.status === "error") {
    return (
      <div className={`${baseClass} bg-red-500 text-white`}>
        <XCircle className="w-6 h-6" />
      </div>
    );
  }
  if (result.status === "stopped") {
    return (
      <div className={`${baseClass} bg-orange-500 text-white ring-4 ring-orange-200`}>
        <AlertTriangle className="w-6 h-6" />
      </div>
    );
  }
  return (
    <div className={`${baseClass} ${isActive ? "bg-slate-300" : "bg-slate-200"} text-slate-500`}>
      <Icon className="w-6 h-6" />
    </div>
  );
}

function PipelineView({
  production,
  onStageClick,
}: {
  production: ProductionItem;
  onStageClick: (stageId: string, stage: typeof PIPELINE_STAGES[0]) => void;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-4 px-2">
      {PIPELINE_STAGES.map((stage, idx) => {
        const result = production.stageResults[idx];
        const isActive = idx === production.currentStage;
        const isClickable = result.status !== "waiting";

        return (
          <div key={stage.id} className="flex items-center">
            <div
              className={`flex flex-col items-center min-w-[90px] p-2 rounded-lg transition-all ${
                isClickable ? "cursor-pointer hover:bg-slate-50" : ""
              } ${isActive ? "bg-blue-50" : ""}`}
              onClick={() => isClickable && onStageClick(stage.id, stage)}
            >
              <StageIcon stage={stage} result={result} isActive={isActive} />
              <div className={`mt-2 text-xs font-semibold ${isActive ? "text-blue-600" : "text-slate-700"}`}>
                {stage.name}
              </div>
              <div className="text-[10px] text-slate-400 text-center">{stage.description}</div>

              {/* 결과 표시 */}
              {result.status === "completed" && (
                <div className={`mt-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                  result.hasAnomaly ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                }`}>
                  {result.hasAnomaly ? "이상 감지" : "정상"}
                </div>
              )}
              {result.status === "running" && (
                <div className="mt-1 flex flex-col items-center gap-1">
                  <div className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                    분석중...
                  </div>
                  {result.estimatedDuration && result.startedAt && (
                    <StageProgressBar startedAt={result.startedAt} duration={result.estimatedDuration} />
                  )}
                </div>
              )}
              {result.status === "error" && (
                <div className="mt-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">
                  오류
                </div>
              )}
              {result.status === "stopped" && (
                <div className="mt-1 px-2 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700 animate-pulse">
                  중단됨
                </div>
              )}
            </div>

            {idx < PIPELINE_STAGES.length - 1 && (
              <ChevronRight
                className={`w-5 h-5 mx-1 flex-shrink-0 ${
                  result.status === "completed" ? (result.hasAnomaly ? "text-orange-400" : "text-green-500") : "text-slate-300"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProductionCard({
  production,
  onStart,
  onStageClick,
  onViewDetail,
  onRetry,
  onSkip,
}: {
  production: ProductionItem;
  onStart: () => void;
  onStageClick: (stageId: string, stage: typeof PIPELINE_STAGES[0]) => void;
  onViewDetail: (page: string) => void;
  onRetry: () => void;
  onSkip: () => void;
}) {
  const isRunning = production.stageResults.some((r) => r.status === "running");
  const isCompleted = production.stageResults.every((r) => r.status === "completed" || r.status === "stopped");
  const isStopped = production.isStopped && production.stageResults.some((r) => r.status === "stopped");
  const hasAnyAnomaly = production.stageResults.some((r) => r.hasAnomaly);
  const hasError = production.stageResults.some((r) => r.status === "error");
  const isWaiting = production.stageResults.every((r) => r.status === "waiting");
  const stoppedStageIdx = production.stageResults.findIndex((r) => r.status === "stopped");

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isStopped ? "border-orange-400 ring-2 ring-orange-100" : hasAnyAnomaly ? "border-orange-300" : ""}`}>
      <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              isStopped
                ? "bg-orange-100"
                : isCompleted && !hasAnyAnomaly
                ? "bg-green-100"
                : isCompleted && hasAnyAnomaly
                ? "bg-orange-100"
                : isRunning
                ? "bg-blue-100"
                : hasError
                ? "bg-red-100"
                : "bg-slate-100"
            }`}
          >
            <Factory
              className={`w-5 h-5 ${
                isStopped
                  ? "text-orange-600"
                  : isCompleted && !hasAnyAnomaly
                  ? "text-green-600"
                  : isCompleted && hasAnyAnomaly
                  ? "text-orange-600"
                  : isRunning
                  ? "text-blue-600"
                  : hasError
                  ? "text-red-600"
                  : "text-slate-600"
              }`}
            />
          </div>
          <div>
            <div className="font-semibold text-slate-900">주문 #{production.orderId}</div>
            <div className="text-xs text-slate-500">모델 {production.vehicleModelId} · {production.orderQty}대</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isStopped ? (
            <>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {PIPELINE_STAGES[stoppedStageIdx]?.name} 이상 감지
              </span>
              <button
                onClick={onRetry}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-orange-500 text-white hover:bg-orange-600 flex items-center gap-1"
              >
                <RefreshCcw className="w-3 h-3" />
                재검사
              </button>
              <button
                onClick={onSkip}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-500 text-white hover:bg-slate-600 flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3" />
                건너뛰기
              </button>
            </>
          ) : isCompleted && !hasAnyAnomaly ? (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">생산 완료</span>
          ) : isCompleted && hasAnyAnomaly ? (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
              이상 감지 ({production.stageResults.filter((r) => r.hasAnomaly).length}건)
            </span>
          ) : isRunning ? (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {PIPELINE_STAGES[production.currentStage]?.name} 분석중
            </span>
          ) : hasError ? (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">오류 발생</span>
          ) : (
            <button
              onClick={onStart}
              className="px-4 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
            >
              <Play className="w-4 h-4" />
              생산 시작
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        <PipelineView production={production} onStageClick={onStageClick} />

        {/* 시작/완료 시간 */}
        {production.startedAt && (
          <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                시작: {new Date(production.startedAt).toLocaleString("ko-KR")}
              </span>
              {production.completedAt && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  완료: {new Date(production.completedAt).toLocaleString("ko-KR")}
                </span>
              )}
            </div>

            {/* 이상 감지된 공정 상세 보기 버튼 */}
            {hasAnyAnomaly && (
              <div className="flex gap-2">
                {production.stageResults.map((r, idx) =>
                  r.hasAnomaly ? (
                    <button
                      key={idx}
                      onClick={() => onViewDetail(PIPELINE_STAGES[idx].detailPage)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-orange-50 text-orange-700 hover:bg-orange-100"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {PIPELINE_STAGES[idx].name} 상세
                    </button>
                  ) : null
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProductionPage() {
  const navigate = useNavigate();
  const [productions, setProductions] = useState<Map<number, ProductionItem>>(new Map());
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const data = await orderApi.list();
      const orderList: OrderDto[] = Array.isArray(data) ? data : [];

      setProductions((prev) => {
        const newMap = new Map(prev);
        orderList.forEach((o) => {
          const orderId = o?.id ?? o?.orderId;
          if (orderId && !newMap.has(orderId)) {
            newMap.set(orderId, {
              orderId,
              vehicleModelId: o?.vehicleModelId ?? o?.modelId ?? 0,
              orderQty: o?.orderQty ?? o?.quantity ?? 0,
              currentStage: 0,
              stageResults: PIPELINE_STAGES.map(() => ({ status: "waiting" as StageStatus })),
            });
          }
        });
        return newMap;
      });
    } catch (e: any) {
      setErr(e?.message ?? "주문 목록 조회 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // 실제 ML API를 호출하며 파이프라인 진행
  const startProduction = useCallback(async (orderId: number) => {
    // 시작 상태로 변경
    setProductions((prev) => {
      const newMap = new Map(prev);
      const production = newMap.get(orderId);
      if (production) {
        production.stageResults[0] = { status: "running" };
        production.startedAt = new Date().toISOString();
        newMap.set(orderId, { ...production });
      }
      return newMap;
    });

    // 각 공정을 순차적으로 실행
    for (let stageIdx = 0; stageIdx < PIPELINE_STAGES.length; stageIdx++) {
      const stage = PIPELINE_STAGES[stageIdx];

      // 공정별 소요 시간 계산 (min ~ max 사이 랜덤)
      const stageDuration = stage.duration.min + Math.random() * (stage.duration.max - stage.duration.min);
      const stageStartTime = Date.now();

      // 현재 단계 실행중으로 표시 (예상 시간 포함)
      setProductions((prev) => {
        const newMap = new Map(prev);
        const production = newMap.get(orderId);
        if (production) {
          production.currentStage = stageIdx;
          production.stageResults[stageIdx] = {
            status: "running",
            startedAt: stageStartTime,
            estimatedDuration: stageDuration,
          };
          newMap.set(orderId, { ...production });
        }
        return newMap;
      });

      // ML API 호출
      let hasAnomaly = false;
      const mlResults: any[] = [];

      if (stage.mlEndpoints.length > 0) {
        for (const endpoint of stage.mlEndpoints) {
          try {
            const result = await callMLApi(endpoint);
            mlResults.push(result);
            if (checkAnomaly(result)) {
              hasAnomaly = true;
            }
          } catch (error) {
            console.error(`Stage ${stage.id} ML call failed:`, error);
            // API 실패 시에도 계속 진행 (시뮬레이션)
          }
        }
      }

      // 공정 소요 시간이 될 때까지 대기 (ML API 호출 시간 제외)
      const elapsed = Date.now() - stageStartTime;
      const remainingTime = Math.max(0, stageDuration - elapsed);
      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      // 결과 업데이트
      setProductions((prev) => {
        const newMap = new Map(prev);
        const production = newMap.get(orderId);
        if (production) {
          production.stageResults[stageIdx] = {
            status: hasAnomaly ? "stopped" : "completed",
            mlResults,
            hasAnomaly,
            message: hasAnomaly ? "이상이 감지되었습니다" : "정상",
          };

          // 이상 감지 시 중단
          if (hasAnomaly) {
            production.isStopped = true;
          }

          // 마지막 단계면 완료 시간 기록
          if (stageIdx === PIPELINE_STAGES.length - 1 && !hasAnomaly) {
            production.completedAt = new Date().toISOString();
          }

          newMap.set(orderId, { ...production });
        }
        return newMap;
      });

      // 이상 감지 시 파이프라인 중단
      if (hasAnomaly) {
        console.log(`Production ${orderId}: Anomaly detected at ${stage.name}, stopping pipeline`);
        return; // 파이프라인 중단
      }
    }
  }, []);

  // 재검사: 중단된 공정을 다시 실행 (다음 데이터 사용)
  const retryStage = useCallback(async (orderId: number) => {
    const production = productions.get(orderId);
    if (!production) return;

    const stoppedIdx = production.stageResults.findIndex((r) => r.status === "stopped");
    if (stoppedIdx === -1) return;

    // 이전 재시도 횟수 가져오기 (다음 데이터 사용을 위해)
    const prevRetryCount = production.stageResults[stoppedIdx]?.retryCount || 0;
    const newRetryCount = prevRetryCount + 1;

    // isStopped 해제 후 해당 단계부터 재시작
    setProductions((prev) => {
      const newMap = new Map(prev);
      const prod = newMap.get(orderId);
      if (prod) {
        prod.isStopped = false;
        prod.stageResults[stoppedIdx] = { status: "running", retryCount: newRetryCount };
        newMap.set(orderId, { ...prod });
      }
      return newMap;
    });

    // 해당 단계부터 파이프라인 재개
    for (let stageIdx = stoppedIdx; stageIdx < PIPELINE_STAGES.length; stageIdx++) {
      const stage = PIPELINE_STAGES[stageIdx];
      const stageDuration = stage.duration.min + Math.random() * (stage.duration.max - stage.duration.min);
      const stageStartTime = Date.now();

      // 현재 단계의 재시도 횟수 (첫 단계만 증가된 값 사용, 이후는 0)
      const currentRetryCount = stageIdx === stoppedIdx ? newRetryCount : 0;

      setProductions((prev) => {
        const newMap = new Map(prev);
        const prod = newMap.get(orderId);
        if (prod) {
          prod.currentStage = stageIdx;
          prod.stageResults[stageIdx] = {
            status: "running",
            startedAt: stageStartTime,
            estimatedDuration: stageDuration,
            retryCount: currentRetryCount,
          };
          newMap.set(orderId, { ...prod });
        }
        return newMap;
      });

      let hasAnomaly = false;
      const mlResults: any[] = [];

      if (stage.mlEndpoints.length > 0) {
        for (const endpoint of stage.mlEndpoints) {
          try {
            // offset 파라미터로 다른 데이터 사용
            const result = await callMLApi(endpoint, currentRetryCount);
            mlResults.push(result);
            if (checkAnomaly(result)) hasAnomaly = true;
          } catch (error) {
            console.error(`Stage ${stage.id} ML call failed:`, error);
          }
        }
      }

      const elapsed = Date.now() - stageStartTime;
      const remainingTime = Math.max(0, stageDuration - elapsed);
      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      setProductions((prev) => {
        const newMap = new Map(prev);
        const prod = newMap.get(orderId);
        if (prod) {
          prod.stageResults[stageIdx] = {
            status: hasAnomaly ? "stopped" : "completed",
            mlResults,
            hasAnomaly,
            message: hasAnomaly ? "이상이 감지되었습니다" : "정상",
            retryCount: currentRetryCount,
          };
          if (hasAnomaly) prod.isStopped = true;
          if (stageIdx === PIPELINE_STAGES.length - 1 && !hasAnomaly) {
            prod.completedAt = new Date().toISOString();
          }
          newMap.set(orderId, { ...prod });
        }
        return newMap;
      });

      if (hasAnomaly) return;
    }
  }, [productions]);

  // 건너뛰기: 이상 감지된 공정을 무시하고 다음으로 진행
  const skipStage = useCallback(async (orderId: number) => {
    const production = productions.get(orderId);
    if (!production) return;

    const stoppedIdx = production.stageResults.findIndex((r) => r.status === "stopped");
    if (stoppedIdx === -1) return;

    // 현재 단계를 completed로 변경 (이상 유지)하고 다음 단계로
    setProductions((prev) => {
      const newMap = new Map(prev);
      const prod = newMap.get(orderId);
      if (prod) {
        prod.isStopped = false;
        prod.stageResults[stoppedIdx] = {
          ...prod.stageResults[stoppedIdx],
          status: "completed",
        };
        newMap.set(orderId, { ...prod });
      }
      return newMap;
    });

    // 다음 단계부터 진행
    const nextIdx = stoppedIdx + 1;
    if (nextIdx >= PIPELINE_STAGES.length) {
      // 마지막 단계였으면 완료 처리
      setProductions((prev) => {
        const newMap = new Map(prev);
        const prod = newMap.get(orderId);
        if (prod) {
          prod.completedAt = new Date().toISOString();
          newMap.set(orderId, { ...prod });
        }
        return newMap;
      });
      return;
    }

    // 나머지 단계 실행
    for (let stageIdx = nextIdx; stageIdx < PIPELINE_STAGES.length; stageIdx++) {
      const stage = PIPELINE_STAGES[stageIdx];
      const stageDuration = stage.duration.min + Math.random() * (stage.duration.max - stage.duration.min);
      const stageStartTime = Date.now();

      setProductions((prev) => {
        const newMap = new Map(prev);
        const prod = newMap.get(orderId);
        if (prod) {
          prod.currentStage = stageIdx;
          prod.stageResults[stageIdx] = {
            status: "running",
            startedAt: stageStartTime,
            estimatedDuration: stageDuration,
          };
          newMap.set(orderId, { ...prod });
        }
        return newMap;
      });

      let hasAnomaly = false;
      const mlResults: any[] = [];

      if (stage.mlEndpoints.length > 0) {
        for (const endpoint of stage.mlEndpoints) {
          try {
            const result = await callMLApi(endpoint);
            mlResults.push(result);
            if (checkAnomaly(result)) hasAnomaly = true;
          } catch (error) {
            console.error(`Stage ${stage.id} ML call failed:`, error);
          }
        }
      }

      const elapsed = Date.now() - stageStartTime;
      const remainingTime = Math.max(0, stageDuration - elapsed);
      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      setProductions((prev) => {
        const newMap = new Map(prev);
        const prod = newMap.get(orderId);
        if (prod) {
          prod.stageResults[stageIdx] = {
            status: hasAnomaly ? "stopped" : "completed",
            mlResults,
            hasAnomaly,
            message: hasAnomaly ? "이상이 감지되었습니다" : "정상",
          };
          if (hasAnomaly) prod.isStopped = true;
          if (stageIdx === PIPELINE_STAGES.length - 1 && !hasAnomaly) {
            prod.completedAt = new Date().toISOString();
          }
          newMap.set(orderId, { ...prod });
        }
        return newMap;
      });

      if (hasAnomaly) return;
    }
  }, [productions]);

  const handleStageClick = (_stageId: string, stage: typeof PIPELINE_STAGES[0]) => {
    // 해당 공정의 상세 페이지로 이동
    navigate(stage.detailPage);
  };

  const handleViewDetail = (page: string) => {
    navigate(page);
  };

  const productionList = Array.from(productions.values()).sort((a, b) => {
    const aRunning = a.stageResults.some((r) => r.status === "running");
    const bRunning = b.stageResults.some((r) => r.status === "running");
    if (aRunning && !bRunning) return -1;
    if (!aRunning && bRunning) return 1;
    return b.orderId - a.orderId;
  });

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Factory className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">생산 관리</h1>
            <p className="text-sm text-slate-500">자동차 제조 공정 파이프라인 (실시간 ML 분석)</p>
          </div>
        </div>
        <button onClick={refresh} className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-slate-50">
          <RefreshCcw className="w-4 h-4" />
          새로고침
        </button>
      </div>

      {err && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{err}</div>}

      {/* 공정 범례 */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="text-sm font-semibold text-slate-700 mb-3">공정 단계 (클릭 시 상세 페이지 이동)</div>
        <div className="flex flex-wrap gap-4">
          {PIPELINE_STAGES.map((stage) => {
            const Icon = stage.icon;
            return (
              <button
                key={stage.id}
                onClick={() => navigate(stage.detailPage)}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
              >
                <div className="p-1.5 bg-slate-100 rounded-lg">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-medium">{stage.name}</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>
            );
          })}
        </div>
      </div>

      {/* 생산 목록 */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl border p-8 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
            불러오는 중...
          </div>
        ) : productionList.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-slate-500">
            <Factory className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <div className="font-medium">생산 대기 중인 주문이 없습니다</div>
            <div className="text-sm mt-1">주문 페이지에서 새 주문을 등록하세요</div>
          </div>
        ) : (
          productionList.map((production) => (
            <ProductionCard
              key={production.orderId}
              production={production}
              onStart={() => startProduction(production.orderId)}
              onStageClick={handleStageClick}
              onViewDetail={handleViewDetail}
              onRetry={() => retryStage(production.orderId)}
              onSkip={() => skipStage(production.orderId)}
            />
          ))
        )}
      </div>
    </div>
  );
}