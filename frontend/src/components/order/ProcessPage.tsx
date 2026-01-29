import { useEffect, useMemo, useState } from "react";
import { orderProductionsApi, OrderProductionDto } from "../../api/orderProductions";
import { productionApi, ProductionDto } from "../../api/production";
import { orderApi, OrderDto } from "../../api/order";

function pid(p: any) {
  return p?.id ?? p?.productionId ?? p?._id;
}
function statusUpper(x: any) {
  return (x?.status ?? x?.productionStatus ?? "").toString().toUpperCase();
}
function isProductionDone(p: any) {
  const s = statusUpper(p);
  return s.includes("DONE") || s.includes("COMPLETE");
}
function isProductionInProgress(p: any) {
  const s = statusUpper(p);
  return s.includes("IN_PROGRESS") || s.includes("RUN") || s.includes("START");
}

export function ProcessPage() {
  const [ops, setOps] = useState<OrderProductionDto[]>([]);
  const [productions, setProductions] = useState<ProductionDto[]>([]);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const refresh = async () => {
    setErr(null);
    setLoading(true);
    try {
      const [opList, prodList, orderList] = await Promise.all([
        orderProductionsApi.list(),
        productionApi.list(),
        orderApi.list()
      ]);
      setOps(Array.isArray(opList) ? opList : []);
      setProductions(Array.isArray(prodList) ? prodList : []);
      setOrders(Array.isArray(orderList) ? orderList : []);
    } catch (e: any) {
      setErr(e?.message ?? "공정 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  // 페이지가 다시 보여질 때마다 자동 새로고침
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // productionId -> production
  const prodMap = useMemo(() => {
    const m = new Map<string, ProductionDto>();
    for (const p of productions) m.set(String(pid(p)), p);
    return m;
  }, [productions]);

  // orderId -> order
  const orderMap = useMemo(() => {
    const m = new Map<string, OrderDto>();
    for (const o of orders) {
      const id = o?.id ?? o?.orderId;
      m.set(String(id), o);
    }
    return m;
  }, [orders]);

  const inProgress = useMemo(() => {
    return ops.filter((op) => {
      const prodId = String(op?.productionId ?? op?.production?.id ?? op?.production_id);
      const prod = prodMap.get(prodId);
      return prod ? isProductionInProgress(prod) : true; // prod 못찾으면 일단 공정중으로
    });
  }, [ops, prodMap]);

  const done = useMemo(() => {
    return ops.filter((op) => {
      const prodId = String(op?.productionId ?? op?.production?.id ?? op?.production_id);
      const prod = prodMap.get(prodId);
      return prod ? isProductionDone(prod) : false;
    });
  }, [ops, prodMap]);

  const renderRow = (op: any) => {
    const opId = op?.orderProductionId ?? op?.id ?? op?._id;
    const orderId = op?.orderId ?? op?.order?.id ?? op?.order_id;
    const prodId = op?.productionId ?? op?.production?.id ?? op?.production_id;
    const allocatedQty = op?.allocatedQty ?? 0;
    const prod = prodMap.get(String(prodId));
    const prodStatus = prod ? (prod?.status ?? prod?.productionStatus ?? "-") : "-";
    const order = orderMap.get(String(orderId));
    const vehicleModelId = order ? (order?.vehicleModelId ?? order?.modelId ?? "-") : "-";

    return (
      <div key={String(opId)} className="p-3 rounded-lg border mb-2">
        <div className="font-semibold text-slate-900">
          할당 #{opId} · 주문 #{orderId} → 생산 #{prodId}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          차량모델: {vehicleModelId} · 할당수량: {allocatedQty}대 · 생산상태: {String(prodStatus)}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">공정</h1>
      </div>

      {err && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{err}</div>}

      <div className="flex justify-end">
        <button onClick={refresh} className="px-4 py-2 rounded-lg border hover:bg-slate-50">
          새로고침
        </button>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <div className="text-sm font-semibold">공정 중 ({inProgress.length})</div>
        <div className="mt-3">
          {loading ? (
            <div className="text-sm text-slate-500">불러오는 중...</div>
          ) : inProgress.length === 0 ? (
            <div className="text-sm text-slate-500">항목 없음</div>
          ) : (
            inProgress.map(renderRow)
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <div className="text-sm font-semibold">공정 완료 ({done.length})</div>
        <div className="mt-3">
          {loading ? (
            <div className="text-sm text-slate-500">불러오는 중...</div>
          ) : done.length === 0 ? (
            <div className="text-sm text-slate-500">항목 없음</div>
          ) : (
            done.map(renderRow)
          )}
        </div>
      </div>
    </div>
  );
}
