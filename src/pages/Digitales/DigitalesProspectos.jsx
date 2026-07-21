//volvo
// src/pages/Digitales/DigitalesProspectos.jsx
import { useMemo, useState, useEffect, useDeferredValue, useCallback } from "react";
import {
    Plus,
    Search,
    X,
    Save,
    User,
    Van,
    CarFront,
    CalendarDays,
    ArrowUpDown,
    ChevronDown,
    ChevronUp,
    ChevronLeft, ChevronRight,
    MessageSquareShare,
    Building2,
    FileText,
    FileDown,
    Car,
    Trash2,
    Loader2,
    CalendarPlus,
    CalendarCheck,
    Phone,
    LayoutList,
    UserStar,
    ClipboardCheck,
    BrainCircuit,
    CalendarRange,
    Table2,
    BarChart3,
    Clock3,
    CalendarClock,
    CheckCircle2,
    XCircle,
    MoreVertical,
    Gauge,
} from "lucide-react";
import CONCESIONARIO from "/concesionario.png";
import WAP from "/whatsapp.svg";
import FB from "/facebook.svg";
import PHONE from "/phone.svg";
import { api } from "../../lib/apiPruebas";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { apiCitas } from "../../lib/apiCitas";
import { useAuth } from "../../auth/AuthContext";
import * as XLSX from "xlsx";

const BRAND_BLACK = "#0A0A0A";
const PAGE_SIZE = 200;

const ImgIcon = (src, alt) => (props) => <img src={src} alt={alt} {...props} />;

const lineaMeta = {
    Nuevos: { Icon: Car, label: "Nuevos" },
    Usados: { Icon: CarFront, label: "Usados" },
    Comerciales: { Icon: Van, label: "Comerciales" },
};

const origenMeta = {
    "Volvo-Concesionario": { Icon: ImgIcon(CONCESIONARIO, "Volvo-Concesionario"), label: "Volvo-Concesionario" },
    WhatsApp: { Icon: ImgIcon(WAP, "WhatsApp"), label: "WhatsApp" },
    Facebook: { Icon: ImgIcon(FB, "Facebook"), label: "Facebook" },
    "Llamada Entrante": { Icon: ImgIcon(PHONE, "Llamada Entrante"), label: "Llamada Entrante" },
};

function normalizarCanalContacto(value) {
    const canal = String(value || "").trim();

    // Compatibilidad con registros anteriores guardados con el nombre en plural.
    if (canal === "Volvo-Concesionarios") return "Volvo-Concesionario";

    return canal;
}

const ASESORES_DIGITALES = ["Mariana Tlamani"];
const ESTADOS_PROSPECTO = [
    "Contactado",
    "Calificado",
    "Pendiente de Cotización",
    "Requiere Asesor",
    "Financiamiento",
    "Sin Respuesta",
    "Descalificado",
];

const MOTIVOS_DESCALIFICACION = [
    "Busca trabajo",
    "No contesto",
    "Poco presupuesto",
    "Descalificado por consultor",
    "Compro en otra marca",
    "Buscaba ofrecer productos y/o servicio",
    "Informacion de Postventa",
];

const BURO_OPTIONS = [
    { value: "", label: "— Selecciona —" },
    { value: "bueno", label: "Bueno" },
    { value: "regular", label: "Regular" },
    { value: "iniciando", label: "Iniciando" },
    { value: "desconocido", label: "Desconocido" },
];

const FORMA_PAGO_OPTIONS = [
    { value: "", label: "— Selecciona —" },
    { value: "contado", label: "Contado" },
    { value: "credito", label: "Crédito" },
    { value: "arrendamiento", label: "Arrendamiento" },
    { value: "desconocido", label: "Desconocido" },
];

const TIPO_CLIENTE_OPTIONS = [
    { value: "", label: "— Selecciona —" },
    { value: "persona_fisica", label: "Persona física" },
    { value: "persona_moral", label: "Persona moral" },
    { value: "desconocido", label: "Desconocido" },
];

const SOLICITUD_CREDITO_OPTIONS = [
    { value: "", label: "— Selecciona —" },
    { value: "autorizado", label: "Autorizado" },
    { value: "rechazado", label: "Rechazado" },
    { value: "condicionado", label: "Condicionado" },
];

const PLAZO_COMPRA_OPTIONS = [
    "",
    "Inmediato",
    "Esta semana",
    "Este mes",
    "1 a 3 meses",
    "3 a 6 meses",
    "Más de 6 meses",
    "Sin definir",
];

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

const INITIAL_FILTERS = {
    q: "",
    estado: "Todos",
    agencia: "Todos",
    linea: "Todos",
    fechaRegistroDesde: "",
    fechaRegistroHasta: "",
    fechaContactoDesde: "",
    fechaContactoHasta: "",
};

const ASESOR_DIGITAL_POR_NUMERO = {
    // Agrega aquí los números de WhatsApp de Volvo cuando quieras filtrar por asesor digital.
    // Ejemplo:
    // "52XXXXXXXXXX": {
    //     asesor_digital: "Mariana Tlamani",
    //     agencia: "Volvo",
    // },
};

function normalizaTelefonoMx(tel) {
    const digits = String(tel || "").replace(/\D/g, "");

    if (!digits) return "";

    if (digits.startsWith("521") && digits.length === 13) {
        return `52${digits.slice(3)}`;
    }

    if (digits.length === 10) {
        return `52${digits}`;
    }

    if (digits.length === 12 && digits.startsWith("52")) {
        return digits;
    }

    return digits;
}

function formatTelefonoMx(tel) {
    const digits = normalizaTelefonoMx(tel);

    if (!/^52\d{10}$/.test(digits)) return tel || "Sin número";

    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
}

function normalizeText(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function normalizarPautasOptions(responseOrItems) {
    const rawItems = Array.isArray(responseOrItems)
        ? responseOrItems
        : Array.isArray(responseOrItems?.items)
            ? responseOrItems.items
            : Array.isArray(responseOrItems?.results)
                ? responseOrItems.results
                : Array.isArray(responseOrItems?.data)
                    ? responseOrItems.data
                    : [];

    const opciones = [];
    const vistos = new Set();

    function addOption(value, label = value) {
        const valueLimpio = String(value || "").trim();
        const labelLimpio = String(label || value || "").trim();

        if (!valueLimpio) return;

        const key = normalizeText(valueLimpio);

        if (vistos.has(key)) return;

        vistos.add(key);

        opciones.push({
            value: valueLimpio,
            label: labelLimpio,
        });
    }

    for (const item of rawItems) {
        if (typeof item === "string") {
            addOption(item);
            continue;
        }

        const label =
            item?.value ||
            item?.label ||
            item?.pauta ||
            item?.pauta_origen ||
            item?.nombre ||
            item?.name ||
            item?.nombre_campana ||
            item?.campaign_name ||
            item?.campaign ||
            "";

        const sucursal = String(item?.sucursal || "").trim();
        const nombreCampana = String(item?.nombre_campana || "").trim();

        if (sucursal && nombreCampana) {
            addOption(`${sucursal} - ${nombreCampana}`);
            continue;
        }

        addOption(label);
    }
    return opciones.sort((a, b) =>
        a.label.localeCompare(b.label, "es", { sensitivity: "base" })
    );
}

function tryParseJson(text) {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function getNumeroUsuarioSesion(user) {
    const numeroDirecto = normalizaTelefonoMx(
        user?.telefono ||
        user?.numero_asesor ||
        user?.whatsapp_number ||
        user?.phone ||
        ""
    );

    if (numeroDirecto) return numeroDirecto;

    const candidateKeys = ["auth", "crm.user", "user"];

    for (const key of candidateKeys) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;

            const parsed = tryParseJson(raw);
            if (!parsed || typeof parsed !== "object") continue;

            const userObj =
                parsed?.user && typeof parsed.user === "object"
                    ? parsed.user
                    : parsed;

            const numero = normalizaTelefonoMx(
                userObj?.telefono ||
                userObj?.numero_asesor ||
                userObj?.whatsapp_number ||
                userObj?.phone ||
                ""
            );

            if (numero) return numero;
        } catch {
            // sin acción
        }
    }

    return "";
}

function getAsesorDigitalPorNumero(numero) {
    return ASESOR_DIGITAL_POR_NUMERO[normalizaTelefonoMx(numero)]?.asesor_digital || "";
}

function getDealerPorNumero(numero) {
    return ASESOR_DIGITAL_POR_NUMERO[normalizaTelefonoMx(numero)]?.agencia || "";
}

function getContextoDigitalPorNumero(numero) {
    return ASESOR_DIGITAL_POR_NUMERO[normalizaTelefonoMx(numero)] || null;
}

function Skeleton({ className = "" }) {
    return <div className={["animate-pulse rounded-md bg-black/10", className].join(" ")} />;
}

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            <td className="px-4 py-3">
                <div className="h-4 w-32 rounded bg-slate-200/60" />
            </td>
            <td className="px-4 py-3">
                <div className="h-4 w-40 rounded bg-slate-200/60" />
            </td>
            <td className="px-4 py-3">
                <div className="h-4 w-28 rounded bg-slate-200/60" />
            </td>
            <td className="px-4 py-3">
                <div className="h-6 w-28 rounded-full bg-slate-200/60" />
            </td>
            <td className="px-4 py-3">
                <div className="h-4 w-64 rounded bg-slate-200/60" />
            </td>
        </tr>
    );
}

function ModalSkeleton() {
    return (
        <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-neutral-200/50 p-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-3 h-10 w-full rounded-lg" />
                </div>
            ))}
            <div className="md:col-span-2 rounded-lg border border-white/10 bg-neutral-200/50 p-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-3 h-24 w-full rounded-lg" />
            </div>
        </div>
    );
}

function cls(...a) {
    return a.filter(Boolean).join(" ");
}

function BadgeEstado({ value }) {
    const map = {
        descalificado: "bg-blue-600/15 text-blue-800 font-bold border-blue-300/25",
        contactado: "bg-emerald-500/15 text-emerald-800 border-emerald-300/25",
        "sin respuesta": "bg-red-500/15 text-red-800 border-red-300/25",
        autorizado: "bg-emerald-300/15 text-emerald-800 border-emerald-300/25",
        "no autorizado": "bg-red-500/15 text-red-800 border-red-300/25",
        condicionado: "bg-yellow-500/15 text-yellow-800 border-yellow-300/25",
        "en proceso": "bg-neutral-400/15 text-blue-800 font-bold border-blue-300/25",
        ejercido: "bg-emerald-700/15 text-emerald-800 border-emerald-300/25",
        contado: "bg-yellow-500/15 text-yellow-800 border-yellow-300/25",
        vwfs: "bg-neutral-400/15 text-blue-800 font-bold border-blue-300/25",
        afasa: "bg-purple-400/15 text-blue-800 font-bold border-blue-300/25",
        "bancario externo": "bg-red-500/15 text-red-800 border-red-300/25",
    };

    const key = String(value || "").trim().toLowerCase();
    const cls = map[key] || "bg-black/10 text-white/85 border-white/20";

    return (
        <span className={["inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", cls].join(" ")}>
            {value || "Sin estado"}
        </span>
    );
}

function badgeCls(value) {
    const map = {
        descalificado: "bg-blue-600/15 text-blue-800 font-bold border-blue-300/25",
        contactado: "bg-emerald-500/15 text-emerald-800 border-emerald-300/25",
        "sin respuesta": "bg-red-500/15 text-red-800 border-red-300/25",
    };

    const key = String(value || "").trim().toLowerCase();
    return map[key] || "bg-black/10 text-white/85 border-white/20";
}

function LineaPicker({ value, onChange }) {
    const items = Object.entries(lineaMeta);

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map(([key, meta]) => {
                const active = value === key;
                const Icon = meta.Icon;

                return (
                    <button
                        key={key}
                        type="button"
                        onClick={() => onChange(key)}
                        className={[
                            "flex h-14 w-full items-center justify-center gap-2 rounded-xl border px-4 text-center transition",
                            active
                                ? "border-black/50 bg-white ring-2 ring-black/20"
                                : "border-black/10 bg-neutral-50 hover:bg-white",
                        ].join(" ")}
                    >
                        <span
                            className={[
                                "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                                active
                                    ? "border-black/40 bg-black/10"
                                    : "border-black/10 bg-white",
                            ].join(" ")}
                        >
                            <Icon className="h-4 w-4 text-black" />
                        </span>

                        <span className="truncate text-sm font-semibold text-black">
                            {meta.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
function OrigenPicker({ value, onChange }) {
    const items = Object.entries(origenMeta);

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {items.map(([key, meta]) => {
                const active = value === key;
                const Icon = meta.Icon;

                return (
                    <button
                        type="button"
                        key={key}
                        onClick={() => onChange(key)}
                        className={[
                            "flex h-14 w-full items-center gap-3 rounded-xl border px-4 text-left transition",
                            active
                                ? "border-black/50 bg-white ring-2 ring-black/20"
                                : "border-black/10 bg-neutral-50 hover:bg-white",
                        ].join(" ")}
                    >
                        <div
                            className={[
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                                active
                                    ? "border-black/40 bg-black/10"
                                    : "border-black/10 bg-white",
                            ].join(" ")}
                        >
                            <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-black">
                                {meta.label}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[60]">
            <div
                className="absolute inset-0 bg-black/45"
                onClick={onClose}
            />

            <div className="absolute inset-0 flex items-end justify-center p-2 sm:items-center sm:p-4">
                <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-black/20 bg-neutral-100 shadow-xl">
                    <div
                        className="flex shrink-0 items-center justify-between gap-3 px-5 py-4"
                        style={{ backgroundColor: BRAND_BLACK }}
                    >
                        <div className="min-w-0">
                            <div className="truncate text-base font-extrabold text-white">
                                {title}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15"
                            aria-label="Cerrar"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]">
                        {children}
                    </div>

                    {footer ? (
                        <div className="flex shrink-0 flex-col gap-2 border-t border-black/10 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
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
        <div className="h-full rounded-lg border border-white/10 bg-neutral-200/50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-black">
                {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                <span>{label}</span>
            </div>

            <div className="space-y-3">
                {children}
            </div>
        </div>
    );
}
function toDTLocal(isoOrNull) {
    if (!isoOrNull) return "";
    const s = String(isoOrNull);
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00`;
    if (s.includes("T")) return s.slice(0, 16);
    return "";
}

function onlyDate(isoOrNull) {
    if (!isoOrNull) return "";
    const s = String(isoOrNull);
    return s.includes("T") ? s.split("T")[0] : s.slice(0, 10);
}

function splitNombre(full) {
    const parts = String(full || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return { nombre: "", apellidos: "" };
    if (parts.length === 1) return { nombre: parts[0], apellidos: "" };
    return { nombre: parts.slice(0, 1).join(" "), apellidos: parts.slice(1).join(" ") };
}

function joinNombre(nombre, apellidos) {
    return `${String(nombre || "").trim()} ${String(apellidos || "").trim()}`.trim();
}

function tieneNombreCapturado(nombre, apellidos) {
    const full = joinNombre(nombre, apellidos);
    if (!full) return false;
    return normalizeText(full) !== "sin nombre";
}
function tieneNombreReal(full) {
    const texto = normalizeText(full);
    return !!texto && texto !== "sin nombre";
}

function getNombreCompletoDraft(draft) {
    if (!draft) return "";

    const nombreCompleto = String(draft.nombre_cliente || "").trim();
    if (nombreCompleto) return nombreCompleto;

    return joinNombre(draft.cliente_nombre, draft.cliente_apellidos);
}

function normalizeDateForFilter(value) {
    return onlyDate(value);
}

function isDateInRange(value, desde, hasta) {
    if (!desde && !hasta) return true;

    const dateValue = normalizeDateForFilter(value);
    if (!dateValue) return false;

    if (desde && dateValue < desde) return false;
    if (hasta && dateValue > hasta) return false;

    return true;
}

function getSortValue(row, key) {
    if (["fecha_reclamacion", "fecha_contacto"].includes(key)) {
        return onlyDate(row?.[key] || "");
    }

    if (["ultimo_contacto_at", "primer_contacto_at", "creado", "resumen_actualizado_at"].includes(key)) {
        return toDTLocal(row?.[key] || "");
    }

    return String(row?.[key] ?? "").toLowerCase();
}

function toNullableNumber(value) {
    if (value === null || value === undefined || value === "") return null;

    const numero = Number(String(value).replace(/[^\d]/g, ""));
    return Number.isFinite(numero) && numero > 0 ? Math.round(numero) : null;
}

function normalizeProspecto(p) {
    const { nombre, apellidos } = splitNombre(p.nombre);

    return {
        id_exp: p.id,
        cliente_id: p.cliente_id,
        agencia: p.agencia || "",
        cliente_nombre: nombre,
        cliente_apellidos: apellidos,
        telefono: String(p.telefono || ""),
        correo: p.correo || "",
        linea: p.business || "",
        origen: normalizarCanalContacto(p.canal_contacto),
        pauta: p.pauta || "",
        estado: p.estado || "",
        motivo_descalificacion: p.motivo_descalificacion || "",
        comentarios: p.comentarios || "",
        enganche_monto: p.enganche_monto ?? "",
        presupuesto_mensual: p.presupuesto_mensual ?? "",
        buro_estado: p.buro_estado || "",
        forma_pago: p.forma_pago || "",
        tipo_cliente: p.tipo_cliente || "",
        plazo_compra: p.plazo_compra || "",
        uso_vehiculo: p.uso_vehiculo || "",
        comprobacion_ingresos: p.comprobacion_ingresos || "",
        id_cotizacion: p.id_cotizacion || "",
        folio_solicitud_credito: p.folio_solicitud_credito || "",
        solicitud_credito_estado: p.solicitud_credito_estado || "",
        vin_facturado: p.vin_facturado || "",
        vin_estatus_entrega: p.vin_estatus_entrega || "",
        resumen: p.resumen || "",
        resumen_actualizado_at: toDTLocal(p.resumen_actualizado_at),
        resumen_fuente: p.resumen_fuente || "",
        cliente_interes: p.auto_interes || "",
        asesor_digital: p.asesor_digital || "",
        asesor_solicita: p.asesor_ventas || "",
        primer_contacto_at: toDTLocal(p.primer_contacto_at),
        ultimo_contacto_at: toDTLocal(p.ultimo_contacto_at),
        creado: toDTLocal(p.creado),
        fecha_atencion: onlyDate(p.primer_contacto_at) || onlyDate(p.creado),
        fecha_contacto: onlyDate(p.ultimo_contacto_at),
        fecha_reclamacion: onlyDate(p.creado),
    };
}

function ContextMenu({ ctxMenu, onDelete, onClose }) {
    if (!ctxMenu.open || !ctxMenu.row) return null;

    return createPortal(
        <div
            className="fixed z-[9999]"
            style={{ left: ctxMenu.x, top: ctxMenu.y }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="w-48 overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl">
                <button
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(ctxMenu.row)}
                >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                </button>

                <button
                    className="w-full px-4 py-2 text-left text-xs text-slate-500 hover:bg-slate-50"
                    onClick={onClose}
                >
                    Cerrar
                </button>
            </div>
        </div>,
        document.body
    );
}

function formatDateYMDLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function addDays(date, days) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
}

function getStartOfWeek(date) {
    const copy = new Date(date);
    const day = copy.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    copy.setDate(copy.getDate() + diff);
    return copy;
}

function getEndOfWeek(date) {
    const start = getStartOfWeek(date);
    start.setDate(start.getDate() + 6);
    return start;
}


// ─────────────────────────────────────────────────────────────────────────────
// Vista: Gráficos  (placeholder con estadísticas básicas)
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Vista: Gráficos (completa - por estado, dealer, business, asesor y días)
// ─────────────────────────────────────────────────────────────────────────────
function VistaGraficos({ rows }) {
    // Estadísticas por Estado
    const statsPorEstado = useMemo(() => {
        const map = {};
        for (const row of rows) {
            const key = row.estado || "Sin estado";
            map[key] = (map[key] || 0) + 1;
        }
        return Object.entries(map).sort(([, a], [, b]) => b - a);
    }, [rows]);

    // Estadísticas por Agencia/Dealer
    const statsPorAgencia = useMemo(() => {
        const map = {};
        for (const row of rows) {
            const key = row.agencia || "Sin dealer";
            map[key] = (map[key] || 0) + 1;
        }
        return Object.entries(map).sort(([, a], [, b]) => b - a);
    }, [rows]);

    // Estadísticas por Business/Linea
    const statsPorLinea = useMemo(() => {
        const map = {};
        for (const row of rows) {
            const key = row.linea || "Sin business";
            map[key] = (map[key] || 0) + 1;
        }
        return Object.entries(map).sort(([, a], [, b]) => b - a);
    }, [rows]);


    const statsPorAsesor = useMemo(() => {
        const map = {};
        for (const row of rows) {
            const key = row.asesor_digital || "Sin asesor";
            map[key] = (map[key] || 0) + 1;
        }
        return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 10); // Top 10 asesores
    }, [rows]);

    // Estadísticas por Día de la semana 
    const statsPorDia = useMemo(() => {
        const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        const map = {
            "Lunes": 0, "Martes": 0, "Miércoles": 0, "Jueves": 0, "Viernes": 0, "Sábado": 0, "Domingo": 0
        };

        for (const row of rows) {
            const fechaStr = row.fecha_reclamacion || row.fecha_contacto || row.fecha_registro;
            if (fechaStr) {
                const fecha = new Date(fechaStr);
                if (!isNaN(fecha.getTime())) {
                    const diaNombre = diasSemana[fecha.getDay()];
                    map[diaNombre] = (map[diaNombre] || 0) + 1;
                }
            }
        }
        return Object.entries(map).filter(([, count]) => count > 0).sort(([a], [b]) => {
            const order = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
            return order.indexOf(a) - order.indexOf(b);
        });
    }, [rows]);

    // Estadísticas por Hora del día 
    const statsPorHora = useMemo(() => {
        const map = {};
        for (let i = 0; i < 24; i++) {
            map[`${i.toString().padStart(2, "0")}:00`] = 0;
        }

        for (const row of rows) {
            const fechaStr = row.fecha_reclamacion || row.fecha_contacto || row.fecha_registro;
            if (fechaStr) {
                const fecha = new Date(fechaStr);
                if (!isNaN(fecha.getTime())) {
                    const hora = `${fecha.getHours().toString().padStart(2, "0")}:00`;
                    map[hora] = (map[hora] || 0) + 1;
                }
            }
        }
        return Object.entries(map).filter(([, count]) => count > 0);
    }, [rows]);

    // Totales
    const totalProspectos = rows.length;
    const maxEstado = statsPorEstado[0]?.[1] || 1;
    const maxAgencia = statsPorAgencia[0]?.[1] || 1;
    const maxLinea = statsPorLinea[0]?.[1] || 1;
    const maxAsesor = statsPorAsesor[0]?.[1] || 1;
    const maxDia = Math.max(...statsPorDia.map(([, c]) => c), 1);
    const maxHora = Math.max(...statsPorHora.map(([, c]) => c), 1);

    const colorBar = [
        "bg-black",
        "bg-neutral-600",
        "bg-emerald-500",
        "bg-amber-500",
        "bg-violet-500",
        "bg-rose-500",
        "bg-indigo-500",
        "bg-teal-500",
    ];

    function BarGroup({ title, data, max, icon: Icon, colorIndex = 0 }) {
        return (
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
                <div className="flex items-center gap-2 px-5 py-3" style={{ backgroundColor: BRAND_BLACK }}>
                    <Icon className="h-4 w-4 text-white/70" />
                    <span className="text-sm font-extrabold text-white">{title}</span>
                    <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">
                        {data.reduce((acc, [, n]) => acc + n, 0)} total
                    </span>
                </div>
                <div className="space-y-3 p-5 max-h-[300px] overflow-y-auto">
                    {data.map(([label, count], i) => (
                        <div key={label}>
                            <div className="mb-1 flex items-center justify-between text-xs font-semibold text-black">
                                <span className="truncate max-w-[150px]" title={label}>{label}</span>
                                <span className="ml-2 shrink-0">{count}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className={[colorBar[(colorIndex + i) % colorBar.length], "h-2 rounded-full transition-all duration-500"].join(" ")}
                                    style={{ width: `${Math.round((count / max) * 100)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                    {data.length === 0 && (
                        <p className="text-center text-sm text-slate-400">Sin datos</p>
                    )}
                </div>
            </div>
        );
    }

    function DonutCard({ title, data, icon: Icon, total }) {
        return (
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
                <div className="flex items-center gap-2 px-5 py-3" style={{ backgroundColor: BRAND_BLACK }}>
                    <Icon className="h-4 w-4 text-white/70" />
                    <span className="text-sm font-extrabold text-white">{title}</span>
                    <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">
                        {total || data.reduce((acc, [, n]) => acc + n, 0)}
                    </span>
                </div>
                <div className="p-5">
                    <div className="space-y-3">
                        {data.map(([label, count], i) => {
                            const percentage = total ? Math.round((count / total) * 100) : 0;
                            return (
                                <div key={label} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-3 w-3 rounded-full ${colorBar[i % colorBar.length]}`} />
                                        <span className="text-xs font-semibold text-black truncate max-w-[120px]" title={label}>
                                            {label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-black/60">{count}</span>
                                        <span className="text-[10px] text-black/40">{percentage}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {data.length === 0 && (
                        <p className="text-center text-sm text-slate-400">Sin datos</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {/* Fila 1: Estado, Dealer, Business */}
            <div className="grid gap-4 md:grid-cols-3">
                <BarGroup title="Por estado" data={statsPorEstado} max={maxEstado} icon={BarChart3} colorIndex={0} />
                <BarGroup title="Por dealer" data={statsPorAgencia} max={maxAgencia} icon={Building2} colorIndex={2} />
                <BarGroup title="Por business" data={statsPorLinea} max={maxLinea} icon={Car} colorIndex={4} />
            </div>

            {/* Fila 2: Por Asesor */}
            <div className="grid gap-4 md:grid-cols-2">
                <BarGroup title="Top 10 asesores" data={statsPorAsesor} max={maxAsesor} icon={UserStar} colorIndex={1} />
                <DonutCard title="Distribución por asesor" data={statsPorAsesor} icon={UserStar} total={totalProspectos} />
            </div>

            {/* Fila 3: Por Día de la semana y Por Hora */}
            <div className="grid gap-4 md:grid-cols-2">
                <BarGroup title="Por día de la semana" data={statsPorDia} max={maxDia} icon={CalendarDays} colorIndex={3} />
                <BarGroup title="Por hora del día" data={statsPorHora} max={maxHora} icon={Clock3} colorIndex={5} />
            </div>

            {/* Tarjeta de resumen */}
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
                <div className="flex items-center gap-2 px-5 py-3" style={{ backgroundColor: BRAND_BLACK }}>
                    <ClipboardCheck className="h-4 w-4 text-white/70" />
                    <span className="text-sm font-extrabold text-white">Resumen general</span>
                </div>
                <div className="grid grid-cols-2 gap-4 p-5 md:grid-cols-4">
                    <div className="text-center">
                        <div className="text-2xl font-black text-black">{totalProspectos}</div>
                        <div className="text-xs text-black/50">Total prospectos</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-black text-emerald-600">{statsPorEstado.find(([k]) => k === "CONTACTADO")?.[1] || 0}</div>
                        <div className="text-xs text-black/50">Contactados</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-black text-amber-600">{statsPorEstado.find(([k]) => k === "NUEVO")?.[1] || 0}</div>
                        <div className="text-xs text-black/50">Nuevos</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-black text-slate-500">{statsPorAsesor.length}</div>
                        <div className="text-xs text-black/50">Asesores activos</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Vista: Agenda — combina citas agendadas (apiCitas) + prospectos con
// seguimiento pendiente, en el layout tipo "Citas" (calendario + lista lateral)
// ─────────────────────────────────────────────────────────────────────────────
const MESES_LARGOS = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const DIAS_SEMANA_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function buildCalendarMatrix(year, month) {
    // month: 0-indexed
    const firstDay = new Date(year, month, 1);
    const startWeekday = (firstDay.getDay() + 6) % 7; // 0 = Lunes
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
}

function VistaAgenda({ rows, isAdmin, abrirAgendaCita, fmtDTIntl }) {
    const hoy = new Date();
    const [calRef, setCalRef] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState(formatDateYMDLocal(hoy));
    const [citas, setCitas] = useState([]);
    const [loadingCitas, setLoadingCitas] = useState(false);
    const [agendaPage, setAgendaPage] = useState(1);
    const AGENDA_PAGE_SIZE = 5;

    useEffect(() => {
        (async () => {
            setLoadingCitas(true);
            try {
                const data = await apiCitas.list?.();
                setCitas(Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : []);
            } catch (e) {
                console.error("No se pudieron cargar las citas para la Agenda:", e);
                setCitas([]);
            } finally {
                setLoadingCitas(false);
            }
        })();
    }, []);

    // Prospectos con seguimiento pendiente: estado "Sin Respuesta" o sin último contacto registrado
    const seguimientosPendientes = useMemo(() => {
        return rows.filter((r) => {
            const estado = normalizeText(r.estado);
            return estado === "sin respuesta" || (!r.ultimo_contacto_at && estado !== "descalificado");
        });
    }, [rows]);

    // Eventos combinados: citas agendadas + seguimientos pendientes, normalizados a una forma común
    const eventos = useMemo(() => {
        const fromCitas = (citas || []).map((c) => {
            const fechaIso = c.fecha_hora_cita || "";
            const dt = fechaIso ? new Date(fechaIso) : null;
            const dtValido = dt && !Number.isNaN(dt.getTime());

            // El backend regresa la cita con un objeto "cliente" anidado:
            // { id_cliente, nombre, telefono, correo, creado_en, actualizado_en }
            const clienteNombre = c?.cliente?.nombre || "Sin nombre";
            const clienteTelefono = c?.cliente?.telefono || "";

            // No hay campo "estatus" en la API; se deriva igual que en RegistroCitas.jsx
            let estatus = "Pendiente";
            if (c.asistencia === true) {
                estatus = "Asistió";
            } else if (c.asistencia === false && dtValido && dt < new Date()) {
                estatus = "No asistió";
            }

            return {
                tipo: "cita",
                id: `cita-${c.id ?? Math.random()}`,
                fecha: onlyDate(fechaIso),
                hora: dtValido
                    ? `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`
                    : "",
                cliente: clienteNombre,
                telefono: clienteTelefono,
                vehiculo: c.auto_interes || "—",
                asesor: c.asesor_piso || c.asesor_digital || "—",
                detalle: c.tipo_cita || "Cita",
                estatus,
                raw: c,
            };
        });

        const fromProspectos = seguimientosPendientes.map((p) => ({
            tipo: "seguimiento",
            id: `prospecto-${p.id_exp}`,
            fecha: p.fecha_contacto || p.fecha_reclamacion || "",
            hora: "",
            cliente: `${p.cliente_nombre || ""} ${p.cliente_apellidos || ""}`.trim() || "Sin nombre",
            telefono: p.telefono || "",
            vehiculo: p.cliente_interes || "—",
            asesor: p.asesor_solicita || p.asesor_digital || "—",
            detalle: "Seguimiento pendiente",
            estatus: p.estado || "Sin estado",
            raw: p,
        }));

        return [...fromCitas, ...fromProspectos];
    }, [citas, seguimientosPendientes]);

    const eventosPorFecha = useMemo(() => {
        const map = {};
        for (const ev of eventos) {
            const key = ev.fecha || "sin-fecha";
            if (!map[key]) map[key] = [];
            map[key].push(ev);
        }
        return map;
    }, [eventos]);

    const eventosDelDia = useMemo(() => {
        const lista = eventosPorFecha[selectedDate] || [];
        return [...lista].sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));
    }, [eventosPorFecha, selectedDate]);

    useEffect(() => {
        setAgendaPage(1);
    }, [selectedDate]);

    const totalAgendaPages = Math.max(1, Math.ceil(eventosDelDia.length / AGENDA_PAGE_SIZE));
    const eventosPaginados = useMemo(() => {
        const start = (agendaPage - 1) * AGENDA_PAGE_SIZE;
        return eventosDelDia.slice(start, start + AGENDA_PAGE_SIZE);
    }, [eventosDelDia, agendaPage]);

    // Stats del día seleccionado
    const statsDia = useMemo(() => {
        const citasDelDia = eventosDelDia.filter((e) => e.tipo === "cita");
        const pendientes = eventosDelDia.filter((e) => normalizeText(e.estatus) === "pendiente").length;
        const asistieron = citasDelDia.filter((e) => normalizeText(e.estatus) === "asistio" || normalizeText(e.estatus) === "asistió").length;
        const noAsistieron = citasDelDia.filter((e) => normalizeText(e.estatus) === "no asistio" || normalizeText(e.estatus) === "no asistió").length;
        const base = asistieron + noAsistieron;
        const tasa = base > 0 ? Math.round((asistieron / base) * 100) : 0;

        return {
            citasHoy: citasDelDia.length,
            pendientes,
            asistieron,
            noAsistieron,
            tasa,
            base,
            seguimientos: eventosDelDia.filter((e) => e.tipo === "seguimiento").length,
        };
    }, [eventosDelDia]);

    const weeks = useMemo(() => buildCalendarMatrix(calRef.getFullYear(), calRef.getMonth()), [calRef]);

    const goPrevMonth = () => setCalRef((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    const goNextMonth = () => setCalRef((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

    const tituloFechaSeleccionada = useMemo(() => {
        const [y, m, d] = selectedDate.split("-").map(Number);
        if (!y) return "";
        const dt = new Date(y, m - 1, d);
        const diaSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][dt.getDay()];
        const diaSemanaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
        return `${diaSemanaCap}, ${d} de ${MESES_LARGOS[m - 1]} de ${y}`;
    }, [selectedDate]);

    function estatusBadgeCls(estatus) {
        const key = normalizeText(estatus);
        if (key === "asistio" || key === "asistió") return "bg-emerald-50 text-emerald-700 border-emerald-200";
        if (key === "no asistio" || key === "no asistió") return "bg-red-50 text-red-600 border-red-200";
        if (key === "pendiente") return "bg-amber-50 text-amber-700 border-amber-200";
        return "bg-neutral-100 text-neutral-600 border-neutral-200";
    }

    function iniciales(nombre) {
        const partes = String(nombre || "").trim().split(/\s+/).filter(Boolean);
        if (!partes.length) return "—";
        if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
        return (partes[0][0] + partes[1][0]).toUpperCase();
    }

    return (
        <div className="grid gap-4">
            {/* Stat cards del día seleccionado */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                            <CalendarDays className="h-5 w-5 text-black" />
                        </span>
                        <div>
                            <div className="text-xs font-semibold text-neutral-500">Eventos del día</div>
                            <div className="text-xl font-extrabold text-black">{eventosDelDia.length}</div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                            <Clock3 className="h-5 w-5 text-amber-600" />
                        </span>
                        <div>
                            <div className="text-xs font-semibold text-neutral-500">Pendientes</div>
                            <div className="text-xl font-extrabold text-black">{statsDia.pendientes}</div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </span>
                        <div>
                            <div className="text-xs font-semibold text-neutral-500">Asistieron</div>
                            <div className="text-xl font-extrabold text-black">{statsDia.asistieron}</div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                            <XCircle className="h-5 w-5 text-red-500" />
                        </span>
                        <div>
                            <div className="text-xs font-semibold text-neutral-500">No asistieron</div>
                            <div className="text-xl font-extrabold text-black">{statsDia.noAsistieron}</div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                            <Gauge className="h-5 w-5 text-black" />
                        </span>
                        <div>
                            <div className="text-xs font-semibold text-neutral-500">Tasa de asistencia</div>
                            <div className="text-xl font-extrabold text-black">
                                {statsDia.tasa}%
                                <span className="ml-1 text-xs font-semibold text-neutral-400">
                                    {statsDia.asistieron} de {statsDia.base}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
                {/* Calendario */}
                <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={goPrevMonth}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 active:scale-90"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <div className="text-sm font-bold text-black">
                            {MESES_LARGOS[calRef.getMonth()].charAt(0).toUpperCase() + MESES_LARGOS[calRef.getMonth()].slice(1)} {calRef.getFullYear()}
                        </div>
                        <button
                            type="button"
                            onClick={goNextMonth}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 active:scale-90"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-neutral-400">
                        {DIAS_SEMANA_CORTOS.map((d) => (
                            <div key={d} className="py-1">{d}</div>
                        ))}
                    </div>

                    <div className="mt-1 grid grid-cols-7 gap-1">
                        {weeks.flat().map((day, idx) => {
                            if (!day) return <div key={idx} className="h-9" />;

                            const dateStr = formatDateYMDLocal(new Date(calRef.getFullYear(), calRef.getMonth(), day));
                            const isSelected = dateStr === selectedDate;
                            const isToday = dateStr === formatDateYMDLocal(hoy);
                            const count = eventosPorFecha[dateStr]?.length || 0;

                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setSelectedDate(dateStr)}
                                    className={[
                                        "relative h-9 rounded-lg text-sm font-semibold transition active:scale-90",
                                        isSelected
                                            ? "bg-black text-white shadow-md"
                                            : isToday
                                                ? "border border-black/30 text-black hover:bg-neutral-100"
                                                : "text-neutral-700 hover:bg-neutral-100",
                                    ].join(" ")}
                                >
                                    {day}
                                    {count > 0 && !isSelected ? (
                                        <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-black" />
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Lista de eventos del día seleccionado */}
                <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 border-b border-black/10 px-5 py-4">
                        <span className="text-sm font-bold text-black">{tituloFechaSeleccionada || "Selecciona un día"}</span>
                        <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-600">
                            {eventosDelDia.length} {eventosDelDia.length === 1 ? "evento" : "eventos"}
                        </span>
                        {statsDia.seguimientos > 0 ? (
                            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                                {statsDia.seguimientos} seguimiento{statsDia.seguimientos === 1 ? "" : "s"}
                            </span>
                        ) : null}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-black/10 text-xs font-semibold text-neutral-400">
                                <tr>
                                    <th className="px-5 py-3">Hora</th>
                                    <th className="px-5 py-3">Cliente</th>
                                    <th className="px-5 py-3">Interés / Vehículo</th>
                                    <th className="px-5 py-3">Asesor</th>
                                    <th className="px-5 py-3">Tipo</th>
                                    <th className="px-5 py-3">Estatus</th>
                                    <th className="px-5 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {loadingCitas ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-5 py-3"><div className="h-4 w-12 rounded bg-neutral-200" /></td>
                                            <td className="px-5 py-3"><div className="h-4 w-32 rounded bg-neutral-200" /></td>
                                            <td className="px-5 py-3"><div className="h-4 w-20 rounded bg-neutral-200" /></td>
                                            <td className="px-5 py-3"><div className="h-4 w-24 rounded bg-neutral-200" /></td>
                                            <td className="px-5 py-3"><div className="h-4 w-20 rounded bg-neutral-200" /></td>
                                            <td className="px-5 py-3"><div className="h-6 w-20 rounded-full bg-neutral-200" /></td>
                                            <td className="px-5 py-3" />
                                        </tr>
                                    ))
                                ) : eventosPaginados.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-10 text-center text-sm text-neutral-400">
                                            No hay citas ni seguimientos pendientes para este día.
                                        </td>
                                    </tr>
                                ) : (
                                    eventosPaginados.map((ev) => (
                                        <tr key={ev.id} className="transition hover:bg-neutral-50">
                                            <td className="px-5 py-3 font-semibold text-black">{ev.hora || "—"}</td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-bold text-neutral-600">
                                                        {iniciales(ev.cliente)}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-semibold text-black">{ev.cliente}</div>
                                                        <div className="truncate text-xs text-neutral-400">{formatTelefonoMx(ev.telefono)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-neutral-600">{ev.vehiculo || "—"}</td>
                                            <td className="px-5 py-3 text-neutral-600">{ev.asesor || "—"}</td>
                                            <td className="px-5 py-3">
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500">
                                                    {ev.tipo === "cita" ? <CalendarClock className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                                                    {ev.detalle}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={["inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", estatusBadgeCls(ev.estatus)].join(" ")}>
                                                    {ev.estatus}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                {ev.tipo === "seguimiento" ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => abrirAgendaCita(ev.raw)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-white text-black transition hover:bg-black hover:text-white active:scale-90"
                                                        title="Agendar cita para este prospecto"
                                                    >
                                                        <CalendarPlus className="h-4 w-4" />
                                                    </button>
                                                ) : null}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {eventosDelDia.length > 0 ? (
                        <div className="flex flex-col gap-2 border-t border-black/10 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-xs font-semibold text-neutral-400">
                                Mostrando {Math.min((agendaPage - 1) * AGENDA_PAGE_SIZE + 1, eventosDelDia.length)}–{Math.min(agendaPage * AGENDA_PAGE_SIZE, eventosDelDia.length)} de {eventosDelDia.length}
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    disabled={agendaPage === 1}
                                    onClick={() => setAgendaPage((p) => Math.max(1, p - 1))}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-neutral-500 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                {Array.from({ length: totalAgendaPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setAgendaPage(i + 1)}
                                        className={[
                                            "inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition active:scale-90",
                                            agendaPage === i + 1 ? "bg-black text-white" : "text-neutral-500 hover:bg-neutral-100",
                                        ].join(" ")}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    disabled={agendaPage === totalAgendaPages}
                                    onClick={() => setAgendaPage((p) => Math.min(totalAgendaPages, p + 1))}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-neutral-500 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

export default function DigitalesProspectos() {
    const navigate = useNavigate();
    const { user, ready } = useAuth();
    const [cases, setCases] = useState([]);

    //Estado de la vista activa 
    const [viewMode, setViewMode] = useState("tabla");

    const VIEW_MODES = [
        { key: "tabla", label: "Tabla", Icon: Table2 },
        { key: "graficos", label: "Gráficos", Icon: BarChart3 },
        { key: "agenda", label: "Agenda", Icon: CalendarRange },
    ];

    const isAdmin = useMemo(() => {
        const permisos = user?.permisos || [];
        const rol = String(user?.rol || "").trim().toLowerCase();

        return (
            rol === "administrador" ||
            permisos.includes("ALL") ||
            permisos.includes("USUARIOS_ADMIN")
        );
    }, [user]);

    const userAgencias = useMemo(() => {
        return String(user?.agencia || "")
            .split("|")
            .map((a) => a.trim())
            .filter(Boolean);
    }, [user?.agencia]);

    const userTieneAgencia = useCallback(
        (agenciaRegistro) => {
            const agencia = String(agenciaRegistro || "").trim();
            if (!agencia) return false;
            return userAgencias.some(
                (a) => a.toLowerCase() === agencia.toLowerCase()
            );
        },
        [userAgencias]
    );

    const numeroUsuarioSesion = useMemo(() => getNumeroUsuarioSesion(user), [user]);

    const contextoDigitalSesion = useMemo(() => {
        return getContextoDigitalPorNumero(numeroUsuarioSesion);
    }, [numeroUsuarioSesion]);

    const DEALERS = [
        "Volvo",
    ];

    const ASESORES = [
        "Enrique Vazquez Islas",
        "Ricardo Platas",
        "Verónica Del Rayo Galindo León",
        "Julio Camacho Barragán",
        "Fernanda Romero Aguilar",
        "Zaira Vanessa Hernández Gómez",
    ];

    const [ctxMenu, setCtxMenu] = useState({ open: false, x: 0, y: 0, row: null });

    const [pautasMeta, setPautasMeta] = useState([]);
    const [loadingPautas, setLoadingPautas] = useState(false);

    const [updatingEstado, setUpdatingEstado] = useState({});
    const [generatingSummary, setGeneratingSummary] = useState({});
    const [openSummaryModal, setOpenSummaryModal] = useState(false);
    const [summaryInfo, setSummaryInfo] = useState(null);

    useEffect(() => {
        const cerrarContextMenu = () => {
            setCtxMenu((prev) => {
                if (!prev.open) return prev;

                return {
                    open: false,
                    x: 0,
                    y: 0,
                    row: null,
                };
            });
        };

        window.addEventListener("click", cerrarContextMenu);
        window.addEventListener("scroll", cerrarContextMenu, true);
        window.addEventListener("resize", cerrarContextMenu);

        return () => {
            window.removeEventListener("click", cerrarContextMenu);
            window.removeEventListener("scroll", cerrarContextMenu, true);
            window.removeEventListener("resize", cerrarContextMenu);
        };
    }, []);

    const onRowContextMenu = (e, row) => {
        e.preventDefault();
        e.stopPropagation();
        setCtxMenu({ open: true, x: e.clientX, y: e.clientY, row });
    };

    const eliminarCaso = async (row) => {
        if (!row?.id_exp) return;

        const ok = confirm(`¿Eliminar el prospecto ${row.id_exp}? Esta acción no se puede deshacer.`);
        if (!ok) return;

        try {
            await api.digitalesDeleteProspecto(row.id_exp);
            setCases((prev) => prev.filter((c) => c.id_exp !== row.id_exp));
            setCtxMenu({ open: false, x: 0, y: 0, row: null });
        } catch (e) {
            console.error(e);
            alert("No se pudo eliminar (revisa consola / backend).");
        }
    };

    const [sort, setSort] = useState({ key: null, dir: "asc" });
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [selectedNumeroAsesor, setSelectedNumeroAsesor] = useState("Todos");
    const deferredQ = useDeferredValue(filters.q);
    const [page, setPage] = useState(1);

    const filtroNumeroActivo = useMemo(() => {
        if (isAdmin) {
            if (selectedNumeroAsesor === "Todos") return null;

            const numeroNormalizado = normalizaTelefonoMx(selectedNumeroAsesor);
            return ASESOR_DIGITAL_POR_NUMERO[numeroNormalizado] || null;
        }

        const numeroNormalizado = normalizaTelefonoMx(numeroUsuarioSesion);
        return ASESOR_DIGITAL_POR_NUMERO[numeroNormalizado] || null;
    }, [isAdmin, selectedNumeroAsesor, numeroUsuarioSesion]);

    function toggleSort(key) {
        setSort((prev) => {
            if (prev.key !== key) return { key, dir: "asc" };
            return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
        });
    }

    const updateFilter = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState("create");
    const [draft, setDraft] = useState(null);

    const [loadingCases, setLoadingCases] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);

    const pautasOptions = useMemo(() => {
        const rawItems = Array.isArray(pautasMeta)
            ? pautasMeta
            : Array.isArray(pautasMeta?.items)
                ? pautasMeta.items
                : Array.isArray(pautasMeta?.results)
                    ? pautasMeta.results
                    : Array.isArray(pautasMeta?.data)
                        ? pautasMeta.data
                        : [];

        const vistos = new Set();
        const opciones = [];

        for (const item of rawItems) {
            const value = String(
                item?.value ||
                item?.label ||
                item?.pauta ||
                item?.nombre_campana ||
                item?.nombre ||
                item?.name ||
                ""
            ).trim();

            const label = String(item?.label || value).trim();

            if (!value) continue;

            const key = normalizeText(value);

            if (vistos.has(key)) continue;

            vistos.add(key);

            opciones.push({
                value,
                label,
                id_campana: item?.id_campana || "",
                sucursal: item?.sucursal || "",
                nombre_campana: item?.nombre_campana || "",
            });
        }

        return opciones.sort((a, b) =>
            a.label.localeCompare(b.label, "es", { sensitivity: "base" })
        );
    }, [pautasMeta]);

    const REQUIRED = useMemo(
        () => ({
            telefono: "Teléfono",
            motivo_descalificacion: "Motivo de descalificación",
        }),
        []
    );

    const [touchedSave, setTouchedSave] = useState(false);

    const missing = useMemo(() => {
        if (!draft) return [];
        const m = [];

        const telefono = draft.telefono;
        if (telefono === null || telefono === undefined || String(telefono).trim() === "") {
            m.push("telefono");
        }

        if (
            normalizeText(draft.estado) === "descalificado" &&
            !String(draft.motivo_descalificacion || "").trim()
        ) {
            m.push("motivo_descalificacion");
        }

        return m;
    }, [draft, REQUIRED]);

    const isInvalid = (key) => touchedSave && missing.includes(key);

    const telDigits = useMemo(() => String(draft?.telefono || "").replace(/\D/g, ""), [draft?.telefono]);
    const telIsOk = useMemo(() => /^(?:\d{10}|52\d{10})$/.test(telDigits), [telDigits]);
    const telIsNormalized = useMemo(() => /^52\d{10}$/.test(telDigits), [telDigits]);

    const telError = useMemo(() => {
        if (!openModal) return "";
        if (!draft) return "";
        if (!telDigits) return "";
        if (/^\d{10}$/.test(telDigits)) return "";
        if (/^52\d{10}$/.test(telDigits)) return "";
        if (telDigits.length < 10) return "Número incompleto (mínimo 10 dígitos)";
        if (telDigits.length === 11) return "Número incorrecto (11 dígitos no válido)";
        if (telDigits.length === 12 && !telDigits.startsWith("52")) return "Número inválido: si tiene 12 dígitos debe iniciar con 52";
        if (telDigits.length > 12) return "Número incorrecto (máximo 12 dígitos)";
        return "Número inválido";
    }, [openModal, draft, telDigits]);

    const telInvalid = !!telError;

    const inputBase = "w-full rounded-lg border px-3 py-2.5 text-sm text-black font-semibold outline-none transition";
    const inputOk = "border-black/10 bg-neutral-100";
    const inputBad = "border-red-500 bg-red-50";

    const filterLabelCls = "mb-1.5 block text-xs font-bold text-black";
    const filterControlCls =
        "h-9 w-full rounded-lg border border-black/15 placeholder:text-neutral-400 bg-white px-3 text-sm text-black shadow-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10";

    useEffect(() => {
        (async () => {
            setLoadingCases(true);
            try {
                const data = await api.digitalesListProspectos();
                setCases((Array.isArray(data) ? data : []).map(normalizeProspecto));
            } catch (e) {
                console.error(e);
                setCases([]);
            } finally {
                setLoadingCases(false);
            }
        })();
    }, []);

    const cargarPautasMeta = useCallback(async () => {
        setLoadingPautas(true);

        try {
            const res = await api.digitalesCampanasMeta(180);

            const items = Array.isArray(res)
                ? res
                : Array.isArray(res?.items)
                    ? res.items
                    : Array.isArray(res?.results)
                        ? res.results
                        : [];

            setPautasMeta(items);
        } catch (e) {
            console.error("Error cargando campañas de campanas_meta_volvo:", e);
            setPautasMeta([]);
        } finally {
            setLoadingPautas(false);
        }
    }, []);

    useEffect(() => {
        if (!openModal) return;
        if (pautasMeta.length) return;

        cargarPautasMeta();
    }, [openModal, pautasMeta.length, cargarPautasMeta]);

    useEffect(() => {
        if (!ready) return;

        if (!isAdmin) {
            setSelectedNumeroAsesor(numeroUsuarioSesion || "");
            return;
        }

        setSelectedNumeroAsesor((prev) => prev || "Todos");
    }, [isAdmin, numeroUsuarioSesion, ready]);

    const dealers = useMemo(() => {
        const d = new Set(cases.map((c) => c.agencia).filter(Boolean));
        if (!isAdmin && userAgencias.length > 0) {
            return ["Todos", ...userAgencias];
        }
        return ["Todos", ...Array.from(d)];
    }, [cases, isAdmin, userAgencias]);

    const estados = useMemo(() => {
        const s = new Set(cases.map((c) => c.estado).filter(Boolean));
        return ["Todos", ...Array.from(s)];
    }, [cases]);

    const businessOptions = useMemo(() => {
        const set = new Set(cases.map((c) => String(c.linea || "").trim()).filter(Boolean));
        const orderedKnown = Object.keys(lineaMeta).filter((item) => set.has(item));
        const extras = Array.from(set)
            .filter((item) => !orderedKnown.includes(item))
            .sort((a, b) => a.localeCompare(b, "es"));

        return ["Todos", ...orderedKnown, ...extras];
    }, [cases]);

    const phoneOptions = useMemo(() => {
        const numeros = Object.keys(ASESOR_DIGITAL_POR_NUMERO).sort((a, b) => a.localeCompare(b, "es"));
        return ["Todos", ...numeros];
    }, []);

    const filtered = useMemo(() => {
        const q = deferredQ.trim().toLowerCase();

        return cases.filter((c) => {
            const nombre = `${c.cliente_nombre || ""} ${c.cliente_apellidos || ""}`.trim();

            if (!isAdmin && userAgencias.length > 0 && !userTieneAgencia(c.agencia)) return false;

            if (filtroNumeroActivo) {
                const matchAsesorDigital =
                    normalizeText(c.asesor_digital) ===
                    normalizeText(filtroNumeroActivo.asesor_digital);

                const matchAgencia =
                    normalizeText(c.agencia) ===
                    normalizeText(filtroNumeroActivo.agencia);

                if (!matchAsesorDigital || !matchAgencia) {
                    return false;
                }
            } else if (!isAdmin && userAgencias.length > 0 && !userTieneAgencia(c.agencia)) {
                return false;
            }

            const matchQ =
                !q ||
                String(c.id_exp || "").toLowerCase().includes(q) ||
                String(c.cliente_id || "").toLowerCase().includes(q) ||
                String(c.agencia || "").toLowerCase().includes(q) ||
                String(nombre || "").toLowerCase().includes(q) ||
                String(c.comentarios || "").toLowerCase().includes(q) ||
                String(c.estado || "").toLowerCase().includes(q) ||
                String(c.telefono || "").toLowerCase().includes(q) ||
                String(c.correo || "").toLowerCase().includes(q) ||
                String(c.asesor_digital || "").toLowerCase().includes(q) ||
                String(c.asesor_solicita || "").toLowerCase().includes(q) ||
                String(c.linea || "").toLowerCase().includes(q) ||
                String(c.origen || "").toLowerCase().includes(q) ||
                String(c.cliente_interes || "").toLowerCase().includes(q) ||
                String(c.pauta || "").toLowerCase().includes(q) ||
                String(c.motivo_descalificacion || "").toLowerCase().includes(q) ||
                String(c.enganche_monto || "").toLowerCase().includes(q) ||
                String(c.presupuesto_mensual || "").toLowerCase().includes(q) ||
                String(c.buro_estado || "").toLowerCase().includes(q) ||
                String(c.forma_pago || "").toLowerCase().includes(q) ||
                String(c.tipo_cliente || "").toLowerCase().includes(q) ||
                String(c.plazo_compra || "").toLowerCase().includes(q) ||
                String(c.uso_vehiculo || "").toLowerCase().includes(q) ||
                String(c.comprobacion_ingresos || "").toLowerCase().includes(q) ||
                String(c.id_cotizacion || "").toLowerCase().includes(q) ||
                String(c.folio_solicitud_credito || "").toLowerCase().includes(q) ||
                String(c.vin_facturado || "").toLowerCase().includes(q);

            const matchEstado =
                filters.estado === "Todos" || c.estado === filters.estado;

            const matchAgencia =
                filters.agencia === "Todos" || c.agencia === filters.agencia;

            const matchLinea =
                filters.linea === "Todos" || c.linea === filters.linea;

            const matchFechaRegistro = isDateInRange(
                c.fecha_reclamacion,
                filters.fechaRegistroDesde,
                filters.fechaRegistroHasta
            );

            const matchFechaContacto = isDateInRange(
                c.fecha_contacto || c.ultimo_contacto_at,
                filters.fechaContactoDesde,
                filters.fechaContactoHasta
            );

            return (
                matchQ &&
                matchEstado &&
                matchAgencia &&
                matchLinea &&
                matchFechaRegistro &&
                matchFechaContacto
            );
        });
    }, [cases, deferredQ, filters, isAdmin, filtroNumeroActivo]);

    const sorted = useMemo(() => {
        const data = [...filtered];
        if (!sort.key) return data;

        const dir = sort.dir === "asc" ? 1 : -1;

        return data.sort((a, b) => {
            const va = getSortValue(a, sort.key);
            const vb = getSortValue(b, sort.key);

            if (va < vb) return -1 * dir;
            if (va > vb) return 1 * dir;
            return 0;
        });
    }, [filtered, sort]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

    useEffect(() => {
        setPage(1);
    }, [filters, sort]);

    useEffect(() => {
        setPage((prev) => Math.min(prev, totalPages));
    }, [totalPages]);

    const paginatedRows = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        return sorted.slice(start, end);
    }, [sorted, page]);

    const pageStart = sorted.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const pageEnd = sorted.length === 0 ? 0 : Math.min(page * PAGE_SIZE, sorted.length);

    const openCreate = () => {
        setTouchedSave(false);
        setMode("create");

        const now = new Date();
        const nowLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(
            2,
            "0"
        )}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

        const agenciaPorSesion = contextoDigitalSesion?.agencia || "Volvo";

        const asesorDigitalPorSesion = contextoDigitalSesion?.asesor_digital || "Mariana Tlamani";

        setDraft({
            id_exp: null,
            agencia: agenciaPorSesion,
            tiene_nombre: false,
            cliente_nombre: "",
            cliente_apellidos: "",
            telefono: "",
            correo: "",
            linea: "",
            origen: "",
            pauta: "",
            estado: "Contactado",
            motivo_descalificacion: "",
            cliente_interes: "",
            comentarios: "",
            enganche_monto: "",
            presupuesto_mensual: "",
            buro_estado: "",
            forma_pago: "",
            tipo_cliente: "",
            plazo_compra: "",
            uso_vehiculo: "",
            comprobacion_ingresos: "",
            id_cotizacion: "",
            folio_solicitud_credito: "",
            solicitud_credito_estado: "",
            vin_facturado: "",
            vin_estatus_entrega: "",
            asesor_digital: asesorDigitalPorSesion,
            asesor_solicita: "",
            creado: nowLocal,
            primer_contacto_at: "",
            ultimo_contacto_at: "",
        });

        setOpenModal(true);
    };

    const [openAgendaModal, setOpenAgendaModal] = useState(false);
    const [agendaInfo, setAgendaInfo] = useState(null);

    const closeAgendaModal = () => {
        setOpenAgendaModal(false);
        setAgendaInfo(null);
    };

    const closeSummaryModal = () => {
        setOpenSummaryModal(false);
        setSummaryInfo(null);
    };

    const openSummaryViewer = (row) => {
        if (!row) return;

        setSummaryInfo({
            id_exp: row.id_exp,
            nombre: `${row.cliente_nombre || ""} ${row.cliente_apellidos || ""}`.trim(),
            resumen: row.resumen || "",
            resumen_actualizado_at: row.resumen_actualizado_at || "",
            resumen_fuente: row.resumen_fuente || "",
        });

        setOpenSummaryModal(true);
    };

    const abrirAgendaCita = (row) => {
        if (!row) return;

        const nombre = `${row.cliente_nombre || ""} ${row.cliente_apellidos || ""}`.trim();

        setAgendaInfo({
            id_exp: row.id_exp,
            cliente_id: row.cliente_id,
            nombre,
            telefono: row.telefono || "",
            correo: row.correo || "",
            auto_interes: row.cliente_interes || "",
            agencia: row.agencia || "",
            fuente_prospeccion: row.origen || "",
            fecha_cita: "",
            asesor_digital: row.asesor_digital,
            asesor_solicita: row.asesor_solicita,
            tipo_cita: "",
        });

        setOpenAgendaModal(true);
    };

    const openEdit = async (row) => {
        try {
            setTouchedSave(false);
            setMode("edit");
            setLoadingDetail(true);
            setOpenModal(true);

            const p = await api.digitalesGetProspecto(row.id_exp);
            const nombreCompleto = String(p.nombre || "").trim();
            const tieneNombre = tieneNombreReal(nombreCompleto);

            setDraft({
                id_exp: p.id,
                agencia: p.agencia || "",
                tiene_nombre: tieneNombre,
                nombre_cliente: tieneNombre ? nombreCompleto : "",
                telefono: String(p.telefono || ""),
                correo: p.correo || "",
                linea: p.business || "",
                origen: normalizarCanalContacto(p.canal_contacto),
                pauta: p.pauta || "",
                estado: p.estado || "",
                motivo_descalificacion: p.motivo_descalificacion || "",
                cliente_interes: p.auto_interes || "",
                comentarios: p.comentarios || "",
                enganche_monto: p.enganche_monto ?? "",
                presupuesto_mensual: p.presupuesto_mensual ?? "",
                buro_estado: p.buro_estado || "",
                forma_pago: p.forma_pago || "",
                tipo_cliente: p.tipo_cliente || "",
                plazo_compra: p.plazo_compra || "",
                uso_vehiculo: p.uso_vehiculo || "",
                comprobacion_ingresos: p.comprobacion_ingresos || "",
                id_cotizacion: p.id_cotizacion || "",
                folio_solicitud_credito: p.folio_solicitud_credito || "",
                solicitud_credito_estado: p.solicitud_credito_estado || "",
                vin_facturado: p.vin_facturado || "",
                vin_estatus_entrega: p.vin_estatus_entrega || "",
                resumen: p.resumen || "",
                resumen_actualizado_at: toDTLocal(p.resumen_actualizado_at),
                resumen_fuente: p.resumen_fuente || "",
                asesor_digital: p.asesor_digital || "",
                asesor_solicita: p.asesor_ventas || "",
                creado: toDTLocal(p.creado),
                primer_contacto_at: toDTLocal(p.primer_contacto_at),
                ultimo_contacto_at: toDTLocal(p.ultimo_contacto_at),
            });
        } catch (e) {
            console.error(e);
            alert("No se pudo abrir el prospecto para editar (revisa consola).");
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

    const refreshList = async () => {
        const data = await api.digitalesListProspectos();
        setCases((Array.isArray(data) ? data : []).map(normalizeProspecto));
    };

    const dtFmt = new Intl.DateTimeFormat("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    function fmtDTIntl(value) {
        if (!value) return "—";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "—";
        return dtFmt.format(d);
    }
    function limpiarValorExcel(value) {
        if (value === null || value === undefined || value === "") return "—";

        const texto = String(value).trim();

        if (/^[=+\-@]/.test(texto)) {
            return `'${texto}`;
        }

        return texto;
    }

    function generarNombreArchivoExcel() {
        const ahora = new Date();

        const fecha = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(
            ahora.getDate()
        ).padStart(2, "0")}`;

        const hora = `${String(ahora.getHours()).padStart(2, "0")}-${String(ahora.getMinutes()).padStart(2, "0")}`;

        return `reporte_prospectos_volvo_${fecha}_${hora}.xlsx`;
    }

    function exportarExcelProspectos() {
        if (!sorted.length) {
            alert("No hay registros para exportar con los filtros actuales.");
            return;
        }

        const registros = sorted.map((row) => ({
            ID: limpiarValorExcel(row.id_exp),
            Dealer: limpiarValorExcel(row.agencia),
            Cliente: limpiarValorExcel(`${row.cliente_nombre || ""} ${row.cliente_apellidos || ""}`.trim()),
            Teléfono: limpiarValorExcel(formatTelefonoMx(row.telefono)),
            Correo: limpiarValorExcel(row.correo),
            Business: limpiarValorExcel(row.linea),
            "Canal de Contacto": limpiarValorExcel(row.origen),
            "Pauta de Origen": limpiarValorExcel(row.pauta),
            Estado: limpiarValorExcel(row.estado),
            "Motivo de descalificación": limpiarValorExcel(row.motivo_descalificacion),
            Enganche: limpiarValorExcel(row.enganche_monto),
            "Presupuesto mensual": limpiarValorExcel(row.presupuesto_mensual),
            Buró: limpiarValorExcel(row.buro_estado),
            "Forma de pago": limpiarValorExcel(row.forma_pago),
            "Tipo de cliente": limpiarValorExcel(row.tipo_cliente),
            "Plazo de compra": limpiarValorExcel(row.plazo_compra),
            "Uso del vehículo": limpiarValorExcel(row.uso_vehiculo),
            "Comprobación de ingresos": limpiarValorExcel(row.comprobacion_ingresos),
            "ID cotización": limpiarValorExcel(row.id_cotizacion),
            "Folio solicitud crédito": limpiarValorExcel(row.folio_solicitud_credito),
            "Estado solicitud crédito": limpiarValorExcel(row.solicitud_credito_estado),
            "VIN facturado": limpiarValorExcel(row.vin_facturado),
            "Estatus de entrega": limpiarValorExcel(row.vin_estatus_entrega),
            "Asesor Digital": limpiarValorExcel(row.asesor_digital),
            "Asignado a": limpiarValorExcel(row.asesor_solicita),
            "Volvo de sus sueños": limpiarValorExcel(row.cliente_interes),
            "Fecha de Registro": limpiarValorExcel(row.fecha_reclamacion),
            "Primer Contacto": limpiarValorExcel(fmtDTIntl(row.primer_contacto_at)),
            "Último Contacto": limpiarValorExcel(fmtDTIntl(row.ultimo_contacto_at)),
            Comentarios: limpiarValorExcel(row.comentarios),
            "Resumen IA": limpiarValorExcel(row.resumen),
            "Resumen Actualizado": limpiarValorExcel(fmtDTIntl(row.resumen_actualizado_at)),
            "Fuente Resumen": limpiarValorExcel(row.resumen_fuente),
        }));

        const filtrosAplicados = [
            { Filtro: "Búsqueda", Valor: filters.q || "Todos" },
            { Filtro: "Dealer", Valor: filters.agencia || "Todos" },
            { Filtro: "Business", Valor: filters.linea || "Todos" },
            { Filtro: "Estado", Valor: filters.estado || "Todos" },
            { Filtro: "Registro desde", Valor: filters.fechaRegistroDesde || "Sin filtro" },
            { Filtro: "Registro hasta", Valor: filters.fechaRegistroHasta || "Sin filtro" },
            { Filtro: "Contacto desde", Valor: filters.fechaContactoDesde || "Sin filtro" },
            { Filtro: "Contacto hasta", Valor: filters.fechaContactoHasta || "Sin filtro" },
            {
                Filtro: "Número asesor",
                Valor:
                    selectedNumeroAsesor === "Todos"
                        ? "Todos"
                        : `${formatTelefonoMx(selectedNumeroAsesor)} • ${getAsesorDigitalPorNumero(selectedNumeroAsesor)}`,
            },
            { Filtro: "Total exportado", Valor: sorted.length },
        ];

        const worksheetRegistros = XLSX.utils.json_to_sheet(registros);
        const worksheetFiltros = XLSX.utils.json_to_sheet(filtrosAplicados);

        worksheetRegistros["!cols"] = [
            { wch: 10 }, { wch: 22 }, { wch: 32 }, { wch: 18 }, { wch: 28 },
            { wch: 16 }, { wch: 22 }, { wch: 35 }, { wch: 18 }, { wch: 28 },
            { wch: 28 }, { wch: 20 }, { wch: 18 }, { wch: 22 }, { wch: 22 },
            { wch: 45 }, { wch: 60 }, { wch: 22 }, { wch: 18 },
        ];

        worksheetFiltros["!cols"] = [{ wch: 24 }, { wch: 50 }];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheetRegistros, "Prospectos");
        XLSX.utils.book_append_sheet(workbook, worksheetFiltros, "Filtros aplicados");
        XLSX.writeFile(workbook, generarNombreArchivoExcel(), { compression: true });
    }

    const save = async () => {
        if (!draft || saving) return;
        if (!telIsOk) return;

        setTouchedSave(true);
        if (missing.length) return;
        if (telInvalid) return;

        setSaving(true);

        try {
            const agenciaFinal =
                !isAdmin && contextoDigitalSesion?.agencia
                    ? contextoDigitalSesion.agencia
                    : (draft.agencia || "");

            const asesorDigitalFinal =
                !isAdmin && contextoDigitalSesion?.asesor_digital
                    ? contextoDigitalSesion.asesor_digital
                    : (draft.asesor_digital || "");

            const nombreCapturado = getNombreCompletoDraft(draft);

            const nombreFinal =
                draft.tiene_nombre && nombreCapturado
                    ? nombreCapturado
                    : "SIN NOMBRE";

            const payload = {
                nombre: nombreFinal,
                telefono: draft.telefono,
                correo: draft.correo,
                agencia: agenciaFinal,
                business: draft.linea,
                canal_contacto: draft.origen,
                pauta: draft.pauta,
                estado: draft.estado,
                motivo_descalificacion:
                    normalizeText(draft.estado) === "descalificado"
                        ? String(draft.motivo_descalificacion || "").trim()
                        : "",
                asesor_digital: asesorDigitalFinal,
                asesor_ventas: draft.asesor_solicita || "",
                auto_interes: draft.cliente_interes || "",
                comentarios: draft.comentarios || "",
                enganche_monto: toNullableNumber(draft.enganche_monto),
                presupuesto_mensual: toNullableNumber(draft.presupuesto_mensual),
                buro_estado: draft.buro_estado || "",
                forma_pago: draft.forma_pago || "",
                tipo_cliente: draft.tipo_cliente || "",
                plazo_compra: draft.plazo_compra || "",
                uso_vehiculo: draft.uso_vehiculo || "",
                comprobacion_ingresos: draft.comprobacion_ingresos || "",
                id_cotizacion: String(draft.id_cotizacion || "").trim(),
                folio_solicitud_credito: String(draft.folio_solicitud_credito || "").trim(),
                solicitud_credito_estado: draft.solicitud_credito_estado || "",
                vin_facturado: String(draft.vin_facturado || "").trim().toUpperCase(),
                vin_estatus_entrega: draft.vin_estatus_entrega || "",
            };

            if (mode === "create") {
                payload.primer_contacto_at = draft.primer_contacto_at || null;
                payload.ultimo_contacto_at = draft.ultimo_contacto_at || null;
                await api.digitalesCreateProspecto(payload);
            } else {
                await api.digitalesUpdateProspecto(draft.id_exp, payload);
            }

            await refreshList();
            closeModal();
        } catch (e) {
            console.error(e);
            alert("Error guardando el prospecto (revisa consola).");
        } finally {
            setSaving(false);
        }
    };

    const [drafter, setDrafter] = useState({
        agencia: "",
        fecha_cita: "",
        asesor_digital: "",
        asesor_solicita: "",
        tipo_cita: "",
    });

    const [savingo, setSavingo] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (openAgendaModal && agendaInfo) {
            setDrafter({
                agencia: agendaInfo.agencia || "",
                fecha_cita: agendaInfo.fecha_cita || "",
                asesor_digital: agendaInfo.asesor_digital || "",
                asesor_solicita: agendaInfo.asesor_solicita || "",
                tipo_cita: agendaInfo.tipo_cita || "",
            });
            setErrorMsg("");
        }
    }, [openAgendaModal, agendaInfo]);

    async function handleAgendar() {
        if (!agendaInfo) return;

        try {
            setSavingo(true);
            setErrorMsg("");

            const payload = {
                cliente_id: agendaInfo.cliente_id,
                nombre: agendaInfo.nombre,
                telefono: agendaInfo.telefono,
                correo: agendaInfo.correo || "",
                auto_interes: agendaInfo.auto_interes || "",
                agencia: agendaInfo.agencia || "",
                fecha_hora_cita: drafter.fecha_cita || null,
                fuente_prospeccion: agendaInfo.fuente_prospeccion || "",
                asesor_digital: drafter.asesor_digital || "",
                asesor_solicita: drafter.asesor_solicita || "",
                asesor_asignado: drafter.asesor_solicita || "",
                tipo_cita: drafter.tipo_cita || "",
            };

            await apiCitas.create(payload);
            await refreshList();
            closeAgendaModal();
        } catch (err) {
            setErrorMsg(err?.message || "No se pudo crear la cita");
        } finally {
            setSavingo(false);
        }
    }

    const updateEstadoInline = async (row, newEstado) => {
        const id = row?.id_exp;
        if (!id) return;

        // La descalificación necesita un motivo obligatorio, por eso se abre el modal
        // en lugar de guardar un registro incompleto desde el selector de la tabla.
        if (normalizeText(newEstado) === "descalificado") {
            await openEdit(row);
            setDraft((prev) => prev ? { ...prev, estado: newEstado } : prev);
            return;
        }

        const prevEstado = row.estado;

        setCases((prev) => prev.map((c) => (c.id_exp === id ? { ...c, estado: newEstado } : c)));
        setUpdatingEstado((p) => ({ ...p, [id]: true }));

        try {
            await api.digitalesPatchProspecto(id, { estado: newEstado });
        } catch (e) {
            console.error(e);
            setCases((prev) => prev.map((c) => (c.id_exp === id ? { ...c, estado: prevEstado } : c)));
            alert("No se pudo actualizar el estado (revisa backend / consola).");
        } finally {
            setUpdatingEstado((p) => {
                const next = { ...p };
                delete next[id];
                return next;
            });
        }
    };

    const generarResumenInline = async (row) => {
        const id = row?.id_exp;
        if (!id) return;

        setGeneratingSummary((prev) => ({ ...prev, [id]: true }));

        try {
            const res = await api.digitalesGenerarResumen(id);

            const resumenNuevo = res?.resumen || "";
            const resumenActualizadoAt = toDTLocal(res?.resumen_actualizado_at);
            const resumenFuente = res?.resumen_fuente || "manual";

            setCases((prev) =>
                prev.map((c) =>
                    c.id_exp === id
                        ? {
                            ...c,
                            resumen: resumenNuevo,
                            resumen_actualizado_at: resumenActualizadoAt,
                            resumen_fuente: resumenFuente,
                        }
                        : c
                )
            );

            if (draft?.id_exp === id) {
                setDraft((prev) => ({
                    ...prev,
                    resumen: resumenNuevo,
                    resumen_actualizado_at: resumenActualizadoAt,
                    resumen_fuente: resumenFuente,
                }));
            }

            setSummaryInfo({
                id_exp: row.id_exp,
                nombre: `${row.cliente_nombre || ""} ${row.cliente_apellidos || ""}`.trim(),
                resumen: resumenNuevo,
                resumen_actualizado_at: resumenActualizadoAt,
                resumen_fuente: resumenFuente,
            });

            setOpenSummaryModal(true);
        } catch (e) {
            console.error(e);
            alert("No se pudo generar el resumen.");
        } finally {
            setGeneratingSummary((prev) => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }
    };

    const resetFilters = () => {
        setFilters(INITIAL_FILTERS);
        setSelectedNumeroAsesor(isAdmin ? "Todos" : numeroUsuarioSesion || "");
    };

    const applyQuickRegistroRange = (desde, hasta) => {
        setFilters((prev) => ({
            ...prev,
            fechaRegistroDesde: desde,
            fechaRegistroHasta: hasta,
        }));
    };

    const now = new Date();
    const todayStr = formatDateYMDLocal(now);
    const yesterdayStr = formatDateYMDLocal(addDays(now, -1));
    const weekStartStr = formatDateYMDLocal(getStartOfWeek(now));
    const weekEndStr = formatDateYMDLocal(getEndOfWeek(now));
    const last7DaysStartStr = formatDateYMDLocal(addDays(now, -6));
    const last7DaysEndStr = todayStr;

    const isQuickActive = (desde, hasta) =>
        filters.fechaRegistroDesde === desde && filters.fechaRegistroHasta === hasta;

    return (
        <div className="w-full">
            {/* ── Encabezado tipo Citas: título + descripción + botón principal ── */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h1 className="truncate text-2xl font-extrabold text-black">Prospectos</h1>
                    <p className="mt-0.5 text-sm text-neutral-500">Doble clic para editar la información del prospecto.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Tabla / Gráficos / Agenda — los 3 selectores de vista, juntos */}
                    <div className="flex items-center rounded-lg border border-black/15 bg-white p-1 shadow-sm">
                        {VIEW_MODES.map(({ key, label, Icon }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setViewMode(key)}
                                className={[
                                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition active:scale-[0.95]",
                                    viewMode === key
                                        ? "bg-black text-white shadow"
                                        : "text-black hover:bg-neutral-100",
                                ].join(" ")}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={exportarExcelProspectos}
                        disabled={loadingCases || sorted.length === 0}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-black shadow-sm transition hover:bg-neutral-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <FileDown className="h-4 w-4" />
                        Exportar Excel
                    </button>

                    <button
                        onClick={openCreate}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 active:scale-[0.97]"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Prospecto
                    </button>
                </div>
            </div>

            {/* ── Filtros: card blanca, borde sutil, mismos campos de siempre ── */}
            <div className="mb-4 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                <div className="grid gap-4 xl:grid-cols-12">
                    <div className="xl:col-span-4">
                        <label className={filterLabelCls}>Búsqueda</label>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                            <input
                                value={filters.q}
                                onChange={(e) => updateFilter("q", e.target.value)}
                                placeholder="Buscar por dealer, cliente, teléfono, business, asesor, correo..."
                                className={`${filterControlCls} pl-10 pr-10`}
                            />
                            {filters.q ? (
                                <button
                                    onClick={() => updateFilter("q", "")}
                                    className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-red-500"
                                    aria-label="Limpiar búsqueda"
                                    type="button"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            ) : null}
                        </div>
                    </div>

                    <div className="xl:col-span-2">
                        <label className={filterLabelCls}>Dealer</label>
                        <select
                            value={filters.agencia}
                            onChange={(e) => updateFilter("agencia", e.target.value)}
                            className={filterControlCls}
                        >
                            {dealers.map((d) => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    <div className="xl:col-span-2">
                        <label className={filterLabelCls}>Business</label>
                        <select
                            value={filters.linea}
                            onChange={(e) => updateFilter("linea", e.target.value)}
                            className={filterControlCls}
                        >
                            {businessOptions.map((linea) => (
                                <option key={linea} value={linea}>{linea}</option>
                            ))}
                        </select>
                    </div>

                    <div className="xl:col-span-2">
                        <label className={filterLabelCls}>Estado</label>
                        <select
                            value={filters.estado}
                            onChange={(e) => updateFilter("estado", e.target.value)}
                            className={filterControlCls}
                        >
                            {estados.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div className="xl:col-span-2">
                        <label className={filterLabelCls}>Registro desde</label>
                        <input
                            type="date"
                            value={filters.fechaRegistroDesde}
                            onChange={(e) => updateFilter("fechaRegistroDesde", e.target.value)}
                            className={filterControlCls}
                        />
                    </div>

                    <div className="xl:col-span-3">
                        <label className={filterLabelCls}>Registro hasta</label>
                        <input
                            type="date"
                            value={filters.fechaRegistroHasta}
                            onChange={(e) => updateFilter("fechaRegistroHasta", e.target.value)}
                            className={filterControlCls}
                        />
                    </div>

                    <div className="xl:col-span-3">
                        <label className={filterLabelCls}>Contacto desde</label>
                        <input
                            type="date"
                            value={filters.fechaContactoDesde}
                            onChange={(e) => updateFilter("fechaContactoDesde", e.target.value)}
                            className={filterControlCls}
                        />
                    </div>

                    <div className="xl:col-span-3">
                        <label className={filterLabelCls}>Contacto hasta</label>
                        <input
                            type="date"
                            value={filters.fechaContactoHasta}
                            onChange={(e) => updateFilter("fechaContactoHasta", e.target.value)}
                            className={filterControlCls}
                        />
                    </div>

                    <div className="xl:col-span-3 flex items-end">
                        {isAdmin ? (
                            <select
                                value={selectedNumeroAsesor}
                                onChange={(e) => setSelectedNumeroAsesor(e.target.value)}
                                className={filterControlCls}
                                title="Filtrar por número de asesor"
                            >
                                {phoneOptions.map((numero) => (
                                    <option key={numero} value={numero}>
                                        {numero === "Todos"
                                            ? "Todos los números"
                                            : `${formatTelefonoMx(numero)} • ${getAsesorDigitalPorNumero(numero)}`}
                                    </option>
                                ))}
                            </select>
                        ) : null}
                    </div>
                </div>

                {/* ── Fila inferior: contador + accesos rápidos + Tabla/Gráficos (mismo lugar) ── */}
                <div className="mt-4 flex flex-col gap-3 border-t border-black/10 pt-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="text-sm font-semibold text-neutral-500">
                            {viewMode !== "agenda" ? (
                                <>Mostrando {pageStart}-{pageEnd} de {sorted.length} prospectos</>
                            ) : (
                                <>Vista de agenda</>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => applyQuickRegistroRange(todayStr, todayStr)}
                                className={[
                                    "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold shadow-sm transition active:scale-[0.95]",
                                    isQuickActive(todayStr, todayStr)
                                        ? "bg-black text-white"
                                        : "border border-black/15 bg-white text-black hover:bg-neutral-50",
                                ].join(" ")}
                            >
                                <CalendarDays className="h-3.5 w-3.5" />
                                Hoy
                            </button>

                            <button
                                type="button"
                                onClick={() => applyQuickRegistroRange(yesterdayStr, yesterdayStr)}
                                className={[
                                    "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold shadow-sm transition active:scale-[0.95]",
                                    isQuickActive(yesterdayStr, yesterdayStr)
                                        ? "bg-black text-white"
                                        : "border border-black/15 bg-white text-black hover:bg-neutral-50",
                                ].join(" ")}
                            >
                                <CalendarDays className="h-3.5 w-3.5" />
                                Ayer
                            </button>

                            <button
                                type="button"
                                onClick={() => applyQuickRegistroRange(weekStartStr, weekEndStr)}
                                className={[
                                    "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold shadow-sm transition active:scale-[0.95]",
                                    isQuickActive(weekStartStr, weekEndStr)
                                        ? "bg-black text-white"
                                        : "border border-black/15 bg-white text-black hover:bg-neutral-50",
                                ].join(" ")}
                            >
                                <CalendarDays className="h-3.5 w-3.5" />
                                Esta semana
                            </button>

                            <button
                                type="button"
                                onClick={() => applyQuickRegistroRange(last7DaysStartStr, last7DaysEndStr)}
                                className={[
                                    "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold shadow-sm transition active:scale-[0.95]",
                                    isQuickActive(last7DaysStartStr, last7DaysEndStr)
                                        ? "bg-black text-white"
                                        : "border border-black/15 bg-white text-black hover:bg-neutral-50",
                                ].join(" ")}
                            >
                                <CalendarDays className="h-3.5 w-3.5" />
                                Últimos 7 días
                            </button>

                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-black/15 bg-white px-3.5 text-sm font-semibold text-black shadow-sm transition hover:bg-neutral-50 active:scale-[0.95]"
                            >
                                <X className="h-3.5 w-3.5" />
                                Limpiar
                            </button>
                        </div>
                    </div>

                    {!loadingCases && sorted.length > 0 && viewMode === "tabla" ? (
                        <div className="flex flex-col gap-3 border-t border-black/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-xs font-semibold text-neutral-400">
                                Página {page} de {totalPages} • {PAGE_SIZE} registros por página
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage(1)}
                                    disabled={page === 1}
                                    className="rounded-lg border border-black/15 px-3 py-2 text-sm font-semibold text-black transition hover:bg-neutral-50 active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Inicio
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={page === 1}
                                    className="rounded-lg border border-black/15 px-3 py-2 text-sm font-semibold text-black transition hover:bg-neutral-50 active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Anterior
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={page === totalPages}
                                    className="rounded-lg border border-black/15 px-3 py-2 text-sm font-semibold text-black transition hover:bg-neutral-50 active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Siguiente
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPage(totalPages)}
                                    disabled={page === totalPages}
                                    className="rounded-lg border border-black/15 px-3 py-2 text-sm font-semibold text-black transition hover:bg-neutral-50 active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Final
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* ── Vista: Agenda ──────────────────────────────────────────────────── */}
            {viewMode === "agenda" && (
                <VistaAgenda
                    rows={sorted}
                    isAdmin={isAdmin}
                    abrirAgendaCita={abrirAgendaCita}
                    fmtDTIntl={fmtDTIntl}
                />
            )}

            {/* ── Vista: Gráficos ───────────────────────────────────────────────── */}
            {viewMode === "graficos" && (
                <VistaGraficos rows={sorted} />
            )}

            {/* ── Vista: Tabla (desktop) ────────────────────────────────────────── */}
            {viewMode === "tabla" && (
                <>
                    <div className="hidden overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm lg:block">
                        <div className="overflow-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="font-vw-header border-b border-black/10 bg-neutral-50 text-xs text-neutral-500">
                                    <tr>
                                        <th className="px-4 py-3">
                                            <button type="button" onClick={() => toggleSort("agencia")} className="inline-flex items-center gap-1 text-xs font-bold text-black">
                                                Dealer
                                                <span className="opacity-60">
                                                    {sort.key === "agencia" ? (sort.dir === "asc" ? <ChevronUp className="h-4" /> : <ChevronDown className="h-4" />) : <ArrowUpDown className="h-4" />}
                                                </span>
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 font-bold text-black">Cliente</th>
                                        <th className="px-4 py-3">
                                            <button type="button" onClick={() => toggleSort("fecha_reclamacion")} className="inline-flex items-center gap-1 text-xs font-bold text-black">
                                                Fecha de Registro
                                                <span className="opacity-60">
                                                    {sort.key === "fecha_reclamacion" ? (sort.dir === "asc" ? <ChevronUp className="h-4" /> : <ChevronDown className="h-4" />) : <ArrowUpDown className="h-4" />}
                                                </span>
                                            </button>
                                        </th>
                                        <th className="px-4 py-3">
                                            <button type="button" onClick={() => toggleSort("ultimo_contacto_at")} className="inline-flex items-center gap-1 text-xs font-bold text-black">
                                                Último Contacto
                                                <span className="opacity-60">
                                                    {sort.key === "ultimo_contacto_at" ? (sort.dir === "asc" ? <ChevronUp className="h-4" /> : <ChevronDown className="h-4" />) : <ArrowUpDown className="h-4" />}
                                                </span>
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 font-bold text-black">Business</th>
                                        <th className="px-4 py-3 font-bold text-black">Asesor Digital</th>
                                        <th className="px-4 py-3 font-bold text-black">Asignado a</th>
                                        <th className="px-4 py-3 font-bold text-black">Estado</th>
                                        <th className="w-40 px-4 py-3 font-bold text-black">Canal de Contacto</th>
                                        <th className="px-4 py-3 font-bold text-black">Resumen</th>
                                        <th className="px-4 py-3 font-bold text-black">Acciones</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-black/5">
                                    {loadingCases ? (
                                        <>
                                            {Array.from({ length: 8 }).map((_, i) => (
                                                <SkeletonRow key={i} />
                                            ))}
                                        </>
                                    ) : (
                                        <>
                                            {paginatedRows.map((row) => {
                                                const isUpdating = !!updatingEstado[row.id_exp];

                                                return (
                                                    <tr
                                                        key={row.id_exp}
                                                        onDoubleClick={() => openEdit(row)}
                                                        onContextMenu={(e) => onRowContextMenu(e, row)}
                                                        className="cursor-pointer transition hover:bg-neutral-50"
                                                        title="Doble clic para editar"
                                                    >
                                                        <td className="px-4 py-3 text-xs text-black">{row.agencia}</td>
                                                        <td className="max-w-32 px-4 py-3 truncate text-black">
                                                            {row.cliente_nombre + " " + row.cliente_apellidos}
                                                        </td>
                                                        <td className="px-4 py-3 text-black">{row.fecha_reclamacion || "—"}</td>
                                                        <td className="px-4 py-3 text-black">{fmtDTIntl(row.ultimo_contacto_at)}</td>
                                                        <td className="max-w-28 px-4 py-3 truncate text-black">{row.linea || "—"}</td>
                                                        <td className="max-w-28 px-4 py-3 truncate text-black">{row.asesor_digital || "—"}</td>
                                                        <td className="max-w-28 px-4 py-3 truncate text-black">{row.asesor_solicita || "—"}</td>

                                                        <td className="px-4 py-3">
                                                            <div className="relative inline-flex items-center">
                                                                <select
                                                                    value={row.estado || "Contactado"}
                                                                    disabled={isUpdating}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    onChange={(e) => {
                                                                        e.stopPropagation();
                                                                        updateEstadoInline(row, e.target.value);
                                                                    }}
                                                                    className={[
                                                                        "inline-flex appearance-none items-center rounded-full border bg-transparent px-3 py-1 pr-8 text-xs font-semibold outline-none shadow-sm",
                                                                        badgeCls(row.estado),
                                                                        isUpdating ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:opacity-90",
                                                                    ].join(" ")}
                                                                    title="Cambiar estado"
                                                                >
                                                                    {ESTADOS_PROSPECTO.map((s) => (
                                                                        <option key={s} value={s} className="bg-white text-black">
                                                                            {s}
                                                                        </option>
                                                                    ))}
                                                                </select>

                                                                <span className="pointer-events-none absolute right-2 inline-flex items-center">
                                                                    {isUpdating ? (
                                                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-black" />
                                                                    ) : (
                                                                        <ChevronDown className="h-3.5 w-3.5 text-black/70" />
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        <td className="px-4 py-3 text-black">
                                                            <span className="line-clamp-2">{row.origen}</span>
                                                        </td>

                                                        <td className="w-[320px] px-4 py-3 text-black">
                                                            <div className="flex items-start gap-2">
                                                                <div className="min-w-0 flex-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            openSummaryViewer(row);
                                                                        }}
                                                                        className="w-full text-left"
                                                                        title={row.resumen ? "Ver resumen completo" : "No hay resumen"}
                                                                    >
                                                                        <span className="line-clamp-3 text-sm">{row.resumen || "Sin resumen"}</span>
                                                                        {row.resumen_actualizado_at ? (
                                                                            <div className="mt-1 text-[11px] text-slate-500">
                                                                                Actualizado: {fmtDTIntl(row.resumen_actualizado_at)}
                                                                                {row.resumen_fuente ? ` • ${row.resumen_fuente}` : ""}
                                                                            </div>
                                                                        ) : null}
                                                                    </button>
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        generarResumenInline(row);
                                                                    }}
                                                                    disabled={!!generatingSummary[row.id_exp]}
                                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white shadow-sm transition hover:bg-neutral-50 active:scale-[0.95] disabled:opacity-60"
                                                                    title="Generar resumen"
                                                                >
                                                                    {generatingSummary[row.id_exp] ? (
                                                                        <Loader2 className="h-5 w-5 animate-spin text-black" />
                                                                    ) : (
                                                                        <ClipboardCheck className="h-5 w-5 text-black" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </td>

                                                        <td className="px-4 py-1">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        abrirAgendaCita(row);
                                                                    }}
                                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white shadow-sm transition hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-black/20 active:scale-[0.95]"
                                                                    title="Agendar cita"
                                                                >
                                                                    <CalendarPlus className="h-5 w-5" />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        navigate(
                                                                            `/comercial/prospectos/contacto?tel=${encodeURIComponent(row.telefono || "")}&direct=1`
                                                                        );
                                                                    }}
                                                                    className="flex h-9 w-[150px] items-center justify-between rounded-xl border border-black/10 bg-white px-3 shadow-sm transition hover:bg-neutral-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-black/20 active:scale-[0.95] disabled:opacity-50"
                                                                    title="Abrir chat"
                                                                    disabled={!row.telefono}
                                                                >
                                                                    <div className="flex min-w-0 items-center gap-2">
                                                                        <MessageSquareShare className="h-5 w-5 text-black" />
                                                                        <span className="min-w-0 truncate text-sm font-medium text-black">
                                                                            {row.telefono || "SIN TELÉFONO"}
                                                                        </span>
                                                                    </div>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}

                                            {paginatedRows.length === 0 ? (
                                                <tr>
                                                    <td colSpan={11} className="px-4 py-10 text-center text-black">
                                                        No hay resultados con esos filtros.
                                                    </td>
                                                </tr>
                                            ) : null}
                                        </>
                                    )}
                                </tbody>
                            </table>

                            <ContextMenu
                                ctxMenu={ctxMenu}
                                onDelete={eliminarCaso}
                                onClose={() => setCtxMenu({ open: false, x: 0, y: 0, row: null })}
                            />
                        </div>
                    </div>

                    {/* ── Vista: Tabla (móvil) ─────────────────────────────────────── */}
                    <div className="grid gap-3 lg:hidden">
                        {loadingCases ? (
                            <>
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="mt-2 h-3 w-36" />
                                        <Skeleton className="mt-3 h-3 w-full" />
                                        <Skeleton className="mt-2 h-3 w-3/4" />
                                    </div>
                                ))}
                            </>
                        ) : (
                            <>
                                {paginatedRows.map((row) => (
                                    <button
                                        key={row.id_exp}
                                        onClick={() => openEdit(row)}
                                        className="rounded-3xl border border-black/10 bg-white p-4 text-left shadow-sm transition hover:bg-slate-50 active:scale-[0.99]"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-extrabold text-black">
                                                    {row.cliente_nombre + " " + row.cliente_apellidos}
                                                </div>
                                                <div className="mt-1 text-xs text-slate-600">
                                                    {row.agencia} • {row.fecha_reclamacion || "—"}
                                                </div>
                                                <div className="mt-1 text-xs text-slate-600">
                                                    {row.linea || "Sin business"} • Último contacto: {row.fecha_contacto || "—"}
                                                </div>
                                                <div className="mt-1 text-xs text-slate-600">
                                                    {row.asesor_digital ? `Digital: ${row.asesor_digital}` : "Digital: —"} •{" "}
                                                    {row.asesor_solicita ? `Solicita: ${row.asesor_solicita}` : "Solicita: —"}
                                                </div>
                                            </div>
                                            <BadgeEstado value={row.estado} />
                                        </div>

                                        <div className="mt-3 line-clamp-3 text-sm text-slate-700">{row.comentarios}</div>
                                        <div className="mt-3 text-xs text-slate-500">Toca para editar</div>
                                    </button>
                                ))}

                                {paginatedRows.length === 0 ? (
                                    <div className="rounded-3xl border border-black/10 bg-white p-10 text-center text-slate-600">
                                        No hay resultados con esos filtros.
                                    </div>
                                ) : null}
                            </>
                        )}
                    </div>
                </>
            )}

            <Modal
                open={openModal}
                title={mode === "create" ? "Nuevo prospecto" : `Editar prospecto • ${draft?.id_exp}`}
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
                            disabled={saving || loadingDetail || telInvalid || (draft?.telefono ? !telIsOk : false)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-black/85 px-4 py-2 text-sm font-bold text-white/90 hover:bg-black hover:text-white disabled:opacity-60"
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
                        {touchedSave && missing.length ? (
                            <div className="md:col-span-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                <div className="font-extrabold">Faltan campos obligatorios</div>
                                <div className="mt-1 text-xs font-semibold">{missing.map((k) => REQUIRED[k]).join(" • ")}</div>
                            </div>
                        ) : null}

                        <Field label="Dealer" icon={Building2}>
                            <select
                                value={draft.agencia || ""}
                                onChange={(e) => setDraft((p) => ({ ...p, agencia: e.target.value }))}
                                disabled={!isAdmin && userAgencias.length <= 1}
                                className={[
                                    inputBase,
                                    isInvalid("agencia") ? inputBad : inputOk,
                                    !isAdmin && contextoDigitalSesion ? "cursor-not-allowed opacity-70" : "",
                                ].join(" ")}
                            >
                                <option value="" disabled>Selecciona un dealer...</option>
                                {(isAdmin ? DEALERS : userAgencias.length > 0 ? userAgencias : DEALERS).map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Asesor Digital" icon={User}>
                            <select
                                value={draft.asesor_digital || ""}
                                onChange={(e) => setDraft((p) => ({ ...p, asesor_digital: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")}
                            >
                                <option value="">— Selecciona —</option>
                                {ASESORES_DIGITALES.map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Asignado a" icon={User}>
                            <select
                                value={draft.asesor_solicita || ""}
                                onChange={(e) => setDraft((p) => ({ ...p, asesor_solicita: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")}
                            >
                                <option value="">— Selecciona —</option>
                                {ASESORES.map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </Field>

                        <div className="md:col-span-3">
                            <Field label="Cliente" icon={User}>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <div>
                                        <label className="inline-flex items-center gap-3 text-sm font-bold text-black">
                                            <input
                                                type="checkbox"
                                                checked={!!draft.tiene_nombre}
                                                onChange={(e) =>
                                                    setDraft((p) => ({
                                                        ...p,
                                                        tiene_nombre: e.target.checked,
                                                        nombre_cliente: e.target.checked ? p.nombre_cliente : "",
                                                    }))
                                                }
                                                className="h-4 w-4"
                                            />
                                            Nombre del Prospecto
                                        </label>
                                        <input
                                            value={draft.nombre_cliente || ""}
                                            onChange={(e) => setDraft((p) => ({ ...p, nombre_cliente: e.target.value }))}
                                            disabled={!draft.tiene_nombre}
                                            className={[
                                                inputBase,
                                                inputOk,
                                                !draft.tiene_nombre ? "cursor-not-allowed opacity-70" : "",
                                            ].join(" ")}
                                            placeholder={draft.tiene_nombre ? "Nombre" : "SIN NOMBRE"}
                                        />
                                    </div>

                                    <div>
                                        <div className="mb-1 text-sm font-bold text-black">Teléfono</div>
                                        <input
                                            maxLength={12}
                                            disabled={telIsNormalized}
                                            value={draft.telefono || ""}
                                            onChange={(e) =>
                                                setDraft((p) => ({
                                                    ...p,
                                                    telefono: e.target.value.replace(/\D/g, "").slice(0, 12),
                                                }))
                                            }
                                            className={[
                                                inputBase,
                                                telIsNormalized ? "cursor-not-allowed opacity-70" : "",
                                                isInvalid("telefono") || telInvalid ? inputBad : inputOk,
                                            ].join(" ")}
                                        />
                                        {isInvalid("telefono") ? (
                                            <div className="mt-1 text-xs font-bold text-red-600">Teléfono es requerido.</div>
                                        ) : null}
                                        {!isInvalid("telefono") && telError ? (
                                            <div className="mt-1 text-xs font-bold text-red-600">{telError}</div>
                                        ) : null}
                                    </div>

                                    <div>
                                        <div className="mb-1 text-sm font-bold text-black">Volvo de sus sueños</div>
                                        <select
                                            value={draft.cliente_interes || ""}
                                            onChange={(e) => setDraft((p) => ({ ...p, cliente_interes: e.target.value }))}
                                            className={[inputBase, inputOk].join(" ")}
                                        >
                                            <option value="" disabled>Selecciona un modelo...</option>
                                            {VEHICULOS.map((d) => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-3 md:grid-cols-2">
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-black">Estado</div>
                                        <select
                                            value={draft.estado || ""}
                                            onChange={(e) => {
                                                const estado = e.target.value;
                                                setDraft((p) => ({
                                                    ...p,
                                                    estado,
                                                    motivo_descalificacion:
                                                        normalizeText(estado) === "descalificado"
                                                            ? p.motivo_descalificacion || ""
                                                            : "",
                                                }));
                                            }}
                                            className={[inputBase, inputOk].join(" ")}
                                        >
                                            {ESTADOS_PROSPECTO.map((s) => (
                                                <option key={s} value={s} className="bg-neutral-200">{s}</option>
                                            ))}
                                        </select>
                                        <div className="mt-2">
                                            <BadgeEstado value={draft.estado} />
                                        </div>

                                        {normalizeText(draft.estado) === "descalificado" ? (
                                            <div className="mt-3">
                                                <div className="mb-1 text-sm font-bold text-black">
                                                    Motivo de descalificación <span className="text-red-600">*</span>
                                                </div>
                                                <select
                                                    value={draft.motivo_descalificacion || ""}
                                                    onChange={(e) =>
                                                        setDraft((p) => ({
                                                            ...p,
                                                            motivo_descalificacion: e.target.value,
                                                        }))
                                                    }
                                                    className={[
                                                        inputBase,
                                                        isInvalid("motivo_descalificacion") ? inputBad : inputOk,
                                                    ].join(" ")}
                                                >
                                                    <option value="">— Selecciona el motivo —</option>
                                                    {MOTIVOS_DESCALIFICACION.map((motivo) => (
                                                        <option key={motivo} value={motivo}>{motivo}</option>
                                                    ))}
                                                </select>
                                                {isInvalid("motivo_descalificacion") ? (
                                                    <div className="mt-1 text-xs font-bold text-red-600">
                                                        Selecciona el motivo de descalificación.
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-black">Canal de Contacto</div>
                                        <OrigenPicker
                                            value={draft.origen}
                                            onChange={(v) => setDraft((p) => ({ ...p, origen: v }))}
                                        />
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-3 md:grid-cols-2">
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-black">Business</div>
                                        <LineaPicker
                                            value={draft.linea}
                                            onChange={(v) => setDraft((p) => ({ ...p, linea: v }))}
                                        />
                                    </div>
                                    <div className="mt-5">
                                        <div className="mb-1 flex items-center justify-between gap-2">
                                            <div className="text-sm font-bold text-black">Pauta de Origen</div>

                                            <button
                                                type="button"
                                                onClick={cargarPautasMeta}
                                                disabled={loadingPautas}
                                                className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2.5 py-1 text-xs font-bold text-black transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                title="Recargar campañas Meta"
                                            >
                                                {loadingPautas ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <ArrowUpDown className="h-3.5 w-3.5" />
                                                )}
                                                Recargar
                                            </button>
                                        </div>

                                        <select
                                            value={draft.pauta || ""}
                                            onChange={(e) =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    pauta: e.target.value,
                                                }))
                                            }
                                            disabled={loadingPautas}
                                            className={[inputBase, inputOk].join(" ")}
                                        >
                                            <option value="">
                                                {loadingPautas ? "Cargando campañas..." : "— Selecciona campaña —"}
                                            </option>

                                            {draft.pauta &&
                                                !pautasOptions.some(
                                                    (item) => normalizeText(item.value) === normalizeText(draft.pauta)
                                                ) ? (
                                                <option value={draft.pauta}>
                                                    {draft.pauta} (actual)
                                                </option>
                                            ) : null}

                                            {pautasOptions.map((item) => (
                                                <option key={item.value} value={item.value}>
                                                    {item.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </Field>
                        </div>

                        <div className="md:col-span-3">
                            <Field label="Perfil financiero y de compra" icon={Gauge}>
                                <div className="grid gap-3 md:grid-cols-4">
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-black">Enganche disponible</div>
                                        <input
                                            type="number"
                                            min="0"
                                            inputMode="numeric"
                                            value={draft.enganche_monto || ""}
                                            onChange={(e) =>
                                                setDraft((p) => ({
                                                    ...p,
                                                    enganche_monto: e.target.value.replace(/\D/g, ""),
                                                }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                            placeholder="Ej. 150000"
                                        />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-black">Presupuesto mensual</div>
                                        <input
                                            type="number"
                                            min="0"
                                            inputMode="numeric"
                                            value={draft.presupuesto_mensual || ""}
                                            onChange={(e) =>
                                                setDraft((p) => ({
                                                    ...p,
                                                    presupuesto_mensual: e.target.value.replace(/\D/g, ""),
                                                }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                            placeholder="Ej. 18000"
                                        />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-black">Buró de crédito</div>
                                        <select
                                            value={draft.buro_estado || ""}
                                            onChange={(e) => setDraft((p) => ({ ...p, buro_estado: e.target.value }))}
                                            className={[inputBase, inputOk].join(" ")}
                                        >
                                            {BURO_OPTIONS.map((item) => (
                                                <option key={item.value} value={item.value}>{item.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-black">Forma de pago</div>
                                        <select
                                            value={draft.forma_pago || ""}
                                            onChange={(e) => setDraft((p) => ({ ...p, forma_pago: e.target.value }))}
                                            className={[inputBase, inputOk].join(" ")}
                                        >
                                            {FORMA_PAGO_OPTIONS.map((item) => (
                                                <option key={item.value} value={item.value}>{item.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-3 md:grid-cols-4">
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-black">Tipo de cliente</div>
                                        <select
                                            value={draft.tipo_cliente || ""}
                                            onChange={(e) => setDraft((p) => ({ ...p, tipo_cliente: e.target.value }))}
                                            className={[inputBase, inputOk].join(" ")}
                                        >
                                            {TIPO_CLIENTE_OPTIONS.map((item) => (
                                                <option key={item.value} value={item.value}>{item.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-black">Plazo de compra</div>
                                        <select
                                            value={draft.plazo_compra || ""}
                                            onChange={(e) => setDraft((p) => ({ ...p, plazo_compra: e.target.value }))}
                                            className={[inputBase, inputOk].join(" ")}
                                        >
                                            {PLAZO_COMPRA_OPTIONS.map((item) => (
                                                <option key={item || "vacio"} value={item}>
                                                    {item || "— Selecciona —"}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-black">Uso del vehículo</div>
                                        <input
                                            value={draft.uso_vehiculo || ""}
                                            onChange={(e) => setDraft((p) => ({ ...p, uso_vehiculo: e.target.value }))}
                                            className={[inputBase, inputOk].join(" ")}
                                            placeholder="Personal, familiar, empresarial..."
                                        />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-black">Comprobación de ingresos</div>
                                        <input
                                            value={draft.comprobacion_ingresos || ""}
                                            onChange={(e) =>
                                                setDraft((p) => ({ ...p, comprobacion_ingresos: e.target.value }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                            placeholder="Nómina, estados de cuenta, negocio..."
                                        />
                                    </div>
                                </div>
                            </Field>
                        </div>

                        <div className="md:col-span-3">
                            <Field label="Seguimiento comercial" icon={ClipboardCheck}>
                                <div className="grid gap-3 md:grid-cols-4">
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-black">ID de cotización</div>
                                        <input
                                            value={draft.id_cotizacion || ""}
                                            onChange={(e) => setDraft((p) => ({ ...p, id_cotizacion: e.target.value }))}
                                            className={[inputBase, inputOk].join(" ")}
                                            placeholder="Folio o ID interno"
                                        />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-black">Folio solicitud de crédito</div>
                                        <input
                                            value={draft.folio_solicitud_credito || ""}
                                            onChange={(e) =>
                                                setDraft((p) => ({ ...p, folio_solicitud_credito: e.target.value }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                            placeholder="Folio de la financiera"
                                        />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-black">Estado de solicitud</div>
                                        <select
                                            value={draft.solicitud_credito_estado || ""}
                                            onChange={(e) =>
                                                setDraft((p) => ({ ...p, solicitud_credito_estado: e.target.value }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                        >
                                            {SOLICITUD_CREDITO_OPTIONS.map((item) => (
                                                <option key={item.value} value={item.value}>{item.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-black">VIN facturado</div>
                                        <input
                                            value={draft.vin_facturado || ""}
                                            onChange={(e) =>
                                                setDraft((p) => ({
                                                    ...p,
                                                    vin_facturado: e.target.value.toUpperCase().slice(0, 32),
                                                }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                            placeholder="VIN del vehículo"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 max-w-sm">
                                    <div className="mb-1 text-sm font-bold text-black">Estatus de entrega</div>
                                    <select
                                        value={draft.vin_estatus_entrega || ""}
                                        onChange={(e) =>
                                            setDraft((p) => ({ ...p, vin_estatus_entrega: e.target.value }))
                                        }
                                        className={[inputBase, inputOk].join(" ")}
                                    >
                                        <option value="">— Sin definir —</option>
                                        <option value="entregado">Entregado</option>
                                        <option value="cancelado">Cancelado</option>
                                    </select>
                                </div>
                            </Field>
                        </div>

                        <div className="md:col-span-1">
                            <Field label="Comentarios Adicionales" icon={FileText}>
                                <textarea
                                    value={draft.comentarios || ""}
                                    onChange={(e) => setDraft((p) => ({ ...p, comentarios: e.target.value }))}
                                    rows={4}
                                    className={[inputBase, inputOk].join(" ")}
                                />
                            </Field>
                        </div>

                        <div className="md:col-span-2">
                            <Field label="Resumen de conversación" icon={ClipboardCheck}>
                                <textarea
                                    value={draft.resumen || ""}
                                    disabled
                                    rows={5}
                                    className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-black outline-none"
                                />
                                {draft.resumen_actualizado_at ? (
                                    <div className="mt-2 text-xs font-semibold text-slate-500">
                                        Última actualización: {fmtDTIntl(draft.resumen_actualizado_at)}
                                        {draft.resumen_fuente ? ` • ${draft.resumen_fuente}` : ""}
                                    </div>
                                ) : null}
                            </Field>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                open={openSummaryModal}
                title={summaryInfo ? `Resumen IA • ${summaryInfo.nombre || `Prospecto ${summaryInfo.id_exp}`}` : "Resumen IA"}
                onClose={closeSummaryModal}
                footer={
                    <button
                        onClick={closeSummaryModal}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-red-400 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-red-600 hover:text-white"
                    >
                        <X className="h-4 w-4" />
                        Cerrar
                    </button>
                }
            >
                {!summaryInfo ? null : (
                    <div className="grid gap-3">
                        <Field label="Prospecto" icon={User}>
                            <input
                                value={summaryInfo.nombre || "—"}
                                disabled
                                className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-black"
                            />
                        </Field>
                        <Field label="Resumen generado" icon={ClipboardCheck}>
                            <textarea
                                value={summaryInfo.resumen || "Sin resumen disponible"}
                                disabled
                                rows={10}
                                className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-black outline-none"
                            />
                        </Field>
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Última actualización" icon={CalendarDays}>
                                <input
                                    value={summaryInfo.resumen_actualizado_at ? fmtDTIntl(summaryInfo.resumen_actualizado_at) : "—"}
                                    disabled
                                    className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-black"
                                />
                            </Field>
                            <Field label="Fuente" icon={BrainCircuit}>
                                <input
                                    value={summaryInfo.resumen_fuente || "—"}
                                    disabled
                                    className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-black"
                                />
                            </Field>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                open={openAgendaModal}
                title="Agendar cita"
                onClose={closeAgendaModal}
                footer={
                    <>
                        <button
                            onClick={closeAgendaModal}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-red-400 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-red-600 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                            Cerrar
                        </button>
                        <button
                            onClick={handleAgendar}
                            disabled={!agendaInfo || savingo}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black/85 px-4 py-2 text-sm font-bold text-white/90 hover:bg-black hover:text-white disabled:opacity-60"
                        >
                            <CalendarCheck className="h-4 w-4" />
                            {savingo ? "Guardando..." : "Agendar"}
                        </button>
                    </>
                }
            >
                {!agendaInfo ? null : (
                    <div className="grid gap-3 md:grid-cols-3">
                        <Field label="Prospecto" icon={User}>
                            <input
                                value={agendaInfo.nombre}
                                disabled
                                className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-black"
                            />
                        </Field>
                        <Field label="Volvo de sus sueños" icon={CarFront}>
                            <input
                                value={agendaInfo.auto_interes || "—"}
                                disabled
                                className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-black"
                            />
                        </Field>
                        <Field label="Teléfono" icon={Phone}>
                            <input
                                value={agendaInfo.telefono || "—"}
                                disabled
                                className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-black"
                            />
                        </Field>
                        <Field label="Fecha y Hora de cita" icon={CalendarDays}>
                            <input
                                type="datetime-local"
                                value={drafter.fecha_cita || ""}
                                onChange={(e) => setDrafter((p) => ({ ...p, fecha_cita: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")}
                            />
                        </Field>
                        <Field label="Asesor Asignado" icon={UserStar}>
                            <select
                                value={drafter.asesor_solicita || ""}
                                onChange={(e) => setDrafter((p) => ({ ...p, asesor_solicita: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")}
                            >
                                <option value="">— Selecciona —</option>
                                {ASESORES.map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Tipo de cita" icon={LayoutList}>
                            <select
                                value={drafter.tipo_cita || ""}
                                onChange={(e) => setDrafter((p) => ({ ...p, tipo_cita: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")}
                            >
                                <option value="">— Selecciona —</option>
                                {["Prueba de Manejo", "Tradicional", "Digital"].map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </Field>
                        {errorMsg ? (
                            <div className="md:col-span-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                {errorMsg}
                            </div>
                        ) : null}
                    </div>
                )}
            </Modal>
        </div>
    );
}