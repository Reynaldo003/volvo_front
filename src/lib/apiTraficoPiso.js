// src/lib/apiTraficoPiso.js
import { http, toQuery } from "./apiClient";

const BASE = "/trafico-piso/api/trafico-piso";

export const apiTraficoPiso = {
  list: (params = {}) => http(`${BASE}/${toQuery(params)}`),

  get: (id) => http(`${BASE}/${id}/`),

  create: (payload) =>
    http(`${BASE}/`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id, payload) =>
    http(`${BASE}/${id}/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  patch: (id, payload) =>
    http(`${BASE}/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  remove: (id) =>
    http(`${BASE}/${id}/`, {
      method: "DELETE",
    }),

  asesoresVentas: (q = "") => http(`${BASE}/asesores-ventas/${toQuery({ q })}`),

  resumen: (params = {}) => http(`${BASE}/resumen/${toQuery(params)}`),
};
