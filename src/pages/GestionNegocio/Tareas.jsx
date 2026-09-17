import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    RefreshCw,
    Search,
    X,
} from "lucide-react";

import { http, toQuery } from "../../lib/apiClient";

const ENDPOINT = "/salesforce/api/tareas/";
const ENDPOINT_OPCIONES =
    "/salesforce/api/tareas/opciones-filtros/";

const FILTROS_INICIALES = {
    q: "",
    anio: "",
    mes: "",
    fecha_desde: "",
    fecha_hasta: "",
    estado: "",
    asignado: "",
    prioridad: "",
    tarea: "",
    etapa_de_la_oportunidad: "",
};

const MESES = [
    { value: "1", label: "ENE" },
    { value: "2", label: "FEB" },
    { value: "3", label: "MAR" },
    { value: "4", label: "ABR" },
    { value: "5", label: "MAY" },
    { value: "6", label: "JUN" },
    { value: "7", label: "JUL" },
    { value: "8", label: "AGO" },
    { value: "9", label: "SEP" },
    { value: "10", label: "OCT" },
    { value: "11", label: "NOV" },
    { value: "12", label: "DIC" },
];

function normalizarTexto(valor) {
    return String(valor ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function formatearFechaHora(valor) {
    if (!valor) return "—";

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
        return String(valor);
    }

    return fecha.toLocaleString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function KpiCard({
    titulo,
    valor,
    descripcion,
    icono: Icono,
    iconClass = "bg-blue-50 text-blue-600",
}) {
    return (
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {titulo}
                </span>

                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                >
                    <Icono size={20} />
                </div>
            </div>

            <div className="mt-5 flex items-end gap-2">
                <span className="text-3xl font-bold text-[#001E50]">
                    {valor}
                </span>

                {descripcion && (
                    <span className="mb-1 text-xs text-slate-400">
                        {descripcion}
                    </span>
                )}
            </div>
        </article>
    );
}

function CampoFiltro({
    label,
    value,
    onChange,
    placeholder,
    opciones = [],
}) {
    const tieneOpciones =
        Array.isArray(opciones) && opciones.length > 0;

    return (
        <label className="flex min-w-0 flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {label}
            </span>

            {tieneOpciones ? (
                <select
                    value={value}
                    onChange={(event) =>
                        onChange(event.target.value)
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#001E50] focus:ring-1 focus:ring-[#001E50]"
                >
                    <option value="">Todos</option>

                    {opciones.map((opcion) => (
                        <option
                            key={opcion}
                            value={opcion}
                        >
                            {opcion}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    type="text"
                    value={value}
                    onChange={(event) =>
                        onChange(event.target.value)
                    }
                    placeholder={placeholder}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#001E50] focus:ring-1 focus:ring-[#001E50]"
                />
            )}
        </label>
    );
}

function esCompletada(valor) {
    const estado = normalizarTexto(valor);

    return (
        estado.includes("complet") ||
        estado.includes("cerrad") ||
        estado.includes("finaliz")
    );
}

function esPrioridadAlta(valor) {
    const prioridad = normalizarTexto(valor);

    return (
        prioridad === "alta" ||
        prioridad === "high"
    );
}

export default function TareasSalesforce() {
    const [filtros, setFiltros] = useState(
        FILTROS_INICIALES,
    );

    const [filtrosAplicados, setFiltrosAplicados] = useState(
        FILTROS_INICIALES,
    );

    const [registros, setRegistros] = useState([]);
    const [total, setTotal] = useState(0);

    const [pagina, setPagina] = useState(1);
    const [tamanoPagina, setTamanoPagina] = useState(50);

    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");
    const [opcionesFiltros, setOpcionesFiltros] = useState({});

    const anioActual = new Date().getFullYear();

    const aniosDisponibles = Array.from(
        { length: 10 },
        (_, index) => anioActual - index,
    );

    useEffect(() => {
        let activo = true;

        async function cargarOpcionesFiltros() {
            try {
                const response = await http(ENDPOINT_OPCIONES);

                if (!activo) return;

                setOpcionesFiltros(response || {});
            } catch (err) {
                console.error(
                    "Error consultando opciones de filtros Salesforce:",
                    err,
                );
            }
        }

        cargarOpcionesFiltros();

        return () => {
            activo = false;
        };
    }, []);

    useEffect(() => {
        let activo = true;

        async function cargarTareas() {
            try {
                setCargando(true);
                setError("");

                const response = await http(
                    `${ENDPOINT}${toQuery({
                        ...filtrosAplicados,
                        page: pagina,
                        page_size: tamanoPagina,
                    })}`,
                );

                if (!activo) return;

                setRegistros(
                    Array.isArray(response?.results)
                        ? response.results
                        : [],
                );

                setTotal(Number(response?.count || 0));
            } catch (err) {
                if (!activo) return;

                console.error(
                    "Error consultando tareas Salesforce:",
                    err,
                );

                setRegistros([]);
                setTotal(0);

                setError(
                    err?.message ||
                    "No fue posible consultar las tareas.",
                );
            } finally {
                if (activo) {
                    setCargando(false);
                }
            }
        }

        cargarTareas();

        return () => {
            activo = false;
        };
    }, [
        filtrosAplicados,
        pagina,
        tamanoPagina,
    ]);

    const totalPaginas = Math.max(
        Math.ceil(total / tamanoPagina),
        1,
    );

    const completadasVisibles = useMemo(
        () =>
            registros.filter((item) =>
                esCompletada(item.estado),
            ).length,
        [registros],
    );

    const prioridadAltaVisible = useMemo(
        () =>
            registros.filter((item) =>
                esPrioridadAlta(item.prioridad),
            ).length,
        [registros],
    );

    const cambiarFiltro = (campo, valor) => {
        setFiltros((actual) => ({
            ...actual,
            [campo]: valor,
        }));
    };

    const aplicarFiltros = (event) => {
        event.preventDefault();

        setPagina(1);

        setFiltrosAplicados({
            ...filtros,
            mes: filtros.anio ? filtros.mes : "",
        });
    };

    const limpiarFiltros = () => {
        setFiltros(FILTROS_INICIALES);
        setFiltrosAplicados(FILTROS_INICIALES);
        setPagina(1);
    };

    const recargar = () => {
        setPagina(1);

        setFiltrosAplicados({
            ...filtrosAplicados,
        });
    };

    return (
        <div className="mx-auto w-full max-w-[1500px] space-y-6 px-4 pb-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-slate-900">
                    Tareas Salesforce
                </h1>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* FILTROS */}
            <form
                onSubmit={aplicarFiltros}
                className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
                        <Search
                            size={17}
                            className="shrink-0 text-slate-400"
                        />

                        <input
                            type="text"
                            value={filtros.q}
                            onChange={(event) =>
                                cambiarFiltro(
                                    "q",
                                    event.target.value,
                                )
                            }
                            placeholder="Buscar compañía, oportunidad, contacto, lead, asunto o nombre..."
                            className="h-11 min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                        />

                        {filtros.q && (
                            <button
                                type="button"
                                onClick={() => cambiarFiltro("q", "")}
                                className="text-slate-400 hover:text-slate-700"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="submit"
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#001E50] px-4 text-sm font-semibold text-white hover:bg-[#002b73]"
                        >
                            <Search size={16} />
                            Consultar
                        </button>

                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                        >
                            <X size={16} />
                            Limpiar
                        </button>

                        <button
                            type="button"
                            disabled={cargando}
                            onClick={recargar}
                            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                        >
                            <RefreshCw
                                size={16}
                                className={cargando ? "animate-spin" : ""}
                            />
                        </button>
                    </div>
                </div>

                {/* PERIODO */}
                <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2 pb-2 text-[#001E50]">
                        <CalendarDays size={17} />

                        <span className="text-xs font-bold uppercase tracking-wide">
                            Periodo
                        </span>
                    </div>

                    <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold uppercase text-slate-500">
                            Año
                        </span>

                        <select
                            value={filtros.anio}
                            onChange={(event) => {
                                const valor = event.target.value;

                                setFiltros((actual) => ({
                                    ...actual,
                                    anio: valor,
                                    mes: valor ? actual.mes : "",
                                }));
                            }}
                            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
                        >
                            <option value="">Todos</option>

                            {aniosDisponibles.map((anio) => (
                                <option
                                    key={anio}
                                    value={anio}
                                >
                                    {anio}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold uppercase text-slate-500">
                            Mes
                        </span>

                        <select
                            value={filtros.mes}
                            disabled={!filtros.anio}
                            onChange={(event) =>
                                cambiarFiltro(
                                    "mes",
                                    event.target.value,
                                )
                            }
                            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                        >
                            <option value="">Todos</option>

                            {MESES.map((mes) => (
                                <option
                                    key={mes.value}
                                    value={mes.value}
                                >
                                    {mes.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold uppercase text-slate-500">
                            Desde
                        </span>

                        <input
                            type="date"
                            value={filtros.fecha_desde}
                            onChange={(event) =>
                                cambiarFiltro(
                                    "fecha_desde",
                                    event.target.value,
                                )
                            }
                            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                        />
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold uppercase text-slate-500">
                            Hasta
                        </span>

                        <input
                            type="date"
                            value={filtros.fecha_hasta}
                            onChange={(event) =>
                                cambiarFiltro(
                                    "fecha_hasta",
                                    event.target.value,
                                )
                            }
                            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                        />
                    </label>
                </div>

                {/* FILTROS DE TAREAS */}
                <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    <CampoFiltro
                        label="Estado"
                        value={filtros.estado}
                        onChange={(valor) =>
                            cambiarFiltro("estado", valor)
                        }
                        placeholder="Estado"
                        opciones={opcionesFiltros.estado || []}
                    />

                    <CampoFiltro
                        label="Asignado"
                        value={filtros.asignado}
                        onChange={(valor) =>
                            cambiarFiltro("asignado", valor)
                        }
                        placeholder="Usuario asignado"
                        opciones={opcionesFiltros.asignado || []}
                    />

                    <CampoFiltro
                        label="Prioridad"
                        value={filtros.prioridad}
                        onChange={(valor) =>
                            cambiarFiltro("prioridad", valor)
                        }
                        placeholder="Prioridad"
                        opciones={opcionesFiltros.prioridad || []}
                    />

                    <CampoFiltro
                        label="Tarea"
                        value={filtros.tarea}
                        onChange={(valor) =>
                            cambiarFiltro("tarea", valor)
                        }
                        placeholder="Tipo de tarea"
                        opciones={opcionesFiltros.tarea || []}
                    />

                    <CampoFiltro
                        label="Etapa oportunidad"
                        value={
                            filtros.etapa_de_la_oportunidad
                        }
                        onChange={(valor) =>
                            cambiarFiltro(
                                "etapa_de_la_oportunidad",
                                valor,
                            )
                        }
                        placeholder="Etapa"
                        opciones={opcionesFiltros.etapa_de_la_oportunidad || []}
                    />
                </div>
            </form>

            {/* KPIS */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    titulo="Tareas"
                    valor={
                        cargando
                            ? "..."
                            : total.toLocaleString("es-MX")
                    }
                    descripcion="filtradas"
                    icono={ClipboardList}
                />

                <KpiCard
                    titulo="Registros visibles"
                    valor={cargando ? "..." : registros.length}
                    descripcion="página actual"
                    icono={CalendarDays}
                    iconClass="bg-indigo-50 text-indigo-600"
                />

                <KpiCard
                    titulo="Completadas"
                    valor={
                        cargando
                            ? "..."
                            : completadasVisibles
                    }
                    descripcion="página actual"
                    icono={CheckCircle2}
                    iconClass="bg-emerald-50 text-emerald-600"
                />

                <KpiCard
                    titulo="Prioridad alta"
                    valor={
                        cargando
                            ? "..."
                            : prioridadAltaVisible
                    }
                    descripcion="página actual"
                    icono={AlertCircle}
                    iconClass="bg-red-50 text-red-500"
                />
            </section>

            {/* TABLA */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
                    <div>
                        <h2 className="text-sm font-bold text-[#001E50]">
                            Detalle de tareas
                        </h2>

                        <p className="mt-0.5 text-xs text-slate-400">
                            Actividades comerciales provenientes de Salesforce.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="rounded-md border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#001E50]">
                            {total.toLocaleString("es-MX")} registros
                        </span>

                        <select
                            value={tamanoPagina}
                            onChange={(event) => {
                                setTamanoPagina(
                                    Number(event.target.value),
                                );
                                setPagina(1);
                            }}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600 outline-none"
                        >
                            <option value={25}>25 filas</option>
                            <option value={50}>50 filas</option>
                            <option value={100}>100 filas</option>
                            <option value={250}>250 filas</option>
                            <option value={500}>500 filas</option>
                        </select>
                    </div>
                </div>

                {cargando ? (
                    <div className="flex min-h-[260px] items-center justify-center gap-2 text-sm text-slate-400">
                        <RefreshCw
                            size={18}
                            className="animate-spin"
                        />

                        Consultando tareas...
                    </div>
                ) : registros.length === 0 ? (
                    <div className="flex min-h-[260px] items-center justify-center text-sm text-slate-400">
                        No hay tareas para los filtros seleccionados.
                    </div>
                ) : (
                    <div className="max-h-[620px] overflow-auto">
                        <table className="w-full min-w-[2800px] border-collapse text-left text-xs">
                            <thead className="sticky top-0 z-10 bg-slate-50">
                                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                    <th className="px-4 py-3">
                                        Fecha
                                    </th>

                                    <th className="px-4 py-3">
                                        Asunto
                                    </th>

                                    <th className="px-4 py-3">
                                        Estado
                                    </th>

                                    <th className="px-4 py-3">
                                        Prioridad
                                    </th>

                                    <th className="px-4 py-3">
                                        Asignado
                                    </th>

                                    <th className="px-4 py-3">
                                        Tarea
                                    </th>

                                    <th className="px-4 py-3">
                                        Compañía / Cuenta
                                    </th>

                                    <th className="px-4 py-3">
                                        Oportunidad
                                    </th>

                                    <th className="px-4 py-3">
                                        Contacto
                                    </th>

                                    <th className="px-4 py-3">
                                        Lead
                                    </th>

                                    <th className="px-4 py-3">
                                        Nombre
                                    </th>

                                    <th className="px-4 py-3">
                                        Subtipo evento
                                    </th>

                                    <th className="px-4 py-3">
                                        Subtipo tarea
                                    </th>

                                    <th className="px-4 py-3">
                                        Etapa oportunidad
                                    </th>

                                    <th className="px-4 py-3">
                                        Contacto origen
                                    </th>

                                    <th className="px-4 py-3">
                                        Origen prospecto oportunidad
                                    </th>

                                    <th className="px-4 py-3">
                                        Comentarios
                                    </th>

                                    <th className="px-4 py-3">
                                        Comentarios completos
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {registros.map((item, index) => (
                                    <tr
                                        key={`${item.fecha}-${item.asunto}-${item.asignado}-${index}`}
                                        className="border-b border-slate-100 transition hover:bg-slate-50"
                                    >
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                                            {formatearFechaHora(
                                                item.fecha,
                                            )}
                                        </td>

                                        <td className="max-w-[300px] px-4 py-3">
                                            <div
                                                className="truncate font-semibold text-slate-800"
                                                title={item.asunto || ""}
                                            >
                                                {item.asunto ||
                                                    "Sin asunto"}
                                            </div>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            <span
                                                className={`rounded-md px-2 py-1 font-semibold ${esCompletada(
                                                    item.estado,
                                                )
                                                        ? "bg-emerald-50 text-emerald-600"
                                                        : "bg-blue-50 text-[#001E50]"
                                                    }`}
                                            >
                                                {item.estado ||
                                                    "Sin estado"}
                                            </span>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            <span
                                                className={`rounded-md px-2 py-1 font-semibold ${esPrioridadAlta(
                                                    item.prioridad,
                                                )
                                                        ? "bg-red-50 text-red-500"
                                                        : "bg-slate-100 text-slate-600"
                                                    }`}
                                            >
                                                {item.prioridad || "—"}
                                            </span>
                                        </td>

                                        <td className="max-w-[220px] px-4 py-3 text-slate-600">
                                            <div
                                                className="truncate"
                                                title={item.asignado || ""}
                                            >
                                                {item.asignado || "—"}
                                            </div>
                                        </td>

                                        <td className="max-w-[200px] px-4 py-3 text-slate-600">
                                            <div className="truncate">
                                                {item.tarea || "—"}
                                            </div>
                                        </td>

                                        <td className="max-w-[260px] px-4 py-3 text-slate-600">
                                            <div
                                                className="truncate"
                                                title={
                                                    item.compania_cuenta ||
                                                    ""
                                                }
                                            >
                                                {item.compania_cuenta ||
                                                    "—"}
                                            </div>
                                        </td>

                                        <td className="max-w-[300px] px-4 py-3 text-slate-600">
                                            <div
                                                className="truncate"
                                                title={
                                                    item.oportunidad || ""
                                                }
                                            >
                                                {item.oportunidad || "—"}
                                            </div>
                                        </td>

                                        <td className="max-w-[220px] px-4 py-3 text-slate-600">
                                            <div className="truncate">
                                                {item.contacto || "—"}
                                            </div>
                                        </td>

                                        <td className="max-w-[220px] px-4 py-3 text-slate-600">
                                            <div className="truncate">
                                                {item.lead || "—"}
                                            </div>
                                        </td>

                                        <td className="max-w-[220px] px-4 py-3 text-slate-600">
                                            <div className="truncate">
                                                {item.nombre || "—"}
                                            </div>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                            {item.subtipo_de_evento ||
                                                "—"}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                            {item.subtipo_de_tarea ||
                                                "—"}
                                        </td>

                                        <td className="max-w-[220px] px-4 py-3 text-slate-600">
                                            <div className="truncate">
                                                {item.etapa_de_la_oportunidad ||
                                                    "—"}
                                            </div>
                                        </td>

                                        <td className="max-w-[220px] px-4 py-3 text-slate-600">
                                            <div className="truncate">
                                                {item.contacto_origen ||
                                                    "—"}
                                            </div>
                                        </td>

                                        <td className="max-w-[280px] px-4 py-3 text-slate-600">
                                            <div
                                                className="truncate"
                                                title={
                                                    item.origen_del_prospecto_de_la_oportunidad ||
                                                    ""
                                                }
                                            >
                                                {item.origen_del_prospecto_de_la_oportunidad ||
                                                    "—"}
                                            </div>
                                        </td>

                                        <td className="max-w-[350px] px-4 py-3 text-slate-500">
                                            <div
                                                className="truncate"
                                                title={
                                                    item.comentarios || ""
                                                }
                                            >
                                                {item.comentarios || "—"}
                                            </div>
                                        </td>

                                        <td className="max-w-[450px] px-4 py-3 text-slate-500">
                                            <div
                                                className="truncate"
                                                title={
                                                    item.comentarios_completos ||
                                                    ""
                                                }
                                            >
                                                {item.comentarios_completos ||
                                                    "—"}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-slate-400">
                        Página{" "}
                        <strong className="text-slate-600">
                            {pagina}
                        </strong>{" "}
                        de{" "}
                        <strong className="text-slate-600">
                            {totalPaginas}
                        </strong>
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={pagina <= 1 || cargando}
                            onClick={() =>
                                setPagina((actual) =>
                                    Math.max(actual - 1, 1),
                                )
                            }
                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft size={15} />
                            Anterior
                        </button>

                        <button
                            type="button"
                            disabled={
                                pagina >= totalPaginas ||
                                cargando
                            }
                            onClick={() =>
                                setPagina((actual) =>
                                    Math.min(
                                        actual + 1,
                                        totalPaginas,
                                    ),
                                )
                            }
                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Siguiente
                            <ChevronRight size={15} />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}