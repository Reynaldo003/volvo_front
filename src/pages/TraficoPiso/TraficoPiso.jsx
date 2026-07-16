// src/pages/TraficoPiso/TraficoPiso.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    ArrowUpDown, BadgeDollarSign, BriefcaseBusiness, CalendarDays,
    CarFront, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
    CheckCircle2, XCircle, PieChart as PieChartIcon, Pencil, MoreVertical,
    CircleDollarSign, ClipboardList, Clock, HeartHandshake, Loader2,
    Mail, MessageSquareText, Phone, Plus, Save, Search, ShieldCheck,
    Trash2, User, UserRoundSearch, Users, X, Building2,
    TableProperties, CalendarRange, BarChart2,
} from "lucide-react";
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import { apiTraficoPiso } from "../../lib/apiTraficoPiso";

// ─── constantes ──────────────────────────────────────────────────────────────
const DEALERS = ["Volvo"];
const VEHICULOS = ["EX30", "EX40", "EC40", "EX90", "XC60", "XC90", "XC60 Black Edition", "XC90 Black Edition", "Seminuevos", "Avaluo"];
const MOTIVOS_INGRESO = ["Vi anuncios en la TV", "Vi anuncios en las redes sociales", "Vi publicitarios", "Siempre me ha gustado la marca", "Pasé y sentí curiosidad", "Recibí información por Whastapp"];
const TIPOS_PERSONA = ["Física", "Moral"];
const TIEMPOS_COMPRA = ["Este mes", "De 1 a 3 meses", "De 3 a 6 meses"];
const FORMAS_CAPITALIZACION = ["Deseo un Crédito", "Quiero pagarlo de contado", "Me interesa un arrendamiento", "Me interesa un Autofinanciamiento"];
const MENSUALIDADES = [3, 6, 12, 18, 26, 36, 48, 60, 72];
const FORMAS_COMPROBAR_INGRESOS = ["No cuenta", "Recibo de Nómina", "Factura por Servicios", "Estado de Cuenta", "Declaración de Impuestos", "Pago de Pensión", "Carta de Ingresos"];
const MOTIVOS_COMPRA = ["Renovar auto", "Mi familia se hace más grande", "Mi trabajo me lo pide", "Mi estilo de vida me lo pide"];
const PERFILES_PROFESIONALES = ["Comerciales", "Asalariado Sector Público", "Asalariado Sector Privado", "Pensionado", "Profesionista Independiente"];
const ESTADOS_CIVILES = ["Soltero", "Casado", "Divorciado"];
const ASESORES = ["Enrique Vazquez Islas", "Ricardo Platas", "Verónica Del Rayo Galindo León", "Julio Camacho Barragán", "Fernanda Romero Aguilar", "Zaira Vanessa Hernández Gómez",];
const PASATIEMPOS = ["Ciclismo", "Natación", "Futbol", "Pesca", "Senderismo", "Tenis-frontón", "Golf", "Mixología", "Cocinar", "Coleccionar objetos", "Viajar dentro del país", "Viajar fuera del país", "Automovilismo", "Fotografía", "Pintura", "Arquitectura", "Conciertos", "Ajedrez", "Lectura", "Desarrollo personal", "Pilates", "Yoga", "Neurociencias", "Aprendizaje de idioma"];
const PIE_COLORS = ["#000000", "#2a2a2a", "#555555", "#808080", "#aaaaaa"];
const PAGE_SIZE = 10;

const INITIAL_FORM = {
    agencia: "", nombre_prospecto: "", codigo_postal: "", telefono: "", email: "",
    asesor_ventas: "", motivo_ingreso: "", tipo_persona: "Física", tiempo_compra: "",
    auto_suenos: "", deja_auto_cuenta: false, modelo_auto_cuenta: "", forma_capitalizacion: "",
    presupuesto_estimado: "", enganche_presupuestado: "", mensualidades_presupuestadas: "",
    comprueba_ingresos: false, forma_comprobar_ingresos: "No cuenta", motivo_compra: "",
    perfil_profesional: "", edad: "", cantidad_hijos: "0", estado_civil: "", pasatiempos: [], comentarios: "",
};

// ─── helpers ─────────────────────────────────────────────────────────────────
function normalizeStr(v) { return String(v ?? "").trim(); }
function normalizarBusqueda(v) { return normalizeStr(v).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function soloNumeros(v) { return String(v || "").replace(/\D/g, ""); }
function validarTelefono(v) { const t = soloNumeros(v); return t.length === 10 || (t.length === 12 && t.startsWith("52")); }
function mensajeTelefono(v) {
    const t = soloNumeros(v);
    if (!t) return "Captura un teléfono numérico.";
    if (t.length < 10) return "Mínimo 10 dígitos.";
    if (t.length === 11) return "No puede tener 11 dígitos.";
    if (t.length === 12 && !t.startsWith("52")) return "12 dígitos debe iniciar con 52.";
    if (t.length > 12) return "Máximo 12 dígitos.";
    return "Teléfono inválido.";
}
function validarEmail(v) { const e = normalizeStr(v); if (!e) return true; return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e); }
function money(v) { return Number(v || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }); }
function dateTime(v) { if (!v) return "—"; const d = new Date(v); if (isNaN(d)) return "—"; return d.toLocaleString("es-MX", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }); }
function toYMDLocal(v) { const d = new Date(v); if (isNaN(d)) return ""; const p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; }
function ymdToInt(ymd) { if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null; return Number(ymd.replaceAll("-", "")); }
function addDays(date, days) { const d = new Date(date); d.setDate(d.getDate() + days); return d; }
function startOfWeekMonday(date) { const d = new Date(date); const delta = (d.getDay() + 6) % 7; d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - delta); return d; }
function weekdayShortEs(d) { return ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"][d.getDay()] || ""; }
function timeShort(v) { if (!v) return ""; const d = new Date(v); if (isNaN(d)) return ""; return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }); }
function formatWeekTitle(s, e) {
    return `${s.toLocaleDateString("es-MX", { day: "numeric", month: "long" })} — ${e.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}`;
}
function getInitials(nombre) {
    const parts = normalizeStr(nombre).split(/\s+/).filter(Boolean);
    if (!parts.length) return "—";
    const first = parts[0]?.[0] || "";
    const second = parts[1]?.[0] || "";
    return (first + second).toUpperCase();
}

function normalizarPayload(form) {
    return { ...form, agencia: normalizeStr(form.agencia), nombre_prospecto: normalizeStr(form.nombre_prospecto).toUpperCase(), codigo_postal: soloNumeros(form.codigo_postal), telefono: soloNumeros(form.telefono), email: normalizeStr(form.email), asesor_ventas: normalizeStr(form.asesor_ventas), auto_suenos: normalizeStr(form.auto_suenos), presupuesto_estimado: Number(form.presupuesto_estimado || 0), enganche_presupuestado: Number(form.enganche_presupuestado || 0), mensualidades_presupuestadas: Number(form.mensualidades_presupuestadas || 0), edad: form.edad === "" ? null : Number(form.edad), cantidad_hijos: Number(form.cantidad_hijos || 0), modelo_auto_cuenta: form.deja_auto_cuenta ? normalizeStr(form.modelo_auto_cuenta) : "", pasatiempos: Array.isArray(form.pasatiempos) ? form.pasatiempos : [], comentarios: normalizeStr(form.comentarios) };
}

// Validación de obligatoriedad removida a propósito: ningún campo es requerido
// para guardar un registro de tráfico de piso. Se conserva la función por si
// se quiere reactivar alguna regla puntual en el futuro.
function validarFormulario(_form) {
    return [];
}

// ─── micro-components ────────────────────────────────────────────────────────
function Skeleton({ className = "" }) { return <div className={["animate-pulse rounded-md bg-slate-200", className].join(" ")} />; }

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 10 }).map((_, i) => (
                <td key={i} className="px-4 py-3"><div className="h-4 w-full max-w-[160px] rounded bg-slate-200/70" /></td>
            ))}
        </tr>
    );
}

function ModalSkeleton() {
    return (
        <div className="grid gap-3 md:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-black/10 bg-neutral-200/50 p-4">
                    <Skeleton className="h-4 w-36" /><Skeleton className="mt-3 h-10 w-full rounded-lg" />
                </div>
            ))}
        </div>
    );
}

function Modal({ open, title, subtitle, onClose, children, footer }) {
    if (!open) return null;
    return createPortal(
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} />
            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-6xl overflow-hidden rounded-xl border border-black bg-neutral-100 shadow-2xl">
                    <div className="flex items-center justify-between gap-3 bg-black px-5 py-4">
                        <div className="min-w-0">
                            <div className="truncate text-base font-extrabold text-white">{title}</div>
                            {subtitle ? <div className="mt-1 truncate text-xs text-white/60">{subtitle}</div> : null}
                        </div>
                        <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20" aria-label="Cerrar">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="max-h-[74vh] overflow-auto p-5">{children}</div>
                    {footer ? (
                        <div className="flex flex-col gap-2 border-t border-black/10 bg-white/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">{footer}</div>
                    ) : null}
                </div>
            </div>
        </div>,
        document.body
    );
}

function Section({ title, icon: Icon, children }) {
    return (
        <section className="rounded-xl border border-black/10 bg-white/60 p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-black">
                {Icon ? <Icon className="h-4 w-4" /> : null}
                <span>{title}</span>
            </div>
            {children}
        </section>
    );
}

function Field({ label, icon: Icon, required, hint, invalid, children }) {
    return (
        <div className={["rounded-lg border bg-neutral-200/50 p-4", invalid ? "border-red-400" : "border-black/10"].join(" ")}>
            <div className="mb-2 flex items-center justify-between gap-2 text-sm font-bold text-black">
                <div className="flex items-center gap-2">
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                    <span>{label}{required ? <b className="ml-1 text-red-500">*</b> : null}</span>
                </div>
                {hint ? <span className="text-xs font-semibold text-slate-500">{hint}</span> : null}
            </div>
            {children}
        </div>
    );
}

function Input({ invalid = false, className = "", ...props }) {
    return (
        <input {...props} className={["w-full rounded-lg border px-3 py-2 text-sm font-semibold text-black shadow-sm outline-none", invalid ? "border-red-500 bg-red-50" : "border-black/15 bg-neutral-100", props.disabled ? "cursor-not-allowed opacity-75" : "", className].join(" ")} />
    );
}

function Textarea({ invalid = false, className = "", ...props }) {
    return (
        <textarea {...props} className={["min-h-[110px] w-full resize-none rounded-lg border px-3 py-2 text-sm font-semibold text-black shadow-sm outline-none", invalid ? "border-red-500 bg-red-50" : "border-black/15 bg-neutral-100", className].join(" ")} />
    );
}

function Select({ invalid = false, children, className = "", ...props }) {
    return (
        <select {...props} className={["w-full rounded-lg border px-3 py-2 text-sm font-semibold text-black shadow-sm outline-none", invalid ? "border-red-500 bg-red-50" : "border-black/15 bg-neutral-100", className].join(" ")}>
            {children}
        </select>
    );
}

function BooleanSwitch({ value, onChange, yes = "SÍ", no = "NO" }) {
    return (
        <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-black/15 bg-white p-1 shadow-sm">
            <button type="button" onClick={() => onChange(true)} className={["rounded-md px-3 py-2 text-sm font-extrabold transition", value ? "bg-black text-white shadow-sm" : "text-black hover:bg-slate-100"].join(" ")}>{yes}</button>
            <button type="button" onClick={() => onChange(false)} className={["rounded-md px-3 py-2 text-sm font-extrabold transition", !value ? "bg-black text-white shadow-sm" : "text-black hover:bg-slate-100"].join(" ")}>{no}</button>
        </div>
    );
}

function PasatiemposPicker({ value, onChange }) {
    const sel = new Set(value || []);
    return (
        <div className="rounded-lg border border-black/10 bg-neutral-200/50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-extrabold text-black">
                    <HeartHandshake className="h-4 w-4" /><span>Pasatiempos</span>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-600">
                    {value.length} seleccionados
                </span>
            </div>
            <div className="flex max-h-[220px] flex-wrap gap-2 overflow-y-auto pr-1">
                {PASATIEMPOS.map((item) => {
                    const active = sel.has(item);
                    return (
                        <button key={item} type="button" onClick={() => { if (active) onChange((value || []).filter(x => x !== item)); else onChange([...(value || []), item]); }}
                            className={["rounded-full border px-3 py-2 text-xs font-extrabold transition", active ? "border-black bg-black text-white" : "border-black/15 bg-white text-black hover:border-black"].join(" ")}>
                            {item}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function AsesorAutocomplete({ value, onChange, invalid }) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);
    const opciones = useMemo(() => {
        const q = normalizarBusqueda(value);
        return q ? ASESORES.filter(a => normalizarBusqueda(a).includes(q)).slice(0, 20) : ASESORES.slice(0, 20);
    }, [value]);
    useEffect(() => {
        const fn = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false); };
        window.addEventListener("mousedown", fn);
        return () => window.removeEventListener("mousedown", fn);
    }, []);
    return (
        <div ref={wrapperRef} className="relative">
            <Input value={value} invalid={invalid} onChange={(e) => { onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder="Escribe para buscar asesor..." />
            {open ? (
                <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl">
                    <div className="border-b border-black/10 px-3 py-2 text-xs font-bold text-black">Selecciona un asesor</div>
                    <div className="max-h-56 overflow-y-auto">
                        {opciones.map(a => (
                            <button key={a} type="button" onClick={() => { onChange(a); setOpen(false); }} className="block w-full px-3 py-3 text-left text-sm font-extrabold text-black hover:bg-slate-50">{a}</button>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function SortButton({ label, sortKey, sort, onClick }) {
    const active = sort.key === sortKey;
    return (
        <button type="button" onClick={() => onClick(sortKey)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900">
            {label}
            <span className="opacity-70">{active ? sort.dir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3.5 w-3.5" />}</span>
        </button>
    );
}

function ContextMenu({ ctxMenu, onDelete, onClose }) {
    if (!ctxMenu.open || !ctxMenu.row) return null;
    return createPortal(
        <div className="fixed z-[9999]" style={{ left: ctxMenu.x, top: ctxMenu.y }} onClick={e => e.stopPropagation()}>
            <div className="w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
                <button type="button" className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50" onClick={() => onDelete(ctxMenu.row)}>
                    <Trash2 className="h-4 w-4" /> Eliminar
                </button>
                <button type="button" className="w-full px-4 py-2 text-left text-xs text-slate-400 hover:bg-slate-50" onClick={onClose}>Cerrar</button>
            </div>
        </div>,
        document.body
    );
}

// ─── vista agenda ─────────────────────────────────────────────────────────────
function AgendaCard({ item, onEdit, onContext }) {
    const tiempoColor =
        item.tiempo_compra === "Este mes"
            ? { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" }
            : item.tiempo_compra === "De 1 a 3 meses"
                ? { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" }
                : { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200" };

    return (
        <button
            type="button"
            onClick={() => onEdit(item)}
            onContextMenu={e => onContext(e, item)}
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-[1px] hover:shadow-md hover:border-slate-300"
            title="Click para editar. Click derecho para eliminar."
        >
            {/* badge tiempo compra arriba */}
            {item.tiempo_compra && (
                <span className={[
                    "mb-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold",
                    tiempoColor.bg, tiempoColor.text, tiempoColor.border
                ].join(" ")}>
                    {item.tiempo_compra}
                </span>
            )}

            {/* nombre */}
            <div className="text-[12px] font-bold leading-snug text-slate-900 line-clamp-2">
                {item.nombre_prospecto || "—"}
            </div>

            {/* auto */}
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
                <CarFront className="h-3 w-3 shrink-0 text-slate-400" />
                <span className="line-clamp-1">{item.auto_suenos || "—"}</span>
            </div>

            {/* teléfono */}
            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
                <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                <span>{item.telefono || "—"}</span>
            </div>

            {/* hora — abajo */}
            <div className="mt-2 flex items-center gap-1 text-[9px] text-slate-400">
                <Clock className="h-2.5 w-2.5" />
                {timeShort(item.creado_en) || "—"}
            </div>
        </button>
    );
}

function AgendaWeekView({ rows, loading, currentWeekDate, setCurrentWeekDate, onEdit, onContext, onOpenCreate }) {
    const weekStart = useMemo(() => startOfWeekMonday(currentWeekDate), [currentWeekDate]);
    const weekDays = useMemo(() => Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)), [weekStart]);
    const weekEnd = weekDays[weekDays.length - 1];
    const todayIso = toYMDLocal(new Date());

    // agrupado por día, ordenado por hora real ascendente (no inventamos turnos)
    const rowsByDay = useMemo(() => {
        const map = new Map();
        for (const row of rows) {
            if (!row.creado_en) continue;
            const key = toYMDLocal(row.creado_en);
            if (!key) continue;
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(row);
        }
        for (const arr of map.values()) arr.sort((a, b) => new Date(a.creado_en) - new Date(b.creado_en));
        return map;
    }, [rows]);

    const outOfWeek = useMemo(() => {
        const minInt = ymdToInt(toYMDLocal(weekStart));
        const maxInt = ymdToInt(toYMDLocal(weekEnd));
        return rows
            .filter(r => {
                if (!r.creado_en) return true;
                const v = ymdToInt(toYMDLocal(r.creado_en));
                return !v || v < minInt || v > maxInt;
            })
            .sort((a, b) => new Date(a.creado_en || 0) - new Date(b.creado_en || 0));
    }, [rows, weekStart, weekEnd]);

    return (
        <div className="hidden lg:block">
            {/* nav semana */}
            <div className="mb-3 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Semana</div>
                    <div className="truncate text-sm font-bold text-slate-900">{formatWeekTitle(weekStart, weekEnd)}</div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setCurrentWeekDate(d => addDays(d, -7))}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
                        aria-label="Semana anterior"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setCurrentWeekDate(new Date())}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                        Hoy
                    </button>
                    <button
                        type="button"
                        onClick={() => setCurrentWeekDate(d => addDays(d, 7))}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
                        aria-label="Semana siguiente"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
            {/* agenda por columnas de día — cada columna crece libremente, sin recortes */}
            <div className="overflow-hidden rounded-xl border border-black/15 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <div className="grid" style={{ gridTemplateColumns: "repeat(6, minmax(200px, 1fr))", minWidth: 1200 }}>
                        {loading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="flex flex-col border-r border-black/8 last:border-r-0">
                                    <div className="border-b border-black bg-black px-3 py-3">
                                        <Skeleton className="h-3 w-10 bg-white/20" />
                                        <Skeleton className="mt-2 h-6 w-6 rounded-full bg-white/20" />
                                    </div>
                                    <div className="space-y-2 p-2">
                                        <Skeleton className="h-20 w-full rounded-lg" />
                                        <Skeleton className="h-20 w-full rounded-lg" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            weekDays.map(day => {
                                const dayKey = toYMDLocal(day);
                                const isToday = dayKey === todayIso;
                                const items = rowsByDay.get(dayKey) || [];
                                return (
                                    <div key={dayKey} className="flex flex-col border-r border-black/8 last:border-r-0">
                                        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-3">
                                            <div>
                                                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{weekdayShortEs(day)}</div>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span className={[
                                                        "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold",
                                                        isToday ? "bg-slate-900 text-white" : "text-slate-700"
                                                    ].join(" ")}>
                                                        {day.getDate()}
                                                    </span>
                                                    {items.length > 0 && (
                                                        <span className="text-[9px] font-semibold text-slate-400">
                                                            {items.length} ingreso{items.length !== 1 ? "s" : ""}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={onOpenCreate}
                                                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                                                title="Nuevo ingreso"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <div className="flex-1 space-y-2 bg-white p-2">
                                            {items.length === 0 ? (
                                                <div className="rounded-lg border border-dashed border-black/10 px-2 py-8 text-center text-[10px] font-semibold text-slate-300">
                                                    Sin ingresos
                                                </div>
                                            ) : items.map(item => (
                                                <AgendaCard key={item.id_trafico} item={item} onEdit={onEdit} onContext={onContext} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* fuera de semana */}
            {!loading && outOfWeek.length ? (
                <div className="mt-3 overflow-hidden rounded-xl border border-black/15 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                            Ingresos fuera de esta semana
                        </span>
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-600">
                            {outOfWeek.length}
                        </span>
                    </div>
                    <div className="grid gap-2 p-3 md:grid-cols-3 xl:grid-cols-4">
                        {outOfWeek.map(item => (
                            <AgendaCard key={item.id_trafico} item={item} onEdit={onEdit} onContext={onContext} />
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function AgendaMobileList({ rows, loading, onEdit, onContext }) {
    const grouped = useMemo(() => {
        const map = new Map();
        for (const r of rows) {
            const key = r.creado_en ? toYMDLocal(r.creado_en) : "sin-fecha";
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(r);
        }
        for (const arr of map.values()) {
            arr.sort((a, b) => new Date(a.creado_en || 0) - new Date(b.creado_en || 0));
        }
        return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
    }, [rows]);

    if (loading) return (
        <div className="grid gap-3 lg:hidden">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
                    <Skeleton className="h-4 w-40" /><Skeleton className="mt-3 h-4 w-28" />
                </div>
            ))}
        </div>
    );
    if (!rows.length) return (
        <div className="rounded-xl border border-black/10 bg-white px-4 py-10 text-center text-sm font-semibold text-black lg:hidden">
            No hay registros esta semana.
        </div>
    );

    return (
        <div className="grid gap-4 lg:hidden">
            {grouped.map(([key, items]) => {
                const title = key === "sin-fecha"
                    ? "Sin fecha"
                    : new Date(key + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
                return (
                    <section key={key} className="overflow-hidden rounded-xl border border-black/15 bg-white shadow-sm">
                        {/* encabezado de fecha — NEGRO */}
                        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">{title}</h3>
                        </div>
                        <div className="grid gap-2 p-3 sm:grid-cols-2">
                            {items.map(item => (
                                <AgendaCard key={item.id_trafico} item={item} onEdit={onEdit} onContext={onContext} />
                            ))}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}

// ─── vista gráficas (sin cambios de estilo) ──────────────────────────────────
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-black/10 bg-white p-3 text-xs shadow-md">
            <div className="mb-1 font-extrabold text-black">{label}</div>
            {payload.map(p => (
                <div key={p.dataKey} className="flex items-center justify-between gap-6">
                    <span className="text-slate-500">{p.name}</span>
                    <span className="font-bold text-black">{p.value}</span>
                </div>
            ))}
        </div>
    );
}

function ChartCard({ title, subtitle, children }) {
    return (
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-1 text-sm font-extrabold text-black">{title}</div>
            {subtitle ? <div className="mb-4 text-xs text-slate-500">{subtitle}</div> : <div className="mb-4" />}
            <div className="h-64">{children}</div>
        </div>
    );
}

function GraficasView({ registros }) {
    const total = registros.length;
    const conAutoCuenta = registros.filter(r => r.deja_auto_cuenta).length;
    const promPresupuesto = total ? registros.reduce((acc, r) => acc + Number(r.presupuesto_estimado || 0), 0) / total : 0;
    const esMes = registros.filter(r => r.tiempo_compra === "Este mes").length;

    const trendData = useMemo(() => {
        const hoy = new Date();
        return Array.from({ length: 7 }, (_, i) => {
            const d = addDays(hoy, -(6 - i));
            const key = toYMDLocal(d);
            const count = registros.filter(r => r.creado_en && toYMDLocal(r.creado_en) === key).length;
            return { name: weekdayShortEs(d), ingresos: count };
        });
    }, [registros]);

    const byTiempo = useMemo(() => {
        const map = {};
        for (const r of registros) { const k = r.tiempo_compra || "Sin dato"; map[k] = (map[k] || 0) + 1; }
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [registros]);

    const byAuto = useMemo(() => {
        const map = {};
        for (const r of registros) { const k = r.auto_suenos || "—"; map[k] = (map[k] || 0) + 1; }
        return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([auto, citas]) => ({ auto, citas }));
    }, [registros]);

    const byCapital = useMemo(() => {
        const map = {};
        for (const r of registros) { const k = r.forma_capitalizacion || "—"; map[k] = (map[k] || 0) + 1; }
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [registros]);

    const byAsesor = useMemo(() => {
        const map = {};
        for (const r of registros) { const k = r.asesor_ventas || "—"; map[k] = (map[k] || 0) + 1; }
        return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([asesor, ingresos]) => ({ asesor: asesor.split(" ")[0], ingresos }));
    }, [registros]);

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Total ingresos", value: total },
                    { label: "Dejan auto a cuenta", value: conAutoCuenta },
                    { label: "Compran este mes", value: esMes },
                    { label: "Presupuesto promedio", value: money(promPresupuesto) },
                ].map(k => (
                    <div key={k.label} className="relative overflow-hidden rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-black/5 blur-3xl" />
                        <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{k.label}</div>
                        <div className="mt-2 text-3xl font-extrabold text-black">{k.value}</div>
                    </div>
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <ChartCard title="Ingresos últimos 7 días" subtitle="Prospectos que entraron a la agencia">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
                                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#000" fill="#000" fillOpacity={0.1} strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
                <ChartCard title="Por tiempo de compra" subtitle="Cuándo planean comprar">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                            <Pie data={byTiempo} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                                {byTiempo.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <ChartCard title="Auto de sus sueños" subtitle="Modelos más solicitados">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={byAuto} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="auto" tick={{ fontSize: 10, fill: "#6b7280" }} />
                            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="citas" name="Ingresos" fill="#000" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Forma de capitalización" subtitle="¿Cómo planean pagar?">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={byCapital} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: "#6b7280" }} width={90} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name="Ingresos" fill="#404040" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Top asesores" subtitle="Ingresos registrados por asesor">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={byAsesor} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="asesor" tick={{ fontSize: 10, fill: "#6b7280" }} />
                            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="ingresos" name="Ingresos" fill="#222" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    );
}

// ─── componente principal ────────────────────────────────────────────────────
export default function TraficoPiso() {
    const [registros, setRegistros] = useState([]);
    const [viewMode, setViewMode] = useState("tabla");
    const [currentWeekDate, setCurrentWeekDate] = useState(new Date());

    const [filters, setFilters] = useState({ q: "", tipoPersona: "Todos", tiempoCompra: "Todos", rangoDesde: "", rangoHasta: "" });
    const [sort, setSort] = useState({ key: "creado_en", dir: "desc" });
    const [page, setPage] = useState(1);
    const [ctxMenu, setCtxMenu] = useState({ open: false, x: 0, y: 0, row: null });

    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState("create");
    const [draft, setDraft] = useState(null);

    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [ok, setOk] = useState("");

    // Sin campos obligatorios: ningún Field se marca como inválido.
    function isInvalid() { return false; }

    function updateField(name, value) { setDraft(prev => ({ ...(prev || INITIAL_FORM), [name]: value })); }
    function toggleSort(key) { setSort(prev => ({ key, dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc" })); }

    async function cargarDatos() {
        try {
            setLoadingList(true); setError("");
            const lista = await apiTraficoPiso.list();
            const arr = Array.isArray(lista) ? lista : lista?.results || [];
            setRegistros(arr);
            // saltar a la semana del registro más reciente
            if (arr.length) {
                const fechas = arr.map(r => r.creado_en ? new Date(r.creado_en) : null).filter(Boolean).sort((a, b) => b - a);
                if (fechas[0]) setCurrentWeekDate(fechas[0]);
            }
        } catch (err) {
            console.error(err); setError(err.message || "No se pudo cargar."); setRegistros([]);
        } finally {
            setLoadingList(false);
        }
    }

    useEffect(() => { cargarDatos(); }, []);

    useEffect(() => {
        const fn = () => setCtxMenu(p => ({ ...p, open: false, row: null }));
        window.addEventListener("click", fn);
        window.addEventListener("scroll", fn, true);
        window.addEventListener("resize", fn);
        return () => { window.removeEventListener("click", fn); window.removeEventListener("scroll", fn, true); window.removeEventListener("resize", fn); };
    }, []);

    // resetear a la página 1 cuando cambian filtros u orden
    useEffect(() => { setPage(1); }, [filters.q, filters.tipoPersona, filters.tiempoCompra, filters.rangoDesde, filters.rangoHasta, sort.key, sort.dir]);

    function openCreate() { setError(""); setOk(""); setMode("create"); setDraft({ ...INITIAL_FORM }); setOpenModal(true); }

    async function openEdit(row) {
        if (!row?.id_trafico) return;
        try {
            setError(""); setOk(""); setMode("edit"); setOpenModal(true); setLoadingDetail(true);
            const item = await apiTraficoPiso.get(row.id_trafico);
            setDraft({ ...INITIAL_FORM, ...item, presupuesto_estimado: item.presupuesto_estimado == null ? "" : String(parseInt(item.presupuesto_estimado || 0, 10) || ""), enganche_presupuestado: item.enganche_presupuestado == null ? "" : String(parseInt(item.enganche_presupuestado || 0, 10) || ""), mensualidades_presupuestadas: item.mensualidades_presupuestadas ? String(item.mensualidades_presupuestadas) : "", edad: item.edad == null ? "" : String(item.edad), cantidad_hijos: item.cantidad_hijos == null ? "0" : String(item.cantidad_hijos), pasatiempos: Array.isArray(item.pasatiempos) ? item.pasatiempos : [], deja_auto_cuenta: !!item.deja_auto_cuenta, comprueba_ingresos: !!item.comprueba_ingresos });
        } catch (err) {
            console.error(err); setError(err.message || "No se pudo abrir el registro."); setOpenModal(false);
        } finally {
            setLoadingDetail(false);
        }
    }

    function closeModal() { if (saving) return; setOpenModal(false); setDraft(null); }

    async function save() {
        if (!draft || saving) return;
        setError(""); setOk("");
        try {
            setSaving(true);
            const payload = normalizarPayload(draft);
            if (mode === "edit" && draft.id_trafico) { await apiTraficoPiso.update(draft.id_trafico, payload); setOk("Registro actualizado."); }
            else { await apiTraficoPiso.create(payload); setOk("Registro guardado."); }
            await cargarDatos(); closeModal();
        } catch (err) {
            console.error(err); setError(err.message || "No se pudo guardar.");
        } finally {
            setSaving(false);
        }
    }

    async function eliminar(row) {
        if (!row?.id_trafico) return;
        if (!confirm(`¿Eliminar el registro de ${row.nombre_prospecto || "este prospecto"}?`)) return;
        try {
            setError(""); setOk("");
            await apiTraficoPiso.remove(row.id_trafico);
            await cargarDatos(); setOk("Registro eliminado.");
        } catch (err) {
            console.error(err); setError(err.message || "No se pudo eliminar.");
        } finally {
            setCtxMenu({ open: false, x: 0, y: 0, row: null });
        }
    }

    function onRowContextMenu(e, row) { e.preventDefault(); e.stopPropagation(); setCtxMenu({ open: true, x: e.clientX, y: e.clientY, row }); }
    function onMenuClick(e, row) {
        e.preventDefault(); e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setCtxMenu({ open: true, x: rect.right - 192, y: rect.bottom + 6, row });
    }
    function resetFilters() { setFilters({ q: "", tipoPersona: "Todos", tiempoCompra: "Todos", rangoDesde: "", rangoHasta: "" }); }
    function setHoy() { const hoy = toYMDLocal(new Date()); setFilters(p => ({ ...p, rangoDesde: hoy, rangoHasta: hoy })); }

    const filtered = useMemo(() => {
        const q = normalizeStr(filters.q).toLowerCase();
        const desdeInt = ymdToInt(filters.rangoDesde);
        const hastaInt = ymdToInt(filters.rangoHasta);
        return (registros || []).filter(item => {
            const s = [item.agencia, item.nombre_prospecto, item.telefono, item.email, item.asesor_ventas, item.motivo_ingreso, item.tipo_persona, item.tiempo_compra, item.auto_suenos, item.forma_capitalizacion, item.perfil_profesional, item.estado_civil, item.comentarios].map(v => normalizeStr(v).toLowerCase()).join(" ");
            const matchQ = !q || s.includes(q);
            const matchTipo = filters.tipoPersona === "Todos" || item.tipo_persona === filters.tipoPersona;
            const matchTiempo = filters.tiempoCompra === "Todos" || item.tiempo_compra === filters.tiempoCompra;
            let matchRango = true;
            if (desdeInt !== null || hastaInt !== null) {
                const ymdInt = ymdToInt(toYMDLocal(item.creado_en));
                if (!ymdInt) return false;
                if (desdeInt !== null && ymdInt < desdeInt) matchRango = false;
                if (hastaInt !== null && ymdInt > hastaInt) matchRango = false;
            }
            return matchQ && matchTipo && matchTiempo && matchRango;
        });
    }, [registros, filters]);

    const sorted = useMemo(() => {
        const data = [...filtered];
        const { key, dir } = sort;
        const mult = dir === "asc" ? 1 : -1;
        return data.sort((a, b) => {
            if (key === "creado_en") return (new Date(a[key] || 0).getTime() - new Date(b[key] || 0).getTime()) * mult;
            if (["presupuesto_estimado", "enganche_presupuestado"].includes(key)) return (Number(a[key] || 0) - Number(b[key] || 0)) * mult;
            const va = normalizeStr(a?.[key]).toLowerCase(), vb = normalizeStr(b?.[key]).toLowerCase();
            return va < vb ? -1 * mult : va > vb ? 1 * mult : 0;
        });
    }, [filtered, sort]);

    // ── paginación ──
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageStart = (currentPage - 1) * PAGE_SIZE;
    const paginated = useMemo(() => sorted.slice(pageStart, pageStart + PAGE_SIZE), [sorted, pageStart]);

    const pageItems = useMemo(() => {
        const arr = Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1);
        const out = [];
        arr.forEach((p, idx) => {
            if (idx > 0 && p - arr[idx - 1] > 1) out.push("...");
            out.push(p);
        });
        return out;
    }, [totalPages, currentPage]);

    // ── stats (estilo Citas) ──
    const stats = useMemo(() => {
        const total = registros.length;
        const hoyYmd = toYMDLocal(new Date());
        const ingresosHoy = registros.filter(r => r.creado_en && toYMDLocal(r.creado_en) === hoyYmd).length;
        const esteMes = registros.filter(r => r.tiempo_compra === "Este mes").length;
        const conAutoCuenta = registros.filter(r => r.deja_auto_cuenta).length;
        const sinAutoCuenta = total - conAutoCuenta;
        const tasaAutoCuenta = total ? Math.round((conAutoCuenta / total) * 100) : 0;
        return [
            { key: "hoy", label: "Ingresos de hoy", value: ingresosHoy, icon: CalendarDays, bg: "bg-blue-50", color: "text-blue-600" },
            { key: "mes", label: "Compran este mes", value: esteMes, icon: Clock, bg: "bg-slate-100", color: "text-slate-600" },
            { key: "si", label: "Dejan auto a cuenta", value: conAutoCuenta, icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600" },
            { key: "no", label: "Sin auto a cuenta", value: sinAutoCuenta, icon: XCircle, bg: "bg-rose-50", color: "text-rose-600" },
            { key: "tasa", label: "Tasa de auto a cuenta", value: `${tasaAutoCuenta}%`, sub: `${conAutoCuenta} de ${total}`, icon: PieChartIcon, bg: "bg-violet-50", color: "text-violet-600" },
        ];
    }, [registros]);

    return (
        <div className="w-full space-y-4">
            {/* ── Header claro ── */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Tráfico de piso</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {viewMode === "tabla"
                            ? "Control de prospectos que ingresan a la agencia."
                            : viewMode === "agenda"
                                ? "Vista semanal de ingresos a piso."
                                : "Estadísticas de tráfico de piso."}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* selector de vista */}
                    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                        {[
                            { key: "tabla", label: "Tabla", icon: TableProperties },
                            { key: "agenda", label: "Agenda", icon: CalendarRange },
                            { key: "graficas", label: "Gráficas", icon: BarChart2 },
                        ].map(({ key, label, icon: Icon }) => {
                            const active = viewMode === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setViewMode(key)}
                                    className={[
                                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition",
                                        active ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700",
                                    ].join(" ")}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo ingreso
                    </button>
                </div>
            </div>

            {/* alertas */}
            {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}
            {ok ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{ok}</div> : null}

            {/* filtros */}
            {viewMode !== "graficas" && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-12">
                        <div className="md:col-span-4">
                            <label className="mb-1.5 block text-xs font-medium text-slate-500">Búsqueda</label>
                            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 focus-within:border-slate-400">
                                <Search className="h-4 w-4 text-slate-400" />
                                <input value={filters.q} onChange={e => setFilters(p => ({ ...p, q: e.target.value }))} placeholder="Prospecto, teléfono, asesor..." className="w-full text-sm text-slate-900 outline-none placeholder:text-slate-400" />
                                {filters.q ? <button type="button" onClick={() => setFilters(p => ({ ...p, q: "" }))} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button> : null}
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="mb-1.5 block text-xs font-medium text-slate-500">Tipo persona</label>
                            <select value={filters.tipoPersona} onChange={e => setFilters(p => ({ ...p, tipoPersona: e.target.value }))} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400">
                                <option value="Todos">Todos</option>
                                {TIPOS_PERSONA.map(x => <option key={x} value={x}>{x}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="mb-1.5 block text-xs font-medium text-slate-500">Tiempo compra</label>
                            <select value={filters.tiempoCompra} onChange={e => setFilters(p => ({ ...p, tiempoCompra: e.target.value }))} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400">
                                <option value="Todos">Todos</option>
                                {TIEMPOS_COMPRA.map(x => <option key={x} value={x}>{x}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="mb-1.5 block text-xs font-medium text-slate-500">Desde</label>
                            <input type="date" value={filters.rangoDesde} onChange={e => setFilters(p => ({ ...p, rangoDesde: e.target.value }))} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="mb-1.5 block text-xs font-medium text-slate-500">Hasta</label>
                            <input type="date" value={filters.rangoHasta} onChange={e => setFilters(p => ({ ...p, rangoHasta: e.target.value }))} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-2">
                        <button type="button" onClick={setHoy} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition">
                            <CalendarDays className="h-4 w-4" />Hoy
                        </button>
                        <button type="button" onClick={resetFilters} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                            <X className="h-4 w-4" />Limpiar
                        </button>
                    </div>
                </div>
            )}

            {/* stats — estilo Citas */}
            {viewMode !== "graficas" && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {stats.map((s) => (
                        <div key={s.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className={["mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full", s.bg, s.color].join(" ")}>
                                <s.icon className="h-5 w-5" />
                            </div>
                            <div className="text-2xl font-semibold text-slate-900">{s.value}</div>
                            <div className="mt-0.5 text-xs font-medium text-slate-500">{s.label}</div>
                            {s.sub ? <div className="mt-0.5 text-[11px] text-slate-400">{s.sub}</div> : null}
                        </div>
                    ))}
                </div>
            )}

            {/* ── VISTA TABLA ── */}
            {viewMode === "tabla" && (
                <>
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="hidden overflow-auto lg:block">
                            <table className="min-w-[1200px] w-full text-left text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3"><SortButton label="Fecha" sortKey="creado_en" sort={sort} onClick={toggleSort} /></th>
                                        <th className="px-4 py-3"><SortButton label="Dealer" sortKey="agencia" sort={sort} onClick={toggleSort} /></th>
                                        <th className="px-4 py-3"><SortButton label="Prospecto" sortKey="nombre_prospecto" sort={sort} onClick={toggleSort} /></th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">Teléfono</th>
                                        <th className="px-4 py-3"><SortButton label="Asesor" sortKey="asesor_ventas" sort={sort} onClick={toggleSort} /></th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">Ingreso</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">Compra</th>
                                        <th className="px-4 py-3"><SortButton label="Presupuesto" sortKey="presupuesto_estimado" sort={sort} onClick={toggleSort} /></th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">Auto cuenta</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loadingList ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />) : sorted.length === 0 ? (
                                        <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-500">No hay registros con esos filtros.</td></tr>
                                    ) : paginated.map(item => (
                                        <tr key={item.id_trafico} onDoubleClick={() => openEdit(item)} onContextMenu={e => onRowContextMenu(e, item)} className="cursor-pointer transition hover:bg-slate-50">
                                            <td className="px-4 py-3 text-slate-500">{dateTime(item.creado_en)}</td>
                                            <td className="px-4 py-3 text-slate-700"><div className="max-w-[120px] truncate font-medium">{item.agencia || "—"}</div></td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                                                        {getInitials(item.nombre_prospecto)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="max-w-[200px] truncate font-semibold text-slate-900">{item.nombre_prospecto || "—"}</div>
                                                        {item.email ? <div className="max-w-[200px] truncate text-xs text-slate-400">{item.email}</div> : null}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-700">{item.telefono || "—"}</td>
                                            <td className="px-4 py-3 text-slate-700"><div className="max-w-[200px] truncate font-medium">{item.asesor_ventas || "—"}</div></td>
                                            <td className="px-4 py-3 text-slate-700"><div className="max-w-[200px] font-medium">{item.motivo_ingreso || "—"}</div><div className="mt-1 text-xs text-slate-400">{item.tipo_persona || "—"}</div></td>
                                            <td className="px-4 py-3 text-slate-700"><div className="font-medium">{item.tiempo_compra || "—"}</div><div className="mt-1 max-w-[200px] truncate text-xs text-slate-400">Auto: {item.auto_suenos || "—"}</div><div className="mt-1 max-w-[200px] truncate text-xs text-slate-400">{item.forma_capitalizacion || "—"}</div></td>
                                            <td className="px-4 py-3 text-slate-900"><div className="font-semibold">{money(item.presupuesto_estimado)}</div><div className="mt-1 text-xs text-slate-400">Eng. {money(item.enganche_presupuestado)}</div></td>
                                            <td className="px-4 py-3">
                                                <span className={["inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", item.deja_auto_cuenta ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-rose-100 bg-rose-50 text-rose-700"].join(" ")}>{item.deja_auto_cuenta ? "Sí" : "No"}</span>
                                                {item.deja_auto_cuenta && item.modelo_auto_cuenta ? <div className="mt-1 max-w-[140px] truncate text-xs text-slate-400">{item.modelo_auto_cuenta}</div> : null}
                                            </td>
                                            <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                                                <div className="flex justify-end gap-1.5">
                                                    <button type="button" onClick={() => openEdit(item)} title="Editar" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition">
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button type="button" onClick={(e) => onMenuClick(e, item)} title="Más acciones" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* paginación */}
                        {!loadingList && sorted.length > 0 ? (
                            <div className="hidden flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:flex">
                                <span className="text-xs font-medium text-slate-500">
                                    Mostrando {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, sorted.length)} de {sorted.length} registros
                                </span>
                                <div className="flex items-center gap-1">
                                    <button type="button" disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent">
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    {pageItems.map((p, idx) => p === "..." ? (
                                        <span key={`e${idx}`} className="px-1.5 text-xs text-slate-400">…</span>
                                    ) : (
                                        <button key={p} type="button" onClick={() => setPage(p)} className={["inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition", p === currentPage ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"].join(" ")}>
                                            {p}
                                        </button>
                                    ))}
                                    <button type="button" disabled={currentPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent">
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="grid gap-3 lg:hidden">
                        {loadingList ? (
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-2 font-medium text-slate-600"><Loader2 className="h-5 w-5 animate-spin" />Cargando...</div></div>
                        ) : sorted.length === 0 ? (
                            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">No hay registros con esos filtros.</div>
                        ) : (
                            <>
                                {paginated.map(item => (
                                    <button key={item.id_trafico} type="button" onClick={() => openEdit(item)} className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:bg-slate-50 transition">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                                                    {getInitials(item.nombre_prospecto)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-semibold text-slate-900">{item.nombre_prospecto || "—"}</div>
                                                    <div className="mt-0.5 text-xs text-slate-400">{item.agencia || "—"} • {item.telefono || "—"}</div>
                                                </div>
                                            </div>
                                            <span className={["inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-semibold", item.deja_auto_cuenta ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-rose-100 bg-rose-50 text-rose-700"].join(" ")}>{item.deja_auto_cuenta ? "Sí" : "No"}</span>
                                        </div>
                                        <div className="mt-2 text-xs text-slate-400">{dateTime(item.creado_en)} • Asesor: {item.asesor_ventas || "—"}</div>
                                        <div className="mt-1 text-sm text-slate-600 line-clamp-2">{item.motivo_ingreso || "—"} • {item.tiempo_compra || "—"} • {item.auto_suenos || "—"} • {money(item.presupuesto_estimado)}</div>
                                    </button>
                                ))}
                                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                                    <span className="text-xs font-medium text-slate-500">{currentPage} / {totalPages}</span>
                                    <div className="flex items-center gap-1">
                                        <button type="button" disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40">
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <button type="button" disabled={currentPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40">
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}

            {/* ── VISTA AGENDA ── */}
            {viewMode === "agenda" && (
                <>
                    <AgendaMobileList rows={filtered} loading={loadingList} onEdit={openEdit} onContext={onRowContextMenu} />
                    <AgendaWeekView rows={filtered} loading={loadingList} currentWeekDate={currentWeekDate} setCurrentWeekDate={setCurrentWeekDate} onEdit={openEdit} onContext={onRowContextMenu} onOpenCreate={openCreate} />
                </>
            )}

            {/* ── VISTA GRÁFICAS ── */}
            {viewMode === "graficas" && <GraficasView registros={registros} />}

            <ContextMenu ctxMenu={ctxMenu} onDelete={eliminar} onClose={() => setCtxMenu({ open: false, x: 0, y: 0, row: null })} />

            {/* ── MODAL ── */}
            <Modal open={openModal} title={mode === "create" ? "Nuevo ingreso de tráfico de piso" : `Editar tráfico de piso • #${draft?.id_trafico || ""}`} onClose={closeModal}
                footer={
                    <>
                        <div className="min-w-0 text-xs font-bold text-slate-500">
                            Ningún campo es obligatorio: puedes guardar el registro en cualquier momento.
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                            <button type="button" onClick={closeModal} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"><X className="h-4 w-4" />Cancelar</button>
                            <button type="button" onClick={save} disabled={saving || loadingDetail} className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-bold text-white hover:bg-black/80 disabled:opacity-60 transition">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {saving ? "Guardando..." : "Guardar cambios"}
                            </button>
                        </div>
                    </>
                }>
                {loadingDetail ? <ModalSkeleton /> : !draft ? null : (
                    <div className="space-y-4">
                        <Section title="Datos generales" icon={User}>
                            <div className="grid gap-3 md:grid-cols-3">
                                <Field label="Dealer" icon={Building2} invalid={isInvalid("agencia")}><Select value={draft.agencia} invalid={isInvalid("agencia")} onChange={e => updateField("agencia", e.target.value)}><option value="">Seleccionar dealer...</option>{DEALERS.map(d => <option key={d} value={d}>{d}</option>)}</Select></Field>
                                <Field label="Nombre del prospecto" icon={User} hint="Mayúsculas" invalid={isInvalid("nombre_prospecto")}><Input value={draft.nombre_prospecto} invalid={isInvalid("nombre_prospecto")} onChange={e => updateField("nombre_prospecto", e.target.value.toUpperCase())} placeholder="NOMBRE COMPLETO" /></Field>
                                <Field label="Código postal" icon={ClipboardList} invalid={isInvalid("codigo_postal")}><Input value={draft.codigo_postal} invalid={isInvalid("codigo_postal")} onChange={e => updateField("codigo_postal", soloNumeros(e.target.value).slice(0, 5))} inputMode="numeric" placeholder="68300" /></Field>
                                <Field label="Teléfono" icon={Phone} invalid={isInvalid("telefono")}><Input value={draft.telefono} invalid={isInvalid("telefono")} onChange={e => updateField("telefono", soloNumeros(e.target.value).slice(0, 12))} inputMode="numeric" placeholder="10 dígitos" /></Field>
                                <Field label="E-mail" icon={Mail} invalid={isInvalid("email")}><Input type="email" value={draft.email} invalid={isInvalid("email")} onChange={e => updateField("email", e.target.value)} placeholder="correo@dominio.com" /></Field>
                                <Field label="Asesor de ventas" icon={UserRoundSearch} hint="Buscar" invalid={isInvalid("asesor_ventas")}><AsesorAutocomplete value={draft.asesor_ventas} invalid={isInvalid("asesor_ventas")} onChange={v => updateField("asesor_ventas", v)} /></Field>
                                <Field label="Ingresó a la agencia porque" icon={MessageSquareText} invalid={isInvalid("motivo_ingreso")}><Select value={draft.motivo_ingreso} invalid={isInvalid("motivo_ingreso")} onChange={e => updateField("motivo_ingreso", e.target.value)}><option value="">Seleccionar...</option>{MOTIVOS_INGRESO.map(x => <option key={x} value={x}>{x}</option>)}</Select></Field>
                                <Field label="Tipo de persona" icon={Users}>
                                    <div className="grid grid-cols-2 gap-2">
                                        {TIPOS_PERSONA.map(tipo => <button key={tipo} type="button" onClick={() => updateField("tipo_persona", tipo)} className={["rounded-lg border px-3 py-2 text-sm font-extrabold transition", draft.tipo_persona === tipo ? "border-black bg-black text-white" : "border-black/15 bg-white text-black hover:bg-slate-50"].join(" ")}>{tipo}</button>)}
                                    </div>
                                </Field>
                            </div>
                        </Section>

                        <Section title="Intención de compra" icon={CarFront}>
                            <div className="grid gap-3 md:grid-cols-3">
                                <Field label="Programación de compra" icon={Clock} invalid={isInvalid("tiempo_compra")}><Select value={draft.tiempo_compra} invalid={isInvalid("tiempo_compra")} onChange={e => updateField("tiempo_compra", e.target.value)}><option value="">Seleccionar...</option>{TIEMPOS_COMPRA.map(x => <option key={x} value={x}>{x}</option>)}</Select></Field>
                                <Field label="¿Deja auto a cuenta?" icon={CarFront}><BooleanSwitch value={!!draft.deja_auto_cuenta} onChange={v => updateField("deja_auto_cuenta", v)} /></Field>
                                <Field label="Auto de sus sueños" icon={CarFront} invalid={isInvalid("auto_suenos")}><Select value={draft.auto_suenos} invalid={isInvalid("auto_suenos")} onChange={e => updateField("auto_suenos", e.target.value)}><option value="">Seleccionar...</option>{VEHICULOS.map(v => <option key={v} value={v}>{v}</option>)}</Select></Field>
                                <Field label="Modelo de auto a cuenta" icon={CarFront} invalid={isInvalid("modelo_auto_cuenta")}><Input value={draft.modelo_auto_cuenta} invalid={isInvalid("modelo_auto_cuenta")} disabled={!draft.deja_auto_cuenta} onChange={e => updateField("modelo_auto_cuenta", e.target.value)} placeholder="Ej. Jetta 2020" /></Field>
                                <Field label="Forma de capitalización" icon={CircleDollarSign} invalid={isInvalid("forma_capitalizacion")}><Select value={draft.forma_capitalizacion} invalid={isInvalid("forma_capitalizacion")} onChange={e => updateField("forma_capitalizacion", e.target.value)}><option value="">Seleccionar...</option>{FORMAS_CAPITALIZACION.map(x => <option key={x} value={x}>{x}</option>)}</Select></Field>
                                <Field label="Presupuesto estimado" icon={BadgeDollarSign} invalid={isInvalid("presupuesto_estimado")}><Input value={draft.presupuesto_estimado} invalid={isInvalid("presupuesto_estimado")} onChange={e => updateField("presupuesto_estimado", soloNumeros(e.target.value))} inputMode="numeric" placeholder="300000" /></Field>
                                <Field label="Enganche presupuestado" icon={BadgeDollarSign} invalid={isInvalid("enganche_presupuestado")}><Input value={draft.enganche_presupuestado} invalid={isInvalid("enganche_presupuestado")} onChange={e => updateField("enganche_presupuestado", soloNumeros(e.target.value))} inputMode="numeric" placeholder="50000" /></Field>
                                <Field label="Mensualidades presupuestadas" icon={CalendarDays} invalid={isInvalid("mensualidades_presupuestadas")}><Select value={draft.mensualidades_presupuestadas} invalid={isInvalid("mensualidades_presupuestadas")} onChange={e => updateField("mensualidades_presupuestadas", e.target.value)}><option value="">Seleccionar...</option>{MENSUALIDADES.map(x => <option key={x} value={x}>{x}</option>)}</Select></Field>
                            </div>
                        </Section>

                        <Section title="Perfil financiero" icon={ShieldCheck}>
                            <div className="grid gap-3 md:grid-cols-3">
                                <Field label="Comprobación de ingresos" icon={ShieldCheck}><BooleanSwitch value={!!draft.comprueba_ingresos} onChange={v => updateField("comprueba_ingresos", v)} /></Field>
                                <Field label="Forma de comprobar ingresos" icon={ClipboardList} invalid={isInvalid("forma_comprobar_ingresos")}><Select value={draft.forma_comprobar_ingresos} invalid={isInvalid("forma_comprobar_ingresos")} onChange={e => updateField("forma_comprobar_ingresos", e.target.value)}>{FORMAS_COMPROBAR_INGRESOS.map(x => <option key={x} value={x}>{x}</option>)}</Select></Field>
                            </div>
                        </Section>

                        <Section title="Perfil del prospecto" icon={BriefcaseBusiness}>
                            <div className="grid gap-3 md:grid-cols-3">
                                <Field label="Motivo de compra" icon={MessageSquareText} invalid={isInvalid("motivo_compra")}><Select value={draft.motivo_compra} invalid={isInvalid("motivo_compra")} onChange={e => updateField("motivo_compra", e.target.value)}><option value="">Seleccionar...</option>{MOTIVOS_COMPRA.map(x => <option key={x} value={x}>{x}</option>)}</Select></Field>
                                <Field label="Perfil profesional" icon={BriefcaseBusiness} invalid={isInvalid("perfil_profesional")}><Select value={draft.perfil_profesional} invalid={isInvalid("perfil_profesional")} onChange={e => updateField("perfil_profesional", e.target.value)}><option value="">Seleccionar...</option>{PERFILES_PROFESIONALES.map(x => <option key={x} value={x}>{x}</option>)}</Select></Field>
                                <Field label="Estado civil" icon={Users} invalid={isInvalid("estado_civil")}><Select value={draft.estado_civil} invalid={isInvalid("estado_civil")} onChange={e => updateField("estado_civil", e.target.value)}><option value="">Seleccionar...</option>{ESTADOS_CIVILES.map(x => <option key={x} value={x}>{x}</option>)}</Select></Field>
                                <Field label="Edad" icon={User}><Input value={draft.edad} onChange={e => updateField("edad", soloNumeros(e.target.value).slice(0, 3))} inputMode="numeric" placeholder="35" /></Field>
                                <Field label="Cantidad de hijos" icon={Users}><Input value={draft.cantidad_hijos} onChange={e => updateField("cantidad_hijos", soloNumeros(e.target.value).slice(0, 2))} inputMode="numeric" placeholder="0" /></Field>
                            </div>
                            <div className="mt-3"><PasatiemposPicker value={draft.pasatiempos || []} onChange={v => updateField("pasatiempos", v)} /></div>
                            <div className="mt-3"><Field label="Comentarios" icon={MessageSquareText}><Textarea value={draft.comentarios} onChange={e => updateField("comentarios", e.target.value)} placeholder="Notas adicionales del asesor..." /></Field></div>
                        </Section>
                    </div>
                )}
            </Modal>
        </div>
    );
}