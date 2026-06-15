// src/pages/PruebasManejo/RegistroPruebaManejo.jsx
import { useMemo, useState, useEffect, useRef } from "react";
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
    Mail,
    UserStar,
    FileText,
    Hash,
    Building2,
    MessageSquareText,
    Camera,
    Eye,
    UploadCloud,
    Copy,
    LayoutList,
    CalendarRange,
    BarChart2,
    CheckCircle2,
    Clock,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { apiPruebaManejo, apiEvidenciasPruebaManejo } from "../../lib/apiPruebaManejo";
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
    Legend,
    PieChart,
    Pie,
    Cell,
} from "recharts";

const BRAND = "#000000";
const API_BASE = import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";

// ─── helpers ────────────────────────────────────────────────────────────────
function normalizeStr(v) { return String(v ?? "").trim(); }

function Skeleton({ className = "" }) {
    return <div className={["animate-pulse rounded-md bg-black/10", className].join(" ")} />;
}
function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {[36, 28, 40, 28, 28, 40, 28].map((w, i) => (
                <td key={i} className="px-4 py-3">
                    <div className={`h-4 w-${w} rounded bg-slate-200/60`} />
                </td>
            ))}
        </tr>
    );
}
function ModalSkeleton() {
    return (
        <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-black/10 bg-neutral-200/50 p-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-3 h-10 w-full rounded-lg" />
                </div>
            ))}
        </div>
    );
}

// ─── Modal ──────────────────────────────────────────────────────────────────
function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} />
            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-4xl overflow-hidden rounded-lg border border-black bg-neutral-100 shadow-2xl">
                    <div className="flex items-center justify-between gap-3 px-5 py-4 bg-black">
                        <div className="truncate text-base font-extrabold text-white">{title}</div>
                        <button
                            onClick={onClose}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white hover:bg-white/20"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="max-h-[72vh] overflow-auto p-5">{children}</div>
                    {footer && (
                        <div className="flex flex-col gap-2 border-t border-black/10 bg-white/[0.03] px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Field({ label, icon: Icon, children }) {
    return (
        <div className="rounded-lg border border-black/10 bg-neutral-200/50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-black">
                {Icon && <Icon className="h-4 w-4" />}
                <span>{label}</span>
            </div>
            {children}
        </div>
    );
}

function FilterBlock({ label, children }) {
    return (
        <div className="rounded-lg">
            <div className="mb-2 text-xs font-extrabold tracking-wide text-black">{label}</div>
            {children}
        </div>
    );
}

// ─── Fechas ─────────────────────────────────────────────────────────────────
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

// ─── Context Menu ───────────────────────────────────────────────────────────
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

// ─── Media helpers ──────────────────────────────────────────────────────────
function formatBytes(bytes = 0) {
    if (!bytes) return "—";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0, v = bytes;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
    return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
function resolveMediaUrl(url) {
    const u = String(url || "").trim();
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith("/")) return `${API_BASE}${u}`;
    if (u.startsWith("media/")) return `${API_BASE}/${u}`;
    return `${API_BASE}/media/${u}`;
}
function isImageMime(mime = "") { return String(mime || "").toLowerCase().startsWith("image/"); }
function guessIsImageFromName(name = "") {
    const n = String(name || "").toLowerCase();
    return [".jpg", ".jpeg", ".png", ".webp", ".gif"].some((ext) => n.endsWith(ext));
}

// ─── Evidencias Uploader ────────────────────────────────────────────────────
function EvidenciasUploader({ evidencias = [], onSubir, onEliminar, disabled }) {
    const inputPickRef = useRef(null);
    const inputCamRef = useRef(null);
    const [preview, setPreview] = useState({ open: false, url: "", title: "", mime: "" });

    const openPreview = (ev) => {
        const url = resolveMediaUrl(ev?.archivo);
        if (!url) return;
        setPreview({ open: true, url, title: ev?.nombre_original || "Evidencia", mime: ev?.tipo_mime || "" });
    };
    const closePreview = () => setPreview({ open: false, url: "", title: "", mime: "" });

    return (
        <div className="space-y-3">
            <input ref={inputPickRef} type="file" multiple accept="image/*,video/*,.pdf" className="hidden"
                onChange={(e) => { const f = Array.from(e.target.files || []); e.target.value = ""; if (f.length) onSubir?.(f); }} />
            <input ref={inputCamRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => { const f = Array.from(e.target.files || []); e.target.value = ""; if (f.length) onSubir?.(f); }} />

            <div className="grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={() => inputCamRef.current?.click()} disabled={disabled}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-neutral-100 disabled:opacity-60">
                    <Camera className="h-4 w-4" /> Tomar foto
                </button>
                <button type="button" onClick={() => inputPickRef.current?.click()} disabled={disabled}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-neutral-100 disabled:opacity-60">
                    <UploadCloud className="h-4 w-4" /> Adjuntar archivos
                </button>
            </div>

            {(!evidencias || evidencias.length === 0) ? (
                <div className="rounded-lg border border-black/10 bg-neutral-100 p-4 text-sm text-slate-500">Sin evidencias.</div>
            ) : (
                <>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {evidencias.map((ev) => {
                            const url = resolveMediaUrl(ev?.archivo);
                            const isImg = isImageMime(ev?.tipo_mime) || guessIsImageFromName(ev?.nombre_original);
                            return (
                                <div key={ev.id} className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg">
                                    <div className="relative aspect-[16/10] bg-neutral-100">
                                        {isImg && url ? (
                                            <img src={url} alt={ev?.nombre_original || "evidencia"} className="h-full w-full object-cover" loading="lazy"
                                                onError={(e) => { e.currentTarget.style.display = "none"; }} />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-slate-500">
                                                <FileText className="h-7 w-7" />
                                            </div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-2">
                                            <div className="truncate text-xs font-extrabold text-white">{ev?.nombre_original || "archivo"}</div>
                                            <div className="text-[11px] text-white/80">{formatBytes(ev?.tamano_bytes || 0)} • {ev?.tipo_mime || "—"}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-2 p-2">
                                        <div className="flex items-center gap-2">
                                            {url && (
                                                <button type="button" onClick={() => openPreview(ev)}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-extrabold text-black hover:bg-neutral-50">
                                                    <Eye className="h-4 w-4" /> Ver
                                                </button>
                                            )}
                                            {url && (
                                                <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(url); alert("Link copiado ✅"); } catch { alert("No se pudo copiar."); } }}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-extrabold text-black hover:bg-neutral-50">
                                                    <Copy className="h-4 w-4" /> Link
                                                </button>
                                            )}
                                        </div>
                                        <button type="button" disabled={disabled} onClick={() => onEliminar?.(ev)}
                                            className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-xs font-extrabold text-white hover:bg-red-600 disabled:opacity-60">
                                            <Trash2 className="h-4 w-4" /> Quitar
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <Modal open={preview.open} title={preview.title || "Evidencia"} onClose={closePreview}
                        footer={
                            <>
                                <button onClick={closePreview}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-black/10 bg-red-400 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">
                                    <X className="h-4 w-4" /> Cerrar
                                </button>
                                {preview.url && (
                                    <button onClick={() => window.open(preview.url, "_blank", "noopener,noreferrer")}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-bold text-white hover:bg-black/80">
                                        <Eye className="h-4 w-4" /> Abrir en pestaña
                                    </button>
                                )}
                            </>
                        }>
                        <div className="space-y-3">
                            {preview.url ? (
                                <div className="rounded-xl border border-black/10 bg-white p-3">
                                    {preview.mime.toLowerCase().startsWith("image/") ? (
                                        <img src={preview.url} alt={preview.title} className="mx-auto max-h-[60vh] w-auto rounded-lg object-contain" />
                                    ) : (
                                        <div className="text-sm text-slate-600">Este archivo no es imagen. Usa "Abrir en pestaña".</div>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-lg border border-black/10 bg-neutral-100 p-4 text-sm text-slate-500">No hay URL para previsualizar.</div>
                            )}
                            {preview.url && <div className="break-all text-xs text-slate-500">{preview.url}</div>}
                        </div>
                    </Modal>
                </>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
//  VISTA AGENDA
// ═══════════════════════════════════════════════════════════════════════════
const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
 
// Colores por turno del día: mañana / tarde / noche
function colorByHour(hora) {
    const h = parseInt(hora?.split(":")?.[0] ?? "12", 10);
    if (h < 12) return {
        pill: "bg-sky-500/20 border-sky-400/40 text-sky-300",
        dot:  "bg-sky-400",
        hover:"hover:bg-sky-500/30",
    };
    if (h < 18) return {
        pill: "bg-violet-500/20 border-violet-400/40 text-violet-300",
        dot:  "bg-violet-400",
        hover:"hover:bg-violet-500/30",
    };
    return {
        pill: "bg-amber-500/20 border-amber-400/40 text-amber-300",
        dot:  "bg-amber-400",
        hover:"hover:bg-amber-500/30",
    };
}
 
// Panel lateral con detalle del día seleccionado
function DayDetail({ day, month, year, eventos, onOpenEdit, onClose }) {
    if (!day) return null;
    const fecha = new Date(year, month, day);
    const label = fecha.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
 
    return (
        <div className="flex flex-col rounded-2xl border border-white/10 bg-[#1a1d27] overflow-hidden shadow-2xl shadow-black/50 h-full">
            {/* Header panel */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Detalle del día</p>
                    <p className="text-sm font-extrabold text-white capitalize">{label}</p>
                </div>
                <button
                    onClick={onClose}
                    className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
 
            {/* Eventos */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {eventos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 text-white/20">
                        <CalendarDays className="h-8 w-8" />
                        <span className="text-xs font-semibold">Sin citas este día</span>
                    </div>
                ) : (
                    eventos.map((r) => {
                        const hora = toDTLocal(r.fecha_hora_cita).slice(11, 16);
                        const c = colorByHour(hora);
                        return (
                            <button
                                key={r.id}
                                onClick={() => onOpenEdit(r)}
                                className={`w-full text-left rounded-xl border p-3 transition-all ${c.pill} ${c.hover}`}
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
                                    <span className="text-[11px] font-extrabold tracking-wide">{hora}</span>
                                </div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <User className="h-3 w-3 opacity-60 flex-shrink-0" />
                                    <span className="text-xs font-bold truncate text-white">
                                        {r?.cliente?.nombre || "—"}
                                    </span>
                                </div>
                                {r.auto_interes && (
                                    <div className="flex items-center gap-1.5">
                                        <Car className="h-3 w-3 opacity-60 flex-shrink-0" />
                                        <span className="text-[11px] opacity-70 truncate">{r.auto_interes}</span>
                                    </div>
                                )}
                                {r.asesor_piso && (
                                    <div className="mt-1.5 text-[10px] opacity-50 truncate">
                                        Asesor: {r.asesor_piso.split(" ").slice(0, 2).join(" ")}
                                    </div>
                                )}
                            </button>
                        );
                    })
                )}
            </div>
 
            {/* Footer */}
            <div className="px-4 py-2 border-t border-white/10 text-[10px] text-white/30 font-semibold">
                {eventos.length} cita{eventos.length !== 1 ? "s" : ""}
            </div>
        </div>
    );
}
 
export function AgendaView({ registros, onOpenEdit }) {
    const hoy = new Date();
    const [year, setYear]       = useState(hoy.getFullYear());
    const [month, setMonth]     = useState(hoy.getMonth());
    const [selectedDay, setSelectedDay] = useState(null);
 
    const primerDia   = new Date(year, month, 1).getDay();
    const diasEnMes   = new Date(year, month + 1, 0).getDate();
 
    // mapa día → registros del mes actual
    const byDay = useMemo(() => {
        const map = {};
        registros.forEach((r) => {
            if (!r.fecha_hora_cita) return;
            const d = new Date(r.fecha_hora_cita);
            if (d.getFullYear() === year && d.getMonth() === month) {
                const key = d.getDate();
                if (!map[key]) map[key] = [];
                map[key].push(r);
            }
        });
        return map;
    }, [registros, year, month]);
 
    const prevMonth = () => {
        if (month === 0) { setMonth(11); setYear((y) => y - 1); }
        else setMonth((m) => m - 1);
        setSelectedDay(null);
    };
    const nextMonth = () => {
        if (month === 11) { setMonth(0); setYear((y) => y + 1); }
        else setMonth((m) => m + 1);
        setSelectedDay(null);
    };
 
    const cells = [];
    for (let i = 0; i < primerDia; i++) cells.push(null);
    for (let d = 1; d <= diasEnMes; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
 
    const esHoy = (d) =>
        d === hoy.getDate() && month === hoy.getMonth() && year === hoy.getFullYear();
 
    const totalMes = Object.values(byDay).flat().length;
    const selectedEventos = selectedDay ? (byDay[selectedDay] || []) : [];
 
    // Mini badge con colorByHour para el primer evento del día
    function DayDots({ eventos }) {
        if (!eventos?.length) return null;
        const show = eventos.slice(0, 3);
        return (
            <div className="flex gap-0.5 mt-1 justify-center">
                {show.map((r, i) => {
                    const hora = toDTLocal(r.fecha_hora_cita).slice(11, 16);
                    return (
                        <span
                            key={i}
                            className={`h-1.5 w-1.5 rounded-full ${colorByHour(hora).dot}`}
                        />
                    );
                })}
                {eventos.length > 3 && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                )}
            </div>
        );
    }
 
    return (
        <div
            className="rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
            style={{ background: "#151516" }}
        >
            {/* ── Top bar ────────────────────────────────────────────────── */}
            <div
                className="px-5 py-4 flex items-center justify-between border-b border-white/10"
                style={{ background: "linear-gradient(135deg,#1a1d27 0%,#0f1117 100%)" }}
            >
                {/* Mes / año */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={prevMonth}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="text-center">
                        <p className="text-lg font-extrabold text-white tracking-tight">
                            {MESES[month]}
                        </p>
                        <p className="text-xs font-bold text-white/30 -mt-0.5">{year}</p>
                    </div>
                    <button
                        onClick={nextMonth}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
 
                {/* KPI pills */}
                <div className="hidden sm:flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1">
                        <CalendarDays className="h-3.5 w-3.5 text-violet-400" />
                        <span className="text-xs font-extrabold text-violet-300">{totalMes} este mes</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1">
                        <Clock className="h-3.5 w-3.5 text-sky-400" />
                        <span className="text-xs font-extrabold text-sky-300">{byDay[hoy.getDate()]?.length ?? 0} hoy</span>
                    </div>
                </div>
 
                {/* Leyenda turnos */}
                <div className="hidden lg:flex items-center gap-3 text-[10px] font-bold">
                    {[
                        { dot: "bg-sky-400",    label: "Mañana" },
                        { dot: "bg-violet-400", label: "Tarde" },
                        { dot: "bg-amber-400",  label: "Noche" },
                    ].map(({ dot, label }) => (
                        <div key={label} className="flex items-center gap-1 text-white/40">
                            <span className={`h-2 w-2 rounded-full ${dot}`} />
                            {label}
                        </div>
                    ))}
                </div>
            </div>
 
            {/* ── Cuerpo: calendario + panel lateral ─────────────────────── */}
            <div className={`flex gap-0 ${selectedDay ? "lg:grid lg:grid-cols-[1fr_280px]" : ""}`}>
 
                {/* Calendario */}
                <div className="flex-1 min-w-0">
                    {/* Cabecera días semana */}
                    <div className="grid grid-cols-7 border-b border-white/10">
                        {DIAS_SEMANA.map((d) => (
                            <div
                                key={d}
                                className="py-2.5 text-center text-[10px] font-extrabold tracking-widest uppercase"
                                style={{ color: "rgba(255,255,255,0.25)" }}
                            >
                                {d}
                            </div>
                        ))}
                    </div>
 
                    {/* Celdas */}
                    <div className="grid grid-cols-7 divide-x divide-y divide-white/5">
                        {cells.map((day, idx) => {
                            const eventos = day ? (byDay[day] || []) : [];
                            const isSelected = day === selectedDay;
                            const isToday    = day ? esHoy(day) : false;
                            const hasEvents  = eventos.length > 0;
 
                            return (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        if (!day) return;
                                        setSelectedDay(day === selectedDay ? null : day);
                                    }}
                                    className={[
                                        "min-h-[72px] sm:min-h-[88px] p-1.5 flex flex-col transition-all",
                                        !day
                                            ? "bg-transparent opacity-20 pointer-events-none"
                                            : isSelected
                                            ? "bg-violet-600/20 cursor-pointer"
                                            : hasEvents
                                            ? "cursor-pointer hover:bg-white/5"
                                            : "cursor-default hover:bg-white/[0.02]",
                                    ].join(" ")}
                                >
                                    {day && (
                                        <>
                                            {/* Número */}
                                            <div
                                                className={[
                                                    "self-center h-6 w-6 flex items-center justify-center rounded-full text-xs font-extrabold mb-1 transition-all",
                                                    isToday
                                                        ? "bg-violet-500 text-white shadow shadow-violet-500/50"
                                                        : isSelected
                                                        ? "bg-violet-400/30 text-violet-300"
                                                        : hasEvents
                                                        ? "text-white"
                                                        : "text-white/30",
                                                ].join(" ")}
                                            >
                                                {day}
                                            </div>
 
                                            {/* Eventos: pills en desktop, dots en mobile */}
                                            <div className="hidden sm:flex flex-col gap-0.5">
                                                {eventos.slice(0, 2).map((r) => {
                                                    const hora = toDTLocal(r.fecha_hora_cita).slice(11, 16);
                                                    const c = colorByHour(hora);
                                                    return (
                                                        <button
                                                            key={r.id}
                                                            onClick={(e) => { e.stopPropagation(); onOpenEdit(r); }}
                                                            title={r?.cliente?.nombre || "—"}
                                                            className={`w-full rounded-md border px-1.5 py-0.5 text-left text-[9px] font-bold truncate transition-all ${c.pill} ${c.hover}`}
                                                        >
                                                            {hora} {r?.cliente?.nombre?.split(" ")[0] || "—"}
                                                        </button>
                                                    );
                                                })}
                                                {eventos.length > 2 && (
                                                    <div className="text-[9px] font-extrabold text-white/30 pl-1">
                                                        +{eventos.length - 2}
                                                    </div>
                                                )}
                                            </div>
 
                                            {/* Mobile: solo dots */}
                                            <div className="sm:hidden">
                                                <DayDots eventos={eventos} />
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
 
                    {/* Footer */}
                    <div
                        className="flex items-center justify-between px-4 py-2 border-t border-white/5 text-[10px] font-bold text-white/20"
                    >
                        <span>{totalMes} prueba{totalMes !== 1 ? "s" : ""} en {MESES[month]}</span>
                        <span className="hidden sm:inline">Clic en un día para ver detalle</span>
                    </div>
                </div>
 
                {/* Panel lateral (desktop) */}
                {selectedDay && (
                    <div className="hidden lg:flex border-l border-white/10 p-3">
                        <DayDetail
                            day={selectedDay}
                            month={month}
                            year={year}
                            eventos={selectedEventos}
                            onOpenEdit={onOpenEdit}
                            onClose={() => setSelectedDay(null)}
                        />
                    </div>
                )}
            </div>
 
            {/* Panel lateral mobile (drawer abajo) */}
            {selectedDay && (
                <div className="lg:hidden border-t border-white/10 p-3" style={{ background: "#0f1117" }}>
                    <DayDetail
                        day={selectedDay}
                        month={month}
                        year={year}
                        eventos={selectedEventos}
                        onOpenEdit={onOpenEdit}
                        onClose={() => setSelectedDay(null)}
                    />
                </div>
            )}
        </div>
    );
}
// ═══════════════════════════════════════════════════════════════════════════
//  VISTA GRÁFICAS
// ═══════════════════════════════════════════════════════════════════════════
const CHART_COLORS = ["#000000", "#404040", "#737373", "#a3a3a3", "#d4d4d4", "#e5e5e5"];

function GraficasView({ registros }) {
    // Por vehículo
    const porVehiculo = useMemo(() => {
        const map = {};
        registros.forEach((r) => {
            const k = r.auto_interes || "Sin especificar";
            map[k] = (map[k] || 0) + 1;
        });
        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [registros]);

    // Por asesor
    const porAsesor = useMemo(() => {
        const map = {};
        registros.forEach((r) => {
            const k = r.asesor_piso || "Sin asignar";
            const short = k.split(" ").slice(0, 2).join(" ");
            map[short] = (map[short] || 0) + 1;
        });
        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [registros]);

    // Por mes (últimos 6)
    const porMes = useMemo(() => {
        const map = {};
        registros.forEach((r) => {
            if (!r.fecha_hora_cita) return;
            const d = new Date(r.fecha_hora_cita);
            const key = `${MESES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
            map[key] = (map[key] || 0) + 1;
        });
        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .slice(-6);
    }, [registros]);

    // Asistencia
    const asistencia = useMemo(() => {
        const si = registros.filter((r) => r.asistencia).length;
        const no = registros.length - si;
        return [
            { name: "Asistió", value: si },
            { name: "No asistió", value: no },
        ];
    }, [registros]);

    const total = registros.length;
    const asistieron = registros.filter((r) => r.asistencia).length;

    return (
        <div className="space-y-6">
            {/* KPI cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                {[
                    { label: "Total pruebas", value: total, icon: CarFront },
                    { label: "Asistencias", value: asistieron, icon: CheckCircle2 },
                    { label: "Pendientes", value: total - asistieron, icon: Clock },
                ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-4 rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white">
                            <Icon className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-extrabold text-black">{value}</div>
                            <div className="text-xs font-semibold text-black/50">{label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Pruebas por mes */}
                <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-extrabold text-black">Pruebas por mes</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={porMes} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#737373" }} />
                            <YAxis tick={{ fontSize: 11, fill: "#737373" }} allowDecimals={false} />
                            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e5e5", fontSize: 12 }} />
                            <Bar dataKey="value" name="Pruebas" fill="#000000" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Por vehículo */}
                <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-extrabold text-black">Por modelo de interés</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={porVehiculo} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: "#737373" }} allowDecimals={false} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#737373" }} width={80} />
                            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e5e5", fontSize: 12 }} />
                            <Bar dataKey="value" name="Pruebas" fill="#000000" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Por asesor */}
                <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-extrabold text-black">Por asesor de piso</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={porAsesor} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#737373" }} />
                            <YAxis tick={{ fontSize: 11, fill: "#737373" }} allowDecimals={false} />
                            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e5e5", fontSize: 12 }} />
                            <Bar dataKey="value" name="Pruebas" fill="#404040" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Asistencia pie */}
                <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-extrabold text-black">Tasa de asistencia</h3>
                    <div className="flex items-center justify-center gap-8">
                        <ResponsiveContainer width="50%" height={180}>
                            <PieChart>
                                <Pie data={asistencia} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                                    {asistencia.map((_, i) => (
                                        <Cell key={i} fill={CHART_COLORS[i]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e5e5", fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-3">
                            {asistencia.map((item, i) => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full" style={{ background: CHART_COLORS[i] }} />
                                    <span className="text-xs font-semibold text-black/70">{item.name}</span>
                                    <span className="text-sm font-extrabold text-black">{item.value}</span>
                                </div>
                            ))}
                            {total > 0 && (
                                <div className="pt-1 text-xs font-bold text-black/40">
                                    {Math.round((asistieron / total) * 100)}% asistencia
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export default function RegistroPruebaManejo() {
    const { user } = useAuth();

    const isAdmin = useMemo(() => {
        const permisos = user?.permisos || [];
        const rol = String(user?.rol || "").trim().toLowerCase();
        return rol === "administrador" || permisos.includes("CRM_DIGITALES") || permisos.includes("ALL") || permisos.includes("USUARIOS_ADMIN");
    }, [user]);

    const userAgencia = String(user?.agencia || "").trim();

    const [registros, setRegistros] = useState([]);

    // ── vista activa ────────────────────────────────────────────────────────
    const [activeView, setActiveView] = useState("tabla"); // "tabla" | "agenda" | "graficas"

    const VIEWS = [
        { key: "tabla",    label: "Tabla",    Icon: LayoutList },
        { key: "agenda",   label: "Agenda",   Icon: CalendarRange },
        { key: "graficas", label: "Gráficas", Icon: BarChart2 },
    ];

    const DEALERS  = ["Volvo"];
    const ASESORES = [
        "Enrique Vazquez Islas",
        "Ricardo Platas",
        "Verónica Del Rayo Galindo León",
        "Julio Camacho Barragán",
        "Fernanda Romero Aguilar",
    ];
    const VEHICULOS = [
        "EX30","EX40","EC40","EX90","XC60","XC90",
        "XC60 Black Edition","XC90 Black Edition","Seminuevos","Avaluo",
    ];

    const [ctxMenu, setCtxMenu] = useState({ open: false, x: 0, y: 0, row: null });
    const [sort, setSort] = useState({ key: "fecha_hora_cita", dir: "desc" });
    const toggleSort = (key) => setSort((prev) =>
        prev.key !== key ? { key, dir: "asc" } : { key, dir: prev.dir === "asc" ? "desc" : "asc" }
    );

    const [filters, setFilters] = useState({ q: "", agencia: "Todos", rangoDesde: "", rangoHasta: "" });
    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState("create");
    const [draft, setDraft] = useState(null);

    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);
    const [subiendoEvidencia, setSubiendoEvidencia] = useState(false);

    const REQUIRED = useMemo(() => ({ telefono: "Teléfono", fecha_hora_cita: "Fecha y hora" }), []);
    const [touchedSave, setTouchedSave] = useState(false);

    const missing = useMemo(() => {
        if (!draft) return [];
        return Object.keys(REQUIRED).filter((key) => {
            const v = draft[key];
            return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
        });
    }, [draft, REQUIRED]);

    const isInvalid = (key) => touchedSave && missing.includes(key);

    const telDigits     = useMemo(() => String(draft?.telefono || "").replace(/\D/g, ""), [draft?.telefono]);
    const telIs10       = useMemo(() => /^\d{10}$/.test(telDigits), [telDigits]);
    const telIs52Plus10 = useMemo(() => /^52\d{10}$/.test(telDigits), [telDigits]);
    const telIsOk       = telIs10 || telIs52Plus10;
    const telIsNormalized = telIs52Plus10;

    const telError = useMemo(() => {
        if (!openModal || !draft || !telDigits) return "";
        if (telIs10 || telIs52Plus10) return "";
        if (telDigits.length < 10) return "Número incompleto (mínimo 10 dígitos)";
        if (telDigits.length === 11) return "Número incorrecto (formato inválido)";
        if (telDigits.length === 12 && !telDigits.startsWith("52")) return "Para 12 dígitos debe iniciar con 52";
        if (telDigits.length > 12) return "Número incorrecto (máximo 12 dígitos)";
        return "Número inválido";
    }, [openModal, draft, telDigits, telIs10, telIs52Plus10]);

    const telInvalid = !!telError;

    const inputBase = "w-full rounded-lg border shadow-lg px-3 py-2 text-sm text-black font-semibold outline-none";
    const inputOk  = "border-black/10 bg-neutral-100";
    const inputBad = "border-red-500 bg-red-50";

    // context menu global close
    useEffect(() => {
        const close = () => setCtxMenu((p) => ({ ...p, open: false, row: null }));
        window.addEventListener("click", close);
        window.addEventListener("scroll", close, true);
        window.addEventListener("resize", close);
        return () => {
            window.removeEventListener("click", close);
            window.removeEventListener("scroll", close, true);
            window.removeEventListener("resize", close);
        };
    }, []);

    const onRowContextMenu = (e, row) => {
        e.preventDefault(); e.stopPropagation();
        setCtxMenu({ open: true, x: e.clientX, y: e.clientY, row });
    };

    const refreshList = async () => {
        setLoadingList(true);
        try {
            const data = await apiPruebaManejo.list();
            setRegistros(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); setRegistros([]); }
        finally { setLoadingList(false); }
    };

    useEffect(() => { refreshList(); }, []);

    const dealers = useMemo(() => {
        const set = new Set((registros || []).map((r) => normalizeStr(r.agencia)).filter(Boolean));
        if (!isAdmin && userAgencia) return ["Todos", userAgencia];
        return ["Todos", ...Array.from(set)];
    }, [registros, isAdmin, userAgencia]);

    const filtered = useMemo(() => {
        const q = filters.q.trim().toLowerCase();
        const desdeInt = ymdToInt(filters.rangoDesde);
        const hastaInt = ymdToInt(filters.rangoHasta);
        return (registros || []).filter((r) => {
            if (!isAdmin && userAgencia && normalizeStr(r.agencia) !== normalizeStr(userAgencia)) return false;
            const matchQ = !q ||
                normalizeStr(r.agencia).toLowerCase().includes(q) ||
                normalizeStr(r?.cliente?.nombre).toLowerCase().includes(q) ||
                normalizeStr(r?.cliente?.telefono).toLowerCase().includes(q) ||
                normalizeStr(r?.cliente?.correo).toLowerCase().includes(q) ||
                normalizeStr(r.auto_interes).toLowerCase().includes(q) ||
                normalizeStr(r.asesor_piso).toLowerCase().includes(q) ||
                normalizeStr(r.num_serie).toLowerCase().includes(q) ||
                normalizeStr(r.folio_salida).toLowerCase().includes(q) ||
                normalizeStr(r.comentarios_cliente).toLowerCase().includes(q);
            const matchAgencia = filters.agencia === "Todos" || normalizeStr(r.agencia) === normalizeStr(filters.agencia);
            let matchRango = true;
            if (desdeInt !== null || hastaInt !== null) {
                const ymdInt = ymdToInt(r.fecha_hora_cita ? toYMDLocal(r.fecha_hora_cita) : "");
                if (!ymdInt) return false;
                if (desdeInt !== null && ymdInt < desdeInt) matchRango = false;
                if (hastaInt !== null && ymdInt > hastaInt) matchRango = false;
            }
            return matchQ && matchAgencia && matchRango;
        });
    }, [registros, filters, isAdmin, userAgencia]);

    const sorted = useMemo(() => {
        const data = [...filtered];
        const { key, dir } = sort;
        if (!key) return data;
        const mult = dir === "asc" ? 1 : -1;
        return data.sort((a, b) => {
            if (key === "fecha_hora_cita") {
                const ta = a.fecha_hora_cita ? new Date(a.fecha_hora_cita).getTime() : 0;
                const tb = b.fecha_hora_cita ? new Date(b.fecha_hora_cita).getTime() : 0;
                return (ta - tb) * mult;
            }
            const va = normalizeStr(a?.[key]).toLowerCase();
            const vb = normalizeStr(b?.[key]).toLowerCase();
            if (va < vb) return -1 * mult;
            if (va > vb) return 1 * mult;
            return 0;
        });
    }, [filtered, sort]);

    const openCreate = () => {
        setTouchedSave(false);
        setMode("create");
        setDraft({
            id: null, agencia: isAdmin ? "" : userAgencia,
            nombre: "", telefono: "", correo: "",
            auto_interes: "", fecha_hora_cita: "", asistencia: false,
            num_serie: "", asesor_piso: "", folio_salida: "", comentarios_cliente: "",
            evidencias: [],
        });
        setOpenModal(true);
    };

    const openEdit = async (row) => {
        if (!row?.id) return;
        try {
            setTouchedSave(false); setMode("edit"); setLoadingDetail(true); setOpenModal(true);
            const c = await apiPruebaManejo.get(row.id);
            if (!isAdmin && userAgencia && normalizeStr(c.agencia) !== normalizeStr(userAgencia)) {
                alert("No tienes permisos para ver registros de otra agencia.");
                setOpenModal(false); return;
            }
            setDraft({
                id: c.id, agencia: c.agencia || (isAdmin ? "" : userAgencia),
                nombre: c?.cliente?.nombre || "", telefono: c?.cliente?.telefono || "", correo: c?.cliente?.correo || "",
                auto_interes: c.auto_interes || "", fecha_hora_cita: toDTLocal(c.fecha_hora_cita), asistencia: !!c.asistencia,
                num_serie: c.num_serie || "", asesor_piso: c.asesor_piso || "",
                folio_salida: c.folio_salida || "", comentarios_cliente: c.comentarios_cliente || "",
                evidencias: Array.isArray(c.evidencias) ? c.evidencias : [],
            });
        } catch (e) {
            console.error(e); alert("No se pudo abrir el registro."); setOpenModal(false);
        } finally { setLoadingDetail(false); }
    };

    const closeModal = () => {
        if (saving || subiendoEvidencia) return;
        setOpenModal(false); setDraft(null);
    };

    const eliminarRegistro = async (row) => {
        if (!row?.id) return;
        if (!isAdmin && userAgencia && normalizeStr(row.agencia) !== normalizeStr(userAgencia)) {
            alert("No tienes permisos para eliminar registros de otra agencia."); return;
        }
        const nombre = row?.cliente?.nombre || row?.cliente?.telefono || "esta prueba";
        if (!confirm(`¿Eliminar la prueba de manejo de ${nombre}? Esta acción no se puede deshacer.`)) return;
        try {
            await apiPruebaManejo.remove(row.id);
            setRegistros((prev) => prev.filter((x) => x.id !== row.id));
            setCtxMenu({ open: false, x: 0, y: 0, row: null });
        } catch (e) { console.error(e); alert("No se pudo eliminar."); }
    };

    const save = async () => {
        if (!draft || saving) return;
        setTouchedSave(true);
        if (missing.length || !telIsOk || telInvalid) return;
        setSaving(true);
        try {
            const agenciaFinal = isAdmin ? normalizeStr(draft.agencia || "") : userAgencia;
            const payload = {
                agencia: agenciaFinal, nombre: draft.nombre || "",
                telefono: normalizeStr(draft.telefono), correo: draft.correo || "",
                auto_interes: draft.auto_interes || "",
                fecha_hora_cita: fromDTLocalToISO(draft.fecha_hora_cita),
                asistencia: !!draft.asistencia, num_serie: draft.num_serie || "",
                asesor_piso: draft.asesor_piso || "", folio_salida: draft.folio_salida || "",
                comentarios_cliente: draft.comentarios_cliente || "",
            };
            let saved;
            if (mode === "create") saved = await apiPruebaManejo.create(payload);
            else saved = await apiPruebaManejo.update(draft.id, payload);
            await refreshList();
            if (mode === "create" && saved?.id) {
                const detalle = await apiPruebaManejo.get(saved.id);
                setDraft((p) => ({ ...p, id: detalle.id, evidencias: Array.isArray(detalle.evidencias) ? detalle.evidencias : [] }));
                setMode("edit"); return;
            }
            closeModal();
        } catch (e) { console.error(e); alert("Error guardando."); }
        finally { setSaving(false); }
    };

    const [updatingInline, setUpdatingInline] = useState({});
    const toggleAsistenciaInline = async (row) => {
        const id = row?.id; if (!id) return;
        const prev = !!row.asistencia;
        setRegistros((p) => p.map((c) => (c.id === id ? { ...c, asistencia: !prev } : c)));
        setUpdatingInline((p) => ({ ...p, [id]: true }));
        try { await apiPruebaManejo.patch(id, { asistencia: !prev }); }
        catch (e) {
            console.error(e);
            setRegistros((p) => p.map((c) => (c.id === id ? { ...c, asistencia: prev } : c)));
            alert("No se pudo actualizar.");
        }
        finally { setUpdatingInline((p) => { const n = { ...p }; delete n[id]; return n; }); }
    };

    const subirEvidencias = async (files) => {
        if (!draft?.id) { alert("Primero guarda la prueba para poder adjuntar evidencias."); return; }
        setSubiendoEvidencia(true);
        try {
            for (const f of files) await apiEvidenciasPruebaManejo.create({ id_prueba_manejo: draft.id, archivo: f });
            const detalle = await apiPruebaManejo.get(draft.id);
            setDraft((p) => ({ ...p, evidencias: Array.isArray(detalle.evidencias) ? detalle.evidencias : [] }));
        } catch (e) { console.error(e); alert("No se pudieron subir evidencias."); }
        finally { setSubiendoEvidencia(false); }
    };

    const eliminarEvidencia = async (ev) => {
        if (!confirm(`¿Eliminar evidencia "${ev?.nombre_original || "archivo"}"?`)) return;
        setSubiendoEvidencia(true);
        try {
            await apiEvidenciasPruebaManejo.remove(ev.id);
            const detalle = await apiPruebaManejo.get(draft.id);
            setDraft((p) => ({ ...p, evidencias: Array.isArray(detalle.evidencias) ? detalle.evidencias : [] }));
        } catch (e) { console.error(e); alert("No se pudo eliminar evidencia."); }
        finally { setSubiendoEvidencia(false); }
    };

    const resetFilters = () => setFilters({ q: "", agencia: "Todos", rangoDesde: "", rangoHasta: "" });
    const setHoy = () => { const hoy = toYMDLocal(new Date()); setFilters((p) => ({ ...p, rangoDesde: hoy, rangoHasta: hoy })); };

    // ════════════════════════════════════════════════════════════════════════
    return (
        <div className="w-full">
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div
    className="relative mb-4 overflow-hidden rounded-xl shadow-lg"
    style={{ background: "linear-gradient(135deg, #161a1f 0%, #00060c 55%, #2a3a4e 100%)" }}
>
    {/* Destellos decorativos */}
    <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -left-24 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-0 right-1/4 h-28 w-28 rounded-full bg-blue-300/5 blur-2xl" />
    </div>
 
    <div className="relative px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 
            {/* Título */}
            <div className="min-w-0">
                <h2 className="truncate text-lg font-extrabold text-white sm:text-xl">
                    Pruebas de Manejo
                </h2>
                <p className="mt-1 text-sm text-white/60">
                    Doble clic en la tabla para editar un registro.
                </p>
                {!isAdmin && userAgencia && (
                    <p className="mt-1 text-xs font-semibold text-white/40">
                        Agencia asignada: <span className="text-white/70">{userAgencia}</span>
                    </p>
                )}
            </div>
 
            {/* Controles: toggle vistas + botón nuevo */}
            <div className="flex items-center gap-2">
                {/* Toggle de vistas */}
                <div className="flex overflow-hidden rounded-lg border border-white/20 bg-white/10 p-0.5 backdrop-blur-sm">
                    {VIEWS.map(({ key, label, Icon }) => {
                        const active = activeView === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setActiveView(key)}
                                className={[
                                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all",
                                    active
                                        ? "bg-white text-[#1e2a38] shadow"
                                        : "text-white/70 hover:bg-white/15 hover:text-white",
                                ].join(" ")}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {label}
                            </button>
                        );
                    })}
                </div>
 
                {/* Botón nuevo */}
                <button
                    onClick={openCreate}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white hover:text-[#1e2a38]"
                >
                    <Plus className="h-4 w-4" />
                    Nueva Prueba
                </button>
            </div>
        </div>
 
        {/* Separador */}
        <div className="mt-5 h-px w-full bg-gradient-to-r from-white/5 via-white/20 to-white/5" />
    </div>
</div>

            {/* ── Filtros ─────────────────────────────────────────────────── */}
            <div className="mb-4 rounded-lg border border-black/10 bg-white/[0.03] p-3">
                <div className="grid gap-3 md:grid-cols-12">
                    <div className="md:col-span-6">
                        <FilterBlock label="Búsqueda">
                            <div className="flex items-center gap-2 rounded-lg border border-black bg-white px-3 py-2">
                                <Search className="h-4 w-4 text-black" />
                                <input
                                    value={filters.q}
                                    onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                                    placeholder="Buscar por dealer, cliente, teléfono, serie, folio, asesor…"
                                    className="w-full text-sm text-black outline-none placeholder:text-black/40"
                                />
                                {filters.q && (
                                    <button onClick={() => setFilters((p) => ({ ...p, q: "" }))}
                                        className="rounded-lg p-1 text-black hover:text-red-500">
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-3">
                        <FilterBlock label="Dealer">
                            <select value={filters.agencia} onChange={(e) => setFilters((p) => ({ ...p, agencia: e.target.value }))}
                                className="w-full rounded-lg border border-black bg-white px-3 py-2 text-sm text-black outline-none">
                                {dealers.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-3">
                        <FilterBlock label="Acciones">
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={setHoy}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700">
                                    <CalendarDays className="h-4 w-4" /> Hoy
                                </button>
                                <button onClick={resetFilters}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-black px-3 py-2 text-sm font-semibold bg-white text-black hover:bg-black hover:text-white">
                                    <X className="h-4 w-4" /> Limpiar
                                </button>
                            </div>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-6">
                        <FilterBlock label="Desde">
                            <input type="date" value={filters.rangoDesde}
                                onChange={(e) => setFilters((p) => ({ ...p, rangoDesde: e.target.value }))}
                                className="w-full rounded-lg border border-black bg-white px-3 py-2 text-sm text-black outline-none" />
                        </FilterBlock>
                    </div>
                    <div className="md:col-span-6">
                        <FilterBlock label="Hasta">
                            <input type="date" value={filters.rangoHasta}
                                onChange={(e) => setFilters((p) => ({ ...p, rangoHasta: e.target.value }))}
                                className="w-full rounded-lg border border-black bg-white px-3 py-2 text-sm text-black outline-none" />
                        </FilterBlock>
                    </div>
                </div>
            </div>

            {/* ── VISTAS ──────────────────────────────────────────────────── */}

            {/* ── VISTA AGENDA ── */}
            {activeView === "agenda" && (
                <AgendaView registros={filtered} onOpenEdit={openEdit} />
            )}

            {/* ── VISTA GRÁFICAS ── */}
            {activeView === "graficas" && (
                <GraficasView registros={filtered} />
            )}

            {/* ── VISTA TABLA ── */}
            {activeView === "tabla" && (
                <>
                    {/* Desktop */}
                    <div className="hidden overflow-hidden rounded-lg shadow-lg bg-white/[0.03] lg:block">
                        <div className="overflow-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="text-xs bg-black text-white border border-black">
                                    <tr>
                                        {[
                                            { key: "fecha_hora_cita", label: "Fecha y Hora", sortable: true },
                                            { key: "agencia", label: "Dealer", sortable: true },
                                            { key: null, label: "Cliente" },
                                            { key: null, label: "Auto interés" },
                                            { key: null, label: "Asesor piso" },
                                            { key: null, label: "No. Serie" },
                                            { key: null, label: "Folio Pase Salida" },
                                        ].map(({ key, label, sortable }) => (
                                            <th key={label} className="px-4 py-3">
                                                {sortable ? (
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
                                <tbody className="divide-y divide-black/30">
                                    {loadingList ? (
                                        Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                                    ) : (
                                        <>
                                            {sorted.map((row) => (
                                                <tr key={row.id}
                                                    onDoubleClick={() => openEdit(row)}
                                                    onContextMenu={(e) => onRowContextMenu(e, row)}
                                                    className="cursor-pointer hover:bg-white/[0.04]"
                                                    title="Doble clic para editar">
                                                    <td className="px-4 py-3 text-black">{row.fecha_hora_cita ? toDTLocal(row.fecha_hora_cita).replace("T", " ") : "—"}</td>
                                                    <td className="px-4 py-3 font-semibold text-black">{row.agencia || "—"}</td>
                                                    <td className="px-4 py-3 text-black"><div className="font-bold">{row?.cliente?.nombre || "—"}</div></td>
                                                    <td className="px-4 py-3 text-black">{row.auto_interes || "—"}</td>
                                                    <td className="px-4 py-3 text-black">{row.asesor_piso || "—"}</td>
                                                    <td className="px-4 py-3 text-black">{row.num_serie || "—"}</td>
                                                    <td className="px-4 py-3 text-black">{row.folio_salida || "—"}</td>
                                                </tr>
                                            ))}
                                            {sorted.length === 0 && (
                                                <tr><td colSpan={8} className="px-4 py-10 text-center text-black/40">No hay resultados con esos filtros.</td></tr>
                                            )}
                                        </>
                                    )}
                                </tbody>
                            </table>
                            <ContextMenu ctxMenu={ctxMenu}
                                onDelete={async (row) => { await eliminarRegistro(row); setCtxMenu({ open: false, x: 0, y: 0, row: null }); }}
                                onClose={() => setCtxMenu({ open: false, x: 0, y: 0, row: null })} />
                        </div>
                    </div>

                    {/* Mobile */}
                    <div className="grid gap-3 lg:hidden">
                        {loadingList ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm">
                                    <Skeleton className="h-4 w-48" /><Skeleton className="mt-2 h-3 w-36" />
                                    <Skeleton className="mt-3 h-3 w-full" /><Skeleton className="mt-2 h-3 w-3/4" />
                                </div>
                            ))
                        ) : (
                            <>
                                {sorted.map((row) => (
                                    <button key={row.id} onClick={() => openEdit(row)}
                                        className="text-left rounded-3xl border border-black/10 bg-white p-4 shadow-sm hover:bg-slate-50">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-extrabold text-black">{row?.cliente?.nombre || "—"}</div>
                                                <div className="mt-1 text-xs text-slate-600">{row.agencia || "—"} • {row?.cliente?.telefono || "—"}</div>
                                                <div className="mt-1 text-xs text-slate-600">{row.fecha_hora_cita ? toDTLocal(row.fecha_hora_cita).replace("T", " ") : "—"}</div>
                                                <div className="mt-1 text-xs text-slate-600">Serie: {row.num_serie || "—"} • Folio: {row.folio_salida || "—"}</div>
                                            </div>
                                        </div>
                                        <div className="mt-3 text-sm text-slate-700 line-clamp-3">{row.comentarios_cliente || "—"}</div>
                                        <div className="mt-3 text-xs text-slate-500">Toca para editar</div>
                                    </button>
                                ))}
                                {sorted.length === 0 && (
                                    <div className="rounded-3xl border border-black/10 bg-white p-10 text-center text-slate-600">No hay resultados.</div>
                                )}
                            </>
                        )}
                    </div>
                </>
            )}

            {/* ── MODAL ──────────────────────────────────────────────────── */}
            <Modal
                open={openModal}
                title={mode === "create" ? "Nueva Prueba de Manejo" : `Editar • ${draft?.id}`}
                onClose={closeModal}
                footer={
                    <>
                        <button onClick={closeModal} disabled={saving || subiendoEvidencia}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-red-400 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60">
                            <X className="h-4 w-4" /> Cancelar
                        </button>
                        <button onClick={save}
                            disabled={saving || loadingDetail || subiendoEvidencia || telInvalid || (draft?.telefono ? !telIsOk : false)}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black px-4 py-2 text-sm font-bold text-white hover:bg-black/80 disabled:opacity-60">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? "Guardando..." : mode === "create" ? "Guardar y continuar" : "Guardar cambios"}
                        </button>
                    </>
                }
            >
                {loadingDetail ? <ModalSkeleton /> : !draft ? null : (
                    <div className="grid gap-3 md:grid-cols-3">
                        <Field label="Dealer" icon={Building2}>
                            <select value={draft.agencia || ""} onChange={(e) => setDraft((p) => ({ ...p, agencia: e.target.value }))}
                                disabled={!isAdmin} className={[inputBase, inputOk, !isAdmin ? "opacity-75 cursor-not-allowed" : ""].join(" ")}>
                                <option value="" disabled>Selecciona un dealer...</option>
                                {(isAdmin ? DEALERS : (userAgencia ? [userAgencia] : DEALERS)).map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </Field>

                        <Field label="Prospecto" icon={User}>
                            <input value={draft.nombre} onChange={(e) => setDraft((p) => ({ ...p, nombre: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")} placeholder="Nombre completo" />
                        </Field>

                        <Field label="Teléfono" icon={Phone}>
                            <input maxLength={12} value={draft.telefono || ""}
                                onChange={(e) => setDraft((p) => ({ ...p, telefono: e.target.value.replace(/\D/g, "").slice(0, 12) }))}
                                disabled={telIsNormalized}
                                className={[inputBase, (isInvalid("telefono") || telInvalid) ? inputBad : inputOk, telIsNormalized ? "opacity-75 cursor-not-allowed" : ""].join(" ")} />
                            {isInvalid("telefono") && <div className="mt-2 text-xs font-bold text-red-600">Teléfono es requerido.</div>}
                            {!isInvalid("telefono") && telError && <div className="mt-2 text-xs font-bold text-red-600">{telError}</div>}
                        </Field>

                        <Field label="Correo" icon={Mail}>
                            <input value={draft.correo} onChange={(e) => setDraft((p) => ({ ...p, correo: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")} placeholder="Correo" />
                        </Field>

                        <Field label="Modelo de interés" icon={CarFront}>
                            <select value={draft.auto_interes || ""} onChange={(e) => setDraft((p) => ({ ...p, auto_interes: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")}>
                                <option value="" disabled>Selecciona un modelo...</option>
                                {VEHICULOS.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </Field>

                        <Field label="Fecha y Hora" icon={CalendarDays}>
                            <input type="datetime-local" value={draft.fecha_hora_cita}
                                onChange={(e) => setDraft((p) => ({ ...p, fecha_hora_cita: e.target.value }))}
                                className={[inputBase, isInvalid("fecha_hora_cita") ? inputBad : inputOk].join(" ")} />
                            {isInvalid("fecha_hora_cita") && <div className="mt-2 text-xs font-bold text-red-600">Fecha y hora es requerido.</div>}
                        </Field>

                        <Field label="Asesor Piso" icon={UserStar}>
                            <select value={draft.asesor_piso || ""} onChange={(e) => setDraft((p) => ({ ...p, asesor_piso: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")}>
                                <option value="" disabled>Selecciona un asesor...</option>
                                {ASESORES.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </Field>

                        <Field label="No. Serie" icon={Hash}>
                            <input value={draft.num_serie} onChange={(e) => setDraft((p) => ({ ...p, num_serie: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")} placeholder="Ej. 3VWSA..." />
                        </Field>

                        <Field label="Folio Pase de Salida" icon={FileText}>
                            <input value={draft.folio_salida} onChange={(e) => setDraft((p) => ({ ...p, folio_salida: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")} />
                        </Field>

                        <div className="md:col-span-3">
                            <Field label="Comentarios del cliente" icon={MessageSquareText}>
                                <textarea value={draft.comentarios_cliente}
                                    onChange={(e) => setDraft((p) => ({ ...p, comentarios_cliente: e.target.value }))}
                                    className={[inputBase, inputOk, "min-h-[80px]"].join(" ")}
                                    placeholder="Notas / comentarios del cliente..." />
                            </Field>
                        </div>

                        <div className="md:col-span-3">
                            <Field label="Evidencias" icon={Camera}>
                                <EvidenciasUploader evidencias={draft.evidencias || []} disabled={saving || subiendoEvidencia}
                                    onSubir={subirEvidencias} onEliminar={eliminarEvidencia} />
                                {!draft.id && (
                                    <div className="mt-2 text-xs font-semibold text-slate-600">
                                        * Guarda primero la prueba para poder adjuntar evidencias.
                                    </div>
                                )}
                            </Field>
                        </div>

                        {subiendoEvidencia && (
                            <div className="md:col-span-3 rounded-lg border border-black/10 bg-white p-3">
                                <div className="flex items-center gap-2 text-black font-bold">
                                    <Loader2 className="h-5 w-5 animate-spin" /> Procesando evidencias...
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}