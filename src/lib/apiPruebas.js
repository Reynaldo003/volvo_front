import { http, toQuery } from "./apiClient";

const NUMERO_ASESOR_VOLVO = "522211092815";

function cleanParams(params = {}) {
  const out = {};

  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === "") continue;
    out[key] = value;
  }

  return out;
}

function normalizaTelefonoMx(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("521") && digits.length === 13) {
    return `52${digits.slice(3)}`;
  }

  if (digits.length === 10) {
    return `52${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("52")) {
    return digits;
  }

  return digits;
}

function getStoredUser() {
  try {
    const candidates = [
      localStorage.getItem("crm_volvo_usuario"),
      localStorage.getItem("auth"),
    ];

    for (const raw of candidates) {
      if (!raw) continue;
      const parsed = JSON.parse(raw);

      if (parsed?.user && typeof parsed.user === "object") return parsed.user;
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {
    // Sin acción.
  }

  return null;
}

function getCrmUsername() {
  const user = getStoredUser();

  return String(
    user?.usuario ||
      user?.username ||
      user?.user ||
      user?.correo ||
      user?.email ||
      "",
  ).trim();
}

function getWhatsAppNumberFromUser() {
  const user = getStoredUser();

  const numero = normalizaTelefonoMx(
    user?.telefono ||
      user?.numero_asesor ||
      user?.whatsapp_number ||
      user?.phone ||
      "",
  );

  return numero || "";
}

function getNumeroAsesor(numeroAsesor = "") {
  return normalizaTelefonoMx(
    numeroAsesor || getWhatsAppNumberFromUser() || NUMERO_ASESOR_VOLVO,
  );
}

function withNumeroAsesor(params = {}) {
  const numero = getNumeroAsesor(params.numero_asesor);
  const usuario = params.usuario || getCrmUsername();

  return cleanParams({
    ...params,
    numero_asesor: numero,
    usuario,
  });
}

function jsonBody(payload = {}) {
  return {
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload || {}),
  };
}

function readTelArg(value = {}) {
  if (typeof value === "string" || typeof value === "number") {
    return { tel: String(value) };
  }

  return value || {};
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

  digitalesCampanasMeta: (days = 180) =>
    http(`/digitales/api/campanas-meta/${toQuery({ days })}`),

  digitalesGenerarResumen: () =>
    Promise.resolve({
      ok: false,
      error: "La generación de resumen está desactivada en CRM Volvo.",
    }),

  // ------------------ WHATSAPP ------------------
  digitalesChats: (params = {}) =>
    http(`/digitales/chats/${toQuery(withNumeroAsesor(params))}`),

  digitalesContacto: (tel, options = {}) =>
    http(
      `/digitales/contacto/${toQuery(
        withNumeroAsesor({
          tel,
          limit: options.limit ?? 50,
          before_id: options.before_id || "",
          mark_read: options.mark_read ?? 1,
          numero_asesor: options.numero_asesor,
          usuario: options.usuario,
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
          limit: options.limit ?? 50,
          mark_read: options.mark_read ?? 0,
          numero_asesor: options.numero_asesor,
          usuario: options.usuario,
        }),
      )}`,
    ),

  digitalesMarkRead: (input = {}) => {
    const { tel, telefono, numero_asesor } = readTelArg(input);

    return http("/digitales/chats/mark-read/", {
      method: "POST",
      ...jsonBody(
        withNumeroAsesor({
          tel: tel || telefono,
          numero_asesor,
        }),
      ),
    });
  },

  digitalesMarkUnread: (input = {}) => {
    const { tel, telefono, numero_asesor } = readTelArg(input);

    return http("/digitales/chats/mark-unread/", {
      method: "POST",
      ...jsonBody(
        withNumeroAsesor({
          tel: tel || telefono,
          numero_asesor,
        }),
      ),
    });
  },

  // Plantillas disponibles para enviar desde el chat.
  digitalesPlantillas: (params = {}) =>
    http(`/digitales/mensajes/plantillas/${toQuery(withNumeroAsesor(params))}`),

  // Panel administrativo de plantillas: lista todos los estados.
  digitalesPlantillasAdmin: (numeroAsesor = "") =>
    http(
      `/digitales/mensajes/plantillas/admin/${toQuery(
        withNumeroAsesor({ numero_asesor: numeroAsesor }),
      )}`,
    ),

  digitalesPlantillaCrear: (numeroAsesor = "", payload = {}) =>
    http(
      `/digitales/mensajes/plantillas/admin/${toQuery(
        withNumeroAsesor({ numero_asesor: numeroAsesor }),
      )}`,
      {
        method: "POST",
        ...jsonBody(
          withNumeroAsesor({
            ...payload,
            numero_asesor: numeroAsesor,
          }),
        ),
      },
    ),

  digitalesPlantillaAnalizar: (numeroAsesor = "", payload = {}) =>
    http(
      `/digitales/mensajes/plantillas/admin/analizar/${toQuery(
        withNumeroAsesor({ numero_asesor: numeroAsesor }),
      )}`,
      {
        method: "POST",
        ...jsonBody(
          withNumeroAsesor({
            ...payload,
            numero_asesor: numeroAsesor,
          }),
        ),
      },
    ),

  digitalesPlantillaEditar: (numeroAsesor = "", templateId, payload = {}) =>
    http(
      `/digitales/mensajes/plantillas/admin/${encodeURIComponent(
        String(templateId || ""),
      )}/${toQuery(withNumeroAsesor({ numero_asesor: numeroAsesor }))}`,
      {
        method: "PATCH",
        ...jsonBody(
          withNumeroAsesor({
            ...payload,
            numero_asesor: numeroAsesor,
          }),
        ),
      },
    ),

  digitalesPlantillaEliminar: (numeroAsesor = "", templateId, name = "") =>
    http(
      `/digitales/mensajes/plantillas/admin/${encodeURIComponent(
        String(templateId || ""),
      )}/${toQuery(
        withNumeroAsesor({
          numero_asesor: numeroAsesor,
          name,
        }),
      )}`,
      {
        method: "DELETE",
      },
    ),

  digitalesEnviarMensaje: ({
    to,
    text,
    reply_to_message_id = "",
    numero_asesor,
  } = {}) =>
    http("/digitales/mensajes/enviar/", {
      method: "POST",
      ...jsonBody(
        withNumeroAsesor({
          to,
          text,
          reply_to_message_id,
          numero_asesor,
        }),
      ),
    }),

  digitalesEnviarPlantilla: ({
    to,
    template_name,
    idioma = "es_MX",
    params = [],
    components,
    values,
    preview_text = "",
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
          values,
          preview_text,
          numero_asesor,
        }),
      ),
    }),

  digitalesEnviarMedia: ({
    to,
    text = "",
    files = [],
    reply_to_message_id = "",
    numero_asesor,
  } = {}) => {
    const fd = new FormData();

    fd.append("to", String(to || "").trim());
    fd.append("text", String(text || ""));
    fd.append("numero_asesor", getNumeroAsesor(numero_asesor));

    const usuario = getCrmUsername();
    if (usuario) fd.append("usuario", usuario);

    if (reply_to_message_id) {
      fd.append("reply_to_message_id", String(reply_to_message_id));
    }

    const arr = Array.isArray(files)
      ? files
      : typeof File !== "undefined" && files instanceof File
        ? [files]
        : Array.from(files || []);

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

  // ------------------ HELPERS HTTP PARA CONFIG IA ------------------
  get: (url) => http(url),
  post: (url, payload = {}) =>
    http(url, { method: "POST", ...jsonBody(payload) }),
  patch: (url, payload = {}) =>
    http(url, { method: "PATCH", ...jsonBody(payload) }),
  delete: (url) => http(url, { method: "DELETE" }),

  // ------------------ INTELIGENCIA ARTIFICIAL ------------------
  iaLineas: () => http("/digitales/ia/lineas/"),

  iaConfigList: () => http("/digitales/ia/config/"),

  iaConfigGet: (numeroAsesor = "") =>
    http(`/digitales/ia/config/${getNumeroAsesor(numeroAsesor)}/`),

  iaConfigPatch: (numeroAsesor = "", payload = {}) =>
    http(`/digitales/ia/config/${getNumeroAsesor(numeroAsesor)}/`, {
      method: "PATCH",
      ...jsonBody(payload),
    }),

  iaConfigPublicar: (numeroAsesor = "") =>
    http(`/digitales/ia/config/${getNumeroAsesor(numeroAsesor)}/publicar/`, {
      method: "POST",
      ...jsonBody({}),
    }),

  iaEstadoConversacion: ({ tel, telefono, numero_asesor } = {}) =>
    http(
      `/digitales/ia/conversacion/estado/${toQuery(
        withNumeroAsesor({ tel: tel || telefono, numero_asesor }),
      )}`,
    ),

  iaPausarConversacion: ({
    tel,
    telefono,
    motivo = "manual_desde_chat",
    numero_asesor,
  } = {}) =>
    http("/digitales/ia/conversacion/pausar/", {
      method: "POST",
      ...jsonBody(
        withNumeroAsesor({ tel: tel || telefono, motivo, numero_asesor }),
      ),
    }),

  iaReactivarConversacion: ({ tel, telefono, numero_asesor } = {}) =>
    http("/digitales/ia/conversacion/reactivar/", {
      method: "POST",
      ...jsonBody(withNumeroAsesor({ tel: tel || telefono, numero_asesor })),
    }),

  digitalesEliminarMensaje: () =>
    Promise.resolve({
      ok: false,
      error:
        "Eliminar mensajes todavía no está implementado en el backend de Volvo.",
    }),
};
