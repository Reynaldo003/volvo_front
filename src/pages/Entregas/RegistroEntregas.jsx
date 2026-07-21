// src/pages/Entregas/RegistroEntregas.jsx
import { useMemo, useState, useEffect } from "react";
import {
    Plus, Search, X, Save, User, CarFront, CalendarDays,
    ArrowUpDown, ChevronDown, ChevronUp, Trash2, Loader2,
    Phone, Building2, UserCheck, UserStar, MessageSquareText,
    Table2, Hash, ClipboardList, IdCard, ChevronLeft, ChevronRight,
    CheckCircle2, Clock3, TableProperties, BarChart2, TrendingUp,
    Package, LayoutGrid,
} from "lucide-react";
import { apiEntregas } from "../../lib/apiEntregas";
import { createPortal } from "react-dom";
import { useAuth } from "../../auth/AuthContext";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, PieChart, Pie, Cell, Legend, AreaChart, Area,
    LineChart, Line,
} from "recharts";

// ─── helpers ─────────────────────────────────────────────────────────────────
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const HOURS = Array.from({ length: 13 }, (_, i) => `${String(i + 8).padStart(2, "0")}:00`);

function normalizeStr(v) { return String(v ?? "").trim(); }
function entregaFisicaActiva(value) {
    if (value === true || value === 1) return true;
    return ["si", "sí", "true", "1", "yes", "entregada", "reportada"].includes(String(value ?? "").trim().toLowerCase());
}
function normalizePhoneForSave(value) {
    const d = String(value || "").replace(/\D/g, "");
    return /^\d{10}$/.test(d) ? `52${d}` : d;
}
function toDTLocal(isoOrNull) {
    if (!isoOrNull) return "";
    const s = String(isoOrNull);
    if (s.endsWith("Z")) {
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return "";
        const p = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16);
    return "";
}
function fromDTLocalToISO(v) { return String(v || "").trim() || null; }
function toYMDLocal(dateLike) {
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return "";
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
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
    const d = new Date(date); d.setDate(d.getDate() + days); return d;
}
function startOfWeekMonday(date) {
    const d = new Date(date);
    const delta = (d.getDay() + 6) % 7;
    d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - delta); return d;
}
function formatWeekTitle(start, end) {
    return `${start.toLocaleDateString("es-MX", { day: "numeric", month: "long" })} — ${end.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}`;
}
function weekdayShortEs(d) { return ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][d.getDay()] || ""; }
function formatCardTime(dateLike) {
    if (!dateLike) return "—";
    const d = new Date(dateLike);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}
function formatDateTime(dateLike) {
    if (!dateLike) return "—";
    const d = new Date(dateLike);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function getHourKey(dateLike) {
    if (!dateLike) return "";
    const d = new Date(dateLike);
    return Number.isNaN(d.getTime()) ? "" : `${String(d.getHours()).padStart(2, "0")}:00`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
    return <div className={["animate-pulse rounded-md bg-gray-100", className].join(" ")} />;
}
function SkeletonRow() {
    return (
        <tr className="animate-pulse border-b border-gray-100">
            {Array.from({ length: 11 }).map((_, i) => (
                <td key={i} className="px-4 py-3.5"><div className="h-4 w-24 rounded bg-gray-100" /></td>
            ))}
        </tr>
    );
}
function ModalSkeleton() {
    return (
        <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <Skeleton className="h-4 w-32" /><Skeleton className="mt-3 h-10 w-full rounded-lg" />
                </div>
            ))}
        </div>
    );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;
    return createPortal(
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-6xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                    <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-100">
                        <span className="text-base font-semibold text-gray-900 truncate">{title}</span>
                        <button onClick={onClose}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all duration-150 active:scale-95">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="max-h-[72vh] overflow-auto p-6">{children}</div>
                    {footer && (
                        <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
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
        <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                {Icon && <Icon className="h-4 w-4 text-gray-400" />}
                <span>{label}</span>
            </div>
            {children}
        </div>
    );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusButton({ row, loading, onToggle, compact = false }) {
    const entregada = entregaFisicaActiva(row?.entrega_reportada);
    return (
        <button type="button" disabled={loading}
            onClick={(e) => { e.stopPropagation(); onToggle?.(row); }}
            className={[
                "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full font-semibold transition-all duration-150 active:scale-95",
                compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1.5 text-xs",
                entregada
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                    : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100",
                loading ? "opacity-60 cursor-not-allowed" : "",
            ].join(" ")}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" />
                : entregada ? <CheckCircle2 className="h-3 w-3" />
                    : <Clock3 className="h-3 w-3" />}
            {entregada ? "Entregada" : "Pendiente"}
        </button>
    );
}

// ─── Context Menu ─────────────────────────────────────────────────────────────
function ContextMenu({ ctxMenu, onDelete, onClose }) {
    if (!ctxMenu.open || !ctxMenu.row) return null;
    return createPortal(
        <div className="fixed z-[9999]" style={{ left: ctxMenu.x, top: ctxMenu.y }} onClick={(e) => e.stopPropagation()}>
            <div className="w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
                <button className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    onClick={() => onDelete(ctxMenu.row)}>
                    <Trash2 className="h-4 w-4" /> Eliminar
                </button>
                <button className="w-full px-4 py-2 text-left text-xs text-gray-400 hover:bg-gray-50 transition-colors" onClick={onClose}>Cerrar</button>
            </div>
        </div>,
        document.body
    );
}

// ─── Agenda Card ─────────────────────────────────────────────────────────────
function EntregaAgendaCard({ row, onEdit, onContext, onToggleEntrega, updatingInline }) {
    const entregada = entregaFisicaActiva(row?.entrega_reportada);
    const isUpdating = !!updatingInline[row.id];

    const cardColor = entregada
        ? { border: "border-emerald-300", bg: "bg-emerald-50", bar: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" }
        : { border: "border-amber-300", bg: "bg-amber-50", bar: "bg-amber-500", badge: "bg-amber-100 text-amber-700 border-amber-200" };

    return (
        <button
            type="button"
            onClick={() => onEdit(row)}
            onContextMenu={(e) => onContext(e, row)}
            className={[
                "relative w-full overflow-hidden rounded-xl border-2 text-left shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] p-0",
                cardColor.border, cardColor.bg,
            ].join(" ")}
        >
            {/* Barra lateral de color */}
            <span className={["absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl", cardColor.bar].join(" ")} />

            <div className="pl-4 pr-3 pt-3 pb-3">
                {/* Fila top: hora + badge estado */}
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-gray-900 tabular-nums">
                            {formatCardTime(row.fecha_hora_entrega)}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                            {row.fecha_hora_entrega
                                ? new Date(row.fecha_hora_entrega).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" })
                                : "—"}
                        </span>
                    </div>
                    <StatusButton row={row} loading={isUpdating} onToggle={onToggleEntrega} compact />
                </div>

                {/* Nombre cliente */}
                <div className="text-sm font-bold text-gray-900 leading-tight truncate mb-2 uppercase tracking-wide">
                    {row?.cliente?.nombre || "Sin nombre"}
                </div>

                {/* Datos secundarios */}
                <div className="grid gap-1 text-[11px] text-gray-600">
                    {row?.cliente?.telefono && (
                        <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 shrink-0 text-gray-400" />
                            <span className="font-mono tracking-wide">{row.cliente.telefono}</span>
                        </div>
                    )}
                    {row.modelo_version && (
                        <div className="flex items-center gap-1.5">
                            <CarFront className="h-3 w-3 shrink-0 text-gray-400" />
                            <span className="truncate font-semibold">{row.modelo_version}</span>
                        </div>
                    )}
                    {row.vin && (
                        <div className="flex items-center gap-1.5">
                            <Hash className="h-3 w-3 shrink-0 text-gray-400" />
                            <span className="font-mono text-[10px] tracking-widest truncate">{row.vin}</span>
                        </div>
                    )}
                    {row.asesor_ventas && (
                        <div className="flex items-center gap-1.5">
                            <UserStar className="h-3 w-3 shrink-0 text-gray-400" />
                            <span className="truncate">{row.asesor_ventas}</span>
                        </div>
                    )}
                    {row.agencia && (
                        <div className="flex items-center gap-1.5">
                            <Building2 className="h-3 w-3 shrink-0 text-gray-400" />
                            <span className="truncate">{row.agencia}</span>
                        </div>
                    )}
                    {row.preparada_por && (
                        <div className="flex items-center gap-1.5">
                            <ClipboardList className="h-3 w-3 shrink-0 text-gray-400" />
                            <span className="truncate text-gray-500">Prep: {row.preparada_por}</span>
                        </div>
                    )}
                    {row.comentarios && (
                        <div className="mt-1 rounded-lg bg-white/70 border border-gray-200 px-2 py-1 text-[10px] text-gray-500 line-clamp-2 italic">
                            {row.comentarios}
                        </div>
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

    if (loading) return (
        <div className="grid gap-3 lg:hidden">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
                    <Skeleton className="h-4 w-40 mb-3" /><Skeleton className="h-16 w-full rounded-xl" />
                </div>
            ))}
        </div>
    );
    if (!rows.length) return (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-400 lg:hidden">
            No hay entregas en esta semana.
        </div>
    );
    return (
        <div className="grid gap-4 lg:hidden">
            {grouped.map(([key, items]) => {
                const title = key === "sin-fecha"
                    ? "Sin fecha"
                    : parseYMDLocal(key).toLocaleDateString("es-MX", { weekday: "long", day: "2-digit", month: "long" });
                return (
                    <section key={key} className="rounded-xl border border-gray-200 bg-white p-3">
                        <h3 className="mb-3 border-l-[3px] border-amber-400 pl-2 text-xs font-semibold uppercase tracking-wide text-gray-700">{title}</h3>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {items.map((row) => (
                                <EntregaAgendaCard key={row.id} row={row} onEdit={onEdit} onContext={onContext}
                                    onToggleEntrega={onToggleEntrega} updatingInline={updatingInline} />
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
    const weekDays = useMemo(() => Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)), [weekStart]);
    const weekEnd = weekDays[weekDays.length - 1];
    const todayIso = toYMDLocal(new Date());

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

    const gridStyle = { gridTemplateColumns: "64px repeat(6, minmax(200px, 1fr))" };

    return (
        <div className="hidden lg:block">
            {/* Nav semana */}
            <div className="mb-3 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-none">
                <div>
                    <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Semana</div>
                    <div className="text-sm font-semibold text-gray-800">{formatWeekTitle(weekStart, weekEnd)}</div>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setCurrentWeekDate((p) => addDays(p, -7))}
                        className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all duration-150 active:scale-95">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setCurrentWeekDate(new Date())}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-150 active:scale-95 focus:outline-none focus:ring-0">
                        <CalendarDays className="h-3.5 w-3.5" /> Hoy
                    </button>
                    <button type="button" onClick={() => setCurrentWeekDate((p) => addDays(p, 7))}
                        className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all duration-150 active:scale-95">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-none">
                <div className="overflow-auto">
                    <div className="min-w-[1280px]">
                        {/* Header días */}
                        <div className="sticky top-0 z-20 grid border-b border-gray-200 bg-gray-50" style={gridStyle}>
                            <div className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Hora</div>
                            {weekDays.map((day) => {
                                const iso = toYMDLocal(day);
                                const isToday = iso === todayIso;
                                return (
                                    <div key={iso} className="border-l border-gray-700 px-3 py-3 text-center">
                                        <div className={["mx-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-0 outline-none",
                                            isToday
                                                ? "bg-white text-gray-900 shadow-none"
                                                : "text-gray-500 hover:text-gray-300"].join(" ")}>

                                            <span>{weekdayShortEs(day)}</span>
                                            <span>{day.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" })}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Slots */}
                        {loading ? (
                            <div className="grid" style={gridStyle}>
                                {Array.from({ length: 42 }).map((_, i) => (
                                    <div key={i} className="min-h-[110px] border-b border-l border-gray-100 p-2">
                                        <Skeleton className="h-14 w-full rounded-xl" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            HOURS.map((hour) => (
                                <div key={hour} className="grid border-b border-gray-100" style={gridStyle}>
                                    <div className="bg-gray-50 px-3 py-3 text-[11px] font-medium text-gray-400 border-r border-gray-100">{hour}</div>
                                    {weekDays.map((day) => {
                                        const dayKey = toYMDLocal(day);
                                        const slotKey = `${dayKey}|${hour}`;
                                        const items = rowsBySlot.get(slotKey) || [];
                                        const isToday = dayKey === todayIso;
                                        return (
                                            <div key={slotKey}
                                                className={["group relative min-h-[110px] border-l border-gray-100 p-1.5 transition-colors duration-150",
                                                    isToday ? "bg-orange-50/60" : "bg-white hover:bg-gray-50/60"].join(" ")}>
                                                <button type="button" onClick={() => onCreateAt(`${dayKey}T${hour}`)}
                                                    className="absolute right-2 top-2 z-[4] h-7 w-7 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 opacity-0 shadow-sm hover:bg-gray-100 group-hover:opacity-100 transition-all duration-150 active:scale-95">
                                                    <Plus className="h-3.5 w-3.5" />
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
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="mb-2 text-xs font-semibold text-amber-800 uppercase tracking-wide">
                        Entregas sin hora o fuera del rango 08:00 – 20:00
                    </div>
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                        {outOfSchedule.map((row) => (
                            <EntregaAgendaCard key={row.id} row={row} onEdit={onEdit} onContext={onContext}
                                onToggleEntrega={onToggleEntrega} updatingInline={updatingInline} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-lg text-xs">
            <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
            {payload.map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: p.fill || p.stroke }} />
                    <span className="text-gray-500">{p.name}:</span>
                    <span className="font-semibold text-gray-900">{p.value}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Gráficas View ────────────────────────────────────────────────────────────
function GraficasView({ registros }) {
    const total = registros.length;
    const entregadas = registros.filter((r) => entregaFisicaActiva(r.entrega_reportada)).length;
    const pendientes = total - entregadas;
    const tasa = total > 0 ? Math.round((entregadas / total) * 100) : 0;

    const porMes = useMemo(() => {
        const map = {};
        registros.forEach((r) => {
            if (!r.fecha_hora_entrega) return;
            const d = new Date(r.fecha_hora_entrega);
            const key = `${MESES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
            if (!map[key]) map[key] = { name: key, Entregadas: 0, Pendientes: 0 };
            entregaFisicaActiva(r.entrega_reportada) ? map[key].Entregadas++ : map[key].Pendientes++;
        });
        return Object.values(map).slice(-6);
    }, [registros]);

    const porModelo = useMemo(() => {
        const map = {};
        registros.forEach((r) => { const k = r.modelo_version || "Sin especificar"; map[k] = (map[k] || 0) + 1; });
        return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
    }, [registros]);

    const porAsesor = useMemo(() => {
        const map = {};
        registros.forEach((r) => {
            const k = (r.asesor_ventas || "Sin asignar").split(" ").slice(0, 2).join(" ");
            if (!map[k]) map[k] = { name: k, Entregadas: 0, Pendientes: 0 };
            entregaFisicaActiva(r.entrega_reportada) ? map[k].Entregadas++ : map[k].Pendientes++;
        });
        return Object.values(map).sort((a, b) => (b.Entregadas + b.Pendientes) - (a.Entregadas + a.Pendientes));
    }, [registros]);

    const tendenciaSemanal = useMemo(() => {
        const map = {};
        registros.forEach((r) => {
            if (!r.fecha_hora_entrega) return;
            const ws = startOfWeekMonday(new Date(r.fecha_hora_entrega));
            const key = toYMDLocal(ws);
            if (!map[key]) map[key] = { name: `${ws.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" })}`, Entregas: 0 };
            map[key].Entregas++;
        });
        return Object.values(map).slice(-8);
    }, [registros]);

    const pieData = [
        { name: "Entregadas", value: entregadas },
        { name: "Pendientes", value: pendientes },
    ];

    const PIE_COLORS = ["#111827", "#e5e7eb"];

    return (
        <div className="space-y-4">
            {/* KPI cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        label: "Total entregas",
                        value: total,
                        icon: Package,
                        sub: "registros totales",
                        accent: "#111827",
                        bg: "#f9fafb",
                    },
                    {
                        label: "Entregadas",
                        value: entregadas,
                        icon: CheckCircle2,
                        sub: `${tasa}% del total`,
                        accent: "#16a34a",
                        bg: "#f0fdf4",
                    },
                    {
                        label: "Pendientes",
                        value: pendientes,
                        icon: Clock3,
                        sub: `${total > 0 ? Math.round((pendientes / total) * 100) : 0}% sin entregar`,
                        accent: "#d97706",
                        bg: "#fffbeb",
                    },
                    {
                        label: "Tasa de entrega",
                        value: `${tasa}%`,
                        icon: TrendingUp,
                        sub: `${entregadas} de ${total}`,
                        accent: "#2563eb",
                        bg: "#eff6ff",
                    },
                ].map(({ label, value, icon: Icon, sub, accent, bg }) => (
                    <div key={label}
                        className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
                                <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
                                <p className="text-[11px] text-gray-400 mt-1">{sub}</p>
                            </div>
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                                style={{ background: bg }}>
                                <Icon className="h-5 w-5" style={{ color: accent }} />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-30"
                            style={{ background: accent }} />
                    </div>
                ))}
            </div>

            {/* Row 2: Barras mensuales + Pie */}
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Entregas por mes</p>
                            <p className="text-xs text-gray-400 mt-0.5">Entregadas vs pendientes — últimos 6 meses</p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <ResponsiveContainer width="100%" height={230}>
                            <BarChart data={porMes} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barCategoryGap="35%">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
                                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                                    formatter={(v) => <span style={{ color: "#6b7280" }}>{v}</span>} />
                                <Bar dataKey="Entregadas" stackId="a" fill="#111827" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="Pendientes" stackId="a" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-gray-900">Estado general</p>
                    <p className="text-xs text-gray-400 mt-0.5 mb-2">Distribución entregadas / pendientes</p>
                    <div className="flex flex-col items-center justify-center h-[230px]">
                        <div className="relative">
                            <ResponsiveContainer width={160} height={160}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={72}
                                        dataKey="value" paddingAngle={3} startAngle={90} endAngle={-270}>
                                        {pieData.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-bold text-gray-900">{tasa}%</span>
                                <span className="text-[10px] text-gray-400">completado</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-5 mt-4">
                            {pieData.map((item, i) => (
                                <div key={item.name} className="flex items-center gap-1.5">
                                    <div className="h-2.5 w-2.5 rounded-full border border-gray-200"
                                        style={{ background: PIE_COLORS[i] }} />
                                    <span className="text-xs text-gray-500">{item.name}</span>
                                    <span className="text-xs font-bold text-gray-900">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 3: Tendencia semanal + Por modelo */}
            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-gray-900">Tendencia semanal</p>
                    <p className="text-xs text-gray-400 mt-0.5 mb-4">Número de entregas registradas por semana</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={tendenciaSemanal} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                            <defs>
                                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#111827" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e5e7eb" }} />
                            <Area type="monotone" dataKey="Entregas" stroke="#111827" strokeWidth={2}
                                fill="url(#areaGrad)" dot={{ r: 3, fill: "#111827", strokeWidth: 0 }}
                                activeDot={{ r: 5, fill: "#111827", strokeWidth: 0 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-gray-900">Por modelo / versión</p>
                    <p className="text-xs text-gray-400 mt-0.5 mb-4">Entregas registradas por modelo</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={porModelo} layout="vertical" margin={{ top: 0, right: 4, left: 8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} width={88} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
                            <Bar dataKey="value" name="Entregas" fill="#111827" radius={[0, 4, 4, 0]} barSize={12} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Row 4: Por asesor */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">Por asesor de ventas</p>
                <p className="text-xs text-gray-400 mt-0.5 mb-4">Entregas entregadas y pendientes por asesor</p>
                <ResponsiveContainer width="100%" height={Math.max(porAsesor.length * 42, 160)}>
                    <BarChart data={porAsesor} layout="vertical" margin={{ top: 0, right: 4, left: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} width={110} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
                        <Legend wrapperStyle={{ fontSize: 11 }}
                            formatter={(v) => <span style={{ color: "#6b7280" }}>{v}</span>} />
                        <Bar dataKey="Entregadas" stackId="a" fill="#111827" radius={[0, 0, 0, 0]} barSize={14} />
                        <Bar dataKey="Pendientes" stackId="a" fill="#e5e7eb" radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                </ResponsiveContainer>
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

    const DEALERS = useMemo(() => ["Volvo"], []);
    const ASESORES = ["Enrique Vazquez Islas", "Ricardo Platas", "Verónica Del Rayo Galindo León", "Julio Camacho Barragán", "Fernanda Romero Aguilar", "Zaira Vanessa Hernández Gómez",];
    const MODELOS = [
        "EX30",
        "EX40",
        "EC40",
        "EX90",
        "XC40",
        "XC60",
        "XC90",
        "XC60 Black Edition",
        "XC90 Black Edition",
        "Seminuevos",
        "Avalúo",
    ];

    const [ctxMenu, setCtxMenu] = useState({ open: false, x: 0, y: 0, row: null });
    const [viewMode, setViewMode] = useState("tabla");
    const [currentWeekDate, setCurrentWeekDate] = useState(new Date());
    const [sort, setSort] = useState({ key: "fecha_hora_entrega", dir: "desc" });
    const toggleSort = (key) => setSort((p) => p.key !== key ? { key, dir: "asc" } : { key, dir: p.dir === "asc" ? "desc" : "asc" });

    const [filters, setFilters] = useState({ q: "", agencia: "Todos", rangoDesde: "", rangoHasta: "" });
    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState("create");
    const [draft, setDraft] = useState(null);
    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);
    const [updatingInline, setUpdatingInline] = useState({});
    const REQUIRED = useMemo(() => ({ cliente_telefono: "Teléfono", fecha_hora_entrega: "Fecha y hora de entrega" }), []);
    const [touchedSave, setTouchedSave] = useState(false);

    const missing = useMemo(() => {
        if (!draft) return [];
        return Object.keys(REQUIRED).filter((key) => { const v = draft[key]; return v === null || v === undefined || (typeof v === "string" && v.trim() === ""); });
    }, [draft, REQUIRED]);

    const isInvalid = (key) => touchedSave && missing.includes(key);
    const telDigits = useMemo(() => String(draft?.cliente_telefono || "").replace(/\D/g, ""), [draft?.cliente_telefono]);
    const telIsOk = useMemo(() => /^(?:\d{10}|52\d{10})$/.test(telDigits), [telDigits]);
    const telError = useMemo(() => {
        if (!openModal || !draft || !telDigits) return "";
        if (/^\d{10}$/.test(telDigits) || /^52\d{10}$/.test(telDigits)) return "";
        if (telDigits.length < 10) return "Número incompleto (mínimo 10 dígitos)";
        if (telDigits.length === 11) return "Número incorrecto (11 dígitos no válido)";
        if (telDigits.length === 12 && !telDigits.startsWith("52")) return "Para 12 dígitos debe iniciar con 52";
        if (telDigits.length > 12) return "Número incorrecto (máximo 12 dígitos)";
        return "Número inválido";
    }, [openModal, draft, telDigits]);
    const telInvalid = !!telError;

    const inputBase = "w-full rounded-lg border px-3 py-2 text-sm text-gray-800 font-medium outline-none transition focus:ring-2 focus:ring-gray-900/10";
    const inputOk = "border-gray-200 bg-gray-50 focus:border-gray-400";
    const inputBad = "border-red-400 bg-red-50 focus:border-red-500";

    useEffect(() => {
        const close = () => setCtxMenu((p) => ({ ...p, open: false, row: null }));
        window.addEventListener("click", close); window.addEventListener("scroll", close, true); window.addEventListener("resize", close);
        return () => { window.removeEventListener("click", close); window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
    }, []);

    const onRowContextMenu = (e, row) => { e.preventDefault(); e.stopPropagation(); setCtxMenu({ open: true, x: e.clientX, y: e.clientY, row }); };

    const refreshList = async () => {
        setLoadingList(true);
        try { const data = await apiEntregas.list(); setEntregas(Array.isArray(data) ? data : []); }
        catch (e) { console.error(e); setEntregas([]); }
        finally { setLoadingList(false); }
    };
    useEffect(() => { refreshList(); }, []);

    const dealers = useMemo(() => {
        const set = new Set((entregas || []).map((i) => normalizeStr(i.agencia)).filter(Boolean));
        if (!isAdmin && userAgencia) return ["Todos", userAgencia];
        return ["Todos", ...Array.from(set)];
    }, [entregas, isAdmin, userAgencia]);

    const filtered = useMemo(() => {
        const q = filters.q.trim().toLowerCase();
        const desdeInt = ymdToInt(filters.rangoDesde), hastaInt = ymdToInt(filters.rangoHasta);
        return (entregas || []).filter((item) => {
            if (!isAdmin && userAgencia && normalizeStr(item.agencia) !== normalizeStr(userAgencia)) return false;
            const matchQ = !q || [item.agencia, item?.cliente?.nombre, item?.cliente?.telefono, item.vin, item.modelo_version, item.asesor_ventas, item.preparada_por, item.id_cliente_sf_nadin, item.id_cliente_sf_dms, item.comentarios]
                .some((v) => normalizeStr(v).toLowerCase().includes(q));
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
            if (key === "fecha_hora_entrega") return (new Date(a.fecha_hora_entrega || 0).getTime() - new Date(b.fecha_hora_entrega || 0).getTime()) * mult;
            const va = normalizeStr(a?.[key]).toLowerCase(), vb = normalizeStr(b?.[key]).toLowerCase();
            if (va < vb) return -1 * mult; if (va > vb) return 1 * mult; return 0;
        });
    }, [filtered, sort]);

    const agendaRows = useMemo(() => {
        const ws = startOfWeekMonday(currentWeekDate), we = addDays(ws, 5);
        const minI = ymdToInt(toYMDLocal(ws)), maxI = ymdToInt(toYMDLocal(we));
        return [...filtered].filter((r) => {
            if (!r.fecha_hora_entrega) return true;
            const i = ymdToInt(toYMDLocal(r.fecha_hora_entrega));
            return i >= minI && i <= maxI;
        }).sort((a, b) => new Date(a.fecha_hora_entrega || 0).getTime() - new Date(b.fecha_hora_entrega || 0).getTime());
    }, [filtered, currentWeekDate]);

    const openCreate = (fechaHoraDefault = "") => {
        setTouchedSave(false); setMode("create");
        setDraft({ id: null, cliente_id: null, agencia: isAdmin ? "" : userAgencia, cliente_nombre: "", cliente_telefono: "", vin: "", modelo_version: "", fecha_hora_entrega: fechaHoraDefault, entrega_reportada: false, asesor_ventas: "", preparada_por: "", id_cliente_sf_nadin: "", id_cliente_sf_dms: "", comentarios: "" });
        setOpenModal(true);
    };

    const openEdit = async (row) => {
        if (!row?.id) return;
        try {
            setTouchedSave(false); setMode("edit"); setLoadingDetail(true); setOpenModal(true);
            const item = await apiEntregas.get(row.id);
            if (!isAdmin && userAgencia && normalizeStr(item.agencia) !== normalizeStr(userAgencia)) { alert("No tienes permisos."); setOpenModal(false); return; }
            setDraft({ id: item.id, cliente_id: item?.cliente?.id_cliente ?? null, agencia: item.agencia || (isAdmin ? "" : userAgencia), cliente_nombre: item?.cliente?.nombre || "", cliente_telefono: item?.cliente?.telefono || "", vin: item.vin || "", modelo_version: item.modelo_version || "", fecha_hora_entrega: toDTLocal(item.fecha_hora_entrega), entrega_reportada: entregaFisicaActiva(item.entrega_reportada), asesor_ventas: item.asesor_ventas || "", preparada_por: item.preparada_por || "", id_cliente_sf_nadin: item.id_cliente_sf_nadin || "", id_cliente_sf_dms: item.id_cliente_sf_dms || "", comentarios: item.comentarios || "" });
        } catch (e) { console.error(e); alert("No se pudo abrir la entrega."); setOpenModal(false); }
        finally { setLoadingDetail(false); }
    };

    const closeModal = () => { if (saving) return; setOpenModal(false); setDraft(null); };

    const eliminarEntrega = async (row) => {
        if (!row?.id) return;
        if (!isAdmin && userAgencia && normalizeStr(row.agencia) !== normalizeStr(userAgencia)) { alert("Sin permisos."); return; }
        if (!confirm(`¿Eliminar la entrega de ${row?.cliente?.nombre || row?.cliente?.telefono || "cliente"}?`)) return;
        try { await apiEntregas.remove(row.id); setEntregas((p) => p.filter((i) => i.id !== row.id)); setCtxMenu({ open: false, x: 0, y: 0, row: null }); }
        catch (e) { console.error(e); alert("No se pudo eliminar."); }
    };

    const save = async () => {
        if (!draft || saving) return;
        setTouchedSave(true);
        if (missing.length || !telIsOk) return;
        setSaving(true);
        try {
            const agenciaFinal = isAdmin ? normalizeStr(draft.agencia || "") : userAgencia;
            const payload = { agencia: agenciaFinal, ...(draft.cliente_id ? { cliente_id: draft.cliente_id } : {}), nombre: draft.cliente_nombre || "", telefono: normalizePhoneForSave(draft.cliente_telefono), vin: draft.vin || "", modelo_version: draft.modelo_version || "", fecha_hora_entrega: fromDTLocalToISO(draft.fecha_hora_entrega), entrega_reportada: !!draft.entrega_reportada, asesor_ventas: draft.asesor_ventas || "", preparada_por: draft.preparada_por || "", id_cliente_sf_nadin: draft.id_cliente_sf_nadin || "", id_cliente_sf_dms: draft.id_cliente_sf_dms || "", comentarios: draft.comentarios || "" };
            if (mode === "create") await apiEntregas.create(payload);
            else await apiEntregas.update(draft.id, payload);
            await refreshList(); closeModal();
        } catch (e) { console.error(e); alert("Error guardando la entrega."); }
        finally { setSaving(false); }
    };

    const toggleEntregaInline = async (row) => {
        const id = row?.id; if (!id) return;
        if (!isAdmin && userAgencia && normalizeStr(row.agencia) !== normalizeStr(userAgencia)) { alert("Sin permisos."); return; }
        const prev = entregaFisicaActiva(row.entrega_reportada);
        setEntregas((p) => p.map((i) => i.id === id ? { ...i, entrega_reportada: !prev } : i));
        setUpdatingInline((p) => ({ ...p, [id]: true }));
        try { await apiEntregas.patch(id, { entrega_reportada: !prev }); }
        catch (e) { console.error(e); setEntregas((p) => p.map((i) => i.id === id ? { ...i, entrega_reportada: prev } : i)); alert("No se pudo actualizar."); }
        finally { setUpdatingInline((p) => { const n = { ...p }; delete n[id]; return n; }); }
    };

    const resetFilters = () => { setFilters({ q: "", agencia: "Todos", rangoDesde: "", rangoHasta: "" }); setCurrentWeekDate(new Date()); };
    const setHoy = () => { const h = toYMDLocal(new Date()); setCurrentWeekDate(new Date()); setFilters((p) => ({ ...p, rangoDesde: h, rangoHasta: h })); };
    const onChangeDateFilter = (key, value) => { setFilters((p) => ({ ...p, [key]: value })); if (value) setCurrentWeekDate(parseYMDLocal(value)); };

    const VIEWS = [
        { key: "agenda", label: "Agenda", Icon: CalendarDays },
        { key: "tabla", label: "Tabla", Icon: TableProperties },
        { key: "graficas", label: "Gráficas", Icon: BarChart2 },
    ];

    const totalEntregas = entregas.length;
    const totalEntregadas = entregas.filter(r => entregaFisicaActiva(r.entrega_reportada)).length;
    const totalPendientes = totalEntregas - totalEntregadas;
    const entregasHoy = entregas.filter(r => r.fecha_hora_entrega && toYMDLocal(r.fecha_hora_entrega) === toYMDLocal(new Date())).length;

    // ── Estadísticas para las tarjetas de métricas ────────────────────────────
    const metricCards = [
        {
            label: "Entregas de hoy",
            value: entregasHoy,
            icon: Package,
            color: "text-gray-900",
            iconBg: "bg-gray-100",
            iconColor: "text-gray-700",
        },
        {
            label: "Pendientes",
            value: totalPendientes,
            icon: Clock3,
            color: "text-amber-600",
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
        },
        {
            label: "Entregadas",
            value: totalEntregadas,
            icon: CheckCircle2,
            color: "text-emerald-600",
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
        },
        {
            label: "Total registros",
            value: totalEntregas,
            icon: LayoutGrid,
            color: "text-gray-700",
            iconBg: "bg-gray-100",
            iconColor: "text-gray-500",
        },
    ];

    // Tasa de asistencia (aquí: tasa de entrega)
    const tasaEntrega = totalEntregas > 0
        ? Math.round((totalEntregadas / totalEntregas) * 100)
        : 0;

    // ══════════════════════════════════════════════════════════════════════════
    return (
        <div className="w-full space-y-5">

            {/* ── HEADER ── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Entregas</h1>
                    <p className="mt-1 text-sm text-gray-500">Gestione y dé seguimiento a las entregas de vehículos.</p>
                </div>

                {/* Botones de vista + Nueva Entrega — mismo layout, sin cambio de posición */}
                <div className="flex items-center gap-2.5 shrink-0">
                    <div className="flex rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                        {VIEWS.map(({ key, label, Icon }) => {
                            const active = viewMode === key;
                            return (
                                <button key={key} type="button" onClick={() => setViewMode(key)}
                                    className={[
                                        "inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-all duration-150 border-r border-gray-200 last:border-r-0 active:scale-95",
                                        active
                                            ? "bg-gray-900 text-white font-semibold"
                                            : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-800",
                                    ].join(" ")}>
                                    <Icon className="h-4 w-4" />
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    <button type="button" onClick={() => openCreate()}
                        className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black transition-all duration-150 shadow-sm active:scale-95 group">
                        <Plus className="h-4 w-4 transition-transform duration-150 group-hover:rotate-90" />
                        Nueva Entrega
                    </button>
                </div>
            </div>

            {/* ── MÉTRICAS — estilo imagen Citas ── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {metricCards.map(({ label, value, icon: Icon, color, iconBg, iconColor }) => (
                    <div key={label}
                        className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                        <div className={["flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", iconBg].join(" ")}>
                            <Icon className={["h-5 w-5", iconColor].join(" ")} />
                        </div>
                        <div>
                            <div className={["text-3xl font-bold tracking-tight", color].join(" ")}>{value}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Tasa de entrega (como Tasa de asistencia en Citas) ── */}
            {totalEntregas > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                        <TrendingUp className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900">{tasaEntrega}%</span>
                            <span className="text-xs text-gray-400">tasa de entrega</span>
                        </div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gray-900 transition-all duration-700"
                                style={{ width: `${tasaEntrega}%` }}
                            />
                        </div>
                    </div>
                    <div className="text-xs text-gray-400 shrink-0">{totalEntregadas} de {totalEntregas}</div>
                </div>
            )}

            {/* ── FILTROS — estilo limpio blanco ── */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="grid gap-3 md:grid-cols-12">
                    {/* Búsqueda */}
                    <div className="md:col-span-5">
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                            Búsqueda
                        </label>
                        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-900/5 transition-all">
                            <Search className="h-4 w-4 shrink-0 text-gray-400" />
                            <input
                                value={filters.q}
                                onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                                placeholder="Buscar por dealer, cliente, VIN, modelo, asesor…"
                                className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                            />
                            {filters.q && (
                                <button onClick={() => setFilters((p) => ({ ...p, q: "" }))}
                                    className="text-gray-400 hover:text-gray-700 transition-colors active:scale-90">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Dealer */}
                    <div className="md:col-span-3">
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                            Dealer
                        </label>
                        <select
                            value={filters.agencia}
                            onChange={(e) => setFilters((p) => ({ ...p, agencia: e.target.value }))}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-900/5 transition-all">
                            {dealers.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    {/* Acciones */}
                    <div className="md:col-span-4">
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                            Acciones
                        </label>
                        <div className="flex gap-2">
                            <button onClick={setHoy}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black transition-all duration-150 active:scale-95">
                                <CalendarDays className="h-4 w-4" /> Hoy
                            </button>
                            <button onClick={resetFilters}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all duration-150 active:scale-95">
                                <X className="h-4 w-4" /> Limpiar
                            </button>
                        </div>
                    </div>

                    {/* Fechas */}
                    <div className="md:col-span-6">
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">Desde</label>
                        <input type="date" value={filters.rangoDesde}
                            onChange={(e) => onChangeDateFilter("rangoDesde", e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-900/5 transition-all" />
                    </div>
                    <div className="md:col-span-6">
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">Hasta</label>
                        <input type="date" value={filters.rangoHasta}
                            onChange={(e) => onChangeDateFilter("rangoHasta", e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-900/5 transition-all" />
                    </div>
                </div>
            </div>

            {/* ── VISTAS ── */}
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

            {/* ── TABLA — sin calendario, sin coches, estilo Citas ── */}
            {viewMode === "tabla" && (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead>
                                <tr style={{ background: "#111827" }} className="text-xs text-gray-300">
                                    {[
                                        { key: "fecha_hora_entrega", label: "Fecha y Hora", sort: true },
                                        { key: "agencia", label: "Dealer", sort: true },
                                        { key: null, label: "Cliente", sort: false },
                                        { key: null, label: "Chasis / VIN", sort: false },
                                        { key: null, label: "Modelo", sort: false },
                                        { key: null, label: "Asesor", sort: false },
                                        { key: null, label: "Estatus", sort: false },
                                        { key: null, label: "Preparada por", sort: false },
                                        { key: null, label: "ID SF-NADIN", sort: false },
                                        { key: null, label: "ID SF-DMS", sort: false },
                                        { key: null, label: "Comentarios", sort: false },
                                    ].map(({ key, label, sort: s }) => (
                                        <th key={label} className="px-4 py-3.5 font-semibold whitespace-nowrap first:pl-5">
                                            {s ? (
                                                <button type="button" onClick={() => toggleSort(key)}
                                                    className="inline-flex items-center gap-1 text-gray-300 hover:text-white transition-colors active:scale-95">
                                                    {label}
                                                    <span className="opacity-50">
                                                        {sort.key === key
                                                            ? sort.dir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                                                            : <ArrowUpDown className="h-3.5 w-3.5" />}
                                                    </span>
                                                </button>
                                            ) : label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loadingList
                                    ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                                    : sorted.length === 0
                                        ? (
                                            <tr>
                                                <td colSpan={11} className="px-4 py-16 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Package className="h-8 w-8 text-gray-200" />
                                                        <span className="text-sm text-gray-400">No hay resultados con esos filtros.</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                        : sorted.map((row, idx) => {
                                            const isUpdating = !!updatingInline[row.id];
                                            return (
                                                <tr key={row.id}
                                                    onDoubleClick={() => openEdit(row)}
                                                    onContextMenu={(e) => onRowContextMenu(e, row)}
                                                    className={[
                                                        "cursor-pointer transition-colors duration-100 group",
                                                        idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/40 hover:bg-gray-50",
                                                    ].join(" ")}
                                                    title="Doble clic para editar · Click derecho para eliminar">
                                                    <td className="px-4 py-3.5 pl-5 text-gray-500 whitespace-nowrap tabular-nums text-xs">
                                                        {formatDateTime(row.fecha_hora_entrega)}
                                                    </td>
                                                    <td className="px-4 py-3.5 font-semibold text-gray-800">{row.agencia || "—"}</td>
                                                    <td className="px-4 py-3.5 text-gray-700 font-medium">{row?.cliente?.nombre || "—"}</td>
                                                    <td className="px-4 py-3.5 font-mono text-xs text-gray-500 tracking-wide">{row.vin || "—"}</td>
                                                    <td className="px-4 py-3.5 text-gray-700">{row.modelo_version || "—"}</td>
                                                    <td className="px-4 py-3.5 text-gray-700">{row.asesor_ventas || "—"}</td>
                                                    <td className="px-4 py-3.5">
                                                        <StatusButton row={row} loading={isUpdating} onToggle={toggleEntregaInline} />
                                                    </td>
                                                    <td className="px-4 py-3.5 text-gray-500">{row.preparada_por || "—"}</td>
                                                    <td className="px-4 py-3.5 text-gray-500 font-mono text-xs">{row.id_cliente_sf_nadin || "—"}</td>
                                                    <td className="px-4 py-3.5 text-gray-500 font-mono text-xs">{row.id_cliente_sf_dms || "—"}</td>
                                                    <td className="px-4 py-3.5 text-gray-500 max-w-[180px]">
                                                        <span className="line-clamp-2 text-xs">{row.comentarios || "—"}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                }
                            </tbody>
                        </table>
                    </div>
                    {!loadingList && sorted.length > 0 && (
                        <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3 flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                                Mostrando <span className="font-semibold text-gray-700">{sorted.length}</span> de <span className="font-semibold text-gray-700">{entregas.length}</span> registros
                            </span>
                            <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                <span className="text-xs text-gray-400">{totalEntregadas} entregadas</span>
                                <div className="h-1.5 w-1.5 rounded-full bg-amber-400 ml-2" />
                                <span className="text-xs text-gray-400">{totalPendientes} pendientes</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <ContextMenu ctxMenu={ctxMenu}
                onDelete={async (row) => { await eliminarEntrega(row); setCtxMenu({ open: false, x: 0, y: 0, row: null }); }}
                onClose={() => setCtxMenu({ open: false, x: 0, y: 0, row: null })} />

            {/* ── MODAL ── */}
            <Modal
                open={openModal}
                title={mode === "create" ? "Nueva Entrega" : `Editar Entrega · #${draft?.id}`}
                onClose={closeModal}
                footer={
                    <>
                        <button onClick={closeModal} disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all duration-150 active:scale-95">
                            <X className="h-4 w-4" /> Cancelar
                        </button>
                        <button onClick={save} disabled={saving || loadingDetail || telInvalid || (draft?.cliente_telefono ? !telIsOk : false)}
                            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50 transition-all duration-150 active:scale-95">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? "Guardando…" : "Guardar cambios"}
                        </button>
                    </>
                }>
                {loadingDetail ? <ModalSkeleton /> : !draft ? null : (
                    <div className="grid gap-3 md:grid-cols-3">
                        <Field label="Dealer" icon={Building2}>
                            <select value={draft.agencia || ""} onChange={(e) => setDraft((p) => ({ ...p, agencia: e.target.value }))}
                                disabled={!isAdmin} className={[inputBase, inputOk, !isAdmin ? "opacity-60 cursor-not-allowed" : ""].join(" ")}>
                                <option value="" disabled>Selecciona un dealer…</option>
                                {(isAdmin ? DEALERS : userAgencia ? [userAgencia] : DEALERS).map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </Field>
                        <Field label="Nombre del cliente" icon={User}>
                            <input value={draft.cliente_nombre} onChange={(e) => setDraft((p) => ({ ...p, cliente_nombre: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")} placeholder="Nombre completo" />
                        </Field>
                        <Field label="Teléfono" icon={Phone}>
                            <input maxLength={12} value={draft.cliente_telefono}
                                onChange={(e) => setDraft((p) => ({ ...p, cliente_telefono: e.target.value.replace(/\D/g, "").slice(0, 12) }))}
                                disabled={mode === "edit"}
                                className={[inputBase, isInvalid("cliente_telefono") || telInvalid ? inputBad : inputOk, mode === "edit" ? "opacity-60 cursor-not-allowed" : ""].join(" ")} />
                            {isInvalid("cliente_telefono") && <p className="mt-1.5 text-xs text-red-600">Teléfono es requerido.</p>}
                            {!isInvalid("cliente_telefono") && telError && <p className="mt-1.5 text-xs text-red-600">{telError}</p>}
                            {!telError && /^\d{10}$/.test(telDigits) && <p className="mt-1.5 text-xs text-emerald-600">Se guardará con prefijo 52.</p>}
                        </Field>
                        <Field label="VIN / Chasis" icon={Hash}>
                            <input value={draft.vin} onChange={(e) => setDraft((p) => ({ ...p, vin: e.target.value.toUpperCase() }))}
                                className={[inputBase, inputOk, "font-mono"].join(" ")} placeholder="VIN / chasis" />
                        </Field>
                        <Field label="Modelo / Versión" icon={CarFront}>
                            <select value={draft.modelo_version || ""} onChange={(e) => setDraft((p) => ({ ...p, modelo_version: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")}>
                                <option value="" disabled>Selecciona un modelo…</option>
                                {MODELOS.map((m) => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </Field>
                        <Field label="Fecha y Hora de Entrega" icon={CalendarDays}>
                            <input type="datetime-local" value={draft.fecha_hora_entrega}
                                onChange={(e) => setDraft((p) => ({ ...p, fecha_hora_entrega: e.target.value }))}
                                className={[inputBase, isInvalid("fecha_hora_entrega") ? inputBad : inputOk].join(" ")} />
                            {isInvalid("fecha_hora_entrega") && <p className="mt-1.5 text-xs text-red-600">Fecha y hora es requerido.</p>}
                        </Field>
                        <Field label="Entrega Física" icon={UserCheck}>
                            <button type="button" onClick={() => setDraft((p) => ({ ...p, entrega_reportada: !p.entrega_reportada }))}
                                className={["inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-all duration-150 active:scale-95",
                                    draft.entrega_reportada
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                        : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"].join(" ")}>
                                {draft.entrega_reportada ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                                {draft.entrega_reportada ? "Entrega física realizada" : "Entrega física pendiente"}
                            </button>
                        </Field>
                        <Field label="Asesor Ventas" icon={UserStar}>
                            <select value={draft.asesor_ventas || ""} onChange={(e) => setDraft((p) => ({ ...p, asesor_ventas: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")}>
                                <option value="" disabled>Selecciona un asesor…</option>
                                {ASESORES.map((a) => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </Field>
                        <Field label="Preparada por" icon={ClipboardList}>
                            <input value={draft.preparada_por} onChange={(e) => setDraft((p) => ({ ...p, preparada_por: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")} placeholder="Nombre de quien preparó" />
                        </Field>
                        <Field label="ID Cliente / SF-NADIN" icon={IdCard}>
                            <input value={draft.id_cliente_sf_nadin} onChange={(e) => setDraft((p) => ({ ...p, id_cliente_sf_nadin: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")} placeholder="ID SF-NADIN" />
                        </Field>
                        <Field label="ID Cliente / SF-DMS" icon={Table2}>
                            <input value={draft.id_cliente_sf_dms} onChange={(e) => setDraft((p) => ({ ...p, id_cliente_sf_dms: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")} placeholder="ID SF-DMS" />
                        </Field>
                        <div className="md:col-span-3">
                            <Field label="Comentarios" icon={MessageSquareText}>
                                <textarea value={draft.comentarios} onChange={(e) => setDraft((p) => ({ ...p, comentarios: e.target.value }))}
                                    className={[inputBase, inputOk, "min-h-[100px] resize-none"].join(" ")} placeholder="Notas internas…" />
                            </Field>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}