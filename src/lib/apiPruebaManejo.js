// src/lib/apiPruebaManejo.js
import { http } from "./apiClient";

export const apiPruebaManejo = {
  list: () => http("/citas/api/pruebas-manejo/"),

  get: (id) => http(`/citas/api/pruebas-manejo/${id}/`),

  create: (payload) =>
    http("/citas/api/pruebas-manejo/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id, payload) =>
    http(`/citas/api/pruebas-manejo/${id}/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  patch: (id, payload) =>
    http(`/citas/api/pruebas-manejo/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  remove: (id) =>
    http(`/citas/api/pruebas-manejo/${id}/`, {
      method: "DELETE",
    }),
};

export const apiEvidenciasPruebaManejo = {
  list: () => http("/citas/api/evidencias-pruebas/"),

  get: (id) => http(`/citas/api/evidencias-pruebas/${id}/`),

  remove: (id) =>
    http(`/citas/api/evidencias-pruebas/${id}/`, {
      method: "DELETE",
    }),

  create: ({ id_prueba_manejo, archivo }) => {
    const formData = new FormData();

    formData.append("prueba_manejo", String(id_prueba_manejo));
    formData.append("archivo", archivo);

    return http("/citas/api/evidencias-pruebas/", {
      method: "POST",
      body: formData,
    });
  },
};
