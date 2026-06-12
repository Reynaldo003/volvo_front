// src/lib/apiCitasPiso.js
import { http } from "./apiClient";

export const apiCitasPiso = {
  list: () => http("/citas/api/registro-piso/"),

  get: (id) => http(`/citas/api/registro-piso/${id}/`),

  create: (payload) =>
    http("/citas/api/registro-piso/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id, payload) =>
    http(`/citas/api/registro-piso/${id}/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  patch: (id, payload) =>
    http(`/citas/api/registro-piso/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  remove: (id) =>
    http(`/citas/api/registro-piso/${id}/`, {
      method: "DELETE",
    }),
};
