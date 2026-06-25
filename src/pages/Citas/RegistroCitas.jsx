// src/pages/Citas/RegistroCitas.jsx
import { useMemo, useState, useEffect, useCallback } from "react";
import {
    Plus, Search, X, Save, User, CarFront, CalendarDays,
    ArrowUpDown, ChevronDown, ChevronUp, Trash2, Loader2,
    Phone, LayoutList, UserCheck, UserSearch, UserMinus,
    UserStar, MessageSquareText, Building2, ChevronLeft,
    ChevronRight, CheckCircle2, XCircle, Circle, AlertCircle,
    TableProperties,
} from "lucide-react";
import { apiCitas } from "../../lib/apiCitas";
import { createPortal } from "react-dom";
import { useAuth } from "../../auth/AuthContext";
import CitasTopNav from "./CitasTopNav";

// ─── helpers ────────────────────────────────────────────────────────────────
function normalizeStr(v) { return String(v ?? "").trim(); }

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

function fromDTLocalToISO(v) { return String(v || "").trim() || null; }

function toYMDLocal(dateLike) {
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function ymdToInt(ymd) {
    if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
    return Number(ymd.replaceAll("-", ""));
}

// ─── agenda helpers ──────────────────────────────────────────────────────────
const PAD = (n) => String(n).padStart(2, "0");

function parseLocalDT(raw) {
    if (!raw) return null;
    const s = String(raw);
    if (s.endsWith("Z")) return new Date(s);
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
}

function localHHMM(date) { return `${PAD(date.getHours())}:${PAD(date.getMinutes())}`; }
function localYMD(date) {
    return `${date.getFullYear()}-${PAD(date.getMonth() + 1)}-${PAD(date.getDate())}`;
}
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function startOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

const DIAS_CORTOS  = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DIAS_LARGOS  = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const MESES        = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const HOURS        = Array.from({ length: 13 }, (_, i) => i + 8); // 08–20
const TIMELINE_START = 8  * 60;
const TIMELINE_END   = 21 * 60;
const TIMELINE_RANGE = TIMELINE_END - TIMELINE_START;

const TIPO_COLOR = {
    "Prueba de Manejo": { bg: "bg-blue-100",   border: "border-blue-400",   text: "text-blue-900",   dot: "bg-blue-500"   },
    "Tradicional":      { bg: "bg-amber-100",  border: "border-amber-400",  text: "text-amber-900",  dot: "bg-amber-500"  },
    "Digital":          { bg: "bg-violet-100", border: "border-violet-400", text: "text-violet-900", dot: "bg-violet-500" },
};
const FALLBACK_COLOR = { bg: "bg-slate-100", border: "border-slate-400", text: "text-slate-900", dot: "bg-slate-400" };
function colorFor(tipo) { return TIPO_COLOR[tipo] ?? FALLBACK_COLOR; }

// ─── micro-components ───────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
    return <div className={["animate-pulse rounded-md bg-black/10", className].join(" ")} />;
}

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 9 }).map((_, i) => (
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
        </div>
    );
}

function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;
    return createPortal(
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} />
            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-black bg-neutral-100 shadow-2xl">
                    <div className="flex items-center justify-between gap-3 bg-black px-5 py-4">
                        <div className="truncate text-base font-extrabold text-white">{title}</div>
                        <button onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20" aria-label="Cerrar">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="max-h-[72vh] overflow-auto p-5">{children}</div>
                    {footer ? (
                        <div className="flex flex-col gap-2 border-t border-black/10 bg-white/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
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
        <div className="rounded-lg border border-black/10 bg-neutral-200/50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-black">
                {Icon ? <Icon className="h-4 w-4" /> : null}
                <span>{label}</span>
            </div>
            {children}
        </div>
    );
}

function FilterBlock({ label, children }) {
    return (
        <div>
            <div className="mb-2 text-xs font-extrabold tracking-wide text-black">{label}</div>
            {children}
        </div>
    );
}

function ContextMenu({ ctxMenu, onDelete, onClose }) {
    if (!ctxMenu.open || !ctxMenu.row) return null;
    return createPortal(
        <div className="fixed z-[9999]" style={{ left: ctxMenu.x, top: ctxMenu.y }} onClick={(e) => e.stopPropagation()}>
            <div className="w-48 overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl">
                <button className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50" onClick={() => onDelete(ctxMenu.row)}>
                    <Trash2 className="h-4 w-4" /> Eliminar
                </button>
                <button className="w-full px-4 py-2 text-left text-xs text-slate-500 hover:bg-slate-50" onClick={onClose}>
                    Cerrar
                </button>
            </div>
        </div>,
        document.body
    );
}

function MobileCardList({ rows, loading, onEdit, onContext, onToggleAsistencia, updatingInline }) {
    return (
        <div className="lg:hidden">
            {loading ? (
                <div className="grid gap-3 sm:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="mt-3 h-4 w-28" />
                            <Skeleton className="mt-3 h-4 w-56" />
                            <Skeleton className="mt-4 h-8 w-24 rounded-full" />
                        </div>
                    ))}
                </div>
            ) : rows.length === 0 ? (
                <div className="rounded-xl border border-black/10 bg-white px-4 py-10 text-center text-sm font-semibold text-black">
                    No hay resultados con esos filtros.
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {rows.map((row) => {
                        const isUpdating = !!updatingInline[row.id];
                        const nombreCliente = row?.cliente?.nombre || "—";
                        const telCliente = row?.cliente?.telefono || "—";
                        const fecha = row.fecha_hora_cita ? toDTLocal(row.fecha_hora_cita).replace("T", " ") : "—";
                        return (
                            <div key={row.id} onClick={() => onEdit(row)} onContextMenu={(e) => onContext(e, row)} className="cursor-pointer rounded-xl border border-black/10 bg-white p-4 shadow-sm transition hover:shadow-md">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 text-xs font-extrabold text-black">
                                            <CalendarDays className="h-4 w-4" />
                                            <span className="truncate">{fecha}</span>
                                        </div>
                                        <div className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-500">
                                            <Building2 className="h-4 w-4" />
                                            <span className="truncate">{row.agencia || "—"}</span>
                                        </div>
                                    </div>
                                    <button disabled={isUpdating} onClick={(e) => { e.stopPropagation(); onToggleAsistencia(row); }}
                                        className={["shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition", row.asistencia ? "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200" : "bg-red-100 text-red-800 border-red-300 hover:bg-red-200", isUpdating ? "opacity-70 cursor-not-allowed" : ""].join(" ")}>
                                        {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                        {row.asistencia ? "Sí" : "No"}
                                    </button>
                                </div>
                                <div className="mt-3 grid gap-1.5">
                                    <div className="flex items-center gap-2 text-sm font-bold text-black"><User className="h-4 w-4" /><span className="truncate">{nombreCliente}</span></div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500"><Phone className="h-4 w-4 text-black" /><span className="truncate">{telCliente}</span></div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500"><CarFront className="h-4 w-4 text-black" /><span className="truncate">{row.auto_interes || "—"}</span></div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500"><LayoutList className="h-4 w-4 text-black" /><span className="truncate">{row.tipo_cita || "—"}</span></div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500"><UserMinus className="h-4 w-4 text-black" /><span className="truncate">{row.asesor_digital || "—"}</span></div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500"><UserStar className="h-4 w-4 text-black" /><span className="truncate">{row.asesor_piso || "—"}</span></div>
                                    <div className="flex items-start gap-2 text-xs text-slate-500"><MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-black" /><span className="line-clamp-2">{row.comentarios || "—"}</span></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Agenda sub-components ───────────────────────────────────────────────────

function AsistenciaBadge({ value }) {
    if (value === true)
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-xs font-bold text-emerald-800"><CheckCircle2 className="h-3 w-3" /> Asistió</span>;
    if (value === false)
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 border border-red-300 px-2 py-0.5 text-xs font-bold text-red-800"><XCircle className="h-3 w-3" /> No asistió</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-300 px-2 py-0.5 text-xs font-bold text-slate-600"><Circle className="h-3 w-3" /> Pendiente</span>;
}

function CitaDetailPanel({ cita, onClose }) {
    if (!cita) return (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <CalendarDays className="h-10 w-10 text-black/20" />
            <p className="text-sm font-semibold text-black/40">Selecciona una cita para ver el detalle</p>
        </div>
    );
    const dt = parseLocalDT(cita.fecha_hora_cita);
    const color = colorFor(cita.tipo_cita);
    return (
        <div className="flex h-full flex-col overflow-auto">
            <div className={["p-5 border-b border-black/10", color.bg].join(" ")}>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className={["text-xs font-extrabold tracking-widest uppercase mb-1", color.text].join(" ")}>{cita.tipo_cita || "Sin tipo"}</div>
                        <div className="text-lg font-extrabold text-black leading-tight">{cita?.cliente?.nombre || "Cliente sin nombre"}</div>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-black/10 transition">
                        <X className="h-4 w-4 text-black/60" />
                    </button>
                </div>
                {dt && (
                    <div className="mt-3 flex items-center gap-2 text-sm font-bold text-black">
                        <CalendarDays className="h-4 w-4" />
                        <span>{DIAS_LARGOS[(dt.getDay() + 6) % 7]}, {dt.getDate()} de {MESES[dt.getMonth()]} · {localHHMM(dt)}</span>
                    </div>
                )}
            </div>
            <div className="flex-1 space-y-3 p-5">
                {cita.agencia     && <DetailRow icon={Building2}  label="Agencia"        value={cita.agencia} />}
                {cita?.cliente?.nombre && <DetailRow icon={User}   label="Cliente"        value={cita.cliente.nombre} />}
                {cita.auto_interes && <DetailRow icon={CarFront}   label="Auto de interés" value={cita.auto_interes} />}
                {cita.asesor_digital && <DetailRow icon={UserMinus} label="Asesor digital" value={cita.asesor_digital} />}
                {cita.asesor_piso   && <DetailRow icon={UserStar}  label="Asesor piso"    value={cita.asesor_piso} />}
                <div className="pt-1"><AsistenciaBadge value={cita.asistencia} /></div>
                {cita.comentarios && (
                    <div className="rounded-lg border border-black/10 bg-neutral-50 p-3">
                        <div className="mb-1 text-xs font-extrabold uppercase tracking-wide text-black/50">Notas</div>
                        <p className="text-sm text-black/80 leading-relaxed">{cita.comentarios}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function DetailRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/5">
                <Icon className="h-3.5 w-3.5 text-black/60" />
            </div>
            <div className="min-w-0">
                <div className="text-[10px] font-extrabold uppercase tracking-wide text-black/40">{label}</div>
                <div className="text-sm font-semibold text-black truncate">{value}</div>
            </div>
        </div>
    );
}

function CitaBlock({ cita, topPct, onClick, selected }) {
    const dt = parseLocalDT(cita.fecha_hora_cita);
    const color = colorFor(cita.tipo_cita);
    const isSelected = selected?.id === cita.id;
    // altura fija: 45 min
    const heightPct = (45 / TIMELINE_RANGE) * 100;
    return (
        <button
            onClick={() => onClick(cita)}
            style={{ top: `${topPct}%`, height: `${Math.max(heightPct, 4)}%` }}
            className={[
                "absolute left-0.5 right-0.5 rounded-lg border-l-4 px-2 py-1 text-left transition-all overflow-hidden",
                color.bg, color.border, color.text,
                isSelected ? "ring-2 ring-black ring-offset-1 shadow-lg z-20" : "z-10 hover:shadow-md",
            ].join(" ")}
        >
            <div className="truncate text-[11px] font-extrabold leading-tight">
                {dt ? localHHMM(dt) : "—"} · {cita?.cliente?.nombre || "Cliente"}
            </div>
            <div className="truncate text-[10px] font-semibold opacity-70">
                {cita.auto_interes || cita.tipo_cita || ""}
            </div>
        </button>
    );
}

// ─── Vista Agenda (embebida) ─────────────────────────────────────────────────
function AgendaView({ citas, loadingList, onEditCita }) {
    const [selectedCita, setSelectedCita]   = useState(null);
    const [weekStart, setWeekStart]         = useState(() => startOfWeek(new Date()));
    const [selectedDay, setSelectedDay]     = useState(() => localYMD(new Date()));

    const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
    const todayYMD = localYMD(new Date());

    const prevWeek = () => setWeekStart((d) => addDays(d, -7));
    const nextWeek = () => setWeekStart((d) => addDays(d, 7));
    const goToday  = () => { setWeekStart(startOfWeek(new Date())); setSelectedDay(todayYMD); };

    const citasByDay = useMemo(() => {
        const map = {};
        citas.forEach((c) => {
            const dt = parseLocalDT(c.fecha_hora_cita);
            if (!dt) return;
            const key = localYMD(dt);
            if (!map[key]) map[key] = [];
            map[key].push({ ...c, _dt: dt });
        });
        Object.values(map).forEach((arr) => arr.sort((a, b) => a._dt - b._dt));
        return map;
    }, [citas]);

    const todayCitas = useMemo(() => citasByDay[selectedDay] || [], [citasByDay, selectedDay]);

    const upcomingCitas = useMemo(() => {
        const now = new Date();
        const end = addDays(now, 7);
        return citas
            .filter((c) => { const dt = parseLocalDT(c.fecha_hora_cita); return dt && dt >= now && dt <= end; })
            .sort((a, b) => parseLocalDT(a.fecha_hora_cita) - parseLocalDT(b.fecha_hora_cita))
            .slice(0, 20);
    }, [citas]);

    const headerMonth = useMemo(() => {
        const m = weekDays[3];
        return `${MESES[m.getMonth()]} ${m.getFullYear()}`;
    }, [weekDays]);

    function citaTopPct(dt) {
        const mins = dt.getHours() * 60 + dt.getMinutes();
        return Math.max(0, Math.min(100, ((mins - TIMELINE_START) / TIMELINE_RANGE) * 100));
    }

    return (
        <div className="space-y-4">
            {/* ── Selector de semana ── */}
            <div className="rounded-xl border border-black/10 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-black/10 px-5 py-3">
                    <div className="flex items-center gap-3">
                        <button onClick={prevWeek} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/15 hover:bg-black hover:text-white transition">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-base font-extrabold text-black">{headerMonth}</span>
                        <button onClick={nextWeek} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/15 hover:bg-black hover:text-white transition">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        {loadingList && <Loader2 className="h-4 w-4 animate-spin text-black/40" />}
                        <button onClick={goToday} className="rounded-lg border border-black bg-white px-3 py-1.5 text-xs font-extrabold hover:bg-black hover:text-white transition">
                            Hoy
                        </button>
                    </div>
                </div>

                {/* Días */}
                <div className="grid grid-cols-7">
                    {weekDays.map((day, i) => {
                        const ymd = localYMD(day);
                        const isToday    = ymd === todayYMD;
                        const isSelected = ymd === selectedDay;
                        const dayCitas   = citasByDay[ymd] || [];
                        return (
                            <button key={ymd} onClick={() => setSelectedDay(ymd)}
                                className={["relative flex flex-col items-center gap-1 py-3 transition border-r last:border-r-0 border-black/5", isSelected ? "bg-black text-white" : "hover:bg-slate-50"].join(" ")}>
                                <span className={["text-[10px] font-extrabold tracking-widest uppercase", isSelected ? "text-white/60" : "text-black/40"].join(" ")}>
                                    {DIAS_CORTOS[i]}
                                </span>
                                <span className={["flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold", isToday && !isSelected ? "bg-black text-white" : "", isSelected ? "bg-white text-black" : ""].join(" ")}>
                                    {day.getDate()}
                                </span>
                                {dayCitas.length > 0 && (
                                    <div className="flex flex-wrap justify-center gap-0.5 px-1">
                                        {dayCitas.slice(0, 4).map((c, j) => (
                                            <span key={j} className={["inline-block h-2 w-2 rounded-full", isSelected ? "bg-white/60" : colorFor(c.tipo_cita).dot].join(" ")} />
                                        ))}
                                        {dayCitas.length > 4 && (
                                            <span className={["text-[9px] font-bold", isSelected ? "text-white/70" : "text-black/40"].join(" ")}>
                                                +{dayCitas.length - 4}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Timeline + Panel ── */}
            <div className="grid gap-4 lg:grid-cols-[1fr_300px]">

                {/* Timeline del día */}
                <div className="rounded-xl border border-black/10 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-black/10 px-5 py-3 flex items-center justify-between">
                        <div>
                            <div className="text-xs font-extrabold uppercase tracking-widest text-black/40">
                                {(() => { const d = new Date(selectedDay + "T12:00:00"); return DIAS_LARGOS[(d.getDay() + 6) % 7]; })()}
                            </div>
                            <div className="text-xl font-extrabold text-black">
                                {(() => { const d = new Date(selectedDay + "T12:00:00"); return `${d.getDate()} de ${MESES[d.getMonth()]}`; })()}
                            </div>
                        </div>
                        <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
                            {todayCitas.length} {todayCitas.length === 1 ? "cita" : "citas"}
                        </span>
                    </div>

                    <div className="relative overflow-auto" style={{ maxHeight: "520px" }}>
                        {todayCitas.length === 0 && !loadingList && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none z-30">
                                <AlertCircle className="h-8 w-8 text-black/15" />
                                <p className="text-xs font-semibold text-black/30">Sin citas este día</p>
                            </div>
                        )}
                        <div className="relative" style={{ height: `${HOURS.length * 56}px` }}>
                            {HOURS.map((h, i) => (
                                <div key={h} className="absolute left-0 right-0 border-t border-black/5" style={{ top: `${i * 56}px` }}>
                                    <span className="inline-block w-14 pl-3 text-[10px] font-bold text-black/30 leading-none -translate-y-2">
                                        {PAD(h)}:00
                                    </span>
                                </div>
                            ))}

                            {/* Línea "ahora" */}
                            {selectedDay === todayYMD && (() => {
                                const now  = new Date();
                                const mins = now.getHours() * 60 + now.getMinutes();
                                const pct  = ((mins - TIMELINE_START) / TIMELINE_RANGE) * 100;
                                if (pct < 0 || pct > 100) return null;
                                return (
                                    <div className="absolute left-14 right-2 z-40 flex items-center" style={{ top: `${pct}%` }}>
                                        <div className="h-2 w-2 rounded-full bg-red-500 -translate-x-1" />
                                        <div className="h-px flex-1 bg-red-400" />
                                    </div>
                                );
                            })()}

                            {/* Bloques de citas */}
                            <div className="absolute left-14 right-2 top-0 bottom-0">
                                {todayCitas.map((cita) => (
                                    <CitaBlock
                                        key={cita.id}
                                        cita={cita}
                                        topPct={citaTopPct(cita._dt)}
                                        onClick={(c) => { setSelectedCita(c); }}
                                        selected={selectedCita}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panel lateral */}
                <div className="flex flex-col gap-4">
                    {/* Detalle */}
                    <div className="rounded-xl border border-black/10 bg-white shadow-sm overflow-hidden" style={{ minHeight: 240 }}>
                        <div className="border-b border-black/10 px-4 py-3 flex items-center justify-between">
                            <span className="text-xs font-extrabold uppercase tracking-widest text-black/50">Detalle</span>
                            {selectedCita && (
                                <button
                                    onClick={() => onEditCita(selectedCita)}
                                    className="rounded-lg border border-black/20 bg-white px-2.5 py-1 text-xs font-bold text-black hover:bg-black hover:text-white transition"
                                >
                                    Editar
                                </button>
                            )}
                        </div>
                        <CitaDetailPanel cita={selectedCita} onClose={() => setSelectedCita(null)} />
                    </div>

                    {/* Próximos 7 días */}
                    <div className="rounded-xl border border-black/10 bg-white shadow-sm overflow-hidden">
                        <div className="border-b border-black/10 px-4 py-3">
                            <span className="text-xs font-extrabold uppercase tracking-widest text-black/50">Próximos 7 días</span>
                        </div>
                        {loadingList ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-black/30" />
                            </div>
                        ) : upcomingCitas.length === 0 ? (
                            <div className="px-4 py-6 text-center text-xs font-semibold text-black/30">Sin citas próximas</div>
                        ) : (
                            <div className="divide-y divide-black/5 max-h-[380px] overflow-auto">
                                {upcomingCitas.map((cita) => {
                                    const dt     = parseLocalDT(cita.fecha_hora_cita);
                                    const color  = colorFor(cita.tipo_cita);
                                    const ymd    = dt ? localYMD(dt) : "";
                                    const active = ymd === selectedDay;
                                    return (
                                        <button key={cita.id}
                                            onClick={() => {
                                                if (ymd) setSelectedDay(ymd);
                                                setSelectedCita(cita);
                                                if (dt) setWeekStart(startOfWeek(dt));
                                            }}
                                            className={["w-full flex items-start gap-3 px-4 py-3 text-left transition", active ? "bg-black/5" : "hover:bg-slate-50"].join(" ")}
                                        >
                                            <div className={["mt-1 h-2.5 w-2.5 shrink-0 rounded-full", color.dot].join(" ")} />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="truncate text-sm font-bold text-black">{cita?.cliente?.nombre || "—"}</span>
                                                    {dt && <span className="shrink-0 text-[10px] font-extrabold text-black/40">{localHHMM(dt)}</span>}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {dt && <span className="text-[10px] font-semibold text-black/50">{DIAS_CORTOS[(dt.getDay() + 6) % 7]} {dt.getDate()} {MESES[dt.getMonth()].slice(0, 3)}</span>}
                                                    {cita.tipo_cita && <span className={["rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase", color.bg, color.text].join(" ")}>{cita.tipo_cita}</span>}
                                                </div>
                                                {cita.auto_interes && (
                                                    <div className="mt-0.5 flex items-center gap-1 text-[10px] text-black/40">
                                                        <CarFront className="h-3 w-3" />{cita.auto_interes}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Leyenda */}
                    <div className="rounded-xl border border-black/10 bg-white px-4 py-3 shadow-sm">
                        <div className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-black/40">Tipos de cita</div>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(TIPO_COLOR).map(([tipo, c]) => (
                                <span key={tipo} className={["inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold", c.bg, c.border, c.text].join(" ")}>
                                    <span className={["h-1.5 w-1.5 rounded-full", c.dot].join(" ")} />{tipo}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── main component ──────────────────────────────────────────────────────────
export default function RegistroCitas() {
    const { user } = useAuth();

    const isAdmin = useMemo(() => {
        const permisos = user?.permisos || [];
        const rol = String(user?.rol || "").trim().toLowerCase();
        return rol === "administrador" || permisos.includes("CRM_DIGITALES") || permisos.includes("ALL") || permisos.includes("USUARIOS_ADMIN");
    }, [user]);

    const userAgencia = String(user?.agencia || "").trim();

    const [citas, setCitas]       = useState([]);
    const [vista, setVista]       = useState("tabla"); // "tabla" | "agenda"

    const DEALERS = useMemo(() => ["Volvo"], []);
    const ASESORES_DIGITALES = ["Mariana Tlamani"];
    const ASESORES = [
        "Enrique Vazquez Islas", "Ricardo Platas",
        "Verónica Del Rayo Galindo León", "Julio Camacho Barragán",
        "Fernanda Romero Aguilar",
    ];
    const FUENTE = [
        "Facebook", "WhatsApp", "VW-Concesionarios", "Llamada Entrante",
        "Prospeccion", "Cartera", "Eternizacion de credito", "Remarketing",
        "Base de Datos", "Ubicacion",
    ];
    const VEHICULOS = [
        "EX30", "EX40", "EC40", "EX90", "XC60", "XC90",
        "XC60 Black Edition", "XC90 Black Edition", "Seminuevos", "Avaluo",
    ];
    const TIPO_CITA = ["Prueba de Manejo", "Tradicional", "Digital"];

    const [ctxMenu, setCtxMenu]             = useState({ open: false, x: 0, y: 0, row: null });
    const [sort, setSort]                   = useState({ key: "fecha_hora_cita", dir: "desc" });
    const [filters, setFilters]             = useState({ q: "", agencia: "Todos", asesorDigital: "Todos", rangoDesde: "", rangoHasta: "" });
    const [openModal, setOpenModal]         = useState(false);
    const [mode, setMode]                   = useState("create");
    const [draft, setDraft]                 = useState(null);
    const [loadingList, setLoadingList]     = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving]               = useState(false);
    const [touchedSave, setTouchedSave]     = useState(false);
    const [updatingInline, setUpdatingInline] = useState({});

    const REQUIRED = useMemo(() => ({ cliente_telefono: "Teléfono", fecha_hora_cita: "Fecha y hora" }), []);

    const missing = useMemo(() => {
        if (!draft) return [];
        return Object.keys(REQUIRED).filter((key) => {
            const v = draft[key];
            return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
        });
    }, [draft, REQUIRED]);

    const isInvalid = (key) => touchedSave && missing.includes(key);

    const telDigits      = useMemo(() => String(draft?.cliente_telefono || "").replace(/\D/g, ""), [draft?.cliente_telefono]);
    const telIsOk        = useMemo(() => /^(?:\d{10}|52\d{10})$/.test(telDigits), [telDigits]);
    const telIsNormalized = useMemo(() => /^52\d{10}$/.test(telDigits), [telDigits]);
    const telError       = useMemo(() => {
        if (!openModal || !draft || !telDigits) return "";
        if (/^\d{10}$/.test(telDigits) || /^52\d{10}$/.test(telDigits)) return "";
        if (telDigits.length < 10)  return "Número incompleto (mínimo 10 dígitos)";
        if (telDigits.length === 11) return "Número incorrecto (11 dígitos no válido)";
        if (telDigits.length === 12 && !telDigits.startsWith("52")) return "Si tiene 12 dígitos debe iniciar con 52";
        if (telDigits.length > 12)  return "Número incorrecto (máximo 12 dígitos)";
        return "Número inválido";
    }, [openModal, draft, telDigits]);

    const telInvalid = !!telError;
    const inputBase  = "w-full rounded-lg border shadow-sm px-3 py-2 text-sm text-black font-semibold outline-none";
    const inputOk    = "border-black/20 bg-neutral-100";
    const inputBad   = "border-red-500 bg-red-50";

    function toggleSort(key) {
        setSort((prev) => ({ key, dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc" }));
    }

    useEffect(() => {
        const onGlobal = () => setCtxMenu((p) => ({ ...p, open: false, row: null }));
        window.addEventListener("click", onGlobal);
        window.addEventListener("scroll", onGlobal, true);
        window.addEventListener("resize", onGlobal);
        return () => {
            window.removeEventListener("click", onGlobal);
            window.removeEventListener("scroll", onGlobal, true);
            window.removeEventListener("resize", onGlobal);
        };
    }, []);

    const onRowContextMenu = (e, row) => { e.preventDefault(); e.stopPropagation(); setCtxMenu({ open: true, x: e.clientX, y: e.clientY, row }); };

    const refreshList = async () => {
        setLoadingList(true);
        try { const data = await apiCitas.list(); setCitas(Array.isArray(data) ? data : []); }
        catch (e) { console.error(e); setCitas([]); }
        finally { setLoadingList(false); }
    };

    useEffect(() => { refreshList(); }, []);

    const dealers = useMemo(() => {
        const set = new Set((citas || []).map((c) => normalizeStr(c.agencia)).filter(Boolean));
        if (!isAdmin && userAgencia) return ["Todos", userAgencia];
        return ["Todos", ...Array.from(set)];
    }, [citas, isAdmin, userAgencia]);

    const asesoresDigitalesFiltro = useMemo(() => {
        const set = new Set([...ASESORES_DIGITALES, ...(citas || []).map((c) => normalizeStr(c.asesor_digital))].filter(Boolean));
        return ["Todos", ...Array.from(set)];
    }, [citas]);

    const filtered = useMemo(() => {
        const q        = filters.q.trim().toLowerCase();
        const desdeInt = ymdToInt(filters.rangoDesde);
        const hastaInt = ymdToInt(filters.rangoHasta);
        return (citas || []).filter((c) => {
            if (!isAdmin && userAgencia && normalizeStr(c.agencia) !== normalizeStr(userAgencia)) return false;
            const matchQ       = !q || [c.agencia, c?.cliente?.nombre, c?.cliente?.telefono, c.auto_interes, c.tipo_cita, c.fuente_prospeccion, c.asesor_digital, c.asesor_piso, c.comentarios].map((v) => normalizeStr(v).toLowerCase()).join(" ").includes(q);
            const matchAgencia = filters.agencia === "Todos" || normalizeStr(c.agencia) === normalizeStr(filters.agencia);
            const matchAsesor  = filters.asesorDigital === "Todos" || normalizeStr(c.asesor_digital) === normalizeStr(filters.asesorDigital);
            let matchRango = true;
            if (desdeInt !== null || hastaInt !== null) {
                const ymdInt = ymdToInt(c.fecha_hora_cita ? toYMDLocal(c.fecha_hora_cita) : "");
                if (!ymdInt) return false;
                if (desdeInt !== null && ymdInt < desdeInt) matchRango = false;
                if (hastaInt !== null && ymdInt > hastaInt) matchRango = false;
            }
            return matchQ && matchAgencia && matchAsesor && matchRango;
        });
    }, [citas, filters, isAdmin, userAgencia]);

    const sorted = useMemo(() => {
        const data  = [...filtered];
        const { key, dir } = sort;
        const mult  = dir === "asc" ? 1 : -1;
        return data.sort((a, b) => {
            if (key === "fecha_hora_cita") return (new Date(a[key] || 0).getTime() - new Date(b[key] || 0).getTime()) * mult;
            const va = normalizeStr(a?.[key]).toLowerCase();
            const vb = normalizeStr(b?.[key]).toLowerCase();
            return va < vb ? -1 * mult : va > vb ? 1 * mult : 0;
        });
    }, [filtered, sort]);

    const openCreate = () => {
        setTouchedSave(false); setMode("create");
        setDraft({ id: null, cliente_id: null, agencia: isAdmin ? "" : userAgencia, cliente_nombre: "", cliente_telefono: "", auto_interes: "", fecha_hora_cita: "", asistencia: false, tipo_cita: "", fuente_prospeccion: "", asesor_digital: "", asesor_piso: "", comentarios: "" });
        setOpenModal(true);
    };

    const openEdit = async (row) => {
        if (!row?.id) return;
        try {
            setTouchedSave(false); setMode("edit"); setLoadingDetail(true); setOpenModal(true);
            const c = await apiCitas.get(row.id);
            if (!isAdmin && userAgencia && normalizeStr(c.agencia) !== normalizeStr(userAgencia)) {
                alert("No tienes permisos para ver registros de otra agencia."); setOpenModal(false); return;
            }
            setDraft({ id: c.id, cliente_id: c?.cliente?.id_cliente ?? null, agencia: c.agencia || (isAdmin ? "" : userAgencia), cliente_nombre: c?.cliente?.nombre || "", cliente_telefono: c?.cliente?.telefono || "", auto_interes: c.auto_interes || "", fecha_hora_cita: toDTLocal(c.fecha_hora_cita), asistencia: !!c.asistencia, tipo_cita: c.tipo_cita || "", fuente_prospeccion: c.fuente_prospeccion || "", asesor_digital: c.asesor_digital || "", asesor_piso: c.asesor_piso || "", comentarios: c.comentarios || "" });
        } catch (e) { console.error(e); alert("No se pudo abrir la cita."); setOpenModal(false); }
        finally { setLoadingDetail(false); }
    };

    const closeModal = () => { if (saving) return; setOpenModal(false); setDraft(null); };

    const eliminarCita = async (row) => {
        if (!row?.id) return;
        if (!isAdmin && userAgencia && normalizeStr(row.agencia) !== normalizeStr(userAgencia)) { alert("Sin permisos."); return; }
        if (!confirm(`¿Eliminar la cita de ${row?.cliente?.nombre || row?.cliente?.telefono || "cliente"}?`)) return;
        try { await apiCitas.remove(row.id); setCitas((prev) => prev.filter((c) => c.id !== row.id)); setCtxMenu({ open: false, x: 0, y: 0, row: null }); }
        catch (e) { console.error(e); alert("No se pudo eliminar."); }
    };

    const save = async () => {
        if (!draft || saving) return;
        setTouchedSave(true);
        if (missing.length || !telIsOk) return;
        setSaving(true);
        try {
            const agenciaFinal = isAdmin ? normalizeStr(draft.agencia || "") : userAgencia;
            const payload = { agencia: agenciaFinal, ...(draft.cliente_id ? { cliente_id: draft.cliente_id } : {}), nombre: draft.cliente_nombre || "", telefono: normalizeStr(draft.cliente_telefono), auto_interes: draft.auto_interes || "", fecha_hora_cita: fromDTLocalToISO(draft.fecha_hora_cita), asistencia: !!draft.asistencia, tipo_cita: draft.tipo_cita || "", fuente_prospeccion: draft.fuente_prospeccion || "", asesor_digital: draft.asesor_digital || "", asesor_piso: draft.asesor_piso || "", comentarios: draft.comentarios || "" };
            if (mode === "create") await apiCitas.create(payload);
            else await apiCitas.update(draft.id, payload);
            await refreshList(); closeModal();
        } catch (e) { console.error(e); alert("Error guardando la cita."); }
        finally { setSaving(false); }
    };

    const toggleAsistenciaInline = async (row) => {
        const id = row?.id; if (!id) return;
        if (!isAdmin && userAgencia && normalizeStr(row.agencia) !== normalizeStr(userAgencia)) { alert("Sin permisos."); return; }
        const prev = !!row.asistencia;
        setCitas((p) => p.map((c) => (c.id === id ? { ...c, asistencia: !prev } : c)));
        setUpdatingInline((p) => ({ ...p, [id]: true }));
        try { await apiCitas.patch(id, { asistencia: !prev }); }
        catch (e) { console.error(e); setCitas((p) => p.map((c) => (c.id === id ? { ...c, asistencia: prev } : c))); alert("No se pudo actualizar asistencia."); }
        finally { setUpdatingInline((p) => { const n = { ...p }; delete n[id]; return n; }); }
    };

    const resetFilters = () => setFilters({ q: "", agencia: "Todos", asesorDigital: "Todos", rangoDesde: "", rangoHasta: "" });
    const setHoy = () => { const hoy = toYMDLocal(new Date()); setFilters((p) => ({ ...p, rangoDesde: hoy, rangoHasta: hoy })); };

    // ─── render ───────────────────────────────────────────────────────────────
    return (
        <div className="w-full space-y-4">
            <CitasTopNav />

            {/* título + toggle de vista + botón nuevo */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-extrabold text-black">Citas</h2>
                    {!isAdmin && userAgencia ? (
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Agencia: <span className="text-black">{userAgencia}</span>
                        </p>
                    ) : null}
                </div>

                <div className="flex items-center gap-2">
                    {/* Toggle Tabla / Agenda */}
                    <div className="flex rounded-lg border border-black/15 bg-white overflow-hidden shadow-sm">
                        
                        <div className="w-px bg-black/10" />
                        
                    </div>

                    <button
                        onClick={openCreate}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-black/80 transition"
                    >
                        <Plus className="h-4 w-4" /> Nueva Cita
                    </button>
                </div>
            </div>

            {/* ── Vista Tabla ── */}
            {vista === "tabla" && (
                <>
                    {/* filtros */}
                    <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
                        <div className="grid gap-3 md:grid-cols-12">
                            <div className="md:col-span-3">
                                <FilterBlock label="Búsqueda">
                                    <div className="flex items-center gap-2 rounded-lg border border-black bg-white px-3 py-2">
                                        <Search className="h-4 w-4 text-black" />
                                        <input value={filters.q} onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))} placeholder="Dealer, cliente, asesor…" className="w-full text-sm text-black outline-none placeholder:text-black/50" />
                                        {filters.q ? <button onClick={() => setFilters((p) => ({ ...p, q: "" }))} className="p-1 text-black hover:text-red-500"><X className="h-4 w-4" /></button> : null}
                                    </div>
                                </FilterBlock>
                            </div>
                            <div className="md:col-span-3">
                                <FilterBlock label="Dealer">
                                    <select value={filters.agencia} onChange={(e) => setFilters((p) => ({ ...p, agencia: e.target.value }))} className="w-full rounded-lg border border-black bg-white px-3 py-2 text-sm text-black outline-none">
                                        {dealers.map((d) => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </FilterBlock>
                            </div>
                            <div className="md:col-span-3">
                                <FilterBlock label="Asesor Digital">
                                    <select value={filters.asesorDigital} onChange={(e) => setFilters((p) => ({ ...p, asesorDigital: e.target.value }))} className="w-full rounded-lg border border-black bg-white px-3 py-2 text-sm text-black outline-none">
                                        {asesoresDigitalesFiltro.map((a) => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                </FilterBlock>
                            </div>
                            <div className="md:col-span-3">
                                <FilterBlock label="Acciones">
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={setHoy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                                            <CalendarDays className="h-4 w-4" /> Hoy
                                        </button>
                                        <button onClick={resetFilters} className="inline-flex items-center justify-center gap-2 rounded-lg border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black hover:text-white transition">
                                            <X className="h-4 w-4" /> Limpiar
                                        </button>
                                    </div>
                                </FilterBlock>
                            </div>
                            <div className="md:col-span-6">
                                <FilterBlock label="Desde">
                                    <input type="date" value={filters.rangoDesde} onChange={(e) => setFilters((p) => ({ ...p, rangoDesde: e.target.value }))} className="w-full rounded-lg border border-black bg-white px-3 py-2 text-sm text-black outline-none" />
                                </FilterBlock>
                            </div>
                            <div className="md:col-span-6">
                                <FilterBlock label="Hasta">
                                    <input type="date" value={filters.rangoHasta} onChange={(e) => setFilters((p) => ({ ...p, rangoHasta: e.target.value }))} className="w-full rounded-lg border border-black bg-white px-3 py-2 text-sm text-black outline-none" />
                                </FilterBlock>
                            </div>
                        </div>
                    </div>

                    {/* mobile cards */}
                    <MobileCardList rows={sorted} loading={loadingList} onEdit={openEdit} onContext={onRowContextMenu} onToggleAsistencia={toggleAsistenciaInline} updatingInline={updatingInline} />

                    {/* desktop tabla */}
                    <div className="hidden overflow-hidden rounded-xl shadow-sm lg:block">
                        <div className="overflow-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="border border-black bg-black text-xs text-white">
                                    <tr>
                                        {[
                                            { label: "Fecha y Hora Cita", key: "fecha_hora_cita" },
                                            { label: "Dealer", key: "agencia" },
                                        ].map(({ label, key }) => (
                                            <th key={key} className="px-4 py-3">
                                                <button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 font-bold">
                                                    {label}
                                                    <span className="opacity-60">
                                                        {sort.key === key ? sort.dir === "asc" ? <ChevronUp className="h-4" /> : <ChevronDown className="h-4" /> : <ArrowUpDown className="h-4" />}
                                                    </span>
                                                </button>
                                            </th>
                                        ))}
                                        <th className="px-4 py-3">Cliente</th>
                                        <th className="px-4 py-3">Auto interés</th>
                                        <th className="px-4 py-3">Asesor Digital</th>
                                        <th className="px-4 py-3">Asesor Piso</th>
                                        <th className="px-4 py-3">Tipo Cita</th>
                                        <th className="px-4 py-3">Comentarios</th>
                                        <th className="px-4 py-3">¿Asistió?</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/10 bg-white">
                                    {loadingList ? (
                                        Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                                    ) : sorted.length === 0 ? (
                                        <tr><td colSpan={9} className="px-4 py-10 text-center text-black">No hay resultados con esos filtros.</td></tr>
                                    ) : (
                                        sorted.map((row) => {
                                            const isUpdating = !!updatingInline[row.id];
                                            return (
                                                <tr key={row.id} onDoubleClick={() => openEdit(row)} onContextMenu={(e) => onRowContextMenu(e, row)} className="cursor-pointer transition hover:bg-slate-50">
                                                    <td className="px-4 py-3 font-semibold text-black">{row.fecha_hora_cita ? toDTLocal(row.fecha_hora_cita).replace("T", " ") : "—"}</td>
                                                    <td className="px-4 py-3 font-semibold text-black">{row.agencia || "—"}</td>
                                                    <td className="px-4 py-3 font-bold text-black">{row?.cliente?.nombre || "—"}</td>
                                                    <td className="px-4 py-3 text-black">{row.auto_interes || "—"}</td>
                                                    <td className="px-4 py-3 text-black">{row.asesor_digital || "—"}</td>
                                                    <td className="px-4 py-3 text-black">{row.asesor_piso || "—"}</td>
                                                    <td className="px-4 py-3 text-black">{row.tipo_cita || "—"}</td>
                                                    <td className="px-4 py-3 text-black"><span className="line-clamp-2">{row.comentarios || "—"}</span></td>
                                                    <td className="px-4 py-3">
                                                        <button disabled={isUpdating} onClick={(e) => { e.stopPropagation(); toggleAsistenciaInline(row); }}
                                                            className={["inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition", row.asistencia ? "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200" : "bg-red-100 text-red-800 border-red-300 hover:bg-red-200", isUpdating ? "opacity-70 cursor-not-allowed" : ""].join(" ")}>
                                                            {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                                            {row.asistencia ? "Sí" : "No"}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <ContextMenu ctxMenu={ctxMenu} onDelete={eliminarCita} onClose={() => setCtxMenu({ open: false, x: 0, y: 0, row: null })} />
                </>
            )}

            {/* ── Vista Agenda ── */}
            {vista === "agenda" && (
                <AgendaView
                    citas={citas}
                    loadingList={loadingList}
                    onEditCita={openEdit}
                />
            )}

            {/* Modal (compartido por ambas vistas) */}
            <Modal
                open={openModal}
                title={mode === "create" ? "Nueva Cita" : `Editar Cita • ${draft?.id}`}
                onClose={closeModal}
                footer={
                    <>
                        <button onClick={closeModal} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60">
                            <X className="h-4 w-4" /> Cancelar
                        </button>
                        <button onClick={save} disabled={saving || loadingDetail || telInvalid || (draft?.cliente_telefono ? !telIsOk : false)} className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-bold text-white hover:bg-black/80 disabled:opacity-60 transition">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </>
                }
            >
                {loadingDetail ? <ModalSkeleton /> : !draft ? null : (
                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="md:col-span-3">
                            <Field label="Tipo de cita" icon={LayoutList}>
                                <select value={draft.tipo_cita || ""} onChange={(e) => setDraft((p) => ({ ...p, tipo_cita: e.target.value }))} className={[inputBase, inputOk].join(" ")}>
                                    <option value="" disabled>Selecciona un tipo...</option>
                                    {TIPO_CITA.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </Field>
                        </div>
                        <Field label="Dealer" icon={Building2}>
                            <select value={draft.agencia || ""} onChange={(e) => setDraft((p) => ({ ...p, agencia: e.target.value }))} disabled={!isAdmin} className={[inputBase, inputOk, !isAdmin ? "opacity-75 cursor-not-allowed" : ""].join(" ")}>
                                <option value="" disabled>Selecciona un dealer...</option>
                                {(isAdmin ? DEALERS : userAgencia ? [userAgencia] : DEALERS).map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </Field>
                        <Field label="Nombre del cliente" icon={User}>
                            <input value={draft.cliente_nombre} onChange={(e) => setDraft((p) => ({ ...p, cliente_nombre: e.target.value }))} className={[inputBase, inputOk].join(" ")} placeholder="Nombre completo" />
                        </Field>
                        <Field label="Teléfono" icon={Phone}>
                            <input maxLength={12} value={draft.cliente_telefono} onChange={(e) => setDraft((p) => ({ ...p, cliente_telefono: e.target.value.replace(/\D/g, "").slice(0, 12) }))} disabled={mode === "edit" || telIsNormalized} className={[inputBase, isInvalid("cliente_telefono") || telInvalid ? inputBad : inputOk, (mode === "edit" || telIsNormalized) ? "opacity-75 cursor-not-allowed" : ""].join(" ")} />
                            {isInvalid("cliente_telefono") && <div className="mt-1 text-xs font-bold text-red-600">Teléfono es requerido.</div>}
                            {!isInvalid("cliente_telefono") && telError && <div className="mt-1 text-xs font-bold text-red-600">{telError}</div>}
                        </Field>
                        <Field label="VW de sus sueños" icon={CarFront}>
                            <select value={draft.auto_interes || ""} onChange={(e) => setDraft((p) => ({ ...p, auto_interes: e.target.value }))} className={[inputBase, inputOk].join(" ")}>
                                <option value="" disabled>Selecciona un modelo...</option>
                                {VEHICULOS.map((v) => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </Field>
                        <Field label="Fecha y Hora" icon={CalendarDays}>
                            <input type="datetime-local" value={draft.fecha_hora_cita} onChange={(e) => setDraft((p) => ({ ...p, fecha_hora_cita: e.target.value }))} className={[inputBase, isInvalid("fecha_hora_cita") ? inputBad : inputOk].join(" ")} />
                            {isInvalid("fecha_hora_cita") && <div className="mt-1 text-xs font-bold text-red-600">Fecha y hora es requerido.</div>}
                        </Field>
                        <Field label="Fuente de Prospección" icon={UserSearch}>
                            <select value={draft.fuente_prospeccion || ""} onChange={(e) => setDraft((p) => ({ ...p, fuente_prospeccion: e.target.value }))} className={[inputBase, inputOk].join(" ")}>
                                <option value="" disabled>Selecciona una fuente...</option>
                                {FUENTE.map((f) => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </Field>
                        <Field label="Asistencia" icon={UserCheck}>
                            <label className="flex items-center gap-3 text-sm font-semibold text-black">
                                <input type="checkbox" checked={!!draft.asistencia} onChange={(e) => setDraft((p) => ({ ...p, asistencia: e.target.checked }))} className="h-4 w-4 accent-black" />
                                ¿Asistió?
                            </label>
                        </Field>
                        <Field label="Asesor Digital" icon={UserMinus}>
                            <select value={draft.asesor_digital || ""} onChange={(e) => setDraft((p) => ({ ...p, asesor_digital: e.target.value }))} className={[inputBase, inputOk].join(" ")}>
                                <option value="" disabled>Selecciona un asesor...</option>
                                {ASESORES_DIGITALES.map((a) => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </Field>
                        <Field label="Asesor Piso" icon={UserStar}>
                            <select value={draft.asesor_piso || ""} onChange={(e) => setDraft((p) => ({ ...p, asesor_piso: e.target.value }))} className={[inputBase, inputOk].join(" ")}>
                                <option value="" disabled>Selecciona un asesor...</option>
                                {ASESORES.map((a) => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </Field>
                        <div className="md:col-span-3">
                            <Field label="Comentarios" icon={MessageSquareText}>
                                <textarea value={draft.comentarios} onChange={(e) => setDraft((p) => ({ ...p, comentarios: e.target.value }))} className={[inputBase, inputOk, "min-h-[110px]"].join(" ")} placeholder="Notas internas..." />
                            </Field>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}