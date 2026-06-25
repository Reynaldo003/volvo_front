// src/pages/CitasPiso/AgendaCitasPiso.jsx
import { useState, useEffect, useMemo } from "react";
import {
    ChevronLeft, ChevronRight, Loader2,
    Car, Phone, Building2, CheckCircle2, XCircle,
    Circle, UserStar, MessageSquare, Search, X,
} from "lucide-react";
import { apiCitasPiso } from "../../lib/apiCitasPiso";
import CitasPisoTopNav from "./CitasPisoTopNav";

// ─── helpers ──────────────────────────────────────────────────────────────────
const PAD = (n) => String(n).padStart(2, "0");

function parseLocalDT(raw) {
    if (!raw) return null;
    const d = new Date(String(raw));
    return isNaN(d.getTime()) ? null : d;
}
function localYMD(date) {
    return `${date.getFullYear()}-${PAD(date.getMonth() + 1)}-${PAD(date.getDate())}`;
}
function localHHMM(date) { return `${PAD(date.getHours())}:${PAD(date.getMinutes())}`; }
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function startOfWeek(date) {
    const d = new Date(date);
    const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

const DIAS_CORTOS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const MESES = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

// ─── Layout del grid de horario ───────────────────────────────────────────────
const DAY_COL_WIDTH = 92;   // columna de día (izquierda, sticky)
const HOUR_COL_WIDTH = 130; // ancho de cada hora
const LANE_HEIGHT = 96;     // alto de cada "carril" de tarjeta
const ROW_PADDING = 10;
const MIN_ROW_HEIGHT = 86;
const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 19; // se expande automáticamente si hay registros fuera de rango

// ─── Colores por Be Back ──────────────────────────────────────────────────────
const BE_BACK_COLOR = {
    true: {
        border: "border-emerald-400",
        icon:   "text-emerald-600",
        name:   "text-emerald-900",
        meta:   "text-emerald-700/80",
        dot:    "bg-emerald-500",
        chip:   "bg-emerald-50 border-emerald-200 text-emerald-700",
    },
    false: {
        border: "border-red-300",
        icon:   "text-red-500",
        name:   "text-red-900",
        meta:   "text-red-700/70",
        dot:    "bg-red-400",
        chip:   "bg-red-50 border-red-200 text-red-600",
    },
    null: {
        border: "border-slate-300",
        icon:   "text-slate-400",
        name:   "text-slate-900",
        meta:   "text-slate-500",
        dot:    "bg-slate-400",
        chip:   "bg-slate-50 border-slate-200 text-slate-500",
    },
};
function colorFor(beBack) {
    if (beBack === true)  return BE_BACK_COLOR.true;
    if (beBack === false) return BE_BACK_COLOR.false;
    return BE_BACK_COLOR.null;
}
function StatusIcon({ value }) {
    const c = colorFor(value);
    if (value === true)  return <CheckCircle2 className={`h-3.5 w-3.5 ${c.icon}`} />;
    if (value === false) return <XCircle className={`h-3.5 w-3.5 ${c.icon}`} />;
    return <Circle className={`h-3.5 w-3.5 ${c.icon}`} />;
}

// ─── Asignación de carriles (evita traslapes horizontales por hora) ──────────
function assignLanes(registros) {
    const sorted = registros
        .map((r) => ({ r, start: parseLocalDT(r.fecha_hora_cita) }))
        .filter((x) => x.start)
        .sort((a, b) => a.start.getTime() - b.start.getTime());

    const laneEnds = []; // último "fin" ocupado por carril (asumiendo bloque de 1h)
    const placed = [];

    sorted.forEach(({ r, start }) => {
        const startMs = start.getTime();
        const endMs = startMs + 60 * 60 * 1000;
        let lane = laneEnds.findIndex((end) => end <= startMs);
        if (lane === -1) {
            lane = laneEnds.length;
            laneEnds.push(endMs);
        } else {
            laneEnds[lane] = endMs;
        }
        placed.push({ registro: r, start, lane });
    });

    return { items: placed, laneCount: Math.max(1, laneEnds.length) };
}

// ─── Tarjeta compacta dentro del grid ────────────────────────────────────────
function PisoSlotCard({ registro, start, style }) {
    const c = colorFor(registro.be_back);

    return (
        <div
            className={[
                "absolute rounded-md border bg-white shadow-sm overflow-hidden",
                "hover:shadow-md hover:z-30 transition-shadow cursor-default",
                c.border,
            ].join(" ")}
            style={style}
            title={registro?.cliente?.nombre || ""}
        >
            <div className="flex items-center justify-between gap-1 px-2 pt-1.5">
                <span className="text-[11px] font-extrabold text-black/60">
                    {localHHMM(start)}
                </span>
                <StatusIcon value={registro.be_back} />
            </div>

            <div className="px-2 pb-1.5 pt-0.5 space-y-0.5">
                <p className={["text-[11.5px] font-extrabold leading-tight truncate", c.name].join(" ")}>
                    {registro?.cliente?.nombre || "Cliente sin nombre"}
                </p>

                {registro.auto_interes && (
                    <div className={["flex items-center gap-1 text-[10px] truncate", c.meta].join(" ")}>
                        <Car className="h-2.5 w-2.5 shrink-0 opacity-70" />
                        <span className="truncate">{registro.auto_interes}</span>
                    </div>
                )}

                {registro?.cliente?.telefono && (
                    <div className={["flex items-center gap-1 text-[10px] truncate", c.meta].join(" ")}>
                        <Phone className="h-2.5 w-2.5 shrink-0 opacity-70" />
                        <span className="truncate">{registro.cliente.telefono}</span>
                    </div>
                )}

                {registro.asesor_piso && (
                    <div className={["flex items-center gap-1 text-[10px] truncate", c.meta].join(" ")}>
                        <UserStar className="h-2.5 w-2.5 shrink-0 opacity-60" />
                        <span className="truncate italic">{registro.asesor_piso}</span>
                    </div>
                )}

                {registro.comentarios_cliente && (
                    <div className={["flex items-start gap-1 text-[9.5px] truncate", c.meta].join(" ")}>
                        <MessageSquare className="h-2.5 w-2.5 shrink-0 opacity-50 mt-px" />
                        <span className="truncate italic opacity-80">{registro.comentarios_cliente}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Fila de un día dentro del grid ───────────────────────────────────────────
function DayRow({ day, registros, isToday, startHour, totalHours }) {
    const { items, laneCount } = useMemo(() => assignLanes(registros), [registros]);
    const rowHeight = Math.max(MIN_ROW_HEIGHT, laneCount * LANE_HEIGHT + ROW_PADDING);
    const bebacks   = registros.filter((r) => r.be_back === true).length;
    const noRegreso = registros.filter((r) => r.be_back === false).length;

    return (
        <div className="flex border-b border-black/[.06]">
            {/* Columna fija del día */}
            <div
                className={[
                    "sticky left-0 z-20 shrink-0 flex flex-col items-center justify-center gap-0.5 border-r border-black/[.07]",
                    isToday ? "bg-blue-50/80" : "bg-white",
                ].join(" ")}
                style={{ width: DAY_COL_WIDTH, minHeight: rowHeight }}
            >
                <span className="text-[9px] font-extrabold tracking-widest text-black/40">
                    {DIAS_CORTOS[(day.getDay() + 6) % 7]}
                </span>
                <span className={[
                    "flex h-7 w-7 items-center justify-center rounded-full text-sm font-extrabold",
                    isToday ? "bg-black text-white" : "text-black",
                ].join(" ")}>
                    {day.getDate()}
                </span>
                {registros.length > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                        {bebacks > 0 && (
                            <span className="text-[8px] font-bold text-emerald-600">✓{bebacks}</span>
                        )}
                        {noRegreso > 0 && (
                            <span className="text-[8px] font-bold text-red-500">✗{noRegreso}</span>
                        )}
                    </div>
                )}
            </div>

            {/* Área de horas */}
            <div
                className="relative"
                style={{ width: totalHours * HOUR_COL_WIDTH, minHeight: rowHeight }}
            >
                {/* líneas verticales de cada hora */}
                {Array.from({ length: totalHours }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute top-0 bottom-0 border-r border-black/[.05]"
                        style={{ left: i * HOUR_COL_WIDTH, width: HOUR_COL_WIDTH }}
                    />
                ))}

                {items.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] text-black/20 font-semibold">
                        Sin ingresos
                    </div>
                ) : (
                    items.map(({ registro, start, lane }) => {
                        const hourFraction = start.getHours() + start.getMinutes() / 60;
                        const left = (hourFraction - startHour) * HOUR_COL_WIDTH + 4;
                        return (
                            <PisoSlotCard
                                key={registro.id}
                                registro={registro}
                                start={start}
                                style={{
                                    left,
                                    top: lane * LANE_HEIGHT + 5,
                                    width: HOUR_COL_WIDTH - 10,
                                    height: LANE_HEIGHT - 8,
                                }}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AgendaCitasPiso() {
    const [registros,  setRegistros]  = useState([]);
    const [loading,    setLoading]    = useState(false);
    const [search,     setSearch]     = useState("");
    const [agencia,    setAgencia]    = useState("");
    const [asesor,     setAsesor]     = useState("");
    const [weekStart,  setWeekStart]  = useState(() => startOfWeek(new Date()));

    useEffect(() => {
        let alive = true;
        setLoading(true);
        apiCitasPiso.list()
            .then((d) => { if (alive) setRegistros(Array.isArray(d) ? d : []); })
            .catch(console.error)
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, []);

    const weekDays = useMemo(
        () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
        [weekStart]
    );
    const todayYMD = localYMD(new Date());

    const headerLabel = useMemo(() => {
        const from = weekDays[0];
        const to   = weekDays[6];
        if (from.getMonth() === to.getMonth())
            return `${from.getDate()} – ${to.getDate()} de ${MESES[from.getMonth()]} ${from.getFullYear()}`;
        return `${from.getDate()} ${MESES[from.getMonth()].slice(0, 3)} – ${to.getDate()} ${MESES[to.getMonth()].slice(0, 3)} ${to.getFullYear()}`;
    }, [weekDays]);

    // ── Listas únicas para filtros ──
    const agencias = useMemo(
        () => [...new Set(registros.map((r) => r.agencia).filter(Boolean))].sort(),
        [registros]
    );
    const asesores = useMemo(
        () => [...new Set(registros.map((r) => r.asesor_piso).filter(Boolean))].sort(),
        [registros]
    );

    // ── Filtro por búsqueda + selects ──
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return registros.filter((r) => {
            if (agencia && r.agencia !== agencia) return false;
            if (asesor && r.asesor_piso !== asesor) return false;
            if (!q) return true;
            return (
                r?.cliente?.nombre?.toLowerCase().includes(q)      ||
                r?.cliente?.telefono?.includes(q)                  ||
                r?.agencia?.toLowerCase().includes(q)              ||
                r?.asesor_piso?.toLowerCase().includes(q)          ||
                r?.fuente_prospeccion?.toLowerCase().includes(q)   ||
                r?.auto_interes?.toLowerCase().includes(q)         ||
                r?.folio?.toLowerCase().includes(q)
            );
        });
    }, [registros, search, agencia, asesor]);

    // ── Agrupar por día ──
    const registrosByDay = useMemo(() => {
        const map = {};
        filtered.forEach((r) => {
            const dt = parseLocalDT(r.fecha_hora_cita);
            if (!dt) return;
            const key = localYMD(dt);
            if (!map[key]) map[key] = [];
            map[key].push(r);
        });
        return map;
    }, [filtered]);

    // ── Rango de horas (se expande si hay registros fuera del rango default) ──
    const { startHour, totalHours } = useMemo(() => {
        let min = DEFAULT_START_HOUR;
        let max = DEFAULT_END_HOUR;
        filtered.forEach((r) => {
            const dt = parseLocalDT(r.fecha_hora_cita);
            if (!dt) return;
            const h = dt.getHours();
            if (h < min) min = h;
            if (h > max) max = h;
        });
        return { startHour: min, totalHours: max - min + 1 };
    }, [filtered]);

    const hourLabels = useMemo(
        () => Array.from({ length: totalHours }, (_, i) => startHour + i),
        [startHour, totalHours]
    );

    // ── Estadísticas de la semana visible ──
    const weekStats = useMemo(() => {
        const weekYMDs = new Set(weekDays.map(localYMD));
        const weekRegs = filtered.filter((r) => {
            const dt = parseLocalDT(r.fecha_hora_cita);
            return dt && weekYMDs.has(localYMD(dt));
        });
        return {
            total:    weekRegs.length,
            bebacks:  weekRegs.filter((r) => r.be_back === true).length,
            noBack:   weekRegs.filter((r) => r.be_back === false).length,
        };
    }, [filtered, weekDays]);

    const limpiarFiltros = () => {
        setSearch("");
        setAgencia("");
        setAsesor("");
    };

    return (
        <div className="w-full space-y-4">
            <CitasPisoTopNav />

            <div
                className="rounded-xl border border-black/10 bg-white shadow-sm overflow-hidden flex flex-col"
                style={{ height: "calc(100vh - 180px)", minHeight: 520 }}
            >
                {/* ── Top bar: búsqueda + filtros + acciones ── */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-black/10 shrink-0 flex-wrap">

                    <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs border border-black/15 rounded-lg px-3 py-1.5 bg-slate-50">
                        <Search className="h-3.5 w-3.5 text-black/30 shrink-0" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar cliente, auto, asesor, folio…"
                            className="flex-1 bg-transparent text-xs outline-none text-black placeholder:text-black/30"
                        />
                    </div>

                    <select
                        value={agencia}
                        onChange={(e) => setAgencia(e.target.value)}
                        className="text-xs font-semibold border border-black/15 rounded-lg px-2.5 py-2 bg-white text-black/70"
                    >
                        <option value="">Todas las agencias</option>
                        {agencias.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>

                    <select
                        value={asesor}
                        onChange={(e) => setAsesor(e.target.value)}
                        className="text-xs font-semibold border border-black/15 rounded-lg px-2.5 py-2 bg-white text-black/70"
                    >
                        <option value="">Todos los asesores</option>
                        {asesores.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>

                    <div className="flex items-center gap-1.5 ml-auto">
                        {loading && <Loader2 className="h-4 w-4 animate-spin text-black/30" />}

                        <button
                            onClick={() => setWeekStart((d) => addDays(d, -7))}
                            className="h-8 w-8 flex items-center justify-center rounded-lg border border-black/15 hover:bg-black hover:text-white transition"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        <span className="text-sm font-extrabold text-black min-w-[200px] text-center">
                            {headerLabel}
                        </span>

                        <button
                            onClick={() => setWeekStart((d) => addDays(d, +7))}
                            className="h-8 w-8 flex items-center justify-center rounded-lg border border-black/15 hover:bg-black hover:text-white transition"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>

                        <button
                            onClick={() => setWeekStart(startOfWeek(new Date()))}
                            className="rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-extrabold hover:bg-emerald-700 transition ml-1"
                        >
                            Hoy
                        </button>

                        <button
                            onClick={limpiarFiltros}
                            className="flex items-center gap-1 rounded-lg border border-black/15 px-3 py-1.5 text-xs font-extrabold hover:bg-black hover:text-white transition"
                        >
                            <X className="h-3 w-3" /> Limpiar
                        </button>
                    </div>
                </div>

                {/* ── Leyenda + stats de la semana ── */}
                <div className="flex items-center gap-4 px-4 py-2 border-b border-black/[.06] shrink-0 bg-slate-50/50 flex-wrap">
                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-semibold text-black/50">Be Back</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-red-400" />
                        <span className="text-[10px] font-semibold text-black/50">No regresó</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-slate-400" />
                        <span className="text-[10px] font-semibold text-black/50">Sin definir</span>
                    </div>

                    <div className="ml-auto flex items-center gap-3">
                        <span className="text-[10px] text-black/30 font-semibold">
                            {weekStats.total} ingreso{weekStats.total !== 1 ? "s" : ""} esta semana
                        </span>
                        {weekStats.bebacks > 0 && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                ✓ {weekStats.bebacks} Be Back
                            </span>
                        )}
                        {weekStats.noBack > 0 && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                ✗ {weekStats.noBack} no regresaron
                            </span>
                        )}
                        {weekStats.total > 0 && (
                            <span className="text-[10px] font-bold text-black/40 bg-black/5 px-2 py-0.5 rounded-full">
                                {Math.round((weekStats.bebacks / weekStats.total) * 100)}% tasa BB
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Grid de horario: días (filas) x horas (columnas) ── */}
                <div className="flex-1 overflow-auto">
                    <div style={{ width: DAY_COL_WIDTH + totalHours * HOUR_COL_WIDTH }}>
                        {/* Cabecera de horas, sticky arriba */}
                        <div className="flex sticky top-0 z-30 bg-white border-b border-black/10">
                            <div
                                className="sticky left-0 z-30 shrink-0 bg-white border-r border-black/[.07]"
                                style={{ width: DAY_COL_WIDTH }}
                            />
                            {hourLabels.map((h) => (
                                <div
                                    key={h}
                                    className="shrink-0 text-center text-[11px] font-extrabold text-black/50 py-2 border-r border-black/[.05]"
                                    style={{ width: HOUR_COL_WIDTH }}
                                >
                                    {PAD(h)}:00
                                </div>
                            ))}
                        </div>

                        {/* Filas de cada día */}
                        {weekDays.map((day) => {
                            const ymd     = localYMD(day);
                            const isToday = ymd === todayYMD;
                            const dayRegs = registrosByDay[ymd] || [];
                            return (
                                <DayRow
                                    key={ymd}
                                    day={day}
                                    registros={dayRegs}
                                    isToday={isToday}
                                    startHour={startHour}
                                    totalHours={totalHours}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}