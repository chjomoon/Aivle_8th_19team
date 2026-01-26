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
  RefreshCw,
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

// ✅ 폴링 주기(여기만 바꾸면 됨)
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

  // ✅ 중복 요청(겹침) 방지용
  const imageInFlightRef = useRef(false);
  const vibInFlightRef = useRef(false);

  const prevRef = useRef<{ err?: number; s0?: number; s1?: number; s2?: number }>(
    {}
  );

  const statusBadge = useMemo(() => {
    const isAnomaly = !!vibration?.is_anomaly;
    return {
      label: isAnomaly ? "ANOMALY" : "NORMAL",
      wrap: isAnomaly
        ? "bg-red-50 border-red-200 text-black"
        : "bg-emerald-50 border-emerald-200 text-black",
      icon: isAnomaly ? (
        <AlertTriangle className="w-4 h-4 text-red-600" />
      ) : (
        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
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
    // ✅ 폴링 겹침 방지
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

      // ✅ 분포 누적: all_scores 확률을 누적
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

  // ✅ 이미지 자동 폴링 (의존성 [] 고정)
  useEffect(() => {
    let mounted = true;

    const tick = async () => {
      if (!mounted) return;
      await fetchPressImage();
    };

    tick(); // 최초 1회
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
      // ✅ 폴링 겹침 방지
      if (vibInFlightRef.current) return;
      vibInFlightRef.current = true;

      try {
        const response = await fetch(
          `${API_BASE}/api/v1/smartfactory/press/vibration`,
          { method: "POST" }
        );

        if (!response.ok) {
          const t = await response.text().catch(() => "");
          throw new Error(`API ${response.status}: ${t || response.statusText}`);
        }

        const data = (await response.json()) as VibrationData;

        const timeStr = nowHHMMSS();
        if (!mounted) return;

        const sv = data.sensor_values || {};
        let s0 =
          typeof (sv as any).sensor_0 === "number" ? (sv as any).sensor_0 : 0;
        let s1 =
          typeof (sv as any).sensor_1 === "number" ? (sv as any).sensor_1 : 0;
        let s2 =
          typeof (sv as any).sensor_2 === "number" ? (sv as any).sensor_2 : 0;

        let err =
          typeof data.reconstruction_error === "number"
            ? data.reconstruction_error
            : 0;

        if (DEMO_RANDOM_ON_SAME_VALUE) {
          const prev = prevRef.current;
          const same =
            prev.err === err && prev.s0 === s0 && prev.s1 === s1 && prev.s2 === s2;
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

        setVibrationHistory((prev) =>
          [...prev, { time: timeStr, value: err }].slice(-30)
        );

        setSensorHistory((prev) =>
          [...prev, { time: timeStr, sensor_0: s0, sensor_1: s1, sensor_2: s2 }].slice(
            -30
          )
        );
      } catch (error) {
        console.error("Failed to fetch vibration data:", error);
      } finally {
        vibInFlightRef.current = false;
      }
    };

    fetchVibrationData(); // 최초 1회
    const interval = window.setInterval(fetchVibrationData, POLL_VIB_MS);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-black/10 pb-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
              <Factory className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-black">
                AI 결함 검출 대시보드
              </h1>
              <p className="text-black text-sm mt-1">
                프레스 공정 자동 예측(이미지) + 실시간 모니터링(진동)
              </p>
              <p className="text-xs text-black/60 mt-1">
                Polling: image {POLL_IMAGE_MS / 1000}s · vibration {POLL_VIB_MS / 1000}s
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2 text-black">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  vibration?.is_anomaly ? "bg-red-500 animate-pulse" : "bg-emerald-500"
                )}
              />
              <span className="text-black">
                진동 센서: {vibration ? "정상 수신 중" : "연결 대기"}
              </span>
            </div>

            <div className="px-3 py-2 rounded-xl bg-white border border-black/15 text-black">
              Vibration update: <span className="font-mono">{lastUpdated}</span>
            </div>

            <div className="px-3 py-2 rounded-xl bg-white border border-black/15 text-black">
              Image update: <span className="font-mono">{imageLastUpdated}</span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* ✅ Image + Result */}
          <div className="col-span-12 lg:col-span-6 space-y-6">
            <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
              <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2 text-black">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  이미지 결함 검출 (CNN)
                </h3>
              </div>

              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Image */}
                  <div>
                    <div className="rounded-2xl overflow-hidden border border-black/10 bg-white">
                      <div className="bg-black/90 p-3 rounded-2xl">
                        {autoImage?.image_base64 ? (
                          <img
                            src={`data:image/jpeg;base64,${autoImage.image_base64}`}
                            alt="Auto"
                            className="w-full h-64 object-contain rounded-xl bg-black"
                          />
                        ) : (
                          <div className="h-64 flex items-center justify-center text-white/70 text-sm px-4 text-center">
                            이미지 없음
                          </div>
                        )}
                      </div>
                    </div>

                    
                    {autoImage?.note ? (
                      <div className="mt-1 text-xs text-black/50">{autoImage.note}</div>
                    ) : null}
                  </div>

                  {/* Right: Result */}
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-black/10 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-black/70">예측 결과</p>
                          <p className="text-2xl font-extrabold text-black mt-1">
                            {autoImage?.predicted_class ?? "-"}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-black/70">Confidence</p>
                          <p
                            className={cn(
                              "text-2xl font-extrabold mt-1",
                              (autoImage?.confidence ?? 0) >= 0.8
                                ? "text-emerald-700"
                                : "text-amber-700"
                            )}
                          >
                            {typeof autoImage?.confidence === "number"
                              ? `${(autoImage.confidence * 100).toFixed(1)}%`
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-black/10 bg-white p-4">
                      <h4 className="text-sm font-semibold text-black mb-3">
                        전체 결함 확률
                      </h4>

                      <div className="space-y-2">
                        {Object.entries(autoImage?.all_scores || {}).map(
                          ([className, score]) => (
                            <div
                              key={className}
                              className="flex items-center justify-between gap-3"
                            >
                              <span className="text-xs text-black w-32 truncate">
                                {className}
                              </span>

                              <div className="flex items-center gap-3 flex-1">
                                <div className="h-2 rounded-full bg-black/10 overflow-hidden flex-1">
                                  <div
                                    className="h-full bg-blue-600"
                                    style={{ width: `${(score || 0) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs font-mono text-black w-14 text-right">
                                  {((score || 0) * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          )
                        )}

                        {!autoImage && (
                          <div className="text-sm text-black/60">
                            데이터 수신 대기 중...
                          </div>
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
            <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
              <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2 text-black">
                  <Activity className="w-4 h-4 text-purple-700" />
                  진동 이상 감지 (LSTM)
                </h3>
                <span className="text-xs px-2 py-1 rounded-lg bg-white border border-black/10 text-black">
                  Live
                </span>
              </div>

              <div className="px-6 pb-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className={cn("rounded-2xl border p-4", statusBadge.wrap)}>
                    <div className="flex items-center gap-2">
                      {statusBadge.icon}
                      <span className="font-bold text-black">{statusBadge.label}</span>
                    </div>
                    <p className="text-xs text-black mt-2">상태</p>
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-white p-4">
                    <p className="text-xs text-black">Reconstruction Error</p>
                    <p className="text-2xl font-mono font-bold text-black mt-2">
                      {typeof vibration?.reconstruction_error === "number"
                        ? vibration.reconstruction_error.toFixed(4)
                        : "0.0000"}
                    </p>
                    <p className="text-xs text-black mt-2">
                      threshold:{" "}
                      <span className="font-mono text-black">
                        {typeof vibration?.threshold === "number"
                          ? vibration.threshold.toFixed(4)
                          : "0.0000"}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-black mb-3">
                    센서 데이터 추이 (3개 센서)
                  </h4>
                  <div
                    className="rounded-2xl border border-black/10 bg-white p-3"
                    style={{ height: 220 }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sensorHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.12)" />
                        <XAxis dataKey="time" hide />
                        <YAxis stroke="rgba(0,0,0,0.9)" domain={["auto", "auto"]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid rgba(0,0,0,0.2)",
                            color: "#000",
                            borderRadius: 12,
                          }}
                          labelStyle={{ color: "#000" }}
                        />
                        <Legend wrapperStyle={{ color: "#000" }} />
                        <Line
                          type="monotone"
                          dataKey="sensor_0"
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={false}
                          name="Sensor 0"
                          isAnimationActive={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="sensor_1"
                          stroke="#059669"
                          strokeWidth={2}
                          dot={false}
                          name="Sensor 1"
                          isAnimationActive={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="sensor_2"
                          stroke="#d97706"
                          strokeWidth={2}
                          dot={false}
                          name="Sensor 2"
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-black mb-3">
                    Reconstruction Error 추이
                  </h4>
                  <div
                    className="rounded-2xl border border-black/10 bg-white p-3"
                    style={{ height: 170 }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vibrationHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.12)" />
                        <XAxis dataKey="time" hide />
                        <YAxis stroke="rgba(0,0,0,0.9)" domain={["auto", "auto"]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid rgba(0,0,0,0.2)",
                            color: "#000",
                            borderRadius: 12,
                          }}
                          labelStyle={{ color: "#000" }}
                        />
                        <Legend wrapperStyle={{ color: "#000" }} />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#7c3aed"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Distribution */}
          <div className="col-span-12">
            <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
              <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-black">결함 유형 분포</h3>
                  <span className="text-xs text-black/70">
                    (이미지 예측 결과의 확률(all_scores)을 누적)
                  </span>
                </div>

                <button
                  onClick={resetDefectDistribution}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-black/5 border border-black/15 text-black transition-colors text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  누적 초기화
                </button>
              </div>

              <div className="px-6 pb-6">
                <div
                  className="rounded-2xl border border-black/10 bg-white p-3"
                  style={{ height: 320 }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={defectDistribution}
                      margin={{ left: 20, right: 20, top: 10, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.12)" />
                      <XAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 12, fill: "#000" }}
                        axisLine={{ stroke: "rgba(0,0,0,0.3)" }}
                        tickLine={{ stroke: "rgba(0,0,0,0.3)" }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        type="number"
                        tick={{ fill: "#000" }}
                        axisLine={{ stroke: "rgba(0,0,0,0.3)" }}
                        tickLine={{ stroke: "rgba(0,0,0,0.3)" }}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(0,0,0,0.06)" }}
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid rgba(0,0,0,0.2)",
                          color: "#000",
                          borderRadius: 12,
                        }}
                        labelStyle={{ color: "#000" }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PressMachineDashboard;
