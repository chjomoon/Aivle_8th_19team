import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { orderApi, OrderDto } from "../api/order";

// ML API 기본 URL (Spring Boot)
const ML_API_BASE = "http://localhost:3001/api/v1/ml";

// 공정 단계 정의
const PIPELINE_STAGES = [
  {
    id: "press",
    name: "프레스",
    description: "철판 성형 및 스탬핑",
    mlEndpoints: ["/press/vibration", "/press/image"],
    detailPage: "/press",
    duration: { min: 15000, max: 20000 },
  },
  {
    id: "body",
    name: "차체",
    description: "용접 및 차체 조립",
    mlEndpoints: ["/welding/image/auto", "/body/inspect/batch/auto"],
    detailPage: "/body",
    duration: { min: 25000, max: 35000 },
  },
  {
    id: "paint",
    name: "도장",
    description: "도장 및 코팅",
    mlEndpoints: ["/paint/auto"],
    detailPage: "/paint",
    duration: { min: 20000, max: 30000 },
  },
  {
    id: "assembly",
    name: "의장",
    description: "내장재 및 부품 조립",
    mlEndpoints: [],
    detailPage: "/windshield",
    duration: { min: 15000, max: 25000 },
  },
  {
    id: "inspection",
    name: "검사",
    description: "최종 품질 검사",
    mlEndpoints: [],
    detailPage: "/dashboard",
    duration: { min: 10000, max: 15000 },
  },
];

type StageStatus = "waiting" | "running" | "completed" | "error";

type StageResult = {
  status: StageStatus;
  mlResults?: any[];
  hasAnomaly?: boolean;
  message?: string;
  startedAt?: number;
  estimatedDuration?: number;
  retryCount?: number;
};

type ProductionItem = {
  orderId: number;
  vehicleModelId: number;
  orderQty: number;
  currentStage: number;
  stageResults: StageResult[];
  startedAt?: string;
  completedAt?: string;
  baseOffset?: number; // 주문별 랜덤 시작 오프셋
};

// ML API 호출 함수
async function callMLApi(endpoint: string, offset: number = 0): Promise<any> {
  try {
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
  if (result.is_anomaly === 1) return true;
  if (result.status === "DEFECT" || result.status === "FAIL" || result.status === "ABNORMAL") return true;
  if (result.judgement === "FAIL" || result.judgement === "ABNORMAL") return true;
  if (result.pass_fail === "FAIL") return true;
  if (result.prediction === 1) return true;
  if (result.results) {
    const parts = Object.values(result.results);
    return parts.some((p: any) => p?.pass_fail === "FAIL");
  }
  return false;
}

interface ProductionContextType {
  productions: Map<number, ProductionItem>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  startProduction: (orderId: number) => Promise<void>;
  getStages: () => typeof PIPELINE_STAGES;
}

const ProductionContext = createContext<ProductionContextType | null>(null);

export function ProductionProvider({ children }: { children: ReactNode }) {
  const [productions, setProductions] = useState<Map<number, ProductionItem>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 실행 중인 생산 추적 (중복 실행 방지)
  const runningProductions = useRef<Set<number>>(new Set());

  const refresh = useCallback(async () => {
    setError(null);
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
      setError(e?.message ?? "주문 목록 조회 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  // 자동 재시도 포함 파이프라인 실행
  const startProduction = useCallback(async (orderId: number) => {
    // 이미 실행 중이면 무시
    if (runningProductions.current.has(orderId)) {
      console.log(`Production ${orderId} is already running`);
      return;
    }

    runningProductions.current.add(orderId);

    // 주문별 랜덤 시작 오프셋 생성 (0~99 사이)
    const baseOffset = Math.floor(Math.random() * 100);
    console.log(`Production ${orderId}: Starting with base offset ${baseOffset}`);

    // 시작 상태로 변경
    setProductions((prev) => {
      const newMap = new Map(prev);
      const production = newMap.get(orderId);
      if (production) {
        production.stageResults[0] = { status: "running" };
        production.startedAt = new Date().toISOString();
        production.baseOffset = baseOffset;
        newMap.set(orderId, { ...production });
      }
      return newMap;
    });

    // 각 공정을 순차적으로 실행
    for (let stageIdx = 0; stageIdx < PIPELINE_STAGES.length; stageIdx++) {
      const stage = PIPELINE_STAGES[stageIdx];
      let retryCount = 0;
      let stageSuccess = false;

      // 공정 시작 시간 (재시도해도 유지)
      const stageStartTime = Date.now();

      // 이상 감지 시 자동 재시도 (정상이 될 때까지 무한 재시도)
      while (!stageSuccess) {
        const stageDuration = stage.duration.min + Math.random() * (stage.duration.max - stage.duration.min);
        const retryStartTime = Date.now(); // 이번 시도의 시작 시간 (대기 시간 계산용)

        // 현재 단계 실행중으로 표시 (startedAt은 최초 시작 시간 유지)
        setProductions((prev) => {
          const newMap = new Map(prev);
          const production = newMap.get(orderId);
          if (production) {
            production.currentStage = stageIdx;
            production.stageResults[stageIdx] = {
              status: "running",
              startedAt: stageStartTime, // 재시도해도 최초 시작 시간 유지
              estimatedDuration: stageDuration,
              retryCount,
            };
            newMap.set(orderId, { ...production });
          }
          return newMap;
        });

        // ML API 호출 (baseOffset + stageIdx * 10 + retryCount로 주문별 다른 입력 사용)
        let hasAnomaly = false;
        const mlResults: any[] = [];
        const totalOffset = baseOffset + stageIdx * 10 + retryCount;

        if (stage.mlEndpoints.length > 0) {
          for (const endpoint of stage.mlEndpoints) {
            try {
              const result = await callMLApi(endpoint, totalOffset);
              mlResults.push(result);
              if (checkAnomaly(result)) {
                hasAnomaly = true;
              }
            } catch (error) {
              console.error(`Stage ${stage.id} ML call failed:`, error);
            }
          }
        }

        // 공정 소요 시간 대기 (이번 시도 기준)
        const elapsed = Date.now() - retryStartTime;
        const remainingTime = Math.max(0, stageDuration - elapsed);
        if (remainingTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }

        if (hasAnomaly) {
          // 이상 감지 - 자동 재시도 (정상이 될 때까지 계속)
          retryCount++;
          console.log(`Production ${orderId}: Anomaly at ${stage.name}, auto-retry ${retryCount}`);
          // 정상이 될 때까지 계속 재시도 (stageSuccess = false 유지)
        } else {
          // 정상 - 다음 단계로
          setProductions((prev) => {
            const newMap = new Map(prev);
            const production = newMap.get(orderId);
            if (production) {
              production.stageResults[stageIdx] = {
                status: "completed",
                mlResults,
                hasAnomaly: false,
                message: retryCount > 0 ? `정상 (${retryCount}회 재시도 후)` : "정상",
                retryCount,
              };

              if (stageIdx === PIPELINE_STAGES.length - 1) {
                production.completedAt = new Date().toISOString();
              }

              newMap.set(orderId, { ...production });
            }
            return newMap;
          });
          stageSuccess = true;
        }
      }
    }

    runningProductions.current.delete(orderId);
  }, []);

  const getStages = useCallback(() => PIPELINE_STAGES, []);

  return (
    <ProductionContext.Provider
      value={{
        productions,
        loading,
        error,
        refresh,
        startProduction,
        getStages,
      }}
    >
      {children}
    </ProductionContext.Provider>
  );
}

export function useProduction() {
  const context = useContext(ProductionContext);
  if (!context) {
    throw new Error("useProduction must be used within a ProductionProvider");
  }
  return context;
}

export { PIPELINE_STAGES };
export type { ProductionItem, StageResult, StageStatus };
