import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useProduction,
  PIPELINE_STAGES,
  ProductionItem,
  StageResult,
} from "../../context/ProductionContext";
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

// 아이콘 매핑 (Context에서는 아이콘을 저장하지 않으므로)
const STAGE_ICONS: Record<string, any> = {
  press: Hammer,
  body: Car,
  paint: Paintbrush,
  assembly: Wrench,
  inspection: ClipboardCheck,
};

function formatSecToMMSS(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${mm}:${ss}`;
}

/**
 * ✅ 신호등(초록) 느낌: 깜빡 + 발광(글로우)
 * Tailwind animate-* 의존 X. CSS keyframes로 확실하게 동작.
 */
const trafficCss = `
@keyframes greenBlinkGlow {
  0%   { opacity: 0.35; filter: drop-shadow(0 0 0px rgba(34,197,94,0)); }
  35%  { opacity: 1;    filter: drop-shadow(0 0 6px rgba(34,197,94,0.85)) drop-shadow(0 0 14px rgba(34,197,94,0.55)); }
  70%  { opacity: 0.55; filter: drop-shadow(0 0 2px rgba(34,197,94,0.35)); }
  100% { opacity: 0.35; filter: drop-shadow(0 0 0px rgba(34,197,94,0)); }
}
.traffic-green {
  animation: greenBlinkGlow 1.1s ease-in-out infinite;
}
`;

// ✅ 주문 카드 우측 배지에서 쓰는 "신호등 초록 불" (빛 번짐 포함)
function TrafficGreenLight({ size = 10 }: { size?: number }) {
  const px = `${size}px`;
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: px, height: px }}
      aria-label="running"
      title="공정 진행 중"
    >
      {/* 내부 코어 */}
      <span
        className="traffic-green rounded-full"
        style={{
          width: px,
          height: px,
          background: "rgb(34 197 94)", // green-500
        }}
      />
      {/* 바깥 은은한 글로우 */}
      <span
        className="absolute rounded-full"
        style={{
          width: `calc(${px} * 2.1)`,
          height: `calc(${px} * 2.1)`,
          background:
            "radial-gradient(circle, rgba(34,197,94,0.35) 0%, rgba(34,197,94,0.10) 45%, rgba(34,197,94,0.0) 70%)",
          pointerEvents: "none",
        }}
      />
    </span>
  );
}

// ✅ 공정 "끝(완료)" 표시용: 안 빛나는 빨간 불빛(고정)
function TrafficRedLight({ size = 10 }: { size?: number }) {
  const px = `${size}px`;
  return (
    <span
      className="inline-flex rounded-full"
      style={{
        width: px,
        height: px,
        background: "rgb(239 68 68)", // red-500
      }}
      aria-label="completed"
      title="공정 완료"
    />
  );
}

function StageProgressBar({
  startedAt,
  duration,
}: {
  startedAt: number;
  duration: number;
}) {
  const [progress, setProgress] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      setElapsedSec(Math.max(0, Math.floor(elapsed / 1000)));
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

      {/* ✅ 경과 글씨 더 작게 */}
      <span className="text-[7px] text-slate-400 leading-none">
        경과 {formatSecToMMSS(elapsedSec)}
      </span>
    </div>
  );
}

function StageElapsed({ startedAt }: { startedAt: number }) {
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setElapsedSec(Math.max(0, Math.floor(elapsed / 1000)));
    }, 500);
    return () => clearInterval(t);
  }, [startedAt]);

  return (
    <span className="text-[7px] text-slate-400 leading-none">
      경과 {formatSecToMMSS(elapsedSec)}
    </span>
  );
}

function StageIcon({
  stage,
  result,
  isActive,
}: {
  stage: (typeof PIPELINE_STAGES)[0];
  result: StageResult;
  isActive: boolean;
}) {
  const Icon = STAGE_ICONS[stage.id] || ClipboardCheck;
  const baseClass =
    "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-md";

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

  // 단계 아이콘 running 상태는 기존처럼 유지(우측 상단 신호등 초록불)
  if (result.status === "running") {
    return (
      <div className={`${baseClass} bg-slate-700 text-white relative`}>
        <Icon className="w-6 h-6" />
        <div className="absolute -top-1 -right-1">
          <TrafficGreenLight size={8} />
        </div>
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

  return (
    <div
      className={`${baseClass} ${isActive ? "bg-slate-300" : "bg-slate-200"} text-slate-500`}
    >
      <Icon className="w-6 h-6" />
    </div>
  );
}

function PipelineView({
  production,
  onStageClick,
}: {
  production: ProductionItem;
  onStageClick: (stageId: string, stage: (typeof PIPELINE_STAGES)[0]) => void;
}) {
  const stages = PIPELINE_STAGES;

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-4 px-2">
      {stages.map((stage, idx) => {
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

              <div
                className={`mt-2 text-xs font-semibold ${
                  isActive ? "text-blue-600" : "text-slate-700"
                }`}
              >
                {stage.name}
              </div>
              <div className="text-[10px] text-slate-400 text-center">
                {stage.description}
              </div>

              {/* ✅ 결과 표시: "정상" -> "완료" */}
              {result.status === "completed" && (
                <div
                  className={`mt-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                    result.hasAnomaly
                      ? "bg-orange-100 text-orange-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {result.hasAnomaly ? "완료 (이상)" : "완료"}
                </div>
              )}

              {/* ✅ running: 재시도 문구/횟수 제거 -> 항상 공정 중 */}
              {result.status === "running" && (
                <div className="mt-1 flex flex-col items-center gap-1">
                  <div className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                    공정 중...
                  </div>

                  {/* ✅ 경과 시간만 작게 표시 */}
                  {result.estimatedDuration && result.startedAt ? (
                    <StageProgressBar
                      startedAt={result.startedAt}
                      duration={result.estimatedDuration}
                    />
                  ) : result.startedAt ? (
                    <StageElapsed startedAt={result.startedAt} />
                  ) : null}
                </div>
              )}

              {result.status === "error" && (
                <div className="mt-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">
                  오류
                </div>
              )}
            </div>

            {idx < stages.length - 1 && (
              <ChevronRight
                className={`w-5 h-5 mx-1 flex-shrink-0 ${
                  result.status === "completed"
                    ? result.hasAnomaly
                      ? "text-orange-400"
                      : "text-green-500"
                    : "text-slate-300"
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
}: {
  production: ProductionItem;
  onStart: () => void;
  onStageClick: (stageId: string, stage: (typeof PIPELINE_STAGES)[0]) => void;
  onViewDetail: (page: string) => void;
}) {
  const stages = PIPELINE_STAGES;
  const isRunning = production.stageResults.some((r) => r.status === "running");
  const isCompleted = production.stageResults.every((r) => r.status === "completed");
  const hasAnyAnomaly = production.stageResults.some((r) => r.hasAnomaly);
  const hasError = production.stageResults.some((r) => r.status === "error");
  const isWaiting = production.stageResults.every((r) => r.status === "waiting");

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
        hasAnyAnomaly ? "border-orange-300" : ""
      }`}
    >
      <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              isCompleted && !hasAnyAnomaly
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
                isCompleted && !hasAnyAnomaly
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
            <div className="font-semibold text-slate-900">
              주문 #{production.orderId}
            </div>
            <div className="text-xs text-slate-500">
              모델 {production.vehicleModelId} · {production.orderQty}대
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* ✅ 완료(정상/이상)일 때: 배지에 "빨간 불빛(고정)" 추가 */}
          {isCompleted && !hasAnyAnomaly ? (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 inline-flex items-center gap-2">
              <TrafficRedLight size={10} />
              생산 완료
            </span>
          ) : isCompleted && hasAnyAnomaly ? (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700 inline-flex items-center gap-2">
              <TrafficRedLight size={10} />
              생산 완료 (이상 {production.stageResults.filter((r) => r.hasAnomaly).length}건)
            </span>
          ) : isRunning ? (
            // ✅ running: "신호등 초록 불"로 표시
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 inline-flex items-center gap-2">
              <TrafficGreenLight size={10} />
              {stages[production.currentStage]?.name} 공정 중
            </span>
          ) : hasError ? (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
              오류 발생
            </span>
          ) : isWaiting ? (
            <button
              onClick={onStart}
              className="px-4 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
            >
              <Play className="w-4 h-4" />
              생산 시작
            </button>
          ) : null}
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
                      onClick={() => onViewDetail(stages[idx].detailPage)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-orange-50 text-orange-700 hover:bg-orange-100"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {stages[idx].name} 상세
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
  const { productions, loading, error, refresh, startProduction } = useProduction();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleStageClick = (_stageId: string, stage: (typeof PIPELINE_STAGES)[0]) => {
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
      {/* ✅ 신호등 깜빡/발광 CSS 주입 */}
      <style>{trafficCss}</style>

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Factory className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">생산 관리</h1>
            <p className="text-sm text-slate-500">자동차 제조 공정 파이프라인</p>
          </div>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-slate-50"
        >
          <RefreshCcw className="w-4 h-4" />
          새로고침
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 공정 범례 */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="text-sm font-semibold text-slate-700 mb-3">
          공정 단계 (클릭 시 상세 페이지 이동)
        </div>
        <div className="flex flex-wrap gap-4">
          {PIPELINE_STAGES.map((stage) => {
            const Icon = STAGE_ICONS[stage.id] || ClipboardCheck;
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
            />
          ))
        )}
      </div>
    </div>
  );
}
