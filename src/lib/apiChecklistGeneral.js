//src/lib/apiChecklistGeneral.js
import { API_BASE, getAuthHeader, http } from "./apiClient";

const ENDPOINT = "/checklist-general/api/checklists/";

async function leerErrorBlob(response) {
  try {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await response.json();

      if (data?.detail) {
        const pendientes = Array.isArray(data?.pendientes)
          ? `\n\nPendientes:\n- ${data.pendientes.join("\n- ")}`
          : "";

        return `${data.detail}${pendientes}`;
      }

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

function appendIfValue(formData, campo, value) {
  if (value !== undefined && value !== null) {
    formData.append(campo, value);
  }
}

function buildFormData(payload = {}) {
  const formData = new FormData();

  const camposSimples = [
    "agencia",
    "asesor_servicio",
    "tecnico_inspector",
    "gerente_servicio",
    "pst",
    "placas",
    "vin",
    "modelo",
    "kilometraje",
    "orden_servicio",
    "fecha_hora_revision",
    "requiere_prueba_manejo",
    "fecha_prueba",
    "hora_prueba",
    "kilometraje_inicial",
    "kilometraje_final",
    "observaciones",
    "cliente_id",
    "nombre",
    "telefono",
    "correo",
  ];

  camposSimples.forEach((campo) =>
    appendIfValue(formData, campo, payload[campo]),
  );

  formData.append("checklist_json", JSON.stringify(payload.checklist || {}));
  formData.append(
    "evidencias_existentes_json",
    JSON.stringify(payload.evidencias_existentes || []),
  );
  formData.append(
    "evidencias_nuevas_descripciones_json",
    JSON.stringify(
      (payload.evidencias_nuevas || []).map((item) => item?.descripcion || ""),
    ),
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

export const apiChecklistGeneral = {
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
