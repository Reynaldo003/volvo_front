// src/lib/apiPruebas.js
import { http, toQuery } from "./apiClient";

const NUMERO_ASESOR_VOLVO =
  import.meta.env.VITE_VOLVO_WHATSAPP_NUMERO || "522211092815";

function cleanParams(params = {}) {
  const out = {};

  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === "") continue;
    out[key] = value;
  }

  return out;
}

function withNumeroAsesor(params = {}) {
  return cleanParams({
    ...params,
    numero_asesor: params.numero_asesor || NUMERO_ASESOR_VOLVO,
  });
}

function jsonBody(payload = {}) {
  return {
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  };
}

export const api = {
  // ------------------ PROSPECTOS MANUALES ------------------
  digitalesListProspectos: (params = {}) =>
    http(`/digitales/api/prospectos/${toQuery(cleanParams(params))}`),

  digitalesGetProspecto: (id) => http(`/digitales/api/prospectos/${id}/`),

  digitalesCreateProspecto: (payload) =>
    http("/digitales/api/prospectos/", {
      method: "POST",
      ...jsonBody(payload),
    }),

  digitalesUpdateProspecto: (id, payload) =>
    http(`/digitales/api/prospectos/${id}/`, {
      method: "PUT",
      ...jsonBody(payload),
    }),

  digitalesPatchProspecto: (id, payload) =>
    http(`/digitales/api/prospectos/${id}/`, {
      method: "PATCH",
      ...jsonBody(payload),
    }),

  digitalesDeleteProspecto: (id) =>
    http(`/digitales/api/prospectos/${id}/`, {
      method: "DELETE",
    }),

  digitalesCampanasMeta: (params = {}) =>
    http(`/digitales/api/campanas-meta/${toQuery(cleanParams(params))}`),

  digitalesGenerarResumen: () =>
    Promise.resolve({
      ok: false,
      error: "La generación de resumen está desactivada en CRM Volvo.",
    }),

  // ------------------ WHATSAPP ACTIVO ------------------
  digitalesChats: (params = {}) =>
    http(`/digitales/chats/${toQuery(withNumeroAsesor(params))}`),

  digitalesContacto: (tel, options = {}) =>
    http(
      `/digitales/contacto/${toQuery(
        withNumeroAsesor({
          tel,
          limit: options.limit || 80,
          days: options.days || 3,
        }),
      )}`,
    ),

  digitalesContactoUpdates: (tel, after = "", options = {}) =>
    http(
      `/digitales/contacto/updates/${toQuery(
        withNumeroAsesor({
          tel,
          after,
          after_id: options.after_id || "",
          limit: options.limit || 80,
          days: options.days || 3,
        }),
      )}`,
    ),

  digitalesMarkRead: ({ tel, telefono, numero_asesor } = {}) =>
    http("/digitales/chats/mark-read/", {
      method: "POST",
      ...jsonBody(
        withNumeroAsesor({
          tel: tel || telefono,
          numero_asesor,
        }),
      ),
    }),

  digitalesPlantillas: (params = {}) =>
    http(`/digitales/mensajes/plantillas/${toQuery(withNumeroAsesor(params))}`),

  digitalesEnviarMensaje: ({ to, text, numero_asesor } = {}) =>
    http("/digitales/mensajes/enviar/", {
      method: "POST",
      ...jsonBody(
        withNumeroAsesor({
          to,
          text,
          numero_asesor,
        }),
      ),
    }),

  digitalesEnviarPlantilla: ({
    to,
    template_name,
    idioma = "es_MX",
    params,
    components,
    numero_asesor,
  } = {}) =>
    http("/digitales/mensajes/enviar-plantilla/", {
      method: "POST",
      ...jsonBody(
        withNumeroAsesor({
          to,
          template_name,
          idioma,
          params,
          components,
          numero_asesor,
        }),
      ),
    }),

  digitalesEnviarMedia: ({ to, text = "", files = [], numero_asesor } = {}) => {
    const fd = new FormData();

    fd.append("to", to || "");
    fd.append("text", text || "");
    fd.append("numero_asesor", numero_asesor || NUMERO_ASESOR_VOLVO);

    const arr = Array.isArray(files) ? files : files ? [files] : [];

    for (const file of arr) {
      fd.append("files", file);
    }

    return http("/digitales/mensajes/enviar-media/", {
      method: "POST",
      body: fd,
    });
  },

  digitalesEditarMensaje: ({ to, message_id, text, numero_asesor } = {}) =>
    http("/digitales/mensajes/editar/", {
      method: "PATCH",
      ...jsonBody(
        withNumeroAsesor({
          to,
          message_id,
          text,
          numero_asesor,
        }),
      ),
    }),

  digitalesEliminarMensaje: () =>
    Promise.resolve({
      ok: false,
      error:
        "Eliminar mensajes todavía no está implementado en el backend de Volvo.",
    }),
};
