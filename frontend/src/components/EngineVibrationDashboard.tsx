// src/components/EngineVibrationDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Layers,
  Gauge,
  AlertCircle,
  CheckCircle2,
  PlayCircle,
  Pause,
  X,
  Activity,
  AlertTriangle,
  Cpu,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

type Pred01 = 0 | 1;

type MonitorEntry = {
  time: string; // HH:MM:SS
  prediction: Pred01;
  judgement: "NORMAL" | "ABNORMAL";
};

function nowHHMMSS(): string {
  return new Date().toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function makeMiniArffBlob(header: string, row: string): Blob {
  // ARFF는 header + @data + row 가 있어야 파서가 정상 동작함
  // header에는 @data 까지 포함되어 있어야 함
  const content = `${header}\n${row.endsWith("\n") ? row : row + "\n"}`;
  return new Blob([content], { type: "text/plain" });
}

function splitArffHeaderAndRows(arffText: string): { header: string; rows: string[] } {
  // @data 위치 찾기
  const idx = arffText.toLowerCase().indexOf("@data");
  if (idx === -1) throw new Error("ARFF에 @data 섹션이 없습니다.");

  const headerPart = arffText.slice(0, idx + "@data".length);
  const dataPart = arffText.slice(idx + "@data".length);

  const rows = dataPart
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("%")); // 주석 제거

  return { header: headerPart.trim(), rows };
}

export function EngineVibrationDashboard() {
  // =========================
  // public/data/ 아래에 두기
  // =========================
  const DEMO_ARFF_URL = "/data/FordA_TEST.arff";
  const ENGINE_API_URL = "http://localhost:8000/api/v1/smartfactory/engine";

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [systemStatus, setSystemStatus] = useState<"WAITING" | "LOADING_ARFF" | "MONITORING">("WAITING");

  const [arffHeader, setArffHeader] = useState<string | null>(null);
  const [arffRows, setArffRows] = useState<string[] | null>(null);

  const [result, setResult] = useState<{
    prediction: Pred01;
    judgement: "NORMAL" | "ABNORMAL";
    time: string;
  } | null>(null);

  const [stats, setStats] = useState({
    totalCount: 0,
    abnormalCount: 0,
    normalRate: 100.0,
    cycleTime: "1.0s",
  });

  const [buffer, setBuffer] = useState<MonitorEntry[]>([]);
  const [abnormalHistory, setAbnormalHistory] = useState<MonitorEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ ARFF 로딩(한 번)
  useEffect(() => {
    let cancelled = false;

    async function loadArff() {
      try {
        setSystemStatus("LOADING_ARFF");

        const res = await fetch(DEMO_ARFF_URL);
        if (!res.ok) throw new Error(`ARFF load failed: HTTP ${res.status}`);

        const text = await res.text();
        const { header, rows } = splitArffHeaderAndRows(text);

        if (!cancelled) {
          setArffHeader(header);
          setArffRows(rows);
          setSystemStatus("WAITING");
          console.log("[ENGINE] ARFF loaded:", { headerLen: header.length, rows: rows.length });
        }
      } catch (e) {
        console.error("[ENGINE] ARFF load error:", e);
        if (!cancelled) setSystemStatus("WAITING");
      }
    }

    loadArff();
    return () => {
      cancelled = true;
    };
  }, []);

  // ✅ 모니터링: 랜덤 row 뽑아서 “미니 ARFF” 업로드
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isMonitoring) {
      interval = setInterval(async () => {
        try {
          if (!arffHeader || !arffRows || arffRows.length === 0) return;

          // 랜덤 샘플 1줄 선택
          const row = arffRows[Math.floor(Math.random() * arffRows.length)];

          // 미니 ARFF 만들기
          const blob = makeMiniArffBlob(arffHeader, row);
          const file = new File([blob], "stream_row.arff", { type: "text/plain" });

          const form = new FormData();
          form.append("file", file);

          const res = await fetch(ENGINE_API_URL, { method: "POST", body: form });

          // ✅ 원인 분석용: 실패 시 본문 로그
          if (!res.ok) {
            const txt = await res.text().catch(() => "");
            console.error("[ENGINE] API FAIL:", res.status, txt);
            return;
          }

          const data = await res.json();

          const rawPred = Number(data?.prediction);
          if (!(rawPred === 0 || rawPred === 1)) {
            console.error("[ENGINE] invalid prediction:", data?.prediction);
            return;
          }

          const prediction = rawPred as Pred01;

          const rawJudgement = data?.judgement;
          const judgement: "NORMAL" | "ABNORMAL" =
            rawJudgement === "NORMAL" || rawJudgement === "ABNORMAL"
              ? rawJudgement
              : prediction === 1
              ? "NORMAL"
              : "ABNORMAL";

          const t = nowHHMMSS();
          setResult({ prediction, judgement, time: t });

          const entry: MonitorEntry = { time: t, prediction, judgement };

          setStats((prev) => {
            const total = prev.totalCount + 1;
            const abnormal = judgement === "ABNORMAL" ? prev.abnormalCount + 1 : prev.abnormalCount;
            const normalRate = ((total - abnormal) / total) * 100;
            return { ...prev, totalCount: total, abnormalCount: abnormal, normalRate: Number(normalRate.toFixed(1)) };
          });

          if (judgement === "ABNORMAL") setAbnormalHistory((prev) => [entry, ...prev].slice(0, 30));

          setBuffer((prev) => {
            const next = [...prev, entry];
            if (next.length > 30) next.shift();
            return next;
          });
        } catch (e) {
          console.error("[ENGINE] monitor loop error:", e);
        }
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring, arffHeader, arffRows]);

  const handleStartMonitoring = () => {
    if (!arffHeader || !arffRows || arffRows.length === 0) {
      alert("ARFF 로딩이 아직 안됐어요. /public/data 경로를 확인해주세요.");
      return;
    }
    setIsMonitoring(true);
    setSystemStatus("MONITORING");
  };

  const handleStopMonitoring = () => {
    setIsMonitoring(false);
    setSystemStatus("WAITING");
  };

  // Charts
  const trend = useMemo(() => {
    return buffer.map((d) => ({
      시간: d.time,
      상태: d.judgement === "NORMAL" ? 1 : 0,
    }));
  }, [buffer]);

  const distBar = useMemo(() => {
    const normal = stats.totalCount - stats.abnormalCount;
    return [
      { 구분: "NORMAL", 건수: normal },
      { 구분: "ABNORMAL", 건수: stats.abnormalCount },
    ];
  }, [stats]);

  const alerts = useMemo(() => {
    const last = abnormalHistory[0];
    const list: { id: number; issue: string; severity: "경고" | "주의"; time: string }[] = [];

    if (last) {
      list.push({
        id: 1,
        issue: `ABNORMAL 감지`,
        severity: "경고",
        time: last.time,
      });
    }

    if (systemStatus === "MONITORING") {
      list.push({
        id: 2,
        issue: "스트리밍 예측 중",
        severity: "주의",
        time: nowHHMMSS(),
      });
    }

    if (systemStatus === "LOADING_ARFF") {
      list.push({
        id: 3,
        issue: "ARFF 로딩 중",
        severity: "주의",
        time: nowHHMMSS(),
      });
    }

    return list;
  }, [abnormalHistory, systemStatus]);

  const statusBadge = useMemo(() => {
    if (systemStatus === "WAITING") return "bg-gray-100 text-gray-700";
    if (systemStatus === "LOADING_ARFF") return "bg-blue-100 text-blue-700";
    return "bg-purple-100 text-purple-700";
  }, [systemStatus]);

  return (
    <>
      <div className="p-8 bg-gradient-to-br from-gray-50 to-indigo-50 min-h-screen">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center">
                <Layers className="w-7 h-7 text-black" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">엔진 진동 분석 </h2>
                <p className="text-gray-600 mt-1">엔진 진동 실시간 데이터 분석</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 text-sm">
              <span className={`px-3 py-1 rounded-full font-semibold ${statusBadge}`}>{systemStatus}</span>
              <span className="text-gray-500">Time: {nowHHMMSS()}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={isMonitoring ? handleStopMonitoring : handleStartMonitoring}
              style={{ backgroundColor: isMonitoring ? "#dc2626" : "#111827" }}
              className={`px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl flex items-center gap-2 outline-none focus:ring-4 ${
                isMonitoring ? "hover:bg-red-700 focus:ring-red-200" : "hover:bg-gray-800 focus:ring-gray-200"
              }`}
            >
              {isMonitoring ? <Pause className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
              {isMonitoring ? "STOP MONITORING" : "START MONITORING"}
            </button>
          </div>
        </div>

        {/* KPIs + Latest Result */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 mb-8">
          <div className="mt-2 grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2 bg-gray-50 border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-gray-700" />
                  <h3 className="text-base font-bold text-gray-900">최신 판정</h3>
                </div>

                {result ? (
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      result.judgement === "NORMAL" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {result.judgement === "NORMAL" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    {result.judgement}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">모니터링을 시작하세요</span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-600">판정</div>
                  <div className="text-3xl font-bold text-gray-900 mt-1">{result ? result.judgement : "-"}</div>
                  <div className="text-xs text-gray-400 mt-2">prediction(0/1) 내부 처리</div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-600">시각</div>
                  <div className="text-xl font-bold text-gray-900 mt-1">{result ? result.time : "-"}</div>
                  <div className="text-xs text-gray-400 mt-2">HH:MM:SS</div>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-white text-left rounded-xl shadow-sm p-4 border-2 border-transparent hover:border-red-400 hover:shadow-md transition-all cursor-pointer outline-none"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <p className="text-sm font-medium text-gray-600">ABNORMAL History</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${abnormalHistory.length > 0 ? "bg-red-500 animate-pulse" : "bg-gray-300"}`} />
                  </div>
                  <p className="text-3xl font-bold text-red-600 mb-1">{stats.abnormalCount}</p>
                  <p className="text-xs text-red-600 font-medium">상세 리포트 보기</p>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-gray-600">NORMAL Rate</p>
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-2">{stats.normalRate}%</p>
              <p className="text-xs text-green-600 font-medium">누적 NORMAL 비율</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-medium text-gray-600">Total Predicted</p>
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-2">{stats.totalCount}</p>
              <p className="text-xs text-blue-600 font-medium">누적 예측 횟수</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                <h3 className="text-lg font-bold text-gray-900">NORMAL/ABNORMAL Trend (초 단위)</h3>
              </div>
              <span className="px-3 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-full">NORMAL=1 / ABNORMAL=0</span>
            </div>

            <div style={{ height: "250px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="시간" stroke="#94a3b8" style={{ fontSize: "12px" }} interval="preserveStartEnd" />
                  <YAxis domain={[0, 1]} ticks={[0, 1]} stroke="#94a3b8" style={{ fontSize: "12px" }} />
                  <Tooltip
                    formatter={(value: any) => (Number(value) === 1 ? "NORMAL" : "ABNORMAL")}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #f1f5f9",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend />
                  <Line type="stepAfter" dataKey="상태" stroke="#4f46e5" strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <h3 className="text-lg font-bold text-gray-900">NORMAL / ABNORMAL Distribution</h3>
              </div>
              <span className="px-3 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-full">누적 기준</span>
            </div>

            <div style={{ height: "250px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distBar}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="구분" stroke="#94a3b8" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #f1f5f9",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="건수" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">실시간 알림 및 이슈 (초 단위)</h3>
          <div className="space-y-3">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className={`w-2 h-2 mt-2 rounded-full ${a.severity === "경고" ? "bg-red-500" : "bg-yellow-500"}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900">엔진 진동</span>
                    <span className="text-sm text-gray-500">{a.time}</span>
                  </div>
                  <p className="text-sm text-gray-700">{a.issue}</p>
                  <span
                    className={`inline-flex mt-2 px-2 py-1 rounded-full text-xs ${
                      a.severity === "경고" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {a.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-5 h-5 text-purple-600" />
              <p className="text-sm font-medium text-gray-600">Cycle Time</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.cycleTime}</p>
            <p className="text-xs text-purple-600 font-medium">스트리밍 주기</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-medium text-gray-600">Monitoring</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{isMonitoring ? "ON" : "OFF"}</p>
            <p className="text-xs text-blue-600 font-medium">랜덤 샘플 스트림</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-sm font-medium text-gray-600">ABNORMAL Count</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.abnormalCount}</p>
            <p className="text-xs text-red-600 font-medium">누적 ABNORMAL 건수</p>
          </div>
        </div>
      </div>

      {/* ABNORMAL 모달 */}
      {isModalOpen &&
        createPortal(
          <div className="fixed top-0 left-0 w-full h-full z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
            <div
              className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
              style={{ maxHeight: "85vh" }}
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-red-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-xl text-red-600">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">ABNORMAL 분석 리포트</h2>
                    <p className="text-sm text-gray-500">최근 ABNORMAL 이력</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 outline-none"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                {abnormalHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <CheckCircle2 className="w-12 h-12 mb-4 opacity-20" />
                    <p>현재 ABNORMAL 이력이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {abnormalHistory.map((item, index) => (
                      <div key={index} className="bg-white rounded-2xl p-5 border border-red-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                            DETECTED AT {item.time}
                          </span>
                        </div>

                        <div className="flex items-start gap-2 bg-red-50 p-4 rounded-xl border border-red-100">
                          <AlertCircle className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-red-900 mb-1">분석(예시)</p>
                            <p className="text-sm text-red-800 leading-tight font-medium">
                              랜덤 샘플 스트리밍 중 ABNORMAL 판정 발생 → 설비 진동 원인 분석 및 점검 권고
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 bg-white flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-10 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg active:scale-95"
                >
                  확인
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
