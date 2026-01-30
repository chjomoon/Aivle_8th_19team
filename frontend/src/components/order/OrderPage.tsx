import { useEffect, useState } from "react";
import { orderApi, OrderDto } from "../../api/order";
import { ClipboardList, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { useProduction } from "../../context/ProductionContext";

function safeId(o: any) {
  return o?.id ?? o?.orderId ?? o?._id;
}

function getField(o: any, keys: string[], fallback = "-") {
  for (const k of keys)
    if (o?.[k] !== undefined && o?.[k] !== null && o?.[k] !== "") return o[k];
  return fallback;
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function dateToISO(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toISOString();
}

/**
 * ✅ 신호등(초록) 느낌: 깜빡 + 발광(글로우)
 * Tailwind animate-* 의존 X. CSS keyframes로 확실하게 동작.
 */
const trafficCss = `
@keyframes greenBlinkGlow {
  0%   { opacity: 0.35; filter: drop-shadow(0 0 0px rgba(34,197,94,0)); }
  35%  { opacity: 1;    filter: drop-shadow(0 0 6px rgba(34,197,94,0.85)) drop-shadow(0 0 14px rgba(34,197,94,0.55)); }
  70%  { opacity: 0.55; filter: drop-shadow(0 0 2px rgba(34,197,94,0.35)); }
  100% { opacity: 0.35; filter: drop-shadow(0 0 0px rgba(34,197,94,0)); }
}
.traffic-green {
  animation: greenBlinkGlow 1.05s ease-in-out infinite;
}
`;

// ✅ "생산중" 옆에 붙는 신호등 초록불
function TrafficGreenLight({ size = 9 }: { size?: number }) {
  const px = `${size}px`;
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: px, height: px }}
      aria-label="running"
      title="생산 중"
    >
      {/* 바깥 은은한 글로우 */}
      <span
        className="absolute rounded-full"
        style={{
          width: `calc(${px} * 2.1)`,
          height: `calc(${px} * 2.1)`,
          background:
            "radial-gradient(circle, rgba(34,197,94,0.35) 0%, rgba(34,197,94,0.10) 45%, rgba(34,197,94,0.0) 70%)",
          pointerEvents: "none",
        }}
      />
      {/* 코어(깜빡 + 글로우) */}
      <span
        className="traffic-green rounded-full"
        style={{
          width: px,
          height: px,
          background: "rgb(34 197 94)", // green-500
        }}
      />
    </span>
  );
}

// ✅ 완료 시: 빛나지 않는 빨간불(고정)
function TrafficRedLight({ size = 9 }: { size?: number }) {
  const px = `${size}px`;
  return (
    <span
      className="inline-flex rounded-full"
      style={{ width: px, height: px, background: "rgb(239 68 68)" }} // red-500
      aria-label="completed"
      title="완료"
    />
  );
}

function getStatusBadge(
  status: string,
  productionStatus?: "waiting" | "running" | "completed"
) {
  // ✅ 공통 배지 스타일: "캡슐 높이"를 강제로 키워서
  // 글자/불빛이 붙어 보이는 문제를 해결
  const base =
    "px-3 py-1 min-h-[26px] text-xs font-medium rounded-full inline-flex items-center leading-none";

  // 생산 상태가 있으면 우선 반영
  if (productionStatus === "running") {
    return (
      <span className={`${base} bg-blue-100 text-blue-700 gap-3`}>
        <TrafficGreenLight size={9} />
        생산중
      </span>
    );
  }

  if (productionStatus === "completed") {
    return (
      <span className={`${base} bg-green-100 text-green-700 gap-3`}>
        <TrafficRedLight size={9} />
        완료
      </span>
    );
  }

  const s = (status || "").toUpperCase();
  if (s.includes("DONE") || s.includes("COMPLETE")) {
    return (
      <span className={`${base} bg-green-100 text-green-700 gap-3`}>
        <TrafficRedLight size={9} />
        완료
      </span>
    );
  }

  if (s.includes("CANCEL")) {
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
        취소
      </span>
    );
  }

  if (s.includes("PROGRESS") || s.includes("PRODUCTION")) {
    return (
      <span className={`${base} bg-blue-100 text-blue-700 gap-3`}>
        <TrafficGreenLight size={9} />
        생산중
      </span>
    );
  }

  return (
    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
      대기
    </span>
  );
}

export function OrderPage() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const { productions } = useProduction();

  // 주문의 생산 상태 확인
  const getProductionStatus = (
    orderId: number
  ): "waiting" | "running" | "completed" | undefined => {
    const production = productions.get(orderId);
    if (!production) return undefined;

    const isRunning = production.stageResults.some((r) => r.status === "running");
    const isCompleted = production.stageResults.every((r) => r.status === "completed");

    if (isRunning) return "running";
    if (isCompleted) return "completed";
    if (production.startedAt) return "running"; // 시작했지만 아직 완료 안됨
    return "waiting";
  };

  // 입력 폼 state
  const [orderDate, setOrderDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [orderQty, setOrderQty] = useState<number>(1);
  const [vehicleModelId, setVehicleModelId] = useState<string>("");

  const refresh = async () => {
    setErr(null);
    setLoading(true);
    try {
      const data = await orderApi.list();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr(e?.message ?? "주문 목록 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    const payload = {
      orderDate: dateToISO(orderDate),
      dueDate: dateToISO(dueDate),
      orderQty: Number(orderQty),
      vehicleModelId: Number(vehicleModelId),
    };

    if (!orderDate || !dueDate) {
      setErr("주문 날짜/납기 일자를 입력하세요.");
      return;
    }
    if (!payload.vehicleModelId || Number.isNaN(payload.vehicleModelId)) {
      setErr("차량 모델 ID는 숫자로 입력하세요.");
      return;
    }
    if (!payload.orderQty || payload.orderQty < 1) {
      setErr("주문 수량은 1 이상이어야 합니다.");
      return;
    }

    try {
      await orderApi.create(payload);
      setOrderDate("");
      setDueDate("");
      setOrderQty(1);
      setVehicleModelId("");
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "주문 생성 실패");
    }
  };

  const cancel = async (id: any) => {
    if (!confirm("이 주문을 취소하시겠습니까?")) return;
    try {
      await orderApi.cancel(id);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "주문 취소 실패");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* ✅ 신호등 깜빡/발광 CSS 주입 */}
      <style>{trafficCss}</style>

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ClipboardList className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">주문 관리</h1>
            <p className="text-sm text-slate-500">
              신규 주문 입력 및 주문 내역 조회
            </p>
          </div>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-slate-50 transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          새로고침
        </button>
      </div>

      {err && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
          {err}
        </div>
      )}

      {/* 주문 입력 폼 */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="px-4 py-3 border-b bg-slate-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-slate-600" />
            <span className="font-semibold text-slate-700">신규 주문 입력</span>
          </div>
        </div>
        <form onSubmit={submit} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                주문 날짜
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                납기 일자
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                주문 수량
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                type="number"
                min={1}
                value={orderQty}
                onChange={(e) => setOrderQty(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                차량 모델 ID
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={vehicleModelId}
                onChange={(e) => setVehicleModelId(e.target.value)}
                placeholder="예) 1"
                required
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" />
              주문 등록
            </button>
          </div>
        </form>
      </div>

      {/* 주문 내역 테이블 */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="px-4 py-3 border-b bg-slate-50 rounded-t-xl">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">주문 내역</span>
            <span className="text-sm text-slate-500">총 {orders.length}건</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  주문번호
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  차량 모델
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  수량
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  주문일
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  납기일
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    불러오는 중...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    주문 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const id = safeId(o);
                  const status = getField(o, ["status", "orderStatus"], "PENDING");
                  const canCancel =
                    !status.toUpperCase().includes("CANCEL") &&
                    !status.toUpperCase().includes("COMPLETE");

                  return (
                    <tr key={String(id)} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-slate-900">#{id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-700">
                          모델 {getField(o, ["vehicleModelId", "modelId"])}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900">
                          {getField(o, ["orderQty", "quantity", "count"])}대
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-sm">
                        {formatDate(getField(o, ["orderDate"], null))}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-sm">
                        {formatDate(getField(o, ["dueDate", "deadline"], null))}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(status, getProductionStatus(Number(id)))}
                      </td>
                      <td className="px-4 py-3">
                        {canCancel && (
                          <button
                            onClick={() => cancel(id)}
                            className="flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            취소
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
