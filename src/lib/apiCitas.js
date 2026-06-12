// src/lib/apiCitas.js
import { http } from "./apiClient";

export const apiCitas = {
  list: () => http("/citas/api/citas/"),

  get: (id) => http(`/citas/api/citas/${id}/`),

  create: (payload) =>
    http("/citas/api/citas/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id, payload) =>
    http(`/citas/api/citas/${id}/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  patch: (id, payload) =>
    http(`/citas/api/citas/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  remove: (id) =>
    http(`/citas/api/citas/${id}/`, {
      method: "DELETE",
    }),
};
