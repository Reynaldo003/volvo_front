// src/pages/PruebasManejo/RegistroPruebaManejo.jsx
import { useMemo, useState, useEffect, useRef } from "react";
import {
    Plus, Search, X, Save, User, CarFront, CalendarDays,
    ArrowUpDown, ChevronDown, ChevronUp, Trash2, Loader2,
    Phone, Mail, FileText, Hash, Building2, MessageSquareText,
    Camera, Eye, UploadCloud, Copy, LayoutList, CalendarRange,
    BarChart2, CheckCircle2, Clock, ChevronLeft, ChevronRight,
    MoreVertical, CalendarCheck, TrendingUp,
} from "lucide-react";
import { apiPruebaManejo, apiEvidenciasPruebaManejo } from "../../lib/apiPruebaManejo";
import { createPortal } from "react-dom";
import { useAuth } from "../../auth/AuthContext";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, PieChart, Pie, Cell, LineChart, Line,
    AreaChart, Area, RadialBarChart, RadialBar, Legend,
} from "recharts";

/* ─────────────────────────────────────────────────────────────
   TOKENS
───────────────────────────────────────────────────────────── */
const C = {
    // oscuros principales (sin azul)
    dark: "#0d0d0d",
    dark2: "#1a1a1a",
    dark3: "#2a2a2a",
    accent: "#ffffff",
    // texto
    navy: "#0d0d0d",
    sub: "#64748B",
    border: "#E8ECF4",
    bg: "#F4F6FB",
    white: "#FFFFFF",
    // estatus pills
    pill: {
        pending: "#FFF7ED", pendingT: "#C2410C",
        assist: "#F0FDF4", assistT: "#15803D",
        noshow: "#FFF1F2", noshowT: "#BE123C",
    },
    // gráficas — escala monocromática oscura con contrastes
    chart: ["#0d0d0d", "#3a3a3a", "#5a5a5a", "#8a8a8a", "#b0b0b0"],
    green: "#22c55e",
    greenHov: "#16a34a",
};

const API_BASE = import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";

/* ─────────────────────────────────────────────────────────────
   UTILS
───────────────────────────────────────────────────────────── */
function normalizeStr(v) { return String(v ?? "").trim(); }
function toDTLocal(iso) {
    if (!iso) return "";
    const s = String(iso);
    if (s.endsWith("Z")) {
        const d = new Date(s); if (isNaN(d)) return "";
        const p = n => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16);
    return "";
}
function fromDTLocalToISO(v) { return String(v || "").trim() || null; }
function toYMDLocal(dl) {
    const d = new Date(dl); if (isNaN(d)) return "";
    const p = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function ymdToInt(ymd) {
    if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
    return Number(ymd.replaceAll("-", ""));
}
function fmtTime(iso) {
    if (!iso) return "";
    const d = new Date(iso); if (isNaN(d)) return "";
    let h = d.getHours(), m = d.getMinutes();
    const ap = h < 12 ? "AM" : "PM"; h = h % 12 || 12;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ap}`;
}
function toYMD(d) { const p = n => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; }

/* ─────────────────────────────────────────────────────────────
   SKELETONS
───────────────────────────────────────────────────────────────*/
function Skeleton({ className = "" }) {
    return <div className={["animate-pulse rounded-md bg-slate-200", className].join(" ")} />;
}
function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {[100, 80, 160, 80, 120, 180, 80].map((w, i) => (
                <td key={i} className="px-5 py-4">
                    <div className="h-4 rounded-full bg-slate-100" style={{ width: w }} />
                </td>
            ))}
        </tr>
    );
}
function ModalSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <Skeleton className="h-3 w-28 mb-3" /><Skeleton className="h-10 w-full rounded-lg" />
                </div>
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   STATUS PILL
───────────────────────────────────────────────────────────── */
function StatusPill({ asistencia }) {
    if (asistencia === true)
        return <span style={{ background: C.pill.assist, color: C.pill.assistT }} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">Asistió</span>;
    if (asistencia === false)
        return <span style={{ background: C.pill.noshow, color: C.pill.noshowT }} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">No asistió</span>;
    return <span style={{ background: C.pill.pending, color: C.pill.pendingT }} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">Pendiente</span>;
}

/* ─────────────────────────────────────────────────────────────
   MODAL
───────────────────────────────────────────────────────────── */
function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    <div className="flex items-center justify-between gap-3 px-6 py-4" style={{ background: C.dark }}>
                        <div className="truncate text-base font-bold text-white">{title}</div>
                        <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="max-h-[72vh] overflow-auto p-6">{children}</div>
                    {footer && (
                        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
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
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {Icon && <Icon className="h-3.5 w-3.5" />}<span>{label}</span>
            </div>
            {children}
        </div>
    );
}

function ContextMenu({ ctxMenu, onDelete, onClose }) {
    if (!ctxMenu.open || !ctxMenu.row) return null;
    return createPortal(
        <div className="fixed z-[9999]" style={{ left: ctxMenu.x, top: ctxMenu.y }} onClick={e => e.stopPropagation()}>
            <div className="w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <button className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors" onClick={() => onDelete(ctxMenu.row)}>
                    <Trash2 className="h-4 w-4" /> Eliminar
                </button>
                <button className="w-full px-4 py-2 text-left text-xs text-slate-400 hover:bg-slate-50 transition-colors" onClick={onClose}>Cerrar</button>
            </div>
        </div>, document.body
    );
}

/* ─────────────────────────────────────────────────────────────
   EVIDENCIAS
───────────────────────────────────────────────────────────── */
function formatBytes(b = 0) { if (!b) return "—"; const u = ["B", "KB", "MB", "GB"]; let i = 0, v = b; while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; } return `${v.toFixed(i === 0 ? 0 : 1)} ${u[i]}`; }
function resolveMediaUrl(url) { const u = String(url || "").trim(); if (!u) return ""; if (/^https?:\/\//i.test(u)) return u; if (u.startsWith("/")) return `${API_BASE}${u}`; if (u.startsWith("media/")) return `${API_BASE}/${u}`; return `${API_BASE}/media/${u}`; }
function isImageMime(m = "") { return String(m || "").toLowerCase().startsWith("image/"); }
function guessIsImageFromName(n = "") { const s = String(n || "").toLowerCase(); return [".jpg", ".jpeg", ".png", ".webp", ".gif"].some(e => s.endsWith(e)); }

function EvidenciasUploader({ evidencias = [], onSubir, onEliminar, disabled }) {
    const inputPickRef = useRef(null), inputCamRef = useRef(null);
    const [preview, setPreview] = useState({ open: false, url: "", title: "", mime: "" });
    const openPreview = ev => { const url = resolveMediaUrl(ev?.archivo); if (!url) return; setPreview({ open: true, url, title: ev?.nombre_original || "Evidencia", mime: ev?.tipo_mime || "" }); };
    const closePreview = () => setPreview({ open: false, url: "", title: "", mime: "" });
    const copyLink = async ev => { const url = resolveMediaUrl(ev?.archivo); if (!url) return; try { await navigator.clipboard.writeText(url); alert("Link copiado ✅"); } catch { alert("No se pudo copiar."); } };
    return (
        <div className="space-y-3">
            <input ref={inputPickRef} type="file" multiple accept="image/*,video/*,.pdf" className="hidden" onChange={e => { const f = Array.from(e.target.files || []); e.target.value = ""; if (f.length) onSubir?.(f); }} />
            <input ref={inputCamRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = Array.from(e.target.files || []); e.target.value = ""; if (f.length) onSubir?.(f); }} />
            <div className="grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={() => inputCamRef.current?.click()} disabled={disabled} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"><Camera className="h-4 w-4" /> Tomar foto</button>
                <button type="button" onClick={() => inputPickRef.current?.click()} disabled={disabled} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"><UploadCloud className="h-4 w-4" /> Adjuntar archivos</button>
            </div>
            {(!evidencias || evidencias.length === 0)
                ? <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">Sin evidencias adjuntas.</div>
                : (
                    <>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {evidencias.map(ev => {
                                const url = resolveMediaUrl(ev?.archivo);
                                const isImg = isImageMime(ev?.tipo_mime) || guessIsImageFromName(ev?.nombre_original);
                                return (
                                    <div key={ev.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                        <div className="relative aspect-[16/10] bg-slate-100">
                                            {isImg && url ? (<img src={url} alt={ev?.nombre_original || "evidencia"} className="h-full w-full object-cover" loading="lazy" onError={e => { e.currentTarget.style.display = "none"; }} />) : (<div className="flex h-full w-full items-center justify-center text-slate-400"><FileText className="h-7 w-7" /></div>)}
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2"><div className="truncate text-xs font-semibold text-white">{ev?.nombre_original || "archivo"}</div><div className="text-[10px] text-white/70">{formatBytes(ev?.tamano_bytes || 0)}</div></div>
                                        </div>
                                        <div className="flex items-center justify-between gap-1 p-2">
                                            <div className="flex items-center gap-1">
                                                {url && (<button type="button" onClick={() => openPreview(ev)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"><Eye className="h-3.5 w-3.5" /> Ver</button>)}
                                                {url && (<button type="button" onClick={() => copyLink(ev)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"><Copy className="h-3.5 w-3.5" /> Link</button>)}
                                            </div>
                                            <button type="button" disabled={disabled} onClick={() => onEliminar?.(ev)} className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-60"><Trash2 className="h-3.5 w-3.5" /> Quitar</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <Modal open={preview.open} title={preview.title || "Evidencia"} onClose={closePreview}
                            footer={<>
                                <button onClick={closePreview} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"><X className="h-4 w-4" /> Cerrar</button>
                                {preview.url && (<button onClick={() => window.open(preview.url, "_blank", "noopener,noreferrer")} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90" style={{ background: C.dark }}><Eye className="h-4 w-4" /> Abrir en pestaña</button>)}
                            </>}>
                            <div className="space-y-3">
                                {preview.url
                                    ? <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        {preview.mime.toLowerCase().startsWith("image/") ? (<img src={preview.url} alt={preview.title} className="mx-auto max-h-[60vh] w-auto rounded-lg object-contain" />) : (<div className="text-sm text-slate-500 text-center py-8">Usa "Abrir en pestaña".</div>)}
                                    </div>
                                    : <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">No hay URL para previsualizar.</div>
                                }
                                {preview.url && <div className="break-all text-xs text-slate-400">{preview.url}</div>}
                            </div>
                        </Modal>
                    </>
                )
            }
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   VISTA AGENDA (sin cambios estructurales)
═══════════════════════════════════════════════════════════ */
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS_CORTO = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const HOURS = Array.from({ length: 11 }, (_, i) => i + 7);
const DAY_W = 64;

function fmtHourLabel(h) {
    const ap = h < 12 ? "AM" : "PM"; const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}:00 ${ap}`;
}

function AgendaView({ registros, onOpenEdit }) {
    const hoy = new Date(); const hoyYMD = toYMD(hoy);
    const getWeekStart = d => { const s = new Date(d); s.setDate(s.getDate() - s.getDay()); s.setHours(0, 0, 0, 0); return s; };
    const [weekStart, setWeekStart] = useState(() => getWeekStart(hoy));
    const weekEnd = useMemo(() => { const e = new Date(weekStart); e.setDate(e.getDate() + 6); e.setHours(23, 59, 59, 999); return e; }, [weekStart]);
    const navWeek = dir => setWeekStart(prev => { const n = new Date(prev); n.setDate(n.getDate() + dir * 7); return n; });
    const goToday = () => setWeekStart(getWeekStart(hoy));
    const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; }), [weekStart]);
    const visibleDays = useMemo(() => weekDays.filter(d => d.getDay() !== 0), [weekDays]);
    const weekData = useMemo(() => {
        const map = {};
        registros.forEach(r => { if (!r.fecha_hora_cita) return; const d = new Date(r.fecha_hora_cita); if (d < weekStart || d > weekEnd) return; const k = toYMD(d); if (!map[k]) map[k] = []; map[k].push(r); });
        return map;
    }, [registros, weekStart, weekEnd]);
    const weekLabel = useMemo(() => { const s = weekStart, e = weekEnd; return `${s.getDate()} – ${e.getDate()} de ${MESES[e.getMonth()]} de ${e.getFullYear()}`; }, [weekStart, weekEnd]);
    function hourIndexFor(iso) { const d = new Date(iso); return HOURS.indexOf(d.getHours()); }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">SEMANA</p>
                    <p className="text-sm font-bold" style={{ color: C.dark }}>{weekLabel}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => navWeek(-1)} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all active:scale-95"><ChevronLeft className="h-4 w-4" /></button>
                    <button onClick={goToday} className="h-8 px-4 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all active:scale-95">Semana actual</button>
                    <button onClick={() => navWeek(1)} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all active:scale-95"><ChevronRight className="h-4 w-4" /></button>
                </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse" style={{ minWidth: DAY_W + HOURS.length * 130 }}>
                        <thead>
                            <tr>
                                <th className="sticky left-0 z-10 border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-left" style={{ width: DAY_W, minWidth: DAY_W }}>
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Día</span>
                                </th>
                                {HOURS.map(h => (
                                    <th key={h} className="border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-left last:border-r-0" style={{ minWidth: 130 }}>
                                        <span className="text-[11px] font-bold text-slate-400">{fmtHourLabel(h)}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {visibleDays.map(dayObj => {
                                const ymd = toYMD(dayObj), isToday = ymd === hoyYMD, events = weekData[ymd] || [];
                                const byHourIdx = {};
                                events.forEach(r => { const idx = hourIndexFor(r.fecha_hora_cita); if (idx < 0) return; if (!byHourIdx[idx]) byHourIdx[idx] = []; byHourIdx[idx].push(r); });
                                return (
                                    <tr key={ymd} style={{ height: 130 }}>
                                        <td className={["sticky left-0 z-10 border-b border-r border-slate-200 px-2 py-2 align-top", isToday ? "bg-slate-100" : "bg-white"].join(" ")} style={{ width: DAY_W, minWidth: DAY_W }}>
                                            <div className="flex flex-col items-center">
                                                <span className={`text-[10px] font-bold uppercase tracking-wide ${isToday ? "text-slate-800" : "text-slate-400"}`}>{DIAS_CORTO[dayObj.getDay()]}</span>
                                                <span className={`text-lg font-extrabold leading-none ${isToday ? "text-slate-900" : "text-slate-700"}`}>{String(dayObj.getDate()).padStart(2, "0")}</span>
                                            </div>
                                        </td>
                                        {HOURS.map((h, hi) => {
                                            const evs = byHourIdx[hi] || [];
                                            return (
                                                <td key={h} className={["relative border-b border-r border-slate-200 p-1 align-top last:border-r-0", isToday ? "bg-slate-50/60" : "bg-white"].join(" ")} style={{ minWidth: 160 }}>
                                                    <div className="flex flex-col gap-1">
                                                        {evs.map(r => {
                                                            const d = new Date(r.fecha_hora_cita); let hh = d.getHours(); const mm = d.getMinutes(); const ap = hh < 12 ? "AM" : "PM"; hh = hh % 12 || 12;
                                                            const timeStr = `${hh}:${String(mm).padStart(2, "0")} ${ap}`;
                                                            const colorMap = {
                                                                true: { bg: "#f0fdf4", border: "#22c55e", pill: "#dcfce7", pillT: "#15803d" },
                                                                false: { bg: "#fff1f2", border: "#f43f5e", pill: "#ffe4e6", pillT: "#be123c" },
                                                                null: { bg: "#fffbeb", border: "#f59e0b", pill: "#fef3c7", pillT: "#b45309" },
                                                            };
                                                            const asistKey = r.asistencia === true ? "true" : r.asistencia === false ? "false" : "null";
                                                            const color = colorMap[asistKey];
                                                            const asistLabel = r.asistencia === true ? "Asistió" : r.asistencia === false ? "No asistió" : "Pendiente";

                                                            return (
                                                                <div key={r.id} onClick={() => onOpenEdit(r)}
                                                                    className="cursor-pointer rounded-xl text-left transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                                                                    style={{ background: color.bg, borderLeft: `3px solid ${color.border}`, padding: "8px 10px" }}>

                                                                    {/* hora + pill estatus */}
                                                                    <div className="flex items-center justify-between gap-1 mb-1.5">
                                                                        <span className="text-[10px] font-bold text-slate-500">{timeStr}</span>
                                                                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold"
                                                                            style={{ background: color.pill, color: color.pillT }}>
                                                                            {asistLabel}
                                                                        </span>
                                                                    </div>

                                                                    {/* nombre */}
                                                                    <div className="truncate text-[11px] font-extrabold text-slate-900 leading-tight mb-1">
                                                                        {(r?.cliente?.nombre || "—").toUpperCase()}
                                                                    </div>

                                                                    {/* modelo */}
                                                                    {r.auto_interes && (
                                                                        <div className="flex items-center gap-1 mb-0.5">
                                                                            <CarFront className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                                                                            <span className="truncate text-[10px] font-semibold text-slate-600">{r.auto_interes}</span>
                                                                        </div>
                                                                    )}

                                                                    {/* asesor */}
                                                                    {r.asesor_piso && (
                                                                        <div className="flex items-center gap-1 mb-0.5">
                                                                            <User className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                                                                            <span className="truncate text-[10px] text-slate-500">
                                                                                {r.asesor_piso.split(" ").slice(0, 2).join(" ")}
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                    {/* teléfono */}
                                                                    {r?.cliente?.telefono && (
                                                                        <div className="flex items-center gap-1">
                                                                            <Phone className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                                                                            <span className="truncate text-[10px] text-slate-400">{r.cliente.telefono}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   TOOLTIP PERSONALIZADO para recharts
═══════════════════════════════════════════════════════════ */
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: 10, padding: "10px 14px", boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>
            {label && <p style={{ color: "#ffffff", fontSize: 11, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>}
            {payload.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color || "#fff" }} />
                    <span style={{ color: "#aaa", fontSize: 11 }}>{p.name}: </span>
                    <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{p.value}</span>
                </div>
            ))}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   ANIMATED COUNTER
═══════════════════════════════════════════════════════════ */
function AnimCounter({ value, duration = 800 }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let start = 0; const step = Math.ceil(value / 30); const iv = setInterval(() => { start += step; if (start >= value) { setDisplay(value); clearInterval(iv); } else setDisplay(start); }, duration / 30);
        return () => clearInterval(iv);
    }, [value, duration]);
    return <span>{display}</span>;
}

/* ═══════════════════════════════════════════════════════════
   VISTA GRÁFICAS — rediseño oscuro + animaciones
═══════════════════════════════════════════════════════════ */
function GraficasView({ registros }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t); }, []);

    const porVehiculo = useMemo(() => { const map = {}; registros.forEach(r => { const k = r.auto_interes || "Sin especificar"; map[k] = (map[k] || 0) + 1; }); return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6); }, [registros]);
    const porAsesor = useMemo(() => { const map = {}; registros.forEach(r => { const k = r.asesor_piso || "Sin asignar"; const s = k.split(" ").slice(0, 2).join(" "); map[s] = (map[s] || 0) + 1; }); return Object.entries(map).map(([name, value]) => ({ name, value, fullMark: Math.max(...Object.values(map)) })).sort((a, b) => b.value - a.value); }, [registros]);
    const porMes = useMemo(() => { const map = {}; registros.forEach(r => { if (!r.fecha_hora_cita) return; const d = new Date(r.fecha_hora_cita); const k = `${MESES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`; map[k] = (map[k] || 0) + 1; }); return Object.entries(map).map(([name, value]) => ({ name, value })).slice(-7); }, [registros]);
    const asistencia = useMemo(() => { const si = registros.filter(r => r.asistencia).length; return [{ name: "Asistió", value: si, fill: "#0d0d0d" }, { name: "No asistió", value: registros.length - si, fill: "#d1d5db" }]; }, [registros]);

    const total = registros.length, asistieron = registros.filter(r => r.asistencia).length;
    const pct = total > 0 ? Math.round((asistieron / total) * 100) : 0;

    // acumulado para area chart
    const acumulado = useMemo(() => {
        let acc = 0;
        return porMes.map(p => { acc += p.value; return { ...p, acumulado: acc }; });
    }, [porMes]);

    const cardCls = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg transition-shadow duration-300";
    const titleCls = "text-sm font-bold mb-5 flex items-center gap-2";

    return (
        <div className="space-y-5">
            {/* KPI row */}
            <div className="grid gap-4 sm:grid-cols-3">
                {[
                    { label: "Total pruebas", value: total, sub: "registradas", icon: CarFront, bg: "#0d0d0d" },
                    { label: "Asistencias", value: asistieron, sub: "confirmadas", icon: CheckCircle2, bg: "#1a1a1a" },
                    { label: "Pendientes", value: total - asistieron, sub: "sin confirmar", icon: Clock, bg: "#2a2a2a" },
                ].map(({ label, value, sub, icon: Icon, bg }) => (
                    <div key={label} className="relative overflow-hidden rounded-2xl p-5 shadow-sm" style={{ background: bg }}>
                        {/* glow decorativo */}
                        <div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-3xl font-bold text-white"><AnimCounter value={value} /></div>
                                <div className="text-xs font-semibold text-white/40 mt-0.5 uppercase tracking-widest">{sub}</div>
                                <div className="mt-3 text-sm font-semibold text-white/70">{label}</div>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
                                <Icon className="h-5 w-5 text-white/70" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Fila 1: Area + Barras horizontales */}
            <div className="grid gap-5 lg:grid-cols-2">

                {/* Area chart: tendencia mensual */}
                <div className={cardCls}>
                    <h3 className={titleCls} style={{ color: C.dark }}>
                        <TrendingUp className="h-4 w-4" />
                        Tendencia mensual
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={mounted ? acumulado : []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="10%" stopColor="#0d0d0d" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#0d0d0d" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.sub }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: C.sub }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="value" name="Pruebas" stroke="#0d0d0d" strokeWidth={2.5} fill="url(#areaGrad)" dot={{ r: 4, fill: "#0d0d0d", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, fill: "#0d0d0d" }} isAnimationActive={mounted} animationDuration={900} />
                            <Area type="monotone" dataKey="acumulado" name="Acumulado" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="5 3" fill="none" dot={false} isAnimationActive={mounted} animationDuration={900} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Barras horizontales: por modelo */}
                <div className={cardCls}>
                    <h3 className={titleCls} style={{ color: C.dark }}>
                        <CarFront className="h-4 w-4" />
                        Modelos de interés
                    </h3>
                    <div className="space-y-3 mt-1">
                        {porVehiculo.map((item, i) => {
                            const maxVal = porVehiculo[0]?.value || 1;
                            const pctW = mounted ? Math.round((item.value / maxVal) * 100) : 0;
                            const grays = ["#0d0d0d", "#1f1f1f", "#333", "#4a4a4a", "#626262", "#7a7a7a"];
                            return (
                                <div key={item.name}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-semibold" style={{ color: C.dark }}>{item.name}</span>
                                        <span className="text-xs font-bold" style={{ color: C.sub }}>{item.value}</span>
                                    </div>
                                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pctW}%`, background: grays[i] || "#888" }} />
                                    </div>
                                </div>
                            );
                        })}
                        {porVehiculo.length === 0 && <p className="text-sm text-slate-400 text-center py-8">Sin datos</p>}
                    </div>
                </div>
            </div>

            {/* Fila 2: Bar asesor + Donut asistencia */}
            <div className="grid gap-5 lg:grid-cols-2">

                {/* Bar chart: asesores */}
                <div className={cardCls}>
                    <h3 className={titleCls} style={{ color: C.dark }}>
                        <User className="h-4 w-4" />
                        Pruebas por asesor
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={mounted ? porAsesor : []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={28}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.sub }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: C.sub }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name="Pruebas" radius={[6, 6, 0, 0]} isAnimationActive={mounted} animationDuration={800}>
                                {porAsesor.map((_, i) => (
                                    <Cell key={i} fill={C.chart[Math.min(i, C.chart.length - 1)]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Donut: asistencia */}
                <div className={cardCls}>
                    <h3 className={titleCls} style={{ color: C.dark }}>
                        <CheckCircle2 className="h-4 w-4" />
                        Tasa de asistencia
                    </h3>
                    <div className="flex items-center justify-between gap-6">
                        <div className="relative flex-shrink-0" style={{ width: 180, height: 180 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={asistencia} cx="50%" cy="50%" innerRadius={58} outerRadius={82} dataKey="value" paddingAngle={3} startAngle={90} endAngle={-270} isAnimationActive={mounted} animationDuration={900}>
                                        {asistencia.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Label central */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-bold" style={{ color: C.dark }}>{pct}%</span>
                                <span className="text-xs text-slate-400 mt-0.5">asistencia</span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-4">
                            {asistencia.map(item => (
                                <div key={item.name}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2.5 w-2.5 rounded-full" style={{ background: item.fill }} />
                                            <span className="text-xs font-semibold text-slate-600">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-bold" style={{ color: C.dark }}>{item.value}</span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-slate-100">
                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: total > 0 ? `${Math.round((item.value / total) * 100)}%` : "0%", background: item.fill }} />
                                    </div>
                                </div>
                            ))}
                            {total > 0 && <p className="text-xs text-slate-400 pt-1">{asistieron} de {total} pruebas confirmadas</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════════════════ */
export default function RegistroPruebaManejo() {
    const { user } = useAuth();
    const isAdmin = useMemo(() => {
        const permisos = user?.permisos || []; const rol = String(user?.rol || "").trim().toLowerCase();
        return rol === "administrador" || permisos.includes("CRM_DIGITALES") || permisos.includes("ALL") || permisos.includes("USUARIOS_ADMIN");
    }, [user]);
    const userAgencia = String(user?.agencia || "").trim();

    const [registros, setRegistros] = useState([]);
    const [activeView, setActiveView] = useState("tabla");
    const [ctxMenu, setCtxMenu] = useState({ open: false, x: 0, y: 0, row: null });
    const [sort, setSort] = useState({ key: "fecha_hora_cita", dir: "desc" });
    const [filters, setFilters] = useState({ q: "", agencia: "Todos", rangoDesde: "", rangoHasta: "" });
    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState("create");
    const [draft, setDraft] = useState(null);
    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);
    const [subiendoEv, setSubiendoEv] = useState(false);
    const [touchedSave, setTouchedSave] = useState(false);

    const VIEWS = [{ key: "tabla", icon: LayoutList, label: "Tabla" }, { key: "agenda", icon: CalendarRange, label: "Agenda" }, { key: "graficas", icon: BarChart2, label: "Gráficas" }];
    const DEALERS = ["Volvo"];
    const ASESORES = ["Enrique Vazquez Islas", "Ricardo Platas", "Verónica Del Rayo Galindo León", "Julio Camacho Barragán", "Fernanda Romero Aguilar"];
    const VEHICULOS = [
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
    const REQUIRED = useMemo(() => ({ telefono: "Teléfono", fecha_hora_cita: "Fecha y hora" }), []);
    const missing = useMemo(() => { if (!draft) return []; return Object.keys(REQUIRED).filter(k => { const v = draft[k]; return v === null || v === undefined || (typeof v === "string" && v.trim() === ""); }); }, [draft, REQUIRED]);
    const isInvalid = k => touchedSave && missing.includes(k);

    const telDigits = useMemo(() => String(draft?.telefono || "").replace(/\D/g, ""), [draft?.telefono]);
    const telIs10 = useMemo(() => /^\d{10}$/.test(telDigits), [telDigits]);
    const telIs52Plus10 = useMemo(() => /^52\d{10}$/.test(telDigits), [telDigits]);
    const telIsOk = telIs10 || telIs52Plus10;
    const telIsNormalized = telIs52Plus10;
    const telError = useMemo(() => {
        if (!openModal || !draft || !telDigits) return "";
        if (telIs10 || telIs52Plus10) return "";
        if (telDigits.length < 10) return "Número incompleto";
        if (telDigits.length === 11) return "Formato inválido";
        if (telDigits.length === 12 && !telDigits.startsWith("52")) return "Para 12 dígitos debe iniciar con 52";
        if (telDigits.length > 12) return "Máximo 12 dígitos";
        return "Número inválido";
    }, [openModal, draft, telDigits, telIs10, telIs52Plus10]);
    const telInvalid = !!telError;
    const inputBase = "w-full rounded-lg border px-3 py-2.5 text-sm font-medium outline-none transition-colors";
    const inputOk = "border-slate-200 bg-white text-slate-800 focus:border-slate-400 focus:ring-2 focus:ring-slate-100";
    const inputBad = "border-red-300 bg-red-50 text-red-800";

    useEffect(() => {
        const close = () => setCtxMenu(p => ({ ...p, open: false, row: null }));
        window.addEventListener("click", close); window.addEventListener("scroll", close, true); window.addEventListener("resize", close);
        return () => { window.removeEventListener("click", close); window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
    }, []);

    const onRowContextMenu = (e, row) => { e.preventDefault(); e.stopPropagation(); setCtxMenu({ open: true, x: e.clientX, y: e.clientY, row }); };
    const toggleSort = key => setSort(prev => prev.key !== key ? { key, dir: "asc" } : { key, dir: prev.dir === "asc" ? "desc" : "asc" });

    const refreshList = async () => {
        setLoadingList(true);
        try { const data = await apiPruebaManejo.list(); setRegistros(Array.isArray(data) ? data : []); }
        catch (e) { console.error(e); setRegistros([]); }
        finally { setLoadingList(false); }
    };
    useEffect(() => { refreshList(); }, []);

    const dealers = useMemo(() => {
        const set = new Set((registros || []).map(r => normalizeStr(r.agencia)).filter(Boolean));
        if (!isAdmin && userAgencia) return ["Todos", userAgencia];
        return ["Todos", ...Array.from(set)];
    }, [registros, isAdmin, userAgencia]);

    const filtered = useMemo(() => {
        const q = filters.q.trim().toLowerCase();
        const desdeInt = ymdToInt(filters.rangoDesde), hastaInt = ymdToInt(filters.rangoHasta);
        return (registros || []).filter(r => {
            if (!isAdmin && userAgencia && normalizeStr(r.agencia) !== normalizeStr(userAgencia)) return false;
            const matchQ = !q || [r.agencia, r?.cliente?.nombre, r?.cliente?.telefono, r?.cliente?.correo, r.auto_interes, r.asesor_piso, r.num_serie, r.folio_salida, r.comentarios_cliente].some(v => normalizeStr(v).toLowerCase().includes(q));
            const matchAgencia = filters.agencia === "Todos" || normalizeStr(r.agencia) === normalizeStr(filters.agencia);
            let matchRango = true;
            if (desdeInt !== null || hastaInt !== null) { const yi = ymdToInt(r.fecha_hora_cita ? toYMDLocal(r.fecha_hora_cita) : ""); if (!yi) return false; if (desdeInt !== null && yi < desdeInt) matchRango = false; if (hastaInt !== null && yi > hastaInt) matchRango = false; }
            return matchQ && matchAgencia && matchRango;
        });
    }, [registros, filters, isAdmin, userAgencia]);

    const sorted = useMemo(() => {
        const data = [...filtered]; const { key, dir } = sort; if (!key) return data; const mult = dir === "asc" ? 1 : -1;
        return data.sort((a, b) => {
            if (key === "fecha_hora_cita") { const ta = a.fecha_hora_cita ? new Date(a.fecha_hora_cita).getTime() : 0, tb = b.fecha_hora_cita ? new Date(b.fecha_hora_cita).getTime() : 0; return (ta - tb) * mult; }
            const va = normalizeStr(a?.[key]).toLowerCase(), vb = normalizeStr(b?.[key]).toLowerCase();
            if (va < vb) return -1 * mult; if (va > vb) return 1 * mult; return 0;
        });
    }, [filtered, sort]);

    const openCreate = () => {
        setTouchedSave(false); setMode("create");
        setDraft({ id: null, agencia: isAdmin ? "" : userAgencia, nombre: "", telefono: "", correo: "", auto_interes: "", fecha_hora_cita: "", asistencia: false, num_serie: "", asesor_piso: "", folio_salida: "", comentarios_cliente: "", evidencias: [] });
        setOpenModal(true);
    };
    const openEdit = async row => {
        if (!row?.id) return;
        try {
            setTouchedSave(false); setMode("edit"); setLoadingDetail(true); setOpenModal(true);
            const c = await apiPruebaManejo.get(row.id);
            if (!isAdmin && userAgencia && normalizeStr(c.agencia) !== normalizeStr(userAgencia)) { alert("Sin permisos."); setOpenModal(false); return; }
            setDraft({ id: c.id, agencia: c.agencia || (isAdmin ? "" : userAgencia), nombre: c?.cliente?.nombre || "", telefono: c?.cliente?.telefono || "", correo: c?.cliente?.correo || "", auto_interes: c.auto_interes || "", fecha_hora_cita: toDTLocal(c.fecha_hora_cita), asistencia: !!c.asistencia, num_serie: c.num_serie || "", asesor_piso: c.asesor_piso || "", folio_salida: c.folio_salida || "", comentarios_cliente: c.comentarios_cliente || "", evidencias: Array.isArray(c.evidencias) ? c.evidencias : [] });
        } catch (e) { console.error(e); alert("No se pudo abrir."); setOpenModal(false); }
        finally { setLoadingDetail(false); }
    };
    const closeModal = () => { if (saving || subiendoEv) return; setOpenModal(false); setDraft(null); };
    const eliminarRegistro = async row => {
        if (!row?.id) return;
        if (!isAdmin && userAgencia && normalizeStr(row.agencia) !== normalizeStr(userAgencia)) { alert("Sin permisos."); return; }
        if (!confirm(`¿Eliminar la prueba de ${row?.cliente?.nombre || "este registro"}?`)) return;
        try { await apiPruebaManejo.remove(row.id); setRegistros(prev => prev.filter(x => x.id !== row.id)); setCtxMenu({ open: false, x: 0, y: 0, row: null }); }
        catch (e) { console.error(e); alert("No se pudo eliminar."); }
    };
    const save = async () => {
        if (!draft || saving) return; setTouchedSave(true); if (missing.length || !telIsOk || telInvalid) return; setSaving(true);
        try {
            const agenciaFinal = isAdmin ? normalizeStr(draft.agencia || "") : userAgencia;
            const payload = { agencia: agenciaFinal, nombre: draft.nombre || "", telefono: normalizeStr(draft.telefono), correo: draft.correo || "", auto_interes: draft.auto_interes || "", fecha_hora_cita: fromDTLocalToISO(draft.fecha_hora_cita), asistencia: !!draft.asistencia, num_serie: draft.num_serie || "", asesor_piso: draft.asesor_piso || "", folio_salida: draft.folio_salida || "", comentarios_cliente: draft.comentarios_cliente || "" };
            let saved;
            if (mode === "create") saved = await apiPruebaManejo.create(payload);
            else saved = await apiPruebaManejo.update(draft.id, payload);
            await refreshList();
            if (mode === "create" && saved?.id) { const det = await apiPruebaManejo.get(saved.id); setDraft(p => ({ ...p, id: det.id, evidencias: Array.isArray(det.evidencias) ? det.evidencias : [] })); setMode("edit"); return; }
            closeModal();
        } catch (e) { console.error(e); alert("Error guardando."); }
        finally { setSaving(false); }
    };
    const subirEvidencias = async files => {
        if (!draft?.id) { alert("Guarda primero la prueba."); return; }
        setSubiendoEv(true);
        try { for (const f of files) await apiEvidenciasPruebaManejo.create({ id_prueba_manejo: draft.id, archivo: f }); const det = await apiPruebaManejo.get(draft.id); setDraft(p => ({ ...p, evidencias: Array.isArray(det.evidencias) ? det.evidencias : [] })); }
        catch (e) { console.error(e); alert("No se pudieron subir evidencias."); }
        finally { setSubiendoEv(false); }
    };
    const eliminarEvidencia = async ev => {
        if (!confirm(`¿Eliminar "${ev?.nombre_original || "archivo"}"?`)) return;
        setSubiendoEv(true);
        try { await apiEvidenciasPruebaManejo.remove(ev.id); const det = await apiPruebaManejo.get(draft.id); setDraft(p => ({ ...p, evidencias: Array.isArray(det.evidencias) ? det.evidencias : [] })); }
        catch (e) { console.error(e); alert("No se pudo eliminar evidencia."); }
        finally { setSubiendoEv(false); }
    };
    const resetFilters = () => setFilters({ q: "", agencia: "Todos", rangoDesde: "", rangoHasta: "" });
    const setHoy = () => { const h = toYMDLocal(new Date()); setFilters(p => ({ ...p, rangoDesde: h, rangoHasta: h })); };

    const SortIcon = ({ k }) => (
        <span className="ml-1 inline-flex opacity-40">
            {sort.key === k ? sort.dir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3.5 w-3.5" />}
        </span>
    );

    /* stats */
    const statTotal = registros.length;
    const statPendientes = registros.filter(r => !r.asistencia).length;
    const statAsistieron = registros.filter(r => r.asistencia).length;
    const statHoy = registros.filter(r => { if (!r.fecha_hora_cita) return false; return toYMDLocal(r.fecha_hora_cita) === toYMDLocal(new Date()); }).length;
    const tasaAsistencia = statTotal > 0 ? Math.round((statAsistieron / statTotal) * 100) : 0;

    /* ══════════════════════════════════════════════════════════
       RENDER
    ═══════════════════════════════════════════════════════════ */
    return (
        <div className="w-full space-y-5" style={{ background: C.bg, minHeight: "100vh", paddingBottom: 32 }}>

            {/* ────────────────────────────────────────────────────
                HEADER — blanco, sin tarjeta negra
                Tabs de vista en borde inferior (igual que la imagen)
            ──────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-200 px-6 pt-6 pb-0">
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: C.dark }}>Pruebas de Manejo</h1>
                        <p className="text-sm mt-0.5 text-slate-500">
                            {!isAdmin && userAgencia
                                ? <>Agencia: <span className="font-semibold" style={{ color: C.dark }}>{userAgencia}</span></>
                                : "Gestione y dé seguimiento a las pruebas de manejo."}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Pill-group de vistas */}
                        <div className="flex gap-0.5 rounded-lg bg-slate-100 p-0.5">
                            {VIEWS.map(({ key, label, icon: Icon }) => {
                                const active = activeView === key;
                                return (
                                    <button key={key} onClick={() => setActiveView(key)}
                                        className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-semibold transition-all duration-200"
                                        style={{
                                            background: active ? "#fff" : "transparent",
                                            color: active ? C.dark : C.sub,
                                            boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                                        }}>
                                        <Icon className="h-3.5 w-3.5" /> {label}
                                    </button>
                                );
                            })}
                        </div>

                        {activeView !== "graficas" && (
                            <button onClick={openCreate}
                                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:brightness-110 active:scale-95"
                                style={{ background: C.dark }}>
                                <Plus className="h-4 w-4" /> Nueva prueba
                            </button>
                        )}
                    </div>
                </div>
                {/* KPI strip */}
                <div className="flex flex-wrap gap-6 mb-5">
                    {[
                        { label: "Pruebas de hoy", value: statHoy, icon: CalendarCheck },
                        { label: "Pendientes", value: statPendientes, icon: Clock },
                        { label: "Asistieron", value: statAsistieron, icon: CheckCircle2 },
                        { label: "Tasa de asistencia", value: `${tasaAsistencia}%`, icon: BarChart2, sub: `${statAsistieron} de ${statTotal}` },
                    ].map(({ label, value, icon: Icon, sub }) => (
                        <div key={label} className="flex items-center gap-3 min-w-[130px]">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                                <Icon className="h-5 w-5" style={{ color: C.dark }} />
                            </div>
                            <div>
                                <div className="text-xl font-bold leading-none" style={{ color: C.dark }}>{value}</div>
                                <div className="text-xs mt-0.5 text-slate-500">{label}</div>
                                {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
                            </div>
                        </div>
                    ))}
                </div>


            </div>

            {/* ── contenido ── */}
            <div className="px-6">

                {activeView === "agenda" && <AgendaView registros={filtered} onOpenEdit={openEdit} />}
                {activeView === "graficas" && <GraficasView registros={filtered} />}

                {activeView === "tabla" && (
                    <div className="space-y-4">

                        {/* Filtros */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="grid gap-4 md:grid-cols-12">
                                <div className="md:col-span-5">
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">Búsqueda</label>
                                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100 transition-all">
                                        <Search className="h-4 w-4 flex-shrink-0 text-slate-400" />
                                        <input value={filters.q} onChange={e => setFilters(p => ({ ...p, q: e.target.value }))} placeholder="Buscar por dealer, cliente, teléfono, serie, folio, asesor…" className="w-full text-sm bg-transparent outline-none placeholder:text-slate-400 text-slate-800" />
                                        {filters.q && <button onClick={() => setFilters(p => ({ ...p, q: "" }))} className="rounded p-0.5 text-slate-400 hover:text-red-500 transition-colors"><X className="h-3.5 w-3.5" /></button>}
                                    </div>
                                </div>
                                <div className="md:col-span-3">
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">Dealer</label>
                                    <select value={filters.agencia} onChange={e => setFilters(p => ({ ...p, agencia: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all">
                                        {dealers.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-4">
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">Acciones</label>
                                    <div className="flex gap-2">
                                        <button onClick={setHoy}
                                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 active:scale-95"
                                            style={{ background: C.dark }}>
                                            <CalendarDays className="h-4 w-4" /> Hoy
                                        </button>
                                        <button onClick={resetFilters}
                                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 active:scale-95">
                                            <X className="h-4 w-4" /> Limpiar
                                        </button>
                                    </div>
                                </div>
                                <div className="md:col-span-6">
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">Fecha desde</label>
                                    <input type="date" value={filters.rangoDesde} onChange={e => setFilters(p => ({ ...p, rangoDesde: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all" />
                                </div>
                                <div className="md:col-span-6">
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">Fecha hasta</label>
                                    <input type="date" value={filters.rangoHasta} onChange={e => setFilters(p => ({ ...p, rangoHasta: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all" />
                                </div>
                            </div>
                        </div>

                        {/* Tabla desktop */}
                        <div className="hidden lg:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100">
                                <p className="text-sm font-semibold" style={{ color: C.dark }}>Mostrando {sorted.length} de {registros.length} pruebas</p>
                            </div>
                            <div className="overflow-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead>
                                        <tr style={{ background: C.bg }} className="text-xs">
                                            {[
                                                { key: "fecha_hora_cita", label: "Hora", sortable: true },
                                                { key: null, label: "Cliente" },
                                                { key: null, label: "Vehículo de interés" },
                                                { key: null, label: "Asesor" },
                                                { key: null, label: "No. Serie" },
                                                { key: null, label: "Folio salida" },
                                                { key: null, label: "Estatus" },
                                                { key: null, label: "" },
                                            ].map(({ key, label, sortable }) => (
                                                <th key={label} className="px-5 py-3 font-semibold text-slate-500">
                                                    {sortable ? <button onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity">{label}<SortIcon k={key} /></button> : label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loadingList
                                            ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                                            : <>
                                                {sorted.map(row => (
                                                    <tr key={row.id} onDoubleClick={() => openEdit(row)} onContextMenu={e => onRowContextMenu(e, row)}
                                                        className="cursor-pointer transition-colors hover:bg-slate-50 group">
                                                        <td className="px-5 py-4">
                                                            <span className="text-sm font-bold" style={{ color: C.dark }}>{fmtTime(row.fecha_hora_cita) || "—"}</span>
                                                            <div className="text-xs mt-0.5 text-slate-400">{row.fecha_hora_cita ? toYMDLocal(row.fecha_hora_cita) : "—"}</div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: C.dark }}>
                                                                    {(row?.cliente?.nombre || "?").charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold" style={{ color: C.dark }}>{row?.cliente?.nombre || "—"}</div>
                                                                    <div className="text-xs text-slate-400">{row?.cliente?.telefono || ""}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                                                                    <CarFront className="h-5 w-5" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-sm" style={{ color: C.dark }}>{row.auto_interes || "—"}</div>
                                                                    <div className="text-xs text-slate-400">{row.agencia || ""}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold" style={{ color: C.dark }}>
                                                                    {(row.asesor_piso || "?").charAt(0)}
                                                                </div>
                                                                <span className="text-sm text-slate-600">{row.asesor_piso || "—"}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4 font-mono text-xs text-slate-500">{row.num_serie || "—"}</td>
                                                        <td className="px-5 py-4 font-mono text-xs text-slate-500">{row.folio_salida || "—"}</td>
                                                        <td className="px-5 py-4">
                                                            <StatusPill asistencia={row.asistencia === true ? true : row.asistencia === false ? false : null} />
                                                        </td>
                                                        <td className="px-3 py-4 text-right">
                                                            <button onClick={e => { e.stopPropagation(); onRowContextMenu(e, row); }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-50 transition-all">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {sorted.length === 0 && (
                                                    <tr><td colSpan={8} className="px-5 py-16 text-center text-sm text-slate-400">No hay pruebas con esos filtros.</td></tr>
                                                )}
                                            </>
                                        }
                                    </tbody>
                                </table>
                            </div>
                            {sorted.length > 0 && (
                                <div className="border-t border-slate-100 px-5 py-3">
                                    <p className="text-xs text-slate-400">Mostrando 1–{sorted.length} de {sorted.length} pruebas</p>
                                </div>
                            )}
                            <ContextMenu ctxMenu={ctxMenu} onDelete={async row => { await eliminarRegistro(row); setCtxMenu({ open: false, x: 0, y: 0, row: null }); }} onClose={() => setCtxMenu({ open: false, x: 0, y: 0, row: null })} />
                        </div>

                        {/* Mobile */}
                        <div className="grid gap-3 lg:hidden">
                            {loadingList
                                ? Array.from({ length: 5 }).map((_, i) => (<div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><Skeleton className="h-4 w-48" /><Skeleton className="mt-2 h-3 w-36" /><Skeleton className="mt-3 h-3 w-full" /><Skeleton className="mt-2 h-3 w-3/4" /></div>))
                                : <>
                                    {sorted.map(row => (
                                        <button key={row.id} onClick={() => openEdit(row)} className="text-left w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.99]">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: C.dark }}>
                                                        {(row?.cliente?.nombre || "?").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="truncate font-bold" style={{ color: C.dark }}>{row?.cliente?.nombre || "—"}</div>
                                                        <div className="text-xs text-slate-400">{row.agencia || "—"} • {row?.cliente?.telefono || "—"}</div>
                                                        <div className="text-xs text-slate-400">{fmtTime(row.fecha_hora_cita)} {row.fecha_hora_cita ? `· ${toYMDLocal(row.fecha_hora_cita)}` : ""}</div>
                                                    </div>
                                                </div>
                                                <StatusPill asistencia={row.asistencia === true ? true : row.asistencia === false ? false : null} />
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {row.auto_interes && <span className="rounded-full px-2.5 py-1 text-xs font-semibold bg-slate-100" style={{ color: C.dark }}>{row.auto_interes}</span>}
                                                {row.asesor_piso && <span className="rounded-full px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-600">{row.asesor_piso.split(" ").slice(0, 2).join(" ")}</span>}
                                            </div>
                                        </button>
                                    ))}
                                    {sorted.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">No hay pruebas.</div>}
                                </>
                            }
                        </div>
                    </div>
                )}
            </div>

            {/* ── MODAL ── */}
            <Modal open={openModal} title={mode === "create" ? "Nueva Prueba de Manejo" : `Editar prueba #${draft?.id || ""}`} onClose={closeModal}
                footer={<>
                    <button onClick={closeModal} disabled={saving || subiendoEv} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"><X className="h-4 w-4" /> Cancelar</button>
                    <button onClick={save} disabled={saving || loadingDetail || subiendoEv || telInvalid || (draft?.telefono ? !telIsOk : false)} className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-60" style={{ background: C.dark }}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {saving ? "Guardando..." : mode === "create" ? "Guardar y continuar" : "Guardar cambios"}
                    </button>
                </>}>
                {loadingDetail ? <ModalSkeleton /> : !draft ? null : (
                    <div className="grid gap-3 md:grid-cols-3">
                        <Field label="Dealer" icon={Building2}>
                            <select value={draft.agencia || ""} onChange={e => setDraft(p => ({ ...p, agencia: e.target.value }))} disabled={!isAdmin} className={[inputBase, inputOk, !isAdmin ? "opacity-60 cursor-not-allowed" : ""].join(" ")}>
                                <option value="" disabled>Selecciona un dealer...</option>
                                {(isAdmin ? DEALERS : (userAgencia ? [userAgencia] : DEALERS)).map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </Field>
                        <Field label="Prospecto" icon={User}><input value={draft.nombre} onChange={e => setDraft(p => ({ ...p, nombre: e.target.value }))} className={[inputBase, inputOk].join(" ")} placeholder="Nombre completo" /></Field>
                        <Field label="Teléfono" icon={Phone}>
                            <input maxLength={12} value={draft.telefono || ""} onChange={e => setDraft(p => ({ ...p, telefono: e.target.value.replace(/\D/g, "").slice(0, 12) }))} disabled={telIsNormalized} className={[inputBase, (isInvalid("telefono") || telInvalid) ? inputBad : inputOk, telIsNormalized ? "opacity-60 cursor-not-allowed" : ""].join(" ")} />
                            {isInvalid("telefono") && <p className="mt-1.5 text-xs font-semibold text-red-600">Teléfono es requerido.</p>}
                            {!isInvalid("telefono") && telError && <p className="mt-1.5 text-xs font-semibold text-red-600">{telError}</p>}
                        </Field>
                        <Field label="Correo" icon={Mail}><input value={draft.correo} onChange={e => setDraft(p => ({ ...p, correo: e.target.value }))} className={[inputBase, inputOk].join(" ")} placeholder="correo@ejemplo.com" /></Field>
                        <Field label="Modelo de interés" icon={CarFront}>
                            <select value={draft.auto_interes || ""} onChange={e => setDraft(p => ({ ...p, auto_interes: e.target.value }))} className={[inputBase, inputOk].join(" ")}>
                                <option value="" disabled>Selecciona un modelo...</option>
                                {VEHICULOS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </Field>
                        <Field label="Fecha y hora" icon={CalendarDays}>
                            <input type="datetime-local" value={draft.fecha_hora_cita} onChange={e => setDraft(p => ({ ...p, fecha_hora_cita: e.target.value }))} className={[inputBase, isInvalid("fecha_hora_cita") ? inputBad : inputOk].join(" ")} />
                            {isInvalid("fecha_hora_cita") && <p className="mt-1.5 text-xs font-semibold text-red-600">Fecha y hora es requerido.</p>}
                        </Field>
                        <Field label="Asesor piso" icon={User}>
                            <select value={draft.asesor_piso || ""} onChange={e => setDraft(p => ({ ...p, asesor_piso: e.target.value }))} className={[inputBase, inputOk].join(" ")}>
                                <option value="" disabled>Selecciona un asesor...</option>
                                {ASESORES.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </Field>
                        <Field label="No. Serie" icon={Hash}><input value={draft.num_serie} onChange={e => setDraft(p => ({ ...p, num_serie: e.target.value }))} className={[inputBase, inputOk, "font-mono"].join(" ")} placeholder="Ej. 3VWSA..." /></Field>
                        <Field label="Folio pase de salida" icon={FileText}><input value={draft.folio_salida} onChange={e => setDraft(p => ({ ...p, folio_salida: e.target.value }))} className={[inputBase, inputOk, "font-mono"].join(" ")} /></Field>
                        <div className="md:col-span-3">
                            <Field label="Comentarios del cliente" icon={MessageSquareText}>
                                <textarea value={draft.comentarios_cliente} onChange={e => setDraft(p => ({ ...p, comentarios_cliente: e.target.value }))} className={[inputBase, inputOk, "min-h-[80px] resize-none"].join(" ")} placeholder="Notas / comentarios del cliente..." />
                            </Field>
                        </div>
                        <div className="md:col-span-3">
                            <Field label="Evidencias" icon={Camera}>
                                <EvidenciasUploader evidencias={draft.evidencias || []} disabled={saving || subiendoEv} onSubir={subirEvidencias} onEliminar={eliminarEvidencia} />
                                {!draft.id && <p className="mt-2 text-xs text-slate-400">* Guarda primero la prueba para poder adjuntar evidencias.</p>}
                            </Field>
                        </div>
                        {subiendoEv && (
                            <div className="md:col-span-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold" style={{ color: C.dark }}>
                                <Loader2 className="h-4 w-4 animate-spin" /> Procesando evidencias...
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}