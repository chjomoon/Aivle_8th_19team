import { useEffect, useMemo, useState } from "react";
import { orderApi, OrderDto } from "@/api/order";

function safeId(o: any) {
  return o?.id ?? o?.orderId ?? o?._id;
}
function safeStatus(o: any) {
  return (o?.status ?? o?.orderStatus ?? "").toString().toUpperCase();
}
function isDone(o: any) {
  const s = safeStatus(o);
  return s.includes("DONE") || s.includes("COMPLETE") || s.includes("COMPLETED");
}
function getField(o: any, keys: string[], fallback = "-") {
  for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null && o?.[k] !== "") return o[k];
  return fallback;
}

// input[type="date"] 값을 ISO로 변환 (YYYY-MM-DD -> YYYY-MM-DDT00:00:00.000Z)
function dateToISO(dateStr: string) {
  // dateStr: "2026-01-28"
  // UTC 00:00로 저장(표준)
  return new Date(`${dateStr}T00:00:00`).toISOString();
}

export function OrderPage() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // ✅ 입력 폼 state
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

  const inProgress = useMemo(() => orders.filter((o) => !isDone(o)), [orders]);
  const done = useMemo(() => orders.filter((o) => isDone(o)), [orders]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    // ✅ Swagger 스펙에 맞춘 payload
    const payload = {
      orderDate: dateToISO(orderDate),
      dueDate: dateToISO(dueDate),
      orderQty: Number(orderQty),
      vehicleModelId: Number(vehicleModelId),
    };

    // 간단 유효성
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

  const complete = async (id: any) => {
    try {
      await orderApi.complete(id);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "주문 완료 처리 실패");
    }
  };

  const cancel = async (id: any) => {
    try {
      await orderApi.cancel(id);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "주문 취소 실패");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">주문</h1>
      </div>

      {err && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
          {err}
        </div>
      )}

      {/* 위: 주문 입력 */}
      <div className="bg-white rounded-xl border p-4">
        <div className="text-sm font-semibold">주문 입력</div>

        <form onSubmit={submit} className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <div className="text-xs text-slate-600 mb-1">주문 날짜</div>
            <input
              className="w-full border rounded-lg px-3 py-2"
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="text-xs text-slate-600 mb-1">납기 일자</div>
            <input
              className="w-full border rounded-lg px-3 py-2"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="text-xs text-slate-600 mb-1">주문 갯수</div>
            <input
              className="w-full border rounded-lg px-3 py-2"
              type="number"
              min={1}
              value={orderQty}
              onChange={(e) => setOrderQty(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <div className="text-xs text-slate-600 mb-1">차량 모델 ID</div>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={vehicleModelId}
              onChange={(e) => setVehicleModelId(e.target.value)}
              placeholder="예) 1"
              required
            />
          </div>

          <div className="md:col-span-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={refresh}
              className="px-4 py-2 rounded-lg border hover:bg-slate-50"
            >
              새로고침
            </button>
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">
              주문 추가
            </button>
          </div>
        </form>
      </div>

      {/* 중간: 주문중 */}
      <div className="bg-white rounded-xl border p-4">
        <div className="text-sm font-semibold">주문중 ({inProgress.length})</div>
        <div className="mt-3">
          {loading ? (
            <div className="text-sm text-slate-500">불러오는 중...</div>
          ) : inProgress.length === 0 ? (
            <div className="text-sm text-slate-500">주문중 항목이 없습니다.</div>
          ) : (
            inProgress.map((o) => {
              const id = safeId(o);
              return (
                <div
                  key={String(id)}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border mb-2"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900">
                      모델: {getField(o, ["vehicleModelId", "modelId"])} ·{" "}
                      {getField(o, ["orderQty", "quantity", "count"], "-")}대
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      주문일: {getField(o, ["orderDate"])} · 납기:{" "}
                      {getField(o, ["dueDate", "deadline"])} · 상태:{" "}
                      {getField(o, ["status", "orderStatus"], "IN_PROGRESS")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => complete(id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800"
                    >
                      주문완료
                    </button>
                    <button
                      onClick={() => cancel(id)}
                      className="px-3 py-1.5 rounded-lg border text-sm hover:bg-slate-50"
                    >
                      취소
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 하단: 주문완료 */}
      <div className="bg-white rounded-xl border p-4">
        <div className="text-sm font-semibold">주문완료 ({done.length})</div>
        <div className="mt-3">
          {loading ? (
            <div className="text-sm text-slate-500">불러오는 중...</div>
          ) : done.length === 0 ? (
            <div className="text-sm text-slate-500">주문완료 항목이 없습니다.</div>
          ) : (
            done.map((o) => {
              const id = safeId(o);
              return (
                <div key={String(id)} className="p-3 rounded-lg border mb-2">
                  <div className="font-semibold text-slate-900">
                    모델: {getField(o, ["vehicleModelId", "modelId"])} ·{" "}
                    {getField(o, ["orderQty", "quantity", "count"], "-")}대
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    주문일: {getField(o, ["orderDate"])} · 납기:{" "}
                    {getField(o, ["dueDate", "deadline"])} · 상태:{" "}
                    {getField(o, ["status", "orderStatus"], "DONE")}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
