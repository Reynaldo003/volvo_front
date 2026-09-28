import { useEffect, useState } from "react";
import {
    CalendarDays,
    Users,
    UserX,
    UserCheck,
    CalendarCheck,
    TrendingUp,
    PieChart as PieChartIcon,
    BarChart3,
    CheckCircle2,
    XCircle,
    Car,
    Megaphone,
    User,
    ChevronDown,
    ChevronUp,
    Phone,
    Mail,
    Calendar,
    MessageSquare,
    Clock
} from "lucide-react";

import { api } from "../../lib/apiPruebas";

const MESES = [
    "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
    "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
];

const MESES_NUMERO = {
    ENE: 0, FEB: 1, MAR: 2, ABR: 3, MAY: 4, JUN: 5,
    JUL: 6, AGO: 7, SEP: 8, OCT: 9, NOV: 10, DIC: 11,
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

function formatearFecha(valor) {
    const fecha = fechaValida(valor);
    if (!fecha) return "—";

    return fecha.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function RankingCard({
    title,
    subtitle,
    items,
    total,
    icon: Icon,
    emptyText = "Sin información para el periodo seleccionado",
}) {
    const maximo = Math.max(
        ...items.map((item) => item.value),
        1,
    );

    return (
        <article className="flex min-h-[380px] flex-col rounded-none border border-[#E2E2E0] bg-white p-6 transition-colors">
            <div className="flex items-center justify-between border-b border-[#E2E2E0] pb-4">
                <div>
                    <h2 className="text-sm font-light uppercase tracking-widest text-[#141414]">
                        {title}
                    </h2>
                    <p className="mt-1 text-xs font-light text-[#707070]">
                        {subtitle}
                    </p>
                </div>
                {Icon && (
                    <div className="text-[#141414]">
                        <Icon size={18} strokeWidth={1.5} />
                    </div>
                )}
            </div>

            {items.length === 0 ? (
                <div className="flex flex-1 items-center justify-center text-xs font-light text-[#707070]">
                    {emptyText}
                </div>
            ) : (
                <div className="mt-6 space-y-4">
                    {items.map((item) => {
                        const porcentaje =
                            total > 0
                                ? (item.value / total) * 100
                                : 0;

                        const ancho = (item.value / maximo) * 100;

                        return (
                            <div key={item.label}>
                                <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                                    <span
                                        className="truncate font-light tracking-wide text-[#141414]"
                                        title={item.label}
                                    >
                                        {item.label}
                                    </span>

                                    <span className="shrink-0 font-normal text-[#141414]">
                                        {item.value}
                                        <span className="ml-1 font-light text-[#707070]">
                                            ({porcentaje.toFixed(1)}%)
                                        </span>
                                    </span>
                                </div>

                                <div className="h-2 w-full rounded-none bg-[#F4F4F2]">
                                    <div
                                        className="h-full rounded-none bg-[#001E50] transition-all duration-500"
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

function MotivosDescalificacionCard({ items, total }) {
    const colores = [
        "#141414",
        "#001E50",
        "#334155",
        "#475569",
        "#64748B",
        "#94A3B8",
        "#CBD5E1",
    ];

    let acumulado = 0;

    const segmentos = items.map((item, index) => {
        const inicio = total > 0 ? (acumulado / total) * 100 : 0;
        acumulado += item.value;
        const fin = total > 0 ? (acumulado / total) * 100 : 0;

        return {
            ...item,
            inicio,
            fin,
            color: colores[index % colores.length],
        };
    });

    const fondoGradiente =
        segmentos.length > 0
            ? `conic-gradient(${segmentos
                .map((item) => `${item.color} ${item.inicio}% ${item.fin}%`)
                .join(", ")})`
            : "#E2E2E0";

    return (
        <article className="flex min-h-[380px] flex-col rounded-none border border-[#E2E2E0] bg-white p-6">
            <div className="flex items-center justify-between border-b border-[#E2E2E0] pb-4">
                <div>
                    <h2 className="text-sm font-light uppercase tracking-widest text-[#141414]">
                        Motivos de Descalificación
                    </h2>
                    <p className="mt-1 text-xs font-light text-[#707070]">
                        Causas de descarte comercial
                    </p>
                </div>
                <div className="text-[#141414]">
                    <PieChartIcon size={18} strokeWidth={1.5} />
                </div>
            </div>

            {total === 0 ? (
                <div className="flex flex-1 items-center justify-center text-xs font-light text-[#707070]">
                    Sin prospectos descalificados en el periodo
                </div>
            ) : (
                <div className="mt-6 flex flex-1 flex-col justify-between">
                    <div className="flex justify-center py-2">
                        <div
                            className="relative flex h-40 w-40 items-center justify-center rounded-full"
                            style={{ background: fondoGradiente }}
                        >
                            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
                                <span className="text-3xl font-light text-[#141414]">
                                    {total}
                                </span>
                                <span className="text-[9px] font-light uppercase tracking-widest text-[#707070]">
                                    Descartados
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 border-t border-[#E2E2E0] pt-4 sm:grid-cols-2">
                        {segmentos.map((item) => {
                            const porcentaje = total > 0 ? (item.value / total) * 100 : 0;

                            return (
                                <div
                                    key={item.label}
                                    className="flex items-center justify-between gap-2 border border-[#E2E2E0] bg-[#F8F8F7] px-3 py-1.5 text-xs font-light"
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <span
                                            className="h-2 w-2 shrink-0 rounded-none"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span
                                            className="truncate text-[#141414]"
                                            title={item.label}
                                        >
                                            {item.label}
                                        </span>
                                    </div>
                                    <span className="shrink-0 font-normal text-[#141414]">
                                        {item.value}{" "}
                                        <span className="font-light text-[#707070]">
                                            ({porcentaje.toFixed(0)}%)
                                        </span>
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

{/* COMPONENTE: GRÁFICO DE BARRAS DE ASESORES AL 100% DE ANCHO */ }
function ProspectosPorAsesorCard({ prospectosConAsesor, totalProspectosAsignados }) {
    const [asesorExpandido, setAsesorExpandido] = useState(null);

    const asesoresAgrupadosConDetalle = prospectosConAsesor.reduce((acc, prospecto) => {
        const asesor = String(prospecto.asesor_ventas ?? "").trim() || "Sin asignar";
        if (!acc[asesor]) {
            acc[asesor] = [];
        }
        acc[asesor].push(prospecto);
        return acc;
    }, {});

    const listaAsesores = Object.keys(asesoresAgrupadosConDetalle)
        .map((nombreAsesor) => ({
            nombre: nombreAsesor,
            prospectos: asesoresAgrupadosConDetalle[nombreAsesor],
            value: asesoresAgrupadosConDetalle[nombreAsesor].length,
        }))
        .sort((a, b) => b.value - a.value);

    const maximo = Math.max(...listaAsesores.map((item) => item.value), 1);

    return (
        <article className="w-full rounded-none border border-[#E2E2E0] bg-white p-6">
            <div className="flex items-center justify-between border-b border-[#E2E2E0] pb-4">
                <div>
                    <h2 className="text-sm font-light uppercase tracking-widest text-[#141414]">
                        Prospectos por Asesor de Ventas
                    </h2>
                    <p className="mt-1 text-xs font-light text-[#707070]">
                        Haz clic sobre cualquier asesor para desplegar la relación de prospectos asignados
                    </p>
                </div>

                <span className="border border-[#E2E2E0] bg-[#F8F8F7] px-3 py-1 text-xs font-light tracking-wide text-[#141414]">
                    Total Asignados: {totalProspectosAsignados}
                </span>
            </div>

            {listaAsesores.length === 0 ? (
                <div className="flex min-h-[160px] items-center justify-center text-xs font-light text-[#707070]">
                    Sin prospectos asignados en el periodo seleccionado
                </div>
            ) : (
                <div className="mt-6 space-y-3">
                    {listaAsesores.map((item) => {
                        const porcentaje =
                            totalProspectosAsignados > 0
                                ? (item.value / totalProspectosAsignados) * 100
                                : 0;

                        const anchoBarra = (item.value / maximo) * 100;
                        const estaExpandido = asesorExpandido === item.nombre;

                        return (
                            <div
                                key={item.nombre}
                                className="rounded-none border border-[#E2E2E0] bg-[#F8F8F7] p-4 transition-colors hover:bg-white"
                            >
                                {/* BARRA CLICKEABLE */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setAsesorExpandido(estaExpandido ? null : item.nombre)
                                    }
                                    className="w-full text-left focus:outline-none group"
                                >
                                    <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <User size={14} className="text-[#707070] stroke-1" />
                                            <span
                                                className="truncate font-light text-[#141414] tracking-wide group-hover:text-[#001E50]"
                                                title={item.nombre}
                                            >
                                                {item.nombre}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="font-normal text-[#141414]">
                                                {item.value}
                                                <span className="ml-1 font-light text-[#707070]">
                                                    ({porcentaje.toFixed(1)}%)
                                                </span>
                                            </span>
                                            {estaExpandido ? (
                                                <ChevronUp size={16} className="text-[#141414]" />
                                            ) : (
                                                <ChevronDown size={16} className="text-[#707070]" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="h-2 w-full bg-[#E2E2E0]">
                                        <div
                                            className="h-full bg-[#001E50] transition-all duration-500"
                                            style={{ width: `${anchoBarra}%` }}
                                        />
                                    </div>
                                </button>

                                {/* RELACIÓN DESPLEGABLE DE PROSPECTOS ASIGNADOS */}
                                {estaExpandido && (
                                    <div className="mt-4 border-t border-[#E2E2E0] pt-4 space-y-2">
                                        <div className="flex items-center justify-between text-xs font-light text-[#707070] mb-2">
                                            <span className="uppercase tracking-widest text-[10px]">
                                                Relación de Prospectos de {item.nombre}
                                            </span>
                                            <span className="font-normal text-[#141414]">
                                                {item.prospectos.length} registros
                                            </span>
                                        </div>

                                        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                                            {item.prospectos.map((prospecto) => (
                                                <div
                                                    key={prospecto.id}
                                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#E2E2E0] bg-white p-3 text-xs"
                                                >
                                                    <div className="space-y-0.5">
                                                        <p className="font-normal text-[#141414]">
                                                            {prospecto.nombre || "Sin nombre"}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-light text-[#707070]">
                                                            {prospecto.correo && (
                                                                <span className="flex items-center gap-1">
                                                                    <Mail size={11} strokeWidth={1.5} />
                                                                    {prospecto.correo}
                                                                </span>
                                                            )}
                                                            {prospecto.telefono && (
                                                                <span className="flex items-center gap-1">
                                                                    <Phone size={11} strokeWidth={1.5} />
                                                                    {prospecto.telefono}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2 text-right">
                                                        {prospecto.auto_interes && (
                                                            <span className="inline-flex items-center gap-1 border border-[#E2E2E0] bg-[#F8F8F7] px-2 py-0.5 text-[10px] font-light text-[#141414]">
                                                                <Car size={10} strokeWidth={1.5} />
                                                                {prospecto.auto_interes}
                                                            </span>
                                                        )}
                                                        <span className="border border-[#E2E2E0] px-2 py-0.5 text-[10px] font-light text-[#707070]">
                                                            {prospecto.estado || "Sin estatus"}
                                                        </span>
                                                        <span className="text-[10px] font-light text-[#707070] flex items-center gap-1">
                                                            <Calendar size={10} strokeWidth={1.5} />
                                                            {formatearFecha(prospecto.creado)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </article>
    );
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
            dia >= Number(diaInicio) && dia <= Number(diaFin);

        return coincideAnio && coincideMes && coincideDia;
    });

    const totalProspectos = prospectosFiltrados.length;

    const prospectosDescalificados = prospectosFiltrados.filter((prospecto) => {
        const estado = normalizarTexto(prospecto.estado);
        return (
            estado.includes("descalific") ||
            tieneValor(prospecto.motivo_descalificacion)
        );
    });

    const totalDescalificados = prospectosDescalificados.length;
    const totalAsignados = prospectosFiltrados.filter((prospecto) =>
        tieneValor(prospecto.asesor_ventas),
    ).length;

    const totalCitas = prospectosFiltrados.filter((prospecto) =>
        tieneValor(prospecto.ultima_cita),
    ).length;

    const totalCitasAsistidas = prospectosFiltrados.filter(
        (prospecto) =>
            tieneValor(prospecto.ultima_cita) &&
            (prospecto.asistencia === true ||
                normalizarTexto(prospecto.asistencia) === "true"),
    ).length;

    const tasaAsistencia =
        totalCitas > 0 ? (totalCitasAsistidas / totalCitas) * 100 : 0;

    const totalCitasNoAsistidas = Math.max(
        totalCitas - totalCitasAsistidas,
        0,
    );

    const prospectosConCita = prospectosFiltrados.filter((prospecto) =>
        tieneValor(prospecto.ultima_cita),
    );

    const coloresEstatus = [
        "#141414",
        "#001E50",
        "#334155",
        "#475569",
        "#64748B",
        "#94A3B8",
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
        "#141414",
        "#001E50",
        "#334155",
        "#475569",
        "#64748B",
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
            totalProspectos > 0 ? (item.value / totalProspectos) * 100 : 0,
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
                prospectosPorDia.reduce((total, item) => total + item.value, 0) /
                prospectosPorDia.length
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

    const motivosDescalificacion = topNConOtros(
        agruparPorCampo(
            prospectosDescalificados,
            "motivo_descalificacion",
            "Sin motivo registrado",
        ),
        6,
    );

    const prospectosConAsesor = prospectosFiltrados.filter((prospecto) =>
        tieneValor(prospecto.asesor_ventas),
    );

    const totalProspectosAsignados = prospectosConAsesor.length;

    const prospectosTabla = [...prospectosFiltrados].sort((a, b) => {
        const fechaA = fechaValida(a.creado)?.getTime() || 0;
        const fechaB = fechaValida(b.creado)?.getTime() || 0;
        return fechaB - fechaA;
    });

    const tasaAsignacion =
        totalProspectos > 0
            ? ((totalAsignados / totalProspectos) * 100).toFixed(1)
            : "0.0";

    return (
        <div className="mx-auto w-full max-w-[1360px] space-y-6 bg-[#F8F8F7] px-6 py-8 text-[#141414]">
            {/* HEADER ESCANDINAVO VOLVO */}
            <div className="flex flex-col gap-2 border-b border-[#E2E2E0] pb-6 md:flex-row md:items-end md:justify-between">
                <div>
                    <span className="text-[10px] font-light uppercase tracking-[0.25em] text-[#707070]">
                        Volvo Cars Mexico · CRM Dashboard
                    </span>
                    <h1 className="mt-1 text-3xl font-light tracking-tight text-[#141414]">
                        Rendimiento Comercial de Prospectos
                    </h1>
                </div>
                <div className="text-xs font-light text-[#707070]">
                    Periodo Activo: <span className="font-normal text-[#141414]">{mes} {anio}</span>
                </div>
            </div>

            {errorCarga && (
                <div className="rounded-none border border-red-300 bg-red-50 p-4 text-xs font-light text-red-600">
                    {errorCarga}
                </div>
            )}

            {/* FILTROS MINIMALISTAS SIN REDONDEOS */}
            <section className="rounded-none border border-[#E2E2E0] bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* AÑO */}
                        <div className="flex items-center gap-2 border border-[#E2E2E0] bg-[#F8F8F7] px-4 py-2">
                            <CalendarDays size={14} className="text-[#141414]" strokeWidth={1.5} />
                            <select
                                value={anio}
                                onChange={(e) => setAnio(Number(e.target.value))}
                                className="bg-transparent text-xs font-light uppercase tracking-widest text-[#141414] outline-none cursor-pointer"
                            >
                                {aniosDisponibles.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="hidden h-6 w-px bg-[#E2E2E0] md:block" />

                        {/* MESES */}
                        <div className="flex flex-wrap items-center gap-1">
                            {MESES.map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => setMes(item)}
                                    className={`rounded-none px-3 py-1.5 text-xs font-light tracking-wider transition-colors ${mes === item
                                        ? "bg-[#141414] text-white"
                                        : "bg-[#F8F8F7] text-[#707070] hover:bg-[#E2E2E0]"
                                        }`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* RANGO DÍAS */}
                    <div className="flex items-center gap-3 border border-[#E2E2E0] bg-[#F8F8F7] px-4 py-2">
                        <span className="text-[10px] font-light uppercase tracking-widest text-[#707070]">
                            Días
                        </span>
                        <span className="border border-[#E2E2E0] bg-white px-2 py-0.5 text-xs font-light text-[#141414]">
                            {String(diaInicio).padStart(2, "0")}
                        </span>
                        <input
                            type="range"
                            min="1"
                            max="31"
                            value={diaFin}
                            onChange={(e) => setDiaFin(Number(e.target.value))}
                            className="w-24 accent-[#141414] cursor-pointer"
                        />
                        <span className="border border-[#E2E2E0] bg-white px-2 py-0.5 text-xs font-light text-[#141414]">
                            {String(diaFin).padStart(2, "0")}
                        </span>
                    </div>
                </div>
            </section>

            {/* 1. HERO KPI CARD CON IMAGEN DE FONDO + TARJETAS SECUNDARIAS */}
            <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                {/* HERO CARD CON IMAGEN DE FONDO */}
                <div
                    className="relative rounded-none p-8 text-white lg:col-span-7 flex flex-col justify-between border border-[#222222] bg-cover bg-center overflow-hidden"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, rgba(20, 20, 20, 0.60), rgba(20, 20, 20, 0.75)), url('../leads.jpg')",
                    }}
                >
                    <div className="flex items-center justify-between border-b border-white/20 pb-4">
                        <span className="text-[10px] font-light uppercase tracking-[0.25em] text-slate-300">
                            Volvo Commercial Overview
                        </span>
                        <span className="text-xs font-light text-slate-300">
                            {mes} {anio}
                        </span>
                    </div>

                    <div className="my-8">
                        <p className="text-xs font-light uppercase tracking-widest text-slate-300">
                            Prospectos Totales Captados
                        </p>
                        <div className="mt-2 flex items-baseline gap-4">
                            <h2 className="text-6xl font-light tracking-tight text-white">
                                {cargando ? "..." : totalProspectos}
                            </h2>
                            <span className="inline-flex items-center gap-1 border border-white/20 bg-black/40 backdrop-blur-md px-3 py-1 text-xs font-light tracking-wider text-emerald-300">
                                <TrendingUp size={12} strokeWidth={1.5} />
                                {tasaAsignacion}% asignación
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border-t border-white/20 pt-4 text-center sm:text-left backdrop-blur-xs">
                        <div>
                            <p className="text-[9px] font-light uppercase tracking-widest text-slate-300">Citas Agendadas</p>
                            <p className="mt-1 text-2xl font-light text-white">{totalCitas}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-light uppercase tracking-widest text-slate-300">Tasa Asistencia</p>
                            <p className="mt-1 text-2xl font-light text-emerald-300">{tasaAsistencia.toFixed(0)}%</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-light uppercase tracking-widest text-slate-300">Descartados</p>
                            <p className="mt-1 text-2xl font-light text-rose-300">{totalDescalificados}</p>
                        </div>
                    </div>
                </div>

                {/* TARJETAS KPI SECUNDARIAS RECTANGULARES */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1 lg:col-span-5">
                    <div className="flex items-center justify-between rounded-none border border-[#E2E2E0] bg-white p-5">
                        <div>
                            <p className="text-[10px] font-light uppercase tracking-widest text-[#707070]">
                                Descalificados
                            </p>
                            <h3 className="mt-1 text-3xl font-light text-[#141414]">
                                {cargando ? "..." : totalDescalificados}
                            </h3>
                            <p className="mt-1 text-xs font-light text-rose-600">
                                Fuera de perfil objetivo
                            </p>
                        </div>
                        <div className="text-[#141414]">
                            <UserX size={24} strokeWidth={1.5} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-none border border-[#E2E2E0] bg-white p-5">
                        <div>
                            <p className="text-[10px] font-light uppercase tracking-widest text-[#707070]">
                                Asignados a Asesor
                            </p>
                            <h3 className="mt-1 text-3xl font-light text-[#141414]">
                                {cargando ? "..." : totalAsignados}
                            </h3>
                            <p className="mt-1 text-xs font-light text-[#707070]">
                                Distribuidos a la red
                            </p>
                        </div>
                        <div className="text-[#001E50]">
                            <UserCheck size={24} strokeWidth={1.5} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-none border border-[#E2E2E0] bg-white p-5">
                        <div>
                            <p className="text-[10px] font-light uppercase tracking-widest text-[#707070]">
                                Citas Generadas
                            </p>
                            <h3 className="mt-1 text-3xl font-light text-[#141414]">
                                {cargando ? "..." : totalCitas}
                            </h3>
                            <p className="mt-1 text-xs font-light text-[#707070]">
                                Showroom & Test Drives
                            </p>
                        </div>
                        <div className="text-[#141414]">
                            <CalendarCheck size={24} strokeWidth={1.5} />
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. GRÁFICA DE ASESORES EN SEGUNDO ORDEN (100% ANCHO) */}
            <section className="w-full">
                <ProspectosPorAsesorCard
                    prospectosConAsesor={prospectosConAsesor}
                    totalProspectosAsignados={totalProspectosAsignados}
                />
            </section>

            {/* 3. FILA DE ANALÍTICA (ESTATUS, CANAL, ACTIVIDAD DIARIA) */}
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                {/* ESTATUS PROSPECTOS */}
                <article className="flex min-h-[380px] flex-col rounded-none border border-[#E2E2E0] bg-white p-6">
                    <div className="flex items-center justify-between border-b border-[#E2E2E0] pb-4">
                        <div>
                            <h2 className="text-sm font-light uppercase tracking-widest text-[#141414]">
                                Estatus de Prospectos
                            </h2>
                            <p className="mt-1 text-xs font-light text-[#707070]">
                                Embudo de cualificación comercial
                            </p>
                        </div>
                        <div className="text-[#141414]">
                            <BarChart3 size={18} strokeWidth={1.5} />
                        </div>
                    </div>

                    <div className="mt-6 flex-1 space-y-4">
                        {estatusProspectos.map((item) => (
                            <div key={item.label}>
                                <div className="mb-1.5 flex items-center justify-between text-xs font-light">
                                    <span className="text-[#141414] tracking-wide">
                                        {item.label}
                                    </span>
                                    <span className="font-normal text-[#141414]">
                                        {item.value}{" "}
                                        <span className="font-light text-[#707070]">
                                            ({item.percent}%)
                                        </span>
                                    </span>
                                </div>
                                <div className="h-2 w-full rounded-none bg-[#F4F4F2]">
                                    <div
                                        className="h-full rounded-none transition-all duration-500"
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

                {/* CANAL DE ORIGEN */}
                <article className="flex min-h-[380px] flex-col justify-between rounded-none border border-[#E2E2E0] bg-white p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-[#E2E2E0] pb-4">
                            <div>
                                <h2 className="text-sm font-light uppercase tracking-widest text-[#141414]">
                                    Canal de Origen
                                </h2>
                                <p className="mt-1 text-xs font-light text-[#707070]">
                                    Entrada digital de clientes
                                </p>
                            </div>
                            <span className="border border-[#E2E2E0] bg-[#F8F8F7] px-3 py-1 text-xs font-light text-[#141414]">
                                Total: {totalProspectos}
                            </span>
                        </div>

                        <div className="mt-5 space-y-3">
                            {canalesProspectos.map((item) => (
                                <div key={item.label}>
                                    <div className="mb-1 flex items-center justify-between text-xs font-light">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="h-2 w-2 rounded-none"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <span className="text-[#141414]">{item.label}</span>
                                        </div>
                                        <span className="font-normal text-[#141414]">
                                            {item.value} ({item.percent}%)
                                        </span>
                                    </div>
                                    <div className="h-2 w-full rounded-none bg-[#F4F4F2]">
                                        <div
                                            className="h-full rounded-none transition-all duration-500"
                                            style={{
                                                width: `${item.width}%`,
                                                backgroundColor: item.color,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 border border-[#E2E2E0] bg-[#F8F8F7] p-4">
                        <p className="mb-2 text-[10px] font-light uppercase tracking-widest text-[#707070]">
                            Business Split
                        </p>
                        <div className="space-y-2">
                            {businessAgrupado.map((item, index) => {
                                const porcentaje =
                                    totalProspectos > 0
                                        ? (item.value / totalProspectos) * 100
                                        : 0;
                                return (
                                    <div key={item.label}>
                                        <div className="flex items-center justify-between text-xs font-light mb-1">
                                            <span className="text-[#141414]">{item.label}</span>
                                            <span className="font-normal text-[#141414]">
                                                {item.value} ({porcentaje.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-[#E2E2E0]">
                                            <div
                                                className={`h-full ${index === 0 ? "bg-[#141414]" : "bg-[#001E50]"
                                                    }`}
                                                style={{ width: `${porcentaje}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </article>

                {/* ACTIVIDAD DIARIA */}
                <article className="flex min-h-[380px] flex-col rounded-none border border-[#E2E2E0] bg-white p-6">
                    <div className="flex items-center justify-between border-b border-[#E2E2E0] pb-4">
                        <div>
                            <h2 className="text-sm font-light uppercase tracking-widest text-[#141414]">
                                Actividad Diaria
                            </h2>
                            <p className="mt-1 text-xs font-light text-[#707070]">
                                {mes || "—"} {anio || "—"}
                            </p>
                        </div>
                        {picoDia && (
                            <span className="border border-[#E2E2E0] bg-[#F8F8F7] px-3 py-1 text-xs font-light text-[#141414]">
                                Pico: Día {picoDia.day} ({picoDia.value})
                            </span>
                        )}
                    </div>

                    <div className="mt-6 flex h-48 items-end gap-1 border border-[#E2E2E0] bg-[#F8F8F7] p-4">
                        {prospectosPorDia.map((item) => {
                            const height = Math.max(
                                (item.value / maxProspectosDia) * 100,
                                10,
                            );
                            const esPico = picoDia?.day === item.day;

                            return (
                                <div
                                    key={item.day}
                                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                                >
                                    <div
                                        title={`Día ${item.day}: ${item.value} prospectos`}
                                        className={`w-full rounded-none transition-colors ${esPico ? "bg-[#001E50]" : "bg-[#141414]/40 hover:bg-[#141414]"
                                            }`}
                                        style={{ height: `${height}%` }}
                                    />
                                    <span
                                        className={`mt-2 text-[9px] font-light ${esPico ? "font-normal text-[#141414]" : "text-[#707070]"
                                            }`}
                                    >
                                        {item.day}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-auto border-t border-[#E2E2E0] pt-4 text-xs font-light text-[#707070]">
                        Promedio: <span className="font-normal text-[#141414]">{promedioDia}</span> prospectos / día activo
                    </div>
                </article>
            </section>

            {/* 4. SEGUNDA FILA DE RANKINGS */}
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                <RankingCard
                    title="Modelo de Interés"
                    subtitle="Vehículos Volvo con mayor demanda"
                    items={modelosInteres}
                    total={totalProspectos}
                    icon={Car}
                />

                <RankingCard
                    title="Pauta Comercial"
                    subtitle="Campaña u origen publicitario"
                    items={pautasProspectos}
                    total={totalProspectos}
                    icon={Megaphone}
                />

                <MotivosDescalificacionCard
                    items={motivosDescalificacion}
                    total={totalDescalificados}
                />
            </section>

            {/* 5. PANEL DE CITAS Y ASISTENCIA (CON TABLA INTEGRADA DE CITAS) */}
            <section className="w-full">
                <article className="flex flex-col justify-between rounded-none border border-[#E2E2E0] bg-white p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-[#E2E2E0] pb-4">
                            <div>
                                <h2 className="text-sm font-light uppercase tracking-widest text-[#141414]">
                                    Citas y Asistencia Comercial
                                </h2>
                                <p className="mt-1 text-xs font-light text-[#707070]">
                                    Efectividad y detalle de citas agendadas en el periodo
                                </p>
                            </div>
                            <span className="border border-[#E2E2E0] bg-[#F8F8F7] px-3 py-1 text-xs font-light text-[#141414]">
                                Total Registradas: {totalCitas}
                            </span>
                        </div>

                        {/* RESUMEN DE INDICADORES */}
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div className="border border-[#E2E2E0] bg-[#F8F8F7] p-4 text-center">
                                <p className="text-[9px] font-light uppercase tracking-widest text-[#707070]">
                                    Citas Agendadas
                                </p>
                                <p className="mt-1 text-2xl font-light text-[#141414]">
                                    {totalCitas}
                                </p>
                            </div>

                            <div className="border border-[#E2E2E0] bg-[#F8F8F7] p-4 text-center">
                                <p className="text-[9px] font-light uppercase tracking-widest text-emerald-600">
                                    Asistidas
                                </p>
                                <p className="mt-1 text-2xl font-light text-emerald-600">
                                    {totalCitasAsistidas}
                                </p>
                            </div>

                            <div className="border border-[#E2E2E0] bg-[#F8F8F7] p-4 text-center">
                                <p className="text-[9px] font-light uppercase tracking-widest text-[#707070]">
                                    No Asistidas
                                </p>
                                <p className="mt-1 text-2xl font-light text-[#141414]">
                                    {totalCitasNoAsistidas}
                                </p>
                            </div>

                            <div className="border border-[#E2E2E0] bg-[#F8F8F7] p-4 text-center">
                                <p className="text-[9px] font-light uppercase tracking-widest text-[#001E50]">
                                    Tasa de Asistencia
                                </p>
                                <p className="mt-1 text-2xl font-light text-[#001E50]">
                                    {tasaAsistencia.toFixed(1)}%
                                </p>
                            </div>
                        </div>

                        {/* TABLA DE CITAS DETALLADAS */}
                        <div className="mt-6">
                            <h3 className="text-xs font-light uppercase tracking-widest text-[#707070] mb-3">
                                Relación de Citas del Periodo
                            </h3>

                            {prospectosConCita.length === 0 ? (
                                <div className="border border-[#E2E2E0] bg-[#F8F8F7] p-6 text-center text-xs font-light text-[#707070]">
                                    No hay citas registradas en el periodo seleccionado.
                                </div>
                            ) : (
                                <div className="max-h-[280px] overflow-auto border border-[#E2E2E0]">
                                    <table className="w-full text-left text-xs font-light">
                                        <thead className="sticky top-0 bg-[#F8F8F7] border-b border-[#E2E2E0] text-[10px] font-light uppercase tracking-widest text-[#707070]">
                                            <tr>
                                                <th className="px-4 py-3">Fecha Cita</th>
                                                <th className="px-4 py-3">Prospecto</th>
                                                <th className="px-4 py-3">Asesor Asignado</th>
                                                <th className="px-4 py-3">Modelo Interés</th>
                                                <th className="px-4 py-3">Asistencia</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#E2E2E0] bg-white">
                                            {prospectosConCita.map((prospecto) => {
                                                const asistio =
                                                    prospecto.asistencia === true ||
                                                    normalizarTexto(prospecto.asistencia) === "true";

                                                return (
                                                    <tr key={prospecto.id} className="hover:bg-[#F8F8F7]">
                                                        <td className="px-4 py-3 font-normal text-[#001E50]">
                                                            {formatearFecha(prospecto.ultima_cita_agendada || prospecto.ultima_cita)}
                                                        </td>
                                                        <td className="px-4 py-3 font-normal text-[#141414]">
                                                            {prospecto.nombre || "Sin nombre"}
                                                        </td>
                                                        <td className="px-4 py-3 text-[#707070]">
                                                            {prospecto.asesor_ventas || "Sin asignar"}
                                                        </td>
                                                        <td className="px-4 py-3 text-[#707070]">
                                                            {prospecto.auto_interes || "—"}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {asistio ? (
                                                                <span className="inline-flex items-center gap-1 border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-light text-emerald-700">
                                                                    <CheckCircle2 size={11} />
                                                                    Asistió
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-light text-rose-600">
                                                                    <XCircle size={11} />
                                                                    No asistió
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
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#E2E2E0] text-xs font-light text-[#707070]">
                        Fuente: CRM Volvo Concesionario
                    </div>
                </article>
            </section>

            {/* 6. TABLA DE DETALLE (CON COLUMNA DE COMENTARIOS INCLUIDA) */}
            <section className="rounded-none border border-[#E2E2E0] bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E2E0] px-6 py-5">
                    <div>
                        <h2 className="text-sm font-light uppercase tracking-widest text-[#141414]">
                            Detalle de Prospectos
                        </h2>
                        <p className="mt-1 text-xs font-light text-[#707070]">
                            Registros correspondientes al periodo seleccionado
                        </p>
                    </div>
                    <span className="border border-[#E2E2E0] bg-[#F8F8F7] px-4 py-1.5 text-xs font-light text-[#141414]">
                        {prospectosTabla.length} registros
                    </span>
                </div>

                {prospectosTabla.length === 0 ? (
                    <div className="flex min-h-[200px] items-center justify-center p-8 text-xs font-light text-[#707070]">
                        No hay prospectos para el periodo seleccionado.
                    </div>
                ) : (
                    <div className="max-h-[520px] overflow-auto">
                        <table className="w-full min-w-[1250px] border-collapse text-left text-xs font-light">
                            <thead className="sticky top-0 z-10 bg-[#F8F8F7]">
                                <tr className="border-b border-[#E2E2E0] text-[10px] font-light uppercase tracking-widest text-[#707070]">
                                    <th className="px-5 py-3.5">Fecha</th>
                                    <th className="px-5 py-3.5">Prospecto</th>
                                    <th className="px-5 py-3.5">Teléfono</th>
                                    <th className="px-5 py-3.5">Canal</th>
                                    <th className="px-5 py-3.5">Pauta</th>
                                    <th className="px-5 py-3.5">Estado</th>
                                    <th className="px-5 py-3.5">Modelo</th>
                                    <th className="px-5 py-3.5">Asesor</th>
                                    <th className="px-5 py-3.5">Cita</th>
                                    <th className="px-5 py-3.5">Asistencia</th>
                                    <th className="px-5 py-3.5">Comentarios</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E2E0]">
                                {prospectosTabla.map((prospecto) => {
                                    const tieneCita = tieneValor(prospecto.ultima_cita);
                                    const asistio =
                                        prospecto.asistencia === true ||
                                        normalizarTexto(prospecto.asistencia) === "true";

                                    const comentarioTexto =
                                        prospecto.comentarios ||
                                        prospecto.comentario ||
                                        prospecto.observaciones ||
                                        prospecto.notas ||
                                        "—";

                                    return (
                                        <tr
                                            key={prospecto.id}
                                            className="transition-colors hover:bg-[#F8F8F7]"
                                        >
                                            <td className="whitespace-nowrap px-5 py-4 text-[#707070]">
                                                {formatearFecha(prospecto.creado)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div
                                                    className="font-normal text-[#141414] truncate max-w-[200px]"
                                                    title={prospecto.nombre || ""}
                                                >
                                                    {prospecto.nombre || "Sin nombre"}
                                                </div>
                                                <div
                                                    className="text-[11px] text-[#707070] truncate max-w-[200px]"
                                                    title={prospecto.correo || ""}
                                                >
                                                    {prospecto.correo || "Sin correo"}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-[#141414]">
                                                {prospecto.telefono || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-[#141414]">
                                                {prospecto.canal_contacto || "—"}
                                            </td>
                                            <td
                                                className="px-5 py-4 text-[#707070] truncate max-w-[200px]"
                                                title={prospecto.pauta || ""}
                                            >
                                                {prospecto.pauta || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <span className="border border-[#E2E2E0] bg-[#F8F8F7] px-2.5 py-1 text-[11px] font-light text-[#141414]">
                                                    {prospecto.estado || "Sin estatus"}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-[#141414]">
                                                {prospecto.auto_interes || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-[#141414]">
                                                {prospecto.asesor_ventas || "Sin asignar"}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 font-normal text-[#001E50]">
                                                {tieneCita
                                                    ? formatearFecha(prospecto.ultima_cita_agendada)
                                                    : "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4">
                                                {tieneCita ? (
                                                    asistio ? (
                                                        <span className="inline-flex items-center gap-1 border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-light text-emerald-700">
                                                            <CheckCircle2 size={12} strokeWidth={1.5} />
                                                            Asistió
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-light text-rose-600">
                                                            <XCircle size={12} strokeWidth={1.5} />
                                                            No asistió
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="text-[#707070]">—</span>
                                                )}
                                            </td>
                                            <td
                                                className="px-5 py-4 text-[#707070] max-w-[250px] truncate"
                                                title={comentarioTexto}
                                            >
                                                {comentarioTexto}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}