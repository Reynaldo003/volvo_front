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

const BRAND_BLUE = "#003057";
const PAGE_SIZE = 200;

const ImgIcon = (src, alt) => (props) => <img src={src} alt={alt} {...props} />;

const lineaMeta = {
    Nuevos: { Icon: Car, label: "Nuevos" },
    Usados: { Icon: CarFront, label: "Usados" },
    Comerciales: { Icon: Van, label: "Comerciales" },
};

const origenMeta = {
    "Volvo-Concesionarios": { Icon: ImgIcon(CONCESIONARIO, "Volvo-Concesionarios"), label: "Volvo-Concesionarios" },
    WhatsApp: { Icon: ImgIcon(WAP, "WhatsApp"), label: "WhatsApp" },
    Facebook: { Icon: ImgIcon(FB, "Facebook"), label: "Facebook" },
    "Llamada Entrante": { Icon: ImgIcon(PHONE, "Llamada Entrante"), label: "Llamada Entrante" },
};

const ASESORES_DIGITALES = ["Mariana Tlamani"];
const ESTADOS_PROSPECTO = ["Descalificado", "Contactado", "Sin Respuesta"];

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
                                ? "border-[#003057]/50 bg-white ring-2 ring-[#003057]/20"
                                : "border-black/10 bg-neutral-50 hover:bg-white",
                        ].join(" ")}
                    >
                        <span
                            className={[
                                "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                                active
                                    ? "border-[#003057]/40 bg-[#003057]/10"
                                    : "border-black/10 bg-white",
                            ].join(" ")}
                        >
                            <Icon className="h-4 w-4 text-[#003057]" />
                        </span>

                        <span className="truncate text-sm font-semibold text-[#003057]">
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
                                ? "border-[#003057]/50 bg-white ring-2 ring-[#003057]/20"
                                : "border-black/10 bg-neutral-50 hover:bg-white",
                        ].join(" ")}
                    >
                        <div
                            className={[
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                                active
                                    ? "border-[#003057]/40 bg-[#003057]/10"
                                    : "border-black/10 bg-white",
                            ].join(" ")}
                        >
                            <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-[#003057]">
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
                <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-[#003057]/20 bg-neutral-100 shadow-xl">
                    <div
                        className="flex shrink-0 items-center justify-between gap-3 px-5 py-4"
                        style={{ backgroundColor: BRAND_BLUE }}
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
                        <div className="flex shrink-0 flex-col gap-2 border-t border-[#003057]/10 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
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
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#003057]">
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
        origen: p.canal_contacto || "",
        pauta: p.pauta || "",
        estado: p.estado || "",
        comentarios: p.comentarios || "",
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
        "bg-[#003057]",
        "bg-sky-500",
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
                <div className="flex items-center gap-2 px-5 py-3" style={{ backgroundColor: BRAND_BLUE }}>
                    <Icon className="h-4 w-4 text-white/70" />
                    <span className="text-sm font-extrabold text-white">{title}</span>
                    <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">
                        {data.reduce((acc, [, n]) => acc + n, 0)} total
                    </span>
                </div>
                <div className="space-y-3 p-5 max-h-[300px] overflow-y-auto">
                    {data.map(([label, count], i) => (
                        <div key={label}>
                            <div className="mb-1 flex items-center justify-between text-xs font-semibold text-[#003057]">
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
                <div className="flex items-center gap-2 px-5 py-3" style={{ backgroundColor: BRAND_BLUE }}>
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
                                        <span className="text-xs font-semibold text-[#003057] truncate max-w-[120px]" title={label}>
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
                <div className="flex items-center gap-2 px-5 py-3" style={{ backgroundColor: BRAND_BLUE }}>
                    <ClipboardCheck className="h-4 w-4 text-white/70" />
                    <span className="text-sm font-extrabold text-white">Resumen general</span>
                </div>
                <div className="grid grid-cols-2 gap-4 p-5 md:grid-cols-4">
                    <div className="text-center">
                        <div className="text-2xl font-black text-[#003057]">{totalProspectos}</div>
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

export default function DigitalesProspectos() {
    const navigate = useNavigate();
    const { user, ready } = useAuth();
    const [cases, setCases] = useState([]);

    //Estado de la vista activa 
    const [viewMode, setViewMode] = useState("tabla");

    const VIEW_MODES = [
        { key: "tabla", label: "Tabla", Icon: Table2 },
        { key: "graficos", label: "Gráficos", Icon: BarChart3 },
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
        const items = Array.isArray(pautasMeta) ? pautasMeta : [];
        const vistos = new Set();
        const opciones = [];

        for (const item of items) {
            const value = String(item?.value || "").trim();
            const label = String(item?.label || value).trim();

            if (!value) continue;

            const key = normalizeText(value);
            if (vistos.has(key)) continue;

            vistos.add(key);
            opciones.push({
                value,
                label,
            });
        }

        return opciones.sort((a, b) =>
            a.label.localeCompare(b.label, "es", { sensitivity: "base" })
        );
    }, [pautasMeta]);

    const REQUIRED = useMemo(
        () => ({
            telefono: "Teléfono",
        }),
        []
    );

    const [touchedSave, setTouchedSave] = useState(false);

    const missing = useMemo(() => {
        if (!draft) return [];
        const m = [];
        for (const key of Object.keys(REQUIRED)) {
            const v = draft[key];
            const isEmpty = v === null || v === undefined || (typeof v === "string" && v.trim() === "");
            if (isEmpty) m.push(key);
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

    const inputBase = "w-full rounded-lg border px-3 py-2.5 text-sm text-[#003057] font-semibold outline-none transition";
    const inputOk = "border-black/10 bg-neutral-100";
    const inputBad = "border-red-500 bg-red-50";

    const filterLabelCls = "mb-1.5 block text-xs font-bold text-[#003057]";
    const filterControlCls =
        "h-9 w-full rounded-lg border border-[#003057] placeholder:text-[#003057] bg-white px-3 text-sm text-[#003057] shadow-sm outline-none transition focus:border-[#003057] focus:ring-2 focus:ring-[#003057]/15";

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

    useEffect(() => {
        if (!openModal) return;
        if (pautasMeta.length) return;

        (async () => {
            setLoadingPautas(true);
            try {
                const res = await api.digitalesCampanasMeta(30);
                const items = res?.items || [];
                setPautasMeta(Array.isArray(items) ? items : []);
            } catch (e) {
                console.error("Error cargando campañas meta:", e);
                setPautasMeta([]);
            } finally {
                setLoadingPautas(false);
            }
        })();
    }, [openModal, pautasMeta.length]);


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
                String(c.pauta || "").toLowerCase().includes(q);

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
            cliente_interes: "",
            comentarios: "",
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
                origen: p.canal_contacto || "",
                pauta: p.pauta || "",
                estado: p.estado || "",
                cliente_interes: p.auto_interes || "",
                comentarios: p.comentarios || "",
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
                asesor_digital: asesorDigitalFinal,
                asesor_ventas: draft.asesor_solicita || "",
                auto_interes: draft.cliente_interes || "",
                comentarios: draft.comentarios || "",
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
            {/* ── Encabezado con título + botones de vista ─────────────────────── */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="font-vw-header truncate text-lg font-extrabold text-[#003057]">Prospectos</h2>
                    <p className="text-sm text-slate-400">Doble clic para editar la información del prospecto.</p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    {/* ── Botones Agenda / Tabla / Gráficos ── */}
                    <div className="flex items-center rounded-xl border border-[#003057]/20 bg-white p-1 shadow-sm">
                        {VIEW_MODES.map(({ key, label, Icon }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setViewMode(key)}
                                className={[
                                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                                    viewMode === key
                                        ? "bg-[#003057] text-white shadow"
                                        : "text-[#003057] hover:bg-slate-100",
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
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#003057]/20 bg-white px-4 py-2 text-sm font-semibold text-[#003057] shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <FileDown className="h-4 w-4" />
                        Exportar Excel
                    </button>

                    <button
                        onClick={openCreate}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#003057] px-4 py-2 text-sm text-white shadow-sm hover:bg-[#003057]/80"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Prospecto
                    </button>
                </div>
            </div>
            {/* ────────────────────────────────────────────────────────────────── */}

            <div className="mb-4 rounded-2xl bg-white">
                <div className="grid gap-4 xl:grid-cols-12">
                    <div className="xl:col-span-6">
                        <label className={filterLabelCls}>Búsqueda</label>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#003057]/70" />
                            <input
                                value={filters.q}
                                onChange={(e) => updateFilter("q", e.target.value)}
                                placeholder="Buscar por dealer, cliente, teléfono, business, asesor, correo..."
                                className={`${filterControlCls} pl-10 pr-10`}
                            />
                            {filters.q ? (
                                <button
                                    onClick={() => updateFilter("q", "")}
                                    className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-[#003057] transition hover:bg-slate-100 hover:text-red-500"
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

                    <div className="xl:col-span-3">
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
                </div>

                <div className="mt-4 flex flex-col gap-3 border-t border-[#003057]/10 pt-4">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <div className="text-sm font-semibold text-[#003057]">
                            Mostrando {pageStart}-{pageEnd} de {sorted.length} prospectos
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                            {isAdmin ? (
                                <select
                                    value={selectedNumeroAsesor}
                                    onChange={(e) => setSelectedNumeroAsesor(e.target.value)}
                                    className="h-11 min-w-[260px] rounded-xl border border-[#003057]/25 bg-white px-4 text-sm font-semibold text-[#003057] shadow-sm outline-none transition focus:border-[#003057] focus:ring-2 focus:ring-[#003057]/15"
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

                            <button
                                type="button"
                                onClick={() => applyQuickRegistroRange(todayStr, todayStr)}
                                className={[
                                    "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold shadow-sm transition",
                                    isQuickActive(todayStr, todayStr)
                                        ? "bg-[#003057] text-white"
                                        : "bg-emerald-600 text-white hover:bg-emerald-700",
                                ].join(" ")}
                            >
                                <CalendarDays className="h-4 w-4" />
                                Hoy
                            </button>

                            <button
                                type="button"
                                onClick={() => applyQuickRegistroRange(yesterdayStr, yesterdayStr)}
                                className={[
                                    "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold shadow-sm transition",
                                    isQuickActive(yesterdayStr, yesterdayStr)
                                        ? "bg-[#003057] text-white"
                                        : "bg-amber-500 text-white hover:bg-amber-600",
                                ].join(" ")}
                            >
                                <CalendarDays className="h-4 w-4" />
                                Ayer
                            </button>

                            <button
                                type="button"
                                onClick={() => applyQuickRegistroRange(weekStartStr, weekEndStr)}
                                className={[
                                    "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold shadow-sm transition",
                                    isQuickActive(weekStartStr, weekEndStr)
                                        ? "bg-[#003057] text-white"
                                        : "bg-sky-600 text-white hover:bg-sky-700",
                                ].join(" ")}
                            >
                                <CalendarDays className="h-4 w-4" />
                                Esta semana
                            </button>

                            <button
                                type="button"
                                onClick={() => applyQuickRegistroRange(last7DaysStartStr, last7DaysEndStr)}
                                className={[
                                    "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold shadow-sm transition",
                                    isQuickActive(last7DaysStartStr, last7DaysEndStr)
                                        ? "bg-[#003057] text-white"
                                        : "bg-violet-600 text-white hover:bg-violet-700",
                                ].join(" ")}
                            >
                                <CalendarDays className="h-4 w-4" />
                                Últimos 7 días
                            </button>

                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#003057]/25 bg-white px-4 text-sm font-semibold text-[#003057] shadow-sm transition hover:bg-slate-50"
                            >
                                <X className="h-4 w-4" />
                                Limpiar
                            </button>
                        </div>
                    </div>

                    {!loadingCases && sorted.length > 0 && viewMode === "tabla" ? (
                        <div className="flex flex-col gap-3 border-t border-[#003057]/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-xs font-semibold text-slate-500">
                                Página {page} de {totalPages} • {PAGE_SIZE} registros por página
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage(1)}
                                    disabled={page === 1}
                                    className="rounded-lg border border-[#003057]/20 px-3 py-2 text-sm font-semibold text-[#003057] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Inicio
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={page === 1}
                                    className="rounded-lg border border-[#003057]/20 px-3 py-2 text-sm font-semibold text-[#003057] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Anterior
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={page === totalPages}
                                    className="rounded-lg border border-[#003057]/20 px-3 py-2 text-sm font-semibold text-[#003057] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Siguiente
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPage(totalPages)}
                                    disabled={page === totalPages}
                                    className="rounded-lg border border-[#003057]/20 px-3 py-2 text-sm font-semibold text-[#003057] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Final
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>



            {/* ── Vista: Gráficos ───────────────────────────────────────────────── */}
            {viewMode === "graficos" && (
                <VistaGraficos rows={sorted} />
            )}

            {/* ── Vista: Tabla (desktop) ────────────────────────────────────────── */}
            {viewMode === "tabla" && (
                <>
                    <div className="hidden overflow-hidden rounded-lg bg-white/[0.03] shadow-lg lg:block">
                        <div className="overflow-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="font-vw-header border border-black bg-[#003057] text-xs text-white">
                                    <tr>
                                        <th className="px-4 py-3">
                                            <button type="button" onClick={() => toggleSort("agencia")} className="inline-flex items-center gap-1 text-xs font-bold">
                                                Dealer
                                                <span className="opacity-60">
                                                    {sort.key === "agencia" ? (sort.dir === "asc" ? <ChevronUp className="h-4" /> : <ChevronDown className="h-4" />) : <ArrowUpDown className="h-4" />}
                                                </span>
                                            </button>
                                        </th>
                                        <th className="px-4 py-3">Cliente</th>
                                        <th className="px-4 py-3">
                                            <button type="button" onClick={() => toggleSort("fecha_reclamacion")} className="inline-flex items-center gap-1 text-xs font-bold">
                                                Fecha de Registro
                                                <span className="opacity-60">
                                                    {sort.key === "fecha_reclamacion" ? (sort.dir === "asc" ? <ChevronUp className="h-4" /> : <ChevronDown className="h-4" />) : <ArrowUpDown className="h-4" />}
                                                </span>
                                            </button>
                                        </th>
                                        <th className="px-4 py-3">
                                            <button type="button" onClick={() => toggleSort("ultimo_contacto_at")} className="inline-flex items-center gap-1 text-xs font-bold">
                                                Último Contacto
                                                <span className="opacity-60">
                                                    {sort.key === "ultimo_contacto_at" ? (sort.dir === "asc" ? <ChevronUp className="h-4" /> : <ChevronDown className="h-4" />) : <ArrowUpDown className="h-4" />}
                                                </span>
                                            </button>
                                        </th>
                                        <th className="px-4 py-3">Business</th>
                                        <th className="px-4 py-3">Asesor Digital</th>
                                        <th className="px-4 py-3">Asignado a</th>
                                        <th className="px-4 py-3">Estado</th>
                                        <th className="w-40 px-4 py-3">Canal de Contacto</th>
                                        <th className="px-4 py-3">Resumen</th>
                                        <th className="px-4 py-3">Acciones</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-black/30">
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
                                                        className="cursor-pointer hover:bg-white/[0.04]"
                                                        title="Doble clic para editar"
                                                    >
                                                        <td className="px-4 py-3 text-xs text-[#003057]">{row.agencia}</td>
                                                        <td className="max-w-32 px-4 py-3 truncate text-[#003057]">
                                                            {row.cliente_nombre + " " + row.cliente_apellidos}
                                                        </td>
                                                        <td className="px-4 py-3 text-[#003057]">{row.fecha_reclamacion || "—"}</td>
                                                        <td className="px-4 py-3 text-[#003057]">{fmtDTIntl(row.ultimo_contacto_at)}</td>
                                                        <td className="max-w-28 px-4 py-3 truncate text-[#003057]">{row.linea || "—"}</td>
                                                        <td className="max-w-28 px-4 py-3 truncate text-[#003057]">{row.asesor_digital || "—"}</td>
                                                        <td className="max-w-28 px-4 py-3 truncate text-[#003057]">{row.asesor_solicita || "—"}</td>

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
                                                                        <option key={s} value={s} className="bg-white text-[#003057]">
                                                                            {s}
                                                                        </option>
                                                                    ))}
                                                                </select>

                                                                <span className="pointer-events-none absolute right-2 inline-flex items-center">
                                                                    {isUpdating ? (
                                                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#003057]" />
                                                                    ) : (
                                                                        <ChevronDown className="h-3.5 w-3.5 text-[#003057]/70" />
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        <td className="px-4 py-3 text-[#003057]">
                                                            <span className="line-clamp-2">{row.origen}</span>
                                                        </td>

                                                        <td className="w-[320px] px-4 py-3 text-[#003057]">
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
                                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white shadow-sm disabled:opacity-60"
                                                                    title="Generar resumen"
                                                                >
                                                                    {generatingSummary[row.id_exp] ? (
                                                                        <Loader2 className="h-5 w-5 animate-spin text-[#003057]" />
                                                                    ) : (
                                                                        <ClipboardCheck className="h-5 w-5 text-[#003057]" />
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
                                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white shadow-sm transition hover:bg-neutral-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-[#003057]/30 active:scale-[0.98]"
                                                                    title="Agendar cita"
                                                                >
                                                                    <CalendarPlus className="h-5 w-5 text-[#003057]" />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        navigate(
                                                                            `/crm_volvo/comercial/prospectos/contacto?tel=${encodeURIComponent(row.telefono || "")}&direct=1`
                                                                        );
                                                                    }}
                                                                    className="flex h-9 w-[150px] items-center justify-between rounded-xl border border-black/10 bg-white px-3 shadow-sm transition hover:bg-neutral-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-[#003057]/30 active:scale-[0.98] disabled:opacity-50"
                                                                    title="Abrir chat"
                                                                    disabled={!row.telefono}
                                                                >
                                                                    <div className="flex min-w-0 items-center gap-2">
                                                                        <MessageSquareShare className="h-5 w-5 text-[#003057]" />
                                                                        <span className="min-w-0 truncate text-sm font-medium text-[#003057]">
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
                                                    <td colSpan={11} className="px-4 py-10 text-center text-[#003057]">
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
                                        className="rounded-3xl border border-black/10 bg-white p-4 text-left shadow-sm hover:bg-slate-50"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-extrabold text-[#003057]">
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
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#003057]/85 px-4 py-2 text-sm font-bold text-white/90 hover:bg-[#003057] hover:text-white disabled:opacity-60"
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
                                        <label className="inline-flex items-center gap-3 text-sm font-bold text-[#003057]">
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
                                        <div className="mb-1 text-sm font-bold text-[#003057]">Teléfono</div>
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
                                        <div className="mb-1 text-sm font-bold text-[#003057]">Volvo de sus sueños</div>
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
                                        <div className="mb-1 text-sm font-bold text-[#003057]">Estado</div>
                                        <select
                                            value={draft.estado || ""}
                                            onChange={(e) => setDraft((p) => ({ ...p, estado: e.target.value }))}
                                            className={[inputBase, inputOk].join(" ")}
                                        >
                                            {ESTADOS_PROSPECTO.map((s) => (
                                                <option key={s} value={s} className="bg-neutral-200">{s}</option>
                                            ))}
                                        </select>
                                        <div className="mt-2">
                                            <BadgeEstado value={draft.estado} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#003057]">Canal de Contacto</div>
                                        <OrigenPicker
                                            value={draft.origen}
                                            onChange={(v) => setDraft((p) => ({ ...p, origen: v }))}
                                        />
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-3 md:grid-cols-2">
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#003057]">Business</div>
                                        <LineaPicker
                                            value={draft.linea}
                                            onChange={(v) => setDraft((p) => ({ ...p, linea: v }))}
                                        />
                                    </div>
                                    <div className="mt-5">
                                        <div className="mb-1 text-sm font-bold text-[#003057]">Pauta de Origen</div>
                                        {loadingPautas ? (
                                            <div className="mt-2">
                                                <Skeleton className="h-10 w-full rounded-lg" />
                                                <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#003057]">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Cargando campañas recientes...
                                                </div>
                                            </div>
                                        ) : (
                                            <select
                                                value={draft.pauta || ""}
                                                onChange={(e) => setDraft((p) => ({ ...p, pauta: e.target.value }))}
                                                className={[inputBase, inputOk].join(" ")}
                                            >
                                                <option value="">— Selecciona una pauta —</option>
                                                {draft.pauta &&
                                                    !pautasOptions.some(
                                                        (item) => normalizeText(item.value) === normalizeText(draft.pauta)
                                                    ) ? (
                                                    <option value={draft.pauta}>{draft.pauta} (actual)</option>
                                                ) : null}
                                                {pautasOptions.map((item) => (
                                                    <option key={item.value} value={item.value}>{item.label}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
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
                                    className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-[#003057] outline-none"
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
                                className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-[#003057]"
                            />
                        </Field>
                        <Field label="Resumen generado" icon={ClipboardCheck}>
                            <textarea
                                value={summaryInfo.resumen || "Sin resumen disponible"}
                                disabled
                                rows={10}
                                className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-[#003057] outline-none"
                            />
                        </Field>
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Última actualización" icon={CalendarDays}>
                                <input
                                    value={summaryInfo.resumen_actualizado_at ? fmtDTIntl(summaryInfo.resumen_actualizado_at) : "—"}
                                    disabled
                                    className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-[#003057]"
                                />
                            </Field>
                            <Field label="Fuente" icon={BrainCircuit}>
                                <input
                                    value={summaryInfo.resumen_fuente || "—"}
                                    disabled
                                    className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-[#003057]"
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
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#003057]/85 px-4 py-2 text-sm font-bold text-white/90 hover:bg-[#003057] hover:text-white disabled:opacity-60"
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
                                className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-[#003057]"
                            />
                        </Field>
                        <Field label="Volvo de sus sueños" icon={CarFront}>
                            <input
                                value={agendaInfo.auto_interes || "—"}
                                disabled
                                className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-[#003057]"
                            />
                        </Field>
                        <Field label="Teléfono" icon={Phone}>
                            <input
                                value={agendaInfo.telefono || "—"}
                                disabled
                                className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-[#003057]"
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