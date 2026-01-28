import { useEffect, useMemo, useState } from "react";
import { productionApi, ProductionDto } from "../../api/production";
import { orderApi, OrderDto } from "../../api/order";
import { orderProductionsApi } from "../../api/orderProductions";

function sid(p: any) {
  return p?.id ?? p?.productionId ?? p?._id;
}
function statusUpper(x: any) {
  return (x?.status ?? x?.productionStatus ?? "").toString().toUpperCase();
}
function isBeforeStart(p: any) {
  const s = statusUpper(p);
  return s.includes("BEFORE") || s.includes("READY") || s === "" || s.includes("CREATED");
}
function isInProgress(p: any) {
  const s = statusUpper(p);
  return s.includes("IN_PROGRESS") || s.includes("RUN") || s.includes("START");
}
function isDone(p: any) {
  const s = statusUpper(p);
  return s.includes("DONE") || s.includes("COMPLETE");
}
function getField(o: any, keys: string[], fallback = "-") {
  for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null && o?.[k] !== "") return o[k];
  return fallback;
}

export function ProductionPage() {
  const [productions, setProductions] = useState<ProductionDto[]>([]);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // 할당(allocate) UI용: “주문ID + 생산ID”
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [selectedProductionId, setSelectedProductionId] = useState<string>("");

  const refresh = async () => {
    setErr(null);
    setLoading(true);
    try {
      const [p, o] = await Promise.all([productionApi.list(), orderApi.list()]);
      setProductions(Array.isArray(p) ? p : []);
      setOrders(Array.isArray(o) ? o : []);
    } catch (e: any) {
      setErr(e?.message ?? "조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const before = useMemo(() => productions.filter(isBeforeStart), [productions]);
  const ing = useMemo(() => productions.filter(isInProgress), [productions]);
  const done = useMemo(() => productions.filter(isDone), [productions]);

  const start = async (id: any) => {
    try {
      await productionApi.start(id);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "생산 시작 실패");
    }
  };
  const stop = async (id: any) => {
    try {
      await productionApi.stop(id);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "생산 정지 실패");
    }
  };
  const complete = async (id: any) => {
    try {
      await productionApi.complete(id);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "생산 완료 실패");
    }
  };

  // ✅ 주문-생산 할당
  const allocate = async () => {
    if (!selectedOrderId || !selectedProductionId) return;
    try {
      // payload는 백엔드 스펙에 맞게 조정
      await orderProductionsApi.allocate({
        orderId: Number(selectedOrderId) || selectedOrderId,
        productionId: Number(selectedProductionId) || selectedProductionId,
      });
      setSelectedOrderId("");
      setSelectedProductionId("");
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "할당 실패");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">생산</h1>
        <p className="text-slate-500 mt-1">/api/v1/production + /api/v1/order-productions 연동</p>
      </div>

      {err && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{err}</div>}

      {/* (옵션) 주문-생산 할당 UI */}
      <div className="bg-white rounded-xl border p-4">
        <div className="text-sm font-semibold">주문 → 생산 할당(allocate)</div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <div className="text-xs text-slate-600 mb-1">주문 선택</div>
            <select className="w-full border rounded-lg px-3 py-2" value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)}>
              <option value="">선택...</option>
              {orders.map((o) => {
                const id = o?.id ?? o?.orderId;
                return (
                  <option key={String(id)} value={String(id)}>
                    #{id} / 모델 {getField(o, ["vehicleModelId", "modelId"])} / {getField(o, ["quantity", "count"])}대
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <div className="text-xs text-slate-600 mb-1">생산 선택</div>
            <select className="w-full border rounded-lg px-3 py-2" value={selectedProductionId} onChange={(e) => setSelectedProductionId(e.target.value)}>
              <option value="">선택...</option>
              {productions.map((p) => {
                const id = sid(p);
                return (
                  <option key={String(id)} value={String(id)}>
                    생산 #{id} / 상태 {getField(p, ["status", "productionStatus"], "-")}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-end justify-end gap-2">
            <button type="button" onClick={refresh} className="px-4 py-2 rounded-lg border hover:bg-slate-50">
              새로고침
            </button>
            <button onClick={allocate} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">
              할당
            </button>
          </div>
        </div>
      </div>

      {/* 생산 시작 전 */}
      <div className="bg-white rounded-xl border p-4">
        <div className="text-sm font-semibold">생산 시작 전 ({before.length})</div>
        <div className="mt-3">
          {loading ? (
            <div className="text-sm text-slate-500">불러오는 중...</div>
          ) : before.length === 0 ? (
            <div className="text-sm text-slate-500">항목 없음</div>
          ) : (
            before.map((p) => {
              const id = sid(p);
              return (
                <div key={String(id)} className="flex items-center justify-between gap-3 p-3 rounded-lg border mb-2">
                  <div className="text-sm">
                    <div className="font-semibold">생산 #{id}</div>
                    <div className="text-xs text-slate-500 mt-1">상태: {getField(p, ["status", "productionStatus"], "-")}</div>
                  </div>
                  <button onClick={() => start(id)} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
                    생산 시작
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 생산중 */}
      <div className="bg-white rounded-xl border p-4">
        <div className="text-sm font-semibold">생산중 ({ing.length})</div>
        <div className="mt-3">
          {loading ? (
            <div className="text-sm text-slate-500">불러오는 중...</div>
          ) : ing.length === 0 ? (
            <div className="text-sm text-slate-500">항목 없음</div>
          ) : (
            ing.map((p) => {
              const id = sid(p);
              return (
                <div key={String(id)} className="flex items-center justify-between gap-3 p-3 rounded-lg border mb-2">
                  <div className="text-sm">
                    <div className="font-semibold">생산 #{id}</div>
                    <div className="text-xs text-slate-500 mt-1">상태: {getField(p, ["status", "productionStatus"], "-")}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => stop(id)} className="px-3 py-1.5 rounded-lg border text-sm hover:bg-slate-50">
                      정지
                    </button>
                    <button onClick={() => complete(id)} className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800">
                      생산 완료
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 생산 완료 */}
      <div className="bg-white rounded-xl border p-4">
        <div className="text-sm font-semibold">생산 완료 ({done.length})</div>
        <div className="mt-3">
          {loading ? (
            <div className="text-sm text-slate-500">불러오는 중...</div>
          ) : done.length === 0 ? (
            <div className="text-sm text-slate-500">항목 없음</div>
          ) : (
            done.map((p) => {
              const id = sid(p);
              return (
                <div key={String(id)} className="p-3 rounded-lg border mb-2">
                  <div className="font-semibold">생산 #{id}</div>
                  <div className="text-xs text-slate-500 mt-1">상태: {getField(p, ["status", "productionStatus"], "DONE")}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
