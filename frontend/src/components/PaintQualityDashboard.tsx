// src/components/PaintQualityDashboard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Target, Timer } from "lucide-react";

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
  source?: string | null;
};

const API_BASE = "http://localhost:8000";
const AUTO_ENDPOINT = `${API_BASE}/api/v1/smartfactory/paint/auto`;

function classNames(...xs: Array<string | false | null | undefined>) {
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

function severityColor(sev: Severity) {
  if (sev === "CRITICAL") return "text-red-600";
  if (sev === "HIGH") return "text-orange-600";
  if (sev === "MEDIUM") return "text-yellow-600";
  return "text-blue-600";
}

export const PaintQualityDashboard: React.FC = () => {
  const firstRunRef = useRef(true);

  const [current, setCurrent] = useState<HistoryItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [autoInfo, setAutoInfo] = useState<string>("");

  const stats = useMemo(() => {
    const total = history.length;
    const pass = history.filter((h) => h.status === "PASS").length;
    const fail = total - pass;

    const avgConf =
      total === 0
        ? 0
        : history.reduce((acc, h) => acc + (h.confidence || 0), 0) / total;

    const avgLatency =
      total === 0
        ? 0
        : history.reduce((acc, h) => acc + (h.inferenceTimeMs || 0), 0) / total;

    const passRate = total === 0 ? 0 : (pass / total) * 100;
    const defectRate = total === 0 ? 0 : (fail / total) * 100;

    return {
      total,
      pass,
      fail,
      avgConf,
      avgLatency,
      passRate,
      defectRate,
    };
  }, [history]);

  const buildHistoryItem = (json: PaintApiResponse, analyzedAtISO?: string) => {
    const defects = json.data.detected_defects || [];
    const status: "PASS" | "FAIL" = defects.length === 0 ? "PASS" : "FAIL";

    const primaryKo =
      status === "PASS"
        ? "정상"
        : defects[0]?.defectNameKo ??
          json.data.label_name_ko ??
          (json.data.label_name_text && json.data.label_name_text !== "없음"
            ? "기타"
            : "기타");

    const conf =
      status === "PASS"
        ? 100
        : safePercent(
            defects[0]?.confidence,
            Math.round(safePercent(json.data.defect_score, 0) * 100)
          );

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
      source: json.source ?? null,
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
    try {
      const res = await fetch(AUTO_ENDPOINT, { method: "POST" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`AUTO API error ${res.status}: ${text || res.statusText}`);
      }

      const json = (await res.json()) as PaintApiResponse;
      if (!json?.data) throw new Error("AUTO 응답 형식이 올바르지 않습니다. (data 없음)");

      // 성공하면 에러 제거
      setError(null);

      const info =
        json.auto_note ??
        (json.source
          ? `source: ${json.source} (${json.sequence?.index_next ?? 0}/${json.sequence?.count ?? 0})`
          : "");
      setAutoInfo(info);

      const item = buildHistoryItem(json, new Date().toISOString());
      pushHistory(item);
    } catch (e: any) {
      setError(e?.message || "AUTO 분석 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      fetchAutoOnce();
    }

    const id = window.setInterval(() => {
      fetchAutoOnce();
    }, 5000);

    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const MetricCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    tone,
  }: {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ElementType;
    tone: "blue" | "green" | "red" | "purple";
  }) => {
    const toneMap: Record<string, string> = {
      blue: "bg-blue-50 text-blue-700 border-blue-200",
      green: "bg-green-50 text-green-700 border-green-200",
      red: "bg-red-50 text-red-700 border-red-200",
      purple: "bg-purple-50 text-purple-700 border-purple-200",
    };

    return (
      <div className="rounded-lg border bg-white p-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500 font-medium">{title}</div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{value}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{subtitle}</div>
        </div>
        <div className={classNames("p-2 rounded-lg border", toneMap[tone])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    );
  };

  const CurrentImage = ({ url }: { url: string }) => {
    const full = normalizeUrl(url);
    const [broken, setBroken] = useState(false);

    if (!full || broken) {
      return (
        <div className="text-xs text-slate-400 py-10 text-center">
          결과 이미지를 불러올 수 없습니다.
        </div>
      );
    }

    return (
      <img
        src={full}
        alt="분석 결과"
        onError={() => setBroken(true)}
        className="w-full max-h-[420px] object-contain rounded"
      />
    );
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-3xl font-bold text-gray-900">도장 품질 관리</h2>
        <p className="text-gray-600 mt-1">
          AUTO(5초): <span className="font-mono">/api/v1/smartfactory/paint/auto</span>
        </p>
        {autoInfo && <div className="mt-1 text-[11px] text-slate-500">{autoInfo}</div>}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <MetricCard
          title="전체 검사 수"
          value={stats.total.toLocaleString()}
          subtitle="(이 페이지에서) 최근 기록"
          icon={Target}
          tone="blue"
        />
        <MetricCard
          title="결함률"
          value={`${stats.defectRate.toFixed(1)}%`}
          subtitle={`${stats.fail}건 결함`}
          icon={AlertTriangle}
          tone="red"
        />
        <MetricCard
          title="정상률"
          value={`${stats.passRate.toFixed(1)}%`}
          subtitle={`${stats.pass}건 정상`}
          icon={CheckCircle2}
          tone="green"
        />
        <MetricCard
          title="평균 처리시간"
          value={`${Math.round(stats.avgLatency)}ms`}
          subtitle={`평균 신뢰도 ${stats.avgConf.toFixed(1)}%`}
          icon={Timer}
          tone="purple"
        />
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* 상단: 왼쪽 이미지 / 오른쪽 결과 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Image */}
        <div className="rounded-lg border p-4 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-slate-900">결과 이미지</div>
            {current?.source && (
              <span className="text-[11px] px-2 py-1 rounded border bg-slate-50 text-slate-600">
                source: {current.source}
              </span>
            )}
          </div>

          <div className="rounded-md border bg-slate-50 p-2">
            <CurrentImage url={current?.resultImageUrl || ""} />
          </div>

          {current?.resultImageUrl && (
            <div className="mt-2 text-[11px] text-slate-500 break-all">
              {current.resultImageUrl}
            </div>
          )}
        </div>

        {/* Right: Result */}
        <div className="rounded-lg border p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-slate-900">현재 분석 결과</div>
            {current && (
              <span
                className={classNames(
                  "px-2 py-1 text-xs font-semibold rounded border",
                  statusPill(current.status)
                )}
              >
                {statusText(current.status)}
              </span>
            )}
          </div>

          {!current ? (
            <div className="text-xs text-slate-500 py-10 text-center">
              AUTO 분석 대기 중...
            </div>
          ) : (
            <div className="space-y-3">
              {/* 검사 정보 */}
              <div className="rounded-md border p-3">
                <div className="text-xs font-semibold mb-2">검사 정보</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-slate-500">결과 ID</div>
                    <div className="font-mono text-slate-800 break-all">
                      {current.resultId}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">시간</div>
                    <div className="text-slate-800">
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
                    <div className="text-slate-500">대표 결함</div>
                    <div className="text-slate-800 font-medium">
                      {current.primaryDefectTypeKo || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">신뢰도</div>
                    <div className="text-slate-800 font-medium">
                      {safePercent(current.confidence, 0).toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">처리시간</div>
                    <div className="text-slate-800 font-medium">
                      {current.inferenceTimeMs}ms
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">검출 개수</div>
                    <div className="text-slate-800 font-medium">
                      {current.defects.length}개
                    </div>
                  </div>
                </div>
              </div>

              {/* 검출 결함 */}
              {current.defects.length > 0 ? (
                <div className="rounded-md border p-3">
                  <div className="text-xs font-semibold mb-2">검출 결함</div>
                  <div className="space-y-2">
                    {current.defects.map((d, idx) => (
                      <div
                        key={`${current.resultId}_${idx}`}
                        className="flex items-center justify-between rounded-md bg-slate-50 p-2 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-800">
                            {d.defectNameKo}
                          </div>
                          <div className="text-slate-500">{d.defectClass}</div>
                          <div className="text-[11px] text-slate-500">
                            bbox: ({d.bboxX1},{d.bboxY1}) ~ ({d.bboxX2},{d.bboxY2})
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-slate-800">
                            {safePercent(d.confidence, 0).toFixed(0)}%
                          </div>
                          <div className={classNames("font-semibold", severityColor(d.severityLevel))}>
                            {d.severityLevel}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-green-200 bg-green-50 p-3 text-xs text-green-700">
                  결함이 검출되지 않았습니다.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <div className="rounded-lg border p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">최근 분석 이력</div>
          {history.length > 0 && (
            <button
              onClick={() => {
                setHistory([]);
                setCurrent(null);
                setError(null);
              }}
              className="text-xs px-2 py-1 rounded border bg-white hover:bg-slate-50"
            >
              이력 초기화
            </button>
          )}
        </div>

        <div className="overflow-auto max-h-[420px]">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 border-b sticky top-0">
              <tr>
                <th className="text-left p-2 font-semibold">시간</th>
                <th className="text-left p-2 font-semibold">상태</th>
                <th className="text-left p-2 font-semibold">대표 결함</th>
                <th className="text-left p-2 font-semibold">신뢰도</th>
                <th className="text-left p-2 font-semibold">처리시간</th>
                <th className="text-left p-2 font-semibold">source</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-slate-400">
                    분석 이력이 없습니다.
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr
                    key={h.resultId}
                    className="border-b hover:bg-slate-50 cursor-pointer"
                    onClick={() => setCurrent(h)}
                    title="클릭하면 해당 결과를 다시 표시합니다"
                  >
                    <td className="p-2 whitespace-nowrap">
                      {new Date(h.analyzedAt).toLocaleString("ko-KR", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-2">
                      <span
                        className={classNames(
                          "px-2 py-0.5 rounded border text-[11px] font-semibold",
                          statusPill(h.status)
                        )}
                      >
                        {statusText(h.status)}
                      </span>
                    </td>
                    <td className="p-2">{h.primaryDefectTypeKo || "-"}</td>
                    <td className="p-2 font-semibold">
                      {safePercent(h.confidence, 0).toFixed(0)}%
                    </td>
                    <td className="p-2">{h.inferenceTimeMs}ms</td>
                    <td className="p-2 text-[11px] text-slate-600">{h.source || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-2 text-[11px] text-slate-500">
          * AUTO는 5초 주기로 자동 실행됩니다.
        </div>
      </div>
    </div>
  );
};

export default PaintQualityDashboard;
