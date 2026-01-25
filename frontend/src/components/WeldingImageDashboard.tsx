import React, { useMemo, useState } from "react";
import {
  Camera,
  Search,
  Save,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BarChart3,
  PieChart as PieIcon,
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

/* =====================
   Types
===================== */

type Defect = {
  class: string;
  confidence: number;
  bbox: number[];
};

type WeldingResponse = {
  status: "NORMAL" | "DEFECT";
  defects: Defect[];
  original_image_url: string;
  result_image_url: string | null;
};

type HistoryRow = {
  id: string;
  time: string;
  judgement: "양품" | "불량";
  defectType: string;
  confidencePct: number;
  originalUrl?: string;
  resultUrl?: string;
};

/* =====================
   Constants
===================== */

const ENDPOINT = "http://localhost:8000/api/v1/smartfactory/welding/image";
const SERVER_BASE = "http://localhost:8000";

const DEFECT_META: Record<
  string,
  { label: string; dot: string; bar: string; chip: string }
> = {
  Spatters: {
    label: "용접 비산물",
    dot: "bg-red-500",
    bar: "bg-red-500",
    chip: "bg-red-50 text-red-700 border-red-200",
  },
  Crack: {
    label: "균열",
    dot: "bg-orange-500",
    bar: "bg-orange-500",
    chip: "bg-orange-50 text-orange-700 border-orange-200",
  },
  Porosity: {
    label: "기공",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
    chip: "bg-amber-50 text-amber-800 border-amber-200",
  },
  Excess_Reinforcement: {
    label: "과다 보강",
    dot: "bg-indigo-500",
    bar: "bg-indigo-500",
    chip: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
};

/* =====================
   Utils
===================== */

function nowHHMMSS() {
  return new Date().toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function pad5(n: number) {
  return String(n).padStart(5, "0");
}

function topDefect(defects: Defect[]) {
  if (!defects.length) return null;
  return defects.reduce((a, b) => (a.confidence > b.confidence ? a : b));
}

function confidenceToPct(x: number) {
  return Math.max(0, Math.min(100, Math.round(x * 1000) / 10));
}

function publicUrl(path?: string | null) {
  if (!path) return "";
  return path.startsWith("http") ? path : `${SERVER_BASE}${path}`;
}

/* =====================
   UI Components
===================== */

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-5">
        {icon}
        <div className="font-extrabold text-gray-900">{title}</div>
      </div>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "good" | "bad" | "info";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-700"
      : tone === "bad"
      ? "text-rose-700"
      : tone === "info"
      ? "text-blue-700"
      : "text-gray-900";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold ${toneClass}`}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

/* =====================
   Main Component
===================== */

export function WeldingImageDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState<WeldingResponse | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [seq, setSeq] = useState(1);
  const [error, setError] = useState("");

  const latest = history[0];
  const latestDefect =
    result?.status === "DEFECT" ? topDefect(result.defects) : null;

  const total = history.length;
  const bad = history.filter((h) => h.judgement === "불량").length;
  const good = total - bad;
  const rate = total === 0 ? 100 : (good / total) * 100;

  const donutData = [
    { name: "양품", value: good },
    { name: "불량", value: bad },
  ];

  /* ------------------ handlers ------------------ */

  const resetAll = () => {
    setFile(null);
    setPreview("");
    setResult(null);
    setError("");
  };

  const onPickFile = (f: File | null) => {
    setFile(f);
    setResult(null);
    setError("");
    if (f) setPreview(URL.createObjectURL(f));
  };

  const onSubmit = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(ENDPOINT, { method: "POST", body: form });
      const json = (await res.json()) as WeldingResponse;

      setResult(json);

      const top = json.status === "DEFECT" ? topDefect(json.defects) : null;

      setHistory((prev) => [
        {
          id: `IMG-${pad5(seq)}`,
          time: nowHHMMSS(),
          judgement: json.status === "DEFECT" ? "불량" : "양품",
          defectType: top?.class ?? "-",
          confidencePct: top ? confidenceToPct(top.confidence) : 99,
          originalUrl: publicUrl(json.original_image_url),
          resultUrl: publicUrl(json.result_image_url),
        },
        ...prev,
      ]);

      setSeq((p) => p + 1);
    } catch {
      setError("분석 중 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  const mainImage = useMemo(() => {
    if (result?.result_image_url) return publicUrl(result.result_image_url);
    if (result?.original_image_url) return publicUrl(result.original_image_url);
    return preview;
  }, [result, preview]);

  /* ===================== JSX ===================== */

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <div className="text-3xl font-extrabold text-gray-900">
            용접 이미지 검사
          </div>
          <div className="text-sm text-gray-600 mt-1">
            AI 비전 기반 공정 후 불량 판정
          </div>
        </div>

        <button
          onClick={resetAll}
          className="px-5 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow inline-flex items-center gap-2"
        >
          <RefreshCcw className="w-5 h-5" />
          새 이미지
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Stat label="전체 검사 수" value={total.toString()} />
        <Stat label="불량 수량" value={bad.toString()} tone="bad" />
        <Stat label="양품 수량" value={good.toString()} tone="good" />
        <Stat label="양품률" value={`${rate.toFixed(2)}%`} tone="info" />
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-50 border text-red-700">
          {error}
        </div>
      )}

      {/* Main */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Image */}
        <Card title="이미지 분석">
          <div className="flex justify-between mb-4">
            <input type="file" onChange={(e) => onPickFile(e.target.files?.[0] ?? null)} />
            <button
              onClick={onSubmit}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-yellow-300 font-bold inline-flex items-center gap-2"
            >
              <span className="w-7 h-7 bg-yellow-400 rounded-md flex items-center justify-center">
                <Search className="w-4 h-4 text-black" />
              </span>
              분석
            </button>
          </div>

          <div className="bg-gray-900 rounded-xl p-3">
            {mainImage ? (
              <img src={mainImage} className="w-full h-64 object-contain" />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                이미지 없음
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-between">
            <div className="text-xs text-gray-500 mb-1">최근 결과</div>
            {latest ? (
              latest.judgement === "양품" ? (
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border font-semibold">
                  양품
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 border font-semibold">
                  불량
                </span>
              )
            ) : (
              <span className="px-3 py-1 rounded-full border text-gray-600">
                대기
              </span>
            )}
          </div>
        </Card>

        {/* Result */}
        <Card title="분석 결과">
          <div className="grid grid-cols-3 gap-3">
            <div className="border rounded-xl p-3">
              <div className="text-xs text-gray-500">판정</div>
              <div className="font-extrabold">
                {result ? (result.status === "DEFECT" ? "불량" : "양품") : "-"}
              </div>
            </div>
            <div className="border rounded-xl p-3">
              <div className="text-xs text-gray-500">대표 불량</div>
              <div className="font-extrabold">{latestDefect?.class ?? "-"}</div>
            </div>
            <div className="border rounded-xl p-3">
              <div className="text-xs text-gray-500">신뢰도</div>
              <div className="font-extrabold">
                {latestDefect
                  ? `${confidenceToPct(latestDefect.confidence)}%`
                  : "-"}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card title="최근 검사 결과">
        {history.length === 0 ? (
          <div className="text-sm text-gray-500">기록 없음</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-gray-500 border-b">
              <tr>
                <th className="py-2">ID</th>
                <th>시간</th>
                <th>판정</th>
                <th>불량</th>
                <th>신뢰도</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-b">
                  <td>{h.id}</td>
                  <td>{h.time}</td>
                  <td>{h.judgement}</td>
                  <td>{h.defectType}</td>
                  <td>{h.confidencePct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
