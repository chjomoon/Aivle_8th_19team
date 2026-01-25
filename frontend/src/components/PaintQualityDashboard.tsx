// src/components/PaintQualityDashboard.tsx
import React, { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Target,
  Timer,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type DetectedDefect = {
  defectClass: string; // EN key e.g. orange_peel
  defectNameKo: string; // KO e.g. 오렌지 필
  defectNameEn?: string; // optional
  confidence: number; // percent (0~100)
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
    img_name: string;
    img_path: string; // /static/...
    img_result: string; // /static/...
    defect_type: number; // -1 or class id
    defect_score: number; // 0~1 (server)
    label_name: string | null;
    label_path: string | null;
    label_name_text: string | null; // EN name or "없음"
    label_name_ko?: string | null; // KO name
    inference_time_ms: number;
    detected_defects?: DetectedDefect[];
  };
};

type HistoryItem = {
  resultId: string;
  analyzedAt: string; // ISO string
  status: "PASS" | "FAIL";
  primaryDefectTypeKo: string | null;
  confidence: number; // 0~100
  inferenceTimeMs: number;
  originalImageUrl: string; // /static/...
  resultImageUrl: string; // /static/...
  defects: DetectedDefect[];
};

const API_BASE = "http://localhost:8000";

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function getColorForDefectKo(name: string) {
  const map: Record<string, string> = {
    정상: "#10b981",
    "오렌지 필": "#ef4444",
    흘러내림: "#f97316",
    "솔벤트 팝": "#eab308",
    물자국: "#6366f1",
    기타: "#64748b",
  };
  return map[name] || "#64748b";
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

function safePercent(n: any, fallback = 0) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return v;
}

function normalizeUrl(path: string | null | undefined) {
  if (!path) return "";
  // server returns /static/...
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path}`;
}

export const PaintQualityDashboard: React.FC = () => {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [uploading, setUploading] = useState(false);
  const [current, setCurrent] = useState<HistoryItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = history.length;
    const pass = history.filter((h) => h.status === "PASS").length;
    const fail = total - pass;

    const defectSum = history.reduce(
      (acc, h) => acc + (h.defects?.length || 0),
      0
    );

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
      defectSum,
      avgConf,
      avgLatency,
      passRate,
      defectRate,
    };
  }, [history]);

  // 검사 건수 기준 분포 (PASS=정상 1건, FAIL=대표 결함 1건)
  const defectRatio = useMemo(() => {
    if (history.length === 0) return [];

    const map: Record<string, number> = {};
    for (const h of history) {
      if (h.status === "PASS") {
        map["정상"] = (map["정상"] || 0) + 1;
      } else {
        const key = h.primaryDefectTypeKo || "기타";
        map[key] = (map[key] || 0) + 1;
      }
    }

    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      fill: getColorForDefectKo(name),
      percentage: ((value / history.length) * 100).toFixed(1),
    }));
  }, [history]);

  const onPickFile = () => fileRef.current?.click();

  const buildHistoryItem = (json: PaintApiResponse, fileNameFallback?: string) => {
    const defects = json.data.detected_defects || [];
    const status: "PASS" | "FAIL" = defects.length === 0 ? "PASS" : "FAIL";

    // 대표 결함(KO):
    // 1) detected_defects[0].defectNameKo
    // 2) server data.label_name_ko
    // 3) 없으면 기타
    const primaryKo =
      status === "PASS"
        ? null
        : defects[0]?.defectNameKo ??
          json.data.label_name_ko ??
          (json.data.label_name_text && json.data.label_name_text !== "없음"
            ? "기타"
            : "기타");

    // confidence:
    // - PASS: server가 100 주지만 안전하게 100 고정
    // - FAIL: detected_defects[0].confidence (percent)
    // - fallback: defect_score(0~1) -> percent
    const conf =
      status === "PASS"
        ? 100
        : safePercent(
            defects[0]?.confidence,
            Math.round(safePercent(json.data.defect_score, 0) * 100)
          );

    // 이미지 URL:
    // 서버가 원본 삭제할 수도 있고, 결과 이미지는 저장되는 위치가 다를 수 있음
    // img_result 우선, 없으면 img_path
    const originalUrl = json.data.img_path || "";
    const resultUrl = json.data.img_result || json.data.img_path || "";

    const item: HistoryItem = {
      resultId: json.data.result_id,
      analyzedAt: new Date().toISOString(),
      status,
      primaryDefectTypeKo: primaryKo,
      confidence: conf,
      inferenceTimeMs: json.data.inference_time_ms ?? 0,
      originalImageUrl: originalUrl,
      resultImageUrl: resultUrl,
      defects,
    };

    // 혹시 result_id가 비었을 경우 대비 (거의 없음)
    if (!item.resultId) {
      item.resultId = `unknown_${Date.now()}_${fileNameFallback || "file"}`;
    }

    return item;
  };

  const onUpload = async (file: File) => {
    setError(null);
    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`${API_BASE}/api/v1/smartfactory/paint`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API error ${res.status}: ${text || res.statusText}`);
      }

      const json = (await res.json()) as PaintApiResponse;

      if (!json?.data) {
        throw new Error("API 응답 형식이 올바르지 않습니다. (data 없음)");
      }

      const item = buildHistoryItem(json, file.name);

      setCurrent(item);
      setHistory((prev) => [item, ...prev].slice(0, 50));
    } catch (e: any) {
      setError(e?.message || "업로드/분석 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

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
          <div className="mt-1 text-[11px]">
            (서버에서 원본 삭제/경로 변경 가능)
          </div>
        </div>
      );
    }

    return (
      <img
        src={full}
        alt="분석 결과"
        onError={() => setBroken(true)}
        className="w-full max-h-[360px] object-contain rounded"
      />
    );
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-3xl font-bold text-gray-900">도장 품질 관리</h2>
        <p className="text-gray-600 mt-1">
          FastAPI 도장 모델(<span className="font-mono">/api/v1/smartfactory/paint</span>) 기반 분석
        </p>
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

      {/* Uploader + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[260px]">
        {/* Uploader */}
        <div className="rounded-lg border p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">이미지 등록</div>
              <div className="text-xs text-slate-500">
                JPG/PNG/WebP 업로드 후 즉시 분석합니다.
              </div>
            </div>

            <button
              onClick={onPickFile}
              disabled={uploading}
              className={classNames(
                "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border",
                uploading
                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  : "bg-slate-900 text-white border-slate-900 hover:bg-black"
              )}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  분석 중
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  업로드
                </>
              )}
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.currentTarget.value = "";
              }}
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="mt-3 text-xs text-slate-500">
            백엔드: <span className="font-mono">{API_BASE}</span>
          </div>
        </div>

        {/* Defect Ratio Chart */}
        <div className="rounded-lg border p-4 bg-white">
          <div className="text-sm font-semibold text-slate-900 mb-1">결함 분포</div>
          <div className="text-xs text-slate-500 mb-3">
            검사 건수 기준 (PASS=정상 1건, FAIL=대표 결함 1건)
          </div>

          {defectRatio.length === 0 ? (
            <div className="text-xs text-slate-400 py-10 text-center">
              아직 분석 기록이 없습니다.
            </div>
          ) : (
            <div className="h-[210px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={defectRatio}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    labelLine={false}
                    label={(entry: any) => `${entry.percentage}%`}
                  >
                    {defectRatio.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${v}건`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Current Result */}
      {current && (
        <div className="rounded-lg border p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-slate-900">현재 분석 결과</div>
            <span
              className={classNames(
                "px-2 py-1 text-xs font-semibold rounded border",
                statusPill(current.status)
              )}
            >
              {statusText(current.status)}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Image */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-600">분석 이미지</div>
              <div className="rounded-md border bg-slate-50 p-2">
                <CurrentImage url={current.resultImageUrl} />
              </div>

              {/* 원본 링크도 같이 보여주면 디버깅 쉬움 */}
              <div className="text-[11px] text-slate-500 break-all">
                결과: <span className="font-mono">{current.resultImageUrl}</span>
              </div>
            </div>

            {/* Meta + Defects */}
            <div className="space-y-3">
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

              {current.defects.length > 0 && (
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
                          <div
                            className={classNames("font-semibold", severityColor(d.severityLevel))}
                          >
                            {d.severityLevel}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {current.defects.length === 0 && (
                <div className="rounded-md border border-green-200 bg-green-50 p-3 text-xs text-green-700">
                  결함이 검출되지 않았습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History */}
      <div className="rounded-lg border p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">최근 분석 이력</div>
          {history.length > 0 && (
            <button
              onClick={() => {
                setHistory([]);
                setCurrent(null);
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
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-slate-400">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-2 text-[11px] text-slate-500">
          * 이력/통계는 현재 페이지 상태에만 저장됩니다(새로고침 시 초기화).
        </div>
      </div>
    </div>
  );
};

export default PaintQualityDashboard;
