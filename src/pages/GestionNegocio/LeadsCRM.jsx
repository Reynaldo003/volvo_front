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
    Layers,
    Filter,
    MessageSquare,
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

function obtenerColorEstado(estadoOriginal) {
    const estado = normalizarTexto(estadoOriginal);

    if (estado.includes("descalific") || estado.includes("descart") || estado.includes("perdid")) {
        return {
            bg: "#C46B6B",
            text: "text-[#B04B4B]",
            badgeBg: "bg-[#FDF3F3]",
            badgeText: "text-[#B04B4B]",
            label: "Descalificado"
        };
    }
    if (estado.includes("calific") || estado.includes("ganad") || estado.includes("vendid") || estado.includes("exito")) {
        return {
            bg: "#10B981",
            text: "text-emerald-700",
            badgeBg: "bg-emerald-50",
            badgeText: "text-emerald-700",
            label: "Calificado"
        };
    }
    if (estado.includes("cita") || estado.includes("agend")) {
        return {
            bg: "#001E50",
            text: "text-[#001E50]",
            badgeBg: "bg-blue-50",
            badgeText: "text-[#001E50]",
            label: "Cita Agendada"
        };
    }
    if (estado.includes("proceso") || estado.includes("contact") || estado.includes("seguim")) {
        return {
            bg: "#475569",
            text: "text-slate-700",
            badgeBg: "bg-slate-100",
            badgeText: "text-slate-800",
            label: "En Proceso"
        };
    }

    return {
        bg: "#94A3B8",
        text: "text-slate-600",
        badgeBg: "bg-slate-50",
        badgeText: "text-slate-600",
        label: estadoOriginal || "Sin estatus"
    };
}

{/* COMPONENTE: FUNNEL REAL GEOMÉTRICO CON ESCALA CROMÁTICA DE GRISES A BEIGE (50% ANCHO) */ }
function FunnelCRMCard({
    totalProspectos,
    totalDescalificados,
    totalAsignados,
    totalCitas,
    totalCitasAsistidas,
}) {
    const totalPrecalificados = Math.max(totalProspectos - totalDescalificados, 0);

    const etapas = [
        {
            id: "totales",
            label: "PROSPECTOS TOTALES CAPTADOS",
            value: totalProspectos,
            color: "#18181B",
            textColor: "text-[#18181B]",
            svgTextColor: "#FFFFFF",
            descripcion: "Volumen bruto ingresado en el periodo",
        },
        {
            id: "descalificados",
            label: "DESCALIFICADOS",
            value: totalDescalificados,
            color: "#3F3F46",
            textColor: "text-[#3F3F46]",
            svgTextColor: "#FFFFFF",
            descripcion: "Descartes comerciales y fuera de perfil",
        },
        {
            id: "precalificados",
            label: "PRE-CALIFICADOS",
            value: totalPrecalificados,
            color: "#6B635B",
            textColor: "text-[#6B635B]",
            svgTextColor: "#FFFFFF",
            descripcion: "Resta: Totales Captados − Descalificados",
        },
        {
            id: "asignados",
            label: "ASIGNADOS",
            value: totalAsignados,
            color: "#8C8377",
            textColor: "text-[#8C8377]",
            svgTextColor: "#FFFFFF",
            descripcion: "Prospectos distribuidos a la red de asesores",
        },
        {
            id: "citas",
            label: "CITAS CONCERTADAS",
            value: totalCitas,
            color: "#B5A89E",
            textColor: "text-[#73685F]",
            svgTextColor: "#18181B",
            descripcion: "Citas agendadas para showroom o test drive",
        },
        {
            id: "asistidas",
            label: "CITAS ASISTIDAS",
            value: totalCitasAsistidas,
            color: "#D8CFC4",
            textColor: "text-[#8C7A6B]",
            svgTextColor: "#18181B",
            descripcion: "Citas efectivamente concretadas en concesionario",
        },
    ];

    const anchosEmbudo = [
        { top: 280, bot: 236 },
        { top: 232, bot: 192 },
        { top: 188, bot: 152 },
        { top: 148, bot: 116 },
        { top: 112, bot: 80 },
        { top: 76, bot: 48 },
    ];

    const centroX = 150;
    const altoPaso = 38;
    const separacionPaso = 4;

    return (
        <article className="w-full bg-white p-6 font-light border-b border-[#E5E5E5] flex flex-col justify-between min-h-[460px]">
            <div>
                <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
                    <div>
                        <h2 className="text-xs font-light uppercase tracking-[0.2em] text-[#141414]">
                            Funnel de Conversión Comercial
                        </h2>
                        <p className="mt-0.5 text-[11px] font-light tracking-wide text-[#707070]">
                            Avance cualitativo de cuentas diferenciadas por etapa
                        </p>
                    </div>

                    <span className="text-xs tracking-wide text-[#141414]">
                        Efectividad Global:{" "}
                        <span className="text-[#8C7A6B]">
                            {totalProspectos > 0
                                ? ((totalCitasAsistidas / totalProspectos) * 100).toFixed(1)
                                : "0.0"}
                            %
                        </span>
                    </span>
                </div>

                {totalProspectos === 0 ? (
                    <div className="flex min-h-[260px] items-center justify-center text-xs font-light text-[#707070]">
                        Sin prospectos en el periodo seleccionado
                    </div>
                ) : (
                    <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        {/* EMBUDO VECTORIAL SVG */}
                        <div className="md:col-span-5 flex justify-center py-2">
                            <svg
                                viewBox="0 0 300 256"
                                className="w-full max-w-[240px] h-auto drop-shadow-xs"
                            >
                                {etapas.map((etapa, index) => {
                                    const yTop = index * (altoPaso + separacionPaso);
                                    const yBot = yTop + altoPaso;

                                    const wTop = anchosEmbudo[index].top;
                                    const wBot = anchosEmbudo[index].bot;

                                    const x1 = centroX - wTop / 2;
                                    const x2 = centroX + wTop / 2;
                                    const x3 = centroX + wBot / 2;
                                    const x4 = centroX - wBot / 2;

                                    const puntos = `${x1},${yTop} ${x2},${yTop} ${x3},${yBot} ${x4},${yBot}`;
                                    const pct =
                                        totalProspectos > 0
                                            ? ((etapa.value / totalProspectos) * 100).toFixed(0)
                                            : "0";

                                    return (
                                        <g key={etapa.id} className="group cursor-pointer">
                                            <polygon
                                                points={puntos}
                                                fill={etapa.color}
                                                className="transition-opacity duration-300 hover:opacity-85"
                                            />
                                            <text
                                                x={centroX}
                                                y={yTop + altoPaso / 2 + 3}
                                                textAnchor="middle"
                                                fill={etapa.svgTextColor}
                                                className="text-[10px] font-light tracking-wider pointer-events-none"
                                            >
                                                {etapa.value} ({pct}%)
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>

                        {/* DESGLOSE LATERAL CON LEYENDAS Y VALORES DEL EMBUDO */}
                        <div className="md:col-span-7 divide-y divide-[#F0F0F0] space-y-2 pt-1">
                            {etapas.map((etapa) => {
                                const porcentajeTotal =
                                    totalProspectos > 0
                                        ? ((etapa.value / totalProspectos) * 100).toFixed(1)
                                        : "0.0";

                                return (
                                    <div key={etapa.id} className="pt-2 first:pt-0">
                                        <div className="flex items-center justify-between text-xs font-light">
                                            <div className="flex items-center gap-2 truncate pr-2">
                                                <span
                                                    className="h-2 w-2 rounded-full shrink-0"
                                                    style={{ backgroundColor: etapa.color }}
                                                />
                                                <span
                                                    className="truncate text-[#141414] tracking-wide text-[11px]"
                                                    title={etapa.label}
                                                >
                                                    {etapa.label}
                                                </span>
                                            </div>

                                            <div className="shrink-0 text-right">
                                                <span className={`text-xs ${etapa.textColor}`}>
                                                    {etapa.value}
                                                </span>
                                                <span className="ml-1 text-[10px] text-[#707070]">
                                                    ({porcentajeTotal}%)
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-[9px] text-[#A0A0A0] pl-4 truncate mt-0.5">
                                            {etapa.descripcion}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5E5E5] text-[11px] font-light text-[#707070] flex justify-between">
                <span>Pre-calificación: {totalPrecalificados} leads</span>
                <span>
                    Asistencia / Citas:{" "}
                    {totalCitas > 0
                        ? ((totalCitasAsistidas / totalCitas) * 100).toFixed(0)
                        : 0}
                    %
                </span>
            </div>
        </article>
    );
}

function CanalOrigenEstatusCard({ prospectosFiltrados, totalProspectos }) {
    const canalesMapa = new Map();
    const resumenEstadosGlobal = new Map();

    prospectosFiltrados.forEach((prospecto) => {
        const canal = String(prospecto.canal_contacto ?? "").trim() || "Sin canal";
        const estado = String(prospecto.estado ?? "").trim() || "Sin estatus";

        resumenEstadosGlobal.set(
            estado,
            (resumenEstadosGlobal.get(estado) || 0) + 1
        );

        if (!canalesMapa.has(canal)) {
            canalesMapa.set(canal, {
                canal,
                total: 0,
                estadosMap: new Map(),
            });
        }

        const itemCanal = canalesMapa.get(canal);
        itemCanal.total += 1;
        itemCanal.estadosMap.set(
            estado,
            (itemCanal.estadosMap.get(estado) || 0) + 1
        );
    });

    const listaCanales = [...canalesMapa.values()].sort(
        (a, b) => b.total - a.total
    );

    const maxCanalTotal = Math.max(...listaCanales.map((c) => c.total), 1);

    const estadosUnicosGlobales = [...resumenEstadosGlobal.entries()]
        .map(([estado, count]) => ({
            estado,
            count,
            colorInfo: obtenerColorEstado(estado),
        }))
        .sort((a, b) => b.count - a.count);

    return (
        <article className="w-full bg-white p-6 font-light border-b border-[#E5E5E5]">
            <div className="flex flex-col gap-2 border-b border-[#E5E5E5] pb-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-xs font-light uppercase tracking-[0.25em] text-[#141414]">
                        Canal de Origen vs. Estatus Comercial
                    </h2>
                    <p className="text-[11px] font-light tracking-wide text-[#707070]">
                        Proporción de volumen por origen y desglose de cualificación
                    </p>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-[11px] font-light">
                    <span className="text-[#707070] tracking-wide">
                        Canales: <span className="text-[#141414]">{listaCanales.length}</span>
                    </span>
                    <span className="text-[#141414] tracking-wide">
                        Total Leads: <span className="text-[#001E50]">{totalProspectos}</span>
                    </span>
                </div>
            </div>

            {estadosUnicosGlobales.length > 0 && (
                <div className="mt-4 pb-3 border-b border-[#F0F0F0] flex flex-wrap items-center justify-between gap-2 text-[10px] font-light">
                    <div className="flex items-center gap-1.5 text-[#707070] uppercase tracking-[0.2em]">
                        <Layers size={11} strokeWidth={1.5} className="text-[#141414]" />
                        Leyenda de Estatus:
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {estadosUnicosGlobales.map((item) => {
                            const porcentajeGlobal =
                                totalProspectos > 0
                                    ? ((item.count / totalProspectos) * 100).toFixed(1)
                                    : "0.0";

                            return (
                                <div
                                    key={item.estado}
                                    className="inline-flex items-center gap-1.5 text-[10px] tracking-wide"
                                >
                                    <span
                                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                                        style={{ backgroundColor: item.colorInfo.bg }}
                                    />
                                    <span className="text-[#141414]">
                                        {item.estado}
                                    </span>
                                    <span className="text-[#707070]">
                                        ({item.count} · {porcentajeGlobal}%)
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {listaCanales.length === 0 ? (
                <div className="flex min-h-[120px] items-center justify-center text-xs font-light text-[#707070]">
                    Sin datos de canal registrados
                </div>
            ) : (
                <div className="divide-y divide-[#F0F0F0]">
                    {listaCanales.map((item) => {
                        const porcentajeCanalDelTotal =
                            totalProspectos > 0
                                ? ((item.total / totalProspectos) * 100).toFixed(1)
                                : "0.0";

                        const anchoBarraCanal = (item.total / maxCanalTotal) * 100;

                        const desgloseEstadosCanal = [...item.estadosMap.entries()]
                            .map(([estado, count]) => ({
                                estado,
                                count,
                                porcentajeEnCanal: (count / item.total) * 100,
                                colorInfo: obtenerColorEstado(estado),
                            }))
                            .sort((a, b) => b.count - a.count);

                        return (
                            <div
                                key={item.canal}
                                className="py-3.5 transition-colors hover:bg-[#FAFAFA]"
                            >
                                <div className="mb-2 flex items-center justify-between gap-2 text-xs font-light">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-[#141414] truncate text-xs tracking-wide">
                                            {item.canal}
                                        </span>
                                        <span className="text-[10px] text-[#707070]">
                                            ({porcentajeCanalDelTotal}% del total)
                                        </span>
                                    </div>

                                    <div className="text-[#141414] text-xs shrink-0 tracking-wide">
                                        {item.total} <span className="text-[#707070]">leads</span>
                                    </div>
                                </div>

                                <div className="h-1.5 w-full bg-[#F4F4F2] overflow-hidden">
                                    <div
                                        className="flex h-full transition-all duration-500"
                                        style={{ width: `${Math.max(anchoBarraCanal, 2)}%` }}
                                    >
                                        {desgloseEstadosCanal.map((itemEstado) => (
                                            <div
                                                key={itemEstado.estado}
                                                title={`${item.canal} → ${itemEstado.estado}: ${itemEstado.count} (${itemEstado.porcentajeEnCanal.toFixed(1)}%)`}
                                                className="h-full transition-all hover:opacity-85 cursor-pointer"
                                                style={{
                                                    width: `${itemEstado.porcentajeEnCanal}%`,
                                                    backgroundColor: itemEstado.colorInfo.bg,
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-2 flex flex-wrap items-center gap-3">
                                    {desgloseEstadosCanal.map((itemEstado) => (
                                        <div
                                            key={itemEstado.estado}
                                            className="flex items-center gap-1.5 text-[10px]"
                                        >
                                            <span
                                                className="h-1.5 w-1.5 rounded-full shrink-0"
                                                style={{ backgroundColor: itemEstado.colorInfo.bg }}
                                            />
                                            <span className="text-[#707070]">{itemEstado.estado}:</span>
                                            <span className="text-[#141414]">{itemEstado.count}</span>
                                            <span className="text-[#A0A0A0]">
                                                ({itemEstado.porcentajeEnCanal.toFixed(0)}%)
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </article>
    );
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
        <article className="flex min-h-[340px] flex-col bg-white p-6 font-light border-b border-[#E5E5E5]">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
                <div>
                    <h2 className="text-xs font-light uppercase tracking-[0.2em] text-[#141414]">
                        {title}
                    </h2>
                    <p className="mt-0.5 text-[11px] font-light tracking-wide text-[#707070]">
                        {subtitle}
                    </p>
                </div>
                {Icon && (
                    <div className="text-[#141414]">
                        <Icon size={16} strokeWidth={1.5} />
                    </div>
                )}
            </div>

            {items.length === 0 ? (
                <div className="flex flex-1 items-center justify-center text-xs font-light text-[#707070]">
                    {emptyText}
                </div>
            ) : (
                <div className="mt-4 space-y-3.5 divide-y divide-[#F5F5F5]">
                    {items.map((item) => {
                        const porcentaje =
                            total > 0
                                ? (item.value / total) * 100
                                : 0;

                        const ancho = (item.value / maximo) * 100;

                        return (
                            <div key={item.label} className="pt-2.5 first:pt-0">
                                <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                                    <span
                                        className="truncate font-light tracking-wide text-[#141414]"
                                        title={item.label}
                                    >
                                        {item.label}
                                    </span>

                                    <span className="shrink-0 font-light text-[#141414]">
                                        {item.value}
                                        <span className="ml-1 text-[#707070]">
                                            ({porcentaje.toFixed(1)}%)
                                        </span>
                                    </span>
                                </div>

                                <div className="h-1 w-full bg-[#F4F4F2]">
                                    <div
                                        className="h-full bg-[#001E50] transition-all duration-500"
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
        <article className="flex min-h-[340px] flex-col bg-white p-6 font-light border-b border-[#E5E5E5]">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
                <div>
                    <h2 className="text-xs font-light uppercase tracking-[0.2em] text-[#141414]">
                        Motivos de Descalificación
                    </h2>
                    <p className="mt-0.5 text-[11px] font-light tracking-wide text-[#707070]">
                        Causas de descarte comercial
                    </p>
                </div>
                <div className="text-[#141414]">
                    <PieChartIcon size={16} strokeWidth={1.5} />
                </div>
            </div>

            {total === 0 ? (
                <div className="flex flex-1 items-center justify-center text-xs font-light text-[#707070]">
                    Sin prospectos descalificados en el periodo
                </div>
            ) : (
                <div className="mt-4 flex flex-1 flex-col justify-between">
                    <div className="flex justify-center py-2">
                        <div
                            className="relative flex h-32 w-32 items-center justify-center rounded-full"
                            style={{ background: fondoGradiente }}
                        >
                            <div className="flex h-22 w-22 flex-col items-center justify-center rounded-full bg-white">
                                <span className="text-3xl font-light text-[#141414]">
                                    {total}
                                </span>
                                <span className="text-[8px] font-light uppercase tracking-[0.25em] text-[#707070]">
                                    Descartados
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 divide-y divide-[#F0F0F0] border-t border-[#E5E5E5] pt-2">
                        {segmentos.map((item) => {
                            const porcentaje = total > 0 ? (item.value / total) * 100 : 0;

                            return (
                                <div
                                    key={item.label}
                                    className="flex items-center justify-between gap-2 py-1.5 text-[11px]"
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <span
                                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span
                                            className="truncate text-[#141414]"
                                            title={item.label}
                                        >
                                            {item.label}
                                        </span>
                                    </div>
                                    <span className="shrink-0 text-[#141414]">
                                        {item.value}{" "}
                                        <span className="text-[#707070]">
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

{/* COMPONENTE: PROSPECTOS POR ASESOR CON CAMPO DE COMENTARIOS INTEGRADO */ }
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
        <article className="w-full bg-white p-6 font-light border-b border-[#E5E5E5] min-h-[460px]">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
                <div>
                    <h2 className="text-xs font-light uppercase tracking-[0.2em] text-[#141414]">
                        Prospectos por Asesor de Ventas
                    </h2>
                    <p className="mt-0.5 text-[11px] font-light tracking-wide text-[#707070]">
                        Haz clic sobre cualquier asesor para desplegar la relación de prospectos asignados
                    </p>
                </div>

                <span className="text-xs tracking-wide text-[#141414]">
                    Total Asignados: <span className="text-[#001E50]">{totalProspectosAsignados}</span>
                </span>
            </div>

            {listaAsesores.length === 0 ? (
                <div className="flex min-h-[220px] items-center justify-center text-xs font-light text-[#707070]">
                    Sin prospectos asignados en el periodo seleccionado
                </div>
            ) : (
                <div className="divide-y divide-[#F0F0F0]">
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
                                className="py-3.5 transition-colors hover:bg-[#FAFAFA]"
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setAsesorExpandido(estaExpandido ? null : item.nombre)
                                    }
                                    className="w-full text-left focus:outline-none group"
                                >
                                    <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <User size={13} className="text-[#707070] stroke-1" />
                                            <span
                                                className="truncate text-[#141414] tracking-wide group-hover:text-[#001E50]"
                                                title={item.nombre}
                                            >
                                                {item.nombre}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[#141414]">
                                                {item.value}
                                                <span className="ml-1 text-[#707070]">
                                                    ({porcentaje.toFixed(1)}%)
                                                </span>
                                            </span>
                                            {estaExpandido ? (
                                                <ChevronUp size={15} className="text-[#141414]" />
                                            ) : (
                                                <ChevronDown size={15} className="text-[#707070]" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="h-1.5 w-full bg-[#F4F4F2]">
                                        <div
                                            className="h-full bg-[#001E50] transition-all duration-500"
                                            style={{ width: `${anchoBarra}%` }}
                                        />
                                    </div>
                                </button>

                                {/* DESGLOSE DESPLEGABLE CON COMENTARIOS DEL ASESOR DIGITAL */}
                                {estaExpandido && (
                                    <div className="mt-3 border-t border-[#E5E5E5] pt-3 space-y-2">
                                        <div className="flex items-center justify-between text-xs text-[#707070] mb-2">
                                            <span className="uppercase tracking-[0.2em] text-[10px]">
                                                Relación de Prospectos de {item.nombre}
                                            </span>
                                            <span className="text-[#141414]">
                                                {item.prospectos.length} registros
                                            </span>
                                        </div>

                                        <div className="max-h-64 overflow-y-auto divide-y divide-[#F5F5F5] pr-1 space-y-2">
                                            {item.prospectos.map((prospecto) => {
                                                const comentarioTexto =
                                                    prospecto.comentarios ||
                                                    prospecto.comentario ||
                                                    prospecto.observaciones ||
                                                    prospecto.notas ||
                                                    "Sin comentarios registrados";

                                                return (
                                                    <div
                                                        key={prospecto.id}
                                                        className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pt-2.5 pb-2 text-xs"
                                                    >
                                                        <div className="space-y-1 min-w-0 flex-1">
                                                            <p className="text-[#141414] font-normal">
                                                                {prospecto.nombre || "Sin nombre"}
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#707070]">
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

                                                            {/* BLOQUE DE COMENTARIO DEL ASESOR DIGITAL */}
                                                            <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-[#444444] bg-[#F8F8F7] p-2 border-l-2 border-[#001E50]">
                                                                <MessageSquare
                                                                    size={12}
                                                                    strokeWidth={1.5}
                                                                    className="mt-0.5 shrink-0 text-[#001E50]"
                                                                />
                                                                <span
                                                                    className="leading-snug"
                                                                    title={comentarioTexto}
                                                                >
                                                                    {comentarioTexto}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1.5 shrink-0 text-right">
                                                            {prospecto.auto_interes && (
                                                                <span className="inline-flex items-center gap-1 border-b border-[#E5E5E5] pb-0.5 text-[10px] text-[#141414]">
                                                                    <Car size={10} strokeWidth={1.5} />
                                                                    {prospecto.auto_interes}
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] text-[#707070]">
                                                                {prospecto.estado || "Sin estatus"}
                                                            </span>
                                                            <span className="text-[10px] text-[#707070] flex items-center gap-1">
                                                                <Calendar size={10} strokeWidth={1.5} />
                                                                {formatearFecha(prospecto.creado)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
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
    const [canalFiltro, setCanalFiltro] = useState("TODOS");
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

    const canalesDisponibles = [
        "TODOS",
        ...new Set(
            prospectos
                .map((p) => String(p.canal_contacto ?? "").trim())
                .filter(Boolean)
        ),
    ];

    const prospectosFiltrados = prospectos.filter((prospecto) => {
        const fecha = fechaValida(prospecto.creado);
        if (!fecha) return false;

        const coincideAnio = fecha.getFullYear() === Number(anio);
        const coincideMes = fecha.getMonth() === MESES_NUMERO[mes];

        const dia = fecha.getDate();
        const coincideDia =
            dia >= Number(diaInicio) && dia <= Number(diaFin);

        const canalTexto = String(prospecto.canal_contacto ?? "").trim();
        const coincideCanal =
            canalFiltro === "TODOS" ||
            normalizarTexto(canalTexto) === normalizarTexto(canalFiltro);

        return coincideAnio && coincideMes && coincideDia && coincideCanal;
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
        <div className="w-full space-y-6 bg-white px-4 md:px-8 py-6 text-[#141414] font-bahnschrift font-light">
            {/* TIPOGRAFÍA BAHNSCHRIFT LIGHT */}
            <style>{`
        .font-bahnschrift {
          font-family: 'Bahnschrift Light', 'Bahnschrift', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
        }
      `}</style>

            {errorCarga && (
                <div className="border-b border-red-200 bg-red-50 p-3 text-xs font-light text-red-600">
                    {errorCarga}
                </div>
            )}

            {/* 1. HERO KPI CARD EN EL TOP A TODO EL ANCHO DE LA PANTALLA */}

            <section className="relative w-full overflow-hidden border-b border-[#E5E5E5] p-6 text-white md:p-8 font-light">

                {/* VIDEO DE FONDO */}
                <video
                    className="absolute inset-0 h-full w-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                >
                    <source src="../video.webm" type="video/webm" />
                </video>

                {/* DIFUMINADO VERTICAL */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/55 to-black/90" />

                {/* CONTENIDO */}
                <div className="relative z-10">

                    <div className="flex flex-col gap-2 border-b border-white/20 pb-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <span className="text-[10px] font-light uppercase tracking-[0.3em] text-slate-300">
                                Volvo Suecia Car Angelopolis · CRM Dashboard
                            </span>

                            <h1 className="mt-1 text-2xl font-light tracking-tight text-white md:text-3xl">
                                Rendimiento Comercial de Prospectos
                            </h1>
                        </div>

                        <div className="text-xs font-light tracking-wide text-slate-300">
                            Periodo Activo:{" "}
                            <span className="font-light text-white">
                                {mes} {anio}
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">

                        {/* TOTAL HIGHLIGHT */}
                        <div className="lg:col-span-5">
                            <p className="text-[11px] font-light uppercase tracking-[0.2em] text-slate-300">
                                Prospectos Totales Captados
                            </p>

                            <div className="mt-1 flex items-baseline gap-3">
                                <h2 className="text-5xl font-light tracking-tight text-white md:text-6xl">
                                    {cargando ? "..." : totalProspectos}
                                </h2>

                                <span className="inline-flex items-center gap-1 border border-white/20 bg-black/40 px-2.5 py-1 text-xs font-light tracking-wider text-emerald-300 backdrop-blur-md">
                                    <TrendingUp size={12} strokeWidth={1.5} />
                                    {tasaAsignacion}% asignación
                                </span>
                            </div>
                        </div>

                        {/* TARJETAS KPI */}
                        <div className="grid grid-cols-2 gap-px border border-white/20 bg-white/20 sm:grid-cols-4 lg:col-span-7">

                            <div className="bg-black/50 p-4 backdrop-blur-xs">
                                <p className="text-[9px] font-light uppercase tracking-[0.2em] text-slate-300">
                                    Asignados
                                </p>

                                <p className="mt-1 text-2xl font-light text-white">
                                    {totalAsignados}
                                </p>

                                <p className="mt-0.5 text-[10px] font-light text-slate-400">
                                    Distribuidos a la red
                                </p>
                            </div>

                            <div className="bg-black/50 p-4 backdrop-blur-xs">
                                <p className="text-[9px] font-light uppercase tracking-[0.2em] text-slate-300">
                                    Citas Agendadas
                                </p>

                                <p className="mt-1 text-2xl font-light text-white">
                                    {totalCitas}
                                </p>

                                <p className="mt-0.5 text-[10px] font-light text-slate-400">
                                    Showroom & Test Drives
                                </p>
                            </div>

                            <div className="bg-black/50 p-4 backdrop-blur-xs">
                                <p className="text-[9px] font-light uppercase tracking-[0.2em] text-slate-300">
                                    Tasa Asistencia
                                </p>

                                <p className="mt-1 text-2xl font-light text-emerald-300">
                                    {tasaAsistencia.toFixed(0)}%
                                </p>

                                <p className="mt-0.5 text-[10px] font-light text-slate-400">
                                    {totalCitasAsistidas} asistencias
                                </p>
                            </div>

                            <div className="bg-black/50 p-4 backdrop-blur-xs">
                                <p className="text-[9px] font-light uppercase tracking-[0.2em] text-slate-300">
                                    Descartados
                                </p>

                                <p className="mt-1 text-2xl font-light text-rose-300">
                                    {totalDescalificados}
                                </p>

                                <p className="mt-0.5 text-[10px] font-light text-slate-400">
                                    Fuera de perfil
                                </p>
                            </div>

                        </div>
                    </div>

                </div>
            </section>

            {/* 2. FILTROS EN SEGUNDO ORDEN */}
            <section className="w-full border-b border-[#E5E5E5] pb-4 pt-2 font-light">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* AÑO */}
                        <div className="flex items-center gap-2 border-b border-[#E5E5E5] py-1">
                            <CalendarDays size={13} className="text-[#141414]" strokeWidth={1.5} />
                            <select
                                value={anio}
                                onChange={(e) => setAnio(Number(e.target.value))}
                                className="bg-transparent text-xs font-light uppercase tracking-[0.15em] text-[#141414] outline-none cursor-pointer"
                            >
                                {aniosDisponibles.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* BOTÓN DESPLEGABLE: CANAL DE ORIGEN */}
                        <div className="flex items-center gap-2 border-b border-[#E5E5E5] py-1">
                            <Filter size={13} className="text-[#141414]" strokeWidth={1.5} />
                            <span className="text-[10px] font-light uppercase tracking-[0.15em] text-[#707070]">
                                Canal:
                            </span>
                            <select
                                value={canalFiltro}
                                onChange={(e) => setCanalFiltro(e.target.value)}
                                className="bg-transparent text-xs font-light uppercase tracking-[0.15em] text-[#141414] outline-none cursor-pointer"
                            >
                                {canalesDisponibles.map((item) => (
                                    <option key={item} value={item}>
                                        {item === "TODOS" ? "Todos los canales" : item}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="hidden h-4 w-px bg-[#E5E5E5] md:block" />

                        {/* MESES */}
                        <div className="flex flex-wrap items-center gap-1">
                            {MESES.map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => setMes(item)}
                                    className={`px-2.5 py-1 text-xs font-light tracking-wider transition-colors ${mes === item
                                        ? "bg-[#141414] text-white"
                                        : "text-[#707070] hover:bg-[#F5F5F5]"
                                        }`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* RANGO DÍAS */}
                    <div className="flex items-center gap-2.5 border-b border-[#E5E5E5] py-1">
                        <span className="text-[10px] font-light uppercase tracking-[0.15em] text-[#707070]">
                            Días
                        </span>
                        <span className="text-xs font-light text-[#141414]">
                            {String(diaInicio).padStart(2, "0")}
                        </span>
                        <input
                            type="range"
                            min="1"
                            max="31"
                            value={diaFin}
                            onChange={(e) => setDiaFin(Number(e.target.value))}
                            className="w-20 accent-[#141414] cursor-pointer"
                        />
                        <span className="text-xs font-light text-[#141414]">
                            {String(diaFin).padStart(2, "0")}
                        </span>
                    </div>
                </div>
            </section>

            {/* 3. SECCIÓN EN 2 COLUMNAS (50% FUNNEL GEOMÉTRICO CON GRISES A BEIGE / 50% PROSPECTOS POR ASESOR) */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-start">
                {/* LADO IZQUIERDO 50%: FUNNEL REAL DE CONVERSIÓN CON TRAPEZOIDES VECTORIALES */}
                <FunnelCRMCard
                    totalProspectos={totalProspectos}
                    totalDescalificados={totalDescalificados}
                    totalAsignados={totalAsignados}
                    totalCitas={totalCitas}
                    totalCitasAsistidas={totalCitasAsistidas}
                />

                {/* LADO DERECHO 50%: PROSPECTOS POR ASESOR DE VENTAS CON COMENTARIOS */}
                <ProspectosPorAsesorCard
                    prospectosConAsesor={prospectosConAsesor}
                    totalProspectosAsignados={totalProspectosAsignados}
                />
            </section>

            {/* 4. CANAL DE ORIGEN APILADO CON ANCHO PROPORCIONAL (100% ANCHO) */}
            <section className="w-full">
                <CanalOrigenEstatusCard
                    prospectosFiltrados={prospectosFiltrados}
                    totalProspectos={totalProspectos}
                />
            </section>

            {/* 5. FILA DE ANALÍTICA */}
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2 font-light w-full">
                <article className="flex min-h-[340px] flex-col bg-white p-6 border-b border-[#E5E5E5]">
                    <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
                        <div>
                            <h2 className="text-xs font-light uppercase tracking-[0.2em] text-[#141414]">
                                Estatus General de Prospectos
                            </h2>
                            <p className="mt-0.5 text-[11px] font-light text-[#707070]">
                                Embudo general de cualificación comercial
                            </p>
                        </div>
                        <div className="text-[#141414]">
                            <BarChart3 size={16} strokeWidth={1.5} />
                        </div>
                    </div>

                    <div className="mt-4 flex-1 space-y-3.5 divide-y divide-[#F5F5F5]">
                        {estatusProspectos.map((item) => (
                            <div key={item.label} className="pt-2.5 first:pt-0">
                                <div className="mb-1.5 flex items-center justify-between text-xs font-light">
                                    <span className="text-[#141414] tracking-wide">
                                        {item.label}
                                    </span>
                                    <span className="text-[#141414]">
                                        {item.value}{" "}
                                        <span className="text-[#707070]">
                                            ({item.percent}%)
                                        </span>
                                    </span>
                                </div>
                                <div className="h-1 w-full bg-[#F4F4F2]">
                                    <div
                                        className="h-full transition-all duration-500"
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

                <article className="flex min-h-[340px] flex-col bg-white p-6 border-b border-[#E5E5E5] font-light">
                    <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
                        <div>
                            <h2 className="text-xs font-light uppercase tracking-[0.2em] text-[#141414]">
                                Actividad Diaria
                            </h2>
                            <p className="mt-0.5 text-[11px] font-light text-[#707070]">
                                {mes || "—"} {anio || "—"}
                            </p>
                        </div>
                        {picoDia && (
                            <span className="border-b border-[#141414] pb-0.5 text-[11px] font-light text-[#141414]">
                                Pico: Día {picoDia.day} ({picoDia.value})
                            </span>
                        )}
                    </div>

                    <div className="mt-4 flex h-40 items-end gap-1 p-2">
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
                                        className={`w-full transition-colors ${esPico ? "bg-[#001E50]" : "bg-[#141414]/30 hover:bg-[#141414]"
                                            }`}
                                        style={{ height: `${height}%` }}
                                    />
                                    <span
                                        className={`mt-2 text-[9px] font-light ${esPico ? "text-[#141414]" : "text-[#707070]"
                                            }`}
                                    >
                                        {item.day}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-auto border-t border-[#E5E5E5] pt-3 text-xs font-light text-[#707070]">
                        Promedio: <span className="text-[#141414]">{promedioDia}</span> prospectos / día activo
                    </div>
                </article>
            </section>

            {/* 6. RANKINGS */}
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3 font-light w-full">
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

            {/* 7. PANEL DE CITAS Y ASISTENCIA */}
            <section className="w-full font-light">
                <article className="flex flex-col justify-between bg-white p-6 border-b border-[#E5E5E5]">
                    <div>
                        <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
                            <div>
                                <h2 className="text-xs font-light uppercase tracking-[0.2em] text-[#141414]">
                                    Citas y Asistencia Comercial
                                </h2>
                                <p className="mt-0.5 text-[11px] font-light text-[#707070]">
                                    Efectividad y detalle de citas agendadas en el periodo
                                </p>
                            </div>
                            <span className="text-xs text-[#141414]">
                                Total Registradas: <span className="text-[#001E50]">{totalCitas}</span>
                            </span>
                        </div>

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-px bg-[#E5E5E5] border border-[#E5E5E5]">
                            <div className="bg-white p-4 text-center">
                                <p className="text-[9px] font-light uppercase tracking-[0.2em] text-[#707070]">
                                    Citas Agendadas
                                </p>
                                <p className="mt-1 text-2xl font-light text-[#141414]">
                                    {totalCitas}
                                </p>
                            </div>

                            <div className="bg-white p-4 text-center">
                                <p className="text-[9px] font-light uppercase tracking-[0.2em] text-emerald-600">
                                    Asistidas
                                </p>
                                <p className="mt-1 text-2xl font-light text-emerald-600">
                                    {totalCitasAsistidas}
                                </p>
                            </div>

                            <div className="bg-white p-4 text-center">
                                <p className="text-[9px] font-light uppercase tracking-[0.2em] text-[#707070]">
                                    No Asistidas
                                </p>
                                <p className="mt-1 text-2xl font-light text-[#141414]">
                                    {totalCitasNoAsistidas}
                                </p>
                            </div>

                            <div className="bg-white p-4 text-center">
                                <p className="text-[9px] font-light uppercase tracking-[0.2em] text-[#001E50]">
                                    Tasa de Asistencia
                                </p>
                                <p className="mt-1 text-2xl font-light text-[#001E50]">
                                    {tasaAsistencia.toFixed(1)}%
                                </p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-[11px] font-light uppercase tracking-[0.2em] text-[#707070] mb-3">
                                Relación de Citas del Periodo
                            </h3>

                            {prospectosConCita.length === 0 ? (
                                <div className="p-4 text-center text-xs font-light text-[#707070] border-b border-[#E5E5E5]">
                                    No hay citas registradas en el periodo seleccionado.
                                </div>
                            ) : (
                                <div className="max-h-[240px] overflow-auto">
                                    <table className="w-full text-left text-xs font-light border-collapse">
                                        <thead className="sticky top-0 bg-white border-b border-[#E5E5E5] text-[10px] font-light uppercase tracking-[0.2em] text-[#707070]">
                                            <tr>
                                                <th className="py-2.5 pr-4">Fecha Cita</th>
                                                <th className="py-2.5 pr-4">Prospecto</th>
                                                <th className="py-2.5 pr-4">Asesor Asignado</th>
                                                <th className="py-2.5 pr-4">Modelo Interés</th>
                                                <th className="py-2.5">Asistencia</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#F5F5F5] bg-white">
                                            {prospectosConCita.map((prospecto) => {
                                                const asistio =
                                                    prospecto.asistencia === true ||
                                                    normalizarTexto(prospecto.asistencia) === "true";

                                                return (
                                                    <tr key={prospecto.id} className="hover:bg-[#FAFAFA]">
                                                        <td className="py-2.5 pr-4 text-[#001E50]">
                                                            {formatearFecha(prospecto.ultima_cita_agendada || prospecto.ultima_cita)}
                                                        </td>
                                                        <td className="py-2.5 pr-4 text-[#141414]">
                                                            {prospecto.nombre || "Sin nombre"}
                                                        </td>
                                                        <td className="py-2.5 pr-4 text-[#707070]">
                                                            {prospecto.asesor_ventas || "Sin asignar"}
                                                        </td>
                                                        <td className="py-2.5 pr-4 text-[#707070]">
                                                            {prospecto.auto_interes || "—"}
                                                        </td>
                                                        <td className="py-2.5">
                                                            {asistio ? (
                                                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700">
                                                                    <CheckCircle2 size={11} />
                                                                    Asistió
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-[10px] text-[#B04B4B]">
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

                    <div className="mt-4 pt-3 border-t border-[#E5E5E5] text-[11px] font-light text-[#707070]">
                        Fuente: CRM Volvo Concesionario
                    </div>
                </article>
            </section>

            {/* 8. TABLA DE DETALLE */}
            <section className="bg-white font-light border-b border-[#E5E5E5] w-full">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E5E5] py-4">
                    <div>
                        <h2 className="text-xs font-light uppercase tracking-[0.2em] text-[#141414]">
                            Detalle de Prospectos
                        </h2>
                        <p className="mt-0.5 text-[11px] font-light text-[#707070]">
                            Registros correspondientes al periodo seleccionado
                        </p>
                    </div>
                    <span className="text-xs text-[#141414] tracking-wide">
                        {prospectosTabla.length} registros
                    </span>
                </div>

                {prospectosTabla.length === 0 ? (
                    <div className="flex min-h-[160px] items-center justify-center p-6 text-xs font-light text-[#707070]">
                        No hay prospectos para el periodo seleccionado.
                    </div>
                ) : (
                    <div className="max-h-[480px] overflow-auto">
                        <table className="w-full min-w-[1250px] border-collapse text-left text-xs font-light">
                            <thead className="sticky top-0 z-10 bg-white border-b border-[#E5E5E5]">
                                <tr className="text-[10px] font-light uppercase tracking-[0.2em] text-[#707070]">
                                    <th className="py-3 pr-4">Fecha</th>
                                    <th className="py-3 pr-4">Prospecto</th>
                                    <th className="py-3 pr-4">Teléfono</th>
                                    <th className="py-3 pr-4">Canal</th>
                                    <th className="py-3 pr-4">Pauta</th>
                                    <th className="py-3 pr-4">Estado</th>
                                    <th className="py-3 pr-4">Modelo</th>
                                    <th className="py-3 pr-4">Asesor</th>
                                    <th className="py-3 pr-4">Cita</th>
                                    <th className="py-3 pr-4">Asistencia</th>
                                    <th className="py-3">Comentarios</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F0F0F0]">
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
                                            className="transition-colors hover:bg-[#FAFAFA]"
                                        >
                                            <td className="whitespace-nowrap py-3 pr-4 text-[#707070]">
                                                {formatearFecha(prospecto.creado)}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <div
                                                    className="text-[#141414] truncate max-w-[180px]"
                                                    title={prospecto.nombre || ""}
                                                >
                                                    {prospecto.nombre || "Sin nombre"}
                                                </div>
                                                <div
                                                    className="text-[11px] text-[#707070] truncate max-w-[180px]"
                                                    title={prospecto.correo || ""}
                                                >
                                                    {prospecto.correo || "Sin correo"}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap py-3 pr-4 text-[#141414]">
                                                {prospecto.telefono || "—"}
                                            </td>
                                            <td className="whitespace-nowrap py-3 pr-4 text-[#141414]">
                                                {prospecto.canal_contacto || "—"}
                                            </td>
                                            <td
                                                className="py-3 pr-4 text-[#707070] truncate max-w-[180px]"
                                                title={prospecto.pauta || ""}
                                            >
                                                {prospecto.pauta || "—"}
                                            </td>
                                            <td className="whitespace-nowrap py-3 pr-4">
                                                <span className="text-[11px] text-[#141414]">
                                                    {prospecto.estado || "Sin estatus"}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap py-3 pr-4 text-[#141414]">
                                                {prospecto.auto_interes || "—"}
                                            </td>
                                            <td className="whitespace-nowrap py-3 pr-4 text-[#141414]">
                                                {prospecto.asesor_ventas || "Sin asignar"}
                                            </td>
                                            <td className="whitespace-nowrap py-3 pr-4 text-[#001E50]">
                                                {tieneCita
                                                    ? formatearFecha(prospecto.ultima_cita_agendada)
                                                    : "—"}
                                            </td>
                                            <td className="whitespace-nowrap py-3 pr-4">
                                                {tieneCita ? (
                                                    asistio ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
                                                            <CheckCircle2 size={11} strokeWidth={1.5} />
                                                            Asistió
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-[#B04B4B]">
                                                            <XCircle size={11} strokeWidth={1.5} />
                                                            No asistió
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="text-[#707070]">—</span>
                                                )}
                                            </td>
                                            <td
                                                className="py-3 text-[#707070] max-w-[220px] truncate"
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