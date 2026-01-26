import React, { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCcw, Search } from "lucide-react";

/* =====================
   Types
===================== */

type Defect = {
  class: string;
  confidence: number;
  bbox: number[];
};

type WeldingAutoResponse = {
  status: "NORMAL" | "DEFECT";
  defects: Defect[];
  original_image_url: string;
  result_image_url: string | null;
  source?: string;
  sequence?: { index_next: number; count: number };
};

type HistoryRow = {
  id: string;
  time: string;
  judgement: "양품" | "불량";
  defectType: string;
  confidencePct: number;
  originalUrl?: string;
  resultUrl?: string;
  source?: string;
};

/* =====================
   Constants
===================== */

const ENDPOINT_AUTO =
  "http://localhost:8000/api/v1/smartfactory/welding/image/auto";
const SERVER_BASE = "http://localhost:8000";

// 폴링 주기(밀리초). 5000 = 5초
const POLL_MS = 5000;

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
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="font-extrabold text-gray-900 mb-5">{title}</div>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
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
      <div className={`mt-1 text-2xl font-extrabold ${toneClass}`}>{value}</div>
    </div>
  );
}

/* =====================
   Main Component
===================== */

export function WeldingImageDashboard() {
  const [result, setResult] = useState<WeldingAutoResponse | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("--:--:--");

  // ✅ seq는 useRef로 (리렌더/의존성 꼬임 방지)
  const seqRef = useRef(1);

  // ✅ 폴링 중 중복 호출 방지용
  const inFlightRef = useRef(false);

  const latest = history[0];
  const latestDefect =
    result?.status === "DEFECT" ? topDefect(result.defects) : null;

  const total = history.length;
  const bad = history.filter((h) => h.judgement === "불량").length;
  const good = total - bad;
  const rate = total === 0 ? 100 : (good / total) * 100;

  const mainImage = useMemo(() => {
    if (result?.result_image_url) return publicUrl(result.result_image_url);
    if (result?.original_image_url) return publicUrl(result.original_image_url);
    return "";
  }, [result]);

  const fetchAuto = async () => {
    // ✅ 이미 요청 중이면 스킵 (폴링 겹침 방지)
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setLoading(true);

    try {
      const res = await fetch(ENDPOINT_AUTO, { method: "POST" });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`API ${res.status}: ${t || res.statusText}`);
      }

      const json = (await res.json()) as WeldingAutoResponse;

      setResult(json);
      setLastUpdated(nowHHMMSS());
      setError("");

      const top = json.status === "DEFECT" ? topDefect(json.defects) : null;

      const id = `IMG-${pad5(seqRef.current)}`;
      seqRef.current += 1;

      setHistory((prev) => [
        {
          id,
          time: nowHHMMSS(),
          judgement: json.status === "DEFECT" ? "불량" : "양품",
          defectType: top?.class ?? "-",
          confidencePct: top ? confidenceToPct(top.confidence) : 99,
          originalUrl: publicUrl(json.original_image_url),
          resultUrl: publicUrl(json.result_image_url),
          source: json.source,
        },
        ...prev,
      ]);
    } catch (e: any) {
      setError(e?.message || "자동 분석 중 오류 발생");
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  };

  // ✅ 자동 폴링: 의존성 [] 로 고정 (1초 폭주 해결)
  useEffect(() => {
    let mounted = true;

    const tick = async () => {
      if (!mounted) return;
      await fetchAuto();
    };

    // 최초 1회 즉시 실행
    tick();

    // 이후 POLL_MS 간격으로
    const t = window.setInterval(tick, POLL_MS);

    return () => {
      mounted = false;
      window.clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetAll = () => {
    setResult(null);
    setHistory([]);
    seqRef.current = 1;
    setError("");
    setLastUpdated("--:--:--");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <div className="text-3xl font-extrabold text-gray-900">
            용접 이미지 검사
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Last update: <span className="font-mono">{lastUpdated}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Polling: {POLL_MS / 1000}s
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={resetAll}
            className="px-5 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow inline-flex items-center gap-2"
          >
            <RefreshCcw className="w-5 h-5" />
            초기화
          </button>
        </div>
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

      {/* Main (좌 이미지 / 우 결과) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Image */}
        <Card title="이미지 분석">
          <div className="bg-gray-900 rounded-xl p-3">
            {mainImage ? (
              <img src={mainImage} className="w-full h-64 object-contain" />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                이미지 없음
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="text-xs text-gray-500">최근 결과</div>
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

          {result?.status === "DEFECT" && result.defects.length > 0 && (
            <div className="mt-4 border rounded-xl p-3">
              <div className="text-xs text-gray-500 mb-2">검출 목록</div>
              <div className="space-y-1 text-sm">
                {result.defects
                  .slice()
                  .sort((a, b) => b.confidence - a.confidence)
                  .slice(0, 6)
                  .map((d, i) => (
                    <div key={`${d.class}-${i}`} className="flex justify-between">
                      <span>{d.class}</span>
                      <span className="font-mono">
                        {confidenceToPct(d.confidence)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
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
                  <td className="py-2">{h.id}</td>
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
