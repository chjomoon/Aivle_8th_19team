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
  RefreshCw,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Factory,
  Upload,
  Image as ImageIcon,
} from "lucide-react";

interface DefectData {
  predicted_class: string;
  confidence: number;
  all_scores: Record<string, number>;
  image_base64?: string;
  mode?: string;
  note?: string;
  model_input_shape?: number[];
  sim_image_shape?: number[];
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

// ✅ 서버가 매번 같은 값 주는 경우에도 “움직이는 것처럼” 보이게 할지 (원하면 true)
const DEMO_RANDOM_ON_SAME_VALUE = false;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function PressMachineDashboard() {
  // Image Upload State
  const [uploadedImage, setUploadedImage] = useState<DefectData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Vibration Monitoring State
  const [vibration, setVibration] = useState<VibrationData | null>(null);
  const [vibrationHistory, setVibrationHistory] = useState<
    { time: string; value: number }[]
  >([]);
  const [sensorHistory, setSensorHistory] = useState<
    { time: string; sensor_0: number; sensor_1: number; sensor_2: number }[]
  >([]);

  // ✅ 마지막 업데이트 시간 표시
  const [lastUpdated, setLastUpdated] = useState<string>("--:--:--");

  // ✅ 이전 값(서버가 고정값 줄 때 감지용)
  const prevRef = useRef<{ err?: number; s0?: number; s1?: number; s2?: number }>({});

  const defectDistribution = useMemo(
    () =>
      DEFECT_TYPES.map((type) => ({
        name: type,
        value: Math.floor(Math.random() * 50) + 10,
      })),
    []
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

  // ---------------------------
  // Image Upload / Sim Predict
  // ---------------------------
  const handleImagePredict = async (file?: File) => {
    setIsUploading(true);

    try {
      const url = `${API_BASE}/api/v1/smartfactory/press/image`;

      let response: Response;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        response = await fetch(url, { method: "POST", body: formData });
      } else {
        response = await fetch(url, { method: "POST" });
      }

      if (!response.ok) {
        const t = await response.text().catch(() => "");
        throw new Error(`API ${response.status}: ${t || response.statusText}`);
      }

      const data = (await response.json()) as DefectData;
      setUploadedImage(data);
    } catch (error) {
      console.error("Failed to upload/predict image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Drag and Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImagePredict(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImagePredict(e.target.files[0]);
    }
  };

  // ---------------------------
  // Vibration Monitoring
  // ---------------------------
  useEffect(() => {
    let mounted = true;

    const fetchVibrationData = async () => {
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

        const now = new Date();
        const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(
          2,
          "0"
        )}:${String(now.getSeconds()).padStart(2, "0")}`;

        if (!mounted) return;

        // --- sensor values 파싱 ---
        const sv = data.sensor_values || {};
        let s0 =
          typeof (sv as any).sensor_0 === "number" ? (sv as any).sensor_0 : 0;
        let s1 =
          typeof (sv as any).sensor_1 === "number" ? (sv as any).sensor_1 : 0;
        let s2 =
          typeof (sv as any).sensor_2 === "number" ? (sv as any).sensor_2 : 0;

        let err =
          typeof data.reconstruction_error === "number" ? data.reconstruction_error : 0;

        // ✅ 서버가 매번 같은 값 주면(시뮬 고정) 차트가 “멈춘 것처럼” 보여서,
        // 원하면 약간 흔들림 추가 (데모용)
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

        // state 업데이트
        setVibration(data);
        setLastUpdated(timeStr);

        setVibrationHistory((prev) =>
          [...prev, { time: timeStr, value: err }].slice(-30) // ✅ 20 -> 30개로
        );

        setSensorHistory((prev) =>
          [...prev, { time: timeStr, sensor_0: s0, sensor_1: s1, sensor_2: s2 }].slice(
            -30
          )
        );
      } catch (error) {
        console.error("Failed to fetch vibration data:", error);
        // ✅ 실패해도 UI가 “죽은 것처럼” 보이지 않게 lastUpdated는 유지
      }
    };

    fetchVibrationData();
    const interval = setInterval(fetchVibrationData, 1000); // ✅ 2초 → 1초
    return () => {
      mounted = false;
      clearInterval(interval);
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
                프레스 공정 실시간 모니터링 시스템
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
              Last update: <span className="font-mono">{lastUpdated}</span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Image */}
          <div className="col-span-12 lg:col-span-6 space-y-6">
            <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
              <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2 text-black">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  이미지 결함 검출 (CNN)
                </h3>
                <span className="text-xs px-2 py-1 rounded-lg bg-white border border-black/10 text-black">
                  Upload / Sim
                </span>
              </div>

              {/* Dropzone */}
              <div className="px-6 pb-6">
                <div
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-7 text-center transition-all",
                    dragActive
                      ? "border-blue-600 bg-blue-50"
                      : "border-black/20 bg-white hover:border-black/30"
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="w-10 h-10 mx-auto mb-3 text-black" />
                  <p className="text-black font-medium">
                    이미지를 드래그하거나 클릭하여 업로드
                  </p>
                  <p className="text-black text-sm mt-1">(jpg/png 등 이미지 파일)</p>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-upload"
                  />
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-colors"
                    >
                      파일 선택
                    </label>

                    <button
                      onClick={() => handleImagePredict(undefined)}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-black/5 border border-black/15 text-black transition-colors"
                    >
                      시뮬로 테스트
                    </button>
                  </div>
                </div>

                {isUploading && (
                  <div className="mt-5 text-center text-black">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-black" />
                    분석 중...
                  </div>
                )}

                {uploadedImage && !isUploading && (
                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl overflow-hidden border border-black/10 bg-white">
                      <div className="aspect-video">
                        {uploadedImage.image_base64 ? (
                          <img
                            src={`data:image/jpeg;base64,${uploadedImage.image_base64}`}
                            alt="Uploaded"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-black text-sm">
                            (시뮬 입력: 이미지 미표시)
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-black/10 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-black">예측 결과</p>
                          <p className="text-xl font-bold text-black mt-1">
                            {uploadedImage.predicted_class}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-black">Confidence</p>
                          <p
                            className={cn(
                              "text-xl font-bold mt-1",
                              uploadedImage.confidence >= 0.8
                                ? "text-emerald-700"
                                : "text-amber-700"
                            )}
                          >
                            {(uploadedImage.confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-black/10 bg-white p-4">
                      <h4 className="text-sm font-semibold text-black mb-3">
                        전체 결함 확률
                      </h4>

                      <div className="space-y-2">
                        {Object.entries(uploadedImage.all_scores || {}).map(
                          ([className, score]) => (
                            <div
                              key={className}
                              className="flex items-center justify-between gap-3"
                            >
                              <span className="text-xs text-black w-40 truncate">
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
                      </div>
                    </div>
                  </div>
                )}
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

                {/* ✅ 차트 2개: domain auto로 -> 변화가 보이게 */}
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
                        <YAxis
                          stroke="rgba(0,0,0,0.9)"
                          domain={["auto", "auto"]} // ✅ 고정 제거
                        />
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
                        <Line type="monotone" dataKey="sensor_0" stroke="#2563eb" strokeWidth={2} dot={false} name="Sensor 0" isAnimationActive={false} />
                        <Line type="monotone" dataKey="sensor_1" stroke="#059669" strokeWidth={2} dot={false} name="Sensor 1" isAnimationActive={false} />
                        <Line type="monotone" dataKey="sensor_2" stroke="#d97706" strokeWidth={2} dot={false} name="Sensor 2" isAnimationActive={false} />
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
                        <YAxis
                          stroke="rgba(0,0,0,0.9)"
                          domain={["auto", "auto"]} // ✅ 고정 제거
                        />
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
                        <Line type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={2} dot={false} isAnimationActive={false} />
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
                <h3 className="font-semibold text-black">결함 유형 분포</h3>
                <span className="text-xs text-black">(현재는 샘플 랜덤 데이터)</span>
              </div>

              <div className="px-6 pb-6">
                <div
                  className="rounded-2xl border border-black/10 bg-white p-3"
                  style={{ height: 320 }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={defectDistribution}
                      layout="horizontal"
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
                      <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* end grid */}
      </div>
    </div>
  );
}

export default PressMachineDashboard;
