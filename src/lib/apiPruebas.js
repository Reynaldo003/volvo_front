// src/lib/apiPruebas.js
import { http, toQuery } from "./apiClient";

export const api = {
  // ------------------ PROSPECTOS MANUALES ------------------
  digitalesListProspectos: (params = {}) =>
    http(`/digitales/api/prospectos/${toQuery(params)}`),

  digitalesGetProspecto: (id) => http(`/digitales/api/prospectos/${id}/`),

  digitalesCreateProspecto: (payload) =>
    http("/digitales/api/prospectos/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  digitalesUpdateProspecto: (id, payload) =>
    http(`/digitales/api/prospectos/${id}/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  digitalesPatchProspecto: (id, payload) =>
    http(`/digitales/api/prospectos/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  digitalesDeleteProspecto: (id) =>
    http(`/digitales/api/prospectos/${id}/`, {
      method: "DELETE",
    }),

  digitalesCampanasMeta: () =>
    Promise.resolve({
      ok: true,
      items: [],
    }),

  digitalesGenerarResumen: () =>
    Promise.resolve({
      ok: false,
      error: "La generación de resumen está desactivada en CRM Volvo.",
    }),

  // ------------------ WHATSAPP DESACTIVADO ------------------
  digitalesChats: () => Promise.resolve([]),

  digitalesMarkRead: () =>
    Promise.resolve({
      ok: true,
    }),

  digitalesContacto: (tel) => http(`/digitales/contacto/${toQuery({ tel })}`),

  digitalesContactoUpdates: () =>
    Promise.resolve({
      ok: true,
      mensajes: [],
    }),

  digitalesPlantillas: () =>
    Promise.resolve({
      ok: true,
      items: [],
      mensaje: "WhatsApp está desactivado temporalmente en CRM Volvo.",
    }),

  digitalesEnviarMensaje: () =>
    Promise.resolve({
      ok: false,
      error: "WhatsApp está desactivado temporalmente en CRM Volvo.",
    }),

  digitalesEnviarPlantilla: () =>
    Promise.resolve({
      ok: false,
      error: "WhatsApp está desactivado temporalmente en CRM Volvo.",
    }),

  digitalesEnviarMedia: () =>
    Promise.resolve({
      ok: false,
      error: "WhatsApp está desactivado temporalmente en CRM Volvo.",
    }),

  digitalesEditarMensaje: () =>
    Promise.resolve({
      ok: false,
      error: "WhatsApp está desactivado temporalmente en CRM Volvo.",
    }),

  digitalesEliminarMensaje: () =>
    Promise.resolve({
      ok: false,
      error: "WhatsApp está desactivado temporalmente en CRM Volvo.",
    }),
};
