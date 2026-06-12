// src/lib/apiRecepcionVolvo.js
import { API_BASE, getAuthHeader, http } from "./apiClient";

const ENDPOINT = "/recepcion-volvo/api/recepciones/";

async function leerErrorBlob(response) {
  try {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await response.json();

      if (data?.detail) return data.detail;
      if (data?.message) return data.message;

      return JSON.stringify(data);
    }

    const text = await response.text();
    return text || `Error HTTP ${response.status}`;
  } catch {
    return `Error HTTP ${response.status}`;
  }
}

async function httpBlob(path, { method = "GET", body, headers } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...getAuthHeader(),
      ...(headers || {}),
    },
    body,
  });

  if (!response.ok) {
    throw new Error(await leerErrorBlob(response));
  }

  return response.blob();
}

function buildFormData(payload = {}) {
  const formData = new FormData();

  const camposSimples = [
    "agencia",
    "asesor_servicio",
    "placas",
    "vin",
    "modelo",
    "kilometraje",
    "fecha_hora_recepcion",
    "metodo_contacto_preferido",
    "observaciones",
    "cliente_id",
    "nombre",
    "telefono",
    "correo",
  ];

  camposSimples.forEach((campo) => {
    const value = payload[campo];

    if (value !== undefined && value !== null) {
      formData.append(campo, value);
    }
  });

  formData.append("checklist_json", JSON.stringify(payload.checklist || {}));

  formData.append(
    "evidencias_existentes_json",
    JSON.stringify(payload.evidencias_existentes || []),
  );

  (payload.delete_evidencia_ids || []).forEach((id) => {
    if (id !== undefined && id !== null && id !== "") {
      formData.append("delete_evidencia_ids", id);
    }
  });

  (payload.evidencias_nuevas || []).forEach((item) => {
    if (item?.file) {
      formData.append("evidencias_nuevas", item.file);
    }
  });

  return formData;
}

export const apiRecepcionVolvo = {
  async list(params = {}) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.append(key, String(value));
      }
    });

    const queryString = query.toString();
    const path = queryString ? `${ENDPOINT}?${queryString}` : ENDPOINT;

    const data = await http(path);

    return Array.isArray(data) ? data : data?.results || [];
  },

  async get(id) {
    return http(`${ENDPOINT}${id}/`);
  },

  async create(payload) {
    return http(ENDPOINT, {
      method: "POST",
      body: buildFormData(payload),
    });
  },

  async update(id, payload) {
    return http(`${ENDPOINT}${id}/`, {
      method: "PATCH",
      body: buildFormData(payload),
    });
  },

  async remove(id) {
    return http(`${ENDPOINT}${id}/`, {
      method: "DELETE",
    });
  },

  async terminar(id) {
    return http(`${ENDPOINT}${id}/terminar/`, {
      method: "PATCH",
    });
  },

  async checklistPdf(id) {
    return httpBlob(`${ENDPOINT}${id}/checklist-pdf/`);
  },
};
