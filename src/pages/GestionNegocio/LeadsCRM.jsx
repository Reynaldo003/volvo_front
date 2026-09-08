import { useEffect, useState } from "react";
import {
  CalendarDays,
  Users,
  UserX,
  UserCheck,
  CalendarCheck,
} from "lucide-react";

import { api } from "../../lib/apiPruebas";

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

function normalizarTexto(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function fechaValida(valor) {
  if (!valor) return null;

  const fecha = new Date(valor);

  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function tieneValor(valor) {
  return (
    valor !== null &&
    valor !== undefined &&
    String(valor).trim() !== ""
  );
}

function agruparPorCampo(registros, campo, fallback = "Sin especificar") {
  const mapa = new Map();

  registros.forEach((registro) => {
    const valorOriginal = String(registro?.[campo] ?? "").trim();
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

  return [...mapa.values()].sort((a, b) => b.value - a.value);
}

function topNConOtros(items, limite = 6) {
  if (items.length <= limite) return items;

  const principales = items.slice(0, limite);

  const otros = items
    .slice(limite)
    .reduce((total, item) => total + item.value, 0);

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
    <article className="flex min-h-[360px] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
      )}
    </article>
  );
}

function formatearFecha(valor) {
  const fecha = fechaValida(valor);

  if (!fecha) return "—";

  return fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function LeadsCRM() {
    const [anio, setAnio] = useState("");
    const [mes, setMes] = useState("");
    const [diaInicio] = useState(1);
    const [diaFin, setDiaFin] = useState(31);
    const [prospectos, setProspectos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState("");

    useEffect(() => {
        const cargarProspectosReales = async () => {
            try {
            setCargando(true);
            setErrorCarga("");

            const response = await api.digitalesListProspectos();

            const registros = Array.isArray(response)
                ? response
                : Array.isArray(response?.results)
                ? response.results
                : [];

            setProspectos(registros);
            const fechasDisponibles = registros
            .map((prospecto) => fechaValida(prospecto.creado))
            .filter(Boolean)
            .sort((a, b) => b.getTime() - a.getTime());

            if (fechasDisponibles.length > 0) {
            const fechaMasReciente = fechasDisponibles[0];

            setAnio(fechaMasReciente.getFullYear());
            setMes(MESES[fechaMasReciente.getMonth()]);
            }
            } catch (error) {
            console.error("Error cargando prospectos Volvo:", error);

            setErrorCarga(
                error?.message || "No fue posible cargar los prospectos.",
            );
            } finally {
            setCargando(false);
            }
        };

        cargarProspectosReales();
        }, []);

        const aniosDisponibles = [
            ...new Set(
                prospectos
                .map((prospecto) => fechaValida(prospecto.creado))
                .filter(Boolean)
                .map((fecha) => fecha.getFullYear()),
            ),
            ].sort((a, b) => b - a);
        const prospectosFiltrados = prospectos.filter((prospecto) => {
            const fecha = fechaValida(prospecto.creado);

            if (!fecha) return false;

            const coincideAnio = fecha.getFullYear() === Number(anio);
            const coincideMes = fecha.getMonth() === MESES_NUMERO[mes];

            const dia = fecha.getDate();

            const coincideDia =
                dia >= Number(diaInicio) &&
                dia <= Number(diaFin);

            return coincideAnio && coincideMes && coincideDia;
            });

            const totalProspectos = prospectosFiltrados.length;
            const totalDescalificados = prospectosFiltrados.filter((prospecto) => {
            const estado = normalizarTexto(prospecto.estado);

            return (
                estado.includes("descalific") ||
                tieneValor(prospecto.motivo_descalificacion)
            );
            }).length;

            const totalAsignados = prospectosFiltrados.filter((prospecto) =>
            tieneValor(prospecto.asesor_ventas),
            ).length;

            const totalCitas = prospectosFiltrados.filter(
                (prospecto) => tieneValor(prospecto.ultima_cita),
                ).length;
            
            const totalCitasAsistidas = prospectosFiltrados.filter(
                (prospecto) =>
                    tieneValor(prospecto.ultima_cita) &&
                    (
                    prospecto.asistencia === true ||
                    normalizarTexto(prospecto.asistencia) === "true"
                    ),
                ).length;

                const tasaAsistencia =
                totalCitas > 0
                    ? (totalCitasAsistidas / totalCitas) * 100
                    : 0;

                const totalCitasNoAsistidas = Math.max(
                totalCitas - totalCitasAsistidas,
                0,
                );    
            const coloresEstatus = [
                "#94A3B8",
                "#001E50",
                "#2563EB",
                "#4F46E5",
                "#059669",
                "#D97706",
                ];

                const estatusAgrupados = agruparPorCampo(
                prospectosFiltrados,
                "estado",
                "Sin estatus",
                );

                const maxEstatus = Math.max(
                ...estatusAgrupados.map((item) => item.value),
                1,
                );

                const estatusProspectos = estatusAgrupados.map((item, index) => ({
                ...item,
                percent:
                    totalProspectos > 0
                    ? ((item.value / totalProspectos) * 100).toFixed(1)
                    : "0.0",
                width: (item.value / maxEstatus) * 100,
                color: coloresEstatus[index % coloresEstatus.length],
                }));

                const coloresCanal = [
                "#001E50",
                "#2563EB",
                "#059669",
                "#7C3AED",
                "#D97706",
                "#94A3B8",
                ];

                const canalesAgrupados = agruparPorCampo(
                prospectosFiltrados,
                "canal_contacto",
                "Sin canal",
                );

                const canalesProspectos = canalesAgrupados.map((item, index) => ({
                ...item,
                percent:
                    totalProspectos > 0
                    ? ((item.value / totalProspectos) * 100).toFixed(1)
                    : "0.0",
                width:
                    totalProspectos > 0
                    ? (item.value / totalProspectos) * 100
                    : 0,
                color: coloresCanal[index % coloresCanal.length],
                }));

                const businessAgrupado = agruparPorCampo(
                prospectosFiltrados,
                "business",
                "Sin business",
                );

                const prospectosPorDiaMap = new Map();

                prospectosFiltrados.forEach((prospecto) => {
                const fecha = fechaValida(prospecto.creado);

                if (!fecha) return;

                const dia = fecha.getDate();

                prospectosPorDiaMap.set(
                    dia,
                    (prospectosPorDiaMap.get(dia) || 0) + 1,
                );
                });

                const prospectosPorDia = [...prospectosPorDiaMap.entries()]
                .map(([day, value]) => ({
                    day,
                    value,
                }))
                .sort((a, b) => a.day - b.day);

                const maxProspectosDia = Math.max(
                ...prospectosPorDia.map((item) => item.value),
                1,
                );

                const picoDia =
                prospectosPorDia.length > 0
                    ? prospectosPorDia.reduce((mayor, actual) =>
                        actual.value > mayor.value ? actual : mayor,
                    )
                    : null;

                const promedioDia =
                prospectosPorDia.length > 0
                    ? (
                        prospectosPorDia.reduce(
                        (total, item) => total + item.value,
                        0,
                        ) / prospectosPorDia.length
                    ).toFixed(1)
                    : "0.0";
                    const modelosInteres = topNConOtros(
                        agruparPorCampo(
                            prospectosFiltrados,
                            "auto_interes",
                            "Sin modelo especificado",
                        ),
                        6,
                        );

                        const pautasProspectos = topNConOtros(
                        agruparPorCampo(
                            prospectosFiltrados,
                            "pauta",
                            "Sin pauta",
                        ),
                        6,
                        );

                        const prospectosConMotivoDescalificacion =
                        prospectosFiltrados.filter((prospecto) =>
                            tieneValor(prospecto.motivo_descalificacion),
                        );

                        const motivosDescalificacion = topNConOtros(
                        agruparPorCampo(
                            prospectosConMotivoDescalificacion,
                            "motivo_descalificacion",
                            "Sin motivo",
                        ),
                        6,
                        );  
                        const prospectosConAsesor = prospectosFiltrados.filter(
                            (prospecto) => tieneValor(prospecto.asesor_ventas),
                            );

                            const prospectosPorAsesor = agruparPorCampo(
                            prospectosConAsesor,
                            "asesor_ventas",
                            "Sin asesor",
                            );

                            const totalProspectosAsignados = prospectosConAsesor.length;
                            const prospectosTabla = [...prospectosFiltrados].sort((a, b) => {
                                const fechaA = fechaValida(a.creado)?.getTime() || 0;
                                const fechaB = fechaValida(b.creado)?.getTime() || 0;

                                return fechaB - fechaA;
                                });

                            return (

        <div className="w-full space-y-6">
            {/* ENCABEZADO */}
            <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-900">
                Leads CRM
            </h1>

            <p className="text-slate-500">
                Análisis de leads provenientes del CRM.
            </p>
            </div>

            {errorCarga && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {errorCarga}
                </div>
                )}

            {/* FILTROS TEMPORALES */}
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">

                <div className="flex flex-wrap items-center gap-3">

                {/* AÑO */}
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <CalendarDays size={16} className="text-[#001E50]" />

                    <select
                    value={anio}
                    onChange={(e) => setAnio(Number(e.target.value))}
                    className="bg-transparent text-sm font-semibold text-[#001E50] outline-none"
                    >
                    {aniosDisponibles.map((item) => (
                        <option key={item} value={item}>
                            {item}
                        </option>
                        ))}
                    </select>
                </div>

                <div className="hidden h-7 w-px bg-slate-200 md:block" />

                {/* MESES */}
                <div className="flex flex-wrap items-center gap-1">
                    {MESES.map((item) => (
                    <button
                        key={item}
                        type="button"
                        onClick={() => setMes(item)}
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
                    {String(diaInicio).padStart(2, "0")}
                </span>

                <input
                    type="range"
                    min="1"
                    max="31"
                    value={diaFin}
                    onChange={(e) => setDiaFin(Number(e.target.value))}
                    className="w-28 accent-[#001E50]"
                />

                <span className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-[#001E50]">
                    {String(diaFin).padStart(2, "0")}
                </span>
                </div>
            </div>
            </section>
            {/* KPI */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* PROSPECTOS */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Prospectos digitales
                </span>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Users size={20} />
                </div>
                </div>

                <div className="mt-5 flex items-end gap-2">
                <span className="text-4xl font-bold text-[#001E50]">
                    {cargando ? "..." : totalProspectos}
                </span>

                <span className="mb-1 text-xs text-slate-400">
                    captados
                </span>
                </div>
            </div>

            {/* DESCALIFICADOS */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Descalificados
                </span>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
                    <UserX size={20} />
                </div>
                </div>

                <div className="mt-5 flex items-end gap-2">
                <span className="text-4xl font-bold text-[#001E50]">
                    {cargando ? "..." : totalDescalificados}
                </span>

                <span className="mb-1 rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-500">
                    descartados
                </span>
                </div>
            </div>

            {/* ASIGNADOS */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Asignados a asesor
                </span>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <UserCheck size={20} />
                </div>
                </div>

                <div className="mt-5 flex items-end gap-2">
                <span className="text-4xl font-bold text-[#001E50]">
                    {cargando ? "..." : totalAsignados}
                </span>

                <span className="mb-1 text-xs text-slate-400">
                    distribuidos
                </span>
                </div>
            </div>

            {/* CITAS */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Citas generadas
                </span>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <CalendarCheck size={20} />
                </div>
                </div>

                <div className="mt-5 flex items-end gap-2">
                <span className="text-4xl font-bold text-[#001E50]">
                    {cargando ? "..." : totalCitas}
                </span>

                <span className="mb-1 text-xs text-slate-400">
                    citas
                </span>
                </div>
            </div>
            </section>
            {/* PRIMERA FILA DE ANALÍTICA */}
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">

            {/* ESTATUS DE PROSPECTOS */}
            <article className="flex min-h-[360px] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                    <h2 className="text-sm font-bold text-[#001E50]">
                    Estatus de Prospectos
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-400">
                    Embudo de cualificación comercial
                    </p>
                </div>

                <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Etapas CRM
                </span>
                </div>

                <div className="mt-5 flex-1 space-y-4">
                {estatusProspectos.map((item) => (
                    <div key={item.label}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">
                        {item.label}
                        </span>

                        <span className="font-bold text-[#001E50]">
                        {item.value}

                        <span className="ml-1 font-normal text-slate-400">
                            ({item.percent}%)
                        </span>
                        </span>
                    </div>

                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                        className="h-full rounded-full"
                        style={{
                            width: `${item.width}%`,
                            backgroundColor: item.color,
                        }}
                        />
                    </div>
                    </div>
                ))}
                </div>
            </article>

            {/* CANAL DE PROSPECTOS */}
            <article className="flex min-h-[360px] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                    <h2 className="text-sm font-bold text-[#001E50]">
                    Canal de Prospectos
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-400">
                    Origen de entrada digital
                    </p>
                </div>

                <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-bold text-[#001E50]">
                    Total: {totalProspectos}
                </span>
                </div>

                <div className="mt-5 space-y-4">
                {canalesProspectos.map((item) => (
                    <div key={item.label}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">

                        <div className="flex items-center gap-2">
                        <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />

                        <span className="font-semibold text-slate-700">
                            {item.label}
                        </span>
                        </div>

                        <span className="font-bold text-[#001E50]">
                        {item.value}

                        <span className="ml-1 font-normal text-slate-400">
                            ({item.percent}%)
                        </span>
                        </span>
                    </div>

                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                        className="h-full rounded-full"
                        style={{
                            width: `${item.width}%`,
                            backgroundColor: item.color,
                        }}
                        />
                    </div>
                    </div>
                ))}
                </div>

                {/* BUSINESS */}
                <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Business Split
                    </div>

                    {businessAgrupado.length === 0 ? (
                    <div className="text-xs text-slate-400">
                        Sin información para el periodo seleccionado
                    </div>
                    ) : (
                    <div className="space-y-3">
                        {businessAgrupado.map((item, index) => {
                        const porcentaje =
                            totalProspectos > 0
                            ? (item.value / totalProspectos) * 100
                            : 0;

                        return (
                            <div key={item.label}>
                            <div className="mb-1 flex items-center justify-between text-xs">
                                <span className="font-medium text-slate-600">
                                {item.label}
                                </span>

                                <span className="font-bold text-[#001E50]">
                                {item.value} ({porcentaje.toFixed(1)}%)
                                </span>
                            </div>

                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                                <div
                                className={
                                    index === 0
                                    ? "h-full rounded-full bg-[#001E50]"
                                    : "h-full rounded-full bg-blue-500"
                                }
                                style={{ width: `${porcentaje}%` }}
                                />
                            </div>
                            </div>
                        );
                        })}
                    </div>
                    )}
                </div>

                <div className="mt-auto border-t border-slate-100 pt-3 text-xs text-slate-400">
                    Fuente: CRM Volvo Concesionario
                    </div>
            </article>

            {/* PROSPECTOS POR DÍA */}
            <article className="flex min-h-[360px] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                    <h2 className="text-sm font-bold text-[#001E50]">
                    Prospectos por día
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-400">
                    {mes || "—"} {anio || "—"} · actividad diaria
                    </p>
                </div>
                 </div>
                <div className="mt-5 flex h-48 items-end gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 pb-3 pt-6">

                {prospectosPorDia.map((item) => {
                    const height = Math.max(
                        (item.value / maxProspectosDia) * 100,
                        8,
                    );

                    const esPico = picoDia?.day === item.day;

                    return (
                        <div
                        key={item.day}
                        className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                        >
                        <div className="flex h-5 items-end">
                            {esPico && (
                            <span className="text-[9px] font-bold text-blue-600">
                                {item.value}
                            </span>
                            )}
                        </div>

                        <div className="flex w-full flex-1 items-end">
                            <div
                            title={`Día ${item.day}: ${item.value} prospectos`}
                            className={`w-full rounded-t-sm transition-all ${
                                esPico
                                ? "bg-blue-600"
                                : "bg-[#001E50]"
                            }`}
                            style={{
                                height: `${height}%`,
                                minHeight: "8px",
                            }}
                            />
                        </div>

                        <span
                            className={`mt-1 text-[9px] ${
                            esPico
                                ? "font-bold text-[#001E50]"
                                : "text-slate-400"
                            }`}
                        >
                            {item.day}
                        </span>
                        </div>
                    );
                    })}
                    </div>
                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-xs">

                <span className="text-slate-400">
                    Promedio:{" "}
                    <strong className="text-slate-600">
                    {promedioDia} prospectos/día activo
                    </strong>
                </span>

                <span className="font-bold text-[#001E50]">
                    {picoDia
                        ? `Pico: Día ${picoDia.day} (${picoDia.value} prospectos)`
                        : "Sin actividad"}
                </span>
                </div>
            </article>
            </section>
            {/* SEGUNDA FILA DE ANALÍTICA */}
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">

            <RankingCard
                title="Modelo de interés"
                subtitle="Vehículos de mayor interés comercial"
                items={modelosInteres}
                total={totalProspectos}
            />

            <RankingCard
                title="Prospectos por pauta"
                subtitle="Origen de campaña o pauta comercial"
                items={pautasProspectos}
                total={totalProspectos}
            />

            <RankingCard
                title="Motivos de descalificación"
                subtitle="Principales causas de descarte"
                items={motivosDescalificacion}
                total={totalDescalificados}
            />

            </section>
            {/* TERCERA FILA DE ANALÍTICA */}
                <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">

                {/* PROSPECTOS POR ASESOR */}
                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div>
                        <h2 className="text-sm font-bold text-[#001E50]">
                        Prospectos por asesor
                        </h2>

                        <p className="mt-0.5 text-xs text-slate-400">
                        Distribución comercial del periodo
                        </p>
                    </div>

                    <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-bold text-[#001E50]">
                        Total: {totalProspectosAsignados}
                    </span>
                    </div>

                    {prospectosPorAsesor.length === 0 ? (
                    <div className="flex min-h-[220px] items-center justify-center text-sm text-slate-400">
                        Sin prospectos asignados en el periodo seleccionado
                    </div>
                    ) : (
                    <div className="mt-5 space-y-4">
                        {prospectosPorAsesor.map((item) => {
                        const porcentaje =
                            totalProspectosAsignados > 0
                            ? (item.value / totalProspectosAsignados) * 100
                            : 0;

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
                                className="h-full rounded-full bg-[#001E50]"
                                style={{
                                    width: `${porcentaje}%`,
                                }}
                                />
                            </div>
                            </div>
                        );
                        })}
                    </div>
                    )}
                </article>
                {/* CITAS Y ASISTENCIA */}
                    <article className="flex min-h-[300px] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                        <div>
                        <h2 className="text-sm font-bold text-[#001E50]">
                            Citas y asistencia
                        </h2>

                        <p className="mt-0.5 text-xs text-slate-400">
                            Seguimiento de citas del periodo
                        </p>
                        </div>

                        <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-bold text-[#001E50]">
                        Total: {totalCitas}
                        </span>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

                        {/* GENERADAS */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                            Generadas
                        </span>

                        <div className="mt-3 text-3xl font-bold text-[#001E50]">
                            {totalCitas}
                        </div>

                        <p className="mt-1 text-xs text-slate-400">
                            citas registradas
                        </p>
                        </div>

                        {/* ASISTIDAS */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                            Asistidas
                        </span>

                        <div className="mt-3 text-3xl font-bold text-emerald-600">
                            {totalCitasAsistidas}
                        </div>

                        <p className="mt-1 text-xs text-slate-400">
                            con asistencia
                        </p>
                        </div>

                        {/* NO ASISTIDAS */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                            No asistidas
                        </span>

                        <div className="mt-3 text-3xl font-bold text-slate-700">
                            {totalCitasNoAsistidas}
                        </div>

                        <p className="mt-1 text-xs text-slate-400">
                            sin asistencia
                        </p>
                        </div>

                    </div>

                    {/* TASA */}
                    <div className="mt-6">
                        <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600">
                            Tasa de asistencia
                        </span>

                        <span className="text-sm font-bold text-[#001E50]">
                            {tasaAsistencia.toFixed(1)}%
                        </span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full rounded-full bg-[#001E50] transition-all"
                            style={{
                            width: `${Math.min(tasaAsistencia, 100)}%`,
                            }}
                        />
                        </div>
                    </div>

                    <div className="mt-auto pt-5 text-xs text-slate-400">
                        Fuente: CRM Volvo Concesionario
                    </div>

                    </article>
                    </section>

                    {/* DETALLE DE PROSPECTOS */}
                        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                        {/* ENCABEZADO TABLA */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">

                            <div>
                            <h2 className="text-sm font-bold text-[#001E50]">
                                Detalle de prospectos
                            </h2>

                            <p className="mt-0.5 text-xs text-slate-400">
                                Registros correspondientes al periodo seleccionado
                            </p>
                            </div>

                            <span className="rounded-md border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#001E50]">
                            {prospectosTabla.length} registros
                            </span>
                        </div>

                        {prospectosTabla.length === 0 ? (
                            <div className="flex min-h-[180px] items-center justify-center px-5 py-10 text-sm text-slate-400">
                            No hay prospectos para el periodo seleccionado.
                            </div>
                        ) : (
                            <div className="max-h-[520px] overflow-auto">

                            <table className="min-w-[1250px] w-full border-collapse text-left text-xs">

                                <thead className="sticky top-0 z-10 bg-slate-50">
                                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wide text-slate-500">

                                    <th className="whitespace-nowrap px-4 py-3">
                                    Fecha
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3">
                                    Prospecto
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3">
                                    Teléfono
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3">
                                    Canal
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3">
                                    Pauta
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3">
                                    Estado
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3">
                                    Modelo interés
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3">
                                    Asesor
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3">
                                    Cita
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3">
                                    Asistencia
                                    </th>

                                </tr>
                                </thead>

                                <tbody>
                                {prospectosTabla.map((prospecto) => {
                                    const tieneCita = tieneValor(prospecto.ultima_cita);

                                    const asistio =
                                    prospecto.asistencia === true ||
                                    normalizarTexto(prospecto.asistencia) === "true";

                                    return (
                                    <tr
                                        key={prospecto.id}
                                        className="border-b border-slate-100 transition hover:bg-slate-50"
                                    >

                                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                                        {formatearFecha(prospecto.creado)}
                                        </td>

                                        <td className="max-w-[220px] px-4 py-3">
                                        <div
                                            className="truncate font-semibold text-slate-800"
                                            title={prospecto.nombre || ""}
                                        >
                                            {prospecto.nombre || "Sin nombre"}
                                        </div>

                                        <div
                                            className="mt-0.5 truncate text-[11px] text-slate-400"
                                            title={prospecto.correo || ""}
                                        >
                                            {prospecto.correo || "Sin correo"}
                                        </div>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                        {prospecto.telefono || "—"}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                        {prospecto.canal_contacto || "—"}
                                        </td>

                                        <td
                                        className="max-w-[260px] px-4 py-3 text-slate-600"
                                        title={prospecto.pauta || ""}
                                        >
                                        <div className="truncate">
                                            {prospecto.pauta || "—"}
                                        </div>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                        <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-600">
                                            {prospecto.estado || "Sin estatus"}
                                        </span>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                        {prospecto.auto_interes || "—"}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                        {prospecto.asesor_ventas || "Sin asignar"}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                        {tieneCita ? (
                                            <span className="font-semibold text-[#001E50]">
                                            {formatearFecha(prospecto.ultima_cita_agendada)}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">
                                            Sin cita
                                            </span>
                                        )}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                        {tieneCita ? (
                                            asistio ? (
                                            <span className="rounded-md bg-emerald-50 px-2 py-1 font-semibold text-emerald-600">
                                                Asistió
                                            </span>
                                            ) : (
                                            <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-500">
                                                No asistió
                                            </span>
                                            )
                                        ) : (
                                            <span className="text-slate-400">
                                            —
                                            </span>
                                        )}
                                        </td>

                                    </tr>
                                    );
                                })}
                                </tbody>

                            </table>
                            </div>
                        )}

                        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
                            Fuente: CRM Volvo Concesionario
                        </div>

                        </section>
        </div>
        );
}