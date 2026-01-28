import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type OrderStatus = "IN_PROGRESS" | "DONE";
export type ProductionStatus = "BEFORE_START" | "IN_PROGRESS" | "DONE";
export type ProcessStatus = "IN_PROGRESS" | "DONE";

export type OrderItem = {
  id: string; // 내부 ID
  orderDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  quantity: number;
  modelId: string;

  orderStatus: OrderStatus;
  productionStatus: ProductionStatus;
  processStatus: ProcessStatus;

  createdAt: number;
};

type Ctx = {
  items: OrderItem[];

  addOrder: (payload: {
    orderDate: string;
    dueDate: string;
    quantity: number;
    modelId: string;
  }) => void;

  markOrderDone: (id: string) => void;

  startProduction: (id: string) => void;
  completeProduction: (id: string) => void;

  completeProcess: (id: string) => void;

  deleteItem: (id: string) => void;
  resetAll: () => void;
};

const STORAGE_KEY = "order_flow_items_v1";

const OrderFlowContext = createContext<Ctx | null>(null);

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function OrderFlowProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<OrderItem[]>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as OrderItem[];
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const api: Ctx = useMemo(
    () => ({
      items,

      addOrder: ({ orderDate, dueDate, quantity, modelId }) => {
        const q = Number(quantity);
        if (!orderDate || !dueDate || !modelId || !Number.isFinite(q) || q <= 0) return;

        const item: OrderItem = {
          id: uid(),
          orderDate,
          dueDate,
          quantity: q,
          modelId,
          orderStatus: "IN_PROGRESS",
          productionStatus: "BEFORE_START",
          processStatus: "IN_PROGRESS",
          createdAt: Date.now(),
        };

        setItems((prev) => [item, ...prev]);
      },

      markOrderDone: (id) => {
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, orderStatus: "DONE" } : it))
        );
      },

      startProduction: (id) => {
        setItems((prev) =>
          prev.map((it) => {
            if (it.id !== id) return it;
            // 생산 시작 시: 생산중 / 공정중 유지
            return { ...it, productionStatus: "IN_PROGRESS", processStatus: "IN_PROGRESS" };
          })
        );
      },

      completeProduction: (id) => {
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, productionStatus: "DONE" } : it))
        );
      },

      completeProcess: (id) => {
        setItems((prev) =>
          prev.map((it) => {
            if (it.id !== id) return it;
            // 공정 완료는 생산 완료된 건만 가능 (안전장치)
            if (it.productionStatus !== "DONE") return it;
            return { ...it, processStatus: "DONE" };
          })
        );
      },

      deleteItem: (id) => {
        setItems((prev) => prev.filter((it) => it.id !== id));
      },

      resetAll: () => setItems([]),
    }),
    [items]
  );

  return <OrderFlowContext.Provider value={api}>{children}</OrderFlowContext.Provider>;
}

export function useOrderFlow() {
  const ctx = useContext(OrderFlowContext);
  if (!ctx) throw new Error("useOrderFlow must be used within OrderFlowProvider");
  return ctx;
}
