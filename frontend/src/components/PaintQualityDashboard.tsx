// src/components/PaintQualityDashboard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Paintbrush, Timer, Target } from "lucide-react";

type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type DetectedDefect = {
  defectClass: string;
  defectNameKo: string;
  defectNameEn?: string;
  confidence: number; // percent
  bboxX1: number;
  bboxY1: number;
  bboxX2: number;
  bboxY2: number;
  bboxArea: number;
  severityLevel: Severity;
};

type PaintApiResponse = {
  status: "success" | string;
  message: string;
  data: {
    result_id: string;
    img_id: string;
    img_name: string | null;
    img_path: string | null; // /static/...
    img_result: string | null; // /static/...
    defect_type: number;
    defect_score: number; // 0~1
    label_name: string | null;
    label_path: string | null;
    label_name_text: string | null;
    label_name_ko?: string | null;
    inference_time_ms: number;
    detected_defects?: DetectedDefect[];
  };
  source?: string | null;
  sequence?: { index_next: number; count: number };
  auto_note?: string | null;
};

type HistoryItem = {
  resultId: string;
  analyzedAt: string;
  status: "PASS" | "FAIL";
  primaryDefectTypeKo: string | null;
  confidence: number;
  inferenceTimeMs: number;
  originalImageUrl: string;
  resultImageUrl: string;
  defects: DetectedDefect[];
};

const API_BASE = "http://localhost:8000";
const AUTO_ENDPOINT = `${API_BASE}/api/v1/smartfactory/paint/auto`;
const POLL_MS = 5000;

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function safePercent(n: any, fallback = 0) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return v;
}

function normalizeUrl(path: string | null | undefined) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path}`;
}

function statusPill(status: "PASS" | "FAIL") {
  return status === "PASS"
    ? "text-green-700 bg-green-50 border-green-200"
    : "text-red-700 bg-red-50 border-red-200";
}

function statusText(status: "PASS" | "FAIL") {
  return status === "PASS" ? "정상" : "결함";
}

function severityTone(sev: Severity) {
  if (sev === "CRITICAL") return "bg-red-50 text-red-700 border-red-200";
  if (sev === "HIGH") return "bg-orange-50 text-orange-700 border-orange-200";
  if (sev === "MEDIUM") return "bg-yellow-50 text-yellow-800 border-yellow-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
}

function severityDot(sev: Severity) {
  if (sev === "CRITICAL") return "bg-red-500";
  if (sev === "HIGH") return "bg-orange-500";
  if (sev === "MEDIUM") return "bg-yellow-500";
  return "bg-blue-500";
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "good" | "bad" | "info" | "purple";
}) {
  const valueClass =
    tone === "good"
      ? "text-green-600"
      : tone === "bad"
      ? "text-red-600"
      : tone === "info"
      ? "text-blue-600"
      : tone === "purple"
      ? "text-purple-600"
      : "text-gray-900";

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-sm font-medium text-gray-600">{label}</p>
        </div>
      </div>
      <p className={cn("text-4xl font-bold mb-2", valueClass)}>{value}</p>
      {sub ? <p className={cn("text-xs font-medium", valueClass)}>{sub}</p> : null}
    </div>
  );
}

function Card({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        {badge}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function CurrentImage({ url }: { url: string }) {
  const full = normalizeUrl(url);
  const [broken, setBroken] = useState(false);

  if (!full || broken) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/70 text-sm">
        결과 이미지를 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <img
      src={full}
      alt="분석 결과"
      onError={() => setBroken(true)}
      className="w-full h-full object-contain object-center"
    />
  );
}

export const PaintQualityDashboard: React.FC = () => {
  const firstRunRef = useRef(true);
  const inFlightRef = useRef(false);

  const [current, setCurrent] = useState<HistoryItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [autoInfo, setAutoInfo] = useState<string>("");

  const stats = useMemo(() => {
    const total = history.length;
    const pass = history.filter((h) => h.status === "PASS").length;
    const fail = total - pass;

    const avgConf =
      total === 0 ? 0 : history.reduce((acc, h) => acc + (h.confidence || 0), 0) / total;

    const avgLatency =
      total === 0
        ? 0
        : history.reduce((acc, h) => acc + (h.inferenceTimeMs || 0), 0) / total;

    const passRate = total === 0 ? 0 : (pass / total) * 100;
    const defectRate = total === 0 ? 0 : (fail / total) * 100;

    return { total, pass, fail, avgConf, avgLatency, passRate, defectRate };
  }, [history]);

  const buildHistoryItem = (json: PaintApiResponse, analyzedAtISO?: string) => {
    const defects = json.data.detected_defects || [];
    const status: "PASS" | "FAIL" = defects.length === 0 ? "PASS" : "FAIL";

    const primaryKo =
      status === "PASS"
        ? "정상"
        : defects[0]?.defectNameKo ??
          json.data.label_name_ko ??
          (json.data.label_name_text && json.data.label_name_text !== "없음" ? "기타" : "기타");

    const conf =
      status === "PASS"
        ? 100
        : safePercent(defects[0]?.confidence, Math.round(safePercent(json.data.defect_score, 0) * 100));

    const originalUrl = json.data.img_path || "";
    const resultUrl = json.data.img_result || json.data.img_path || "";

    return {
      resultId: json.data.result_id || `unknown_${Date.now()}`,
      analyzedAt: analyzedAtISO || new Date().toISOString(),
      status,
      primaryDefectTypeKo: primaryKo,
      confidence: conf,
      inferenceTimeMs: json.data.inference_time_ms ?? 0,
      originalImageUrl: originalUrl,
      resultImageUrl: resultUrl,
      defects,
    } as HistoryItem;
  };

  const pushHistory = (item: HistoryItem) => {
    setCurrent(item);
    setHistory((prev) => {
      if (prev.length > 0 && prev[0].resultId === item.resultId) {
        const copy = [...prev];
        copy[0] = item;
        return copy;
      }
      return [item, ...prev].slice(0, 50);
    });
  };

  const fetchAutoOnce = async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      const res = await fetch(AUTO_ENDPOINT, { method: "POST" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`AUTO API error ${res.status}: ${text || res.statusText}`);
      }

      const json = (await res.json()) as PaintApiResponse;
      if (!json?.data) throw new Error("AUTO 응답 형식이 올바르지 않습니다. (data 없음)");

      setError(null);

      // ✅ source 노출 제거: auto_note만 허용(있을 때만)
      setAutoInfo(json.auto_note ?? "");

      const item = buildHistoryItem(json, new Date().toISOString());
      pushHistory(item);
    } catch (e: any) {
      setError(e?.message || "AUTO 분석 중 오류가 발생했습니다.");
    } finally {
      inFlightRef.current = false;
    }
  };

  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      fetchAutoOnce();
    }

    const id = window.setInterval(() => {
      fetchAutoOnce();
    }, POLL_MS);

    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const latest = history[0];

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header (Battery 톤) */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Paintbrush className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">도장 품질 관리</h2>
              <p className="text-gray-600 mt-1">도장 결함 탐지 및 이력 관리</p>
              <p className="text-xs text-gray-500 mt-1">
                Polling:{" "}
                {POLL_MS / 1000}s
              </p>
              {autoInfo ? <p className="text-xs text-gray-500 mt-1">{autoInfo}</p> : null}
            </div>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <button
            onClick={() => {
              setHistory([]);
              setCurrent(null);
              setError(null);
            }}
            className="px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl outline-none focus:ring-4 focus:ring-blue-200"
          >
            이력 초기화
          </button>
        </div>
      </div>

      {/* KPI (Battery 스타일) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <KpiCard
          icon={<Target className="w-5 h-5 text-blue-600" />}
          label="전체 검사 수"
          value={stats.total.toLocaleString()}
          sub="최근 50건 기준"
          tone="info"
        />
        <KpiCard
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
          label="결함률"
          value={`${stats.defectRate.toFixed(1)}%`}
          sub={`${stats.fail}건 결함`}
          tone="bad"
        />
        <KpiCard
          icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
          label="정상률"
          value={`${stats.passRate.toFixed(1)}%`}
          sub={`${stats.pass}건 정상`}
          tone="good"
        />
        <KpiCard
          icon={<Timer className="w-5 h-5 text-purple-600" />}
          label="평균 처리시간"
          value={`${Math.round(stats.avgLatency)}ms`}
          sub={`평균 신뢰도 ${stats.avgConf.toFixed(1)}%`}
          tone="purple"
        />
      </div>

      {error && (
        <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* 상단: 좌 이미지 / 우 결과 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left: Image */}
        <Card
          title="결과 이미지"
          badge={
            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-gray-900 text-white">
              {latest ? (latest.status === "FAIL" ? "DEFECT" : "NORMAL") : "WAIT"}
            </span>
          }
        >
          <div className="bg-white rounded-2xl border border-gray-200 p-3">
            <div className="text-[11px] text-gray-500 mb-2 flex items-center justify-between">
              <span>최근 결과 이미지</span>
              <span className="font-mono">
                {current
                  ? new Date(current.analyzedAt).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "--:--:--"}
              </span>
            </div>

            {/* ✅ 잘림 방지: aspect 박스 + object-contain */}
            <div className="rounded-xl border border-gray-200 overflow-hidden bg-black">
              <div className="aspect-[16/9] w-full">
                <CurrentImage url={current?.resultImageUrl || ""} />
              </div>
            </div>
          </div>
        </Card>

        {/* Right: Result */}
        <Card
          title="현재 분석 결과"
          badge={
            current ? (
              <span className={cn("px-3 py-1 text-[10px] font-bold rounded-full border", statusPill(current.status))}>
                {statusText(current.status)}
              </span>
            ) : (
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-gray-900 text-white">WAIT</span>
            )
          }
        >
          {!current ? (
            <div className="text-sm text-gray-500 py-16 text-center">분석 대기 중...</div>
          ) : (
            <div className="space-y-5">
              {/* 검사 정보 */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="text-sm font-bold text-gray-900 mb-4">검사 정보</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">결과 ID</div>
                    <div className="font-mono text-gray-900 break-all mt-1">{current.resultId}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">시간</div>
                    <div className="text-gray-900 mt-1">
                      {new Date(current.analyzedAt).toLocaleString("ko-KR", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">대표 결함</div>
                    <div className="text-gray-900 font-semibold mt-1">
                      {current.primaryDefectTypeKo || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">신뢰도</div>
                    <div className="text-gray-900 font-semibold mt-1">
                      {safePercent(current.confidence, 0).toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">처리시간</div>
                    <div className="text-gray-900 font-semibold mt-1">{current.inferenceTimeMs}ms</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">검출 개수</div>
                    <div className="text-gray-900 font-semibold mt-1">{current.defects.length}개</div>
                  </div>
                </div>
              </div>

              {/* 검출 결함 */}
              {current.defects.length > 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="text-sm font-bold text-gray-900 mb-4">검출 결함</div>

                  <div className="space-y-3">
                    {current.defects.map((d, idx) => (
                      <div
                        key={`${current.resultId}_${idx}`}
                        className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-bold text-gray-900">{d.defectNameKo}</div>
                            <div className="text-xs text-gray-500 mt-1">{d.defectClass}</div>
                            <div className="text-[11px] text-gray-500 mt-2">
                              bbox: ({d.bboxX1},{d.bboxY1}) ~ ({d.bboxX2},{d.bboxY2})
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-2xl font-extrabold text-gray-900">
                              {safePercent(d.confidence, 0).toFixed(0)}%
                            </div>
                            <div
                              className={cn(
                                "mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold",
                                severityTone(d.severityLevel)
                              )}
                            >
                              <span className={cn("w-2 h-2 rounded-full", severityDot(d.severityLevel))} />
                              {d.severityLevel}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700 font-medium">
                  결함이 검출되지 않았습니다.
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* History */}
      <Card
        title="최근 분석 이력"
        badge={
          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-gray-900 text-white">
            latest {Math.min(history.length, 50)}
          </span>
        }
      >
        <div className="overflow-auto max-h-[420px] rounded-2xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr className="text-left text-gray-600">
                <th className="p-3 font-semibold">시간</th>
                <th className="p-3 font-semibold">상태</th>
                <th className="p-3 font-semibold">대표 결함</th>
                <th className="p-3 font-semibold">신뢰도</th>
                <th className="p-3 font-semibold">처리시간</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-10 text-gray-400">
                    분석 이력이 없습니다.
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr
                    key={h.resultId}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setCurrent(h)}
                    title="클릭하면 해당 결과를 다시 표시합니다"
                  >
                    <td className="p-3 whitespace-nowrap text-gray-700">
                      {new Date(h.analyzedAt).toLocaleString("ko-KR", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-3">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full border text-xs font-bold",
                          statusPill(h.status)
                        )}
                      >
                        {statusText(h.status)}
                      </span>
                    </td>
                    <td className="p-3 text-gray-800">{h.primaryDefectTypeKo || "-"}</td>
                    <td className="p-3 font-mono text-gray-900">{safePercent(h.confidence, 0).toFixed(0)}%</td>
                    <td className="p-3 text-gray-800">{h.inferenceTimeMs}ms</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          * AUTO는 {POLL_MS / 1000}초 주기로 자동 실행됩니다.
        </div>
      </Card>
    </div>
  );
};

export default PaintQualityDashboard;
