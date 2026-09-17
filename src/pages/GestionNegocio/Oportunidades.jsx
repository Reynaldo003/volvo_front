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
        <div className="mx-auto w-full max-w-[1500px] space-y-6 px-4 pb-8">
            {/* ENCABEZADO */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-slate-900">
                    Oportunidades Salesforce
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
                                cambiarFiltro("q", event.target.value)
                            }
                            placeholder="Buscar oportunidad, cuenta, propietario, modelo o VIN..."
                            className="h-11 min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                        />

                        {filtros.q && (
                            <button
                                type="button"
                                onClick={() => cambiarFiltro("q", "")}
                                className="text-slate-400 transition hover:text-slate-700"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="submit"
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#001E50] px-4 text-sm font-semibold text-white transition hover:bg-[#002b73]"
                        >
                            <Search size={16} />
                            Consultar
                        </button>

                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                            <X size={16} />
                            Limpiar
                        </button>

                        <button
                            type="button"
                            onClick={recargar}
                            disabled={cargando}
                            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                            title="Recargar"
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

                {/* FILTROS EXACTOS */}
                <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 xl:grid-cols-4">
                    <CampoFiltro
                        label="Origen"
                        value={filtros.origen}
                        onChange={(valor) =>
                            cambiarFiltro("origen", valor)
                        }
                        placeholder="Ej. Web"
                        opciones={opcionesFiltros.origen || []}
                    />

                    <CampoFiltro
                        label="Etapa"
                        value={filtros.etapa}
                        onChange={(valor) =>
                            cambiarFiltro("etapa", valor)
                        }
                        placeholder="Ej. Negociación"
                        opciones={opcionesFiltros.etapa || []}
                    />

                    <CampoFiltro
                        label="Propietario"
                        value={filtros.propietario_oportunidad}
                        onChange={(valor) =>
                            cambiarFiltro(
                                "propietario_oportunidad",
                                valor,
                            )
                        }
                        placeholder="Nombre del propietario"
                        opciones={
                            opcionesFiltros.propietario_oportunidad || []
                        }
                    />

                    <CampoFiltro
                        label="Modelo de interés"
                        value={filtros.modelo_interes}
                        onChange={(valor) =>
                            cambiarFiltro(
                                "modelo_interes",
                                valor,
                            )
                        }
                        placeholder="Ej. XC40"
                        opciones={opcionesFiltros.modelo_interes || []}
                    />

                    <CampoFiltro
                        label="Prueba de manejo"
                        value={filtros.prueba_manejo}
                        onChange={(valor) =>
                            cambiarFiltro(
                                "prueba_manejo",
                                valor,
                            )
                        }
                        placeholder="Valor exacto"
                        opciones={opcionesFiltros.prueba_manejo || []}
                    />

                    <CampoFiltro
                        label="Motivo de pérdida"
                        value={filtros.motivo_perdida}
                        onChange={(valor) =>
                            cambiarFiltro(
                                "motivo_perdida",
                                valor,
                            )
                        }
                        placeholder="Motivo"
                        opciones={opcionesFiltros.motivo_perdida || []}
                    />
                </div>
            </form>

            {/* KPIS */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    titulo="Oportunidades"
                    valor={
                        cargando
                            ? "..."
                            : total.toLocaleString("es-MX")
                    }
                    descripcion="filtradas"
                    icono={Briefcase}
                />

                <KpiCard
                    titulo="Registros visibles"
                    valor={
                        cargando
                            ? "..."
                            : registros.length.toLocaleString(
                                "es-MX",
                            )
                    }
                    descripcion={`de ${tamanoPagina}`}
                    icono={CalendarDays}
                    iconClass="bg-indigo-50 text-indigo-600"
                />

                <KpiCard
                    titulo="Con VIN"
                    valor={cargando ? "..." : totalConVin}
                    descripcion="página actual"
                    icono={Car}
                    iconClass="bg-emerald-50 text-emerald-600"
                />

                <KpiCard
                    titulo="Importe visible"
                    valor={
                        cargando
                            ? "..."
                            : formatearMoneda(importeVisible)
                    }
                    descripcion="página actual"
                    icono={DollarSign}
                    iconClass="bg-amber-50 text-amber-600"
                />
            </section>

            {/* TABLA */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
                    <div>
                        <h2 className="text-sm font-bold text-[#001E50]">
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