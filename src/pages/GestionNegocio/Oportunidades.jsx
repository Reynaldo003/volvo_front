import { useEffect, useMemo, useState } from "react";

import {

    Briefcase,

    CalendarDays,

    Car,

    ChevronLeft,

    ChevronRight,

    DollarSign,

    RefreshCw,

    Search,

    X,

} from "lucide-react";

import { http, toQuery } from "../../lib/apiClient";

const ENDPOINT = "/salesforce/api/oportunidades/";

const ENDPOINT_OPCIONES =

    "/salesforce/api/oportunidades/opciones-filtros/";

const FILTROS_INICIALES = {

    q: "",

    anio: "",

    mes: "",

    fecha_desde: "",

    fecha_hasta: "",

    origen: "",

    etapa: "",

    propietario_oportunidad: "",

    modelo_interes: "",

    prueba_manejo: "",

    motivo_perdida: "",

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

function tieneValor(valor) {

    return (

        valor !== null &&

        valor !== undefined &&

        String(valor).trim() !== ""

    );

}

function formatearFecha(valor) {

    if (!valor) return "—";

    const texto = String(valor);

    const coincidencia = texto.match(

        /^(\d{4})-(\d{2})-(\d{2})/,

    );

    if (coincidencia) {

        const [, anio, mes, dia] = coincidencia;

        return `${dia}/${mes}/${anio}`;

    }

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {

        return texto;

    }

    return fecha.toLocaleDateString("es-MX", {

        day: "2-digit",

        month: "2-digit",

        year: "numeric",

    });

}

function numeroDesdeTexto(valor) {

    if (!tieneValor(valor)) return 0;

    const limpio = String(valor)

        .replace(/,/g, "")

        .replace(/[^\d.-]/g, "");

    const numero = Number(limpio);

    return Number.isFinite(numero) ? numero : 0;

}

function formatearMoneda(valor) {

    const numero = numeroDesdeTexto(valor);

    if (!numero && numero !== 0) {

        return valor || "—";

    }

    return new Intl.NumberFormat("es-MX", {

        style: "currency",

        currency: "MXN",

        maximumFractionDigits: 0,

    }).format(numero);

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

export default function OportunidadesSalesforce() {

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

        async function cargarOportunidades() {

            try {

                setCargando(true);

                setError("");

                const parametros = {

                    ...filtrosAplicados,

                    page: pagina,

                    page_size: tamanoPagina,

                };

                const response = await http(

                    `${ENDPOINT}${toQuery(parametros)}`,

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

                    "Error consultando oportunidades Salesforce:",

                    err,

                );

                setRegistros([]);

                setTotal(0);

                setError(

                    err?.message ||

                    "No fue posible consultar las oportunidades.",

                );

            } finally {

                if (activo) {

                    setCargando(false);

                }

            }

        }

        cargarOportunidades();

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

    const totalConVin = useMemo(

        () =>

            registros.filter((item) =>

                tieneValor(item.vin_vehiculo_facturado),

            ).length,

        [registros],

    );

    const importeVisible = useMemo(

        () =>

            registros.reduce(

                (acumulado, item) =>

                    acumulado +

                    numeroDesdeTexto(item.importe),

                0,

            ),

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
                <div className="border-b border-red-200 bg-red-50 p-3 text-xs font-light text-red-600">
                    {error}
                </div>
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
                                Rendimiento Comercial de Oportunidades
                            </h1>
                        </div>
                        <div className="text-xs font-light tracking-wide text-slate-300">
                            Salesforce · Gestión de Negocio
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
                        <div className="lg:col-span-5">
                            <p className="text-[11px] font-light uppercase tracking-[0.2em] text-slate-300">
                                Oportunidades Filtradas
                            </p>
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
                                <p className="mt-1 text-2xl font-light text-white">{registros.length.toLocaleString("es-MX")}</p>
                                <p className="mt-0.5 text-[10px] font-light text-slate-400">de {tamanoPagina} por página</p>
                            </div>
                            <div className="bg-black/50 p-4 backdrop-blur-xs">
                                <p className="text-[9px] font-light uppercase tracking-[0.2em] text-slate-300">Con VIN</p>
                                <p className="mt-1 text-2xl font-light text-emerald-300">{totalConVin}</p>
                                <p className="mt-0.5 text-[10px] font-light text-slate-400">Página actual</p>
                            </div>
                            <div className="bg-black/50 p-4 backdrop-blur-xs">
                                <p className="text-[9px] font-light uppercase tracking-[0.2em] text-slate-300">Importe visible</p>
                                <p className="mt-1 text-xl font-light text-white">{formatearMoneda(importeVisible)}</p>
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
                        <input
                            type="text"
                            value={filtros.q}
                            onChange={(event) => cambiarFiltro("q", event.target.value)}
                            placeholder="Buscar oportunidad, cuenta, propietario, modelo o VIN..."
                            className="h-9 min-w-0 flex-1 bg-transparent text-xs font-light text-[#141414] outline-none placeholder:text-[#A0A0A0]"
                        />
                        {filtros.q && (
                            <button type="button" onClick={() => cambiarFiltro("q", "")} className="text-[#707070] hover:text-[#141414]">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={limpiarFiltros} className="h-9 border-b border-[#E5E5E5] px-3 text-xs font-light text-[#707070]">
                            Limpiar
                        </button>
                        <button type="button" onClick={recargar} disabled={cargando}
                            className="flex h-9 items-center px-2 text-[#707070] disabled:opacity-50" title="Recargar">
                            <RefreshCw size={14} className={cargando ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-end gap-3">
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
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <CampoFiltro label="Propietario" value={filtros.propietario} onChange={(v) => cambiarFiltro("propietario", v)}
                        opciones={opcionesFiltros.propietarios || []} placeholder="Todos" />
                    <CampoFiltro label="Etapa" value={filtros.etapa} onChange={(v) => cambiarFiltro("etapa", v)}
                        opciones={opcionesFiltros.etapas || []} placeholder="Todas" />
                    <CampoFiltro label="Modelo" value={filtros.modelo} onChange={(v) => cambiarFiltro("modelo", v)}
                        opciones={opcionesFiltros.modelos || []} placeholder="Todos" />
                    <CampoFiltro label="Cuenta" value={filtros.cuenta} onChange={(v) => cambiarFiltro("cuenta", v)}
                        opciones={opcionesFiltros.cuentas || []} placeholder="Todas" />
                </div>
            </div>

            {/* TABLA */}

            <section className="w-full overflow-hidden border-b border-[#E5E5E5] bg-white font-light">

                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">

                    <div>

                        <h2 className="text-xs font-light uppercase tracking-[0.2em] text-[#141414]">

                            Detalle de oportunidades

                        </h2>

                        <p className="mt-0.5 text-xs text-slate-400">

                            Información consultada directamente desde

                            Salesforce.

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

                        Consultando oportunidades...

                    </div>

                ) : registros.length === 0 ? (

                    <div className="flex min-h-[260px] items-center justify-center text-sm text-slate-400">

                        No hay oportunidades para los filtros

                        seleccionados.

                    </div>

                ) : (

                    <div className="max-h-[620px] overflow-auto">

                        <table className="w-full min-w-[2500px] border-collapse text-left text-xs">

                            <thead className="sticky top-0 z-10 bg-slate-50">

                                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wide text-slate-500">

                                    <th className="px-4 py-3">

                                        Fecha creación

                                    </th>

                                    <th className="px-4 py-3">

                                        Oportunidad

                                    </th>

                                    <th className="px-4 py-3">

                                        Cuenta

                                    </th>

                                    <th className="px-4 py-3">

                                        Etapa

                                    </th>

                                    <th className="px-4 py-3">

                                        Origen

                                    </th>

                                    <th className="px-4 py-3">

                                        Propietario

                                    </th>

                                    <th className="px-4 py-3">

                                        Modelo interés

                                    </th>

                                    <th className="px-4 py-3">

                                        VIN

                                    </th>

                                    <th className="px-4 py-3">

                                        Importe

                                    </th>

                                    <th className="px-4 py-3">

                                        Enganche

                                    </th>

                                    <th className="px-4 py-3">

                                        Fecha cierre

                                    </th>

                                    <th className="px-4 py-3">

                                        Prueba manejo

                                    </th>

                                    <th className="px-4 py-3">

                                        Campaña

                                    </th>

                                    <th className="px-4 py-3">

                                        Duración etapa

                                    </th>

                                    <th className="px-4 py-3">

                                        Motivo pérdida

                                    </th>

                                    <th className="px-4 py-3">

                                        Loss reason

                                    </th>

                                    <th className="px-4 py-3">

                                        Promesa entrega

                                    </th>

                                    <th className="px-4 py-3">

                                        Cuenta personal origen

                                    </th>

                                    <th className="px-4 py-3">

                                        Hobbies

                                    </th>

                                    <th className="px-4 py-3">

                                        Descripción

                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {registros.map((item, index) => (

                                    <tr

                                        key={`${item.nombre_oportunidad}-${item.fecha_creacion}-${index}`}

                                        className="border-b border-slate-100 transition hover:bg-slate-50"

                                    >

                                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">

                                            {formatearFecha(

                                                item.fecha_creacion,

                                            )}

                                        </td>

                                        <td className="max-w-[260px] px-4 py-3">

                                            <div

                                                className="truncate font-semibold text-slate-800"

                                                title={

                                                    item.nombre_oportunidad || ""

                                                }

                                            >

                                                {item.nombre_oportunidad ||

                                                    "Sin nombre"}

                                            </div>

                                        </td>

                                        <td className="max-w-[240px] px-4 py-3 text-slate-600">

                                            <div

                                                className="truncate"

                                                title={item.nombre_cuenta || ""}

                                            >

                                                {item.nombre_cuenta || "—"}

                                            </div>

                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">

                                            <span className="rounded-md bg-blue-50 px-2 py-1 font-semibold text-[#001E50]">

                                                {item.etapa ||

                                                    "Sin etapa"}

                                            </span>

                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">

                                            {item.origen || "—"}

                                        </td>

                                        <td className="max-w-[220px] px-4 py-3 text-slate-600">

                                            <div className="truncate">

                                                {item.propietario_oportunidad ||

                                                    "—"}

                                            </div>

                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">

                                            {item.modelo_interes || "—"}

                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-slate-600">

                                            {item.vin_vehiculo_facturado ||

                                                "—"}

                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 font-bold text-[#001E50]">

                                            {tieneValor(item.importe)

                                                ? formatearMoneda(

                                                    item.importe,

                                                )

                                                : "—"}

                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">

                                            {tieneValor(

                                                item.monto_enganche,

                                            )

                                                ? formatearMoneda(

                                                    item.monto_enganche,

                                                )

                                                : "—"}

                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">

                                            {formatearFecha(

                                                item.fecha_cierre,

                                            )}

                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">

                                            {item.prueba_manejo || "—"}

                                        </td>

                                        <td className="max-w-[220px] px-4 py-3 text-slate-600">

                                            <div

                                                className="truncate"

                                                title={item.campana || ""}

                                            >

                                                {item.campana || "—"}

                                            </div>

                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">

                                            {item.duracion_etapa || "—"}

                                        </td>

                                        <td className="max-w-[220px] px-4 py-3 text-slate-600">

                                            <div className="truncate">

                                                {item.motivo_perdida || "—"}

                                            </div>

                                        </td>

                                        <td className="max-w-[220px] px-4 py-3 text-slate-600">

                                            <div className="truncate">

                                                {item.loss_reason || "—"}

                                            </div>

                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">

                                            {formatearFecha(

                                                item.fecha_promesa_entrega,

                                            )}

                                        </td>

                                        <td className="max-w-[220px] px-4 py-3 text-slate-600">

                                            <div className="truncate">

                                                {item.cuenta_personal_origen ||

                                                    "—"}

                                            </div>

                                        </td>

                                        <td className="max-w-[200px] px-4 py-3 text-slate-600">

                                            <div className="truncate">

                                                {item.hobbies || "—"}

                                            </div>

                                        </td>

                                        <td className="max-w-[350px] px-4 py-3 text-slate-500">

                                            <div

                                                className="truncate"

                                                title={item.descripcion || ""}

                                            >

                                                {item.descripcion || "—"}

                                            </div>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}

                {/* PAGINACIÓN */}

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

                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"

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

                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"

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