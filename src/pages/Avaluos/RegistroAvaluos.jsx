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
    Building2,
    MessageSquareText,
    Hash,
    Mail,
    BadgeDollarSign,
    Trophy,
    Gauge,
    ClipboardList,
    UserStar,
    Paperclip,
    Image as ImageIcon,
    Video,
    FileText,
    UploadCloud,
    Eye,
    Palette,
} from "lucide-react";
import { apiAvaluos } from "../../lib/apiAvaluos";
import { createPortal } from "react-dom";
import { useAuth } from "../../auth/AuthContext";

const BRAND_BLUE = "#131E5C";
const API_BASE = (
    import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com"
).replace(/\/$/, "");

function normalizeStr(v) {
    return String(v ?? "").trim();
}

function Skeleton({ className = "" }) {
    return (
        <div
            className={["animate-pulse rounded-md bg-black/10", className].join(" ")}
        />
    );
}

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 18 }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 w-24 rounded bg-slate-200/60" />
                </td>
            ))}
        </tr>
    );
}

function ModalSkeleton() {
    return (
        <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 14 }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-lg border border-white/10 bg-neutral-200/50 p-4"
                >
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-3 h-10 w-full rounded-lg" />
                </div>
            ))}
            <div className="md:col-span-2 rounded-lg border border-white/10 bg-neutral-200/50 p-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-3 h-24 w-full rounded-lg" />
            </div>
            <div className="md:col-span-3 rounded-lg border border-white/10 bg-neutral-200/50 p-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-3 h-28 w-full rounded-lg" />
            </div>
        </div>
    );
}

function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60]">
            <div
                className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
                onClick={onClose}
            />
            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-7xl overflow-hidden rounded-lg border border-[#131E5C] bg-neutral-100 shadow-2xl">
                    <div
                        className="flex items-center justify-between gap-3 px-5 py-4"
                        style={{ backgroundColor: BRAND_BLUE }}
                    >
                        <div className="min-w-0">
                            <div className="truncate text-base font-extrabold text-white">
                                {title}
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white hover:bg-white/15"
                            aria-label="Cerrar"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="max-h-[80vh] overflow-auto p-5">{children}</div>

                    {footer ? (
                        <div className="flex flex-col gap-2 border-t border-white/10 bg-white/[0.03] px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
                            {footer}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function Field({ label, icon: Icon, children, className = "" }) {
    return (
        <div
            className={[
                "rounded-lg border border-white/10 bg-neutral-200/50 p-4",
                className,
            ].join(" ")}
        >
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#131E5C]">
                {Icon ? <Icon className="h-4 w-4" /> : null}
                <span>{label}</span>
            </div>
            {children}
        </div>
    );
}

function FilterBlock({ label, children }) {
    return (
        <div className="rounded-lg">
            <div className="mb-2 text-xs font-extrabold tracking-wide text-[#131E5C]">
                {label}
            </div>
            {children}
        </div>
    );
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

function toDTLocal(isoOrNull) {
    if (!isoOrNull) return "";
    const s = String(isoOrNull);

    if (s.endsWith("Z")) {
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return "";
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
            d.getDate()
        )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16);
    return "";
}

function fromDTLocalToISO(valor) {
    const v = String(valor || "").trim();
    return v ? v : null;
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

function formatFileSize(bytes) {
    const size = Number(bytes || 0);
    if (!size) return "0 KB";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) {
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function resolveEvidenceUrl(rawUrl) {
    const value = String(rawUrl || "").trim();
    if (!value) return "";
    if (
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("blob:")
    ) {
        return value;
    }
    if (value.startsWith("/")) {
        return `${API_BASE}${value}`;
    }
    return `${API_BASE}/${value}`;
}

function inferEvidenceKind(source) {
    const tipo = String(source?.tipo || "").toLowerCase();
    if (tipo === "imagen" || tipo === "image") return "imagen";
    if (tipo === "video") return "video";

    const mime = String(source?.file?.type || source?.contentType || "").toLowerCase();
    if (mime.startsWith("image/")) return "imagen";
    if (mime.startsWith("video/")) return "video";

    const name = String(source?.nombre || source?.file?.name || "").toLowerCase();
    if (
        /\.(jpg|jpeg|png|gif|webp|bmp|svg|avif)$/i.test(name)
    ) {
        return "imagen";
    }
    if (
        /\.(mp4|webm|ogg|mov|avi|mkv|m4v)$/i.test(name)
    ) {
        return "video";
    }

    return "archivo";
}

function generateTempId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return `tmp-${crypto.randomUUID()}`;
    }
    return `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildLocalEvidenceItem(file) {
    const tipo = inferEvidenceKind({ file, nombre: file?.name });
    const previewUrl =
        tipo === "imagen" || tipo === "video" ? URL.createObjectURL(file) : "";

    return {
        _tmpId: generateTempId(),
        nombre: file?.name || "archivo",
        tipo,
        size: file?.size || 0,
        file,
        url: previewUrl,
        isLocal: true,
    };
}

function revokeEvidencePreview(item) {
    const url = String(item?.url || "");
    if (url.startsWith("blob:")) {
        try {
            URL.revokeObjectURL(url);
        } catch {
            // sin acción
        }
    }
}

function cleanupDraftResources(draft) {
    const nuevos = Array.isArray(draft?.evidencias_nuevas)
        ? draft.evidencias_nuevas
        : [];
    nuevos.forEach(revokeEvidencePreview);
}

function EvidenceTag({ tipo }) {
    const value = inferEvidenceKind({ tipo });

    if (value === "imagen") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                <ImageIcon className="h-3.5 w-3.5" />
                Imagen
            </span>
        );
    }

    if (value === "video") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700">
                <Video className="h-3.5 w-3.5" />
                Video
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-700">
            <FileText className="h-3.5 w-3.5" />
            Archivo
        </span>
    );
}

function EvidenceCard({ item, onRemove }) {
    const tipo = inferEvidenceKind(item);
    const url = resolveEvidenceUrl(item?.url || item?.archivo);
    const nombre = item?.nombre || item?.file?.name || "archivo";
    const size = item?.size || item?.file?.size || 0;

    return (
        <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="relative">
                {tipo === "imagen" && url ? (
                    <img
                        src={url}
                        alt={nombre}
                        className="aspect-video max-h-52 w-full object-cover"
                    />
                ) : tipo === "video" && url ? (
                    <video
                        src={url}
                        controls
                        className="aspect-video max-h-52 w-full bg-black object-cover"
                    />
                ) : (
                    <div className="flex aspect-video max-h-52 w-full items-center justify-center bg-slate-100">
                        <div className="px-3 text-center">
                            <FileText className="mx-auto h-10 w-10 text-slate-500" />
                            <div className="mt-2 text-xs font-bold text-slate-600">
                                Vista previa no disponible
                            </div>
                        </div>
                    </div>
                )}

                <button
                    type="button"
                    onClick={onRemove}
                    className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-black/60 text-white transition hover:bg-red-600"
                    title="Quitar evidencia"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            <div className="space-y-3 p-3">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div
                            className="max-w-full break-words text-sm font-bold text-[#131E5C] sm:truncate"
                            title={nombre}
                        >
                            {nombre}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                            {size ? formatFileSize(size) : "Archivo guardado"}
                        </div>
                    </div>

                    <div className="shrink-0">
                        <EvidenceTag tipo={tipo} />
                    </div>
                </div>

                {url ? (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#131E5C]/15 bg-[#131E5C]/5 px-3 py-2 text-xs font-bold text-[#131E5C] transition hover:bg-[#131E5C]/10 sm:w-auto"
                    >
                        <Eye className="h-4 w-4" />
                        Ver
                    </a>
                ) : null}
            </div>
        </div>
    );
}

function MobileCardList({ rows, loading, onEdit, onContext }) {
    return (
        <div className="lg:hidden">
            <div className="overflow-hidden rounded-lg bg-white/[0.03] shadow-lg">
                {loading ? (
                    <div className="grid gap-3 p-3 sm:grid-cols-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="rounded-lg border border-black/10 bg-white p-4 shadow-sm"
                            >
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="mt-3 h-4 w-28" />
                                <Skeleton className="mt-3 h-4 w-56" />
                                <Skeleton className="mt-4 h-8 w-24 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : rows.length === 0 ? (
                    <div className="px-4 py-10 text-center text-[#131E5C]">
                        No hay resultados con esos filtros.
                    </div>
                ) : (
                    <div className="grid gap-3 p-3 sm:grid-cols-2">
                        {rows.map((row) => {
                            const nombreCliente = row?.cliente?.nombre || "—";
                            const telefonoCliente = row?.cliente?.telefono || "—";
                            const evidenciasCount = Array.isArray(row?.evidencias)
                                ? row.evidencias.length
                                : 0;

                            return (
                                <div
                                    key={row.id}
                                    onClick={() => onEdit(row)}
                                    onContextMenu={(e) => onContext(e, row)}
                                    className="cursor-pointer rounded-lg border border-black/10 bg-white p-4 shadow-sm transition hover:shadow-md"
                                    title="Toca para editar"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 text-xs font-extrabold text-[#131E5C]">
                                                <CalendarDays className="h-4 w-4" />
                                                <span className="truncate">
                                                    {row.fecha_avaluo
                                                        ? toDTLocal(row.fecha_avaluo).replace("T", " ")
                                                        : "Sin fecha"}
                                                </span>
                                            </div>
                                            <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                                                <Building2 className="h-4 w-4" />
                                                <span className="truncate">{row.agencia || "—"}</span>
                                            </div>
                                        </div>

                                        <div className="rounded-full border border-[#131E5C]/20 bg-[#131E5C]/5 px-3 py-1 text-xs font-bold text-[#131E5C]">
                                            {row.etapa_proceso || "Sin etapa"}
                                        </div>
                                    </div>

                                    <div className="mt-3 grid gap-2">
                                        <div className="flex items-center gap-2 text-sm font-bold text-[#131E5C]">
                                            <User className="h-4 w-4" />
                                            <span className="truncate">{nombreCliente}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <Phone className="h-4 w-4 text-[#131E5C]" />
                                            <span className="truncate">{telefonoCliente}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <CarFront className="h-4 w-4 text-[#131E5C]" />
                                            <span className="truncate">
                                                {[row.marca_auto, row.modelo, row.anio_modelo]
                                                    .filter(Boolean)
                                                    .join(" ") || "—"}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <Palette className="h-4 w-4 text-[#131E5C]" />
                                            <span className="truncate">{row.color || "—"}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <BadgeDollarSign className="h-4 w-4 text-[#131E5C]" />
                                            <span className="truncate">
                                                Guía: {row.precio_guia || "—"} | Est.:{" "}
                                                {row.costo_estimado || "—"}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <Paperclip className="h-4 w-4 text-[#131E5C]" />
                                            <span>{evidenciasCount} evidencias</span>
                                        </div>

                                        <div className="mt-1 text-xs text-slate-600">
                                            <div className="flex items-start gap-2">
                                                <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-[#131E5C]" />
                                                <span className="line-clamp-2">
                                                    {row.descripcion || row.comentarios || "—"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function crearConceptoVacio() {
    return {
        id: null,
        descripcion: "",
        costo: "",
    };
}

function limpiarTextoMonto(valor) {
    return String(valor ?? "")
        .replace(/[^\d.,-]/g, "")
        .replace(/,/g, "");
}

function montoANumero(valor) {
    const limpio = limpiarTextoMonto(valor);
    if (!limpio || limpio === "-" || limpio === ".") return 0;
    const numero = Number(limpio);
    return Number.isFinite(numero) ? numero : 0;
}

function montoA2Decimales(valor) {
    return montoANumero(valor).toFixed(2);
}

function formatoMoneda(valor) {
    const numero = Number(valor || 0);
    return numero.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function normalizarConceptosAvaluo(item) {
    const posiblesConceptos = Array.isArray(item?.conceptos)
        ? item.conceptos
        : [];

    if (posiblesConceptos.length) {
        return posiblesConceptos.map((concepto) => ({
            id: concepto.id ?? null,
            descripcion: concepto.descripcion || "",
            costo: String(concepto.costo ?? ""),
        }));
    }
    const costoReparacion = montoANumero(item?.costo_reparacion);

    if (costoReparacion > 0) {
        return [
            {
                id: null,
                descripcion: "Costo de reparación registrado",
                costo: String(item.costo_reparacion || costoReparacion),
            },
        ];
    }

    return [crearConceptoVacio()];
}

function normalizarEvidenciasAvaluo(item) {
    if (!Array.isArray(item?.evidencias)) return [];

    return item.evidencias.map((ev) => ({
        ...ev,
        url: resolveEvidenceUrl(ev?.url || ev?.archivo),
        isLocal: false,
    }));
}

export default function RegistroAvaluos() {
    const { user } = useAuth();
    const fileInputRef = useRef(null);
    const draftRef = useRef(null);

    const isAdmin = useMemo(() => {
        const permisos = user?.permisos || [];
        const rol = String(user?.rol || "").trim().toLowerCase();
        return (
            rol === "administrador" ||
            permisos.includes("CRM_DIGITALES") ||
            permisos.includes("ALL") ||
            permisos.includes("USUARIOS_ADMIN")
        );
    }, [user]);

    const userAgencia = String(user?.agencia || "").trim();

    const [avaluos, setAvaluos] = useState([]);
    const [ctxMenu, setCtxMenu] = useState({
        open: false,
        x: 0,
        y: 0,
        row: null,
    });

    const [sort, setSort] = useState({ key: "fecha_avaluo", dir: "desc" });
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
    const [touchedSave, setTouchedSave] = useState(false);

    const DEALERS = useMemo(
        () => [
            "Volvo",
        ],
        []
    );

    const ASESORES = [
        "Enrique Vazquez Islas",
        "Ricardo Platas",
        "Verónica Del Rayo Galindo León",
        "Julio Camacho Barragán",
    ];
    const ETAPAS_PROCESO = [
        "Prospecto",
        "Pendiente de revisión",
        "En subasta",
        "Negociación",
        "Cerrado",
        "Descartado",
    ];

    const TIPO_TOMA = ["Canal", "Auto a Cuenta"];

    const MARCA = [
        "NISSAN",
        "CHEVROLET",
        "GMC",
        "CADILLAC",
        "VOLKSWAGEN",
        "AUDI",
        "SEAT",
        "CUPRA",
        "TOYOTA",
        "CHRYSLER",
        "DODGE",
        "JEEP",
        "RAM",
        "ALFA ROMEO",
        "FORD",
        "LINCOLN",
        "KIA",
        "MAZDA",
        "HYUNDAI",
        "HONDA",
        "MG",
        "CHIREY",
        "OMODA",
        "JAECOO",
        "BYD",
        "GEELY",
        "ZEEKR",
        "FOTON",
        "MITSIBUSHI",
        "SUBARU",
        "RENAULT",
        "VOLVO",
        "TESLA",
        "BMW",
    ];

    const REQUIRED = useMemo(
        () => ({
            cliente_telefono: "Teléfono",
            fecha_avaluo: "Fecha de avalúo",
        }),
        []
    );

    const missing = useMemo(() => {
        if (!draft) return [];
        const faltantes = [];

        for (const key of Object.keys(REQUIRED)) {
            const valor = draft[key];
            const vacio =
                valor === null ||
                valor === undefined ||
                (typeof valor === "string" && valor.trim() === "");

            if (vacio) faltantes.push(key);
        }

        return faltantes;
    }, [draft, REQUIRED]);

    const isInvalid = (key) => touchedSave && missing.includes(key);

    const telDigits = useMemo(() => {
        return String(draft?.cliente_telefono || "").replace(/\D/g, "");
    }, [draft?.cliente_telefono]);

    const telIsOk = useMemo(
        () => /^(?:\d{10}|52\d{10})$/.test(telDigits),
        [telDigits]
    );

    const telIsNormalized = useMemo(
        () => /^52\d{10}$/.test(telDigits),
        [telDigits]
    );

    const telError = useMemo(() => {
        if (!openModal || !draft || !telDigits) return "";

        if (/^\d{10}$/.test(telDigits)) return "";
        if (/^52\d{10}$/.test(telDigits)) return "";

        if (telDigits.length < 10) return "Número incompleto (mínimo 10 dígitos)";
        if (telDigits.length === 11)
            return "Número incorrecto (11 dígitos no válido)";
        if (telDigits.length === 12 && !telDigits.startsWith("52")) {
            return "Número inválido: si tiene 12 dígitos debe iniciar con 52";
        }
        if (telDigits.length > 12)
            return "Número incorrecto (máximo 12 dígitos)";
        return "Número inválido";
    }, [openModal, draft, telDigits]);

    const telInvalid = !!telError;

    const inputBase =
        "w-full rounded-lg border shadow-lg px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none";
    const inputOk = "border-black/10 bg-neutral-100";
    const inputBad = "border-red-500 bg-red-50";

    useEffect(() => {
        const onGlobal = () =>
            setCtxMenu((prev) => ({ ...prev, open: false, row: null }));
        window.addEventListener("click", onGlobal);
        window.addEventListener("scroll", onGlobal, true);
        window.addEventListener("resize", onGlobal);

        return () => {
            window.removeEventListener("click", onGlobal);
            window.removeEventListener("scroll", onGlobal, true);
            window.removeEventListener("resize", onGlobal);
        };
    }, []);

    useEffect(() => {
        draftRef.current = draft;
    }, [draft]);

    useEffect(() => {
        return () => {
            cleanupDraftResources(draftRef.current);
        };
    }, []);

    function toggleSort(key) {
        setSort((prev) => {
            if (prev.key !== key) return { key, dir: "asc" };
            return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
        });
    }

    const onRowContextMenu = (e, row) => {
        e.preventDefault();
        e.stopPropagation();
        setCtxMenu({ open: true, x: e.clientX, y: e.clientY, row });
    };

    const refreshList = async () => {
        setLoadingList(true);
        try {
            const data = await apiAvaluos.list();
            setAvaluos(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setAvaluos([]);
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        refreshList();
    }, []);

    const dealers = useMemo(() => {
        const set = new Set(
            (avaluos || []).map((item) => normalizeStr(item.agencia)).filter(Boolean)
        );
        const lista = ["Todos", ...Array.from(set)];

        if (!isAdmin && userAgencia) {
            return ["Todos", userAgencia];
        }

        return lista;
    }, [avaluos, isAdmin, userAgencia]);

    const filtered = useMemo(() => {
        const q = filters.q.trim().toLowerCase();
        const desdeInt = ymdToInt(filters.rangoDesde);
        const hastaInt = ymdToInt(filters.rangoHasta);

        return (avaluos || []).filter((item) => {
            if (
                !isAdmin &&
                userAgencia &&
                normalizeStr(item.agencia) !== normalizeStr(userAgencia)
            ) {
                return false;
            }

            const nombreCliente = normalizeStr(item?.cliente?.nombre);
            const telefonoCliente = normalizeStr(item?.cliente?.telefono);

            const matchQ =
                !q ||
                normalizeStr(item.agencia).toLowerCase().includes(q) ||
                normalizeStr(item.asesor_ventas).toLowerCase().includes(q) ||
                normalizeStr(item.marca_auto).toLowerCase().includes(q) ||
                normalizeStr(item.modelo).toLowerCase().includes(q) ||
                normalizeStr(item.anio_modelo).toLowerCase().includes(q) ||
                normalizeStr(item.serie).toLowerCase().includes(q) ||
                normalizeStr(item.kilometraje).toLowerCase().includes(q) ||
                normalizeStr(item.precio_guia).toLowerCase().includes(q) ||
                normalizeStr(item.costo_reparacion).toLowerCase().includes(q) ||
                normalizeStr(item.costo_estimado).toLowerCase().includes(q) ||
                normalizeStr(item.oferta_economica).toLowerCase().includes(q) ||
                normalizeStr(item.color).toLowerCase().includes(q) ||
                normalizeStr(item.descripcion).toLowerCase().includes(q) ||
                normalizeStr(item.ganador_subasta).toLowerCase().includes(q) ||
                normalizeStr(item.etapa_proceso).toLowerCase().includes(q) ||
                normalizeStr(item.comentarios).toLowerCase().includes(q) ||
                nombreCliente.toLowerCase().includes(q) ||
                telefonoCliente.toLowerCase().includes(q);

            const matchAgencia =
                filters.agencia === "Todos" ||
                normalizeStr(item.agencia) === normalizeStr(filters.agencia);

            let matchRango = true;

            if (desdeInt !== null || hastaInt !== null) {
                const ymd = item.fecha_avaluo ? toYMDLocal(item.fecha_avaluo) : "";
                const ymdInt = ymdToInt(ymd);

                if (!ymdInt) return false;
                if (desdeInt !== null && ymdInt < desdeInt) matchRango = false;
                if (hastaInt !== null && ymdInt > hastaInt) matchRango = false;
            }

            return matchQ && matchAgencia && matchRango;
        });
    }, [avaluos, filters, isAdmin, userAgencia]);

    const sorted = useMemo(() => {
        const data = [...filtered];
        const { key, dir } = sort;
        const mult = dir === "asc" ? 1 : -1;

        return data.sort((a, b) => {
            if (key === "fecha_avaluo") {
                const ta = a.fecha_avaluo ? new Date(a.fecha_avaluo).getTime() : 0;
                const tb = b.fecha_avaluo ? new Date(b.fecha_avaluo).getTime() : 0;
                return (ta - tb) * mult;
            }

            if (key === "cliente_nombre") {
                const va = normalizeStr(a?.cliente?.nombre).toLowerCase();
                const vb = normalizeStr(b?.cliente?.nombre).toLowerCase();
                if (va < vb) return -1 * mult;
                if (va > vb) return 1 * mult;
                return 0;
            }

            if (key === "evidencias_count") {
                const va = Array.isArray(a?.evidencias) ? a.evidencias.length : 0;
                const vb = Array.isArray(b?.evidencias) ? b.evidencias.length : 0;
                return (va - vb) * mult;
            }

            const va = normalizeStr(a?.[key]).toLowerCase();
            const vb = normalizeStr(b?.[key]).toLowerCase();

            if (va < vb) return -1 * mult;
            if (va > vb) return 1 * mult;
            return 0;
        });
    }, [filtered, sort]);

    const openCreate = () => {
        cleanupDraftResources(draft);
        setTouchedSave(false);
        setMode("create");

        const agenciaDefault = isAdmin ? "" : userAgencia;

        setDraft({
            id: null,
            cliente_id: null,
            agencia: agenciaDefault,
            cliente_nombre: "",
            cliente_telefono: "",
            cliente_correo: "",
            fecha_avaluo: "",
            asesor_ventas: "",
            marca_auto: "",
            modelo: "",
            anio_modelo: "",
            serie: "",
            kilometraje: "",
            precio_guia: "",
            costo_reparacion: "",
            costo_estimado: "",
            oferta_economica: "",
            color: "",
            descripcion: "",
            conceptos: [crearConceptoVacio()],
            ganador_subasta: "",
            etapa_proceso: "",
            tipo_toma: "",
            comentarios: "",
            evidencias_existentes: [],
            evidencias_nuevas: [],
            delete_evidencia_ids: [],
        });

        setOpenModal(true);
    };

    const openEdit = async (row) => {
        if (!row?.id) return;

        try {
            cleanupDraftResources(draft);
            setTouchedSave(false);
            setMode("edit");
            setLoadingDetail(true);
            setOpenModal(true);

            const item = await apiAvaluos.get(row.id);

            if (
                !isAdmin &&
                userAgencia &&
                normalizeStr(item.agencia) !== normalizeStr(userAgencia)
            ) {
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
                cliente_correo: item?.cliente?.correo || "",
                fecha_avaluo: toDTLocal(item.fecha_avaluo),
                asesor_ventas: item.asesor_ventas || "",
                marca_auto: item.marca_auto || "",
                modelo: item.modelo || "",
                anio_modelo: item.anio_modelo || "",
                serie: item.serie || "",
                kilometraje: item.kilometraje || "",
                precio_guia: item.precio_guia || "",
                costo_reparacion: item.costo_reparacion || "",
                costo_estimado: item.costo_estimado || "",
                oferta_economica: item.oferta_economica || "",
                color: item.color || "",
                descripcion: item.descripcion || "",
                conceptos: normalizarConceptosAvaluo(item),
                ganador_subasta: item.ganador_subasta || "",
                etapa_proceso: item.etapa_proceso || "",
                tipo_toma: item.tipo_toma || "",
                comentarios: item.comentarios || "",
                evidencias_existentes: normalizarEvidenciasAvaluo(item),
                evidencias_nuevas: [],
                delete_evidencia_ids: [],
            });
        } catch (error) {
            console.error(error);
            alert("No se pudo abrir el avalúo.");
            setOpenModal(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const closeModal = () => {
        if (saving) return;
        cleanupDraftResources(draft);
        setOpenModal(false);
        setDraft(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const totalConceptos = useMemo(() => {
        return (draft?.conceptos || []).reduce((acc, item) => {
            return acc + montoANumero(item?.costo);
        }, 0);
    }, [draft?.conceptos]);

    const agregarConcepto = () => {
        setDraft((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                conceptos: [...(prev.conceptos || []), crearConceptoVacio()],
            };
        });
    };

    const actualizarConcepto = (index, campo, valor) => {
        setDraft((prev) => {
            if (!prev) return prev;

            const conceptos = [...(prev.conceptos || [])];
            conceptos[index] = {
                ...conceptos[index],
                [campo]: campo === "costo" ? limpiarTextoMonto(valor) : valor,
            };

            return {
                ...prev,
                conceptos,
            };
        });
    };

    const eliminarConcepto = (index) => {
        setDraft((prev) => {
            if (!prev) return prev;

            const conceptos = (prev.conceptos || []).filter((_, i) => i !== index);

            return {
                ...prev,
                conceptos: conceptos.length ? conceptos : [crearConceptoVacio()],
            };
        });
    };

    const eliminarAvaluo = async (row) => {
        if (!row?.id) return;

        if (
            !isAdmin &&
            userAgencia &&
            normalizeStr(row.agencia) !== normalizeStr(userAgencia)
        ) {
            alert("No tienes permisos para eliminar registros de otra agencia.");
            return;
        }

        const ok = confirm(
            `¿Eliminar el avalúo de ${row?.cliente?.nombre || row?.cliente?.telefono || "cliente"
            }?`
        );
        if (!ok) return;

        try {
            await apiAvaluos.remove(row.id);
            setAvaluos((prev) => prev.filter((item) => item.id !== row.id));
            setCtxMenu({ open: false, x: 0, y: 0, row: null });
        } catch (error) {
            console.error(error);
            alert("No se pudo eliminar el avalúo.");
        }
    };

    const handleAddFiles = (fileList) => {
        const files = Array.from(fileList || []);
        if (!files.length) return;

        const nuevos = files.map((file) => buildLocalEvidenceItem(file));

        setDraft((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                evidencias_nuevas: [...(prev.evidencias_nuevas || []), ...nuevos],
            };
        });
    };

    const removeNuevaEvidencia = (tmpId) => {
        setDraft((prev) => {
            if (!prev) return prev;

            const target = (prev.evidencias_nuevas || []).find(
                (item) => item._tmpId === tmpId
            );
            if (target) revokeEvidencePreview(target);

            return {
                ...prev,
                evidencias_nuevas: (prev.evidencias_nuevas || []).filter(
                    (item) => item._tmpId !== tmpId
                ),
            };
        });
    };

    const removeEvidenciaExistente = (id) => {
        setDraft((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                evidencias_existentes: (prev.evidencias_existentes || []).filter(
                    (item) => item.id !== id
                ),
                delete_evidencia_ids: [
                    ...(prev.delete_evidencia_ids || []),
                    id,
                ].filter((value, index, arr) => arr.indexOf(value) === index),
            };
        });
    };

    const save = async () => {
        if (!draft || saving) return;
        if (!telIsOk) return;

        setTouchedSave(true);
        if (missing.length) return;

        setSaving(true);

        try {
            const agenciaFinal = isAdmin ? normalizeStr(draft.agencia || "") : userAgencia;

            const payload = {
                agencia: agenciaFinal,
                ...(draft.cliente_id ? { cliente_id: draft.cliente_id } : {}),
                nombre: draft.cliente_nombre || "",
                telefono: normalizeStr(draft.cliente_telefono),
                correo: draft.cliente_correo || "",
                fecha_avaluo: fromDTLocalToISO(draft.fecha_avaluo),
                asesor_ventas: draft.asesor_ventas || "",
                marca_auto: draft.marca_auto || "",
                modelo: draft.modelo || "",
                anio_modelo: draft.anio_modelo || "",
                serie: draft.serie || "",
                kilometraje: draft.kilometraje || "",
                precio_guia: draft.precio_guia || "",
                costo_reparacion: montoA2Decimales(totalConceptos),
                conceptos: (draft.conceptos || [])
                    .map((item) => ({
                        descripcion: String(item.descripcion || "").trim(),
                        costo: montoA2Decimales(item.costo),
                    }))
                    .filter((item) => item.descripcion || montoANumero(item.costo) > 0),
                costo_estimado: draft.costo_estimado || "",
                oferta_economica: draft.oferta_economica || "",
                color: draft.color || "",
                descripcion: draft.descripcion || "",
                ganador_subasta: draft.ganador_subasta || "",
                etapa_proceso: draft.etapa_proceso || "",
                tipo_toma: draft.tipo_toma || "",
                comentarios: draft.comentarios || "",
                delete_evidencia_ids: draft.delete_evidencia_ids || [],
                evidencias_nuevas: (draft.evidencias_nuevas || []).map(
                    (item) => item.file
                ),
            };

            if (mode === "create") {
                await apiAvaluos.create(payload);
            } else {
                await apiAvaluos.update(draft.id, payload);
            }

            await refreshList();
            closeModal();
        } catch (error) {
            console.error(error);
            alert(error.message || "Error guardando el avalúo.");
        } finally {
            setSaving(false);
        }
    };

    const resetFilters = () => {
        setFilters({
            q: "",
            agencia: "Todos",
            rangoDesde: "",
            rangoHasta: "",
        });
    };

    const setHoy = () => {
        const hoy = toYMDLocal(new Date());
        setFilters((prev) => ({
            ...prev,
            rangoDesde: hoy,
            rangoHasta: hoy,
        }));
    };

    const totalEvidenciasDraft =
        (draft?.evidencias_existentes?.length || 0) +
        (draft?.evidencias_nuevas?.length || 0);

    return (
        <div className="w-full">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="font-vw-header truncate text-lg font-extrabold text-[#131E5C]">
                        Avalúos
                    </h2>
                    {!isAdmin && userAgencia ? (
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Agencia asignada:{" "}
                            <span className="text-[#131E5C]">{userAgencia}</span>
                        </p>
                    ) : null}
                </div>

                <button
                    onClick={openCreate}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm text-white shadow-sm hover:bg-[#131E5C]/80"
                >
                    <Plus className="h-4 w-4" />
                    Nuevo Avalúo
                </button>
            </div>

            <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="grid gap-3 md:grid-cols-12">
                    <div className="md:col-span-6">
                        <FilterBlock label="Búsqueda">
                            <div className="flex items-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2">
                                <Search className="h-4 w-4 text-[#131E5C]" />
                                <input
                                    value={filters.q}
                                    onChange={(e) =>
                                        setFilters((prev) => ({ ...prev, q: e.target.value }))
                                    }
                                    placeholder="Buscar por cliente, teléfono, serie, modelo, color, descripción..."
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
                                onChange={(e) =>
                                    setFilters((prev) => ({ ...prev, agencia: e.target.value }))
                                }
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            >
                                {dealers.map((dealer) => (
                                    <option
                                        key={dealer}
                                        value={dealer}
                                        className="bg-neutral-100 text-[#131E5C]"
                                    >
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
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        rangoDesde: e.target.value,
                                    }))
                                }
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            />
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-6">
                        <FilterBlock label="Hasta">
                            <input
                                type="date"
                                value={filters.rangoHasta}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        rangoHasta: e.target.value,
                                    }))
                                }
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            />
                        </FilterBlock>
                    </div>
                </div>
            </div>

            <MobileCardList
                rows={sorted}
                loading={loadingList}
                onEdit={openEdit}
                onContext={onRowContextMenu}
            />

            <div className="hidden overflow-hidden rounded-lg bg-white/[0.03] shadow-lg lg:block">
                <div className="overflow-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="font-vw-header border border-black bg-[#131E5C] text-xs text-white">
                            <tr>
                                <th className="whitespace-nowrap px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("fecha_avaluo")}
                                        className="inline-flex items-center gap-1 text-xs font-bold"
                                    >
                                        Fecha de Avalúo
                                        <span className="opacity-60">
                                            {sort.key === "fecha_avaluo" ? (
                                                sort.dir === "asc" ? (
                                                    <ChevronUp className="h-4" />
                                                ) : (
                                                    <ChevronDown className="h-4" />
                                                )
                                            ) : (
                                                <ArrowUpDown className="h-4" />
                                            )}
                                        </span>
                                    </button>
                                </th>

                                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                    Dealer
                                </th>
                                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                    Asesor Ventas
                                </th>
                                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                    Cliente
                                </th>
                                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                    Marca de Auto
                                </th>
                                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                    Modelo
                                </th>

                                <th className="whitespace-nowrap px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("anio_modelo")}
                                        className="inline-flex items-center gap-1 text-xs font-bold"
                                    >
                                        Año Modelo
                                        <span className="opacity-60">
                                            {sort.key === "anio_modelo" ? (
                                                sort.dir === "asc" ? (
                                                    <ChevronUp className="h-4" />
                                                ) : (
                                                    <ChevronDown className="h-4" />
                                                )
                                            ) : (
                                                <ArrowUpDown className="h-4" />
                                            )}
                                        </span>
                                    </button>
                                </th>

                                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                    Serie
                                </th>

                                <th className="whitespace-nowrap px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("kilometraje")}
                                        className="inline-flex items-center gap-1 text-xs font-bold"
                                    >
                                        Kilometraje
                                        <span className="opacity-60">
                                            {sort.key === "kilometraje" ? (
                                                sort.dir === "asc" ? (
                                                    <ChevronUp className="h-4" />
                                                ) : (
                                                    <ChevronDown className="h-4" />
                                                )
                                            ) : (
                                                <ArrowUpDown className="h-4" />
                                            )}
                                        </span>
                                    </button>
                                </th>

                                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                    Precio Guía
                                </th>

                                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                    Costo Reparación
                                </th>

                                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                    Costo Estimado
                                </th>

                                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                    Oferta Económica
                                </th>

                                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                    Color
                                </th>

                                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                    Ganador Subasta
                                </th>

                                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                    Etapa del Proceso
                                </th>

                                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                    Evidencias
                                </th>

                                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                    Descripción
                                </th>

                                <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                    Comentarios
                                </th>
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
                                    {sorted.map((row) => (
                                        <tr
                                            key={row.id}
                                            onDoubleClick={() => openEdit(row)}
                                            onContextMenu={(e) => onRowContextMenu(e, row)}
                                            className="cursor-pointer hover:bg-white/[0.04]"
                                            title="Doble clic para editar"
                                        >
                                            <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                {row.fecha_avaluo
                                                    ? toDTLocal(row.fecha_avaluo).replace("T", " ")
                                                    : "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 font-semibold text-[#131E5C]">
                                                {row.agencia || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                {row.asesor_ventas || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                {row?.cliente?.nombre || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                {row.marca_auto || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                {row.modelo || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                {row.anio_modelo || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                {row.serie || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                {row.kilometraje || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                {row.precio_guia || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                {row.costo_reparacion || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                {row.costo_estimado || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                {row.oferta_economica || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                {row.color || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                {row.ganador_subasta || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                {row.etapa_proceso || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                {Array.isArray(row?.evidencias)
                                                    ? row.evidencias.length
                                                    : 0}
                                            </td>
                                            <td className="min-w-[240px] px-4 py-3 text-[#131E5C]">
                                                <span className="line-clamp-2">
                                                    {row.descripcion || "—"}
                                                </span>
                                            </td>
                                            <td className="min-w-[240px] px-4 py-3 text-[#131E5C]">
                                                <span className="line-clamp-2">
                                                    {row.comentarios || "—"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}

                                    {sorted.length === 0 ? (
                                        <tr>
                                            <td colSpan={18} className="px-4 py-10 text-center text-[#131E5C]">
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
                        onDelete={async (row) => {
                            await eliminarAvaluo(row);
                            setCtxMenu({ open: false, x: 0, y: 0, row: null });
                        }}
                        onClose={() => setCtxMenu({ open: false, x: 0, y: 0, row: null })}
                    />
                </div>
            </div>

            <Modal
                open={openModal}
                title={mode === "create" ? "Nuevo Avalúo" : `Editar Avalúo • ${draft?.id}`}
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
                            disabled={
                                saving ||
                                loadingDetail ||
                                telInvalid ||
                                (draft?.cliente_telefono ? !telIsOk : false)
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C]/85 px-4 py-2 text-sm font-bold text-white/90 hover:bg-[#131E5C] hover:text-white disabled:opacity-60"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
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
                                onChange={(e) =>
                                    setDraft((prev) => ({ ...prev, agencia: e.target.value }))
                                }
                                disabled={!isAdmin}
                                className={[
                                    inputBase,
                                    inputOk,
                                    !isAdmin ? "cursor-not-allowed opacity-75" : "",
                                ].join(" ")}
                            >
                                <option value="" disabled>
                                    Selecciona un dealer...
                                </option>
                                {(isAdmin ? DEALERS : userAgencia ? [userAgencia] : DEALERS).map(
                                    (dealer) => (
                                        <option key={dealer} value={dealer}>
                                            {dealer}
                                        </option>
                                    )
                                )}
                            </select>
                        </Field>

                        <Field label="Fecha de avalúo" icon={CalendarDays}>
                            <input
                                type="datetime-local"
                                value={draft.fecha_avaluo}
                                onChange={(e) =>
                                    setDraft((prev) => ({
                                        ...prev,
                                        fecha_avaluo: e.target.value,
                                    }))
                                }
                                className={[
                                    inputBase,
                                    isInvalid("fecha_avaluo") ? inputBad : inputOk,
                                ].join(" ")}
                            />
                            {isInvalid("fecha_avaluo") ? (
                                <div className="mt-2 text-xs font-bold text-red-600">
                                    Fecha de avalúo es requerida.
                                </div>
                            ) : null}
                        </Field>

                        <Field label="Asesor de ventas" icon={UserStar}>
                            <select
                                value={draft.asesor_ventas || ""}
                                onChange={(e) =>
                                    setDraft((prev) => ({
                                        ...prev,
                                        asesor_ventas: e.target.value,
                                    }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                            >
                                <option value="">Selecciona un asesor...</option>
                                {ASESORES.map((asesor) => (
                                    <option key={asesor} value={asesor}>
                                        {asesor}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Nombre del cliente" icon={User}>
                            <input
                                value={draft.cliente_nombre}
                                onChange={(e) =>
                                    setDraft((prev) => ({
                                        ...prev,
                                        cliente_nombre: e.target.value,
                                    }))
                                }
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
                                        cliente_telefono: e.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 12),
                                    }))
                                }
                                disabled={mode === "edit" || telIsNormalized}
                                className={[
                                    inputBase,
                                    isInvalid("cliente_telefono") || telInvalid
                                        ? inputBad
                                        : inputOk,
                                    mode === "edit" || telIsNormalized
                                        ? "cursor-not-allowed opacity-75"
                                        : "",
                                ].join(" ")}
                            />
                            {isInvalid("cliente_telefono") ? (
                                <div className="mt-2 text-xs font-bold text-red-600">
                                    Teléfono es requerido.
                                </div>
                            ) : null}
                            {!isInvalid("cliente_telefono") && telError ? (
                                <div className="mt-2 text-xs font-bold text-red-600">
                                    {telError}
                                </div>
                            ) : null}
                        </Field>

                        <Field label="Correo" icon={Mail}>
                            <input
                                type="email"
                                value={draft.cliente_correo}
                                onChange={(e) =>
                                    setDraft((prev) => ({
                                        ...prev,
                                        cliente_correo: e.target.value,
                                    }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                                placeholder="correo@dominio.com"
                            />
                        </Field>

                        <Field label="Marca de auto" icon={CarFront}>
                            <select
                                value={draft.marca_auto}
                                onChange={(e) =>
                                    setDraft((prev) => ({ ...prev, marca_auto: e.target.value }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                            >
                                <option value="">Selecciona una marca...</option>
                                {MARCA.map((marca) => (
                                    <option key={marca} value={marca}>
                                        {marca}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Modelo" icon={CarFront}>
                            <input
                                value={draft.modelo}
                                onChange={(e) =>
                                    setDraft((prev) => ({ ...prev, modelo: e.target.value }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                                placeholder="Ej. Jetta"
                            />
                        </Field>
                        <div className="grid grid-cols-2">
                            <Field label="Año modelo" icon={CalendarDays}>
                                <input
                                    value={draft.anio_modelo}
                                    onChange={(e) =>
                                        setDraft((prev) => ({
                                            ...prev,
                                            anio_modelo: e.target.value
                                                .replace(/[^\d]/g, "")
                                                .slice(0, 4),
                                        }))
                                    }
                                    className={[inputBase, inputOk].join(" ")}
                                    placeholder="Ej. 2022"
                                />
                            </Field>
                            <Field label="Kilometraje" icon={Gauge}>
                                <input
                                    value={draft.kilometraje}
                                    onChange={(e) =>
                                        setDraft((prev) => ({
                                            ...prev,
                                            kilometraje: e.target.value,
                                        }))
                                    }
                                    className={[inputBase, inputOk].join(" ")}
                                    placeholder="Ej. 45000"
                                />
                            </Field>
                        </div>
                        <Field label="Serie" icon={Hash}>
                            <input
                                value={draft.serie}
                                onChange={(e) =>
                                    setDraft((prev) => ({ ...prev, serie: e.target.value }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                                placeholder="Número de serie"
                            />
                        </Field>

                        <Field label="Precio Estimado Cliente" icon={BadgeDollarSign}>
                            <input
                                value={draft.precio_guia}
                                onChange={(e) =>
                                    setDraft((prev) => ({
                                        ...prev,
                                        precio_guia: e.target.value,
                                    }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                                placeholder="Ej. $230,000"
                            />
                        </Field>

                        <Field label="Costo reparación" icon={BadgeDollarSign}>
                            <input
                                value={formatoMoneda(totalConceptos)}
                                readOnly
                                className={[inputBase, inputOk, "bg-slate-100 cursor-not-allowed"].join(" ")}
                                placeholder="Se calcula automáticamente"
                            />
                            <div className="mt-2 text-xs font-semibold text-slate-500">
                                Este monto se calcula automáticamente con la suma de los conceptos de valuación.
                            </div>
                        </Field>

                        <Field label="Costo estimado" icon={BadgeDollarSign}>
                            <input
                                value={draft.costo_estimado}
                                onChange={(e) =>
                                    setDraft((prev) => ({
                                        ...prev,
                                        costo_estimado: e.target.value,
                                    }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                                placeholder="Ej. $35,000"
                            />
                        </Field>

                        <Field label="Oferta económica" icon={BadgeDollarSign}>
                            <input
                                value={draft.oferta_economica}
                                onChange={(e) =>
                                    setDraft((prev) => ({
                                        ...prev,
                                        oferta_economica: e.target.value,
                                    }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                                placeholder="Ej. $240,000"
                            />
                        </Field>

                        <Field label="Color" icon={Palette}>
                            <input
                                value={draft.color}
                                onChange={(e) =>
                                    setDraft((prev) => ({ ...prev, color: e.target.value }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                                placeholder="Ej. Blanco perlado"
                            />
                        </Field>

                        <Field label="Ganador de subasta" icon={Trophy}>
                            <input
                                value={draft.ganador_subasta}
                                onChange={(e) =>
                                    setDraft((prev) => ({
                                        ...prev,
                                        ganador_subasta: e.target.value,
                                    }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                                placeholder="Nombre del ganador"
                            />
                        </Field>
                        <div className="grid grid-cols-2">
                            <Field label="Etapa del proceso" icon={ClipboardList}>
                                <select
                                    value={draft.etapa_proceso || ""}
                                    onChange={(e) =>
                                        setDraft((prev) => ({
                                            ...prev,
                                            etapa_proceso: e.target.value,
                                        }))
                                    }
                                    className={[inputBase, inputOk].join(" ")}
                                >
                                    <option value="">Selecciona una etapa...</option>
                                    {ETAPAS_PROCESO.map((etapa) => (
                                        <option key={etapa} value={etapa}>
                                            {etapa}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Tipo de toma" icon={ClipboardList}>
                                <select
                                    value={draft.tipo_toma || ""}
                                    onChange={(e) =>
                                        setDraft((prev) => ({
                                            ...prev,
                                            tipo_toma: e.target.value,
                                        }))
                                    }
                                    className={[inputBase, inputOk].join(" ")}
                                >
                                    <option value="">Selecciona un tipo...</option>
                                    {TIPO_TOMA.map((tipo) => (
                                        <option key={tipo} value={tipo}>
                                            {tipo}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        </div>
                        <Field label="Comentarios" icon={MessageSquareText}>
                            <textarea
                                value={draft.comentarios}
                                onChange={(e) =>
                                    setDraft((prev) => ({
                                        ...prev,
                                        comentarios: e.target.value,
                                    }))
                                }
                                className={[inputBase, inputOk, "min-h-[30px]"].join(" ")}
                                placeholder="Notas internas..."
                            />
                        </Field>

                        <Field label="Evidencias" icon={Paperclip} className="lg:col-span-3 sm:col-span-1 ">
                            <div className="space-y-4">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.7z"
                                    className="hidden"
                                    onChange={(e) => {
                                        handleAddFiles(e.target.files);
                                        e.target.value = "";
                                    }}
                                />

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#131E5C]/25 bg-[#131E5C]/5 px-4 py-6 text-center text-[#131E5C] transition hover:bg-[#131E5C]/10 sm:flex-row sm:text-left"
                                >
                                    <UploadCloud className="h-6 w-6" />
                                    <div className="min-w-0">                                        <div className="text-sm font-extrabold">
                                        Agregar fotos, videos o archivos
                                    </div>
                                        <div className="text-xs font-semibold text-slate-500">
                                            Puedes seleccionar varios archivos al mismo tiempo. Límite sugerido: 50 MB por archivo.
                                        </div>
                                    </div>
                                </button>

                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-[#131E5C]/10 px-3 py-1 text-xs font-bold text-[#131E5C]">
                                        Total: {totalEvidenciasDraft}
                                    </span>

                                    {(draft.delete_evidencia_ids || []).length > 0 ? (
                                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                                            Por eliminar: {draft.delete_evidencia_ids.length}
                                        </span>
                                    ) : null}

                                    {(draft.evidencias_nuevas || []).length > 0 ? (
                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                                            Nuevas: {draft.evidencias_nuevas.length}
                                        </span>
                                    ) : null}
                                </div>

                                {(draft.evidencias_existentes?.length || 0) > 0 ? (
                                    <div>
                                        <div className="mb-2 text-sm font-extrabold text-[#131E5C]">
                                            Evidencias guardadas
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">                                            {draft.evidencias_existentes.map((item) => (
                                            <EvidenceCard
                                                key={`existente-${item.id}`}
                                                item={item}
                                                onRemove={() => removeEvidenciaExistente(item.id)}
                                            />
                                        ))}
                                        </div>
                                    </div>
                                ) : null}

                                {(draft.evidencias_nuevas?.length || 0) > 0 ? (
                                    <div>
                                        <div className="mb-2 text-sm font-extrabold text-[#131E5C]">
                                            Evidencias nuevas
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">                                            {draft.evidencias_nuevas.map((item) => (
                                            <EvidenceCard
                                                key={item._tmpId}
                                                item={item}
                                                onRemove={() => removeNuevaEvidencia(item._tmpId)}
                                            />
                                        ))}
                                        </div>
                                    </div>
                                ) : null}

                                {totalEvidenciasDraft === 0 ? (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
                                        Aún no has agregado evidencias a este avalúo.
                                    </div>
                                ) : null}
                            </div>
                        </Field>

                        <div className="col-span-3">
                            <Field label="Valuación" icon={ClipboardList}>
                                <div className="space-y-4">
                                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm">
                                                <thead className="bg-[#131E5C] text-white">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left font-bold">Descripción</th>
                                                        <th className="px-4 py-3 text-left font-bold">Costo</th>
                                                        <th className="px-4 py-3 text-center font-bold">Acción</th>
                                                    </tr>
                                                </thead>

                                                <tbody className="divide-y divide-slate-200">
                                                    {(draft.conceptos || []).map((concepto, index) => (
                                                        <tr key={`concepto-${concepto.id || index}`}>
                                                            <td className="px-4 py-3 align-top">
                                                                <input
                                                                    value={concepto.descripcion}
                                                                    onChange={(e) =>
                                                                        actualizarConcepto(index, "descripcion", e.target.value)
                                                                    }
                                                                    className={[inputBase, inputOk].join(" ")}
                                                                    placeholder="Ej. Hojalatería de fascia delantera"
                                                                />
                                                            </td>

                                                            <td className="px-4 py-3 align-top min-w-[180px]">
                                                                <input
                                                                    value={concepto.costo}
                                                                    onChange={(e) =>
                                                                        actualizarConcepto(index, "costo", e.target.value)
                                                                    }
                                                                    className={[inputBase, inputOk].join(" ")}
                                                                    placeholder="0.00"
                                                                    inputMode="decimal"
                                                                />
                                                            </td>

                                                            <td className="px-4 py-3 align-top text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => eliminarConcepto(index)}
                                                                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                                                    title="Eliminar concepto"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>

                                                <tfoot className="border-t border-slate-200 bg-slate-50">
                                                    <tr>
                                                        <td className="px-4 py-3 text-right font-extrabold text-[#131E5C]">
                                                            Total reparación
                                                        </td>
                                                        <td className="px-4 py-3 font-extrabold text-[#131E5C]">
                                                            {formatoMoneda(totalConceptos)}
                                                        </td>
                                                        <td className="px-4 py-3" />
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={agregarConcepto}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#131E5C]/90 px-4 py-3 font-bold text-white hover:bg-[#131E5C]"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Agregar concepto
                                    </button>
                                </div>
                            </Field>
                        </div>

                    </div>
                )}
            </Modal>
        </div>
    );
}