import { useEffect, useMemo, useState } from "react";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Mail,
    RefreshCw,
    Search,
    UserCheck,
    Users,
    X,
} from "lucide-react";

import { http, toQuery } from "../../lib/apiClient";

const ENDPOINT = "/salesforce/api/prospectos/";

const FILTROS_INICIALES = {
    q: "",
    anio: "",
    mes: "",
    fecha_desde: "",
    fecha_hasta: "",
    origen: "",
    estado_lead: "",
    propietario_lead: "",
    tipo_solicitud: "",
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
}) {
    return (
        <label className="flex min-w-0 flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {label}
            </span>

            <input
                type="text"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#001E50] focus:ring-1 focus:ring-[#001E50]"
            />
        </label>
    );
}

export default function ProspectosSalesforce() {
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

    const anioActual = new Date().getFullYear();

    const aniosDisponibles = Array.from(
        { length: 10 },
        (_, index) => anioActual - index,
    );

    useEffect(() => {
        let activo = true;

        async function cargarProspectos() {
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
                    "Error consultando prospectos Salesforce:",
                    err,
                );

                setRegistros([]);
                setTotal(0);

                setError(
                    err?.message ||
                    "No fue posible consultar los prospectos.",
                );
            } finally {
                if (activo) {
                    setCargando(false);
                }
            }
        }

        cargarProspectos();

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

    const conEmail = useMemo(
        () =>
            registros.filter((item) =>
                tieneValor(item.email),
            ).length,
        [registros],
    );

    const conPropietario = useMemo(
        () =>
            registros.filter((item) =>
                tieneValor(item.propietario_lead),
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
                    Prospectos Salesforce
                </h1>

                <p className="text-sm text-slate-500">
                    Consulta de leads y prospectos almacenados en
                    Salesforce.
                </p>
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
                            placeholder="Buscar nombre, correo, propietario o descripción..."
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

                <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 xl:grid-cols-4">
                    <CampoFiltro
                        label="Origen"
                        value={filtros.origen}
                        onChange={(valor) =>
                            cambiarFiltro("origen", valor)
                        }
                        placeholder="Origen"
                    />

                    <CampoFiltro
                        label="Estado lead"
                        value={filtros.estado_lead}
                        onChange={(valor) =>
                            cambiarFiltro(
                                "estado_lead",
                                valor,
                            )
                        }
                        placeholder="Estado"
                    />

                    <CampoFiltro
                        label="Propietario"
                        value={filtros.propietario_lead}
                        onChange={(valor) =>
                            cambiarFiltro(
                                "propietario_lead",
                                valor,
                            )
                        }
                        placeholder="Propietario"
                    />

                    <CampoFiltro
                        label="Tipo solicitud"
                        value={filtros.tipo_solicitud}
                        onChange={(valor) =>
                            cambiarFiltro(
                                "tipo_solicitud",
                                valor,
                            )
                        }
                        placeholder="Tipo de solicitud"
                    />
                </div>
            </form>

            {/* KPIS */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    titulo="Prospectos"
                    valor={
                        cargando
                            ? "..."
                            : total.toLocaleString("es-MX")
                    }
                    descripcion="filtrados"
                    icono={Users}
                />

                <KpiCard
                    titulo="Registros visibles"
                    valor={cargando ? "..." : registros.length}
                    descripcion="página actual"
                    icono={CalendarDays}
                    iconClass="bg-indigo-50 text-indigo-600"
                />

                <KpiCard
                    titulo="Con correo"
                    valor={cargando ? "..." : conEmail}
                    descripcion="página actual"
                    icono={Mail}
                    iconClass="bg-emerald-50 text-emerald-600"
                />

                <KpiCard
                    titulo="Con propietario"
                    valor={
                        cargando ? "..." : conPropietario
                    }
                    descripcion="página actual"
                    icono={UserCheck}
                    iconClass="bg-violet-50 text-violet-600"
                />
            </section>

            {/* TABLA */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
                    <div>
                        <h2 className="text-sm font-bold text-[#001E50]">
                            Detalle de prospectos
                        </h2>

                        <p className="mt-0.5 text-xs text-slate-400">
                            Registros almacenados en el reporte de Salesforce.
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
                        Consultando prospectos...
                    </div>
                ) : registros.length === 0 ? (
                    <div className="flex min-h-[260px] items-center justify-center text-sm text-slate-400">
                        No hay prospectos para los filtros seleccionados.
                    </div>
                ) : (
                    <div className="max-h-[620px] overflow-auto">
                        <table className="w-full min-w-[1850px] border-collapse text-left text-xs">
                            <thead className="sticky top-0 z-10 bg-slate-50">
                                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                    <th className="px-4 py-3">
                                        Fecha
                                    </th>

                                    <th className="px-4 py-3">
                                        Prospecto
                                    </th>

                                    <th className="px-4 py-3">
                                        Email
                                    </th>

                                    <th className="px-4 py-3">
                                        Estado
                                    </th>

                                    <th className="px-4 py-3">
                                        Origen
                                    </th>

                                    <th className="px-4 py-3">
                                        Propietario
                                    </th>

                                    <th className="px-4 py-3">
                                        Tipo solicitud
                                    </th>

                                    <th className="px-4 py-3">
                                        Valoración
                                    </th>

                                    <th className="px-4 py-3">
                                        Compañía
                                    </th>

                                    <th className="px-4 py-3">
                                        Cargo
                                    </th>

                                    <th className="px-4 py-3">
                                        Calle
                                    </th>

                                    <th className="px-4 py-3">
                                        Descripción
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {registros.map((item, index) => {
                                    const nombreCompleto = [
                                        item.nombre,
                                        item.apellidos,
                                    ]
                                        .filter(Boolean)
                                        .join(" ");

                                    return (
                                        <tr
                                            key={`${item.email}-${item.fecha_creacion}-${index}`}
                                            className="border-b border-slate-100 transition hover:bg-slate-50"
                                        >
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                                                {formatearFecha(
                                                    item.fecha_creacion,
                                                )}
                                            </td>

                                            <td className="max-w-[250px] px-4 py-3">
                                                <div
                                                    className="truncate font-semibold text-slate-800"
                                                    title={nombreCompleto}
                                                >
                                                    {nombreCompleto ||
                                                        "Sin nombre"}
                                                </div>
                                            </td>

                                            <td className="max-w-[260px] px-4 py-3 text-slate-600">
                                                <div
                                                    className="truncate"
                                                    title={item.email || ""}
                                                >
                                                    {item.email || "—"}
                                                </div>
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3">
                                                <span className="rounded-md bg-blue-50 px-2 py-1 font-semibold text-[#001E50]">
                                                    {item.estado_lead ||
                                                        "Sin estado"}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                                {item.origen || "—"}
                                            </td>

                                            <td className="max-w-[220px] px-4 py-3 text-slate-600">
                                                <div className="truncate">
                                                    {item.propietario_lead ||
                                                        "—"}
                                                </div>
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                                {item.tipo_solicitud ||
                                                    "—"}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                                {item.valoracion || "—"}
                                            </td>

                                            <td className="max-w-[220px] px-4 py-3 text-slate-600">
                                                <div className="truncate">
                                                    {item.compania || "—"}
                                                </div>
                                            </td>

                                            <td className="max-w-[180px] px-4 py-3 text-slate-600">
                                                <div className="truncate">
                                                    {item.cargo || "—"}
                                                </div>
                                            </td>

                                            <td className="max-w-[260px] px-4 py-3 text-slate-600">
                                                <div
                                                    className="truncate"
                                                    title={item.calle || ""}
                                                >
                                                    {item.calle || "—"}
                                                </div>
                                            </td>

                                            <td className="max-w-[420px] px-4 py-3 text-slate-500">
                                                <div
                                                    className="truncate"
                                                    title={
                                                        item.descripcion || ""
                                                    }
                                                >
                                                    {item.descripcion || "—"}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
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