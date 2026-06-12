// src/lib/apiAvaluos.js
function moduloNoDisponible() {
  return Promise.reject(
    new Error(
      "El módulo de avalúos no está disponible en el backend de CRM Volvo.",
    ),
  );
}

export const apiAvaluos = {
  list: moduloNoDisponible,
  get: moduloNoDisponible,
  create: moduloNoDisponible,
  update: moduloNoDisponible,
  patch: moduloNoDisponible,
  remove: moduloNoDisponible,
};
