import React, { useMemo, useState } from "react";
import {
  Upload,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Car,
} from "lucide-react";

type PartKey = "door" | "bumper" | "headlamp" | "taillamp" | "radiator";

type Detection = {
  cls: number;
  name: string;
  conf: number;
  bbox: [number, number, number, number]; // [x1,y1,x2,y2]
};

type BodyResult = {
  part: PartKey;
  pass_fail: "PASS" | "FAIL";
  detections: Detection[];
  original_image_url: string;
  result_image_url: string;
  error?: string;
};

type BatchResponse = {
  results: Record<PartKey, BodyResult | null>;
};

const API_BASE = "http://localhost:8000";

const PARTS: { key: PartKey; label: string; hint: string }[] = [
  { key: "door", label: "도어", hint: "도어 이미지 업로드" },
  { key: "bumper", label: "범퍼", hint: "범퍼 이미지 업로드" },
  { key: "headlamp", label: "헤드램프", hint: "헤드램프 이미지 업로드" },
  { key: "taillamp", label: "테일램프", hint: "테일램프 이미지 업로드" },
  { key: "radiator", label: "라디에이터", hint: "라디에이터 이미지 업로드" },
];

function joinUrl(path?: string) {
  if (!path) return "";
  // FastAPI가 /static/... 으로 주면 API_BASE 붙여서 접근
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path}`;
}

function PassFailBadge({ value }: { value: "PASS" | "FAIL" }) {
  const isPass = value === "PASS";
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
        isPass
          ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
          : "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30",
      ].join(" ")}
    >
      {isPass ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      {value}
    </span>
  );
}

export function BodyAssemblyDashboard() {
  const [files, setFiles] = useState<Partial<Record<PartKey, File>>>({});
  const [previews, setPreviews] = useState<Partial<Record<PartKey, string>>>({});
  const [conf, setConf] = useState<number>(0.25);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [results, setResults] = useState<Partial<Record<PartKey, BodyResult | null>>>(
    {}
  );

  const canAnalyze = useMemo(() => {
    return PARTS.some((p) => !!files[p.key]);
  }, [files]);

  const handlePick = (part: PartKey, file?: File) => {
    if (!file) return;

    setFiles((prev) => ({ ...prev, [part]: file }));
    const url = URL.createObjectURL(file);
    setPreviews((prev) => ({ ...prev, [part]: url }));

    // 업로드 이후 이전 결과는 초기화(해당 파트만)
    setResults((prev) => ({ ...prev, [part]: undefined }));
  };

  const resetAll = () => {
    setFiles({});
    setResults({});
    setError(null);

    // preview revoke
    Object.values(previews).forEach((u) => u && URL.revokeObjectURL(u));
    setPreviews({});
  };

  const analyzeBatch = async () => {
    setLoading(true);
    setError(null);

    try {
      const fd = new FormData();
      // FastAPI batch endpoint 인자명과 동일하게 맞춤
      if (files.door) fd.append("door_file", files.door);
      if (files.bumper) fd.append("bumper_file", files.bumper);
      if (files.headlamp) fd.append("headlamp_file", files.headlamp);
      if (files.taillamp) fd.append("taillamp_file", files.taillamp);
      if (files.radiator) fd.append("radiator_file", files.radiator);

      fd.append("conf", String(conf));

      const res = await fetch(`${API_BASE}/api/v1/smartfactory/body/inspect/batch`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      const data: BatchResponse = await res.json();
      setResults(data.results ?? {});
    } catch (e: any) {
      setError(e?.message ?? "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1020] text-black">
      <div className="mx-auto max-w-6xl px-6 py-6">
        {/* Header */}
        <div className="flex flex-col gap-3 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/10">
                <Car size={18} />
              </div>
              <div>
                <div className="text-lg font-semibold">차체 조립 검사</div>
                <div className="text-sm text-white/60">
                  부품별 이미지 업로드 후 배치 분석(PASS/FAIL + 결함 위치)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={resetAll}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium ring-1 ring-white/10 hover:bg-white/15"
              >
                <RefreshCcw size={16} />
                초기화
              </button>

              <button
                disabled={!canAnalyze || loading}
                onClick={analyzeBatch}
                className={[
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold",
                  !canAnalyze || loading
                    ? "bg-white/10 text-white/40 ring-1 ring-white/10 cursor-not-allowed"
                    : "bg-blue-500/20 text-blue-200 ring-1 ring-blue-500/30 hover:bg-blue-500/25",
                ].join(" ")}
              >
                <Upload size={16} />
                {loading ? "분석 중..." : "배치 분석"}
              </button>
            </div>
          </div>

          {/* controls */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
              <span className="text-xs text-white/70">Confidence</span>
              <input
                type="number"
                step={0.01}
                min={0}
                max={1}
                value={conf}
                onChange={(e) => setConf(parseFloat(e.target.value || "0.25"))}
                className="w-20 rounded-lg bg-black/20 px-2 py-1 text-sm ring-1 ring-white/10 outline-none"
              />
              <span className="text-xs text-white/50">(0~1)</span>
            </div>

            {error && (
              <div className="inline-flex items-center gap-2 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-200 ring-1 ring-rose-500/20">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {PARTS.map((p) => {
            const r = results[p.key];
            const hasResult = !!r && (r as BodyResult).pass_fail;
            const previewUrl = previews[p.key];

            return (
              <div
                key={p.key}
                className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold">{p.label}</div>
                    <div className="text-xs text-white/60">{p.hint}</div>
                  </div>

                  {hasResult && r && !r.error && (
                    <PassFailBadge value={r.pass_fail} />
                  )}
                  {r?.error && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-1 text-xs font-semibold text-rose-200 ring-1 ring-rose-500/20">
                      <AlertTriangle size={14} />
                      ERROR
                    </span>
                  )}
                </div>

                {/* uploader */}
                <div className="mt-3 flex flex-col gap-3">
                  <label className="group flex cursor-pointer items-center justify-between rounded-xl bg-black/20 px-3 py-2 ring-1 ring-white/10 hover:bg-black/25">
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <Upload size={16} className="text-white/60 group-hover:text-white/80" />
                      <span>
                        {files[p.key]?.name ?? "파일 선택"}
                      </span>
                    </div>
                    <span className="text-xs text-white/40">JPG/PNG/WEBP</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePick(p.key, e.target.files?.[0])}
                    />
                  </label>

                  {/* images */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-xl bg-black/20 p-2 ring-1 ring-white/10">
                      <div className="mb-2 text-xs text-white/60">업로드 미리보기</div>
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt={`${p.key}-preview`}
                          className="h-48 w-full rounded-lg object-contain"
                        />
                      ) : (
                        <div className="grid h-48 place-items-center rounded-lg border border-dashed border-white/10 text-sm text-white/40">
                          이미지 없음
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl bg-black/20 p-2 ring-1 ring-white/10">
                      <div className="mb-2 text-xs text-white/60">결과 이미지(Annot)</div>
                      {r?.result_image_url ? (
                        <img
                          src={joinUrl(r.result_image_url)}
                          alt={`${p.key}-result`}
                          className="h-48 w-full rounded-lg object-contain"
                        />
                      ) : (
                        <div className="grid h-48 place-items-center rounded-lg border border-dashed border-white/10 text-sm text-white/40">
                          분석 결과 없음
                        </div>
                      )}
                    </div>
                  </div>

                  {/* detections */}
                  <div className="rounded-xl bg-black/20 p-3 ring-1 ring-white/10">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-sm font-semibold">탐지 결과</div>
                      {r?.pass_fail && !r.error && (
                        <div className="text-xs text-white/60">
                          detections: <span className="font-semibold text-white">{r.detections?.length ?? 0}</span>
                        </div>
                      )}
                    </div>

                    {!r ? (
                      <div className="text-sm text-white/50">아직 분석하지 않았습니다.</div>
                    ) : r.error ? (
                      <div className="text-sm text-rose-200">{r.error}</div>
                    ) : (r.detections?.length ?? 0) === 0 ? (
                      <div className="text-sm text-emerald-200">결함 탐지 없음 (PASS)</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="text-xs text-white/60">
                            <tr>
                              <th className="py-2">Class</th>
                              <th className="py-2">Conf</th>
                              <th className="py-2">BBox (x1,y1,x2,y2)</th>
                            </tr>
                          </thead>
                          <tbody className="text-white/85">
                            {r.detections.map((d, idx) => (
                              <tr key={idx} className="border-t border-white/10">
                                <td className="py-2">
                                  <div className="font-semibold">{d.name}</div>
                                  <div className="text-xs text-white/50">#{d.cls}</div>
                                </td>
                                <td className="py-2">{d.conf}</td>
                                <td className="py-2 text-xs text-white/70">
                                  [{d.bbox.join(", ")}]
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* original url (optional) */}
                  {r?.original_image_url && (
                    <div className="text-xs text-white/40">
                      원본 URL: <span className="text-white/60">{joinUrl(r.original_image_url)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="mt-6 text-xs text-white/40">
          * 배치 분석은 업로드된 부품들만 처리합니다. (없는 파일은 null로 반환)
        </div>
      </div>
    </div>
  );
}
