import { api } from "./client";

export type ProductionDto = Record<string, any>;

export const productionApi = {
  list: () => api.get<ProductionDto[]>("/api/v1/production"),
  create: (payload: any) => api.post<ProductionDto>("/api/v1/production", payload),
  start: (id: string | number) => api.patch(`/api/v1/production/${id}/start`),
  stop: (id: string | number) => api.patch(`/api/v1/production/${id}/stop`),
  restart: (id: string | number) => api.patch(`/api/v1/production/${id}/restart`),
  complete: (id: string | number) => api.patch(`/api/v1/production/${id}/complete`),
  cancel: (id: string | number) => api.patch(`/api/v1/production/${id}/cancel`),
  patch: (id: string | number, payload: any) => api.patch(`/api/v1/production/${id}`, payload),
};
