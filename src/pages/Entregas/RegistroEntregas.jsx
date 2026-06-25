// src/pages/Entregas/RegistroEntregas.jsx
import { useMemo, useState, useEffect } from "react";
import {
    Plus,
    Search,
    X,
    Save,
    User,
    CarFront,
    CalendarDays,
    ArrowUpDown,
    ChevronDown,
    ChevronUp,
    Trash2,
    Loader2,
    Phone,
    Building2,
    UserCheck,
    UserStar,
    MessageSquareText,
    Table2,
    Hash,
    ClipboardList,
    IdCard,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Clock3,
    TableProperties,
    CalendarRange,
    BarChart2,
    TrendingUp,
} from "lucide-react";
import { apiEntregas } from "../../lib/apiEntregas";
import { createPortal } from "react-dom";
import { useAuth } from "../../auth/AuthContext";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from "recharts";

// ─── Paleta oscura ───────────────────────────────────────────────────────────
// negro puro      → #000000  (headers, botón primario activo)
// casi negro      → #111111  (hover de primario)
// zinc-800        → #27272a  (thead tabla, encabezados de sección)
// zinc-700        → #3f3f46  (bordes fuertes, iconos)
// zinc-600        → #52525b  (texto secundario, nav inactivo)
// zinc-400        → #a1a1aa  (placeholder, texto terciario)
// zinc-100        → #f4f4f5  (fondo campos)
const C = {
    primary:    "#000000",
    primaryHov: "#111111",
    thead:      "#27272a",
    border:     "#3f3f46",
    iconSecond: "#52525b",
    textMuted:  "#a1a1aa",
    fieldBg:    "#f4f4f5",
};

const HOURS = Array.from({ length: 13 }, (_, i) => `${String(i + 8).padStart(2, "0")}:00`);
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// ─── helpers ─────────────────────────────────────────────────────────────────
function normalizeStr(v) { return String(v ?? "").trim(); }

function entregaFisicaActiva(value) {
    if (value === true || value === 1) return true;
    return ["si","sí","true","1","yes","entregada","reportada"].includes(String(value ?? "").trim().toLowerCase());
}

function normalizePhoneForSave(value) {
    const d = String(value || "").replace(/\D/g, "");
    return /^\d{10}$/.test(d) ? `52${d}` : d;
}

function Skeleton({ className = "" }) {
    return <div className={["animate-pulse rounded-md bg-black/10", className].join(" ")} />;
}

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 11 }).map((_, i) => (
                <td key={i} className="px-4 py-3"><div className="h-4 w-28 rounded bg-slate-200/60" /></td>
            ))}
        </tr>
    );
}

function ModalSkeleton() {
    return (
        <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-3 h-10 w-full rounded-lg" />
                </div>
            ))}
        </div>
    );
}

// ─── Modal ───────────────────────────────────────────────────────────────────
function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;
    return createPortal(
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-6xl overflow-hidden rounded-xl border border-zinc-700 bg-neutral-100 shadow-2xl">
                    {/* Header degradé oscuro */}
                    <div className="flex items-center justify-between gap-3 px-5 py-4"
                        style={{ background: "linear-gradient(135deg, #000000 0%, #27272a 100%)" }}>
                        <div className="truncate text-base font-extrabold text-white">{title}</div>
                        <button onClick={onClose}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="max-h-[72vh] overflow-auto p-5">{children}</div>
                    {footer && (
                        <div className="flex flex-col gap-2 border-t border-zinc-200 bg-zinc-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

function Field({ label, icon: Icon, children }) {
    return (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-800">
                {Icon && <Icon className="h-4 w-4 text-zinc-600" />}
                <span>{label}</span>
            </div>
            {children}
        </div>
    );
}

function FilterBlock({ label, children }) {
    return (
        <div className="rounded-lg">
            <div className="mb-2 text-xs font-extrabold tracking-wide text-zinc-700">{label}</div>
            {children}
        </div>
    );
}

// ─── Fechas ──────────────────────────────────────────────────────────────────
function toDTLocal(isoOrNull) {
    if (!isoOrNull) return "";
    const s = String(isoOrNull);
    if (s.endsWith("Z")) {
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return "";
        const p = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16);
    return "";
}
function fromDTLocalToISO(v) { return String(v || "").trim() || null; }
function toYMDLocal(dateLike) {
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return "";
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
}
function parseYMDLocal(ymd) {
    if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return new Date();
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, m - 1, d);
}
function ymdToInt(ymd) {
    if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
    return Number(ymd.replaceAll("-", ""));
}
function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}
function startOfWeekMonday(date) {
    const d = new Date(date);
    const delta = (d.getDay() + 6) % 7;
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - delta);
    return d;
}
function formatWeekTitle(start, end) {
    return `${start.toLocaleDateString("es-MX", { day: "numeric", month: "long" })} — ${end.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}`;
}
function weekdayShortEs(d) { return ["Dom","Lun","Mar","Mie","Jue","Vie","Sab"][d.getDay()] || ""; }
function formatCardTime(dateLike) {
    if (!dateLike) return "—";
    const d = new Date(dateLike);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}
function formatDateTime(dateLike) {
    if (!dateLike) return "—";
    const d = new Date(dateLike);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
}
function getHourKey(dateLike) {
    if (!dateLike) return "";
    const d = new Date(dateLike);
    return Number.isNaN(d.getTime()) ? "" : `${String(d.getHours()).padStart(2,"0")}:00`;
}

// ─── Context Menu ─────────────────────────────────────────────────────────────
function ContextMenu({ ctxMenu, onDelete, onClose }) {
    if (!ctxMenu.open || !ctxMenu.row) return null;
    return createPortal(
        <div className="fixed z-[9999]" style={{ left: ctxMenu.x, top: ctxMenu.y }} onClick={(e) => e.stopPropagation()}>
            <div className="w-48 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl">
                <button className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(ctxMenu.row)}>
                    <Trash2 className="h-4 w-4" /> Eliminar
                </button>
                <button className="w-full px-4 py-2 text-left text-xs text-zinc-500 hover:bg-zinc-50" onClick={onClose}>
                    Cerrar
                </button>
            </div>
        </div>,
        document.body
    );
}

// ─── Status Button ────────────────────────────────────────────────────────────
function StatusButton({ row, loading, onToggle, compact = false }) {
    const entregada = entregaFisicaActiva(row?.entrega_reportada);
    return (
        <button type="button" disabled={loading}
            onClick={(e) => { e.stopPropagation(); onToggle?.(row); }}
            className={[
                "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border font-extrabold transition",
                compact ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
                entregada
                    ? "border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                    : "border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200",
                loading ? "cursor-not-allowed opacity-70" : "",
            ].join(" ")}
            title={entregada ? "Marcar como pendiente" : "Marcar como entregada"}
        >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : entregada ? <CheckCircle2 className="h-3.5 w-3.5" />
                : <Clock3 className="h-3.5 w-3.5" />}
            {compact ? (entregada ? "Sí" : "No") : (entregada ? "Entregada" : "Pendiente")}
        </button>
    );
}

// ─── Agenda Card ─────────────────────────────────────────────────────────────
function EntregaAgendaCard({ row, onEdit, onContext, onToggleEntrega, updatingInline, compact = false }) {
    const entregada = entregaFisicaActiva(row?.entrega_reportada);
    const isUpdating = !!updatingInline[row.id];

    return (
        <button type="button" onClick={() => onEdit(row)} onContextMenu={(e) => onContext(e, row)}
            className={[
                "relative w-full overflow-hidden rounded-lg border text-left shadow-sm transition hover:-translate-y-[1px] hover:shadow-md",
                compact ? "p-3" : "p-2.5",
                entregada
                    ? "border-emerald-300 bg-emerald-50/95"
                    : "border-zinc-300 bg-zinc-50/95",
            ].join(" ")}
            title="Click para editar. Click derecho para eliminar."
        >
            {entregada && (
                <span className="absolute bottom-0 left-0 top-0 flex w-3 items-center justify-center rounded-l-lg bg-emerald-500">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                </span>
            )}
            <div className={entregada ? "pl-3" : ""}>
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        {/* hora + dealer */}
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-zinc-700">
                            <CalendarDays className="h-3.5 w-3.5" />
                            <span>{formatCardTime(row.fecha_hora_entrega)}</span>
                            <span className="text-zinc-400">•</span>
                            <span className="truncate">{row.agencia || "Sin dealer"}</span>
                        </div>
                        {/* nombre */}
                        <div className="mt-1 truncate text-xs font-black uppercase tracking-wide text-zinc-900">
                            {row?.cliente?.nombre || "Sin nombre"}
                        </div>
                    </div>
                    <StatusButton row={row} loading={isUpdating} onToggle={onToggleEntrega} compact />
                </div>

                <div className="mt-2 grid gap-1 text-[10px] font-semibold text-zinc-500">
                    <div className="flex items-center gap-1.5">
                        <CarFront className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                        <span className="truncate">{row.modelo_version || "Modelo sin capturar"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                        <span className="truncate">{row.vin || "VIN sin capturar"}</span>
                    </div>
                    {!compact && (
                        <>
                            <div className="flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                                <span className="truncate">{row?.cliente?.telefono || "—"}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <UserStar className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                                <span className="truncate">{row.asesor_ventas || "Asesor sin capturar"}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </button>
    );
}

// ─── Agenda Mobile List ───────────────────────────────────────────────────────
function AgendaMobileList({ rows, loading, onEdit, onContext, onToggleEntrega, updatingInline }) {
    const grouped = useMemo(() => {
        const map = new Map();
        for (const row of rows) {
            const key = row.fecha_hora_entrega ? toYMDLocal(row.fecha_hora_entrega) : "sin-fecha";
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(row);
        }
        return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    }, [rows]);

    if (loading) {
        return (
            <div className="grid gap-3 lg:hidden">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="mt-3 h-4 w-28" />
                        <Skeleton className="mt-3 h-4 w-56" />
                    </div>
                ))}
            </div>
        );
    }
    if (!rows.length) {
        return (
            <div className="rounded-xl border border-zinc-200 bg-white px-4 py-10 text-center text-sm font-semibold text-zinc-500 lg:hidden">
                No hay entregas en esta semana o con esos filtros.
            </div>
        );
    }

    return (
        <div className="grid gap-4 lg:hidden">
            {grouped.map(([key, items]) => {
                const title = key === "sin-fecha"
                    ? "Sin fecha"
                    : parseYMDLocal(key).toLocaleDateString("es-MX", { weekday:"long", day:"2-digit", month:"long", year:"numeric" });
                return (
                    <section key={key} className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
                        {/* día — borde izquierdo zinc oscuro */}
                        <h3 className="mb-3 border-l-4 border-zinc-800 pl-2 text-xs font-black uppercase tracking-wide text-zinc-800">{title}</h3>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {items.map((row) => (
                                <EntregaAgendaCard key={row.id} row={row} onEdit={onEdit} onContext={onContext}
                                    onToggleEntrega={onToggleEntrega} updatingInline={updatingInline} compact />
                            ))}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}

// ─── Agenda Week View ─────────────────────────────────────────────────────────
function AgendaWeekView({ rows, loading, currentWeekDate, setCurrentWeekDate, onCreateAt, onEdit, onContext, onToggleEntrega, updatingInline }) {
    const weekStart = useMemo(() => startOfWeekMonday(currentWeekDate), [currentWeekDate]);
    const weekDays  = useMemo(() => Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)), [weekStart]);
    const weekEnd   = weekDays[weekDays.length - 1];
    const todayIso  = toYMDLocal(new Date());

    const rowsBySlot = useMemo(() => {
        const map = new Map();
        for (const row of rows) {
            if (!row.fecha_hora_entrega) continue;
            const key = `${toYMDLocal(row.fecha_hora_entrega)}|${getHourKey(row.fecha_hora_entrega)}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(row);
        }
        return map;
    }, [rows]);

    const outOfSchedule = useMemo(() =>
        rows.filter((r) => { if (!r.fecha_hora_entrega) return true; return !HOURS.includes(getHourKey(r.fecha_hora_entrega)); }),
    [rows]);

    const gridStyle = { gridTemplateColumns: "58px repeat(6, minmax(210px, 1fr))" };

    return (
        <div className="hidden lg:block">
            {/* Nav cabecera */}
            <div className="mb-3 flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                    <div className="text-xs font-semibold text-zinc-400">Semana</div>
                    <div className="truncate text-sm font-black text-zinc-800">{formatWeekTitle(weekStart, weekEnd)}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => setCurrentWeekDate((p) => addDays(p, -7))}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setCurrentWeekDate(new Date())}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-white px-3 py-2 text-xs font-black text-zinc-800 hover:bg-zinc-800 hover:text-white transition">
                        Hoy
                    </button>
                    <button type="button" onClick={() => setCurrentWeekDate((p) => addDays(p, 7))}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                <div className="overflow-auto">
                    <div className="min-w-[1320px]">
                        {/* Header días */}
                        <div className="sticky top-0 z-20 grid border-b border-zinc-200" style={{ ...gridStyle, background: "#27272a" }}>
                            <div className="px-3 py-3 text-xs font-bold text-zinc-400">Hora</div>
                            {weekDays.map((day) => {
                                const iso = toYMDLocal(day);
                                const isToday = iso === todayIso;
                                return (
                                    <div key={iso} className="border-l border-zinc-700 px-3 py-3 text-center">
                                        <div className={[
                                            "mx-auto inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black",
                                            isToday ? "bg-white text-zinc-900" : "text-zinc-300",
                                        ].join(" ")}>
                                            <span>{weekdayShortEs(day)}</span>
                                            <span>{day.toLocaleDateString("es-MX", { day:"2-digit", month:"2-digit" })}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Slots */}
                        {loading ? (
                            <div className="grid" style={gridStyle}>
                                {Array.from({ length: 42 }).map((_, i) => (
                                    <div key={i} className="min-h-[116px] border-b border-l border-zinc-100 p-2">
                                        <Skeleton className="h-16 w-full rounded-lg" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            HOURS.map((hour) => (
                                <div key={hour} className="grid border-b border-dashed border-zinc-200" style={gridStyle}>
                                    <div className="bg-zinc-50 px-3 py-3 text-xs font-bold text-zinc-400">{hour}</div>
                                    {weekDays.map((day) => {
                                        const dayKey = toYMDLocal(day);
                                        const slotKey = `${dayKey}|${hour}`;
                                        const items = rowsBySlot.get(slotKey) || [];
                                        return (
                                            <div key={slotKey} className="group relative min-h-[116px] border-l border-zinc-200 bg-white/80 p-1.5 transition hover:bg-zinc-50">
                                                <button type="button" onClick={() => onCreateAt(`${dayKey}T${hour}`)}
                                                    className="absolute right-2 top-2 z-[4] inline-flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500 opacity-0 shadow-sm transition hover:bg-zinc-100 group-hover:opacity-100">
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                                <div className="grid gap-1.5 pr-1">
                                                    {items.map((row) => (
                                                        <EntregaAgendaCard key={row.id} row={row} onEdit={onEdit}
                                                            onContext={onContext} onToggleEntrega={onToggleEntrega} updatingInline={updatingInline} />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {!loading && outOfSchedule.length > 0 && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <div className="mb-2 text-xs font-black uppercase tracking-wide text-amber-800">
                        Entregas sin hora o fuera del rango 08:00 – 20:00
                    </div>
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                        {outOfSchedule.map((row) => (
                            <EntregaAgendaCard key={row.id} row={row} onEdit={onEdit} onContext={onContext}
                                onToggleEntrega={onToggleEntrega} updatingInline={updatingInline} compact />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Gráficas View ────────────────────────────────────────────────────────────
const CHART_PALETTE = ["#000000", "#27272a", "#52525b", "#a1a1aa", "#d4d4d8"];

function GraficasView({ registros }) {
    const total       = registros.length;
    const entregadas  = registros.filter((r) => entregaFisicaActiva(r.entrega_reportada)).length;
    const pendientes  = total - entregadas;

    const porModelo = useMemo(() => {
        const map = {};
        registros.forEach((r) => { const k = r.modelo_version || "Sin especificar"; map[k] = (map[k]||0)+1; });
        return Object.entries(map).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
    }, [registros]);

    const porAsesor = useMemo(() => {
        const map = {};
        registros.forEach((r) => { const k = (r.asesor_ventas||"Sin asignar").split(" ").slice(0,2).join(" "); map[k]=(map[k]||0)+1; });
        return Object.entries(map).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
    }, [registros]);

    const porMes = useMemo(() => {
        const map = {};
        registros.forEach((r) => {
            if (!r.fecha_hora_entrega) return;
            const d = new Date(r.fecha_hora_entrega);
            const key = `${MESES[d.getMonth()].slice(0,3)} ${d.getFullYear()}`;
            map[key]=(map[key]||0)+1;
        });
        return Object.entries(map).map(([name,value])=>({name,value})).slice(-6);
    }, [registros]);

    const pieData = [
        { name:"Entregadas", value: entregadas },
        { name:"Pendientes", value: pendientes },
    ];

    const tooltipStyle = { borderRadius:8, border:"1px solid #e4e4e7", fontSize:12 };

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-3">
                {[
                    { label:"Total entregas",  value:total,      icon:CarFront,    bg:"#000000" },
                    { label:"Entregadas",       value:entregadas, icon:CheckCircle2, bg:"#27272a" },
                    { label:"Pendientes",       value:pendientes, icon:Clock3,      bg:"#52525b" },
                ].map(({ label, value, icon:Icon, bg }) => (
                    <div key={label} className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl text-white" style={{ background:bg }}>
                            <Icon className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-extrabold text-zinc-900">{value}</div>
                            <div className="text-xs font-semibold text-zinc-400">{label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Entregas por mes */}
                <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-1 text-sm font-extrabold text-zinc-900">Entregas por mes</h3>
                    <p className="mb-4 text-xs text-zinc-400">Últimos 6 meses</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={porMes} margin={{ top:0, right:0, left:-20, bottom:0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                            <XAxis dataKey="name" tick={{ fontSize:11, fill:"#71717a" }} />
                            <YAxis tick={{ fontSize:11, fill:"#71717a" }} allowDecimals={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="value" name="Entregas" fill="#000000" radius={[4,4,0,0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Por modelo */}
                <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-1 text-sm font-extrabold text-zinc-900">Por modelo</h3>
                    <p className="mb-4 text-xs text-zinc-400">Distribución de vehículos entregados</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={porModelo} layout="vertical" margin={{ top:0, right:0, left:20, bottom:0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize:11, fill:"#71717a" }} allowDecimals={false} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize:10, fill:"#71717a" }} width={80} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="value" name="Entregas" fill="#27272a" radius={[0,4,4,0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Por asesor */}
                <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-1 text-sm font-extrabold text-zinc-900">Por asesor de ventas</h3>
                    <p className="mb-4 text-xs text-zinc-400">Cantidad de entregas por asesor</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={porAsesor} margin={{ top:0, right:0, left:-20, bottom:0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                            <XAxis dataKey="name" tick={{ fontSize:10, fill:"#71717a" }} />
                            <YAxis tick={{ fontSize:11, fill:"#71717a" }} allowDecimals={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="value" name="Entregas" fill="#52525b" radius={[4,4,0,0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie asistencia */}
                <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-1 text-sm font-extrabold text-zinc-900">Estado de entregas</h3>
                    <p className="mb-4 text-xs text-zinc-400">Entregadas vs pendientes</p>
                    <div className="flex items-center justify-center gap-8">
                        <ResponsiveContainer width="50%" height={180}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                                    <Cell fill="#000000" />
                                    <Cell fill="#a1a1aa" />
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-3">
                            {pieData.map((item, i) => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full" style={{ background: i===0?"#000000":"#a1a1aa" }} />
                                    <span className="text-xs font-semibold text-zinc-600">{item.name}</span>
                                    <span className="text-sm font-extrabold text-zinc-900">{item.value}</span>
                                </div>
                            ))}
                            {total > 0 && (
                                <div className="pt-1 text-xs font-bold text-zinc-400">
                                    {Math.round((entregadas/total)*100)}% completado
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function RegistroEntregas() {
    const { user } = useAuth();

    const isAdmin = useMemo(() => {
        const permisos = user?.permisos || [];
        const rol = String(user?.rol || "").trim().toLowerCase();
        return rol === "administrador" || permisos.includes("CRM_DIGITALES") || permisos.includes("ALL") || permisos.includes("USUARIOS_ADMIN");
    }, [user]);

    const userAgencia = String(user?.agencia || "").trim();
    const [entregas, setEntregas] = useState([]);

    const DEALERS  = useMemo(() => ["Volvo"], []);
    const ASESORES = [
        "Enrique Vazquez Islas","Ricardo Platas","Verónica Del Rayo Galindo León",
        "Julio Camacho Barragán","Fernanda Romero Aguilar",
    ];
    const MODELOS = [
        "EX30","EX40","EC40","EX90","XC60","XC90",
        "XC60 Black Edition","XC90 Black Edition","Seminuevos","Avaluo",
    ];

    const [ctxMenu, setCtxMenu]                 = useState({ open:false, x:0, y:0, row:null });
    const [viewMode, setViewMode]               = useState("agenda");
    const [currentWeekDate, setCurrentWeekDate] = useState(new Date());
    const [sort, setSort]                       = useState({ key:"fecha_hora_entrega", dir:"desc" });

    const toggleSort = (key) => setSort((p) => p.key !== key ? { key, dir:"asc" } : { key, dir: p.dir==="asc"?"desc":"asc" });

    const [filters, setFilters]   = useState({ q:"", agencia:"Todos", rangoDesde:"", rangoHasta:"" });
    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode]           = useState("create");
    const [draft, setDraft]         = useState(null);

    const [loadingList,   setLoadingList]   = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving,        setSaving]        = useState(false);
    const [updatingInline, setUpdatingInline] = useState({});

    const REQUIRED = useMemo(() => ({ cliente_telefono:"Teléfono", fecha_hora_entrega:"Fecha y hora de entrega" }), []);
    const [touchedSave, setTouchedSave] = useState(false);

    const missing = useMemo(() => {
        if (!draft) return [];
        return Object.keys(REQUIRED).filter((key) => {
            const v = draft[key];
            return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
        });
    }, [draft, REQUIRED]);

    const isInvalid = (key) => touchedSave && missing.includes(key);

    const telDigits  = useMemo(() => String(draft?.cliente_telefono || "").replace(/\D/g,""), [draft?.cliente_telefono]);
    const telIsOk    = useMemo(() => /^(?:\d{10}|52\d{10})$/.test(telDigits), [telDigits]);
    const telError   = useMemo(() => {
        if (!openModal || !draft || !telDigits) return "";
        if (/^\d{10}$/.test(telDigits) || /^52\d{10}$/.test(telDigits)) return "";
        if (telDigits.length < 10) return "Número incompleto (mínimo 10 dígitos)";
        if (telDigits.length === 11) return "Número incorrecto (11 dígitos no válido)";
        if (telDigits.length === 12 && !telDigits.startsWith("52")) return "Para 12 dígitos debe iniciar con 52";
        if (telDigits.length > 12) return "Número incorrecto (máximo 12 dígitos)";
        return "Número inválido";
    }, [openModal, draft, telDigits]);
    const telInvalid = !!telError;

    const inputBase = "w-full rounded-lg border shadow-sm px-3 py-2 text-sm text-zinc-800 font-semibold outline-none";
    const inputOk   = "border-zinc-300 bg-zinc-50";
    const inputBad  = "border-red-500 bg-red-50";

    useEffect(() => {
        const close = () => setCtxMenu((p) => ({ ...p, open:false, row:null }));
        window.addEventListener("click", close);
        window.addEventListener("scroll", close, true);
        window.addEventListener("resize", close);
        return () => {
            window.removeEventListener("click", close);
            window.removeEventListener("scroll", close, true);
            window.removeEventListener("resize", close);
        };
    }, []);

    const onRowContextMenu = (e, row) => { e.preventDefault(); e.stopPropagation(); setCtxMenu({ open:true, x:e.clientX, y:e.clientY, row }); };

    const refreshList = async () => {
        setLoadingList(true);
        try { const data = await apiEntregas.list(); setEntregas(Array.isArray(data) ? data : []); }
        catch (e) { console.error(e); setEntregas([]); }
        finally { setLoadingList(false); }
    };
    useEffect(() => { refreshList(); }, []);

    const dealers = useMemo(() => {
        const set = new Set((entregas||[]).map((i) => normalizeStr(i.agencia)).filter(Boolean));
        if (!isAdmin && userAgencia) return ["Todos", userAgencia];
        return ["Todos", ...Array.from(set)];
    }, [entregas, isAdmin, userAgencia]);

    const filtered = useMemo(() => {
        const q = filters.q.trim().toLowerCase();
        const desdeInt = ymdToInt(filters.rangoDesde);
        const hastaInt = ymdToInt(filters.rangoHasta);
        return (entregas||[]).filter((item) => {
            if (!isAdmin && userAgencia && normalizeStr(item.agencia) !== normalizeStr(userAgencia)) return false;
            const matchQ = !q ||
                normalizeStr(item.agencia).toLowerCase().includes(q) ||
                normalizeStr(item?.cliente?.nombre).toLowerCase().includes(q) ||
                normalizeStr(item?.cliente?.telefono).toLowerCase().includes(q) ||
                normalizeStr(item.vin).toLowerCase().includes(q) ||
                normalizeStr(item.modelo_version).toLowerCase().includes(q) ||
                normalizeStr(item.asesor_ventas).toLowerCase().includes(q) ||
                normalizeStr(item.preparada_por).toLowerCase().includes(q) ||
                normalizeStr(item.id_cliente_sf_nadin).toLowerCase().includes(q) ||
                normalizeStr(item.id_cliente_sf_dms).toLowerCase().includes(q) ||
                normalizeStr(item.comentarios).toLowerCase().includes(q);
            const matchAgencia = filters.agencia === "Todos" || normalizeStr(item.agencia) === normalizeStr(filters.agencia);
            let matchRango = true;
            if (desdeInt !== null || hastaInt !== null) {
                const ymdInt = ymdToInt(item.fecha_hora_entrega ? toYMDLocal(item.fecha_hora_entrega) : "");
                if (!ymdInt) return false;
                if (desdeInt !== null && ymdInt < desdeInt) matchRango = false;
                if (hastaInt !== null && ymdInt > hastaInt) matchRango = false;
            }
            return matchQ && matchAgencia && matchRango;
        });
    }, [entregas, filters, isAdmin, userAgencia]);

    const sorted = useMemo(() => {
        const data = [...filtered];
        const { key, dir } = sort;
        if (!key) return data;
        const mult = dir === "asc" ? 1 : -1;
        return data.sort((a, b) => {
            if (key === "fecha_hora_entrega") {
                return (new Date(a.fecha_hora_entrega||0).getTime() - new Date(b.fecha_hora_entrega||0).getTime()) * mult;
            }
            const va = normalizeStr(a?.[key]).toLowerCase();
            const vb = normalizeStr(b?.[key]).toLowerCase();
            if (va < vb) return -1*mult; if (va > vb) return 1*mult; return 0;
        });
    }, [filtered, sort]);

    const agendaRows = useMemo(() => {
        const ws = startOfWeekMonday(currentWeekDate);
        const we = addDays(ws, 5);
        const minI = ymdToInt(toYMDLocal(ws)), maxI = ymdToInt(toYMDLocal(we));
        return [...filtered].filter((r) => {
            if (!r.fecha_hora_entrega) return true;
            const i = ymdToInt(toYMDLocal(r.fecha_hora_entrega));
            return i >= minI && i <= maxI;
        }).sort((a,b) => new Date(a.fecha_hora_entrega||0).getTime() - new Date(b.fecha_hora_entrega||0).getTime());
    }, [filtered, currentWeekDate]);

    const openCreate = (fechaHoraDefault = "") => {
        setTouchedSave(false); setMode("create");
        setDraft({ id:null, cliente_id:null, agencia: isAdmin?"":userAgencia,
            cliente_nombre:"", cliente_telefono:"", vin:"", modelo_version:"",
            fecha_hora_entrega:fechaHoraDefault, entrega_reportada:false,
            asesor_ventas:"", preparada_por:"", id_cliente_sf_nadin:"", id_cliente_sf_dms:"", comentarios:"" });
        setOpenModal(true);
    };

    const openEdit = async (row) => {
        if (!row?.id) return;
        try {
            setTouchedSave(false); setMode("edit"); setLoadingDetail(true); setOpenModal(true);
            const item = await apiEntregas.get(row.id);
            if (!isAdmin && userAgencia && normalizeStr(item.agencia) !== normalizeStr(userAgencia)) {
                alert("No tienes permisos para ver registros de otra agencia."); setOpenModal(false); return;
            }
            setDraft({
                id:item.id, cliente_id:item?.cliente?.id_cliente??null,
                agencia:item.agencia||(isAdmin?"":userAgencia),
                cliente_nombre:item?.cliente?.nombre||"", cliente_telefono:item?.cliente?.telefono||"",
                vin:item.vin||"", modelo_version:item.modelo_version||"",
                fecha_hora_entrega:toDTLocal(item.fecha_hora_entrega), entrega_reportada:entregaFisicaActiva(item.entrega_reportada),
                asesor_ventas:item.asesor_ventas||"", preparada_por:item.preparada_por||"",
                id_cliente_sf_nadin:item.id_cliente_sf_nadin||"", id_cliente_sf_dms:item.id_cliente_sf_dms||"",
                comentarios:item.comentarios||"",
            });
        } catch (e) { console.error(e); alert("No se pudo abrir la entrega."); setOpenModal(false); }
        finally { setLoadingDetail(false); }
    };

    const closeModal = () => { if (saving) return; setOpenModal(false); setDraft(null); };

    const eliminarEntrega = async (row) => {
        if (!row?.id) return;
        if (!isAdmin && userAgencia && normalizeStr(row.agencia) !== normalizeStr(userAgencia)) {
            alert("No tienes permisos para eliminar registros de otra agencia."); return;
        }
        if (!confirm(`¿Eliminar la entrega de ${row?.cliente?.nombre||row?.cliente?.telefono||"cliente"}?`)) return;
        try {
            await apiEntregas.remove(row.id);
            setEntregas((p) => p.filter((i) => i.id !== row.id));
            setCtxMenu({ open:false, x:0, y:0, row:null });
        } catch (e) { console.error(e); alert("No se pudo eliminar."); }
    };

    const save = async () => {
        if (!draft || saving) return;
        setTouchedSave(true);
        if (missing.length || !telIsOk) return;
        setSaving(true);
        try {
            const agenciaFinal = isAdmin ? normalizeStr(draft.agencia||"") : userAgencia;
            const payload = {
                agencia:agenciaFinal, ...(draft.cliente_id ? { cliente_id:draft.cliente_id } : {}),
                nombre:draft.cliente_nombre||"", telefono:normalizePhoneForSave(draft.cliente_telefono),
                vin:draft.vin||"", modelo_version:draft.modelo_version||"",
                fecha_hora_entrega:fromDTLocalToISO(draft.fecha_hora_entrega),
                entrega_reportada:!!draft.entrega_reportada, asesor_ventas:draft.asesor_ventas||"",
                preparada_por:draft.preparada_por||"", id_cliente_sf_nadin:draft.id_cliente_sf_nadin||"",
                id_cliente_sf_dms:draft.id_cliente_sf_dms||"", comentarios:draft.comentarios||"",
            };
            if (mode === "create") await apiEntregas.create(payload);
            else await apiEntregas.update(draft.id, payload);
            await refreshList();
            closeModal();
        } catch (e) { console.error(e); alert("Error guardando la entrega."); }
        finally { setSaving(false); }
    };

    const toggleEntregaInline = async (row) => {
        const id = row?.id; if (!id) return;
        if (!isAdmin && userAgencia && normalizeStr(row.agencia) !== normalizeStr(userAgencia)) {
            alert("No tienes permisos."); return;
        }
        const prev = entregaFisicaActiva(row.entrega_reportada);
        setEntregas((p) => p.map((i) => i.id===id ? { ...i, entrega_reportada:!prev } : i));
        setUpdatingInline((p) => ({ ...p, [id]:true }));
        try { await apiEntregas.patch(id, { entrega_reportada:!prev }); }
        catch (e) {
            console.error(e);
            setEntregas((p) => p.map((i) => i.id===id ? { ...i, entrega_reportada:prev } : i));
            alert("No se pudo actualizar.");
        }
        finally { setUpdatingInline((p) => { const n={...p}; delete n[id]; return n; }); }
    };

    const resetFilters = () => { setFilters({ q:"", agencia:"Todos", rangoDesde:"", rangoHasta:"" }); setCurrentWeekDate(new Date()); };
    const setHoy = () => { const h=toYMDLocal(new Date()); setCurrentWeekDate(new Date()); setFilters((p)=>({ ...p, rangoDesde:h, rangoHasta:h })); };
    const onChangeDateFilter = (key, value) => { setFilters((p)=>({ ...p, [key]:value })); if (value) setCurrentWeekDate(parseYMDLocal(value)); };

    // vistas disponibles
    const VIEWS = [
        { key:"agenda",   label:"Agenda",   Icon:CalendarDays },
        { key:"tabla",    label:"Tabla",    Icon:TableProperties },
        { key:"graficas", label:"Gráficas", Icon:BarChart2 },
    ];

    // ══════════════════════════════════════════════════════════════════════════
    return (
        <div className="w-full">
      {/* ── Header premium Entregas ── */}
<div
    className="relative mb-4 overflow-hidden rounded-2xl"
    style={{
        background: "linear-gradient(135deg, #0d0d0d 0%, #181818 40%, #111111 70%, #0a0a0a 100%)",
        border: "0.5px solid rgba(255,255,255,0.06)",
    }}
>
    {/* Línea de acento superior */}
    <div
        className="absolute top-0 left-0 right-0"
        style={{
            height: "1px",
            background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0) 10%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.55) 60%, rgba(255,255,255,0) 90%, transparent 100%)",
        }}
    />

    {/* Glows */}
    <div
        className="pointer-events-none absolute"
        style={{
            top: "-60px", left: "-60px",
            width: "260px", height: "200px",
            background: "radial-gradient(ellipse, rgba(255,255,255,0.03) 0%, transparent 70%)",
        }}
    />
    <div
        className="pointer-events-none absolute"
        style={{
            bottom: "-40px", right: "-20px",
            width: "220px", height: "160px",
            background: "radial-gradient(ellipse, rgba(255,255,255,0.02) 0%, transparent 70%)",
        }}
    />

    <div className="relative px-6 pt-5 pb-0" style={{ zIndex: 1 }}>

        {/* Fila 1 — breadcrumb + vista tabs */}
        <div className="flex items-center justify-between mb-5">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2.5">
                <div
                    className="rounded-full"
                    style={{ width: 6, height: 6, background: "rgba(255,255,255,0.9)" }}
                />
                <span
                    style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.35)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                    }}
                >
                    Comercial &nbsp;/&nbsp; Entregas
                </span>
            </div>

            {/* Selector de vista pill-group */}
            <div
                className="flex gap-1 p-[3px] rounded-[10px]"
                style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "0.5px solid rgba(255,255,255,0.08)",
                }}
            >
                {VIEWS.map(({ key, label, Icon }) => {
                    const active = viewMode === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setViewMode(key)}
                            className="inline-flex items-center gap-1.5 whitespace-nowrap transition-all"
                            style={{
                                padding: "6px 14px",
                                borderRadius: 7,
                                fontSize: 12,
                                fontWeight: 500,
                                border: active
                                    ? "0.5px solid rgba(255,255,255,0.18)"
                                    : "0.5px solid transparent",
                                background: active ? "rgba(255,255,255,0.12)" : "transparent",
                                color: active ? "#ffffff" : "rgba(255,255,255,0.38)",
                            }}
                        >
                            <Icon size={13} />
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Divisor */}
        <div
            style={{
                height: "0.5px",
                background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 15%, rgba(255,255,255,0.08) 85%, transparent)",
                marginBottom: 18,
            }}
        />

        {/* Fila 2 — título + stats + botón */}
        <div className="flex items-end justify-between gap-4 pb-5">

            <div>
                <h2
                    style={{
                        fontSize: 26,
                        fontWeight: 500,
                        color: "#ffffff",
                        margin: "0 0 5px",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.1,
                    }}
                >
                    Entregas
                </h2>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                    {!isAdmin && userAgencia
                        ? <span>Agencia: <span style={{ color: "rgba(255,255,255,0.6)" }}>{userAgencia}</span></span>
                        : viewMode === "tabla"
                        ? "Registro y seguimiento de entregas. Doble clic para editar."
                        : viewMode === "agenda"
                        ? "Vista semanal de entregas programadas."
                        : "Estadísticas de entregas."}
                </p>
            </div>

            <div className="flex items-center gap-3">
                {/* Mini-stats dinámicos */}
                <div
                    className="flex items-stretch overflow-hidden rounded-[10px]"
                    style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                >
                    {[
                        { n: entregas.length,                                                                   l: "Total"      },
                        { n: entregas.filter(r => entregaFisicaActiva(r.entrega_reportada)).length,             l: "Entregadas" },
                        { n: entregas.filter(r => !entregaFisicaActiva(r.entrega_reportada)).length,            l: "Pendientes" },
                    ].map((s, i) => (
                        <div
                            key={i}
                            className="text-center px-[16px] py-[9px]"
                            style={{
                                background: "rgba(255,255,255,0.04)",
                                borderLeft: i > 0 ? "0.5px solid rgba(255,255,255,0.08)" : "none",
                            }}
                        >
                            <div style={{ fontSize: 18, fontWeight: 500, color: "#fff", lineHeight: 1 }}>
                                {s.n}
                            </div>
                            <div
                                style={{
                                    fontSize: 10,
                                    color: "rgba(255,255,255,0.3)",
                                    marginTop: 3,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                }}
                            >
                                {s.l}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Botón nueva entrega */}
                <button
                    type="button"
                    onClick={() => openCreate()}
                    className="inline-flex items-center gap-2 whitespace-nowrap transition-all"
                    style={{
                        padding: "8px 16px",
                        borderRadius: 9,
                        fontSize: 13,
                        fontWeight: 500,
                        background: "rgba(255,255,255,0.1)",
                        border: "0.5px solid rgba(255,255,255,0.18)",
                        color: "#ffffff",
                    }}
                >
                    <Plus size={14} />
                    Nueva Entrega
                </button>
            </div>
        </div>
    </div>

    {/* Franja inferior decorativa */}
    <div
        style={{
            height: 3,
            background: "linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 30%, #1f1f1f 60%, #111 100%)",
        }}
    />
</div>

            {/* ── Filtros ──────────────────────────────────────────────────── */}
            <div className="mb-4 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
                <div className="grid gap-3 md:grid-cols-12">
                    <div className="md:col-span-6">
                        <FilterBlock label="Búsqueda">
                            <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-white px-3 py-2">
                                <Search className="h-4 w-4 text-zinc-600" />
                                <input value={filters.q} onChange={(e) => setFilters((p)=>({...p, q:e.target.value}))}
                                    placeholder="Buscar por dealer, cliente, VIN, modelo, asesor…"
                                    className="w-full text-sm text-zinc-800 outline-none placeholder:text-zinc-400" />
                                {filters.q && (
                                    <button onClick={() => setFilters((p)=>({...p, q:""}))}
                                        className="rounded p-1 text-zinc-500 hover:text-red-500">
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-3">
                        <FilterBlock label="Dealer">
                            <select value={filters.agencia} onChange={(e) => setFilters((p)=>({...p, agencia:e.target.value}))}
                                className="w-full rounded-lg border border-zinc-700 bg-white px-3 py-2 text-sm text-zinc-800 outline-none">
                                {dealers.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-3">
                        <FilterBlock label="Acciones">
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={setHoy}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                                    <CalendarDays className="h-4 w-4" /> Hoy
                                </button>
                                <button onClick={resetFilters}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-900 hover:text-white transition">
                                    <X className="h-4 w-4" /> Limpiar
                                </button>
                            </div>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-6">
                        <FilterBlock label="Desde">
                            <input type="date" value={filters.rangoDesde} onChange={(e) => onChangeDateFilter("rangoDesde", e.target.value)}
                                className="w-full rounded-lg border border-zinc-700 bg-white px-3 py-2 text-sm text-zinc-800 outline-none" />
                        </FilterBlock>
                    </div>
                    <div className="md:col-span-6">
                        <FilterBlock label="Hasta">
                            <input type="date" value={filters.rangoHasta} onChange={(e) => onChangeDateFilter("rangoHasta", e.target.value)}
                                className="w-full rounded-lg border border-zinc-700 bg-white px-3 py-2 text-sm text-zinc-800 outline-none" />
                        </FilterBlock>
                    </div>
                </div>
            </div>

            {/* ── VISTAS ───────────────────────────────────────────────────── */}

            {viewMode === "agenda" && (
                <>
                    <AgendaMobileList rows={agendaRows} loading={loadingList} onEdit={openEdit}
                        onContext={onRowContextMenu} onToggleEntrega={toggleEntregaInline} updatingInline={updatingInline} />
                    <AgendaWeekView rows={agendaRows} loading={loadingList} currentWeekDate={currentWeekDate}
                        setCurrentWeekDate={setCurrentWeekDate} onCreateAt={openCreate} onEdit={openEdit}
                        onContext={onRowContextMenu} onToggleEntrega={toggleEntregaInline} updatingInline={updatingInline} />
                </>
            )}

            {viewMode === "graficas" && <GraficasView registros={filtered} />}

            {viewMode === "tabla" && (
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                    <div className="overflow-auto">
                        <table className="min-w-full text-left text-sm">
                            {/* thead zinc-800 casi negro */}
                            <thead style={{ background:"#27272a" }} className="text-xs text-zinc-100 border border-zinc-700">
                                <tr>
                                    {[
                                        { key:"fecha_hora_entrega", label:"Fecha y Hora Entrega", sort:true },
                                        { key:"agencia",            label:"Dealer",               sort:true },
                                        { key:null, label:"Cliente" },
                                        { key:null, label:"Chasis" },
                                        { key:null, label:"Modelo/Versión" },
                                        { key:null, label:"Asesor Ventas" },
                                        { key:null, label:"Entrega Física" },
                                        { key:null, label:"Preparada por" },
                                        { key:null, label:"ID SF-NADIN" },
                                        { key:null, label:"ID SF-DMS" },
                                        { key:null, label:"Comentarios" },
                                    ].map(({ key, label, sort:s }) => (
                                        <th key={label} className="px-4 py-3">
                                            {s ? (
                                                <button type="button" onClick={() => toggleSort(key)}
                                                    className="inline-flex items-center gap-1 text-xs font-bold">
                                                    {label}
                                                    <span className="opacity-60">
                                                        {sort.key === key
                                                            ? sort.dir === "asc" ? <ChevronUp className="h-4" /> : <ChevronDown className="h-4" />
                                                            : <ArrowUpDown className="h-4" />}
                                                    </span>
                                                </button>
                                            ) : label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {loadingList
                                    ? Array.from({ length:8 }).map((_,i) => <SkeletonRow key={i} />)
                                    : (
                                        <>
                                            {sorted.map((row) => {
                                                const isUpdating = !!updatingInline[row.id];
                                                return (
                                                    <tr key={row.id} onDoubleClick={() => openEdit(row)} onContextMenu={(e) => onRowContextMenu(e, row)}
                                                        className="cursor-pointer hover:bg-zinc-50" title="Doble clic para editar">
                                                        <td className="px-4 py-3 text-zinc-700">{formatDateTime(row.fecha_hora_entrega)}</td>
                                                        <td className="px-4 py-3 font-semibold text-zinc-800">{row.agencia||"—"}</td>
                                                        <td className="px-4 py-3 text-zinc-700">{row?.cliente?.nombre||"—"}</td>
                                                        <td className="px-4 py-3 text-zinc-700">{row.vin||"—"}</td>
                                                        <td className="px-4 py-3 text-zinc-700">{row.modelo_version||"—"}</td>
                                                        <td className="px-4 py-3 text-zinc-700">{row.asesor_ventas||"—"}</td>
                                                        <td className="px-4 py-3">
                                                            <StatusButton row={row} loading={isUpdating} onToggle={toggleEntregaInline} />
                                                        </td>
                                                        <td className="px-4 py-3 text-zinc-700">{row.preparada_por||"—"}</td>
                                                        <td className="px-4 py-3 text-zinc-700">{row.id_cliente_sf_nadin||"—"}</td>
                                                        <td className="px-4 py-3 text-zinc-700">{row.id_cliente_sf_dms||"—"}</td>
                                                        <td className="px-4 py-3 text-zinc-700"><span className="line-clamp-2">{row.comentarios||"—"}</span></td>
                                                    </tr>
                                                );
                                            })}
                                            {sorted.length === 0 && (
                                                <tr><td colSpan={11} className="px-4 py-10 text-center text-zinc-400">No hay resultados con esos filtros.</td></tr>
                                            )}
                                        </>
                                    )
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <ContextMenu ctxMenu={ctxMenu}
                onDelete={async (row) => { await eliminarEntrega(row); setCtxMenu({ open:false, x:0, y:0, row:null }); }}
                onClose={() => setCtxMenu({ open:false, x:0, y:0, row:null })} />

            {/* ── MODAL ────────────────────────────────────────────────────── */}
            <Modal open={openModal} title={mode==="create" ? "Nueva Entrega" : `Editar Entrega • ${draft?.id}`}
                onClose={closeModal}
                footer={
                    <>
                        <button onClick={closeModal} disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-400 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60">
                            <X className="h-4 w-4" /> Cancelar
                        </button>
                        <button onClick={save} disabled={saving||loadingDetail||telInvalid||(draft?.cliente_telefono?!telIsOk:false)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:bg-black disabled:opacity-60 transition">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </>
                }>
                {loadingDetail ? <ModalSkeleton /> : !draft ? null : (
                    <div className="grid gap-3 md:grid-cols-3">
                        <Field label="Dealer" icon={Building2}>
                            <select value={draft.agencia||""} onChange={(e)=>setDraft((p)=>({...p,agencia:e.target.value}))}
                                disabled={!isAdmin} className={[inputBase, inputOk, !isAdmin?"cursor-not-allowed opacity-75":""].join(" ")}>
                                <option value="" disabled>Selecciona un dealer...</option>
                                {(isAdmin?DEALERS:userAgencia?[userAgencia]:DEALERS).map((d)=><option key={d} value={d}>{d}</option>)}
                            </select>
                        </Field>

                        <Field label="Nombre del cliente" icon={User}>
                            <input value={draft.cliente_nombre} onChange={(e)=>setDraft((p)=>({...p,cliente_nombre:e.target.value}))}
                                className={[inputBase,inputOk].join(" ")} placeholder="Nombre completo" />
                        </Field>

                        <Field label="Teléfono" icon={Phone}>
                            <input maxLength={12} value={draft.cliente_telefono}
                                onChange={(e)=>setDraft((p)=>({...p,cliente_telefono:e.target.value.replace(/\D/g,"").slice(0,12)}))}
                                disabled={mode==="edit"}
                                className={[inputBase, isInvalid("cliente_telefono")||telInvalid?inputBad:inputOk, mode==="edit"?"cursor-not-allowed opacity-75":""].join(" ")} />
                            {isInvalid("cliente_telefono") && <div className="mt-2 text-xs font-bold text-red-600">Teléfono es requerido.</div>}
                            {!isInvalid("cliente_telefono") && telError && <div className="mt-2 text-xs font-bold text-red-600">{telError}</div>}
                            {!telError && /^\d{10}$/.test(telDigits) && <div className="mt-2 text-xs font-bold text-emerald-700">Se guardará con prefijo 52.</div>}
                        </Field>

                        <Field label="VIN / Chasis" icon={Hash}>
                            <input value={draft.vin} onChange={(e)=>setDraft((p)=>({...p,vin:e.target.value.toUpperCase()}))}
                                className={[inputBase,inputOk].join(" ")} placeholder="VIN / chasis" />
                        </Field>

                        <Field label="Modelo / Versión" icon={CarFront}>
                            <select value={draft.modelo_version||""} onChange={(e)=>setDraft((p)=>({...p,modelo_version:e.target.value}))}
                                className={[inputBase,inputOk].join(" ")}>
                                <option value="" disabled>Selecciona un modelo...</option>
                                {MODELOS.map((m)=><option key={m} value={m}>{m}</option>)}
                            </select>
                        </Field>

                        <Field label="Fecha y Hora de Entrega" icon={CalendarDays}>
                            <input type="datetime-local" value={draft.fecha_hora_entrega}
                                onChange={(e)=>setDraft((p)=>({...p,fecha_hora_entrega:e.target.value}))}
                                className={[inputBase, isInvalid("fecha_hora_entrega")?inputBad:inputOk].join(" ")} />
                            {isInvalid("fecha_hora_entrega") && <div className="mt-2 text-xs font-bold text-red-600">Fecha y hora es requerido.</div>}
                        </Field>

                        <Field label="Entrega Física" icon={UserCheck}>
                            <button type="button" onClick={()=>setDraft((p)=>({...p,entrega_reportada:!p.entrega_reportada}))}
                                className={[
                                    "inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-black transition",
                                    draft.entrega_reportada
                                        ? "border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                        : "border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200",
                                ].join(" ")}>
                                {draft.entrega_reportada ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                                {draft.entrega_reportada ? "Entrega física realizada" : "Entrega física pendiente"}
                            </button>
                        </Field>

                        <Field label="Asesor Ventas" icon={UserStar}>
                            <select value={draft.asesor_ventas||""} onChange={(e)=>setDraft((p)=>({...p,asesor_ventas:e.target.value}))}
                                className={[inputBase,inputOk].join(" ")}>
                                <option value="" disabled>Selecciona un asesor...</option>
                                {ASESORES.map((a)=><option key={a} value={a}>{a}</option>)}
                            </select>
                        </Field>

                        <Field label="Preparada por" icon={ClipboardList}>
                            <input value={draft.preparada_por} onChange={(e)=>setDraft((p)=>({...p,preparada_por:e.target.value}))}
                                className={[inputBase,inputOk].join(" ")} placeholder="Nombre de quien preparó" />
                        </Field>

                        <Field label="ID Cliente / SF-NADIN" icon={IdCard}>
                            <input value={draft.id_cliente_sf_nadin} onChange={(e)=>setDraft((p)=>({...p,id_cliente_sf_nadin:e.target.value}))}
                                className={[inputBase,inputOk].join(" ")} placeholder="ID SF-NADIN" />
                        </Field>

                        <Field label="ID Cliente / SF-DMS" icon={Table2}>
                            <input value={draft.id_cliente_sf_dms} onChange={(e)=>setDraft((p)=>({...p,id_cliente_sf_dms:e.target.value}))}
                                className={[inputBase,inputOk].join(" ")} placeholder="ID SF-DMS" />
                        </Field>

                        <div className="md:col-span-3">
                            <Field label="Comentarios" icon={MessageSquareText}>
                                <textarea value={draft.comentarios} onChange={(e)=>setDraft((p)=>({...p,comentarios:e.target.value}))}
                                    className={[inputBase,inputOk,"min-h-[110px]"].join(" ")} placeholder="Notas internas..." />
                            </Field>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}