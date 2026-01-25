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

type Side = "Left" | "Right";
type Pred01 = 0 | 1;

type MonitorEntry = {
  time: string; // HH:MM:SS
  side: Side;
  prediction: Pred01; // 내부용
  judgement: "PASS" | "FAIL"; // 화면 표시용
};

function nowHHMMSS(): string {
  return new Date().toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function parseCsvToRows(csvText: string): string[] {
  return csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function makeSingleRowCsvBlob(row: string): Blob {
  const content = row.endsWith("\n") ? row : row + "\n";
  return new Blob([content], { type: "text/csv" });
}

export function WindShieldDashboard() {
  const [side, setSide] = useState<Side>("Left");

  // ✅ 모니터링(데모 스트림)
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [systemStatus, setSystemStatus] = useState<"WAITING" | "LOADING_CSV" | "MONITORING">("WAITING");

  // ✅ 데모 CSV rows 저장
  const [demoRowsLeft, setDemoRowsLeft] = useState<string[] | null>(null);
  const [demoRowsRight, setDemoRowsRight] = useState<string[] | null>(null);

  // ✅ 최신 결과
  const [result, setResult] = useState<{
    prediction: Pred01;
    judgement: "PASS" | "FAIL";
    time: string;
  } | null>(null);

  // ✅ 통계
  const [stats, setStats] = useState({
    totalCount: 0,
    failCount: 0,
    passRate: 100.0,
    cycleTime: "0.5s",
  });

  // ✅ 차트/로그 버퍼
  const [buffer, setBuffer] = useState<MonitorEntry[]>([]);
  const [failHistory, setFailHistory] = useState<MonitorEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // =========================
  // ⭐ public/data/ 아래에 두고 URL로 불러와야 함
  // frontend/public/data/2nd_process_left_data.csv
  // frontend/public/data/2nd_process_right_data.csv
  // =========================
  const DEMO_CSV_LEFT_URL = "/data/2nd_process_left_data.csv";
  const DEMO_CSV_RIGHT_URL = "/data/2nd_process_right_data.csv";

  const currentDemoRows = useMemo(() => {
    return side === "Left" ? demoRowsLeft : demoRowsRight;
  }, [side, demoRowsLeft, demoRowsRight]);

  // ✅ 데모 CSV 로딩(한 번)
  useEffect(() => {
    let cancelled = false;

    async function loadDemoCsv() {
      try {
        setSystemStatus("LOADING_CSV");

        const [leftRes, rightRes] = await Promise.all([fetch(DEMO_CSV_LEFT_URL), fetch(DEMO_CSV_RIGHT_URL)]);

        if (!leftRes.ok) throw new Error(`Left demo csv load failed: HTTP ${leftRes.status}`);
        if (!rightRes.ok) throw new Error(`Right demo csv load failed: HTTP ${rightRes.status}`);

        const [leftText, rightText] = await Promise.all([leftRes.text(), rightRes.text()]);

        const leftRows = parseCsvToRows(leftText);
        const rightRows = parseCsvToRows(rightText);

        if (!cancelled) {
          setDemoRowsLeft(leftRows);
          setDemoRowsRight(rightRows);
          setSystemStatus("WAITING");
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setSystemStatus("WAITING");
      }
    }

    loadDemoCsv();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isMonitoring) {
      interval = setInterval(async () => {
        try {
          const rows = currentDemoRows;
          if (!rows || rows.length === 0) return;

          const row = rows[Math.floor(Math.random() * rows.length)];

          // 1행짜리 CSV로 만들어 업로드
          const blob = makeSingleRowCsvBlob(row);
          const file = new File([blob], "stream_row.csv", { type: "text/csv" });

          const form = new FormData();
          form.append("side", side.toLowerCase()); // 백엔드: left/right
          form.append("file", file);

          const res = await fetch("http://localhost:8000/api/v1/smartfactory/windshield", {
            method: "POST",
            body: form,
          });

          if (!res.ok) return;

          const data = await res.json();

          const rawPred = Number(data?.prediction);
          if (!(rawPred === 0 || rawPred === 1)) return;

          const prediction = rawPred as Pred01;

          const rawJudgement = data?.judgement;
          const judgement: "PASS" | "FAIL" =
            rawJudgement === "PASS" || rawJudgement === "FAIL"
              ? rawJudgement
              : prediction === 1
              ? "PASS"
              : "FAIL";

          const t = nowHHMMSS();

          // 최신 결과
          setResult({ prediction, judgement, time: t });

          const entry: MonitorEntry = { time: t, side, prediction, judgement };

          // 통계 업데이트
          setStats((prev) => {
            const total = prev.totalCount + 1;
            const fail = judgement === "FAIL" ? prev.failCount + 1 : prev.failCount;
            const passRate = ((total - fail) / total) * 100;
            return { ...prev, totalCount: total, failCount: fail, passRate: Number(passRate.toFixed(1)) };
          });

          // FAIL 히스토리
          if (judgement === "FAIL") {
            setFailHistory((prev) => [entry, ...prev].slice(0, 30));
          }

          // 버퍼(최근 30개)
          setBuffer((prev) => {
            const next = [...prev, entry];
            if (next.length > 30) next.shift();
            return next;
          });
        } catch {
          // 스트리밍은 조용히 무시
        }
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring, side, currentDemoRows]);

  const handleStartMonitoring = () => {
    if (!currentDemoRows || currentDemoRows.length === 0) {
      alert("아직 로드하지 못했어요. /public/data 경로를 확인해주세요.");
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
  const passFailTrend = useMemo(() => {
    return buffer.map((d) => ({
      시간: d.time,
      상태: d.judgement === "PASS" ? 1 : 0,
    }));
  }, [buffer]);

  const passFailBar = useMemo(() => {
    const pass = stats.totalCount - stats.failCount;
    return [
      { 구분: "PASS", 건수: pass },
      { 구분: "FAIL", 건수: stats.failCount },
    ];
  }, [stats]);

  const alerts = useMemo(() => {
    const lastFail = failHistory[0];
    const list: { id: number; issue: string; severity: "경고" | "주의"; time: string }[] = [];

    if (lastFail) {
      list.push({
        id: 1,
        issue: `${lastFail.side} 공정 FAIL 감지`,
        severity: "경고",
        time: lastFail.time,
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

    if (systemStatus === "LOADING_CSV") {
      list.push({
        id: 3,
        issue: "로딩 중",
        severity: "주의",
        time: nowHHMMSS(),
      });
    }

    return list;
  }, [failHistory, systemStatus]);

  const statusBadge = useMemo(() => {
    if (systemStatus === "WAITING") return "bg-gray-100 text-gray-700";
    if (systemStatus === "LOADING_CSV") return "bg-blue-100 text-blue-700";
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
                <Layers className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">윈드실드 사이드 몰딩 공정</h2>
                <p className="text-gray-600 mt-1">윈드실드 실시간 품질 판정</p>
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

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-end lg:justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">제품 구분</label>
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                {(["Left", "Right"] as Side[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSide(s)}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                      side === s ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <div className="font-semibold text-gray-900">표시 정책</div>
              <div>prediction(0/1) 수신, 화면은 PASS/FAIL만 표시 · 차트/알림은 초 단위</div>
            </div>
          </div>

          {/* KPIs + Latest Result */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2 bg-gray-50 border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-gray-700" />
                  <h3 className="text-base font-bold text-gray-900">최신 판정</h3>
                </div>

                {result ? (
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      result.judgement === "PASS" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {result.judgement === "PASS" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
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
                  <div className="text-xs text-gray-400 mt-2">prediction(0/1)은 내부 처리</div>
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
                      <p className="text-sm font-medium text-gray-600">FAIL History</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${failHistory.length > 0 ? "bg-red-500 animate-pulse" : "bg-gray-300"}`} />
                  </div>
                  <p className="text-3xl font-bold text-red-600 mb-1">{stats.failCount}</p>
                  <p className="text-xs text-red-600 font-medium">상세 리포트 보기</p>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-gray-600">PASS Rate</p>
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-2">{stats.passRate}%</p>
              <p className="text-xs text-green-600 font-medium">누적 PASS 비율</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-medium text-gray-600">Total Inspected</p>
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-2">{stats.totalCount}</p>
              <p className="text-xs text-blue-600 font-medium">누적 판정 수량</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                <h3 className="text-lg font-bold text-gray-900">PASS/FAIL Trend (초 단위)</h3>
              </div>
              <span className="px-3 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-full">PASS=1 / FAIL=0</span>
            </div>

            <div style={{ height: "250px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={passFailTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="시간" stroke="#94a3b8" style={{ fontSize: "12px" }} interval="preserveStartEnd" />
                  <YAxis domain={[0, 1]} ticks={[0, 1]} stroke="#94a3b8" style={{ fontSize: "12px" }} />
                  <Tooltip
                    formatter={(value: any) => (Number(value) === 1 ? "PASS" : "FAIL")}
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
                <h3 className="text-lg font-bold text-gray-900">PASS / FAIL Distribution</h3>
              </div>
              <span className="px-3 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-full">누적 기준</span>
            </div>

            <div style={{ height: "250px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={passFailBar}>
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

        {/* Logs */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 overflow-hidden mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Real-time Process Logs (최근 5개)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {buffer.slice(-5).reverse().map((d, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border ${
                  d.judgement === "PASS" ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-gray-400">{d.time}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      d.judgement === "PASS" ? "bg-green-200 text-green-700" : "bg-red-200 text-red-700"
                    }`}
                  >
                    {d.judgement}
                  </span>
                </div>
                <div className="text-sm font-bold text-gray-900">{d.side} 공정</div>
              </div>
            ))}
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
                    <span className="font-semibold text-gray-900">{side} 공정</span>
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
            <p className="text-xs text-blue-600 font-medium">샘플링 스트림</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-sm font-medium text-gray-600">FAIL Count</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.failCount}</p>
            <p className="text-xs text-red-600 font-medium">누적 FAIL 건수</p>
          </div>
        </div>
      </div>

      {/* FAIL 모달 */}
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
                    <h2 className="text-xl font-bold text-gray-900">FAIL 분석 리포트</h2>
                    <p className="text-sm text-gray-500">최근 FAIL 이력</p>
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
                {failHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <CheckCircle2 className="w-12 h-12 mb-4 opacity-20" />
                    <p>현재 FAIL 이력이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {failHistory.map((item, index) => (
                      <div key={index} className="bg-white rounded-2xl p-5 border border-red-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                            DETECTED AT {item.time} ({item.side})
                          </span>
                        </div>

                        <div className="flex items-start gap-2 bg-red-50 p-4 rounded-xl border border-red-100">
                          <AlertCircle className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-red-900 mb-1">분석(예시)</p>
                            <p className="text-sm text-red-800 leading-tight font-medium">
                              샘플링 스트리밍 중 FAIL 판정 발생 → 공정 조건 점검 및 원인 분석 권고
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
