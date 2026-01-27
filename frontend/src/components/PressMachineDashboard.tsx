import { useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Factory,
  Image as ImageIcon,
  RotateCcw,
} from "lucide-react";

interface DefectData {
  predicted_class: string;
  confidence: number;
  all_scores: Record<string, number>;
  image_base64?: string | null;
  note?: string | null;
  model_input_shape?: number[];
  sim_image_shape?: number[];
  source?: string;
  sequence?: { index_next: number; count: number };
}

interface VibrationData {
  reconstruction_error: number;
  is_anomaly: number;
  threshold: number;
  sensor_values?: Record<string, number>;
  mode?: string;
  note?: string;
  model_input_shape?: number[];
}

const DEFECT_TYPES = [
  "Scratches",
  "Pitted Surface",
  "Rolled-in Scale",
  "Inclusion",
  "Crazing",
  "Patches",
];

const API_BASE = "http://localhost:8000";
const DEMO_RANDOM_ON_SAME_VALUE = false;

// ✅ 폴링 주기
const POLL_IMAGE_MS = 5000; // 이미지 예측 요청 주기
const POLL_VIB_MS = 2000; // 진동 예측 요청 주기

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function nowHHMMSS() {
  const now = new Date();
  return `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}:${String(
    now.getSeconds()
  ).padStart(2, "0")}`;
}

export function PressMachineDashboard() {
  // ✅ Auto Image
  const [autoImage, setAutoImage] = useState<DefectData | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageLastUpdated, setImageLastUpdated] = useState<string>("--:--:--");

  // ✅ 누적 분포
  const [defectAccum, setDefectAccum] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    DEFECT_TYPES.forEach((k) => (init[k] = 0));
    return init;
  });

  // ✅ Vibration
  const [vibration, setVibration] = useState<VibrationData | null>(null);
  const [vibrationHistory, setVibrationHistory] = useState<
    { time: string; value: number }[]
  >([]);
  const [sensorHistory, setSensorHistory] = useState<
    { time: string; sensor_0: number; sensor_1: number; sensor_2: number }[]
  >([]);
  const [lastUpdated, setLastUpdated] = useState<string>("--:--:--");

  // ✅ 중복 요청 방지용
  const imageInFlightRef = useRef(false);
  const vibInFlightRef = useRef(false);

  const prevRef = useRef<{ err?: number; s0?: number; s1?: number; s2?: number }>(
    {}
  );

  const statusBadge = useMemo(() => {
    const isAnomaly = !!vibration?.is_anomaly;
    return {
      label: isAnomaly ? "ANOMALY" : "NORMAL",
      wrap: isAnomaly ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100",
      dot: isAnomaly ? "bg-red-500 animate-pulse" : "bg-green-500",
      icon: isAnomaly ? (
        <AlertTriangle className="w-5 h-5 text-red-600" />
      ) : (
        <CheckCircle2 className="w-5 h-5 text-green-600" />
      ),
    };
  }, [vibration?.is_anomaly]);

  const defectDistribution = useMemo(() => {
    return DEFECT_TYPES.map((type) => ({
      name: type,
      value: Number(defectAccum[type] ?? 0),
    }));
  }, [defectAccum]);

  const resetDefectDistribution = () => {
    setDefectAccum(() => {
      const init: Record<string, number> = {};
      DEFECT_TYPES.forEach((k) => (init[k] = 0));
      return init;
    });
  };

  // ---------------------------
  // ✅ Auto Image Predict (폴링)
  // ---------------------------
  const fetchPressImage = async () => {
    if (imageInFlightRef.current) return;
    imageInFlightRef.current = true;

    setIsImageLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/smartfactory/press/image`, {
        method: "POST",
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`API ${res.status}: ${t || res.statusText}`);
      }

      const data = (await res.json()) as DefectData;
      setAutoImage(data);

      // ✅ 분포 누적
      setDefectAccum((prev) => {
        const next = { ...prev };
        for (const k of DEFECT_TYPES) {
          const add =
            typeof data.all_scores?.[k] === "number" ? data.all_scores[k] : 0;
          next[k] = (next[k] ?? 0) + add;
        }
        return next;
      });

      setImageLastUpdated(nowHHMMSS());
    } catch (e) {
      console.error("Failed to fetch press image:", e);
    } finally {
      setIsImageLoading(false);
      imageInFlightRef.current = false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const tick = async () => {
      if (!mounted) return;
      await fetchPressImage();
    };

    tick();
    const t = window.setInterval(tick, POLL_IMAGE_MS);

    return () => {
      mounted = false;
      window.clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------
  // ✅ Vibration Monitoring (폴링)
  // ---------------------------
  useEffect(() => {
    let mounted = true;

    const fetchVibrationData = async () => {
      if (vibInFlightRef.current) return;
      vibInFlightRef.current = true;

      try {
        const response = await fetch(`${API_BASE}/api/v1/smartfactory/press/vibration`, {
          method: "POST",
        });

        if (!response.ok) {
          const t = await response.text().catch(() => "");
          throw new Error(`API ${response.status}: ${t || response.statusText}`);
        }

        const data = (await response.json()) as VibrationData;

        const timeStr = nowHHMMSS();
        if (!mounted) return;

        const sv = data.sensor_values || {};
        let s0 = typeof (sv as any).sensor_0 === "number" ? (sv as any).sensor_0 : 0;
        let s1 = typeof (sv as any).sensor_1 === "number" ? (sv as any).sensor_1 : 0;
        let s2 = typeof (sv as any).sensor_2 === "number" ? (sv as any).sensor_2 : 0;

        let err =
          typeof data.reconstruction_error === "number" ? data.reconstruction_error : 0;

        if (DEMO_RANDOM_ON_SAME_VALUE) {
          const prev = prevRef.current;
          const same = prev.err === err && prev.s0 === s0 && prev.s1 === s1 && prev.s2 === s2;
          if (same) {
            const jitter = () => (Math.random() - 0.5) * 0.02;
            err = err + jitter();
            s0 = s0 + jitter();
            s1 = s1 + jitter();
            s2 = s2 + jitter();
          }
          prevRef.current = { err, s0, s1, s2 };
        }

        setVibration(data);
        setLastUpdated(timeStr);

        setVibrationHistory((prev) => [...prev, { time: timeStr, value: err }].slice(-30));
        setSensorHistory((prev) =>
          [...prev, { time: timeStr, sensor_0: s0, sensor_1: s1, sensor_2: s2 }].slice(-30)
        );
      } catch (error) {
        console.error("Failed to fetch vibration data:", error);
      } finally {
        vibInFlightRef.current = false;
      }
    };

    fetchVibrationData();
    const interval = window.setInterval(fetchVibrationData, POLL_VIB_MS);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  // ---------------------------
  // ✅ KPI (배터리/차체 스타일 톤)
  // ---------------------------
  const kpi = useMemo(() => {
    const pred = autoImage?.predicted_class ?? "-";
    const conf = typeof autoImage?.confidence === "number" ? autoImage.confidence : null;
    const err = vibration?.reconstruction_error ?? null;
    const th = vibration?.threshold ?? null;

    return {
      predicted: pred,
      confidencePct: conf === null ? "-" : `${(conf * 100).toFixed(1)}%`,
      vibStatus: vibration ? (vibration.is_anomaly ? "ANOMALY" : "NORMAL") : "WAITING",
      err: err === null ? "-" : err.toFixed(4),
      th: th === null ? "-" : th.toFixed(4),
    };
  }, [autoImage, vibration]);

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header (Battery 스타일) */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Factory className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">프레스 공정 모니터링</h2>
              <p className="text-gray-600 mt-1">이미지 결함 검출(CNN) + 진동 이상 감지(LSTM)</p>
              <p className="text-xs text-gray-500 mt-1">
                Polling: image {POLL_IMAGE_MS / 1000}s · vibration {POLL_VIB_MS / 1000}s
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <div className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 shadow-sm">
            Vibration update: <span className="font-mono">{lastUpdated}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 shadow-sm">
            Image update: <span className="font-mono">{imageLastUpdated}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards (Battery 스타일) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-gray-600">Latest Class</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{kpi.predicted}</p>
          <p className="text-xs text-blue-600 font-medium">최근 이미지 예측 결과</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-gray-600">Confidence</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{kpi.confidencePct}</p>
          <p className="text-xs text-green-600 font-medium">모델 확신도(표시용)</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-sm font-medium text-gray-600">Vibration Status</p>
            </div>
            <div className={cn("w-2 h-2 rounded-full", statusBadge.dot)} />
          </div>
          <p className={cn("text-3xl font-bold mb-2", vibration?.is_anomaly ? "text-red-600" : "text-gray-900")}>
            {kpi.vibStatus}
          </p>
          <p className="text-xs text-red-600 font-medium">실시간 진동 상태</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-purple-600" />
            <p className="text-sm font-medium text-gray-600">Reconstruction Error</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{kpi.err}</p>
          <p className="text-xs text-purple-600 font-medium">threshold: {kpi.th}</p>
        </div>
      </div>

      {/* Main Grid (구성 동일) */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Image + Result */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <h3 className="text-lg font-bold text-gray-900">이미지 결함 검출 (CNN)</h3>
              </div>
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-gray-900 text-white">
                Auto
              </span>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image */}
                <div className="bg-white rounded-2xl border border-gray-200 p-3">
                  <div className="text-[11px] text-gray-500 mb-2 flex items-center justify-between">
                    <span>입력 이미지</span>
                    <span className="font-mono">{isImageLoading ? "loading..." : imageLastUpdated}</span>
                  </div>

                  <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                    <div className="aspect-[16/9] w-full bg-black">
                      {autoImage?.image_base64 ? (
                        <img
                          src={`data:image/jpeg;base64,${autoImage.image_base64}`}
                          alt="Auto"
                          className="w-full h-full object-contain object-center"
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-white/70 text-sm px-4 text-center">
                          이미지 없음
                        </div>
                      )}
                    </div>
                  </div>

                  {autoImage?.note ? (
                    <div className="mt-2 text-xs text-gray-500">{autoImage.note}</div>
                  ) : null}
                </div>

                {/* Result */}
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-gray-500">예측 결과</p>
                        <p className="text-2xl font-extrabold text-gray-900 mt-1">
                          {autoImage?.predicted_class ?? "-"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-500">Confidence</p>
                        <p
                          className={cn(
                            "text-2xl font-extrabold mt-1",
                            (autoImage?.confidence ?? 0) >= 0.8 ? "text-green-700" : "text-amber-700"
                          )}
                        >
                          {typeof autoImage?.confidence === "number"
                            ? `${(autoImage.confidence * 100).toFixed(1)}%`
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-gray-900">전체 결함 확률</h4>
                      <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-gray-900 text-white">
                        scores
                      </span>
                    </div>

                    <div className="space-y-2">
                      {Object.entries(autoImage?.all_scores || {}).map(([className, score]) => (
                        <div key={className} className="flex items-center justify-between gap-3">
                          <span className="text-xs text-gray-700 w-32 truncate">{className}</span>

                          <div className="flex items-center gap-3 flex-1">
                            <div className="h-2 rounded-full bg-gray-200 overflow-hidden flex-1">
                              <div
                                className="h-full bg-blue-600"
                                style={{ width: `${(score || 0) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono text-gray-800 w-14 text-right">
                              {((score || 0) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}

                      {!autoImage && (
                        <div className="text-sm text-gray-500">데이터 수신 대기 중...</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Vibration */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <h3 className="text-lg font-bold text-gray-900">진동 이상 감지 (LSTM)</h3>
              </div>
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-gray-900 text-white">
                Live
              </span>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className={cn("rounded-2xl border p-5", statusBadge.wrap)}>
                  <div className="flex items-center gap-2">
                    {statusBadge.icon}
                    <span className="font-bold text-gray-900">{statusBadge.label}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">상태</p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <p className="text-xs text-gray-600">Reconstruction Error</p>
                  <p className="text-2xl font-mono font-bold text-gray-900 mt-2">
                    {typeof vibration?.reconstruction_error === "number"
                      ? vibration.reconstruction_error.toFixed(4)
                      : "0.0000"}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    threshold:{" "}
                    <span className="font-mono text-gray-900">
                      {typeof vibration?.threshold === "number"
                        ? vibration.threshold.toFixed(4)
                        : "0.0000"}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gray-900">센서 데이터 추이 (3개 센서)</h4>
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-gray-900 text-white">
                    last 30
                  </span>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-3" style={{ height: 230 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sensorHistory}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="time" hide />
                      <YAxis stroke="#94a3b8" domain={["auto", "auto"]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #f1f5f9",
                          borderRadius: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        }}
                        labelStyle={{ color: "#111827" }}
                      />
                      <Legend wrapperStyle={{ color: "#111827" }} />
                      <Line type="monotone" dataKey="sensor_0" stroke="#2563eb" strokeWidth={3} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="sensor_1" stroke="#10b981" strokeWidth={3} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="sensor_2" stroke="#f59e0b" strokeWidth={3} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gray-900">Reconstruction Error 추이</h4>
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-gray-900 text-white">
                    last 30
                  </span>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-3" style={{ height: 190 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={vibrationHistory}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="time" hide />
                      <YAxis stroke="#94a3b8" domain={["auto", "auto"]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #f1f5f9",
                          borderRadius: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        }}
                        labelStyle={{ color: "#111827" }}
                      />
                      <Legend wrapperStyle={{ color: "#111827" }} />
                      <Line type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={3} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Distribution */}
        <div className="col-span-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">결함 유형 분포</h3>
                <p className="text-xs text-gray-500 mt-1">
                  이미지 예측 결과의 확률(all_scores)을 누적
                </p>
              </div>

              <button
                onClick={resetDefectDistribution}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 transition-colors text-sm font-bold shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                누적 초기화
              </button>
            </div>

            <div className="p-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-3" style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={defectDistribution} margin={{ left: 20, right: 20, top: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 12, fill: "#111827" }}
                      axisLine={{ stroke: "#e5e7eb" }}
                      tickLine={{ stroke: "#e5e7eb" }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      type="number"
                      tick={{ fill: "#111827" }}
                      axisLine={{ stroke: "#e5e7eb" }}
                      tickLine={{ stroke: "#e5e7eb" }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.06)" }}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #f1f5f9",
                        borderRadius: "12px",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        color: "#111827",
                      }}
                      labelStyle={{ color: "#111827" }}
                    />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                * 누적 값이 커질수록 막대가 커집니다. 필요 시 “누적 초기화”로 리셋하세요.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PressMachineDashboard;
