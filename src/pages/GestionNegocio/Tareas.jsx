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

    useEffect(() => {
        setPagina(1);
        setFiltrosAplicados({
            ...filtros,
            mes: filtros.anio ? filtros.mes : "",
        });
    }, [filtros]);

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

        <div className="w-full space-y-6 bg-white px-4 py-6 text-[#141414] md:px-8 font-bahnschrift font-light">
            <style>{`
                .font-bahnschrift {
                    font-family: 'Bahnschrift Light', 'Bahnschrift', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
                }
            `}</style>

            {error && (
                <div className="border-b border-red-200 bg-red-50 p-3 text-xs font-light text-red-600">{error}</div>
            )}

            <section className="relative w-full overflow-hidden border-b border-[#E5E5E5] p-6 text-white md:p-8 font-light">
                <video className="absolute inset-0 h-full w-full object-cover" autoPlay loop muted playsInline preload="metadata">
                    <source src="../video.webm" type="video/webm" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/55 to-black/90" />
                <div className="relative z-10">
                    <div className="flex flex-col gap-2 border-b border-white/20 pb-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <span className="text-[10px] font-light uppercase tracking-[0.3em] text-slate-300">
                                Volvo Suecia Car Angelopolis · CRM Dashboard
                            </span>
                            <h1 className="mt-1 text-2xl font-light tracking-tight text-white md:text-3xl">
                                Rendimiento Comercial de Tareas
                            </h1>
                        </div>
                        <div className="text-xs font-light tracking-wide text-slate-300">Salesforce · Gestión de Negocio</div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
                        <div className="lg:col-span-5">
                            <p className="text-[11px] font-light uppercase tracking-[0.2em] text-slate-300">Tareas Filtradas</p>
                            <div className="mt-1 flex items-baseline gap-3">
                                <h2 className="text-5xl font-light tracking-tight text-white md:text-6xl">
                                    {cargando ? "..." : total.toLocaleString("es-MX")}
                                </h2>
                                <span className="border border-white/20 bg-black/40 px-2.5 py-1 text-xs font-light tracking-wider text-slate-200 backdrop-blur-md">
                                    Salesforce
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-px border border-white/20 bg-white/20 sm:grid-cols-3 lg:col-span-7">
                            <div className="bg-black/50 p-4 backdrop-blur-xs">
                                <p className="text-[9px] font-light uppercase tracking-[0.2em] text-slate-300">Registros visibles</p>
                                <p className="mt-1 text-2xl font-light text-white">{registros.length}</p>
                                <p className="mt-0.5 text-[10px] font-light text-slate-400">Página actual</p>
                            </div>
                            <div className="bg-black/50 p-4 backdrop-blur-xs">
                                <p className="text-[9px] font-light uppercase tracking-[0.2em] text-slate-300">Completadas</p>
                                <p className="mt-1 text-2xl font-light text-emerald-300">{completadasVisibles}</p>
                                <p className="mt-0.5 text-[10px] font-light text-slate-400">Página actual</p>
                            </div>
                            <div className="bg-black/50 p-4 backdrop-blur-xs">
                                <p className="text-[9px] font-light uppercase tracking-[0.2em] text-slate-300">Prioridad alta</p>
                                <p className="mt-1 text-2xl font-light text-rose-300">{prioridadAltaVisible}</p>
                                <p className="mt-0.5 text-[10px] font-light text-slate-400">Página actual</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="space-y-4 border-b border-[#E5E5E5] pb-4 pt-2 font-light">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-2 border-b border-[#E5E5E5] px-1">
                        <Search size={14} className="shrink-0 text-[#707070]" strokeWidth={1.5} />
                        <input type="text" value={filtros.q} onChange={(event) => cambiarFiltro("q", event.target.value)}
                            placeholder="Buscar compañía, oportunidad, contacto, lead, asunto o nombre..."
                            className="h-9 min-w-0 flex-1 bg-transparent text-xs font-light text-[#141414] outline-none placeholder:text-[#A0A0A0]" />
                        {filtros.q && (
                            <button type="button" onClick={() => cambiarFiltro("q", "")} className="text-[#707070] hover:text-[#141414]">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={limpiarFiltros} className="h-9 border-b border-[#E5E5E5] px-3 text-xs font-light text-[#707070]">
                            Limpiar
                        </button>
                        <button type="button" onClick={recargar} disabled={cargando}
                            className="flex h-9 items-center px-2 text-[#707070] disabled:opacity-50" title="Recargar">
                            <RefreshCw size={14} className={cargando ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 border-b border-[#E5E5E5] py-1">
                        <CalendarDays size={13} strokeWidth={1.5} />
                        <select value={filtros.anio} onChange={(event) => {
                            const valor = event.target.value;
                            setFiltros((actual) => ({ ...actual, anio: valor, mes: valor ? actual.mes : "" }));
                        }} className="bg-transparent text-xs font-light text-[#141414] outline-none">
                            <option value="">Todos los años</option>
                            {aniosDisponibles.map((anio) => <option key={anio} value={anio}>{anio}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                        <button type="button" onClick={() => cambiarFiltro("mes", "")}
                            className={`px-2 py-1 text-xs font-light ${!filtros.mes ? "bg-[#141414] text-white" : "text-[#707070] hover:bg-[#F5F5F5]"}`}>
                            TODOS
                        </button>
                        {MESES.map((item) => (
                            <button key={item.value} type="button" disabled={!filtros.anio}
                                onClick={() => cambiarFiltro("mes", String(item.value))}
                                className={`px-2 py-1 text-xs font-light tracking-wider disabled:opacity-30 ${
                                    String(filtros.mes) === String(item.value) ? "bg-[#141414] text-white" : "text-[#707070] hover:bg-[#F5F5F5]"
                                }`}>
                                {item.label.slice(0, 3).toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <label className="flex items-center gap-2 border-b border-[#E5E5E5] py-1 text-[10px] uppercase tracking-[0.12em] text-[#707070]">
                        Desde
                        <input type="date" value={filtros.fecha_desde} onChange={(e) => cambiarFiltro("fecha_desde", e.target.value)}
                            className="bg-transparent text-xs font-light text-[#141414] outline-none" />
                    </label>
                    <label className="flex items-center gap-2 border-b border-[#E5E5E5] py-1 text-[10px] uppercase tracking-[0.12em] text-[#707070]">
                        Hasta
                        <input type="date" value={filtros.fecha_hasta} onChange={(e) => cambiarFiltro("fecha_hasta", e.target.value)}
                            className="bg-transparent text-xs font-light text-[#141414] outline-none" />
                    </label>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <CampoFiltro label="Estado" value={filtros.estado} onChange={(v) => cambiarFiltro("estado", v)}
                        opciones={opcionesFiltros.estados || []} placeholder="Todos" />
                    <CampoFiltro label="Asignado" value={filtros.asignado} onChange={(v) => cambiarFiltro("asignado", v)}
                        opciones={opcionesFiltros.asignados || []} placeholder="Todos" />
                    <CampoFiltro label="Prioridad" value={filtros.prioridad} onChange={(v) => cambiarFiltro("prioridad", v)}
                        opciones={opcionesFiltros.prioridades || []} placeholder="Todos" />
                    <CampoFiltro label="Tarea" value={filtros.tarea} onChange={(v) => cambiarFiltro("tarea", v)}
                        opciones={opcionesFiltros.tareas || []} placeholder="Todos" />
                    <CampoFiltro label="Etapa oportunidad" value={filtros.etapa_oportunidad} onChange={(v) => cambiarFiltro("etapa_oportunidad", v)}
                        opciones={opcionesFiltros.etapas_oportunidad || []} placeholder="Todas" />
                </div>
            </div>

            {/* TABLA */}

            <section className="w-full overflow-hidden border-b border-[#E5E5E5] bg-white font-light">

                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">

                    <div>

                        <h2 className="text-xs font-light uppercase tracking-[0.2em] text-[#141414]">

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