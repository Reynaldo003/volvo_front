// src/pages/IA/ConfigAI.jsx 
import { useEffect, useMemo, useRef, useState } from "react";
import {
    Bot, Car, CheckCircle2, ChevronDown, ChevronUp,
    Edit3, Loader2, Plus, RefreshCw, Save, Search,
    Trash2, X, Zap, Clock, Shield, AlertCircle,
    BarChart3, Wifi, WifiOff, ChevronRight, Info,
    ExternalLink, Tag, Calendar, Activity, Layers,
    BadgePercent,
} from "lucide-react";
import { api } from "../../lib/apiPruebas";
import volvoLogo from "../../assets/volvo_sin_fondo.png";

const C = {
    navy: "#131E5C",
    navyDk: "#0a1340",
    navyLt: "#1e2f8a",
    surface: "#F7F8FC",
    border: "#E4E7F0",
    borderMd: "#C8CEDF",
    muted: "#8891AD",
    text: "#1A1F3C",
    textSub: "#515778",
};
function normalizaNumeroConfigIA(value) {
    const raw = String(value || "").trim();

    if (!raw) return "";

    if (["GLOBAL", "TODOS", "ALL", "*"].includes(raw.toUpperCase())) {
        return "";
    }

    return normalizaTelefonoMx(raw);
}

function resetConfigIAFormulario({
    setSwiftActivo,
    setHorarios,
    setCampos,
    setCondFijas,
}) {
    setSwiftActivo(false);
    setHorarios(horarioInicial());
    setCampos(Object.fromEntries(secciones.map((s) => [s.id, ""])));
    setCondFijas(CONDICIONES_FIJAS);
}

// ─── Datos estáticos
const secciones = [
    {
        id: "identidad",
        titulo: "Identidad del agente",
        icon: Bot,
        desc: "Define quién es el asistente y cuál es su propósito principal.",
        placeholder: 'Ej: "Soy Ava, asistente digital de Volvo Cars Puebla. Atiendo prospectos interesados en vehículos Volvo nuevos."',
    },
    {
        id: "precios",
        titulo: "Política de precios",
        icon: Tag,
        desc: "Reglas que determinan cómo el agente maneja precios y cotizaciones.",
        placeholder: "Ej: Usar únicamente precios del catálogo registrado en el CRM. No inventar mensualidades, descuentos ni promociones.",
    },
    {
        id: "perfilamiento",
        titulo: "Perfilamiento de prospectos",
        icon: BarChart3,
        desc: "Parámetros que el agente debe identificar de cada prospecto.",
        placeholder: "Ej: Identificar nombre, modelo de interés, enganche, forma de pago, buró y plazo de compra. Hacer máximo una pregunta por mensaje.",
    },
    {
        id: "limites",
        titulo: "Límites de atención",
        icon: Shield,
        desc: "Cuándo y cómo debe derivar el agente a un asesor humano.",
        placeholder: "Ej: Si el cliente pide cotización formal, apartar unidad, mensualidad exacta o disponibilidad final, marcar pendiente y canalizar asesor.",
    },
    {
        id: "promociones_eventos",
        titulo: "Promociones y Eventos",
        icon: BadgePercent,
        desc: "Configuracion especial para eventos activos.",
        placeholder: "Ej: Si el cliente pide inscripcion a vocho fest, promociones actuales, etc.",
    },
    {
        id: "personalidad",
        titulo: "Tono y personalidad",
        icon: Activity,
        desc: "El estilo de comunicación que define la voz del asistente.",
        placeholder: "Ej: Responder cálido, breve, profesional y con enfoque comercial. Evitar mensajes largos o repetitivos.",
    },
];

const CONDICIONES_FIJAS = `- No proporcionar precios finales ni cotizaciones cerradas.
- No comprometer disponibilidad de unidades sin verificación previa.
- No inventar precios, mensualidades, promociones ni descuentos.
- Siempre derivar al asesor humano para cierre comercial o cotización formal.
- Mantener el tono institucional de Grupo Automotriz R&R.`;

const DIAS = [
    { id: "lun", label: "Lunes", short: "L" },
    { id: "mar", label: "Martes", short: "M" },
    { id: "mie", label: "Miércoles", short: "X" },
    { id: "jue", label: "Jueves", short: "J" },
    { id: "vie", label: "Viernes", short: "V" },
    { id: "sab", label: "Sábado", short: "S" },
    { id: "dom", label: "Domingo", short: "D" },
];

const emptyVehiculo = {
    id: null,
    marca: "Volvo",
    modelo: "",
    ano: new Date().getFullYear(),
    version: "",
    precio_lista: "",
    precio_contado: "",
    precio_financiado: "",
    resumen: "",
    ficha_tecnica: {},
    url_ficha_tecnica: "",
    imagenes: [],
    videos: [],
    ultima_actualizacion: "",
    activo: true,
};
// ─── Utils
const horarioInicial = () =>
    Object.fromEntries(DIAS.map((d) => [d.id, { activo: d.id !== "dom", inicio: "09:00", fin: "18:00", franjas: [{ inicio: "09:00", fin: "18:00" }] }]));

function normalizaTelefonoMx(tel) {
    const digits = String(tel || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("521") && digits.length === 13) return `52${digits.slice(3)}`;
    if (digits.length === 10) return `52${digits}`;
    if (digits.length === 12 && digits.startsWith("52")) return digits;
    return digits;
}

function money(value) {
    const n = Number(value || 0);
    if (!n) return "—";
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
}

function parseNumberInput(value) {
    const clean = String(value || "").replace(/[^\d]/g, "");
    return clean ? Number(clean) : "";
}

function safeArray(v) { return Array.isArray(v) ? v : []; }
function safeObject(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
function tryJsonParse(value, fallback) { try { return JSON.parse(value); } catch { return fallback; } }

const BACKEND_MEDIA_BASE = "https://crm.grupoautomotrizryr.com/media/";

function toMediaUrl(value) {
    const raw = String(value || "").trim();

    if (!raw) return "";

    if (raw.startsWith("http://") || raw.startsWith("https://")) {
        return raw.replaceAll(" ", "%20");
    }

    let clean = raw.replace(/^\/+/, "");

    if (clean.startsWith("media/")) {
        clean = clean.slice("media/".length);
    }

    return `${BACKEND_MEDIA_BASE}${clean}`.replaceAll(" ", "%20");
}

function splitLineasTexto(value) {
    return String(value || "")
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);
}

function timeToMin(t) {
    const [h, m] = (t || "00:00").split(":").map(Number);
    return h * 60 + m;
}
function minToTime(m) {
    const total = ((m % 1440) + 1440) % 1440;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
function franjaMins(inicio, fin) {
    let s = timeToMin(inicio), e = timeToMin(fin);
    if (e <= s) e += 1440;
    return Math.max(0, e - s);
}
function horasLabel(mins) {
    const h = Math.floor(mins / 60), m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
function pct(a, total) {
    return total === 0 ? 0 : Math.round((a / total) * 100);
}

// ─── Primitivos UI 
function Toggle({ value, onChange, disabled = false, size = "md" }) {
    const w = size === "sm" ? "w-9 h-5" : "w-12 h-6";
    const dot = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
    const tx = size === "sm" ? (value ? "translate-x-[18px]" : "translate-x-0.5") : (value ? "translate-x-6" : "translate-x-1");
    return (
        <button type="button" role="switch" aria-checked={value}
            onClick={() => !disabled && onChange(!value)} disabled={disabled}
            className={`relative inline-flex ${w} items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${value ? "bg-[#131E5C]" : "bg-gray-200"}`}>
            <span className={`inline-block ${dot} rounded-full bg-white shadow-sm transition-transform duration-200 ${tx}`} />
        </button>
    );
}

function Badge({ children, variant = "default", dot = false }) {
    const variants = {
        default: "bg-gray-100 text-gray-600",
        success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        danger: "bg-red-50 text-red-700 border border-red-200",
        warning: "bg-amber-50 text-amber-700 border border-amber-200",
        info: "bg-blue-50 text-blue-700 border border-blue-200",
        navy: "bg-[#131E5C]/10 text-[#131E5C]",
    };
    const dotColors = {
        default: "bg-gray-400", success: "bg-emerald-500", danger: "bg-red-500",
        warning: "bg-amber-500", info: "bg-blue-500", navy: "bg-[#131E5C]",
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${variants[variant]}`}>
            {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
            {children}
        </span>
    );
}

function Skeleton({ className = "" }) {
    return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

function Tooltip({ content, children }) {
    const [show, setShow] = useState(false);
    return (
        <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
            {children}
            {show && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 whitespace-nowrap rounded-lg bg-[#1A1F3C] px-2.5 py-1.5 text-xs font-medium text-white shadow-xl">
                    {content}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1A1F3C]" />
                </span>
            )}
        </span>
    );
}

// ─── Toast notification ───────────────────────────────────────────────────────
function Toast({ msg, type = "success", onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
    const cfg = {
        success: { bg: "bg-emerald-600", icon: <CheckCircle2 className="h-4 w-4" /> },
        error: { bg: "bg-red-600", icon: <AlertCircle className="h-4 w-4" /> },
        info: { bg: "bg-[#131E5C]", icon: <Info className="h-4 w-4" /> },
    }[type] || { bg: "bg-gray-800", icon: null };
    return (
        <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-2xl transition-all duration-300 ${cfg.bg}`}>
            {cfg.icon}
            <span>{msg}</span>
            <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
        </div>
    );
}

// ─── Modal enterprise ─────────────────────────────────────────────────────────
function Modal({ open, title, subtitle, onClose, children, footer, size = "xl" }) {
    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    if (!open) return null;
    const maxW = { lg: "max-w-2xl", xl: "max-w-4xl", "2xl": "max-w-6xl" }[size] || "max-w-4xl";

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
            <div className={`relative flex ${maxW} w-full max-h-[92vh] flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl`}
                style={{ boxShadow: "0 25px 60px rgba(19,30,92,0.18), 0 4px 16px rgba(0,0,0,0.12)" }}>
                <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-[#E4E7F0]">
                    <div>
                        <h2 className="text-base font-bold text-[#1A1F3C]">{title}</h2>
                        {subtitle && <p className="text-xs text-[#8891AD] mt-0.5">{subtitle}</p>}
                    </div>
                    <button onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4E7F0] text-[#8891AD] hover:bg-[#F7F8FC] hover:text-[#1A1F3C] transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
                {footer && (
                    <div className="flex flex-col-reverse gap-2 px-6 py-4 border-t border-[#E4E7F0] bg-[#F7F8FC] sm:flex-row sm:justify-end">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, variant = "default", loading = false, action, actionLabel }) {
    const variants = {
        default: { bg: "bg-white", accent: "bg-[#131E5C]/8", iconColor: "text-[#131E5C]" },
        success: { bg: "bg-white", accent: "bg-emerald-50", iconColor: "text-emerald-600" },
        danger: { bg: "bg-white", accent: "bg-red-50", iconColor: "text-red-600" },
        warning: { bg: "bg-white", accent: "bg-amber-50", iconColor: "text-amber-600" },
    };
    const v = variants[variant] || variants.default;
    return (
        <div className={`relative rounded-2xl border border-[#E4E7F0] ${v.bg} p-5 transition-shadow hover:shadow-md`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-[#8891AD]">{label}</p>
                    {loading ? (
                        <div className="mt-2 space-y-2">
                            <Skeleton className="h-7 w-24" />
                            <Skeleton className="h-3.5 w-36" />
                        </div>
                    ) : (
                        <>
                            <p className="mt-1.5 text-2xl font-bold text-[#1A1F3C] leading-none tracking-tight">{value}</p>
                            {sub && <p className="mt-1.5 text-xs text-[#8891AD] truncate">{sub}</p>}
                        </>
                    )}
                    {action && (
                        <button onClick={action}
                            className="mt-3 text-[11px] font-semibold text-[#131E5C] hover:underline inline-flex items-center gap-1">
                            {actionLabel} <ChevronRight className="h-3 w-3" />
                        </button>
                    )}
                </div>
                {Icon && (
                    <div className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl ${v.accent}`}>
                        <Icon className={`h-5 w-5 ${v.iconColor}`} />
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Campo de prompt ──────────────────────────────────────────────────────────
function PromptField({ seccion, value, onChange, onSave, saving }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const Icon = seccion.icon;
    const hasContent = Boolean(value?.trim());

    useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);

    function handleSave() {
        onChange(draft);
        setEditing(false);
        onSave?.(draft);
    }
    function handleCancel() { setDraft(value); setEditing(false); }

    return (
        <div className={`rounded-2xl border transition-all duration-200 ${editing ? "border-[#131E5C]/30 shadow-lg shadow-[#131E5C]/5" : "border-[#E4E7F0] hover:border-[#C8CEDF]"} bg-white overflow-hidden`}>
            <div className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#131E5C]/8">
                        <Icon className="h-4.5 w-4.5 text-[#131E5C]" style={{ width: 18, height: 18 }} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-[#1A1F3C]">{seccion.titulo}</p>
                        <p className="text-xs text-[#8891AD] truncate">{seccion.desc}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {!hasContent && !editing && <Badge variant="warning">Sin configurar</Badge>}
                    {hasContent && !editing && <Badge variant="success" dot>Configurado</Badge>}
                    {!editing ? (
                        <button onClick={() => setEditing(true)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E7F0] px-3 py-1.5 text-xs font-semibold text-[#515778] hover:bg-[#F7F8FC] hover:border-[#C8CEDF] transition-all">
                            <Edit3 className="h-3.5 w-3.5" />Editar
                        </button>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <button onClick={handleCancel}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E7F0] px-3 py-1.5 text-xs font-semibold text-[#515778] hover:bg-[#F7F8FC] transition-all">
                                Cancelar
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#131E5C] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0a1340] disabled:opacity-60 transition-all">
                                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                Aplicar
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className={`px-5 pb-5 transition-all duration-200 ${editing ? "" : "opacity-80"}`}>
                {!editing && !hasContent ? (
                    <div className="rounded-xl border-2 border-dashed border-[#E4E7F0] bg-[#F7F8FC] px-4 py-5 text-center">
                        <p className="text-xs text-[#8891AD]">{seccion.placeholder}</p>
                    </div>
                ) : (
                    <textarea
                        disabled={!editing}
                        value={editing ? draft : value}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder={seccion.placeholder}
                        rows={4}
                        className={`w-full resize-y rounded-xl text-sm text-[#1A1F3C] leading-relaxed outline-none transition-all duration-200 placeholder:text-[#C8CEDF] ${editing
                            ? "border border-[#131E5C]/20 bg-white px-4 py-3 focus:ring-2 focus:ring-[#131E5C]/10"
                            : "border-0 bg-transparent px-0 py-0 cursor-default"
                            }`}
                    />
                )}
            </div>
        </div>
    );
}

// ─── Selector de línea ────────────────────────────────────────────────────────
function LineaSelector({ lineasIA, value, onChange }) {
    const [open, setOpen] = useState(false);
    const selected = lineasIA.find((l) => l.numero === value);
    return (
        <div className="relative">
            <button onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#E4E7F0] bg-white px-4 py-3 text-left hover:border-[#C8CEDF] transition-colors focus:outline-none focus:ring-2 focus:ring-[#131E5C]/20">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#131E5C]/8">
                        <Bot className="h-4 w-4 text-[#131E5C]" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-[#1A1F3C] truncate">{selected?.label || selected?.asesor_digital || "Seleccionar línea"}</p>
                        <p className="text-[11px] text-[#8891AD] font-mono">{value || "—"}</p>
                    </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-[#8891AD] flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute top-full left-0 right-0 z-20 mt-1.5 overflow-hidden rounded-xl border border-[#E4E7F0] bg-white shadow-2xl">
                        {lineasIA.map((linea) => (
                            <button key={linea.numero} onClick={() => { onChange(linea.numero); setOpen(false); }}
                                className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#F7F8FC] transition-colors ${linea.numero === value ? "bg-[#131E5C]/5" : ""}`}>
                                <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${linea.numero === value ? "bg-[#131E5C]" : "bg-[#131E5C]/8"}`}>
                                    <Bot className={`h-3.5 w-3.5 ${linea.numero === value ? "text-white" : "text-[#131E5C]"}`} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-[#1A1F3C] truncate">{linea.label || linea.asesor_digital}</p>
                                    <p className="text-[11px] text-[#8891AD] font-mono">{linea.numero}</p>
                                </div>
                                {linea.numero === value && <CheckCircle2 className="h-4 w-4 text-[#131E5C] ml-auto flex-shrink-0" />}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── PRESETS ──────────────────────────────────────────────────────────────────
const PRESETS = [
    { id: "noches", label: "Solo noches", sub: "18:00 – 23:59", icon: Clock, apply: () => ({ inicio: "18:00", fin: "23:59" }) },
    { id: "fullday", label: "24 horas", sub: "Todo el día", icon: Zap, apply: () => ({ inicio: "00:00", fin: "23:59" }) },
    { id: "complementar", label: "Complementar asesores", sub: "Antes y después del horario humano", icon: RefreshCw, apply: (h) => ({ inicio: h?.fin || "18:00", fin: h?.inicio || "09:00" }) },
    { id: "finde", label: "Fines de semana", sub: "Sáb y Dom completos", icon: Calendar, apply: () => ({ inicio: "00:00", fin: "23:59" }), dias: ["sab", "dom"] },
];

// ─── TimeScrollPicker ─────────────────────────────────────────────────────────
function TimeScrollPicker({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const parsed = (value || "00:00").split(":").map(Number);
    const h24 = parsed[0] || 0;
    const m = parsed[1] || 0;
    const isPM = h24 >= 12;
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;

    function emit(newH12, newM, newIsPM) {
        const out24 = newH12 % 12 + (newIsPM ? 12 : 0);
        onChange(`${String(out24).padStart(2, "0")}:${String(newM).padStart(2, "0")}`);
    }

    const label = `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${isPM ? "p.m." : "a.m."}`;

    return (
        <div className="relative flex-1 min-w-0">
            <button type="button" onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-1 rounded-lg border border-[#E4E7F0] bg-white px-2 py-2 text-[11px] font-mono font-bold text-[#1A1F3C] hover:border-[#131E5C]/40 focus:outline-none focus:ring-2 focus:ring-[#131E5C]/10 transition-all">
                <span className="truncate">{label}</span>
                <Clock className="h-3 w-3 text-[#8891AD] flex-shrink-0" />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
                    <div className="absolute top-full left-0 z-[70] mt-1.5 overflow-hidden rounded-xl border border-[#E4E7F0] bg-white shadow-2xl" style={{ width: 172 }}>
                        <div className="bg-[#131E5C] px-3 py-2 text-center">
                            <p className="text-sm font-bold text-white font-mono tracking-wide">{label}</p>
                        </div>
                        <div className="flex" style={{ height: 152 }}>
                            {/* Horas */}
                            <div className="flex-1 overflow-y-auto border-r border-[#E4E7F0]" style={{ scrollbarWidth: "none" }}>
                                {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hv) => (
                                    <button key={hv} type="button" onClick={() => emit(hv, m, isPM)}
                                        className={`w-full py-1.5 text-center text-sm font-mono leading-none transition-colors ${hv === h12 ? "bg-[#131E5C] text-white font-bold" : "text-[#1A1F3C] hover:bg-[#F7F8FC]"}`}>
                                        {String(hv).padStart(2, "0")}
                                    </button>
                                ))}
                            </div>
                            {/* Minutos */}
                            <div className="flex-1 overflow-y-auto border-r border-[#E4E7F0]" style={{ scrollbarWidth: "none" }}>
                                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((mv) => (
                                    <button key={mv} type="button" onClick={() => emit(h12, mv, isPM)}
                                        className={`w-full py-1.5 text-center text-sm font-mono leading-none transition-colors ${mv === m ? "bg-[#131E5C] text-white font-bold" : "text-[#1A1F3C] hover:bg-[#F7F8FC]"}`}>
                                        {String(mv).padStart(2, "0")}
                                    </button>
                                ))}
                            </div>
                            {/* AM/PM */}
                            <div className="flex flex-col w-12">
                                {[false, true].map((pm) => (
                                    <button key={String(pm)} type="button" onClick={() => emit(h12, m, pm)}
                                        className={`flex-1 text-xs font-bold transition-colors ${isPM === pm ? "bg-[#131E5C] text-white" : "text-[#8891AD] hover:bg-[#F7F8FC]"}`}>
                                        {pm ? "PM" : "AM"}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="border-t border-[#E4E7F0] px-3 py-2 flex justify-end">
                            <button type="button" onClick={() => setOpen(false)} className="text-[11px] font-bold text-[#131E5C] hover:underline">
                                Listo ✓
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// ─── ClockDial ────────────────────────────────────────────────────────────────
function ClockDial({ franjas, onUpdate, totalIAMins }) {
    const svgRef = useRef(null);
    const dragging = useRef(null);

    const SIZE = 240;
    const CX = 120;
    const CY = 120;
    const R_OUT = 100;
    const R_IN = 66;
    const STROKE = R_OUT - R_IN;
    const R_MID = (R_OUT + R_IN) / 2;

    const COLORS = ["#131E5C", "#2d41a8", "#5a6fd6"];

    function minsFromTime(t) {
        const [hh, mm] = (t || "00:00").split(":").map(Number);
        return hh * 60 + mm;
    }
    function minsToAngle(mins) { return (mins / 1440) * 360 - 90; }
    function angleToMins(angleDeg) {
        const a = ((angleDeg + 90) % 360 + 360) % 360;
        return Math.round((a / 360) * 1440 / 5) * 5 % 1440;
    }
    function minsToTimeStr(mins) {
        const safe = ((mins % 1440) + 1440) % 1440;
        return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
    }
    function polar(angleDeg, r) {
        const rad = (angleDeg * Math.PI) / 180;
        return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
    }
    function arcPath(startMins, endMins, r) {
        let span = endMins - startMins;
        if (span <= 0) span += 1440;
        if (span >= 1440) {
            const p1 = polar(minsToAngle(startMins), r);
            const p2 = polar(minsToAngle(startMins + 720), r);
            return `M ${p1.x} ${p1.y} A ${r} ${r} 0 1 1 ${p2.x} ${p2.y} A ${r} ${r} 0 1 1 ${p1.x} ${p1.y} Z`;
        }
        const startDeg = minsToAngle(startMins);
        const realEnd = startDeg + (span / 1440) * 360;
        const large = span > 720 ? 1 : 0;
        const p1 = polar(startDeg, r);
        const p2 = polar(realEnd, r);
        return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y}`;
    }
    function getSVGAngle(e) {
        const svg = svgRef.current;
        if (!svg) return 0;
        const rect = svg.getBoundingClientRect();
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        const x = ((cx - rect.left) / rect.width) * SIZE - CX;
        const y = ((cy - rect.top) / rect.height) * SIZE - CY;
        return Math.atan2(y, x) * (180 / Math.PI);
    }
    function onPointerDown(e, fi, handle) { e.preventDefault(); dragging.current = { fi, handle }; }
    function onPointerMove(e) {
        if (!dragging.current) return;
        const { fi, handle } = dragging.current;
        onUpdate(fi, handle, minsToTimeStr(angleToMins(getSVGAngle(e))));
    }
    function onPointerUp() { dragging.current = null; }

    const LABELS = [
        { h: 0, label: "00:00" }, { h: 6, label: "06:00" },
        { h: 12, label: "12:00" }, { h: 18, label: "18:00" },
    ];
    const f0 = franjas[0] || { inicio: "00:00", fin: "00:00" };

    return (
        <div className="flex flex-col items-center select-none">
            <svg ref={svgRef} viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE}
                onMouseMove={onPointerMove} onMouseUp={onPointerUp} onMouseLeave={onPointerUp}
                onTouchMove={onPointerMove} onTouchEnd={onPointerUp}
                className="touch-none overflow-visible">

                {/* Anillo base gris */}
                <circle cx={CX} cy={CY} r={R_MID} fill="none" stroke="#E8ECFF" strokeWidth={STROKE} />

                {/* Ticks horarios */}
                {Array.from({ length: 24 }, (_, i) => {
                    const ang = (i / 24) * 360 - 90;
                    const big = i % 6 === 0;
                    const p1 = polar(ang, R_OUT + 1);
                    const p2 = polar(ang, R_OUT + (big ? 7 : 4));
                    return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                        stroke={big ? "#8891AD" : "#C8CEDF"} strokeWidth={big ? 1.5 : 0.8} />;
                })}

                {/* Etiquetas 00, 06, 12, 18 */}
                {LABELS.map(({ h, label }) => {
                    const pt = polar((h / 24) * 360 - 90, R_OUT + 16);
                    return (
                        <text key={h} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="middle"
                            fontSize="8.5" fontWeight="600" fill="#8891AD" fontFamily="'Courier New', monospace">
                            {label}
                        </text>
                    );
                })}

                {/* Arcos IA */}
                {franjas.map((franja, idx) => (
                    <path key={idx}
                        d={arcPath(minsFromTime(franja.inicio), minsFromTime(franja.fin), R_MID)}
                        fill="none" stroke={COLORS[idx % COLORS.length]} strokeWidth={STROKE} strokeLinecap="round" />
                ))}

                {/* Handles de arrastre */}
                {franjas.map((franja, idx) => {
                    const color = COLORS[idx % COLORS.length];
                    return (["inicio", "fin"]).map((handle) => {
                        const pt = polar(minsToAngle(minsFromTime(franja[handle])), R_MID);
                        return (
                            <g key={`${idx}-${handle}`}
                                onMouseDown={(e) => onPointerDown(e, idx, handle)}
                                onTouchStart={(e) => { e.preventDefault(); onPointerDown(e, idx, handle); }}
                                style={{ cursor: "grab" }}>
                                <circle cx={pt.x} cy={pt.y} r={11} fill="rgba(0,0,0,0.08)" />
                                <circle cx={pt.x} cy={pt.y} r={10} fill="white" stroke={color} strokeWidth={2.5} />
                                <circle cx={pt.x} cy={pt.y} r={4} fill={color} />
                            </g>
                        );
                    });
                })}

                {/* Centro */}
                <circle cx={CX} cy={CY} r={R_IN - 3} fill="white" />

                {/* Icono robot SVG */}
                <g transform={`translate(${CX - 9}, ${CY - 38})`}>
                    <rect x="2" y="4" width="14" height="12" rx="3" fill="#131E5C" />
                    <rect x="5" y="7" width="3" height="2" rx="1" fill="white" />
                    <rect x="10" y="7" width="3" height="2" rx="1" fill="white" />
                    <rect x="6" y="11" width="6" height="1.5" rx="0.75" fill="white" />
                    <rect x="7" y="1" width="4" height="3" rx="1" fill="#131E5C" />
                    <rect x="0" y="8" width="2" height="5" rx="1" fill="#131E5C" />
                    <rect x="16" y="8" width="2" height="5" rx="1" fill="#131E5C" />
                </g>

                <text x={CX} y={CY - 16} textAnchor="middle" dominantBaseline="middle"
                    fontSize="9" fontWeight="800" fill="#131E5C" letterSpacing="0.08em">
                    IA ACTIVA
                </text>
                <text x={CX} y={CY + 2} textAnchor="middle" dominantBaseline="middle"
                    fontSize="11.5" fontWeight="700" fill="#1A1F3C" fontFamily="'Courier New', monospace">
                    {f0.inicio} – {f0.fin}
                </text>
                <text x={CX} y={CY + 18} textAnchor="middle" dominantBaseline="middle"
                    fontSize="7.5" fill="#8891AD">
                    Fuera del horario de asesores
                </text>
                <rect x={CX - 30} y={CY + 28} width={60} height={17} rx={8} fill="#dcfce7" />
                <text x={CX} y={CY + 37} textAnchor="middle" dominantBaseline="middle"
                    fontSize="8.5" fontWeight="700" fill="#16a34a">
                    {horasLabel(totalIAMins)} activas
                </text>
            </svg>

            <p className="text-[10px] text-[#8891AD] mt-1 flex items-center justify-center gap-1">
                <span>⇔</span> Arrastra los controles para ajustar el horario
            </p>
        </div>
    );
}

// ─── HorariosBlock ────────────────────────────────────────────────────────────
function HorariosBlock({ horarios, onChange, lineasIA = [], onSave, saving }) {
    const [expanded, setExpanded] = useState(false);
    const [diaActivo, setDiaActivo] = useState("lun");

    function getFranjas(diaId) {
        const h = horarios?.[diaId] || {};
        if (Array.isArray(h.franjas) && h.franjas.length > 0) return h.franjas;
        if (h.inicio && h.fin) return [{ inicio: h.inicio, fin: h.fin }];
        return [{ inicio: "09:00", fin: "18:00" }];
    }

    function setFranjas(diaId, franjas) {
        onChange((prev) => ({
            ...prev,
            [diaId]: { ...(prev[diaId] || {}), franjas, inicio: franjas[0]?.inicio, fin: franjas[0]?.fin },
        }));
    }

    function toggleDia(diaId) {
        onChange((prev) => ({
            ...prev,
            [diaId]: { ...(prev[diaId] || {}), activo: !prev[diaId]?.activo },
        }));
    }

    function agregarFranja(diaId) {
        const franjas = getFranjas(diaId);
        const ultima = franjas[franjas.length - 1];
        const [hh, mm] = (ultima?.fin || "18:00").split(":").map(Number);
        const finMins = (hh * 60 + mm + 120) % 1440;
        setFranjas(diaId, [...franjas, { inicio: ultima?.fin || "18:00", fin: minToTime(finMins) }]);
    }

    function eliminarFranja(diaId, idx) {
        const franjas = getFranjas(diaId);
        if (franjas.length <= 1) return;
        setFranjas(diaId, franjas.filter((_, i) => i !== idx));
    }

    function updateFranja(diaId, idx, campo, valor) {
        setFranjas(diaId, getFranjas(diaId).map((f, i) => i === idx ? { ...f, [campo]: valor } : f));
    }

    function aplicarPreset(preset) {
        const franjas = getFranjas(diaActivo);
        if (preset.dias) {
            const updates = {};
            preset.dias.forEach((d) => {
                const ap = preset.apply(horarios[d] || {});
                updates[d] = { ...(horarios[d] || {}), activo: true, franjas: [ap], inicio: ap.inicio, fin: ap.fin };
            });
            onChange((prev) => ({ ...prev, ...updates }));
        } else {
            const ap = preset.apply({ inicio: franjas[0]?.inicio, fin: franjas[0]?.fin });
            setFranjas(diaActivo, [ap, ...franjas.slice(1)]);
        }
    }

    function calcHorasIA(diaId) {
        if (!horarios[diaId]?.activo) return 0;
        return getFranjas(diaId).reduce((acc, f) => acc + franjaMins(f.inicio, f.fin), 0);
    }

    const diaData = horarios[diaActivo] || {};
    const franjasDia = getFranjas(diaActivo);
    const totalIADia = calcHorasIA(diaActivo);
    const totalAsesor = Math.max(0, 1440 - totalIADia);
    const diasActivos = DIAS.filter((d) => horarios?.[d.id]?.activo);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const totalesSemana = useMemo(() => DIAS.reduce((acc, d) => {
        const ia = calcHorasIA(d.id);
        return { ia: acc.ia + ia, asesor: acc.asesor + Math.max(0, 1440 - ia) };
    }, { ia: 0, asesor: 0 }), [horarios]);

    return (
        <div className="rounded-2xl border border-[#E4E7F0] bg-white overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#131E5C]/8">
                        <Clock className="h-[18px] w-[18px] text-[#131E5C]" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-[#1A1F3C]">Ventana de atención</p>
                        <p className="text-xs text-[#8891AD]">
                            {diasActivos.length > 0
                                ? `${diasActivos.length} días activos · ${diasActivos.map((d) => d.short).join(" ")}`
                                : "Sin días configurados"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {expanded && onSave && (
                        <button onClick={onSave} disabled={saving}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#131E5C] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0a1340] disabled:opacity-60 transition-all">
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            Guardar
                        </button>
                    )}
                    <button onClick={() => setExpanded((v) => !v)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E7F0] px-3 py-1.5 text-xs font-semibold text-[#515778] hover:bg-[#F7F8FC] transition-all">
                        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        {expanded ? "Cerrar" : "Configurar"}
                    </button>
                </div>
            </div>

            {/* Pills preview */}
            {!expanded && (
                <div className="flex flex-wrap gap-1.5 px-5 pb-4">
                    {DIAS.map((dia) => {
                        const h = horarios?.[dia.id] || {};
                        const franjas = getFranjas(dia.id);
                        return (
                            <div key={dia.id}
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-colors ${h.activo ? "bg-[#131E5C] text-white border-[#131E5C]" : "bg-[#F7F8FC] text-[#C8CEDF] border-[#E4E7F0]"
                                    }`}>
                                {dia.short}
                                {h.activo && franjas[0] && (
                                    <span className="ml-1 opacity-70 font-normal">{franjas[0].inicio}–{franjas[0].fin}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Panel expandido */}
            {expanded && (
                <div className="border-t border-[#E4E7F0]">

                    {/* Selector días */}
                    <div className="px-4 pt-4 pb-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8891AD] mb-2.5">
                            Selecciona el día a configurar
                        </p>
                        <div className="flex gap-1.5 flex-wrap">
                            {DIAS.map((dia) => {
                                const h = horarios?.[dia.id] || {};
                                return (
                                    <button key={dia.id} onClick={() => setDiaActivo(dia.id)}
                                        className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all border ${diaActivo === dia.id
                                            ? "bg-[#131E5C] text-white border-[#131E5C]"
                                            : h.activo
                                                ? "bg-white text-[#1A1F3C] border-[#C8CEDF] hover:border-[#131E5C]"
                                                : "bg-[#F7F8FC] text-[#C8CEDF] border-[#E4E7F0]"
                                            }`}>
                                        {dia.label.slice(0, 3)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Toggle día activo */}
                    <div className="flex items-center justify-between px-5 py-2">
                        <p className="text-sm font-bold text-[#1A1F3C]">{DIAS.find((d) => d.id === diaActivo)?.label}</p>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-[#8891AD]">{diaData.activo ? "Activo" : "Inactivo"}</span>
                            <Toggle value={Boolean(diaData.activo)} onChange={() => toggleDia(diaActivo)} />
                        </div>
                    </div>

                    {diaData.activo && (
                        <>
                            {/* Presets */}
                            <div className="px-5 pb-3">
                                <div className="grid grid-cols-2 gap-2">
                                    {PRESETS.map((preset) => {
                                        const Icon = preset.icon;
                                        return (
                                            <button key={preset.id} onClick={() => aplicarPreset(preset)}
                                                className="flex items-start gap-2 rounded-xl border border-[#E4E7F0] bg-[#F7F8FC] px-3 py-2.5 text-left hover:border-[#C8CEDF] hover:bg-white transition-all">
                                                <Icon className="h-3.5 w-3.5 text-[#131E5C] mt-0.5 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-bold text-[#1A1F3C] leading-tight">{preset.label}</p>
                                                    <p className="text-[10px] text-[#8891AD] leading-tight mt-0.5">{preset.sub}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Reloj circular */}
                            <div className="flex justify-center px-4 pb-3">
                                <ClockDial
                                    franjas={franjasDia}
                                    onUpdate={(idx, campo, valor) => updateFranja(diaActivo, idx, campo, valor)}
                                    totalIAMins={totalIADia}
                                />
                            </div>

                            {/* Franjas editables */}
                            <div className="px-5 pb-4 space-y-2">
                                {franjasDia.map((franja, idx) => (
                                    <div key={idx} className="rounded-xl border border-[#131E5C]/20 bg-[#131E5C]/[0.04] px-4 py-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-[#131E5C]" />
                                                <p className="text-[11px] font-bold text-[#131E5C]">
                                                    {franjasDia.length > 1 ? `Franja IA #${idx + 1}` : "Franja IA WhatsApp"}
                                                </p>
                                            </div>
                                            {franjasDia.length > 1 && (
                                                <button onClick={() => eliminarFranja(diaActivo, idx)}
                                                    className="flex h-5 w-5 items-center justify-center rounded text-red-400 hover:bg-red-50 hover:text-red-600 transition-all">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <TimeScrollPicker value={franja.inicio} onChange={(v) => updateFranja(diaActivo, idx, "inicio", v)} />
                                            <span className="text-[#C8CEDF] text-xs flex-shrink-0">→</span>
                                            <TimeScrollPicker value={franja.fin} onChange={(v) => updateFranja(diaActivo, idx, "fin", v)} />
                                            <span className="text-[10px] text-[#8891AD] flex-shrink-0 ml-1 whitespace-nowrap">
                                                {horasLabel(franjaMins(franja.inicio, franja.fin))}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {/* Agregar franja */}
                                <button onClick={() => agregarFranja(diaActivo)}
                                    className="w-full rounded-xl border-2 border-dashed border-[#E4E7F0] py-2.5 text-xs font-semibold text-[#8891AD] hover:border-[#131E5C]/30 hover:text-[#131E5C] hover:bg-[#131E5C]/[0.03] transition-all flex items-center justify-center gap-1.5">
                                    <Plus className="h-3.5 w-3.5" />
                                    Agregar otra franja horaria
                                </button>

                                {/* Stats del día */}
                                <div className="grid grid-cols-3 gap-2 pt-1">
                                    {[
                                        { label: "Cobertura IA", val: horasLabel(totalIADia), color: "text-[#131E5C]" },
                                        { label: "Asesor humano", val: horasLabel(totalAsesor), color: "text-emerald-600" },
                                        { label: "% con IA", val: `${pct(totalIADia, 1440)}%`, color: "text-[#1A1F3C]" },
                                    ].map((s) => (
                                        <div key={s.label} className="rounded-xl border border-[#E4E7F0] bg-[#F7F8FC] px-2 py-2.5 text-center">
                                            <p className={`text-sm font-bold ${s.color}`}>{s.val}</p>
                                            <p className="text-[10px] text-[#8891AD] mt-0.5 leading-tight">{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Barras por día */}
                    <div className="border-t border-[#E4E7F0] px-5 py-4 space-y-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#8891AD]">Horas por día</p>
                        {DIAS.map((dia) => {
                            const ia = calcHorasIA(dia.id);
                            const asesor = Math.max(0, 1440 - ia);
                            const h = horarios[dia.id] || {};
                            return (
                                <div key={dia.id} className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-[#8891AD] w-5 flex-shrink-0">{dia.short}</span>
                                    <div className="flex-1 flex flex-col gap-0.5">
                                        <div className="h-1.5 w-full rounded-full bg-[#F0F0F0] overflow-hidden">
                                            <div className="h-full rounded-full bg-[#131E5C] transition-all duration-300" style={{ width: `${pct(ia, 1440)}%` }} />
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-[#F0F0F0] overflow-hidden">
                                            <div className="h-full rounded-full bg-emerald-400 transition-all duration-300" style={{ width: `${pct(asesor, 1440)}%` }} />
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-[#8891AD] w-24 text-right flex-shrink-0">
                                        {h.activo ? `${horasLabel(ia)} / ${horasLabel(asesor)}` : "Inactivo"}
                                    </span>
                                </div>
                            );
                        })}
                        <div className="flex items-center gap-4 pt-1">
                            <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-sm bg-[#131E5C]" />
                                <span className="text-[10px] text-[#8891AD]">IA WhatsApp</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-sm bg-emerald-400" />
                                <span className="text-[10px] text-[#8891AD]">Asesor humano</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Form field ───────────────────────────────────────────────────────────────
function Field({ label, children, col, required }) {
    return (
        <div className={col === 2 ? "md:col-span-2" : ""}>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-[#8891AD]">
                {label}{required && <span className="ml-0.5 text-red-500">*</span>}
            </label>
            {children}
        </div>
    );
}

const inputCls = "w-full rounded-xl border border-[#E4E7F0] bg-white px-3.5 py-2.5 text-sm text-[#1A1F3C] placeholder:text-[#C8CEDF] outline-none transition focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10";
const textareaCls = `${inputCls} resize-y`;

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ConfigIA() {
    const [tab, setTab] = useState("config");

    const [lineasIA, setLineasIA] = useState([]);
    const [numeroSeleccionado, setNumero] = useState("");
    const [swiftActivo, setSwiftActivo] = useState(false);
    const [horarios, setHorarios] = useState(horarioInicial());
    const [campos, setCampos] = useState(Object.fromEntries(secciones.map((s) => [s.id, ""])));
    const [condicionesFijas, setCondFijas] = useState(CONDICIONES_FIJAS);

    const [guardandoConfig, setGuardandoConfig] = useState(false);
    const [cargandoConfig, setCargandoConfig] = useState(false);

    const [toast, setToast] = useState(null);
    const showToast = (msg, type = "success") => setToast({ msg, type, key: Date.now() });

    const [vehiculos, setVehiculos] = useState([]);
    const [cargandoCatalogo, setCargCat] = useState(false);
    const [qCatalogo, setQCatalogo] = useState("");
    const [soloActivos, setSoloActivos] = useState(true);

    const [modalVehiculo, setModalVehiculo] = useState(false);
    const [vehiculoDraft, setVehiculoDraft] = useState(emptyVehiculo);
    const [fichaTexto, setFichaTexto] = useState("{}");
    const [imagenesTexto, setImagenesTexto] = useState("");
    const [videosTexto, setVideosTexto] = useState("");
    const [guardandoVehiculo, setGuardVeh] = useState(false);
    const [errorVehiculo, setErrorVehiculo] = useState("");
    const [activeModalTab, setActiveModalTab] = useState("info");

    const lineaActual = useMemo(() => lineasIA.find((i) => i.numero === numeroSeleccionado) || null, [lineasIA, numeroSeleccionado]);
    const bloqueosLinea = useMemo(() => Array.isArray(lineaActual?.bloqueos_linea) ? lineaActual.bloqueos_linea : [], [lineaActual]);
    const lineaPuedeResponder = Boolean(lineaActual?.puede_responder_linea);
    const totalDiasActivos = useMemo(() => DIAS.filter((d) => horarios?.[d.id]?.activo).length, [horarios]);
    const totalVehiculosActivos = useMemo(() => vehiculos.filter((i) => i.activo).length, [vehiculos]);

    const vehiculosFiltrados = useMemo(() => {
        const q = qCatalogo.trim().toLowerCase();
        return vehiculos.filter((v) => {
            if (soloActivos && !v.activo) return false;
            if (!q) return true;
            return [v.marca, v.modelo, v.ano, v.version, v.resumen].join(" ").toLowerCase().includes(q);
        });
    }, [vehiculos, qCatalogo, soloActivos]);

    async function cargarLineasIA() {
        try {
            const res = await api.iaLineas();
            const items = Array.isArray(res?.items) ? res.items : [];

            // Solo líneas reales. Nada de GLOBAL.
            const finalItems = items
                .map((item) => {
                    const numero = normalizaNumeroConfigIA(item.numero);

                    return {
                        ...item,
                        numero,
                    };
                })
                .filter((item) => item.numero);

            setLineasIA(finalItems);

            setNumero((numeroActual) => {
                const numeroNormalizado = normalizaNumeroConfigIA(numeroActual);

                const existeActual = finalItems.some(
                    (item) => item.numero === numeroNormalizado
                );

                if (numeroNormalizado && existeActual) {
                    return numeroNormalizado;
                }

                return finalItems[0]?.numero || "";
            });
        } catch (e) {
            setLineasIA([]);
            setNumero("");
            showToast(
                e?.message || "No se pudieron cargar las líneas de WhatsApp.",
                "error"
            );
        }
    }

    async function cargarConfig(numero = numeroSeleccionado) {
        const num = normalizaNumeroConfigIA(numero);

        if (!num) {
            resetConfigIAFormulario({
                setSwiftActivo,
                setHorarios,
                setCampos,
                setCondFijas,
            });
            return;
        }

        setCargandoConfig(true);

        try {
            const res = await api.iaConfigGet(num);
            const item = res?.item || res || {};

            setSwiftActivo(Boolean(item.activo));

            setHorarios(
                item.horarios && typeof item.horarios === "object"
                    ? item.horarios
                    : horarioInicial()
            );

            setCampos({
                identidad: item.identidad || "",
                precios: item.precios || "",
                perfilamiento: item.perfilamiento || "",
                limites: item.limites || "",
                promociones_eventos: item.promociones_eventos || "",
                personalidad: item.personalidad || "",
            });

            setCondFijas(item.condiciones_fijas || CONDICIONES_FIJAS);
        } catch (e) {
            resetConfigIAFormulario({
                setSwiftActivo,
                setHorarios,
                setCampos,
                setCondFijas,
            });

            showToast(
                e?.message || "No se pudo cargar la configuración de este número.",
                "error"
            );
        } finally {
            setCargandoConfig(false);
        }
    }

    async function guardarConfig(extra = {}, opciones = {}) {
        const { mostrarToast = true, mantenerLoader = false } = opciones;

        const num = normalizaNumeroConfigIA(numeroSeleccionado);

        if (!num) {
            showToast("Selecciona una línea de WhatsApp válida.", "error");
            return false;
        }

        setGuardandoConfig(true);

        try {
            const payloadSecciones = Object.fromEntries(
                secciones.map((s) => [s.id, campos[s.id] || ""])
            );

            await api.iaConfigPatch(num, {
                activo: swiftActivo,
                horarios,
                ...payloadSecciones,
                condiciones_fijas: condicionesFijas || "",
                ...extra,
            });

            if (mostrarToast) {
                showToast("Configuración guardada correctamente.");
            }

            await cargarLineasIA();

            return true;
        } catch (e) {
            showToast(e?.message || "No se pudo guardar la configuración.", "error");
            return false;
        } finally {
            if (!mantenerLoader) {
                setGuardandoConfig(false);
            }
        }
    }
    async function publicarConfig() {
        const num = normalizaNumeroConfigIA(numeroSeleccionado);

        if (!num) {
            showToast("Selecciona una línea de WhatsApp válida.", "error");
            return;
        }

        setGuardandoConfig(true);

        try {
            const guardado = await guardarConfig(
                {},
                {
                    mostrarToast: false,
                    mantenerLoader: true,
                }
            );

            if (!guardado) {
                return;
            }

            await api.iaConfigPublicar(num);

            setSwiftActivo(true);

            await cargarLineasIA();

            showToast("IA publicada y encendida para este número.", "success");
        } catch (e) {
            showToast(e?.message || "No se pudo publicar la IA.", "error");
        } finally {
            setGuardandoConfig(false);
        }
    }
    async function cargarCatalogo() {
        setCargCat(true);
        try {
            const res = await api.get(`/digitales/catalogo/vehiculos/?activo=${soloActivos ? "true" : "todos"}&limit=1000`);
            setVehiculos(Array.isArray(res?.items) ? res.items : []);
        } catch { setVehiculos([]); }
        finally { setCargCat(false); }
    }

    function abrirNuevoVehiculo() {
        setVehiculoDraft({ ...emptyVehiculo, ano: new Date().getFullYear() });
        setFichaTexto("{}");
        setImagenesTexto("");
        setVideosTexto("");
        setErrorVehiculo("");
        setActiveModalTab("info");
        setModalVehiculo(true);
    }

    function abrirEditarVehiculo(item) {
        const draft = {
            ...emptyVehiculo,
            ...item,
            ficha_tecnica: safeObject(item.ficha_tecnica),
            imagenes: safeArray(item.imagenes),
            videos: safeArray(item.videos),
        };

        setVehiculoDraft(draft);
        setFichaTexto(JSON.stringify(draft.ficha_tecnica || {}, null, 2));
        setImagenesTexto((draft.imagenes || []).join("\n"));
        setVideosTexto((draft.videos || []).join("\n"));
        setErrorVehiculo("");
        setActiveModalTab("info");
        setModalVehiculo(true);
    }

    function cerrarModalVehiculo() {
        if (guardandoVehiculo) return;

        setModalVehiculo(false);
        setVehiculoDraft(emptyVehiculo);
        setFichaTexto("{}");
        setImagenesTexto("");
        setVideosTexto("");
        setErrorVehiculo("");
    }

    function patchDraft(campo, valor) { setVehiculoDraft((p) => ({ ...p, [campo]: valor })); }

    async function guardarVehiculo() {
        setErrorVehiculo("");

        const modelo = String(vehiculoDraft.modelo || "").trim();
        const ano = Number(vehiculoDraft.ano || 0);

        if (!modelo) {
            setErrorVehiculo("El modelo es obligatorio.");
            return;
        }

        if (!ano) {
            setErrorVehiculo("El año es obligatorio.");
            return;
        }

        const ficha = tryJsonParse(fichaTexto, null);

        if (!ficha || typeof ficha !== "object" || Array.isArray(ficha)) {
            setErrorVehiculo('La ficha técnica debe ser un JSON válido. Ej: {"Motor":"1.4L TSI"}');
            return;
        }

        const imagenes = splitLineasTexto(imagenesTexto);
        const videos = splitLineasTexto(videosTexto);

        const payload = {
            marca: String(vehiculoDraft.marca || "Volvo").trim(),
            modelo,
            ano,
            version: String(vehiculoDraft.version || "").trim(),
            precio_lista: vehiculoDraft.precio_lista || null,
            precio_contado: vehiculoDraft.precio_contado || null,
            precio_financiado: vehiculoDraft.precio_financiado || null,
            resumen: String(vehiculoDraft.resumen || "").trim(),
            ficha_tecnica: ficha,
            url_ficha_tecnica: String(vehiculoDraft.url_ficha_tecnica || "").trim(),
            imagenes,
            videos,
            ultima_actualizacion: vehiculoDraft.ultima_actualizacion || null,
            activo: Boolean(vehiculoDraft.activo),
        };

        setGuardVeh(true);

        try {
            if (vehiculoDraft.id) {
                await api.patch(`/digitales/catalogo/vehiculos/${vehiculoDraft.id}/`, payload);
            } else {
                await api.post("/digitales/catalogo/vehiculos/", payload);
            }

            cerrarModalVehiculo();
            await cargarCatalogo();

            showToast(
                vehiculoDraft.id
                    ? "Vehículo actualizado."
                    : "Vehículo agregado al catálogo."
            );
        } catch (e) {
            setErrorVehiculo(e?.message || "No se pudo guardar el vehículo.");
        } finally {
            setGuardVeh(false);
        }
    }

    async function desactivarVehiculo(item) {
        if (!confirm(`¿Desactivar ${item.modelo} ${item.ano}?`)) return;
        try {
            await api.delete(`/digitales/catalogo/vehiculos/${item.id}/`);
            await cargarCatalogo(); showToast("Vehículo desactivado.");
        } catch (e) { showToast(e?.message || "No se pudo desactivar.", "error"); }
    }

    async function reactivarVehiculo(item) {
        try {
            await api.patch(`/digitales/catalogo/vehiculos/${item.id}/`, { activo: true });
            await cargarCatalogo(); showToast("Vehículo reactivado.");
        } catch (e) { showToast(e?.message || "No se pudo reactivar.", "error"); }
    }

    useEffect(() => { cargarConfig(numeroSeleccionado); }, [numeroSeleccionado]);
    useEffect(() => { cargarCatalogo(); }, [soloActivos]);
    useEffect(() => { cargarLineasIA(); }, []);

    return (
        <div className="min-h-screen" style={{ backgroundColor: C.surface }}>

            {toast && <Toast key={toast.key} msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* Top bar */}
            {/* Top bar */}
            <header
                className="sticky top-0 z-40 w-full border-b bg-white"
                style={{ borderColor: "#131E5C22" }}
            >
                <div className="flex min-h-[76px] items-center gap-4 px-4 md:px-6 lg:px-8">
                    <div className="flex shrink-0 items-center gap-3 md:gap-4">
                        <img
                            src={volvoLogo}
                            alt="Volvo"
                            className="h-16 w-16 object-contain md:h-20 md:w-20"
                            loading="lazy"
                        />
                        <div
                            className="text-[24px] font-extrabold tracking-[-0.04em] md:text-[30px]"
                            style={{ color: "#131E5C" }}
                        >
                            Panel de Inteligencias Artificiales
                        </div>
                    </div>

                    <div
                        className="hidden h-[2px] min-w-[60px] flex-1 rounded-full lg:block"
                        style={{ background: "#131E5C" }}
                    />

                    <nav className="ml-auto flex max-w-full items-center gap-2 overflow-x-auto py-2">
                        {[
                            { id: "config", label: "Configuración", icon: Bot },
                            { id: "catalogo", label: "Catálogo", icon: Car },
                        ].map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setTab(id)}
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition"
                                style={{
                                    borderColor: "#131E5C",
                                    backgroundColor: tab === id ? "#131E5C" : "#FFFFFF",
                                    color: tab === id ? "#FFFFFF" : "#131E5C",
                                }}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="hidden sm:inline">{label}</span>
                            </button>
                        ))}

                        {tab === "config" && (
                            <>
                                <button
                                    onClick={() => cargarConfig(numeroSeleccionado)}
                                    disabled={cargandoConfig}
                                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition disabled:opacity-50"
                                    style={{ borderColor: "#131E5C", backgroundColor: "#FFFFFF", color: "#131E5C" }}
                                >
                                    {cargandoConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                    <span className="hidden sm:inline">Sincronizar</span>
                                </button>

                                <button
                                    onClick={publicarConfig}
                                    disabled={guardandoConfig}
                                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition text-white disabled:opacity-50"
                                    style={{ borderColor: "#131E5C", backgroundColor: "#131E5C" }}
                                >
                                    {guardandoConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                                    <span className="hidden sm:inline">Publicar IA</span>
                                </button>
                            </>
                        )}

                        {tab === "catalogo" && (
                            <button
                                onClick={abrirNuevoVehiculo}
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition text-white"
                                style={{ borderColor: "#131E5C", backgroundColor: "#131E5C" }}
                            >
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">Nuevo vehículo</span>
                            </button>
                        )}
                    </nav>
                </div>
            </header>

            <div className="mx-auto max-w-full px-4 py-6 sm:px-6 lg:px-8">

                {/* TAB: CONFIGURACIÓN */}
                {tab === "config" && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                            <StatCard label="Línea activa" icon={Bot}
                                value={cargandoConfig ? "—" : (lineaActual?.asesor_digital || "—")}
                                sub={lineaActual?.agencia || "Sin agencia"} loading={cargandoConfig} />
                            <StatCard label="Estado operativo" icon={lineaPuedeResponder ? Wifi : WifiOff}
                                value={cargandoConfig ? "—" : (lineaPuedeResponder ? "En línea" : "Inactivo")}
                                sub={bloqueosLinea.length ? bloqueosLinea[0] : "Operando con normalidad"}
                                variant={lineaPuedeResponder ? "success" : "danger"} loading={cargandoConfig} />
                            <StatCard label="Días activos" icon={Clock}
                                value={cargandoConfig ? "—" : `${totalDiasActivos} / 7`}
                                sub={lineaActual?.en_horario ? "En horario ahora" : "Fuera de horario"}
                                variant={lineaActual?.en_horario ? "success" : "default"} loading={cargandoConfig} />
                            <StatCard label="Catálogo IA" icon={Car}
                                value={`${totalVehiculosActivos}`} sub="Vehículos disponibles para IA"
                                action={() => setTab("catalogo")} actionLabel="Ver catálogo" />
                        </div>

                        <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
                            {/* Sidebar */}
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-[#E4E7F0] bg-white p-5">
                                    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#8891AD]">Línea a configurar</h3>
                                    {cargandoConfig ? <Skeleton className="h-14 w-full" /> : (
                                        <LineaSelector lineasIA={lineasIA} value={numeroSeleccionado} onChange={setNumero} />
                                    )}
                                </div>

                                <div className="rounded-2xl border border-[#E4E7F0] bg-white p-5">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#8891AD]">Asistente IA</p>
                                            <p className={`mt-1 text-sm font-bold ${swiftActivo ? "text-emerald-600" : "text-[#8891AD]"}`}>
                                                {swiftActivo ? "Activo y atendiendo" : "Pausado"}
                                            </p>
                                            <p className="mt-0.5 text-xs text-[#8891AD]">
                                                {swiftActivo ? "El agente responderá mensajes dentro del horario configurado." : "No se procesarán mensajes entrantes."}
                                            </p>
                                        </div>
                                        <Toggle value={swiftActivo} onChange={setSwiftActivo} />
                                    </div>
                                    <div className={`mt-4 rounded-xl px-4 py-3 flex items-center gap-2.5 ${swiftActivo ? "bg-emerald-50 border border-emerald-100" : "bg-[#F7F8FC] border border-[#E4E7F0]"}`}>
                                        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${swiftActivo ? "bg-emerald-500 animate-pulse" : "bg-[#C8CEDF]"}`} />
                                        <p className={`text-xs font-semibold ${swiftActivo ? "text-emerald-700" : "text-[#8891AD]"}`}>
                                            {lineaPuedeResponder ? "Respondiendo mensajes" : bloqueosLinea[0] || "Sin actividad"}
                                        </p>
                                    </div>
                                </div>

                                <HorariosBlock horarios={horarios} onChange={setHorarios} lineasIA={lineasIA}
                                    onSave={() => guardarConfig()} saving={guardandoConfig} />

                                <div className="rounded-2xl border border-[#E4E7F0] bg-white overflow-hidden">
                                    <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E4E7F0]">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
                                            <Shield className="h-[18px] w-[18px] text-red-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#1A1F3C]">Condiciones fijas</p>
                                            <p className="text-xs text-[#8891AD]">Reglas no negociables del agente</p>
                                        </div>
                                    </div>
                                    <div className="px-5 py-4">
                                        <textarea value={condicionesFijas} onChange={(e) => setCondFijas(e.target.value)}
                                            rows={8} className={textareaCls} placeholder="Reglas que el agente debe respetar siempre..." />
                                        <p className="mt-2 text-[11px] text-[#8891AD]">
                                            Estas condiciones tienen prioridad sobre cualquier otra instrucción del agente.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Main */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-base font-bold text-[#1A1F3C]">Instrucciones del agente</h2>
                                        <p className="text-xs text-[#8891AD] mt-0.5">Define el comportamiento y personalidad del asistente. Cada sección es independiente.</p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {secciones.filter((s) => campos[s.id]?.trim()).length === secciones.length
                                            ? <Badge variant="success" dot>Todo configurado</Badge>
                                            : <Badge variant="warning">{secciones.filter((s) => campos[s.id]?.trim()).length}/{secciones.length} completadas</Badge>
                                        }
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {secciones.map((seccion) => (
                                        <PromptField
                                            key={seccion.id}
                                            seccion={seccion}
                                            value={campos[seccion.id] || ""}
                                            onChange={(v) => setCampos((p) => ({ ...p, [seccion.id]: v }))}
                                            onSave={(v) => guardarConfig({ [seccion.id]: v })}
                                            saving={guardandoConfig}
                                        />
                                    ))}
                                </div>
                                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2">
                                    <button onClick={() => cargarConfig()} disabled={cargandoConfig}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E4E7F0] bg-white px-5 py-2.5 text-sm font-semibold text-[#515778] hover:bg-[#F7F8FC] disabled:opacity-50 transition-all">
                                        {cargandoConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                        Descartar cambios
                                    </button>
                                    <button onClick={publicarConfig} disabled={guardandoConfig}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#131E5C] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#0a1340] disabled:opacity-50 transition-all shadow-md shadow-[#131E5C]/20">
                                        {guardandoConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                                        Publicar y encender IA
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: CATÁLOGO */}
                {tab === "catalogo" && (
                    <div className="space-y-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-[#1A1F3C]">Catálogo de vehículos</h2>
                                <p className="text-xs text-[#8891AD] mt-0.5">
                                    Fuente de precios, fichas, imágenes y videos para el asistente IA
                                    <span className="font-semibold"> {totalVehiculosActivos} activos</span>
                                    {" · "}
                                    <span className="font-semibold">{vehiculos.length} total</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8891AD]" />
                                    <input value={qCatalogo} onChange={(e) => setQCatalogo(e.target.value)}
                                        placeholder="Buscar modelo, versión…"
                                        className="h-9 w-64 rounded-xl border border-[#E4E7F0] bg-white pl-9 pr-3 text-sm text-[#1A1F3C] placeholder:text-[#C8CEDF] outline-none focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10" />
                                </div>
                                <button onClick={() => setSoloActivos((v) => !v)}
                                    className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-all ${soloActivos ? "border-[#131E5C]/30 bg-[#131E5C]/8 text-[#131E5C]" : "border-[#E4E7F0] bg-white text-[#515778] hover:bg-[#F7F8FC]"}`}>
                                    <Toggle size="sm" value={soloActivos} onChange={setSoloActivos} />
                                    Solo activos
                                </button>
                                <button onClick={cargarCatalogo} disabled={cargandoCatalogo}
                                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#E4E7F0] bg-white px-3 text-xs font-semibold text-[#515778] hover:bg-[#F7F8FC] disabled:opacity-50 transition-all">
                                    {cargandoCatalogo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white">
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="border-b border-[#E4E7F0] bg-[#F7F8FC]">
                                            {["Vehículo", "Versión", "Precio lista", "Contado", "Financiado", "Media", "Estado", ""].map((h, i) => (
                                                <th key={i} className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-[#8891AD] ${i === 7 ? "text-right" : "text-left"}`}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cargandoCatalogo ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <tr key={i} className="border-b border-[#E4E7F0]/60">
                                                    <td className="px-4 py-3.5"><div className="space-y-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-16" /></div></td>
                                                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
                                                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
                                                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-20" /></td>
                                                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-20" /></td>
                                                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-16" /></td>
                                                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                                                    <td className="px-4 py-3.5"><div className="flex justify-end gap-1.5"><Skeleton className="h-8 w-8 rounded-lg" /><Skeleton className="h-8 w-8 rounded-lg" /></div></td>
                                                </tr>
                                            ))
                                        ) : vehiculosFiltrados.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-16 text-center">
                                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7F8FC] border border-[#E4E7F0]">
                                                        <Car className="h-6 w-6 text-[#8891AD]" />
                                                    </div>
                                                    <p className="mt-3 text-sm font-semibold text-[#1A1F3C]">Sin vehículos</p>
                                                    <p className="mt-1 text-xs text-[#8891AD]">
                                                        {qCatalogo ? "No hay resultados para tu búsqueda." : "Agrega el primer vehículo al catálogo."}
                                                    </p>
                                                    {!qCatalogo && (
                                                        <button onClick={abrirNuevoVehiculo}
                                                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#131E5C] px-4 py-2 text-xs font-bold text-white hover:bg-[#0a1340] transition-all">
                                                            <Plus className="h-3.5 w-3.5" /> Nuevo vehículo
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ) : (
                                            vehiculosFiltrados.map((item, idx) => (
                                                <tr key={item.id}
                                                    className={`group border-b border-[#E4E7F0]/60 transition-colors hover:bg-[#F7F8FC] ${idx % 2 === 1 ? "bg-[#FAFBFD]" : "bg-white"}`}>
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#131E5C]/6">
                                                                <Car className="h-4 w-4 text-[#131E5C]" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-[#1A1F3C]">{item.marca || "Volvo"} {item.modelo}</p>
                                                                <p className="text-[11px] text-[#8891AD]">Año {item.ano || "—"}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-sm font-medium text-[#515778]">{item.version || <span className="text-[#C8CEDF]">General</span>}</td>
                                                    <td className="px-4 py-3.5 text-sm font-bold text-[#1A1F3C]">{money(item.precio_lista)}</td>
                                                    <td className="px-4 py-3.5 text-sm text-[#515778]">{money(item.precio_contado)}</td>
                                                    <td className="px-4 py-3.5 text-sm text-[#515778]">{money(item.precio_financiado)}</td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex flex-col gap-1">
                                                            {item.url_ficha_tecnica ? (
                                                                <a
                                                                    href={toMediaUrl(item.url_ficha_tecnica)}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#131E5C] hover:underline"
                                                                >
                                                                    PDF <ExternalLink className="h-3 w-3" />
                                                                </a>
                                                            ) : (
                                                                <span className="text-xs text-[#C8CEDF]">Sin PDF</span>
                                                            )}

                                                            <span className="text-[11px] text-[#8891AD]">
                                                                {safeArray(item.imagenes).length} img · {safeArray(item.videos).length} video
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <Badge variant={item.activo ? "success" : "default"} dot>
                                                            {item.activo ? "Activo" : "Inactivo"}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Tooltip content="Editar">
                                                                <button onClick={() => abrirEditarVehiculo(item)}
                                                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4E7F0] text-[#515778] hover:bg-[#F7F8FC] hover:text-[#1A1F3C] transition-all">
                                                                    <Edit3 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </Tooltip>
                                                            {item.activo ? (
                                                                <Tooltip content="Desactivar">
                                                                    <button onClick={() => desactivarVehiculo(item)}
                                                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-all">
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </Tooltip>
                                                            ) : (
                                                                <Tooltip content="Reactivar">
                                                                    <button onClick={() => reactivarVehiculo(item)}
                                                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-100 text-emerald-600 hover:bg-emerald-50 transition-all">
                                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </Tooltip>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {vehiculosFiltrados.length > 0 && !cargandoCatalogo && (
                                <div className="flex items-center justify-between border-t border-[#E4E7F0] bg-[#F7F8FC] px-4 py-3">
                                    <p className="text-xs text-[#8891AD]">
                                        Mostrando <span className="font-semibold text-[#515778]">{vehiculosFiltrados.length}</span> de <span className="font-semibold text-[#515778]">{vehiculos.length}</span> vehículos
                                    </p>
                                    <Badge variant="navy">{totalVehiculosActivos} en catálogo IA</Badge>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL VEHÍCULO */}
            <Modal
                open={modalVehiculo}
                title={vehiculoDraft.id ? `Editar — ${vehiculoDraft.modelo || "Vehículo"}` : "Nuevo vehículo"}
                subtitle={vehiculoDraft.id ? `ID ${vehiculoDraft.id} · Última actualización: ${vehiculoDraft.ultima_actualizacion || "—"}` : "Completa la información del vehículo para el catálogo IA"}
                onClose={cerrarModalVehiculo} size="xl"
                footer={
                    <>
                        <button onClick={cerrarModalVehiculo} disabled={guardandoVehiculo}
                            className="rounded-xl border border-[#E4E7F0] bg-white px-5 py-2.5 text-sm font-semibold text-[#515778] hover:bg-[#F7F8FC] disabled:opacity-50 transition-all">
                            Cancelar
                        </button>
                        <button onClick={guardarVehiculo} disabled={guardandoVehiculo}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#131E5C] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#0a1340] disabled:opacity-50 transition-all shadow-md shadow-[#131E5C]/20">
                            {guardandoVehiculo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {vehiculoDraft.id ? "Guardar cambios" : "Agregar al catálogo"}
                        </button>
                    </>
                }
            >
                <div className="mb-5 flex gap-1 rounded-xl border border-[#E4E7F0] bg-[#F7F8FC] p-1">
                    {[
                        { id: "info", label: "Información", icon: Car },
                        { id: "precios", label: "Precios", icon: Tag },
                        { id: "tecnica", label: "Ficha técnica", icon: Layers },
                        { id: "media", label: "Media & Links", icon: ExternalLink },
                    ].map(({ id, label, icon: Icon }) => (
                        <button key={id} onClick={() => setActiveModalTab(id)}
                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${activeModalTab === id ? "bg-white text-[#1A1F3C] shadow-sm border border-[#E4E7F0]" : "text-[#8891AD] hover:text-[#515778]"}`}>
                            <Icon className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{label}</span>
                        </button>
                    ))}
                </div>

                {activeModalTab === "info" && (
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Marca" required>
                            <input value={vehiculoDraft.marca} onChange={(e) => patchDraft("marca", e.target.value)} className={inputCls} placeholder="Volvo" />
                        </Field>
                        <Field label="Modelo" required>
                            <input value={vehiculoDraft.modelo} onChange={(e) => patchDraft("modelo", e.target.value)} className={inputCls} placeholder="EX30, XC60, XC90…" />
                        </Field>
                        <Field label="Año" required>
                            <input type="number" value={vehiculoDraft.ano} onChange={(e) => patchDraft("ano", Number(e.target.value || 0))} className={inputCls} />
                        </Field>
                        <Field label="Versión">
                            <input value={vehiculoDraft.version} onChange={(e) => patchDraft("version", e.target.value)} className={inputCls} placeholder="Trendline, Comfortline, Highline…" />
                        </Field>
                        <Field label="Última actualización">
                            <input type="date" value={vehiculoDraft.ultima_actualizacion || ""} onChange={(e) => patchDraft("ultima_actualizacion", e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Estado">
                            <div className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors ${vehiculoDraft.activo ? "border-emerald-200 bg-emerald-50" : "border-[#E4E7F0] bg-[#F7F8FC]"}`}>
                                <Toggle value={Boolean(vehiculoDraft.activo)} onChange={(v) => patchDraft("activo", v)} />
                                <div>
                                    <p className={`text-sm font-bold ${vehiculoDraft.activo ? "text-emerald-700" : "text-[#8891AD]"}`}>
                                        {vehiculoDraft.activo ? "Activo en catálogo" : "Inactivo"}
                                    </p>
                                    <p className="text-xs text-[#8891AD]">{vehiculoDraft.activo ? "La IA podrá usar este vehículo." : "La IA no usará este vehículo."}</p>
                                </div>
                            </div>
                        </Field>
                        <Field label="Resumen comercial" col={2}>
                            <textarea value={vehiculoDraft.resumen} onChange={(e) => patchDraft("resumen", e.target.value)} rows={3} className={textareaCls}
                                placeholder="Descripción breve que la IA puede usar para explicar el vehículo al prospecto…" />
                        </Field>
                    </div>
                )}

                {activeModalTab === "precios" && (
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="md:col-span-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 flex items-start gap-2.5">
                            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs font-medium text-amber-700">
                                Los precios registrados aquí serán la única fuente oficial de precios para el asistente IA. Asegúrate de mantenerlos actualizados.
                            </p>
                        </div>
                        {[
                            { id: "precio_lista", label: "Precio de lista" },
                            { id: "precio_contado", label: "Precio de contado" },
                            { id: "precio_financiado", label: "Precio financiado" },
                        ].map(({ id, label }) => (
                            <Field key={id} label={label}>
                                <div className="relative">
                                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8891AD]">$</span>
                                    <input inputMode="numeric" value={vehiculoDraft[id]}
                                        onChange={(e) => patchDraft(id, parseNumberInput(e.target.value))}
                                        className={`${inputCls} pl-7`} placeholder="0" />
                                </div>
                                {vehiculoDraft[id] ? <p className="mt-1 text-xs font-semibold text-[#131E5C]">{money(vehiculoDraft[id])}</p> : null}
                            </Field>
                        ))}
                    </div>
                )}

                {activeModalTab === "tecnica" && (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-[#E4E7F0] bg-[#F7F8FC] px-4 py-3 flex items-start gap-2.5">
                            <Info className="h-4 w-4 text-[#515778] flex-shrink-0 mt-0.5" />
                            <p className="text-xs font-medium text-[#515778]">Ingresa la ficha técnica en formato JSON. Cada clave es una característica del vehículo.</p>
                        </div>
                        <Field label="Ficha técnica (JSON)">
                            <textarea value={fichaTexto} onChange={(e) => setFichaTexto(e.target.value)} rows={12}
                                className={`${textareaCls} font-mono text-xs`}
                                placeholder={'{\n  "Motor": "1.4L TSI",\n  "Potencia": "150 hp",\n  "Transmisión": "Tiptronic 8"\n}'} />
                        </Field>
                        {fichaTexto && fichaTexto !== "{}" && (() => {
                            const parsed = tryJsonParse(fichaTexto, null);
                            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                                const entries = Object.entries(parsed);
                                if (entries.length > 0) return (
                                    <div className="rounded-xl border border-[#E4E7F0] overflow-hidden">
                                        <div className="bg-[#F7F8FC] px-4 py-2.5 border-b border-[#E4E7F0]">
                                            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#8891AD]">Vista previa — {entries.length} especificaciones</p>
                                        </div>
                                        <div className="grid grid-cols-2 divide-x divide-y divide-[#E4E7F0]">
                                            {entries.map(([k, v]) => (
                                                <div key={k} className="px-4 py-2.5">
                                                    <p className="text-[11px] text-[#8891AD]">{k}</p>
                                                    <p className="text-sm font-semibold text-[#1A1F3C]">{String(v)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                )}

                {activeModalTab === "media" && (
                    <div className="space-y-5">
                        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 flex items-start gap-2.5">
                            <Info className="h-4 w-4 text-blue-700 flex-shrink-0 mt-0.5" />
                            <div className="text-xs font-medium text-blue-800 space-y-1">
                                <p>
                                    Guarda rutas relativas desde <b>/media/</b>. No pongas <b>media/</b> al inicio.
                                </p>
                                <p className="font-mono">
                                    Ej: catalogo/volvo/imagenes/xc60_2026_exterior.jpg
                                </p>
                            </div>
                        </div>

                        <Field label="Ficha técnica / PDF">
                            <div className="relative">
                                <ExternalLink className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8891AD]" />
                                <input
                                    value={vehiculoDraft.url_ficha_tecnica}
                                    onChange={(e) => patchDraft("url_ficha_tecnica", e.target.value)}
                                    className={`${inputCls} pl-9`}
                                    placeholder="catalogo/volvo/ficha/xc60_2026_ficha_tecnica.pdf"
                                />
                            </div>

                            {vehiculoDraft.url_ficha_tecnica && (
                                <a
                                    href={toMediaUrl(vehiculoDraft.url_ficha_tecnica)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[#131E5C] hover:underline"
                                >
                                    Verificar PDF <ExternalLink className="h-3 w-3" />
                                </a>
                            )}
                        </Field>

                        <Field label="Imágenes (una ruta o URL por línea)">
                            <textarea
                                value={imagenesTexto}
                                onChange={(e) => setImagenesTexto(e.target.value)}
                                rows={5}
                                className={textareaCls}
                                placeholder={
                                    "catalogo/volvo/imagenes/xc60_2026_exterior.jpg\n" +
                                    "catalogo/volvo/imagenes/xc60_2026_interior.jpg"
                                }
                            />

                            {imagenesTexto && (
                                <p className="mt-1.5 text-xs text-[#8891AD]">
                                    {splitLineasTexto(imagenesTexto).length} imágenes registradas
                                </p>
                            )}
                        </Field>

                        {imagenesTexto && (
                            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                                {splitLineasTexto(imagenesTexto).slice(0, 6).map((url, i) => (
                                    <a
                                        key={i}
                                        href={toMediaUrl(url)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="group aspect-video overflow-hidden rounded-xl border border-[#E4E7F0] bg-[#F7F8FC] relative"
                                    >
                                        <img
                                            src={toMediaUrl(url)}
                                            alt={`Preview imagen ${i + 1}`}
                                            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                                            onError={(e) => {
                                                e.currentTarget.style.display = "none";
                                            }}
                                        />
                                        <div className="absolute bottom-1 left-1 right-1 rounded bg-black/50 px-2 py-1 text-[10px] text-white truncate">
                                            {url}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}

                        <Field label="Videos MP4 (una ruta o URL por línea)">
                            <textarea
                                value={videosTexto}
                                onChange={(e) => setVideosTexto(e.target.value)}
                                rows={5}
                                className={textareaCls}
                                placeholder={
                                    "catalogo/volvo/videos/xc60_2026_video.mp4\n" +
                                    "catalogo/volvo/videos/xc60_2026_asmr.mp4"
                                }
                            />

                            {videosTexto && (
                                <p className="mt-1.5 text-xs text-[#8891AD]">
                                    {splitLineasTexto(videosTexto).length} videos registrados
                                </p>
                            )}
                        </Field>

                        {videosTexto && (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {splitLineasTexto(videosTexto).slice(0, 4).map((url, i) => (
                                    <div
                                        key={i}
                                        className="overflow-hidden rounded-xl border border-[#E4E7F0] bg-[#F7F8FC]"
                                    >
                                        <video
                                            src={toMediaUrl(url)}
                                            controls
                                            preload="metadata"
                                            className="aspect-video w-full bg-black object-contain"
                                        />

                                        <div className="flex items-center justify-between gap-2 px-3 py-2">
                                            <p className="truncate text-[11px] font-medium text-[#515778]">
                                                {url}
                                            </p>

                                            <a
                                                href={toMediaUrl(url)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#131E5C] hover:underline"
                                            >
                                                Abrir <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {errorVehiculo && (
                    <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-semibold text-red-700">{errorVehiculo}</p>
                    </div>
                )}
            </Modal>
        </div>
    );
}