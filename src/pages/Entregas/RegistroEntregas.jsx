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
} from "lucide-react";
import { apiEntregas } from "../../lib/apiEntregas";
import { createPortal } from "react-dom";
import { useAuth } from "../../auth/AuthContext";

const BRAND_BLUE = "#131E5C";
const HOURS = Array.from({ length: 13 }, (_, index) => `${String(index + 8).padStart(2, "0")}:00`);

function normalizeStr(v) {
    return String(v ?? "").trim();
}

function entregaFisicaActiva(value) {
    if (value === true || value === 1) return true;

    const v = String(value ?? "").trim().toLowerCase();
    return ["si", "sí", "true", "1", "yes", "entregada", "reportada"].includes(v);
}

function normalizePhoneForSave(value) {
    const digits = String(value || "").replace(/\D/g, "");
    if (/^\d{10}$/.test(digits)) return `52${digits}`;
    return digits;
}

function Skeleton({ className = "" }) {
    return <div className={["animate-pulse rounded-md bg-black/10", className].join(" ")} />;
}

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 11 }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 w-28 rounded bg-slate-200/60" />
                </td>
            ))}
        </tr>
    );
}

function ModalSkeleton() {
    return (
        <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-neutral-200/50 p-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-3 h-10 w-full rounded-lg" />
                </div>
            ))}
            <div className="rounded-lg border border-white/10 bg-neutral-200/50 p-4 md:col-span-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-3 h-24 w-full rounded-lg" />
            </div>
        </div>
    );
}

function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} />
            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-6xl overflow-hidden rounded-lg border border-[#131E5C] bg-neutral-100 shadow-2xl">
                    <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ backgroundColor: BRAND_BLUE }}>
                        <div className="min-w-0">
                            <div className="truncate text-base font-extrabold text-white">{title}</div>
                        </div>

                        <button
                            onClick={onClose}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white hover:bg-white/15"
                            aria-label="Cerrar"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="max-h-[72vh] overflow-auto p-5">{children}</div>

                    {footer ? (
                        <div className="flex flex-col gap-2 border-t border-white/10 bg-white/[0.03] px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
                            {footer}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>,
        document.body
    );
}

function Field({ label, icon: Icon, children }) {
    return (
        <div className="rounded-lg border border-white/10 bg-neutral-200/50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#131E5C]">
                {Icon ? <Icon className="h-4 w-4" /> : null}
                <span>{label}</span>
            </div>
            {children}
        </div>
    );
}

function toDTLocal(isoOrNull) {
    if (!isoOrNull) return "";
    const s = String(isoOrNull);

    if (s.endsWith("Z")) {
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return "";
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16);
    return "";
}

function fromDTLocalToISO(dtLocalOrEmpty) {
    const v = String(dtLocalOrEmpty || "").trim();
    return v ? v : null;
}

function toYMDLocal(dateLike) {
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseYMDLocal(ymd) {
    if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return new Date();
    const [year, month, day] = ymd.split("-").map(Number);
    return new Date(year, month - 1, day);
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
    const jsDay = d.getDay();
    const deltaToMonday = (jsDay + 6) % 7;
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - deltaToMonday);
    return d;
}

function formatWeekTitle(startDate, endDate) {
    const start = startDate.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
    });

    const end = endDate.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return `${start} — ${end}`;
}

function weekdayShortEs(dateObj) {
    const map = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
    return map[dateObj.getDay()] || "";
}

function formatCardTime(dateLike) {
    if (!dateLike) return "—";
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(dateLike) {
    if (!dateLike) return "—";
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getHourKey(dateLike) {
    if (!dateLike) return "";
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return "";
    return `${String(d.getHours()).padStart(2, "0")}:00`;
}

function FilterBlock({ label, children }) {
    return (
        <div className="rounded-lg">
            <div className="mb-2 text-xs font-extrabold tracking-wide text-[#131E5C]">{label}</div>
            {children}
        </div>
    );
}

function ContextMenu({ ctxMenu, onDelete, onClose }) {
    if (!ctxMenu.open || !ctxMenu.row) return null;

    return createPortal(
        <div className="fixed z-[9999]" style={{ left: ctxMenu.x, top: ctxMenu.y }} onClick={(e) => e.stopPropagation()}>
            <div className="w-48 overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl">
                <button
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(ctxMenu.row)}
                >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                </button>

                <button className="w-full px-4 py-2 text-left text-xs text-slate-500 hover:bg-slate-50" onClick={onClose}>
                    Cerrar
                </button>
            </div>
        </div>,
        document.body
    );
}

function StatusButton({ row, loading, onToggle, compact = false }) {
    const entregada = entregaFisicaActiva(row?.entrega_reportada);

    return (
        <button
            type="button"
            disabled={loading}
            onClick={(e) => {
                e.stopPropagation();
                onToggle?.(row);
            }}
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
            {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : entregada ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
                <Clock3 className="h-3.5 w-3.5" />
            )}
            {compact ? (entregada ? "Sí" : "No") : entregada ? "Entregada" : "Pendiente"}
        </button>
    );
}

function EntregaAgendaCard({ row, onEdit, onContext, onToggleEntrega, updatingInline, compact = false }) {
    const entregada = entregaFisicaActiva(row?.entrega_reportada);
    const isUpdating = !!updatingInline[row.id];
    const nombreCliente = row?.cliente?.nombre || "Sin nombre";
    const telefonoCliente = row?.cliente?.telefono || "—";

    return (
        <button
            type="button"
            onClick={() => onEdit(row)}
            onContextMenu={(e) => onContext(e, row)}
            className={[
                "relative w-full overflow-hidden rounded-md border text-left shadow-sm transition hover:-translate-y-[1px] hover:shadow-md",
                compact ? "p-3" : "p-2.5",
                entregada ? "border-emerald-300 bg-emerald-50/95" : "border-sky-200 bg-sky-50/95",
            ].join(" ")}
            title="Click para editar. Click derecho para eliminar."
        >
            {entregada ? (
                <span className="absolute bottom-0 left-0 top-0 flex w-3 items-center justify-center rounded-l-md bg-emerald-500">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                </span>
            ) : null}

            <div className={entregada ? "pl-3" : ""}>
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#131E5C]">
                            <CalendarDays className="h-3.5 w-3.5" />
                            <span>{formatCardTime(row.fecha_hora_entrega)}</span>
                            <span className="text-slate-400">•</span>
                            <span className="truncate">{row.agencia || "Sin dealer"}</span>
                        </div>

                        <div className="mt-1 truncate text-xs font-black uppercase tracking-wide text-[#131E5C]">
                            {nombreCliente}
                        </div>
                    </div>

                    <StatusButton row={row} loading={isUpdating} onToggle={onToggleEntrega} compact />
                </div>

                <div className="mt-2 grid gap-1 text-[10px] font-semibold text-slate-600">
                    <div className="flex items-center gap-1.5">
                        <CarFront className="h-3.5 w-3.5 shrink-0 text-[#131E5C]" />
                        <span className="truncate">{row.modelo_version || "Modelo sin capturar"}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 shrink-0 text-[#131E5C]" />
                        <span className="truncate">{row.vin || "VIN sin capturar"}</span>
                    </div>

                    {!compact ? (
                        <>
                            <div className="flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 shrink-0 text-[#131E5C]" />
                                <span className="truncate">{telefonoCliente}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <UserStar className="h-3.5 w-3.5 shrink-0 text-[#131E5C]" />
                                <span className="truncate">{row.asesor_ventas || "Asesor sin capturar"}</span>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </button>
    );
}

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
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="mt-3 h-4 w-28" />
                        <Skeleton className="mt-3 h-4 w-56" />
                        <Skeleton className="mt-4 h-8 w-24 rounded-full" />
                    </div>
                ))}
            </div>
        );
    }

    if (!rows.length) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm font-semibold text-[#131E5C] lg:hidden">
                No hay entregas en esta semana o con esos filtros.
            </div>
        );
    }

    return (
        <div className="grid gap-4 lg:hidden">
            {grouped.map(([key, items]) => {
                const title = key === "sin-fecha" ? "Sin fecha" : parseYMDLocal(key).toLocaleDateString("es-MX", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                });

                return (
                    <section key={key} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                        <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-[#131E5C]">{title}</h3>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {items.map((row) => (
                                <EntregaAgendaCard
                                    key={row.id}
                                    row={row}
                                    onEdit={onEdit}
                                    onContext={onContext}
                                    onToggleEntrega={onToggleEntrega}
                                    updatingInline={updatingInline}
                                    compact
                                />
                            ))}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}

function AgendaWeekView({
    rows,
    loading,
    currentWeekDate,
    setCurrentWeekDate,
    onCreateAt,
    onEdit,
    onContext,
    onToggleEntrega,
    updatingInline,
}) {
    const weekStart = useMemo(() => startOfWeekMonday(currentWeekDate), [currentWeekDate]);
    const weekDays = useMemo(() => Array.from({ length: 6 }, (_, index) => addDays(weekStart, index)), [weekStart]);
    const weekEnd = weekDays[weekDays.length - 1];
    const todayIso = toYMDLocal(new Date());

    const rowsBySlot = useMemo(() => {
        const map = new Map();

        for (const row of rows) {
            if (!row.fecha_hora_entrega) continue;

            const dayKey = toYMDLocal(row.fecha_hora_entrega);
            const hourKey = getHourKey(row.fecha_hora_entrega);
            const key = `${dayKey}|${hourKey}`;

            if (!map.has(key)) map.set(key, []);
            map.get(key).push(row);
        }

        for (const list of map.values()) {
            list.sort((a, b) => new Date(a.fecha_hora_entrega).getTime() - new Date(b.fecha_hora_entrega).getTime());
        }

        return map;
    }, [rows]);

    const outOfScheduleRows = useMemo(() => {
        return rows.filter((row) => {
            if (!row.fecha_hora_entrega) return true;
            const hour = getHourKey(row.fecha_hora_entrega);
            return !HOURS.includes(hour);
        });
    }, [rows]);

    const gridStyle = useMemo(() => ({ gridTemplateColumns: "58px repeat(6, minmax(210px, 1fr))" }), []);

    const goPrevWeek = () => setCurrentWeekDate((prev) => addDays(prev, -7));
    const goNextWeek = () => setCurrentWeekDate((prev) => addDays(prev, 7));
    const goToday = () => setCurrentWeekDate(new Date());

    return (
        <div className="hidden lg:block">
            <div className="mb-3 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-500">Semana</div>
                    <div className="truncate text-sm font-black text-[#131E5C]">
                        {formatWeekTitle(weekStart, weekEnd)}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={goPrevWeek}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#131E5C] hover:bg-slate-50"
                        aria-label="Semana anterior"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    <button
                        type="button"
                        onClick={goToday}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-xs font-black text-[#131E5C] hover:bg-[#131E5C] hover:text-white"
                    >
                        Hoy
                    </button>

                    <button
                        type="button"
                        onClick={goNextWeek}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#131E5C] hover:bg-slate-50"
                        aria-label="Semana siguiente"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-auto">
                    <div className="min-w-[1320px]">
                        <div className="sticky top-0 z-20 grid border-b border-slate-200 bg-slate-50" style={gridStyle}>
                            <div className="px-3 py-3 text-xs font-bold text-slate-500">Hora</div>
                            {weekDays.map((day) => {
                                const iso = toYMDLocal(day);
                                const isToday = iso === todayIso;

                                return (
                                    <div key={iso} className="border-l border-slate-200 px-3 py-3 text-center">
                                        <div className={[
                                            "mx-auto inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black",
                                            isToday ? "bg-[#131E5C] text-white" : "text-[#131E5C]",
                                        ].join(" ")}
                                        >
                                            <span>{weekdayShortEs(day)}</span>
                                            <span>{day.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" })}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {loading ? (
                            <div className="grid" style={gridStyle}>
                                {Array.from({ length: 42 }).map((_, i) => (
                                    <div key={i} className="min-h-[116px] border-b border-l border-slate-100 p-2">
                                        <Skeleton className="h-16 w-full rounded-lg" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            HOURS.map((hour) => (
                                <div key={hour} className="grid border-b border-dashed border-slate-300" style={gridStyle}>
                                    <div className="bg-slate-50 px-3 py-3 text-xs font-bold text-slate-500">{hour}</div>

                                    {weekDays.map((day) => {
                                        const dayKey = toYMDLocal(day);
                                        const slotKey = `${dayKey}|${hour}`;
                                        const items = rowsBySlot.get(slotKey) || [];
                                        const canCreateAt = `${dayKey}T${hour}`;

                                        return (
                                            <div key={slotKey} className="group relative min-h-[116px] border-l border-slate-200 bg-white/80 p-1.5 transition hover:bg-slate-50">
                                                <button
                                                    type="button"
                                                    onClick={() => onCreateAt(canCreateAt)}
                                                    className="absolute right-2 top-2 z-[4] inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 opacity-0 shadow-sm transition hover:bg-slate-100 group-hover:opacity-100"
                                                    aria-label="Crear entrega en este horario"
                                                    title="Crear entrega en este horario"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>

                                                <div className="grid gap-1.5 pr-1">
                                                    {items.map((row) => (
                                                        <EntregaAgendaCard
                                                            key={row.id}
                                                            row={row}
                                                            onEdit={onEdit}
                                                            onContext={onContext}
                                                            onToggleEntrega={onToggleEntrega}
                                                            updatingInline={updatingInline}
                                                        />
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

            {!loading && outOfScheduleRows.length ? (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <div className="mb-2 text-xs font-black uppercase tracking-wide text-amber-800">
                        Entregas sin hora o fuera del rango 08:00 - 20:00
                    </div>
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                        {outOfScheduleRows.map((row) => (
                            <EntregaAgendaCard
                                key={row.id}
                                row={row}
                                onEdit={onEdit}
                                onContext={onContext}
                                onToggleEntrega={onToggleEntrega}
                                updatingInline={updatingInline}
                                compact
                            />
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export default function RegistroEntregas() {
    const { user } = useAuth();

    const isAdmin = useMemo(() => {
        const permisos = user?.permisos || [];
        const rol = String(user?.rol || "").trim().toLowerCase();
        return rol === "administrador" || permisos.includes("CRM_DIGITALES") || permisos.includes("ALL") || permisos.includes("USUARIOS_ADMIN");
    }, [user]);

    const userAgencia = String(user?.agencia || "").trim();

    const [entregas, setEntregas] = useState([]);

    const DEALERS = useMemo(
        () => ["Volvo",],
        []
    );

    const ASESORES = [
        "Enrique Vazquez Islas",
        "Ricardo Platas",
        "Verónica Del Rayo Galindo León",
        "Julio Camacho Barragán",
        "Fernanda Romero Aguilar",
    ];

    const MODELOS = [
        "EX30",
        "EX40",
        "EC40",
        "EX90",
        "XC60",
        "XC90",
        "XC60 Black Edition",
        "XC90 Black Edition",
        "Seminuevos",
        "Avaluo"
    ];

    const [ctxMenu, setCtxMenu] = useState({ open: false, x: 0, y: 0, row: null });
    const [viewMode, setViewMode] = useState("agenda");
    const [currentWeekDate, setCurrentWeekDate] = useState(new Date());
    const [sort, setSort] = useState({ key: "fecha_hora_entrega", dir: "desc" });

    function toggleSort(key) {
        setSort((prev) => {
            if (prev.key !== key) return { key, dir: "asc" };
            return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
        });
    }

    const [filters, setFilters] = useState({
        q: "",
        agencia: "Todos",
        rangoDesde: "",
        rangoHasta: "",
    });

    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState("create");
    const [draft, setDraft] = useState(null);

    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);
    const [updatingInline, setUpdatingInline] = useState({});

    const REQUIRED = useMemo(
        () => ({
            cliente_telefono: "Teléfono",
            fecha_hora_entrega: "Fecha y hora de entrega",
        }),
        []
    );

    const [touchedSave, setTouchedSave] = useState(false);

    const missing = useMemo(() => {
        if (!draft) return [];
        const faltantes = [];

        for (const key of Object.keys(REQUIRED)) {
            const v = draft[key];
            const isEmpty = v === null || v === undefined || (typeof v === "string" && v.trim() === "");
            if (isEmpty) faltantes.push(key);
        }

        return faltantes;
    }, [draft, REQUIRED]);

    const isInvalid = (key) => touchedSave && missing.includes(key);

    const telDigits = useMemo(() => String(draft?.cliente_telefono || "").replace(/\D/g, ""), [draft?.cliente_telefono]);
    const telIsOk = useMemo(() => /^(?:\d{10}|52\d{10})$/.test(telDigits), [telDigits]);

    const telError = useMemo(() => {
        if (!openModal || !draft) return "";
        if (!telDigits) return "";

        if (/^\d{10}$/.test(telDigits)) return "";
        if (/^52\d{10}$/.test(telDigits)) return "";

        if (telDigits.length < 10) return "Número incompleto (mínimo 10 dígitos)";
        if (telDigits.length === 11) return "Número incorrecto (11 dígitos no válido)";
        if (telDigits.length === 12 && !telDigits.startsWith("52")) {
            return "Número inválido: si tiene 12 dígitos debe iniciar con 52";
        }
        if (telDigits.length > 12) return "Número incorrecto (máximo 12 dígitos)";
        return "Número inválido";
    }, [openModal, draft, telDigits]);

    const telInvalid = !!telError;
    const inputBase = "w-full rounded-lg border shadow-lg px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none";
    const inputOk = "border-black/10 bg-neutral-100";
    const inputBad = "border-red-500 bg-red-50";

    useEffect(() => {
        const onGlobal = () => setCtxMenu((prev) => ({ ...prev, open: false, row: null }));
        window.addEventListener("click", onGlobal);
        window.addEventListener("scroll", onGlobal, true);
        window.addEventListener("resize", onGlobal);

        return () => {
            window.removeEventListener("click", onGlobal);
            window.removeEventListener("scroll", onGlobal, true);
            window.removeEventListener("resize", onGlobal);
        };
    }, []);

    const onRowContextMenu = (e, row) => {
        e.preventDefault();
        e.stopPropagation();
        setCtxMenu({ open: true, x: e.clientX, y: e.clientY, row });
    };

    const refreshList = async () => {
        setLoadingList(true);
        try {
            const data = await apiEntregas.list();
            setEntregas(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setEntregas([]);
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        refreshList();
    }, []);

    const dealers = useMemo(() => {
        const set = new Set((entregas || []).map((item) => normalizeStr(item.agencia)).filter(Boolean));
        const all = ["Todos", ...Array.from(set)];
        if (!isAdmin && userAgencia) return ["Todos", userAgencia];
        return all;
    }, [entregas, isAdmin, userAgencia]);

    const filtered = useMemo(() => {
        const q = filters.q.trim().toLowerCase();

        const desdeInt = ymdToInt(filters.rangoDesde);
        const hastaInt = ymdToInt(filters.rangoHasta);
        const minInt = desdeInt ?? null;
        const maxInt = hastaInt ?? null;

        return (entregas || []).filter((item) => {
            if (!isAdmin && userAgencia && normalizeStr(item.agencia) !== normalizeStr(userAgencia)) return false;

            const nombreCliente = normalizeStr(item?.cliente?.nombre);
            const telCliente = normalizeStr(item?.cliente?.telefono);

            const matchQ =
                !q ||
                normalizeStr(item.agencia).toLowerCase().includes(q) ||
                nombreCliente.toLowerCase().includes(q) ||
                telCliente.toLowerCase().includes(q) ||
                normalizeStr(item.vin).toLowerCase().includes(q) ||
                normalizeStr(item.modelo_version).toLowerCase().includes(q) ||
                normalizeStr(item.asesor_ventas).toLowerCase().includes(q) ||
                normalizeStr(item.preparada_por).toLowerCase().includes(q) ||
                normalizeStr(item.id_cliente_sf_nadin).toLowerCase().includes(q) ||
                normalizeStr(item.id_cliente_sf_dms).toLowerCase().includes(q) ||
                normalizeStr(item.comentarios).toLowerCase().includes(q);

            const matchAgencia =
                filters.agencia === "Todos" || normalizeStr(item.agencia) === normalizeStr(filters.agencia);

            let matchRango = true;
            if (minInt !== null || maxInt !== null) {
                const ymdEntrega = item.fecha_hora_entrega ? toYMDLocal(item.fecha_hora_entrega) : "";
                const ymdInt = ymdToInt(ymdEntrega);
                if (!ymdInt) return false;
                if (minInt !== null && ymdInt < minInt) matchRango = false;
                if (maxInt !== null && ymdInt > maxInt) matchRango = false;
            }

            return matchQ && matchAgencia && matchRango;
        });
    }, [entregas, filters, isAdmin, userAgencia]);

    const sorted = useMemo(() => {
        const data = [...filtered];
        const { key, dir } = sort || {};
        if (!key) return data;

        const mult = dir === "asc" ? 1 : -1;

        return data.sort((a, b) => {
            if (key === "fecha_hora_entrega") {
                const ta = a.fecha_hora_entrega ? new Date(a.fecha_hora_entrega).getTime() : 0;
                const tb = b.fecha_hora_entrega ? new Date(b.fecha_hora_entrega).getTime() : 0;
                return (ta - tb) * mult;
            }

            const va = normalizeStr(a?.[key]).toLowerCase();
            const vb = normalizeStr(b?.[key]).toLowerCase();

            if (va < vb) return -1 * mult;
            if (va > vb) return 1 * mult;
            return 0;
        });
    }, [filtered, sort]);

    const agendaRows = useMemo(() => {
        const weekStart = startOfWeekMonday(currentWeekDate);
        const weekEnd = addDays(weekStart, 5);
        const minInt = ymdToInt(toYMDLocal(weekStart));
        const maxInt = ymdToInt(toYMDLocal(weekEnd));

        return [...filtered]
            .filter((row) => {
                if (!row.fecha_hora_entrega) return true;
                const ymd = toYMDLocal(row.fecha_hora_entrega);
                const ymdInt = ymdToInt(ymd);
                if (!ymdInt) return false;
                return ymdInt >= minInt && ymdInt <= maxInt;
            })
            .sort((a, b) => {
                const ta = a.fecha_hora_entrega ? new Date(a.fecha_hora_entrega).getTime() : 0;
                const tb = b.fecha_hora_entrega ? new Date(b.fecha_hora_entrega).getTime() : 0;
                return ta - tb;
            });
    }, [filtered, currentWeekDate]);

    const stats = useMemo(() => {
        const entregadas = filtered.filter((row) => entregaFisicaActiva(row.entrega_reportada)).length;
        const pendientes = filtered.length - entregadas;

        return { total: filtered.length, entregadas, pendientes };
    }, [filtered]);

    const openCreate = (fechaHoraDefault = "") => {
        setTouchedSave(false);
        setMode("create");

        const agenciaDefault = isAdmin ? "" : userAgencia;

        setDraft({
            id: null,
            cliente_id: null,

            agencia: agenciaDefault,
            cliente_nombre: "",
            cliente_telefono: "",

            vin: "",
            modelo_version: "",
            fecha_hora_entrega: fechaHoraDefault,
            entrega_reportada: false,
            asesor_ventas: "",
            preparada_por: "",
            id_cliente_sf_nadin: "",
            id_cliente_sf_dms: "",
            comentarios: "",
        });

        setOpenModal(true);
    };

    const openEdit = async (row) => {
        if (!row?.id) return;

        try {
            setTouchedSave(false);
            setMode("edit");
            setLoadingDetail(true);
            setOpenModal(true);

            const item = await apiEntregas.get(row.id);

            if (!isAdmin && userAgencia && normalizeStr(item.agencia) !== normalizeStr(userAgencia)) {
                alert("No tienes permisos para ver registros de otra agencia.");
                setOpenModal(false);
                return;
            }

            setDraft({
                id: item.id,
                cliente_id: item?.cliente?.id_cliente ?? null,

                agencia: item.agencia || (isAdmin ? "" : userAgencia),
                cliente_nombre: item?.cliente?.nombre || "",
                cliente_telefono: item?.cliente?.telefono || "",

                vin: item.vin || "",
                modelo_version: item.modelo_version || "",
                fecha_hora_entrega: toDTLocal(item.fecha_hora_entrega),
                entrega_reportada: entregaFisicaActiva(item.entrega_reportada),
                asesor_ventas: item.asesor_ventas || "",
                preparada_por: item.preparada_por || "",
                id_cliente_sf_nadin: item.id_cliente_sf_nadin || "",
                id_cliente_sf_dms: item.id_cliente_sf_dms || "",
                comentarios: item.comentarios || "",
            });
        } catch (error) {
            console.error(error);
            alert("No se pudo abrir la entrega (revisa consola).");
            setOpenModal(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const closeModal = () => {
        if (saving) return;
        setOpenModal(false);
        setDraft(null);
    };

    const eliminarEntrega = async (row) => {
        if (!row?.id) return;

        if (!isAdmin && userAgencia && normalizeStr(row.agencia) !== normalizeStr(userAgencia)) {
            alert("No tienes permisos para eliminar registros de otra agencia.");
            return;
        }

        const ok = confirm(`¿Eliminar la entrega de ${row?.cliente?.nombre || row?.cliente?.telefono || "cliente"}?`);
        if (!ok) return;

        try {
            await apiEntregas.remove(row.id);
            setEntregas((prev) => prev.filter((item) => item.id !== row.id));
            setCtxMenu({ open: false, x: 0, y: 0, row: null });
        } catch (error) {
            console.error(error);
            alert("No se pudo eliminar (revisa consola / backend).");
        }
    };

    const save = async () => {
        if (!draft || saving) return;

        setTouchedSave(true);
        if (missing.length) return;
        if (!telIsOk) return;

        setSaving(true);
        try {
            const agenciaFinal = isAdmin ? normalizeStr(draft.agencia || "") : userAgencia;

            const payload = {
                agencia: agenciaFinal,

                ...(draft.cliente_id ? { cliente_id: draft.cliente_id } : {}),

                nombre: draft.cliente_nombre || "",
                telefono: normalizePhoneForSave(draft.cliente_telefono),

                vin: draft.vin || "",
                modelo_version: draft.modelo_version || "",
                fecha_hora_entrega: fromDTLocalToISO(draft.fecha_hora_entrega),
                entrega_reportada: !!draft.entrega_reportada,
                asesor_ventas: draft.asesor_ventas || "",
                preparada_por: draft.preparada_por || "",
                id_cliente_sf_nadin: draft.id_cliente_sf_nadin || "",
                id_cliente_sf_dms: draft.id_cliente_sf_dms || "",
                comentarios: draft.comentarios || "",
            };

            if (mode === "create") {
                await apiEntregas.create(payload);
            } else {
                await apiEntregas.update(draft.id, payload);
            }

            await refreshList();
            closeModal();
        } catch (error) {
            console.error(error);
            alert("Error guardando la entrega (revisa consola).");
        } finally {
            setSaving(false);
        }
    };

    const toggleEntregaReportadaInline = async (row) => {
        const id = row?.id;
        if (!id) return;

        if (!isAdmin && userAgencia && normalizeStr(row.agencia) !== normalizeStr(userAgencia)) {
            alert("No tienes permisos para modificar registros de otra agencia.");
            return;
        }

        const prev = entregaFisicaActiva(row.entrega_reportada);
        const next = !prev;

        setEntregas((prevRows) =>
            prevRows.map((item) =>
                item.id === id ? { ...item, entrega_reportada: next } : item
            )
        );

        setUpdatingInline((prevState) => ({ ...prevState, [id]: true }));

        try {
            await apiEntregas.patch(id, { entrega_reportada: next });
        } catch (error) {
            console.error(error);
            setEntregas((prevRows) =>
                prevRows.map((item) =>
                    item.id === id ? { ...item, entrega_reportada: prev } : item
                )
            );
            alert("No se pudo actualizar la entrega reportada (revisa backend).");
        } finally {
            setUpdatingInline((prevState) => {
                const nextState = { ...prevState };
                delete nextState[id];
                return nextState;
            });
        }
    };

    const resetFilters = () => {
        setFilters({ q: "", agencia: "Todos", rangoDesde: "", rangoHasta: "" });
        setCurrentWeekDate(new Date());
    };

    const setHoy = () => {
        const hoy = toYMDLocal(new Date());
        setCurrentWeekDate(new Date());
        setFilters((prev) => ({ ...prev, rangoDesde: hoy, rangoHasta: hoy }));
    };

    const onChangeDateFilter = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        if (value) setCurrentWeekDate(parseYMDLocal(value));
    };

    return (
        <div className="w-full">
            <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-vw-header truncate text-lg font-extrabold text-[#131E5C]">Entregas</h2>
                    </div>

                    {!isAdmin && userAgencia ? (
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Agencia asignada: <span className="text-[#131E5C]">{userAgencia}</span>
                        </p>
                    ) : null}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <div className="inline-flex overflow-hidden rounded-lg border border-[#131E5C] bg-white p-1">
                        <button
                            type="button"
                            onClick={() => setViewMode("agenda")}
                            className={[
                                "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-black transition",
                                viewMode === "agenda" ? "bg-[#131E5C] text-white" : "text-[#131E5C] hover:bg-slate-50",
                            ].join(" ")}
                        >
                            <CalendarDays className="h-4 w-4" />
                            Agenda
                        </button>

                        <button
                            type="button"
                            onClick={() => setViewMode("tabla")}
                            className={[
                                "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-black transition",
                                viewMode === "tabla" ? "bg-[#131E5C] text-white" : "text-[#131E5C] hover:bg-slate-50",
                            ].join(" ")}
                        >
                            <TableProperties className="h-4 w-4" />
                            Tabla
                        </button>
                    </div>

                    <button
                        onClick={() => openCreate()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm text-white shadow-sm hover:bg-[#131E5C]/80"
                    >
                        <Plus className="h-4 w-4" />
                        Nueva Entrega
                    </button>
                </div>
            </div>

            <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="grid gap-3 md:grid-cols-12">
                    <div className="md:col-span-6">
                        <FilterBlock label="Búsqueda">
                            <div className="flex items-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2">
                                <Search className="h-4 w-4 text-[#131E5C]" />
                                <input
                                    value={filters.q}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
                                    placeholder="Buscar por dealer, cliente, teléfono, VIN, modelo, asesor…"
                                    className="w-full text-sm text-[#131E5C] outline-none placeholder:text-[#131E5C]"
                                />
                                {filters.q ? (
                                    <button
                                        onClick={() => setFilters((prev) => ({ ...prev, q: "" }))}
                                        className="rounded-lg bg-white p-1 text-[#131E5C] hover:bg-white/80 hover:text-red-500"
                                        aria-label="Limpiar búsqueda"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                ) : null}
                            </div>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-3">
                        <FilterBlock label="Dealer">
                            <select
                                value={filters.agencia}
                                onChange={(e) => setFilters((prev) => ({ ...prev, agencia: e.target.value }))}
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            >
                                {dealers.map((dealer) => (
                                    <option key={dealer} value={dealer} className="bg-neutral-100 text-[#131E5C]">
                                        {dealer}
                                    </option>
                                ))}
                            </select>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-3">
                        <FilterBlock label="Acciones">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={setHoy}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                                    title="Mostrar solo registros del día de hoy"
                                >
                                    <CalendarDays className="h-4 w-4" />
                                    Hoy
                                </button>

                                <button
                                    onClick={resetFilters}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] hover:bg-[#131E5C] hover:text-white"
                                >
                                    <X className="h-4 w-4" />
                                    Limpiar
                                </button>
                            </div>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-6">
                        <FilterBlock label="Desde">
                            <input
                                type="date"
                                value={filters.rangoDesde}
                                onChange={(e) => onChangeDateFilter("rangoDesde", e.target.value)}
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            />
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-6">
                        <FilterBlock label="Hasta">
                            <input
                                type="date"
                                value={filters.rangoHasta}
                                onChange={(e) => onChangeDateFilter("rangoHasta", e.target.value)}
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            />
                        </FilterBlock>
                    </div>
                </div>
            </div>

            {viewMode === "agenda" ? (
                <>
                    <AgendaMobileList
                        rows={agendaRows}
                        loading={loadingList}
                        onEdit={openEdit}
                        onContext={onRowContextMenu}
                        onToggleEntrega={toggleEntregaReportadaInline}
                        updatingInline={updatingInline}
                    />

                    <AgendaWeekView
                        rows={agendaRows}
                        loading={loadingList}
                        currentWeekDate={currentWeekDate}
                        setCurrentWeekDate={setCurrentWeekDate}
                        onCreateAt={openCreate}
                        onEdit={openEdit}
                        onContext={onRowContextMenu}
                        onToggleEntrega={toggleEntregaReportadaInline}
                        updatingInline={updatingInline}
                    />
                </>
            ) : null}

            {viewMode === "tabla" ? (
                <div className="overflow-hidden rounded-lg bg-white/[0.03] shadow-lg">
                    <div className="overflow-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="font-vw-header border border-black bg-[#131E5C] text-xs text-white">
                                <tr>
                                    <th className="px-4 py-3">
                                        <button
                                            type="button"
                                            onClick={() => toggleSort("fecha_hora_entrega")}
                                            className="inline-flex items-center gap-1 text-xs font-bold"
                                        >
                                            Fecha y Hora Entrega
                                            <span className="opacity-60">
                                                {sort.key === "fecha_hora_entrega" ? (
                                                    sort.dir === "asc" ? <ChevronUp className="h-4" /> : <ChevronDown className="h-4" />
                                                ) : (
                                                    <ArrowUpDown className="h-4" />
                                                )}
                                            </span>
                                        </button>
                                    </th>

                                    <th className="px-4 py-3">
                                        <button
                                            type="button"
                                            onClick={() => toggleSort("agencia")}
                                            className="inline-flex items-center gap-1 text-xs font-bold"
                                        >
                                            Dealer
                                            <span className="opacity-60">
                                                {sort.key === "agencia" ? (
                                                    sort.dir === "asc" ? <ChevronUp className="h-4" /> : <ChevronDown className="h-4" />
                                                ) : (
                                                    <ArrowUpDown className="h-4" />
                                                )}
                                            </span>
                                        </button>
                                    </th>

                                    <th className="px-4 py-3">Cliente</th>
                                    <th className="px-4 py-3">Chasis</th>
                                    <th className="px-4 py-3">Modelo/Versión</th>
                                    <th className="px-4 py-3">Asesor Ventas</th>
                                    <th className="px-4 py-3">Entrega Física</th>
                                    <th className="px-4 py-3">Preparada por</th>
                                    <th className="px-4 py-3">ID Cliente / SF-NADIN</th>
                                    <th className="px-4 py-3">ID Cliente / SF-DMS</th>
                                    <th className="px-4 py-3">Comentarios</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-black/30">
                                {loadingList ? (
                                    <>
                                        {Array.from({ length: 8 }).map((_, i) => (
                                            <SkeletonRow key={i} />
                                        ))}
                                    </>
                                ) : (
                                    <>
                                        {sorted.map((row) => {
                                            const nombreCliente = row?.cliente?.nombre || "—";
                                            const isUpdating = !!updatingInline[row.id];

                                            return (
                                                <tr
                                                    key={row.id}
                                                    onDoubleClick={() => openEdit(row)}
                                                    onContextMenu={(e) => onRowContextMenu(e, row)}
                                                    className="cursor-pointer hover:bg-white/[0.04]"
                                                    title="Doble clic para editar"
                                                >
                                                    <td className="px-4 py-3 text-[#131E5C]">
                                                        {formatDateTime(row.fecha_hora_entrega)}
                                                    </td>

                                                    <td className="px-4 py-3 font-semibold text-[#131E5C]">{row.agencia || "—"}</td>
                                                    <td className="px-4 py-3 text-[#131E5C]">{nombreCliente}</td>
                                                    <td className="px-4 py-3 text-[#131E5C]">{row.vin || "—"}</td>
                                                    <td className="px-4 py-3 text-[#131E5C]">{row.modelo_version || "—"}</td>
                                                    <td className="px-4 py-3 text-[#131E5C]">{row.asesor_ventas || "—"}</td>

                                                    <td className="px-4 py-3 text-[#131E5C]">
                                                        <StatusButton
                                                            row={row}
                                                            loading={isUpdating}
                                                            onToggle={toggleEntregaReportadaInline}
                                                        />
                                                    </td>

                                                    <td className="px-4 py-3 text-[#131E5C]">{row.preparada_por || "—"}</td>
                                                    <td className="px-4 py-3 text-[#131E5C]">{row.id_cliente_sf_nadin || "—"}</td>
                                                    <td className="px-4 py-3 text-[#131E5C]">{row.id_cliente_sf_dms || "—"}</td>
                                                    <td className="px-4 py-3 text-[#131E5C]">
                                                        <span className="line-clamp-2">{row.comentarios || "—"}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {sorted.length === 0 ? (
                                            <tr>
                                                <td colSpan={11} className="px-4 py-10 text-center text-[#131E5C]">
                                                    No hay resultados con esos filtros.
                                                </td>
                                            </tr>
                                        ) : null}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}

            <ContextMenu
                ctxMenu={ctxMenu}
                onDelete={async (row) => {
                    await eliminarEntrega(row);
                    setCtxMenu({ open: false, x: 0, y: 0, row: null });
                }}
                onClose={() => setCtxMenu({ open: false, x: 0, y: 0, row: null })}
            />

            <Modal
                open={openModal}
                title={mode === "create" ? "Nueva Entrega" : `Editar Entrega • ${draft?.id}`}
                onClose={closeModal}
                footer={
                    <>
                        <button
                            onClick={closeModal}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-red-400 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-red-600 hover:text-white disabled:opacity-60"
                        >
                            <X className="h-4 w-4" />
                            Cancelar
                        </button>

                        <button
                            onClick={save}
                            disabled={saving || loadingDetail || telInvalid || (draft?.cliente_telefono ? !telIsOk : false)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C]/85 px-4 py-2 text-sm font-bold text-white/90 hover:bg-[#131E5C] hover:text-white disabled:opacity-60"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </>
                }
            >
                {loadingDetail ? (
                    <ModalSkeleton />
                ) : !draft ? null : (
                    <div className="grid gap-3 md:grid-cols-3">
                        <Field label="Dealer" icon={Building2}>
                            <select
                                value={draft.agencia || ""}
                                onChange={(e) => setDraft((prev) => ({ ...prev, agencia: e.target.value }))}
                                disabled={!isAdmin}
                                className={[inputBase, inputOk, !isAdmin ? "cursor-not-allowed opacity-75" : ""].join(" ")}
                            >
                                <option value="" disabled>
                                    Selecciona un dealer...
                                </option>
                                {(isAdmin ? DEALERS : userAgencia ? [userAgencia] : DEALERS).map((dealer) => (
                                    <option key={dealer} value={dealer}>
                                        {dealer}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Nombre del cliente" icon={User}>
                            <input
                                value={draft.cliente_nombre}
                                onChange={(e) => setDraft((prev) => ({ ...prev, cliente_nombre: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")}
                                placeholder="Nombre completo"
                            />
                        </Field>

                        <Field label="Teléfono" icon={Phone}>
                            <input
                                maxLength={12}
                                value={draft.cliente_telefono}
                                onChange={(e) =>
                                    setDraft((prev) => ({
                                        ...prev,
                                        cliente_telefono: e.target.value.replace(/\D/g, "").slice(0, 12),
                                    }))
                                }
                                disabled={mode === "edit"}
                                className={[
                                    inputBase,
                                    isInvalid("cliente_telefono") || telInvalid ? inputBad : inputOk,
                                    mode === "edit" ? "cursor-not-allowed opacity-75" : "",
                                ].join(" ")}
                            />

                            {isInvalid("cliente_telefono") ? (
                                <div className="mt-2 text-xs font-bold text-red-600">Teléfono es requerido.</div>
                            ) : null}

                            {!isInvalid("cliente_telefono") && telError ? (
                                <div className="mt-2 text-xs font-bold text-red-600">{telError}</div>
                            ) : null}

                            {!telError && /^\d{10}$/.test(telDigits) ? (
                                <div className="mt-2 text-xs font-bold text-emerald-700">
                                    Se guardará automáticamente con prefijo 52.
                                </div>
                            ) : null}
                        </Field>

                        <Field label="VIN / Chasis" icon={Hash}>
                            <input
                                value={draft.vin}
                                onChange={(e) => setDraft((prev) => ({ ...prev, vin: e.target.value.toUpperCase() }))}
                                className={[inputBase, inputOk].join(" ")}
                                placeholder="VIN / chasis"
                            />
                        </Field>

                        <Field label="Modelo / Versión" icon={CarFront}>
                            <select
                                value={draft.modelo_version || ""}
                                onChange={(e) => setDraft((prev) => ({ ...prev, modelo_version: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")}
                            >
                                <option value="" disabled>
                                    Selecciona un modelo...
                                </option>
                                {MODELOS.map((modelo) => (
                                    <option key={modelo} value={modelo}>
                                        {modelo}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Fecha y Hora de Entrega" icon={CalendarDays}>
                            <input
                                type="datetime-local"
                                value={draft.fecha_hora_entrega}
                                onChange={(e) => setDraft((prev) => ({ ...prev, fecha_hora_entrega: e.target.value }))}
                                className={[inputBase, isInvalid("fecha_hora_entrega") ? inputBad : inputOk].join(" ")}
                            />
                            {isInvalid("fecha_hora_entrega") ? (
                                <div className="mt-2 text-xs font-bold text-red-600">Fecha y hora de entrega es requerido.</div>
                            ) : null}
                        </Field>

                        <Field label="Entrega Física" icon={UserCheck}>
                            <button
                                type="button"
                                onClick={() => setDraft((prev) => ({ ...prev, entrega_reportada: !prev.entrega_reportada }))}
                                className={[
                                    "inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-black transition",
                                    draft.entrega_reportada
                                        ? "border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                        : "border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200",
                                ].join(" ")}
                            >
                                {draft.entrega_reportada ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                                {draft.entrega_reportada ? "Entrega física realizada" : "Entrega física pendiente"}
                            </button>
                        </Field>

                        <Field label="Asesor Ventas" icon={UserStar}>
                            <select
                                value={draft.asesor_ventas || ""}
                                onChange={(e) => setDraft((prev) => ({ ...prev, asesor_ventas: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")}
                            >
                                <option value="" disabled>
                                    Selecciona un asesor...
                                </option>
                                {ASESORES.map((asesor) => (
                                    <option key={asesor} value={asesor}>
                                        {asesor}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Preparada por" icon={ClipboardList}>
                            <input
                                value={draft.preparada_por}
                                onChange={(e) => setDraft((prev) => ({ ...prev, preparada_por: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")}
                                placeholder="Nombre de quien preparó la entrega"
                            />
                        </Field>

                        <Field label="ID Cliente / SF-NADIN" icon={IdCard}>
                            <input
                                value={draft.id_cliente_sf_nadin}
                                onChange={(e) => setDraft((prev) => ({ ...prev, id_cliente_sf_nadin: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")}
                                placeholder="ID SF-NADIN"
                            />
                        </Field>

                        <Field label="ID Cliente / SF-DMS" icon={Table2}>
                            <input
                                value={draft.id_cliente_sf_dms}
                                onChange={(e) => setDraft((prev) => ({ ...prev, id_cliente_sf_dms: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")}
                                placeholder="ID SF-DMS"
                            />
                        </Field>

                        <div className="md:col-span-3">
                            <Field label="Comentarios" icon={MessageSquareText}>
                                <textarea
                                    value={draft.comentarios}
                                    onChange={(e) => setDraft((prev) => ({ ...prev, comentarios: e.target.value }))}
                                    className={[inputBase, inputOk, "min-h-[110px]"].join(" ")}
                                    placeholder="Notas internas..."
                                />
                            </Field>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
