import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Car,
  FileText,
  Users,
} from "lucide-react";

import { apiCitas } from "../../lib/apiCitas";
import { apiCitasPiso } from "../../lib/apiCitasPiso";
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

  return Number.isNaN(fecha.getTime()) ? null : fecha;
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

function fechaEvento(registro) {
  return fechaValida(
    registro?.fecha_hora_cita ||
      registro?.creado_en,
  );
}

function formatearFechaHora(valor) {
  const fecha = fechaValida(valor);

  if (!fecha) return "—";

  return fecha.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function obtenerNombreCliente(registro) {
  return (
    String(registro?.cliente?.nombre ?? "").trim() ||
    "Sin nombre"
  );
}

function obtenerTelefonoCliente(registro) {
  return (
    String(registro?.cliente?.telefono ?? "").trim() ||
    "—"
  );
}

function obtenerCorreoCliente(registro) {
  return (
    String(registro?.cliente?.correo ?? "").trim() ||
    "Sin correo"
  );
}

function agruparPorResolver(
  registros,
  resolver,
  fallback = "Sin especificar",
) {
  const mapa = new Map();

  registros.forEach((registro) => {
    const valorOriginal = String(
      resolver(registro) ?? "",
    ).trim();

    const label = valorOriginal || fallback;
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

function agruparPorCampo(
  registros,
  campo,
  fallback = "Sin especificar",
) {
  return agruparPorResolver(
    registros,
    (registro) => registro?.[campo],
    fallback,
  );
}

function topNConOtros(items, limite = 6) {
  if (items.length <= limite) {
    return items;
  }

  const principales = items.slice(0, limite);

  const otros = items
    .slice(limite)
    .reduce(
      (total, item) => total + item.value,
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
  emptyText = "Sin información para el periodo seleccionado",
}) {
  const maximo = Math.max(
    ...items.map((item) => item.value),
    1,
  );

  return (
    <article className="flex min-h-[340px] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
          {emptyText}
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {items.map((item) => {
            const porcentaje =
              total > 0
                ? (item.value / total) * 100
                : 0;

            const ancho =
              (item.value / maximo) * 100;

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
                      ({porcentaje.toFixed(1)}%)
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

function CalidadPruebasCard({
  total,
  conVin,
  conFolio,
  conEvidencia,
}) {
  const items = [
    {
      label: "VIN / número de serie",
      value: conVin,
    },
    {
      label: "Folio de salida",
      value: conFolio,
    },
    {
      label: "Con evidencia",
      value: conEvidencia,
    },
  ];

  return (
    <article className="flex min-h-[340px] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-sm font-bold text-[#001E50]">
          Captura de Test Drive
        </h2>

        <p className="mt-0.5 text-xs text-slate-400">
          Cobertura de información registrada
        </p>
      </div>

      {total === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
          Sin pruebas para el periodo seleccionado
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {items.map((item) => {
            const porcentaje =
              total > 0
                ? (item.value / total) * 100
                : 0;

            return (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-700">
                    {item.label}
                  </span>

                  <span className="text-xs font-bold text-[#001E50]">
                    {item.value} / {total}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#001E50]"
                    style={{
                      width: `${porcentaje}%`,
                    }}
                  />
                </div>

                <p className="mt-1 text-right text-[11px] text-slate-400">
                  {porcentaje.toFixed(1)}%
                </p>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

function ActividadDiariaCard({
  citas,
  pruebas,
}) {
  const actividad = useMemo(() => {
    const mapa = new Map();

    const agregar = (registro, tipo) => {
      const fecha = fechaEvento(registro);

      if (!fecha) return;

      const dia = fecha.getDate();

      if (!mapa.has(dia)) {
        mapa.set(dia, {
          dia,
          citas: 0,
          pruebas: 0,
        });
      }

      mapa.get(dia)[tipo] += 1;
    };

    citas.forEach((registro) =>
      agregar(registro, "citas"),
    );

    pruebas.forEach((registro) =>
      agregar(registro, "pruebas"),
    );

    return [...mapa.values()].sort(
      (a, b) => a.dia - b.dia,
    );
  }, [citas, pruebas]);

  const maximo = Math.max(
    ...actividad.map(
      (item) =>
        Math.max(
          item.citas,
          item.pruebas,
        ),
    ),
    1,
  );

  return (
    <article className="min-h-[340px] rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-sm font-bold text-[#001E50]">
            Actividad por día
          </h2>

          <p className="mt-0.5 text-xs text-slate-400">
            Citas y pruebas de manejo registradas en el periodo
          </p>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#001E50]" />
            Citas
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-400" />
            Test Drive
          </div>
        </div>
      </div>

      {actividad.length === 0 ? (
        <div className="flex min-h-[250px] items-center justify-center text-sm text-slate-400">
          Sin actividad para el periodo seleccionado
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <div className="flex min-w-max items-end gap-4 px-1">
            {actividad.map((item) => {
              const alturaCita =
                (item.citas / maximo) * 170;

              const alturaPrueba =
                (item.pruebas / maximo) * 170;

              return (
                <div
                  key={item.dia}
                  className="flex w-12 shrink-0 flex-col items-center"
                >
                  <div className="flex h-[190px] items-end gap-1">
                    <div className="flex flex-col items-center justify-end">
                      <span className="mb-1 text-[10px] font-bold text-[#001E50]">
                        {item.citas || ""}
                      </span>

                      <div
                        className="w-4 rounded-t bg-[#001E50]"
                        style={{
                          height: `${Math.max(
                            alturaCita,
                            item.citas > 0
                              ? 5
                              : 0,
                          )}px`,
                        }}
                      />
                    </div>

                    <div className="flex flex-col items-center justify-end">
                      <span className="mb-1 text-[10px] font-bold text-slate-500">
                        {item.pruebas || ""}
                      </span>

                      <div
                        className="w-4 rounded-t bg-slate-400"
                        style={{
                          height: `${Math.max(
                            alturaPrueba,
                            item.pruebas > 0
                              ? 5
                              : 0,
                          )}px`,
                        }}
                      />
                    </div>
                  </div>

                  <span className="mt-2 text-[11px] font-semibold text-slate-500">
                    {String(item.dia).padStart(
                      2,
                      "0",
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}

export default function CitasTestDrive() {
  const [citas, setCitas] = useState([]);
  const [
    registrosPiso,
    setRegistrosPiso,
  ] = useState([]);
  const [
    pruebasManejo,
    setPruebasManejo,
  ] = useState([]);

  const [cargando, setCargando] =
    useState(true);

  const [errorCarga, setErrorCarga] =
    useState("");

  const [anio, setAnio] = useState("");
  const [mes, setMes] = useState("");

  const [diaInicio] = useState(1);
  const [diaFin, setDiaFin] =
    useState(31);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setErrorCarga("");

        const [
          respuestaCitas,
          respuestaPiso,
          respuestaPruebas,
        ] = await Promise.all([
          apiCitas.list(),
          apiCitasPiso.list(),
          apiPruebaManejo.list(),
        ]);

        const listaCitas =
          normalizarLista(respuestaCitas);

        const listaPiso =
          normalizarLista(respuestaPiso);

        const listaPruebas =
          normalizarLista(
            respuestaPruebas,
          );

        setCitas(listaCitas);
        setRegistrosPiso(listaPiso);
        setPruebasManejo(listaPruebas);

        const fechasDisponibles = [
          ...listaCitas,
          ...listaPiso,
          ...listaPruebas,
        ]
          .map((registro) =>
            fechaEvento(registro),
          )
          .filter(Boolean)
          .sort(
            (a, b) =>
              b.getTime() - a.getTime(),
          );

        if (
          fechasDisponibles.length > 0
        ) {
          const fechaMasReciente =
            fechasDisponibles[0];

          setAnio(
            fechaMasReciente.getFullYear(),
          );

          setMes(
            MESES[
              fechaMasReciente.getMonth()
            ],
          );
        }
      } catch (error) {
        console.error(
          "Error cargando Citas y Test Drive:",
          error,
        );

        setErrorCarga(
          error?.message ||
            "No fue posible cargar la información de citas y pruebas de manejo.",
        );
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const todasLasFechas = [
    ...citas,
    ...registrosPiso,
    ...pruebasManejo,
  ]
    .map((registro) =>
      fechaEvento(registro),
    )
    .filter(Boolean);

  const aniosDisponibles = [
    ...new Set(
      todasLasFechas.map((fecha) =>
        fecha.getFullYear(),
      ),
    ),
  ].sort((a, b) => b - a);

  const filtrarPorPeriodo = (lista) =>
    lista.filter((registro) => {
      const fecha = fechaEvento(registro);

      if (!fecha) return false;

      const coincideAnio =
        fecha.getFullYear() ===
        Number(anio);

      const coincideMes =
        fecha.getMonth() ===
        MESES_NUMERO[mes];

      const dia = fecha.getDate();

      const coincideDia =
        dia >= Number(diaInicio) &&
        dia <= Number(diaFin);

      return (
        coincideAnio &&
        coincideMes &&
        coincideDia
      );
    });

  const citasFiltradas =
    filtrarPorPeriodo(citas);

  const pisoFiltrado =
    filtrarPorPeriodo(registrosPiso);

  const pruebasFiltradas =
    filtrarPorPeriodo(pruebasManejo);

  const totalCitas =
    citasFiltradas.length;

  const citasConAsistencia =
    citasFiltradas.filter((registro) =>
      esVerdadero(registro.asistencia),
    ).length;

  const tasaAsistencia =
    totalCitas > 0
      ? (citasConAsistencia /
          totalCitas) *
        100
      : 0;

  const totalPruebas =
    pruebasFiltradas.length;

  const totalPiso =
    pisoFiltrado.length;

  const pruebasConVin =
    pruebasFiltradas.filter(
      (registro) =>
        tieneValor(registro.num_serie),
    ).length;

  const pruebasConFolio =
    pruebasFiltradas.filter(
      (registro) =>
        tieneValor(
          registro.folio_salida,
        ),
    ).length;

  const pruebasConEvidencia =
    pruebasFiltradas.filter(
      (registro) =>
        Array.isArray(
          registro.evidencias,
        ) &&
        registro.evidencias.length > 0,
    ).length;

  const tiposCita = topNConOtros(
    agruparPorCampo(
      citasFiltradas,
      "tipo_cita",
      "Sin tipo de cita",
    ),
    6,
  );

  const fuentesCita = topNConOtros(
    agruparPorCampo(
      citasFiltradas,
      "fuente_prospeccion",
      "Sin fuente",
    ),
    6,
  );

  const asesoresCita = topNConOtros(
    agruparPorResolver(
      citasFiltradas,
      (registro) =>
        registro.asesor_piso ||
        registro.asesor_digital,
      "Sin asesor",
    ),
    6,
  );

  const modelosCita = topNConOtros(
    agruparPorCampo(
      citasFiltradas,
      "auto_interes",
      "Sin modelo especificado",
    ),
    6,
  );

  const modelosPrueba = topNConOtros(
    agruparPorCampo(
      pruebasFiltradas,
      "auto_interes",
      "Sin modelo especificado",
    ),
    6,
  );

  const asesoresPrueba = topNConOtros(
    agruparPorCampo(
      pruebasFiltradas,
      "asesor_piso",
      "Sin asesor",
    ),
    6,
  );

  const citasTabla = [
    ...citasFiltradas,
  ].sort((a, b) => {
    const fechaA =
      fechaEvento(a)?.getTime() || 0;

    const fechaB =
      fechaEvento(b)?.getTime() || 0;

    return fechaB - fechaA;
  });

  const pruebasTabla = [
    ...pruebasFiltradas,
  ].sort((a, b) => {
    const fechaA =
      fechaEvento(a)?.getTime() || 0;

    const fechaB =
      fechaEvento(b)?.getTime() || 0;

    return fechaB - fechaA;
  });

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6 px-4 pb-8">
      {/* ENCABEZADO */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Citas y Test Drive
        </h1>

        <p className="mt-1 text-slate-500">
          Seguimiento comercial de citas y pruebas de manejo.
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
            {/* AÑO */}
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

            {/* MESES */}
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

          {/* DÍAS */}
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Rango días
            </span>

            <span className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-[#001E50]">
              {String(
                diaInicio,
              ).padStart(2, "0")}
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
              {String(diaFin).padStart(
                2,
                "0",
              )}
            </span>
          </div>
        </div>
      </section>

      {/* KPI */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {/* CITAS */}
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Citas
            </span>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CalendarDays size={20} />
            </div>
          </div>

          <div className="mt-5 flex items-end gap-2">
            <span className="text-4xl font-bold text-[#001E50]">
              {cargando
                ? "..."
                : totalCitas}
            </span>

            <span className="mb-1 text-xs text-slate-400">
              citas
            </span>
          </div>
        </article>

        {/* ASISTENCIA */}
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Con asistencia
            </span>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <BadgeCheck size={20} />
            </div>
          </div>

          <div className="mt-5 flex items-end gap-2">
            <span className="text-4xl font-bold text-[#001E50]">
              {cargando
                ? "..."
                : citasConAsistencia}
            </span>

            <span className="mb-1 text-xs text-slate-400">
              registradas
            </span>
          </div>
        </article>

        {/* TASA */}
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Tasa asistencia
            </span>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Users size={20} />
            </div>
          </div>

          <div className="mt-5 flex items-end gap-2">
            <span className="text-4xl font-bold text-[#001E50]">
              {cargando
                ? "..."
                : `${tasaAsistencia.toFixed(
                    1,
                  )}%`}
            </span>
          </div>
        </article>

        {/* TEST DRIVE */}
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Test Drive
            </span>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[#001E50]">
              <Car size={20} />
            </div>
          </div>

          <div className="mt-5 flex items-end gap-2">
            <span className="text-4xl font-bold text-[#001E50]">
              {cargando
                ? "..."
                : totalPruebas}
            </span>

            <span className="mb-1 text-xs text-slate-400">
              registrados
            </span>
          </div>
        </article>

        {/* REGISTROS PISO */}
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Registro piso
            </span>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <FileText size={20} />
            </div>
          </div>

          <div className="mt-5 flex items-end gap-2">
            <span className="text-4xl font-bold text-[#001E50]">
              {cargando
                ? "..."
                : totalPiso}
            </span>

            <span className="mb-1 text-xs text-slate-400">
              registros
            </span>
          </div>
        </article>
      </section>

      {/* FILA 1 */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <RankingCard
          title="Tipo de cita"
          subtitle="Distribución entre citas tradicionales y digitales"
          items={tiposCita}
          total={totalCitas}
        />

        <RankingCard
          title="Fuente de prospección"
          subtitle="Origen comercial de las citas"
          items={fuentesCita}
          total={totalCitas}
        />

        <RankingCard
          title="Citas por asesor"
          subtitle="Distribución de citas por asesor registrado"
          items={asesoresCita}
          total={totalCitas}
        />
      </section>

      {/* FILA 2 */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <RankingCard
          title="Modelos en citas"
          subtitle="Vehículos de interés asociados a las citas"
          items={modelosCita}
          total={totalCitas}
        />

        <RankingCard
          title="Modelos en Test Drive"
          subtitle="Vehículos registrados para prueba de manejo"
          items={modelosPrueba}
          total={totalPruebas}
        />

        <RankingCard
          title="Test Drive por asesor"
          subtitle="Pruebas de manejo registradas por asesor"
          items={asesoresPrueba}
          total={totalPruebas}
        />
      </section>

      {/* FILA 3 */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ActividadDiariaCard
          citas={citasFiltradas}
          pruebas={pruebasFiltradas}
        />

        <CalidadPruebasCard
          total={totalPruebas}
          conVin={pruebasConVin}
          conFolio={pruebasConFolio}
          conEvidencia={
            pruebasConEvidencia
          }
        />
      </section>

      {/* DETALLE CITAS */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-[#001E50]">
              Detalle de citas
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              Citas correspondientes al periodo seleccionado
            </p>
          </div>

          <span className="rounded-md border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#001E50]">
            {citasTabla.length} registros
          </span>
        </div>

        {citasTabla.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center px-5 py-10 text-sm text-slate-400">
            No hay citas para el periodo seleccionado.
          </div>
        ) : (
          <div className="max-h-[460px] overflow-auto">
            <table className="min-w-[1400px] w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <th className="whitespace-nowrap px-4 py-3">
                    Fecha / hora
                  </th>

                  <th className="whitespace-nowrap px-4 py-3">
                    Prospecto
                  </th>

                  <th className="whitespace-nowrap px-4 py-3">
                    Teléfono
                  </th>

                  <th className="whitespace-nowrap px-4 py-3">
                    Tipo
                  </th>

                  <th className="whitespace-nowrap px-4 py-3">
                    Fuente
                  </th>

                  <th className="whitespace-nowrap px-4 py-3">
                    Modelo
                  </th>

                  <th className="whitespace-nowrap px-4 py-3">
                    Asesor
                  </th>

                  <th className="whitespace-nowrap px-4 py-3">
                    Asistencia
                  </th>
                </tr>
              </thead>

              <tbody>
                {citasTabla.map(
                  (registro) => (
                    <tr
                      key={registro.id}
                      className="border-b border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        {formatearFechaHora(
                          registro.fecha_hora_cita,
                        )}
                      </td>

                      <td className="max-w-[220px] px-4 py-3">
                        <div
                          className="truncate font-semibold text-slate-800"
                          title={obtenerNombreCliente(
                            registro,
                          )}
                        >
                          {obtenerNombreCliente(
                            registro,
                          )}
                        </div>

                        <div className="mt-0.5 truncate text-[11px] text-slate-400">
                          {obtenerCorreoCliente(
                            registro,
                          )}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {obtenerTelefonoCliente(
                          registro,
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {registro.tipo_cita ||
                          "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {registro.fuente_prospeccion ||
                          "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-[#001E50]">
                        {registro.auto_interes ||
                          "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {registro.asesor_piso ||
                          registro.asesor_digital ||
                          "Sin asignar"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        {esVerdadero(
                          registro.asistencia,
                        ) ? (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                            Registrada
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                            No registrada
                          </span>
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* DETALLE TEST DRIVE */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-[#001E50]">
              Detalle de Test Drive
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              Pruebas de manejo correspondientes al periodo seleccionado
            </p>
          </div>

          <span className="rounded-md border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#001E50]">
            {pruebasTabla.length} registros
          </span>
        </div>

        {pruebasTabla.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center px-5 py-10 text-sm text-slate-400">
            No hay pruebas de manejo para el periodo seleccionado.
          </div>
        ) : (
          <div className="max-h-[460px] overflow-auto">
            <table className="min-w-[1400px] w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <th className="whitespace-nowrap px-4 py-3">
                    Fecha / hora
                  </th>

                  <th className="whitespace-nowrap px-4 py-3">
                    Prospecto
                  </th>

                  <th className="whitespace-nowrap px-4 py-3">
                    Teléfono
                  </th>

                  <th className="whitespace-nowrap px-4 py-3">
                    Modelo
                  </th>

                  <th className="whitespace-nowrap px-4 py-3">
                    VIN / Serie
                  </th>

                  <th className="whitespace-nowrap px-4 py-3">
                    Asesor
                  </th>

                  <th className="whitespace-nowrap px-4 py-3">
                    Folio salida
                  </th>

                  <th className="whitespace-nowrap px-4 py-3">
                    Evidencias
                  </th>
                </tr>
              </thead>

              <tbody>
                {pruebasTabla.map(
                  (registro) => (
                    <tr
                      key={registro.id}
                      className="border-b border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        {formatearFechaHora(
                          registro.fecha_hora_cita,
                        )}
                      </td>

                      <td className="max-w-[220px] px-4 py-3">
                        <div
                          className="truncate font-semibold text-slate-800"
                          title={obtenerNombreCliente(
                            registro,
                          )}
                        >
                          {obtenerNombreCliente(
                            registro,
                          )}
                        </div>

                        <div className="mt-0.5 truncate text-[11px] text-slate-400">
                          {obtenerCorreoCliente(
                            registro,
                          )}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {obtenerTelefonoCliente(
                          registro,
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-[#001E50]">
                        {registro.auto_interes ||
                          "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-slate-600">
                        {registro.num_serie ||
                          "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {registro.asesor_piso ||
                          "Sin asignar"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {registro.folio_salida ||
                          "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {Array.isArray(
                          registro.evidencias,
                        )
                          ? registro
                              .evidencias
                              .length
                          : 0}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="pb-2 text-xs text-slate-400">
        Fuente: Citas · Registro de Piso · Pruebas de Manejo · CRM Volvo
      </div>
    </div>
  );
}