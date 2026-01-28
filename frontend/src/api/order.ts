import { api } from "./client";

export type OrderDto = Record<string, any>;

export const orderApi = {
  list: () => api.get<OrderDto[]>("/api/v1/order"),
  create: (payload: any) => api.post<OrderDto>("/api/v1/order", payload),
  complete: (id: string | number) => api.patch(`/api/v1/order/${id}/complete`),
  cancel: (id: string | number) => api.patch(`/api/v1/order/${id}/cancel`),
  patch: (id: string | number, payload: any) => api.patch(`/api/v1/order/${id}`, payload),
};
