import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Users,
  CalendarCheck,
  BadgeCheck,
  Building2,
  Car,
} from "lucide-react";

import { api } from "../../lib/apiPruebas";
import { apiTraficoPiso } from "../../lib/apiTraficoPiso";
import { apiCitas } from "../../lib/apiCitas";
import { apiPruebaManejo } from "../../lib/apiPruebaManejo";

const MESES = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

const MESES_NUMERO = {
  ENE: 0,
  FEB: 1,
  MAR: 2,
  ABR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AGO: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DIC: 11,
};

function fechaValida(valor) {
  if (!valor) return null;

  const fecha = new Date(valor);

  return Number.isNaN(fecha.getTime())
    ? null
    : fecha;
}

function normalizarTexto(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function tieneValor(valor) {
  return (
    valor !== null &&
    valor !== undefined &&
    String(valor).trim() !== ""
  );
}

function esVerdadero(valor) {
  return (
    valor === true ||
    normalizarTexto(valor) === "true"
  );
}

function normalizarLista(respuesta) {
  if (Array.isArray(respuesta)) {
    return respuesta;
  }

  if (Array.isArray(respuesta?.results)) {
    return respuesta.results;
  }

  return [];
}

function fechaProspecto(registro) {
  return fechaValida(registro?.creado);
}

function fechaPiso(registro) {
  return fechaValida(registro?.creado_en);
}

function fechaCita(registro) {
  return fechaValida(
    registro?.fecha_hora_cita ||
      registro?.creado_en,
  );
}

function fechaPrueba(registro) {
  return fechaValida(
    registro?.fecha_hora_cita ||
      registro?.creado_en,
  );
}

function agruparPorResolver(
  registros,
  resolver,
  fallback = "Sin especificar",
) {
  const mapa = new Map();

  registros.forEach((registro) => {
    const original = String(
      resolver(registro) ?? "",
    ).trim();

    const label = original || fallback;
    const clave = normalizarTexto(label);

    if (!mapa.has(clave)) {
      mapa.set(clave, {
        label,
        value: 0,
      });
    }

    mapa.get(clave).value += 1;
  });

  return [...mapa.values()].sort(
    (a, b) => b.value - a.value,
  );
}

function topNConOtros(items, limite = 6) {
  if (items.length <= limite) {
    return items;
  }

  const principales = items.slice(
    0,
    limite,
  );

  const otros = items
    .slice(limite)
    .reduce(
      (total, item) =>
        total + item.value,
      0,
    );

  return [
    ...principales,
    {
      label: "Otros",
      value: otros,
    },
  ];
}

function RankingCard({
  title,
  subtitle,
  items,
  total,
}) {
  const maximo = Math.max(
    ...items.map((item) => item.value),
    1,
  );

  return (
    <article className="flex min-h-[330px] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-sm font-bold text-[#001E50]">
          {title}
        </h2>

        <p className="mt-0.5 text-xs text-slate-400">
          {subtitle}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
          Sin información para el periodo seleccionado
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {items.map((item) => {
            const porcentaje =
              total > 0
                ? (item.value / total) *
                  100
                : 0;

            const ancho =
              (item.value / maximo) *
              100;

            const sinInformacion =
              normalizarTexto(
                item.label,
              ).startsWith("sin ");

            return (
              <div key={item.label}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                  <span
                    className="truncate font-semibold text-slate-700"
                    title={item.label}
                  >
                    {item.label}
                  </span>

                  <span className="shrink-0 font-bold text-[#001E50]">
                    {item.value}

                    <span className="ml-1 font-normal text-slate-400">
                      (
                      {porcentaje.toFixed(
                        1,
                      )}
                      %)
                    </span>
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      sinInformacion
                        ? "bg-slate-400"
                        : "bg-[#001E50]"
                    }`}
                    style={{
                      width: `${ancho}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

function MatrizDiariaCard({
  prospectos,
  citas,
  piso,
  pruebas,
  diaFin,
}) {
  const dias = Array.from(
    { length: diaFin },
    (_, index) => index + 1,
  );

  const contarDia = (
    lista,
    obtenerFecha,
    dia,
    condicion = () => true,
  ) =>
    lista.filter((registro) => {
      const fecha = obtenerFecha(registro);

      return (
        fecha &&
        fecha.getDate() === dia &&
        condicion(registro)
      );
    }).length;

  const filas = [
    {
      label: "Citas Digitales",
      valores: dias.map((dia) =>
        contarDia(
          citas,
          fechaCita,
          dia,
          (registro) =>
            normalizarTexto(registro.tipo_cita) ===
            "digital",
        ),
      ),
    },
    {
      label: "Citas Digitales Efectivas",
      valores: dias.map((dia) =>
        contarDia(
          citas,
          fechaCita,
          dia,
          (registro) =>
            normalizarTexto(registro.tipo_cita) ===
              "digital" &&
            esVerdadero(registro.asistencia),
        ),
      ),
    },
    {
      label: "Citas Tradicionales",
      valores: dias.map((dia) =>
        contarDia(
          citas,
          fechaCita,
          dia,
          (registro) =>
            normalizarTexto(registro.tipo_cita) ===
            "tradicional",
        ),
      ),
    },
    {
      label: "Citas Tradicionales Efectivas",
      valores: dias.map((dia) =>
        contarDia(
          citas,
          fechaCita,
          dia,
          (registro) =>
            normalizarTexto(registro.tipo_cita) ===
              "tradicional" &&
            esVerdadero(registro.asistencia),
        ),
      ),
    },
    {
      label: "Citas Volvo",
      valores: dias.map((dia) =>
        contarDia(
          citas,
          fechaCita,
          dia,
        ),
      ),
    },
    {
      label: "LEADS",
      valores: dias.map((dia) =>
        contarDia(
          prospectos,
          fechaProspecto,
          dia,
        ),
      ),
    },
    {
      label: "Pruebas Manejo",
      valores: dias.map((dia) =>
        contarDia(
          pruebas,
          fechaPrueba,
          dia,
        ),
      ),
    },
    {
      label: "Tráfico de Piso",
      valores: dias.map((dia) =>
        contarDia(
          piso,
          fechaPiso,
          dia,
        ),
      ),
    },
  ];

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-sm font-bold text-[#001E50]">
          Actividad comercial por día
        </h2>

        <p className="mt-0.5 text-xs text-slate-400">
          Matriz diaria de indicadores comerciales
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1600px] w-full border-collapse text-xs">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="sticky left-0 z-10 min-w-[220px] bg-slate-50 px-4 py-3 text-left font-bold">
                Parámetro
              </th>

              {dias.map((dia) => (
                <th
                  key={dia}
                  className="min-w-[42px] px-2 py-3 text-center font-semibold"
                >
                  {dia}
                </th>
              ))}

              <th className="min-w-[70px] px-3 py-3 text-center font-bold">
                Total
              </th>
            </tr>
          </thead>

          <tbody>
            {filas.map((fila) => {
              const total = fila.valores.reduce(
                (suma, valor) => suma + valor,
                0,
              );

              return (
                <tr
                  key={fila.label}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="sticky left-0 z-[5] bg-white px-4 py-3 font-semibold text-slate-700">
                    {fila.label}
                  </td>

                  {fila.valores.map(
                    (valor, index) => (
                      <td
                        key={`${fila.label}-${index}`}
                        className={`px-2 py-3 text-center ${
                          valor > 0
                            ? "font-bold text-[#001E50]"
                            : "text-slate-300"
                        }`}
                      >
                        {valor || "—"}
                      </td>
                    ),
                  )}

                  <td className="px-3 py-3 text-center font-bold text-[#001E50]">
                    {total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">
        Se omiten métricas de Salesforce, oportunidades y tareas en esta fase.
      </div>
    </section>
  );
}

function CitasConcesionarioCard({
  citas,
}) {
  const total = citas.length;

  const asistidas = citas.filter(
    (registro) =>
      esVerdadero(registro.asistencia),
  ).length;

  const sinAsistencia =
    total - asistidas;

  const porcentajeAsistencia =
    total > 0
      ? (asistidas / total) * 100
      : 0;

  const tipos = agruparPorResolver(
    citas,
    (registro) => registro.tipo_cita,
    "Sin tipo",
  );

  const maximoTipo = Math.max(
    ...tipos.map((item) => item.value),
    1,
  );

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-sm font-bold text-[#001E50]">
          Citas concretadas en concesionario
        </h2>

        <p className="mt-0.5 text-xs text-slate-400">
          Total, asistencia y tipo de cita
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 items-center gap-5">
        <div>
          <span className="text-4xl font-bold text-[#001E50]">
            {total}
          </span>

          <p className="mt-1 text-xs text-slate-400">
            citas registradas
          </p>
        </div>

        <div className="flex justify-center">
          <div
            className="relative flex h-28 w-28 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(
                #001E50 0% ${porcentajeAsistencia}%,
                #e2e8f0 ${porcentajeAsistencia}% 100%
              )`,
            }}
          >
            <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white">
              <span className="text-xl font-bold text-[#001E50]">
                {porcentajeAsistencia.toFixed(
                  1,
                )}
                %
              </span>

              <span className="text-[10px] text-slate-400">
                asistencia
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-emerald-50 p-3">
          <p className="text-[11px] font-semibold text-emerald-700">
            Con asistencia
          </p>

          <p className="mt-1 text-xl font-bold text-emerald-700">
            {asistidas}
          </p>
        </div>

        <div className="rounded-lg bg-slate-100 p-3">
          <p className="text-[11px] font-semibold text-slate-500">
            Sin asistencia registrada
          </p>

          <p className="mt-1 text-xl font-bold text-slate-600">
            {sinAsistencia}
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="mb-3 text-xs font-bold text-slate-600">
          Tipo de cita
        </p>

        <div className="space-y-3">
          {tipos.map((item) => {
            const porcentaje =
              total > 0
                ? (item.value / total) *
                  100
                : 0;

            const ancho =
              (item.value / maximoTipo) *
              100;

            return (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    {item.label}
                  </span>

                  <span className="font-bold text-[#001E50]">
                    {item.value}{" "}
                    <span className="font-normal text-slate-400">
                      (
                      {porcentaje.toFixed(
                        1,
                      )}
                      %)
                    </span>
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#001E50]"
                    style={{
                      width: `${ancho}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

function TestDriveAsesorModeloCard({
  pruebas,
}) {
  const datos = useMemo(() => {
    const asesores = new Map();
    const totalesModelo = new Map();

    pruebas.forEach((registro) => {
      const asesor =
        String(
          registro.asesor_piso ?? "",
        ).trim() || "Sin asesor";

      const modelo =
        String(
          registro.auto_interes ?? "",
        ).trim() ||
        "Sin modelo especificado";

      if (!asesores.has(asesor)) {
        asesores.set(asesor, {
          asesor,
          total: 0,
          modelos: new Map(),
        });
      }

      const item =
        asesores.get(asesor);

      item.total += 1;

      item.modelos.set(
        modelo,
        (item.modelos.get(modelo) ||
          0) + 1,
      );

      totalesModelo.set(
        modelo,
        (totalesModelo.get(modelo) ||
          0) + 1,
      );
    });

    const listaAsesores = [
      ...asesores.values(),
    ].sort(
      (a, b) => b.total - a.total,
    );

    const modelos = [
      ...totalesModelo.entries(),
    ]
      .sort((a, b) => b[1] - a[1])
      .map(([modelo]) => modelo);

    return {
      asesores: listaAsesores,
      modelos,
    };
  }, [pruebas]);

  const colores = [
    "bg-[#001E50]",
    "bg-blue-600",
    "bg-sky-500",
    "bg-indigo-500",
    "bg-slate-500",
    "bg-cyan-600",
    "bg-slate-300",
  ];

  const maximo = Math.max(
    ...datos.asesores.map(
      (item) => item.total,
    ),
    1,
  );

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-sm font-bold text-[#001E50]">
          Test Drives realizados por asesor
        </h2>

        <p className="mt-0.5 text-xs text-slate-400">
          Distribución por asesor y modelo de interés
        </p>
      </div>

      {pruebas.length === 0 ? (
        <div className="flex min-h-[280px] items-center justify-center text-sm text-slate-400">
          Sin Test Drives para el periodo seleccionado
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {datos.modelos.map(
              (modelo, index) => (
                <div
                  key={modelo}
                  className="flex items-center gap-1.5 text-[11px] text-slate-500"
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-sm ${
                      colores[
                        index %
                          colores.length
                      ]
                    }`}
                  />

                  {modelo}
                </div>
              ),
            )}
          </div>

          <div className="mt-6 space-y-5">
            {datos.asesores.map(
              (item) => {
                const anchoGeneral =
                  (item.total / maximo) *
                  100;

                return (
                  <div
                    key={item.asesor}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                      <span
                        className="truncate font-semibold text-slate-700"
                        title={item.asesor}
                      >
                        {item.asesor}
                      </span>

                      <span className="font-bold text-[#001E50]">
                        {item.total}
                      </span>
                    </div>

                    <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="flex h-full overflow-hidden rounded-full"
                        style={{
                          width: `${anchoGeneral}%`,
                        }}
                      >
                        {datos.modelos.map(
                          (
                            modelo,
                            index,
                          ) => {
                            const cantidad =
                              item.modelos.get(
                                modelo,
                              ) || 0;

                            if (
                              cantidad === 0
                            ) {
                              return null;
                            }

                            const anchoModelo =
                              (cantidad /
                                item.total) *
                              100;

                            return (
                              <div
                                key={
                                  modelo
                                }
                                className={
                                  colores[
                                    index %
                                      colores.length
                                  ]
                                }
                                style={{
                                  width: `${anchoModelo}%`,
                                }}
                                title={`${modelo}: ${cantidad}`}
                              />
                            );
                          },
                        )}
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </>
      )}
    </article>
  );
}

export default function Estocastico() {
  const [prospectos, setProspectos] =
    useState([]);

  const [traficoPiso, setTraficoPiso] =
    useState([]);

  const [citas, setCitas] =
    useState([]);

  const [pruebas, setPruebas] =
    useState([]);

  const [cargando, setCargando] =
    useState(true);

  const [errorCarga, setErrorCarga] =
    useState("");

  const [anio, setAnio] =
    useState("");

  const [mes, setMes] =
    useState("");

  const [diaInicio] =
    useState(1);

  const [diaFin, setDiaFin] =
    useState(31);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setErrorCarga("");

        const [
          respuestaProspectos,
          respuestaPiso,
          respuestaCitas,
          respuestaPruebas,
        ] = await Promise.all([
          api.digitalesListProspectos(),
          apiTraficoPiso.list(),
          apiCitas.list(),
          apiPruebaManejo.list(),
        ]);

        const listaProspectos =
          normalizarLista(
            respuestaProspectos,
          );

        const listaPiso =
          normalizarLista(
            respuestaPiso,
          );

        const listaCitas =
          normalizarLista(
            respuestaCitas,
          );

        const listaPruebas =
          normalizarLista(
            respuestaPruebas,
          );

        setProspectos(
          listaProspectos,
        );

        setTraficoPiso(listaPiso);

        setCitas(listaCitas);

        setPruebas(listaPruebas);

        const fechas = [
          ...listaProspectos.map(
            fechaProspecto,
          ),
          ...listaPiso.map(fechaPiso),
          ...listaCitas.map(fechaCita),
          ...listaPruebas.map(
            fechaPrueba,
          ),
        ]
          .filter(Boolean)
          .sort(
            (a, b) =>
              b.getTime() -
              a.getTime(),
          );

        if (fechas.length > 0) {
          const masReciente =
            fechas[0];

          setAnio(
            masReciente.getFullYear(),
          );

          setMes(
            MESES[
              masReciente.getMonth()
            ],
          );
        }
      } catch (error) {
        console.error(
          "Error cargando Estocástico:",
          error,
        );

        setErrorCarga(
          error?.message ||
            "No fue posible cargar la información del resumen estocástico.",
        );
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const todasLasFechas = [
    ...prospectos.map(
      fechaProspecto,
    ),
    ...traficoPiso.map(fechaPiso),
    ...citas.map(fechaCita),
    ...pruebas.map(fechaPrueba),
  ].filter(Boolean);

  const aniosDisponibles = [
    ...new Set(
      todasLasFechas.map((fecha) =>
        fecha.getFullYear(),
      ),
    ),
  ].sort((a, b) => b - a);

  const filtrar = (
    lista,
    obtenerFecha,
  ) =>
    lista.filter((registro) => {
      const fecha =
        obtenerFecha(registro);

      if (!fecha) return false;

      const coincideAnio =
        fecha.getFullYear() ===
        Number(anio);

      const coincideMes =
        fecha.getMonth() ===
        MESES_NUMERO[mes];

      const dia =
        fecha.getDate();

      const coincideDia =
        dia >= diaInicio &&
        dia <= diaFin;

      return (
        coincideAnio &&
        coincideMes &&
        coincideDia
      );
    });

  const prospectosFiltrados =
    filtrar(
      prospectos,
      fechaProspecto,
    );

  const pisoFiltrado =
    filtrar(
      traficoPiso,
      fechaPiso,
    );

  const citasFiltradas =
    filtrar(citas, fechaCita);

  const pruebasFiltradas =
    filtrar(
      pruebas,
      fechaPrueba,
    );

  const totalContactos =
    prospectosFiltrados.length;

  /*
   * Igual que el Power BI:
   * Citas generadas desde expediente digital.
   */
  const citasGeneradas =
    prospectosFiltrados.filter(
      (registro) =>
        tieneValor(
          registro.ultima_cita_agendada,
        ),
    ).length;

  const citasAsistidas =
    prospectosFiltrados.filter(
      (registro) =>
        tieneValor(
          registro.ultima_cita_agendada,
        ) &&
        esVerdadero(
          registro.asistencia,
        ),
    ).length;

  const registrosPiso =
    pisoFiltrado.length;

  const citasConcesionario =
    citasFiltradas.length;

  const totalTestDrive =
    pruebasFiltradas.length;

  const tasaGeneracionCita =
    totalContactos > 0
      ? (citasGeneradas /
          totalContactos) *
        100
      : 0;

  const tasaAsistencia =
    citasGeneradas > 0
      ? (citasAsistidas /
          citasGeneradas) *
        100
      : 0;

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6 px-4 pb-8">
      {/* ENCABEZADO */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Estocástico
        </h1>

        <p className="mt-1 text-slate-500">
          Resumen ejecutivo del proceso comercial Volvo.
        </p>
      </div>

      {errorCarga && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorCarga}
        </div>
      )}

      {/* FILTROS */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <CalendarDays
                size={16}
                className="text-[#001E50]"
              />

              <select
                value={anio}
                onChange={(e) =>
                  setAnio(
                    Number(
                      e.target.value,
                    ),
                  )
                }
                className="bg-transparent text-sm font-semibold text-[#001E50] outline-none"
              >
                {aniosDisponibles.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="hidden h-7 w-px bg-slate-200 md:block" />

            <div className="flex flex-wrap items-center gap-1">
              {MESES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setMes(item)
                  }
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    mes === item
                      ? "bg-[#001E50] text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Rango días
            </span>

            <span className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-[#001E50]">
              01
            </span>

            <input
              type="range"
              min="1"
              max="31"
              value={diaFin}
              onChange={(e) =>
                setDiaFin(
                  Number(
                    e.target.value,
                  ),
                )
              }
              className="w-28 accent-[#001E50]"
            />

            <span className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-[#001E50]">
              {String(
                diaFin,
              ).padStart(2, "0")}
            </span>
          </div>
        </div>
      </section>

      {/* KPIS PRINCIPALES */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Contactos totales
            </span>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users size={20} />
            </div>
          </div>

          <div className="mt-5 text-4xl font-bold text-[#001E50]">
            {cargando
              ? "..."
              : totalContactos}
          </div>

          <p className="mt-1 text-xs text-slate-400">
            prospectos digitales
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Citas generadas
            </span>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <CalendarCheck size={20} />
            </div>
          </div>

          <div className="mt-5 text-4xl font-bold text-[#001E50]">
            {cargando
              ? "..."
              : citasGeneradas}
          </div>

          <p className="mt-1 text-xs text-slate-400">
            {tasaGeneracionCita.toFixed(
              1,
            )}
            % de contactos
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Citas asistidas
            </span>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <BadgeCheck size={20} />
            </div>
          </div>

          <div className="mt-5 text-4xl font-bold text-[#001E50]">
            {cargando
              ? "..."
              : citasAsistidas}
          </div>

          <p className="mt-1 text-xs text-slate-400">
            {tasaAsistencia.toFixed(
              1,
            )}
            % asistencia
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Registros de piso
            </span>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[#001E50]">
              <Building2 size={20} />
            </div>
          </div>

          <div className="mt-5 text-4xl font-bold text-[#001E50]">
            {cargando
              ? "..."
              : registrosPiso}
          </div>

          <p className="mt-1 text-xs text-slate-400">
            ingresos registrados
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Test Drive
            </span>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[#001E50]">
              <Car size={20} />
            </div>
          </div>

          <div className="mt-5 text-4xl font-bold text-[#001E50]">
            {cargando
              ? "..."
              : totalTestDrive}
          </div>

          <p className="mt-1 text-xs text-slate-400">
            pruebas de manejo
          </p>
        </article>
      </section>

      {/* RESUMEN ETAPAS */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-[#001E50]">
            Resumen del proceso comercial
          </h2>

          <p className="mt-0.5 text-xs text-slate-400">
            Volumen registrado por indicador durante el periodo seleccionado
            </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[
            {
              label:
                "Contactos digitales",
              value: totalContactos,
            },
            {
              label:
                "Citas generadas",
              value: citasGeneradas,
            },
            {
              label:
                "Citas asistidas",
              value: citasAsistidas,
            },
            {
              label:
                "Registro piso",
              value: registrosPiso,
            },
            {
              label:
                "Citas concesionario",
              value:
                citasConcesionario,
            },
            {
              label: "Test Drive",
              value: totalTestDrive,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="relative rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Gestión comercial
                </span>

              <div className="mt-2 text-3xl font-bold text-[#001E50]">
                {cargando
                  ? "..."
                  : item.value}
              </div>

              <p className="mt-1 text-xs font-semibold text-slate-600">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[11px] text-slate-400">
          Las cifras representan registros de cada fuente y no se interpretan como una conversión secuencial entre bases.
        </p>
      </section>

        {/* MATRIZ DIARIA POWER BI */}
        <MatrizDiariaCard
        prospectos={prospectosFiltrados}
        citas={citasFiltradas}
        piso={pisoFiltrado}
        pruebas={pruebasFiltradas}
        diaFin={diaFin}
        />

        {/* CITAS + TEST DRIVE */}
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <CitasConcesionarioCard
            citas={citasFiltradas}
        />

        <TestDriveAsesorModeloCard
            pruebas={pruebasFiltradas}
        />
        </section>

      <div className="pb-2 text-xs text-slate-400">
        Fuente: CRM Volvo · Tráfico de Piso · Citas · Pruebas de Manejo
      </div>
    </div>
  );
}