import { api } from "./client";

export type OrderProductionDto = Record<string, any>;

export const orderProductionsApi = {
  allocate: (payload: any) => api.post("/api/v1/order-productions/allocate", payload),
  list: () => api.get<OrderProductionDto[]>("/api/v1/order-productions"),
  getByProduction: (productionId: string | number) =>
    api.get<OrderProductionDto[]>(`/api/v1/order-productions/production/${productionId}`),
  getByOrder: (orderId: string | number) =>
    api.get<OrderProductionDto[]>(`/api/v1/order-productions/order/${orderId}`),
  remove: (orderProductionId: string | number) =>
    api.del(`/api/v1/order-productions/${orderProductionId}`),
};
