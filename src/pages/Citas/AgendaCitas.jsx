// src/pages/Citas/AgendaCitas.jsx
import { useState, useEffect, useMemo } from "react";
import {
    ChevronLeft, ChevronRight, Loader2,
    Car, Phone, Building2, CheckCircle2, XCircle,
    Circle, UserMinus, UserStar, MessageSquare,
    Search,
} from "lucide-react";
import { apiCitas } from "../../lib/apiCitas";
import CitasTopNav from "./CitasTopNav";

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
const DIAS_LARGOS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto",
               "Septiembre","Octubre","Noviembre","Diciembre"];

// ─── Color por tipo ───────────────────────────────────────────────────────────
const TIPO_COLOR = {
    "Prueba de Manejo": {
        card: "bg-blue-50 border-blue-200",
        accent: "border-l-blue-500",
        header: "bg-blue-100",
        pill: "bg-blue-500 text-white",
        name: "text-blue-900",
        meta: "text-blue-700",
        badge: "bg-blue-100 text-blue-800 border border-blue-300",
        dot: "bg-blue-500",
    },
    "Tradicional": {
        card: "bg-amber-50 border-amber-200",
        accent: "border-l-amber-500",
        header: "bg-amber-100",
        pill: "bg-amber-500 text-white",
        name: "text-amber-900",
        meta: "text-amber-700",
        badge: "bg-amber-100 text-amber-800 border border-amber-300",
        dot: "bg-amber-500",
    },
    "Digital": {
        card: "bg-violet-50 border-violet-200",
        accent: "border-l-violet-500",
        header: "bg-violet-100",
        pill: "bg-violet-500 text-white",
        name: "text-violet-900",
        meta: "text-violet-700",
        badge: "bg-violet-100 text-violet-800 border border-violet-300",
        dot: "bg-violet-500",
    },
};
const FB = {
    card: "bg-slate-50 border-slate-200",
    accent: "border-l-slate-400",
    header: "bg-slate-100",
    pill: "bg-slate-500 text-white",
    name: "text-slate-900",
    meta: "text-slate-600",
    badge: "bg-slate-100 text-slate-700 border border-slate-300",
    dot: "bg-slate-400",
};
const colorFor = (t) => TIPO_COLOR[t] ?? FB;

// ─── Badge de asistencia ──────────────────────────────────────────────────────
function AttendanceBadge({ value }) {
    if (value === true)
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-800 whitespace-nowrap">
                <CheckCircle2 className="h-3 w-3" /> Asistió
            </span>
        );
    if (value === false)
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 border border-red-300 px-2 py-0.5 text-[10px] font-bold text-red-700 whitespace-nowrap">
                <XCircle className="h-3 w-3" /> No asistió
            </span>
        );
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-300 px-2 py-0.5 text-[10px] font-bold text-slate-600 whitespace-nowrap">
            <Circle className="h-3 w-3" /> Pendiente
        </span>
    );
}

// ─── Tarjeta de evento (NUEVA — altura automática, info completa) ──────────────
function EventCard({ cita }) {
    const dt = parseLocalDT(cita.fecha_hora_cita);
    if (!dt) return null;
    const c = colorFor(cita.tipo_cita);

    return (
        <div
            className={[
                "w-full text-left rounded-lg border border-l-4 overflow-hidden",
                "mb-2 last:mb-0",
                c.card,
                c.accent,
            ].join(" ")}
        >
            {/* ── Cabecera: hora + tipo + asistencia ── */}
            <div className={["flex items-center justify-between gap-2 px-2.5 py-1.5", c.header].join(" ")}>
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[11px] font-extrabold text-black/70 shrink-0">
                        {localHHMM(dt)}
                    </span>
                    <span className={["rounded-full px-1.5 py-px text-[9px] font-extrabold uppercase tracking-wide truncate", c.pill].join(" ")}>
                        {cita.tipo_cita || "Sin tipo"}
                    </span>
                </div>
                <AttendanceBadge value={cita.asistencia} />
            </div>

            {/* ── Cuerpo: toda la información ── */}
            <div className="px-2.5 py-2 space-y-1.5">

                {/* Nombre del cliente */}
                <p className={["text-[12px] font-extrabold leading-snug", c.name].join(" ")}>
                    {cita?.cliente?.nombre || "Cliente sin nombre"}
                </p>

                {/* Auto de interés */}
                {cita.auto_interes && (
                    <div className={["flex items-center gap-1.5 text-[11px] font-semibold", c.meta].join(" ")}>
                        <Car className="h-3 w-3 shrink-0 opacity-70" />
                        <span>{cita.auto_interes}</span>
                    </div>
                )}

                {/* Teléfono del cliente */}
                {cita?.cliente?.telefono && (
                    <div className={["flex items-center gap-1.5 text-[11px]", c.meta].join(" ")}>
                        <Phone className="h-3 w-3 shrink-0 opacity-70" />
                        <span>{cita.cliente.telefono}</span>
                    </div>
                )}

                {/* Agencia */}
                {cita.agencia && (
                    <div className={["flex items-center gap-1.5 text-[11px]", c.meta].join(" ")}>
                        <Building2 className="h-3 w-3 shrink-0 opacity-70" />
                        <span className="truncate">{cita.agencia}</span>
                    </div>
                )}

                {/* Separador sutil si hay asesores */}
                {(cita.asesor_digital || cita.asesor_piso) && (
                    <div className="border-t border-black/[.07] pt-1 space-y-1">
                        {cita.asesor_digital && (
                            <div className={["flex items-start gap-1.5 text-[10px]", c.meta].join(" ")}>
                                <UserMinus className="h-3 w-3 shrink-0 opacity-60 mt-px" />
                                <span><span className="opacity-60">Digital: </span>{cita.asesor_digital}</span>
                            </div>
                        )}
                        {cita.asesor_piso && (
                            <div className={["flex items-start gap-1.5 text-[10px]", c.meta].join(" ")}>
                                <UserStar className="h-3 w-3 shrink-0 opacity-60 mt-px" />
                                <span><span className="opacity-60">Piso: </span>{cita.asesor_piso}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Comentarios / nota */}
                {cita.comentarios && (
                    <div className={["flex items-start gap-1.5 text-[10px] border-t border-black/[.07] pt-1", c.meta].join(" ")}>
                        <MessageSquare className="h-3 w-3 shrink-0 opacity-60 mt-px" />
                        <span className="leading-relaxed opacity-80 break-words whitespace-normal">
                            {cita.comentarios}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Columna de un día ────────────────────────────────────────────────────────
// DISEÑO CLAVE: layout de columnas tipo "kanban".
// Cada columna hace scroll independiente. Las tarjetas tienen altura automática
// y muestran TODA la información, sin posicionamiento absoluto.
function DayColumn({ day, citas, isToday }) {
    const ymd = localYMD(day);

    return (
        <div className={[
            "border-l border-black/[.07]",
            isToday ? "bg-blue-50/20" : "bg-white",
        ].join(" ")}>
            {/* Cabecera del día — sticky dentro del scroll global */}
            <div className={[
                "sticky top-0 z-10 flex flex-col items-center py-2 px-1 border-b border-black/[.07]",
                isToday ? "bg-blue-50/80" : "bg-white/95",
                "backdrop-blur-sm",
            ].join(" ")}>
                <span className="text-[9px] font-extrabold tracking-widest text-black/40">
                    {DIAS_CORTOS[(day.getDay() + 6) % 7]}
                </span>
                <span className={[
                    "flex h-7 w-7 items-center justify-center rounded-full text-sm font-extrabold mt-0.5",
                    isToday ? "bg-black text-white" : "text-black",
                ].join(" ")}>
                    {day.getDate()}
                </span>
                {citas.length > 0
                    ? <span className="text-[9px] font-bold text-black/40 mt-0.5">
                        {citas.length} cita{citas.length > 1 ? "s" : ""}
                      </span>
                    : <span className="h-3.5" />
                }
            </div>

            {/* Tarjetas — crecen libremente, el scroll lo maneja el padre */}
            <div className="p-1.5">
                {citas.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-[10px] text-black/20 font-semibold">
                        Sin citas
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {citas
                            .slice()
                            .sort((a, b) => {
                                const da = parseLocalDT(a.fecha_hora_cita);
                                const db = parseLocalDT(b.fecha_hora_cita);
                                return (da?.getTime() ?? 0) - (db?.getTime() ?? 0);
                            })
                            .map((cita) => (
                                <EventCard key={cita.id} cita={cita} />
                            ))
                        }
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AgendaCitas() {
    const [citas,     setCitas]     = useState([]);
    const [loading,   setLoading]   = useState(false);
    const [search,    setSearch]    = useState("");
    const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

    useEffect(() => {
        let alive = true;
        setLoading(true);
        apiCitas.list()
            .then((d) => { if (alive) setCitas(Array.isArray(d) ? d : []); })
            .catch(console.error)
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, []);

    const weekDays  = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
    const todayYMD  = localYMD(new Date());

    const headerLabel = useMemo(() => {
        const from = weekDays[0];
        const to   = weekDays[6];
        if (from.getMonth() === to.getMonth())
            return `${from.getDate()} – ${to.getDate()} de ${MESES[from.getMonth()]} ${from.getFullYear()}`;
        return `${from.getDate()} ${MESES[from.getMonth()].slice(0,3)} – ${to.getDate()} ${MESES[to.getMonth()].slice(0,3)} ${to.getFullYear()}`;
    }, [weekDays]);

    // Filtrar por búsqueda
    const filteredCitas = useMemo(() => {
        if (!search.trim()) return citas;
        const q = search.toLowerCase();
        return citas.filter((c) =>
            c?.cliente?.nombre?.toLowerCase().includes(q) ||
            c?.cliente?.telefono?.includes(q) ||
            c?.agencia?.toLowerCase().includes(q) ||
            c?.asesor_piso?.toLowerCase().includes(q) ||
            c?.asesor_digital?.toLowerCase().includes(q) ||
            c?.auto_interes?.toLowerCase().includes(q)
        );
    }, [citas, search]);

    const citasByDay = useMemo(() => {
        const map = {};
        filteredCitas.forEach((c) => {
            const dt = parseLocalDT(c.fecha_hora_cita);
            if (!dt) return;
            const key = localYMD(dt);
            if (!map[key]) map[key] = [];
            map[key].push(c);
        });
        return map;
    }, [filteredCitas]);

    return (
        <div className="w-full space-y-4">
            <CitasTopNav />

            <div
                className="rounded-xl border border-black/10 bg-white shadow-sm overflow-hidden flex flex-col"
                style={{ height: "calc(100vh - 180px)", minHeight: 520 }}
            >
                {/* ── Top bar ── */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-black/10 shrink-0 flex-wrap">

                    {/* Búsqueda */}
                    <div className="flex items-center gap-2 flex-1 min-w-[180px] max-w-xs border border-black/15 rounded-lg px-3 py-1.5 bg-slate-50">
                        <Search className="h-3.5 w-3.5 text-black/30 shrink-0" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar cliente, auto, asesor…"
                            className="flex-1 bg-transparent text-xs outline-none text-black placeholder:text-black/30"
                        />
                    </div>

                    {/* Navegación semana */}
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
                            className="rounded-lg border border-black px-3 py-1.5 text-xs font-extrabold hover:bg-black hover:text-white transition ml-1"
                        >
                            Hoy
                        </button>
                    </div>
                </div>

                {/* ── Leyenda de tipos ── */}
                <div className="flex items-center gap-4 px-4 py-2 border-b border-black/[.06] shrink-0 bg-slate-50/50">
                    {Object.entries(TIPO_COLOR).map(([tipo, c]) => (
                        <div key={tipo} className="flex items-center gap-1.5">
                            <span className={["h-2 w-2 rounded-full shrink-0", c.dot].join(" ")} />
                            <span className="text-[10px] font-semibold text-black/50">{tipo}</span>
                        </div>
                    ))}
                    <span className="ml-auto text-[10px] text-black/30 font-semibold">
                        {filteredCitas.length} cita{filteredCitas.length !== 1 ? "s" : ""} esta semana
                    </span>
                </div>

                {/* ── Grid de 7 columnas — ancho completo, scroll vertical global ── */}
                <div className="flex-1 overflow-x-auto overflow-y-auto">
                    <div
                        className="grid"
                        style={{ gridTemplateColumns: "repeat(7, minmax(160px, 1fr))" }}
                    >
                        {weekDays.map((day) => {
                            const ymd      = localYMD(day);
                            const isToday  = ymd === todayYMD;
                            const dayCitas = citasByDay[ymd] || [];
                            return (
                                <DayColumn
                                    key={ymd}
                                    day={day}
                                    citas={dayCitas}
                                    isToday={isToday}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}