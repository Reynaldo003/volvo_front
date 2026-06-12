// src/pages/TraficoPiso/TraficoPiso.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    ArrowUpDown,
    BadgeDollarSign,
    BriefcaseBusiness,
    CalendarDays,
    CarFront,
    ChevronDown,
    ChevronUp,
    CircleDollarSign,
    ClipboardList,
    Clock,
    HeartHandshake,
    Loader2,
    Mail,
    MessageSquareText,
    Phone,
    Plus,
    Save,
    Search,
    ShieldCheck,
    Trash2,
    User,
    UserRoundSearch,
    Users,
    X,
    Building2,
} from "lucide-react";
import { apiTraficoPiso } from "../../lib/apiTraficoPiso";

const BRAND_BLUE = "#131E5C";

const DEALERS = [
    "Volvo",
];
const VEHICULOS = [
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

const MOTIVOS_INGRESO = [
    "Vi anuncios en la TV",
    "Vi anuncios en las redes sociales",
    "Vi publicitarios",
    "Siempre me ha gustado la marca",
    "Pasé y sentí curiosidad",
    "Recibí información por Whastapp",
];

const TIPOS_PERSONA = ["Física", "Moral"];
const TIEMPOS_COMPRA = ["Este mes", "De 1 a 3 meses", "De 3 a 6 meses"];

const FORMAS_CAPITALIZACION = [
    "Deseo un Crédito",
    "Quiero pagarlo de contado",
    "Me interesa un arrendamiento",
    "Me interesa un Autofinanciamiento",
];

const MENSUALIDADES = [3, 6, 12, 18, 26, 36, 48, 60, 72];

const FORMAS_COMPROBAR_INGRESOS = [
    "No cuenta",
    "Recibo de Nómina",
    "Factura por Servicios",
    "Estado de Cuenta",
    "Declaración de Impuestos",
    "Pago de Pensión",
    "Carta de Ingresos",
];

const MOTIVOS_COMPRA = [
    "Renovar auto",
    "Mi familia se hace más grande",
    "Mi trabajo me lo pide",
    "Mi estilo de vida me lo pide",
];

const PERFILES_PROFESIONALES = [
    "Comerciales",
    "Asalariado Sector Público",
    "Asalariado Sector Privado",
    "Pensionado",
    "Profesionista Independiente",
];

const ESTADOS_CIVILES = ["Soltero", "Casado", "Divorciado"];

const ASESORES = [
    "Enrique Vazquez Islas",
    "Ricardo Platas",
    "Verónica Del Rayo Galindo León",
    "Julio Camacho Barragán",
    "Fernanda Romero Aguilar",
];

const PASATIEMPOS = [
    "Ciclismo",
    "Natación",
    "Futbol",
    "Pesca",
    "Senderismo",
    "Tenis-frontón",
    "Golf",
    "Mixología",
    "Cocinar",
    "Coleccionar objetos",
    "Viajar dentro del país",
    "Viajar fuera del país",
    "Automovilismo",
    "Fotografía",
    "Pintura",
    "Arquitectura",
    "Conciertos",
    "Ajedrez",
    "Lectura",
    "Desarrollo personal",
    "Pilates",
    "Yoga",
    "Neurociencias",
    "Aprendizaje de idioma",
];

const INITIAL_FORM = {
    agencia: "",
    nombre_prospecto: "",
    codigo_postal: "",
    telefono: "",
    email: "",
    asesor_ventas: "",
    motivo_ingreso: "",
    tipo_persona: "Física",
    tiempo_compra: "",
    auto_suenos: "",
    deja_auto_cuenta: false,
    modelo_auto_cuenta: "",
    forma_capitalizacion: "",
    presupuesto_estimado: "",
    enganche_presupuestado: "",
    mensualidades_presupuestadas: "",
    comprueba_ingresos: false,
    forma_comprobar_ingresos: "No cuenta",
    motivo_compra: "",
    perfil_profesional: "",
    edad: "",
    cantidad_hijos: "0",
    estado_civil: "",
    pasatiempos: [],
    comentarios: "",
};

function normalizeStr(value) {
    return String(value ?? "").trim();
}

function normalizarBusqueda(value) {
    return normalizeStr(value)
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase();
}

function soloNumeros(value) {
    return String(value || "").replace(/\D/g, "");
}

function validarTelefono(value) {
    const telefono = soloNumeros(value);

    if (!telefono) return false;

    if (telefono.length === 10) return true;

    if (telefono.length === 12 && telefono.startsWith("52")) return true;

    return false;
}

function mensajeTelefono(value) {
    const telefono = soloNumeros(value);

    if (!telefono) return "Captura un teléfono numérico.";

    if (telefono.length < 10) {
        return "El teléfono debe tener mínimo 10 dígitos.";
    }

    if (telefono.length === 11) {
        return "El teléfono no puede tener 11 dígitos. Usa 10 dígitos o 52 + 10 dígitos.";
    }

    if (telefono.length === 12 && !telefono.startsWith("52")) {
        return "Si el teléfono tiene 12 dígitos, debe iniciar con 52.";
    }

    if (telefono.length > 12) {
        return "El teléfono no puede tener más de 12 dígitos.";
    }

    return "Teléfono inválido.";
}

function validarEmail(value) {
    const email = normalizeStr(value);

    if (!email) return true;

    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function money(value) {
    const n = Number(value || 0);
    return n.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 0,
    });
}

function dateTime(value) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("es-MX", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

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

function normalizarPayload(form) {
    return {
        ...form,
        agencia: normalizeStr(form.agencia),
        nombre_prospecto: normalizeStr(form.nombre_prospecto).toUpperCase(),
        codigo_postal: soloNumeros(form.codigo_postal),
        telefono: soloNumeros(form.telefono),
        email: normalizeStr(form.email),
        asesor_ventas: normalizeStr(form.asesor_ventas),
        auto_suenos: normalizeStr(form.auto_suenos),
        presupuesto_estimado: Number(form.presupuesto_estimado || 0),
        enganche_presupuestado: Number(form.enganche_presupuestado || 0),
        mensualidades_presupuestadas: Number(form.mensualidades_presupuestadas || 0),
        edad: form.edad === "" ? null : Number(form.edad),
        cantidad_hijos: Number(form.cantidad_hijos || 0),
        modelo_auto_cuenta: form.deja_auto_cuenta ? normalizeStr(form.modelo_auto_cuenta) : "",
        pasatiempos: Array.isArray(form.pasatiempos) ? form.pasatiempos : [],
        comentarios: normalizeStr(form.comentarios),
    };
}

function validarFormulario(form) {
    const errores = [];
    const telefono = soloNumeros(form.telefono);

    if (!normalizeStr(form.agencia)) errores.push("Selecciona el dealer.");
    if (!normalizeStr(form.nombre_prospecto)) errores.push("Captura el nombre del prospecto.");
    if (!soloNumeros(form.codigo_postal)) errores.push("Captura un código postal numérico.");
    if (!validarTelefono(telefono)) errores.push(mensajeTelefono(telefono));
    if (!validarEmail(form.email)) errores.push("Captura un correo electrónico válido.");
    if (!normalizeStr(form.asesor_ventas)) errores.push("Selecciona o captura un asesor de ventas.");
    if (!form.motivo_ingreso) errores.push("Selecciona por qué ingresó a la agencia.");
    if (!form.tiempo_compra) errores.push("Selecciona cuándo tiene programada su compra.");
    if (!form.auto_suenos) errores.push("Selecciona el auto de sus sueños.");
    if (!form.forma_capitalizacion) errores.push("Selecciona una forma de capitalización.");
    if (Number(form.presupuesto_estimado || 0) < 100000) errores.push("El presupuesto estimado debe tener al menos seis dígitos.");
    if (Number(form.enganche_presupuestado || 0) < 10000) errores.push("El enganche presupuestado debe tener al menos cinco dígitos.");
    if (!form.mensualidades_presupuestadas) errores.push("Selecciona mensualidades presupuestadas.");
    if (!form.forma_comprobar_ingresos) errores.push("Selecciona la forma de comprobar ingresos.");
    if (!form.motivo_compra) errores.push("Selecciona el motivo de compra.");
    if (!form.perfil_profesional) errores.push("Selecciona el perfil profesional.");
    if (!form.estado_civil) errores.push("Selecciona el estado civil.");
    if (form.deja_auto_cuenta && !normalizeStr(form.modelo_auto_cuenta)) errores.push("Captura el modelo que desea dejar a cuenta.");
    if (!Array.isArray(form.pasatiempos) || form.pasatiempos.length < 3) errores.push("Selecciona al menos 3 pasatiempos.");

    return errores;
}

function Skeleton({ className = "" }) {
    return <div className={["animate-pulse rounded-md bg-black/10", className].join(" ")} />;
}

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 10 }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 w-full max-w-[160px] rounded bg-slate-200/70" />
                </td>
            ))}
        </tr>
    );
}

function ModalSkeleton() {
    return (
        <div className="grid gap-3 md:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-neutral-200/50 p-4">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="mt-3 h-10 w-full rounded-lg" />
                </div>
            ))}
            <div className="rounded-lg border border-white/10 bg-neutral-200/50 p-4 md:col-span-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-3 h-24 w-full rounded-lg" />
            </div>
        </div>
    );
}

function Modal({ open, title, subtitle, onClose, children, footer }) {
    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} />

            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-6xl overflow-hidden rounded-lg border border-[#131E5C] bg-neutral-100 shadow-2xl">
                    <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ backgroundColor: BRAND_BLUE }}>
                        <div className="min-w-0">
                            <div className="truncate text-base font-extrabold text-white">{title}</div>
                            {subtitle ? <div className="mt-1 truncate text-xs font-semibold text-white/70">{subtitle}</div> : null}
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white hover:bg-white/15"
                            aria-label="Cerrar"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="max-h-[74vh] overflow-auto p-5">{children}</div>

                    {footer ? (
                        <div className="flex flex-col gap-2 border-t border-black/10 bg-white/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            {footer}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>,
        document.body
    );
}

function Section({ title, icon: Icon, children }) {
    return (
        <section className="rounded-lg border border-black/10 bg-white/60 p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[#131E5C]">
                {Icon ? <Icon className="h-4 w-4" /> : null}
                <span>{title}</span>
            </div>
            {children}
        </section>
    );
}

function Field({ label, icon: Icon, required, hint, invalid, children }) {
    return (
        <div className={["rounded-lg border bg-neutral-200/50 p-4", invalid ? "border-red-400" : "border-white/10"].join(" ")}>
            <div className="mb-2 flex items-center justify-between gap-2 text-sm font-bold text-[#131E5C]">
                <div className="flex items-center gap-2">
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                    <span>
                        {label} {required ? <b className="text-red-500">*</b> : null}
                    </span>
                </div>
                {hint ? <span className="text-xs font-semibold text-slate-500">{hint}</span> : null}
            </div>
            {children}
        </div>
    );
}

function FilterBlock({ label, children }) {
    return (
        <div className="rounded-lg">
            <div className="mb-2 text-xs font-extrabold tracking-wide text-[#131E5C]">{label}</div>
            {children}
        </div>
    );
}

function Input({ invalid = false, className = "", ...props }) {
    return (
        <input
            {...props}
            className={[
                "w-full rounded-lg border px-3 py-2 text-sm font-semibold text-[#131E5C] shadow-lg outline-none",
                invalid ? "border-red-500 bg-red-50" : "border-black/10 bg-neutral-100",
                props.disabled ? "cursor-not-allowed opacity-75" : "",
                className,
            ].join(" ")}
        />
    );
}

function Textarea({ invalid = false, className = "", ...props }) {
    return (
        <textarea
            {...props}
            className={[
                "min-h-[110px] w-full resize-none rounded-lg border px-3 py-2 text-sm font-semibold text-[#131E5C] shadow-lg outline-none",
                invalid ? "border-red-500 bg-red-50" : "border-black/10 bg-neutral-100",
                className,
            ].join(" ")}
        />
    );
}

function Select({ invalid = false, children, className = "", ...props }) {
    return (
        <select
            {...props}
            className={[
                "w-full rounded-lg border px-3 py-2 text-sm font-semibold text-[#131E5C] shadow-lg outline-none",
                invalid ? "border-red-500 bg-red-50" : "border-black/10 bg-neutral-100",
                className,
            ].join(" ")}
        >
            {children}
        </select>
    );
}

function BooleanSwitch({ value, onChange, yes = "SÍ", no = "NO" }) {
    return (
        <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-black/10 bg-white p-1 shadow-lg">
            <button
                type="button"
                onClick={() => onChange(true)}
                className={[
                    "rounded-md px-3 py-2 text-sm font-extrabold transition",
                    value ? "bg-[#131E5C] text-white shadow-sm" : "text-[#131E5C] hover:bg-slate-100",
                ].join(" ")}
            >
                {yes}
            </button>
            <button
                type="button"
                onClick={() => onChange(false)}
                className={[
                    "rounded-md px-3 py-2 text-sm font-extrabold transition",
                    !value ? "bg-[#131E5C] text-white shadow-sm" : "text-[#131E5C] hover:bg-slate-100",
                ].join(" ")}
            >
                {no}
            </button>
        </div>
    );
}

function PasatiemposPicker({ value, onChange, invalid }) {
    const seleccionados = new Set(value || []);

    function toggle(item) {
        if (seleccionados.has(item)) {
            onChange((value || []).filter((x) => x !== item));
            return;
        }
        onChange([...(value || []), item]);
    }

    return (
        <div className={["rounded-lg border bg-neutral-200/50 p-4", invalid ? "border-red-400" : "border-white/10"].join(" ")}>
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-extrabold text-[#131E5C]">
                    <HeartHandshake className="h-4 w-4" />
                    <span>Pasatiempos *</span>
                </div>
                <span
                    className={[
                        "rounded-full px-3 py-1 text-xs font-extrabold",
                        value.length >= 3 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
                    ].join(" ")}
                >
                    {value.length}/3 mínimos
                </span>
            </div>

            <div className="flex max-h-[220px] flex-wrap gap-2 overflow-y-auto pr-1">
                {PASATIEMPOS.map((item) => {
                    const active = seleccionados.has(item);
                    return (
                        <button
                            key={item}
                            type="button"
                            onClick={() => toggle(item)}
                            className={[
                                "rounded-full border px-3 py-2 text-xs font-extrabold transition",
                                active
                                    ? "border-[#131E5C] bg-[#131E5C] text-white"
                                    : "border-black/10 bg-white text-[#131E5C] hover:border-[#131E5C] hover:bg-white",
                            ].join(" ")}
                        >
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

        if (!q) {
            return ASESORES.slice(0, 20);
        }

        return ASESORES.filter((asesor) => normalizarBusqueda(asesor).includes(q)).slice(0, 20);
    }, [value]);

    useEffect(() => {
        const onClick = (event) => {
            if (!wrapperRef.current) return;
            if (!wrapperRef.current.contains(event.target)) setOpen(false);
        };

        window.addEventListener("mousedown", onClick);
        return () => window.removeEventListener("mousedown", onClick);
    }, []);

    return (
        <div ref={wrapperRef} className="relative">
            <Input
                value={value}
                invalid={invalid}
                onChange={(e) => {
                    onChange(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder="Escribe para buscar asesor..."
            />

            {open ? (
                <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
                    <div className="border-b border-black/10 px-3 py-2 text-xs font-bold text-[#131E5C]">
                        Selecciona un asesor
                    </div>

                    <div className="max-h-56 overflow-y-auto">
                        {opciones.length === 0 ? (
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="block w-full px-3 py-3 text-left text-sm font-semibold text-slate-500 hover:bg-slate-50"
                            >
                                No encontré coincidencias. Puedes dejar el nombre escrito manualmente.
                            </button>
                        ) : null}

                        {opciones.map((asesor) => (
                            <button
                                key={asesor}
                                type="button"
                                onClick={() => {
                                    onChange(asesor);
                                    setOpen(false);
                                }}
                                className="block w-full px-3 py-3 text-left hover:bg-slate-50"
                            >
                                <div className="text-sm font-extrabold text-[#131E5C]">{asesor}</div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function StatCard({ label, value, helper, icon: Icon }) {
    return (
        <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">{label}</p>
                    <p className="mt-2 text-2xl font-extrabold text-[#131E5C]">{value}</p>
                    {helper ? <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p> : null}
                </div>
                {Icon ? (
                    <div className="rounded-2xl bg-[#131E5C]/10 p-3 text-[#131E5C]">
                        <Icon className="h-5 w-5" />
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function SortButton({ label, sortKey, sort, onClick }) {
    const active = sort.key === sortKey;

    return (
        <button type="button" onClick={() => onClick(sortKey)} className="inline-flex items-center gap-1 text-xs font-bold">
            {label}
            <span className="opacity-70">
                {active ? sort.dir === "asc" ? <ChevronUp className="h-4" /> : <ChevronDown className="h-4" /> : <ArrowUpDown className="h-4" />}
            </span>
        </button>
    );
}

function ContextMenu({ ctxMenu, onDelete, onClose }) {
    if (!ctxMenu.open || !ctxMenu.row) return null;

    return createPortal(
        <div className="fixed z-[9999]" style={{ left: ctxMenu.x, top: ctxMenu.y }} onClick={(e) => e.stopPropagation()}>
            <div className="w-48 overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl">
                <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(ctxMenu.row)}
                >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                </button>

                <button type="button" className="w-full px-4 py-2 text-left text-xs text-slate-500 hover:bg-slate-50" onClick={onClose}>
                    Cerrar
                </button>
            </div>
        </div>,
        document.body
    );
}

export default function TraficoPiso() {
    const [registros, setRegistros] = useState([]);
    const [resumen, setResumen] = useState(null);

    const [filters, setFilters] = useState({
        q: "",
        tipoPersona: "Todos",
        tiempoCompra: "Todos",
        rangoDesde: "",
        rangoHasta: "",
    });

    const [sort, setSort] = useState({ key: "creado_en", dir: "desc" });
    const [ctxMenu, setCtxMenu] = useState({ open: false, x: 0, y: 0, row: null });

    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState("create");
    const [draft, setDraft] = useState(null);
    const [touchedSave, setTouchedSave] = useState(false);

    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [ok, setOk] = useState("");

    const errores = useMemo(() => validarFormulario(draft || INITIAL_FORM), [draft]);

    const missingMap = useMemo(() => {
        const map = new Set();
        if (!draft) return map;

        if (!normalizeStr(draft.agencia)) map.add("agencia");
        if (!normalizeStr(draft.nombre_prospecto)) map.add("nombre_prospecto");
        if (!soloNumeros(draft.codigo_postal)) map.add("codigo_postal");
        if (!validarTelefono(draft.telefono)) map.add("telefono");
        if (!validarEmail(draft.email)) map.add("email");
        if (!normalizeStr(draft.asesor_ventas)) map.add("asesor_ventas");
        if (!draft.motivo_ingreso) map.add("motivo_ingreso");
        if (!draft.tiempo_compra) map.add("tiempo_compra");
        if (!draft.auto_suenos) map.add("auto_suenos");
        if (draft.deja_auto_cuenta && !normalizeStr(draft.modelo_auto_cuenta)) map.add("modelo_auto_cuenta");
        if (!draft.forma_capitalizacion) map.add("forma_capitalizacion");
        if (Number(draft.presupuesto_estimado || 0) < 100000) map.add("presupuesto_estimado");
        if (Number(draft.enganche_presupuestado || 0) < 10000) map.add("enganche_presupuestado");
        if (!draft.mensualidades_presupuestadas) map.add("mensualidades_presupuestadas");
        if (!draft.forma_comprobar_ingresos) map.add("forma_comprobar_ingresos");
        if (!draft.motivo_compra) map.add("motivo_compra");
        if (!draft.perfil_profesional) map.add("perfil_profesional");
        if (!draft.estado_civil) map.add("estado_civil");
        if (!Array.isArray(draft.pasatiempos) || draft.pasatiempos.length < 3) map.add("pasatiempos");

        return map;
    }, [draft]);

    function isInvalid(key) {
        return touchedSave && missingMap.has(key);
    }

    function updateField(name, value) {
        setDraft((prev) => ({ ...(prev || INITIAL_FORM), [name]: value }));
    }

    function toggleSort(key) {
        setSort((prev) => {
            if (prev.key !== key) return { key, dir: "asc" };
            return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
        });
    }

    async function cargarDatos(params = {}) {
        try {
            setLoadingList(true);
            setError("");

            const [lista, datosResumen] = await Promise.all([
                apiTraficoPiso.list(params),
                apiTraficoPiso.resumen(params).catch(() => null),
            ]);

            setRegistros(Array.isArray(lista) ? lista : lista?.results || []);
            setResumen(datosResumen || null);
        } catch (err) {
            console.error(err);
            setError(err.message || "No se pudo cargar el tráfico de piso.");
            setRegistros([]);
        } finally {
            setLoadingList(false);
        }
    }

    useEffect(() => {
        cargarDatos();
    }, []);

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

    function openCreate() {
        setError("");
        setOk("");
        setTouchedSave(false);
        setMode("create");
        setDraft({ ...INITIAL_FORM });
        setOpenModal(true);
    }

    async function openEdit(row) {
        if (!row?.id_trafico) return;

        try {
            setError("");
            setOk("");
            setTouchedSave(false);
            setMode("edit");
            setOpenModal(true);
            setLoadingDetail(true);

            const item = await apiTraficoPiso.get(row.id_trafico);

            setDraft({
                ...INITIAL_FORM,
                ...item,
                presupuesto_estimado: item.presupuesto_estimado === null || item.presupuesto_estimado === undefined ? "" : String(parseInt(item.presupuesto_estimado || 0, 10) || ""),
                enganche_presupuestado: item.enganche_presupuestado === null || item.enganche_presupuestado === undefined ? "" : String(parseInt(item.enganche_presupuestado || 0, 10) || ""),
                mensualidades_presupuestadas: item.mensualidades_presupuestadas ? String(item.mensualidades_presupuestadas) : "",
                edad: item.edad === null || item.edad === undefined ? "" : String(item.edad),
                cantidad_hijos: item.cantidad_hijos === null || item.cantidad_hijos === undefined ? "0" : String(item.cantidad_hijos),
                pasatiempos: Array.isArray(item.pasatiempos) ? item.pasatiempos : [],
                deja_auto_cuenta: !!item.deja_auto_cuenta,
                comprueba_ingresos: !!item.comprueba_ingresos,
            });
        } catch (err) {
            console.error(err);
            setError(err.message || "No se pudo abrir el registro.");
            setOpenModal(false);
        } finally {
            setLoadingDetail(false);
        }
    }

    function closeModal() {
        if (saving) return;
        setOpenModal(false);
        setDraft(null);
        setTouchedSave(false);
    }

    async function save() {
        if (!draft || saving) return;

        setTouchedSave(true);
        setError("");
        setOk("");

        const actuales = validarFormulario(draft);
        if (actuales.length) {
            setError(actuales[0]);
            return;
        }

        try {
            setSaving(true);
            const payload = normalizarPayload(draft);

            if (mode === "edit" && draft.id_trafico) {
                await apiTraficoPiso.update(draft.id_trafico, payload);
                setOk("Registro actualizado correctamente.");
            } else {
                await apiTraficoPiso.create(payload);
                setOk("Registro guardado correctamente.");
            }

            await cargarDatos();
            closeModal();
        } catch (err) {
            console.error(err);
            setError(err.message || "No se pudo guardar el registro.");
        } finally {
            setSaving(false);
        }
    }

    async function eliminar(row) {
        if (!row?.id_trafico) return;

        const confirmar = window.confirm(`¿Eliminar el registro de ${row.nombre_prospecto || "este prospecto"}?`);
        if (!confirmar) return;

        try {
            setError("");
            setOk("");
            await apiTraficoPiso.remove(row.id_trafico);
            await cargarDatos();
            setOk("Registro eliminado correctamente.");
        } catch (err) {
            console.error(err);
            setError(err.message || "No se pudo eliminar el registro.");
        } finally {
            setCtxMenu({ open: false, x: 0, y: 0, row: null });
        }
    }

    function onRowContextMenu(e, row) {
        e.preventDefault();
        e.stopPropagation();
        setCtxMenu({ open: true, x: e.clientX, y: e.clientY, row });
    }

    function resetFilters() {
        setFilters({ q: "", tipoPersona: "Todos", tiempoCompra: "Todos", rangoDesde: "", rangoHasta: "" });
    }

    function setHoy() {
        const hoy = toYMDLocal(new Date());
        setFilters((prev) => ({ ...prev, rangoDesde: hoy, rangoHasta: hoy }));
    }

    const filtered = useMemo(() => {
        const q = normalizeStr(filters.q).toLowerCase();
        const desdeInt = ymdToInt(filters.rangoDesde);
        const hastaInt = ymdToInt(filters.rangoHasta);

        return (registros || []).filter((item) => {
            const searchable = [
                item.agencia,
                item.nombre_prospecto,
                item.telefono,
                item.email,
                item.asesor_ventas,
                item.motivo_ingreso,
                item.tipo_persona,
                item.tiempo_compra,
                item.auto_suenos,
                item.forma_capitalizacion,
                item.perfil_profesional,
                item.estado_civil,
                item.comentarios,
            ]
                .map((v) => normalizeStr(v).toLowerCase())
                .join(" ");

            const matchQ = !q || searchable.includes(q);
            const matchTipo = filters.tipoPersona === "Todos" || item.tipo_persona === filters.tipoPersona;
            const matchTiempo = filters.tiempoCompra === "Todos" || item.tiempo_compra === filters.tiempoCompra;

            let matchRango = true;
            if (desdeInt !== null || hastaInt !== null) {
                const ymd = toYMDLocal(item.creado_en);
                const ymdInt = ymdToInt(ymd);
                if (!ymdInt) return false;
                if (desdeInt !== null && ymdInt < desdeInt) matchRango = false;
                if (hastaInt !== null && ymdInt > hastaInt) matchRango = false;
            }

            return matchQ && matchTipo && matchTiempo && matchRango;
        });
    }, [registros, filters]);

    const sorted = useMemo(() => {
        const data = [...filtered];
        const { key, dir } = sort || {};
        const mult = dir === "asc" ? 1 : -1;

        return data.sort((a, b) => {
            if (["creado_en"].includes(key)) {
                const ta = a[key] ? new Date(a[key]).getTime() : 0;
                const tb = b[key] ? new Date(b[key]).getTime() : 0;
                return (ta - tb) * mult;
            }

            if (["presupuesto_estimado", "enganche_presupuestado"].includes(key)) {
                return (Number(a[key] || 0) - Number(b[key] || 0)) * mult;
            }

            const va = normalizeStr(a?.[key]).toLowerCase();
            const vb = normalizeStr(b?.[key]).toLowerCase();
            if (va < vb) return -1 * mult;
            if (va > vb) return 1 * mult;
            return 0;
        });
    }, [filtered, sort]);

    const total = resumen?.total ?? registros.length;
    const interesadosAutoCuenta = registros.filter((x) => x.deja_auto_cuenta).length;
    const promedioPresupuesto = registros.length
        ? registros.reduce((acc, item) => acc + Number(item.presupuesto_estimado || 0), 0) / registros.length
        : 0;

    return (
        <div className="w-full">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="font-vw-header truncate text-lg font-extrabold text-[#131E5C]">Tráfico de piso</h2>
                    <p className="text-sm text-slate-400">Control de prospectos que ingresan físicamente a la agencia. Doble clic para editar.</p>
                </div>

                <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm text-white shadow-sm hover:bg-[#131E5C]/80"
                >
                    <Plus className="h-4 w-4" />
                    Nuevo ingreso
                </button>
            </div>

            {error ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {error}
                </div>
            ) : null}

            {ok ? (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                    {ok}
                </div>
            ) : null}

            <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="grid gap-3 md:grid-cols-12">
                    <div className="md:col-span-5">
                        <FilterBlock label="Búsqueda">
                            <div className="flex items-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2">
                                <Search className="h-4 w-4 text-[#131E5C]" />
                                <input
                                    value={filters.q}
                                    onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                                    placeholder="Buscar por prospecto, teléfono, asesor, ingreso…"
                                    className="w-full text-sm text-[#131E5C] outline-none placeholder:text-[#131E5C]/70"
                                />
                                {filters.q ? (
                                    <button
                                        type="button"
                                        onClick={() => setFilters((p) => ({ ...p, q: "" }))}
                                        className="rounded-lg bg-white p-1 text-[#131E5C] hover:bg-white/80 hover:text-red-500"
                                        aria-label="Limpiar búsqueda"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                ) : null}
                            </div>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-2">
                        <FilterBlock label="Tipo persona">
                            <select
                                value={filters.tipoPersona}
                                onChange={(e) => setFilters((p) => ({ ...p, tipoPersona: e.target.value }))}
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            >
                                <option value="Todos">Todos</option>
                                {TIPOS_PERSONA.map((x) => (
                                    <option key={x} value={x}>{x}</option>
                                ))}
                            </select>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-2">
                        <FilterBlock label="Tiempo compra">
                            <select
                                value={filters.tiempoCompra}
                                onChange={(e) => setFilters((p) => ({ ...p, tiempoCompra: e.target.value }))}
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            >
                                <option value="Todos">Todos</option>
                                {TIEMPOS_COMPRA.map((x) => (
                                    <option key={x} value={x}>{x}</option>
                                ))}
                            </select>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-3">
                        <FilterBlock label="Acciones">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={setHoy}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                                >
                                    <CalendarDays className="h-4 w-4" />
                                    Hoy
                                </button>
                                <button
                                    type="button"
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
                                onChange={(e) => setFilters((p) => ({ ...p, rangoDesde: e.target.value }))}
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            />
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-6">
                        <FilterBlock label="Hasta">
                            <input
                                type="date"
                                value={filters.rangoHasta}
                                onChange={(e) => setFilters((p) => ({ ...p, rangoHasta: e.target.value }))}
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            />
                        </FilterBlock>
                    </div>
                </div>
            </div>

            <div className="hidden overflow-hidden rounded-lg bg-white/[0.03] shadow-lg lg:block">
                <div className="overflow-auto">
                    <table className="min-w-[1200px] w-full text-left text-sm">
                        <thead className="font-vw-header border border-black bg-[#131E5C] text-xs text-white">
                            <tr>
                                <th className="px-4 py-3">
                                    <SortButton label="Fecha" sortKey="creado_en" sort={sort} onClick={toggleSort} />
                                </th>
                                <th className="px-4 py-3">
                                    <SortButton label="Dealer" sortKey="agencia" sort={sort} onClick={toggleSort} />
                                </th>
                                <th className="px-4 py-3">
                                    <SortButton label="Prospecto" sortKey="nombre_prospecto" sort={sort} onClick={toggleSort} />
                                </th>
                                <th className="px-4 py-3">Teléfono</th>
                                <th className="px-4 py-3">
                                    <SortButton label="Asesor" sortKey="asesor_ventas" sort={sort} onClick={toggleSort} />
                                </th>
                                <th className="px-4 py-3">Ingreso</th>
                                <th className="px-4 py-3">Compra</th>
                                <th className="px-4 py-3">
                                    <SortButton label="Presupuesto" sortKey="presupuesto_estimado" sort={sort} onClick={toggleSort} />
                                </th>
                                <th className="px-4 py-3">Auto cuenta</th>
                                <th className="px-4 py-3 text-right">Acciones</th>
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
                                    {sorted.map((item) => (
                                        <tr
                                            key={item.id_trafico}
                                            onDoubleClick={() => openEdit(item)}
                                            onContextMenu={(e) => onRowContextMenu(e, item)}
                                            className="cursor-pointer hover:bg-white/[0.04]"
                                            title="Doble clic para editar"
                                        >
                                            <td className="px-4 py-3 text-[#131E5C]">{dateTime(item.creado_en)}</td>
                                            <td className="px-4 py-3 text-[#131E5C]">
                                                <div className="max-w-[160px] truncate font-extrabold">
                                                    {item.agencia || "—"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-[#131E5C]">
                                                <div className="max-w-[240px] truncate font-extrabold">{item.nombre_prospecto || "—"}</div>
                                                {item.email ? <div className="mt-1 max-w-[240px] truncate text-xs text-slate-500">{item.email}</div> : null}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-[#131E5C]">{item.telefono || "—"}</td>
                                            <td className="px-4 py-3 text-[#131E5C]">
                                                <div className="max-w-[230px] truncate font-semibold">{item.asesor_ventas || "—"}</div>
                                            </td>
                                            <td className="px-4 py-3 text-[#131E5C]">
                                                <div className="max-w-[210px] font-semibold">{item.motivo_ingreso || "—"}</div>
                                                <div className="mt-1 text-xs font-bold text-slate-500">{item.tipo_persona || "—"}</div>
                                            </td>
                                            <td className="px-4 py-3 text-[#131E5C]">
                                                <div className="font-semibold">{item.tiempo_compra || "—"}</div>
                                                <div className="mt-1 max-w-[220px] truncate text-xs font-bold text-slate-500">
                                                    Auto: {item.auto_suenos || "—"}
                                                </div>
                                                <div className="mt-1 max-w-[220px] truncate text-xs font-bold text-slate-500">
                                                    {item.forma_capitalizacion || "—"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-[#131E5C]">
                                                <div className="font-extrabold">{money(item.presupuesto_estimado)}</div>
                                                <div className="mt-1 text-xs font-semibold text-slate-500">Eng. {money(item.enganche_presupuestado)}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={[
                                                        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold",
                                                        item.deja_auto_cuenta
                                                            ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                                                            : "border-red-300 bg-red-100 text-red-800",
                                                    ].join(" ")}
                                                >
                                                    {item.deja_auto_cuenta ? "Sí" : "No"}
                                                </span>
                                                {item.deja_auto_cuenta && item.modelo_auto_cuenta ? (
                                                    <div className="mt-1 max-w-[160px] truncate text-xs font-semibold text-slate-500">{item.modelo_auto_cuenta}</div>
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(item)}
                                                        className="rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-xs font-extrabold text-[#131E5C] hover:bg-[#131E5C] hover:text-white"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => eliminar(item)}
                                                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-extrabold text-red-600 hover:bg-red-100"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {sorted.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="px-4 py-10 text-center text-[#131E5C]">
                                                No hay registros de tráfico de piso con esos filtros.
                                            </td>
                                        </tr>
                                    ) : null}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid gap-3 lg:hidden">
                {loadingList ? (
                    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-2 font-bold text-[#131E5C]">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Cargando...
                        </div>
                    </div>
                ) : (
                    <>
                        {sorted.map((item) => (
                            <button
                                key={item.id_trafico}
                                type="button"
                                onClick={() => openEdit(item)}
                                className="rounded-3xl border border-black/10 bg-white p-4 text-left shadow-sm hover:bg-slate-50"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-extrabold text-[#131E5C]">{item.nombre_prospecto || "—"}</div>
                                        <div className="mt-1 text-xs text-slate-600">
                                            {item.agencia || "Sin dealer"} • {item.telefono || "—"} • {item.tipo_persona || "—"}
                                        </div>                                        <div className="mt-1 text-xs text-slate-600">{dateTime(item.creado_en)}</div>
                                        <div className="mt-1 text-xs text-slate-600">Asesor: {item.asesor_ventas || "—"}</div>
                                    </div>

                                    <span
                                        className={[
                                            "inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold",
                                            item.deja_auto_cuenta
                                                ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                                                : "border-red-300 bg-red-100 text-red-800",
                                        ].join(" ")}
                                    >
                                        Auto: {item.deja_auto_cuenta ? "Sí" : "No"}
                                    </span>
                                </div>

                                <div className="mt-3 text-sm text-slate-700 line-clamp-3">
                                    {item.motivo_ingreso || "—"} • {item.tiempo_compra || "—"} • {item.auto_suenos || "Sin auto"} • {money(item.presupuesto_estimado)}
                                </div>
                                <div className="mt-3 text-xs text-slate-500">Toca para editar</div>
                            </button>
                        ))}

                        {sorted.length === 0 ? (
                            <div className="rounded-3xl border border-black/10 bg-white p-10 text-center text-slate-600">
                                No hay registros de tráfico de piso con esos filtros.
                            </div>
                        ) : null}
                    </>
                )}
            </div>

            <ContextMenu
                ctxMenu={ctxMenu}
                onDelete={eliminar}
                onClose={() => setCtxMenu({ open: false, x: 0, y: 0, row: null })}
            />

            <Modal
                open={openModal}
                title={mode === "create" ? "Nuevo ingreso de tráfico de piso" : `Editar tráfico de piso • #${draft?.id_trafico || ""}`}
                onClose={closeModal}
                footer={
                    <>
                        <div className="min-w-0 text-xs font-bold text-slate-500">
                            {errores.length > 0 && touchedSave ? `Pendiente: ${errores[0]}` : "Los campos marcados con * son obligatorios."}
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={saving}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-red-400 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-red-600 hover:text-white disabled:opacity-60"
                            >
                                <X className="h-4 w-4" />
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={save}
                                disabled={saving || loadingDetail}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C]/85 px-4 py-2 text-sm font-bold text-white/90 hover:bg-[#131E5C] hover:text-white disabled:opacity-60"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {saving ? "Guardando..." : "Guardar cambios"}
                            </button>
                        </div>
                    </>
                }
            >
                {loadingDetail ? (
                    <ModalSkeleton />
                ) : !draft ? null : (
                    <div className="space-y-4">
                        <Section title="Datos generales" icon={User}>
                            <div className="grid gap-3 md:grid-cols-3">
                                <Field label="Dealer" icon={Building2} required invalid={isInvalid("agencia")}>
                                    <Select
                                        value={draft.agencia}
                                        invalid={isInvalid("agencia")}
                                        onChange={(e) => updateField("agencia", e.target.value)}
                                    >
                                        <option value="">Seleccionar dealer...</option>
                                        {DEALERS.map((dealer) => (
                                            <option key={dealer} value={dealer}>
                                                {dealer}
                                            </option>
                                        ))}
                                    </Select>
                                </Field>
                                <Field label="Nombre del prospecto" icon={User} required hint="Mayúsculas" invalid={isInvalid("nombre_prospecto")}>
                                    <Input
                                        value={draft.nombre_prospecto}
                                        invalid={isInvalid("nombre_prospecto")}
                                        onChange={(e) => updateField("nombre_prospecto", e.target.value.toUpperCase())}
                                        placeholder="NOMBRE COMPLETO"
                                    />
                                </Field>

                                <Field label="Código postal" icon={ClipboardList} required invalid={isInvalid("codigo_postal")}>
                                    <Input
                                        value={draft.codigo_postal}
                                        invalid={isInvalid("codigo_postal")}
                                        onChange={(e) => updateField("codigo_postal", soloNumeros(e.target.value).slice(0, 5))}
                                        inputMode="numeric"
                                        placeholder="68300"
                                    />
                                </Field>

                                <Field label="Teléfono" icon={Phone} required invalid={isInvalid("telefono")}>
                                    <Input
                                        value={draft.telefono}
                                        invalid={isInvalid("telefono")}
                                        onChange={(e) => updateField("telefono", soloNumeros(e.target.value).slice(0, 12))}
                                        inputMode="numeric"
                                        placeholder="10 dígitos"
                                    />
                                </Field>
                                <Field label="E-mail" icon={Mail} invalid={isInvalid("email")}>
                                    <Input
                                        type="email"
                                        value={draft.email}
                                        invalid={isInvalid("email")}
                                        onChange={(e) => updateField("email", e.target.value)}
                                        placeholder="correo@dominio.com"
                                    />
                                </Field>

                                <Field label="Asesor de ventas" icon={UserRoundSearch} required hint="Buscar" invalid={isInvalid("asesor_ventas")}>
                                    <AsesorAutocomplete
                                        value={draft.asesor_ventas}
                                        invalid={isInvalid("asesor_ventas")}
                                        onChange={(value) => updateField("asesor_ventas", value)}
                                    />
                                </Field>

                                <Field label="Ingresó a la agencia porque" icon={MessageSquareText} required invalid={isInvalid("motivo_ingreso")}>
                                    <Select
                                        value={draft.motivo_ingreso}
                                        invalid={isInvalid("motivo_ingreso")}
                                        onChange={(e) => updateField("motivo_ingreso", e.target.value)}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {MOTIVOS_INGRESO.map((x) => <option key={x} value={x}>{x}</option>)}
                                    </Select>
                                </Field>

                                <Field label="Tipo de persona" icon={Users} required>
                                    <div className="grid grid-cols-2 gap-2">
                                        {TIPOS_PERSONA.map((tipo) => (
                                            <button
                                                key={tipo}
                                                type="button"
                                                onClick={() => updateField("tipo_persona", tipo)}
                                                className={[
                                                    "rounded-lg border px-3 py-2 text-sm font-extrabold transition",
                                                    draft.tipo_persona === tipo
                                                        ? "border-[#131E5C] bg-[#131E5C] text-white"
                                                        : "border-black/10 bg-white text-[#131E5C] hover:bg-slate-50",
                                                ].join(" ")}
                                            >
                                                {tipo}
                                            </button>
                                        ))}
                                    </div>
                                </Field>
                            </div>
                        </Section>

                        <Section title="Intención de compra" icon={CarFront}>
                            <div className="grid gap-3 md:grid-cols-3">
                                <Field label="Programación de compra" icon={Clock} required invalid={isInvalid("tiempo_compra")}>
                                    <Select
                                        value={draft.tiempo_compra}
                                        invalid={isInvalid("tiempo_compra")}
                                        onChange={(e) => updateField("tiempo_compra", e.target.value)}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {TIEMPOS_COMPRA.map((x) => <option key={x} value={x}>{x}</option>)}
                                    </Select>
                                </Field>

                                <Field label="¿Deja auto a cuenta?" icon={CarFront} required>
                                    <BooleanSwitch value={!!draft.deja_auto_cuenta} onChange={(value) => updateField("deja_auto_cuenta", value)} />
                                </Field>

                                <Field label="Auto de sus sueños" icon={CarFront} required invalid={isInvalid("auto_suenos")}>
                                    <Select
                                        value={draft.auto_suenos}
                                        invalid={isInvalid("auto_suenos")}
                                        onChange={(e) => updateField("auto_suenos", e.target.value)}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {VEHICULOS.map((vehiculo) => (
                                            <option key={vehiculo} value={vehiculo}>
                                                {vehiculo}
                                            </option>
                                        ))}
                                    </Select>
                                </Field>

                                <Field label="Modelo de auto a cuenta" icon={CarFront} required={!!draft.deja_auto_cuenta} invalid={isInvalid("modelo_auto_cuenta")}>
                                    <Input
                                        value={draft.modelo_auto_cuenta}
                                        invalid={isInvalid("modelo_auto_cuenta")}
                                        disabled={!draft.deja_auto_cuenta}
                                        onChange={(e) => updateField("modelo_auto_cuenta", e.target.value)}
                                        placeholder="Ej. Jetta 2020"
                                    />
                                </Field>

                                <Field label="Forma de capitalización" icon={CircleDollarSign} required invalid={isInvalid("forma_capitalizacion")}>
                                    <Select
                                        value={draft.forma_capitalizacion}
                                        invalid={isInvalid("forma_capitalizacion")}
                                        onChange={(e) => updateField("forma_capitalizacion", e.target.value)}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {FORMAS_CAPITALIZACION.map((x) => <option key={x} value={x}>{x}</option>)}
                                    </Select>
                                </Field>

                                <Field label="Presupuesto estimado" icon={BadgeDollarSign} required hint="Mín. 6 dígitos" invalid={isInvalid("presupuesto_estimado")}>
                                    <Input
                                        value={draft.presupuesto_estimado}
                                        invalid={isInvalid("presupuesto_estimado")}
                                        onChange={(e) => updateField("presupuesto_estimado", soloNumeros(e.target.value))}
                                        inputMode="numeric"
                                        placeholder="300000"
                                    />
                                </Field>

                                <Field label="Enganche presupuestado" icon={BadgeDollarSign} required hint="Mín. 5 dígitos" invalid={isInvalid("enganche_presupuestado")}>
                                    <Input
                                        value={draft.enganche_presupuestado}
                                        invalid={isInvalid("enganche_presupuestado")}
                                        onChange={(e) => updateField("enganche_presupuestado", soloNumeros(e.target.value))}
                                        inputMode="numeric"
                                        placeholder="50000"
                                    />
                                </Field>

                                <Field label="Mensualidades presupuestadas" icon={CalendarDays} required invalid={isInvalid("mensualidades_presupuestadas")}>
                                    <Select
                                        value={draft.mensualidades_presupuestadas}
                                        invalid={isInvalid("mensualidades_presupuestadas")}
                                        onChange={(e) => updateField("mensualidades_presupuestadas", e.target.value)}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {MENSUALIDADES.map((x) => <option key={x} value={x}>{x}</option>)}
                                    </Select>
                                </Field>
                            </div>
                        </Section>

                        <Section title="Perfil financiero" icon={ShieldCheck}>
                            <div className="grid gap-3 md:grid-cols-3">
                                <Field label="Comprobación de ingresos" icon={ShieldCheck} required>
                                    <BooleanSwitch value={!!draft.comprueba_ingresos} onChange={(value) => updateField("comprueba_ingresos", value)} />
                                </Field>

                                <Field label="Forma de comprobar ingresos" icon={ClipboardList} required invalid={isInvalid("forma_comprobar_ingresos")}>
                                    <Select
                                        value={draft.forma_comprobar_ingresos}
                                        invalid={isInvalid("forma_comprobar_ingresos")}
                                        onChange={(e) => updateField("forma_comprobar_ingresos", e.target.value)}
                                    >
                                        {FORMAS_COMPROBAR_INGRESOS.map((x) => <option key={x} value={x}>{x}</option>)}
                                    </Select>
                                </Field>
                            </div>
                        </Section>

                        <Section title="Perfil del prospecto" icon={BriefcaseBusiness}>
                            <div className="grid gap-3 md:grid-cols-3">
                                <Field label="Motivo de compra" icon={MessageSquareText} required invalid={isInvalid("motivo_compra")}>
                                    <Select
                                        value={draft.motivo_compra}
                                        invalid={isInvalid("motivo_compra")}
                                        onChange={(e) => updateField("motivo_compra", e.target.value)}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {MOTIVOS_COMPRA.map((x) => <option key={x} value={x}>{x}</option>)}
                                    </Select>
                                </Field>

                                <Field label="Perfil profesional" icon={BriefcaseBusiness} required invalid={isInvalid("perfil_profesional")}>
                                    <Select
                                        value={draft.perfil_profesional}
                                        invalid={isInvalid("perfil_profesional")}
                                        onChange={(e) => updateField("perfil_profesional", e.target.value)}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {PERFILES_PROFESIONALES.map((x) => <option key={x} value={x}>{x}</option>)}
                                    </Select>
                                </Field>

                                <Field label="Estado civil" icon={Users} required invalid={isInvalid("estado_civil")}>
                                    <Select
                                        value={draft.estado_civil}
                                        invalid={isInvalid("estado_civil")}
                                        onChange={(e) => updateField("estado_civil", e.target.value)}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {ESTADOS_CIVILES.map((x) => <option key={x} value={x}>{x}</option>)}
                                    </Select>
                                </Field>

                                <Field label="Edad" icon={User}>
                                    <Input
                                        value={draft.edad}
                                        onChange={(e) => updateField("edad", soloNumeros(e.target.value).slice(0, 3))}
                                        inputMode="numeric"
                                        placeholder="35"
                                    />
                                </Field>

                                <Field label="Cantidad de hijos" icon={Users}>
                                    <Input
                                        value={draft.cantidad_hijos}
                                        onChange={(e) => updateField("cantidad_hijos", soloNumeros(e.target.value).slice(0, 2))}
                                        inputMode="numeric"
                                        placeholder="0"
                                    />
                                </Field>
                            </div>

                            <div className="mt-3">
                                <PasatiemposPicker
                                    value={draft.pasatiempos || []}
                                    invalid={isInvalid("pasatiempos")}
                                    onChange={(value) => updateField("pasatiempos", value)}
                                />
                            </div>

                            <div className="mt-3">
                                <Field label="Comentarios" icon={MessageSquareText}>
                                    <Textarea
                                        value={draft.comentarios}
                                        onChange={(e) => updateField("comentarios", e.target.value)}
                                        placeholder="Notas adicionales del asesor..."
                                    />
                                </Field>
                            </div>
                        </Section>
                    </div>
                )}
            </Modal>
        </div>
    );
}
