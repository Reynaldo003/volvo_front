// src/lib/apiClient.js
export const API_BASE = "https://crmvolvo.grupoautomotrizryr.com";

const TOKEN_KEY = "crm_volvo_token";
const USER_KEY = "crm_volvo_usuario";

export function getAuthToken() {
  try {
    const tokenVolvo = localStorage.getItem(TOKEN_KEY);

    if (tokenVolvo && tokenVolvo !== "undefined" && tokenVolvo !== "null") {
      return tokenVolvo;
    }

    const authAccess = localStorage.getItem("auth.access");

    if (authAccess && authAccess !== "undefined" && authAccess !== "null") {
      return authAccess;
    }

    const rawAuth = localStorage.getItem("auth");

    if (rawAuth) {
      const parsed = JSON.parse(rawAuth);
      const token = parsed?.token || parsed?.access;

      if (token && token !== "undefined" && token !== "null") {
        return token;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function getStoredUser() {
  try {
    const rawVolvo = localStorage.getItem(USER_KEY);

    if (rawVolvo) {
      return JSON.parse(rawVolvo);
    }

    const rawAuth = localStorage.getItem("auth");

    if (rawAuth) {
      const parsed = JSON.parse(rawAuth);
      return parsed?.user || null;
    }

    return null;
  } catch {
    return null;
  }
}

export function setAuthSession({ token, usuario }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));

  // Compatibilidad con APIs viejos del front que leen auth.access o auth.
  localStorage.setItem("auth.access", token);
  localStorage.setItem(
    "auth",
    JSON.stringify({
      token,
      access: token,
      user: usuario,
    }),
  );

  // Limpieza de llaves anteriores.
  localStorage.removeItem("crm_chevrolet_token");
  localStorage.removeItem("crm_chevrolet_usuario");
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  localStorage.removeItem("auth.access");
  localStorage.removeItem("auth");

  localStorage.removeItem("crm_chevrolet_token");
  localStorage.removeItem("crm_chevrolet_usuario");
}

export function getAuthHeader() {
  const token = getAuthToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function isFormData(value) {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }

  const text = await response.text().catch(() => "");
  return text ? { detail: text } : null;
}

function obtenerPrimerError(data) {
  if (!data || typeof data !== "object") {
    return null;
  }

  if (data.detail) {
    return data.detail;
  }

  if (data.message) {
    return data.message;
  }

  if (
    Array.isArray(data.non_field_errors) &&
    data.non_field_errors.length > 0
  ) {
    return data.non_field_errors[0];
  }

  const primeraClave = Object.keys(data)[0];

  if (!primeraClave) {
    return null;
  }

  const valor = data[primeraClave];

  if (Array.isArray(valor)) {
    return `${primeraClave}: ${valor.join(" ")}`;
  }

  if (typeof valor === "string") {
    return `${primeraClave}: ${valor}`;
  }

  if (valor && typeof valor === "object") {
    return `${primeraClave}: ${JSON.stringify(valor)}`;
  }

  return null;
}

export async function http(path, { method = "GET", body, headers } = {}) {
  const finalHeaders = {
    Accept: "application/json",
    ...getAuthHeader(),
    ...(headers || {}),
  };

  if (body && !isFormData(body) && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (isFormData(body)) {
    delete finalHeaders["Content-Type"];
    delete finalHeaders["content-type"];
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body,
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    const mensaje = obtenerPrimerError(data) || `Error HTTP ${response.status}`;

    throw new Error(mensaje);
  }

  return data;
}

export function toQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    query.append(key, String(value));
  });

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}
