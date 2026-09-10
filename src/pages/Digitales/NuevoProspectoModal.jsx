import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
    ArrowUpDown,
    Building2,
    Car,
    CarFront,
    ClipboardCheck,
    FileText,
    Gauge,
    Loader2,
    Save,
    User,
    Van,
    X,
} from "lucide-react";

import CONCESIONARIO from "/concesionario.png";
import WAP from "/whatsapp.svg";
import FB from "/facebook.svg";
import PHONE from "/phone.svg";

import { api } from "../../lib/apiPruebas";

const BRAND_BLACK = "#0A0A0A";

const DEFAULT_DEALERS = ["Volvo"];

const DEFAULT_ASESORES_DIGITALES = ["Mariana Tlamani"];

const DEFAULT_ASESORES = [
    "Enrique Vazquez Islas",
    "Ricardo Platas",
    "Verónica Del Rayo Galindo León",
    "Julio Camacho Barragán",
    "Fernanda Romero Aguilar",
    "Zaira Vanessa Hernández Gómez",
];

const DEFAULT_VEHICULOS = [
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

const ImgIcon = (src, alt) => (props) => <img src={src} alt={alt} {...props} />;

const lineaMeta = {
    Nuevos: { Icon: Car, label: "Nuevos" },
    Usados: { Icon: CarFront, label: "Usados" },
    Comerciales: { Icon: Van, label: "Comerciales" },
};

const origenMeta = {
    "Volvo-Concesionario": {
        Icon: ImgIcon(CONCESIONARIO, "Volvo-Concesionario"),
        label: "Volvo-Concesionario",
    },
    WhatsApp: {
        Icon: ImgIcon(WAP, "WhatsApp"),
        label: "WhatsApp",
    },
    Facebook: {
        Icon: ImgIcon(FB, "Facebook"),
        label: "Facebook",
    },
    "Llamada Entrante": {
        Icon: ImgIcon(PHONE, "Llamada Entrante"),
        label: "Llamada Entrante",
    },
};

function normalizeText(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function normalizarCanalContacto(value) {
    const canal = String(value || "").trim();
    if (canal === "Volvo-Concesionarios") return "Volvo-Concesionario";
    return canal;
}

function toDTLocal(isoOrNull) {
    if (!isoOrNull) return "";
    const s = String(isoOrNull);

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
        return s.slice(0, 16);
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        return `${s}T00:00`;
    }

    if (s.includes("T")) {
        return s.slice(0, 16);
    }

    return "";
}

function joinNombre(nombre, apellidos) {
    return `${String(nombre || "").trim()} ${String(apellidos || "").trim()}`.trim();
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

function toNullableNumber(value) {
    if (value === null || value === undefined || value === "") return null;

    const numero = Number(String(value).replace(/[^\d]/g, ""));
    return Number.isFinite(numero) && numero > 0 ? Math.round(numero) : null;
}

function fmtDTIntl(value) {
    if (!value) return "—";

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";

    return new Intl.DateTimeFormat("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(d);
}

function Skeleton({ className = "" }) {
    return <div className={`animate-pulse bg-slate-200/60 ${className}`} />;
}

function ModalSkeleton() {
    return (
        <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-lg border border-white/10 bg-neutral-200/50 p-4"
                >
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="mt-3 h-10 w-full rounded-lg" />
                </div>
            ))}

            <div className="md:col-span-2 rounded-lg border border-white/10 bg-neutral-200/50 p-4">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="mt-3 h-24 w-full rounded-lg" />
            </div>
        </div>
    );
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
    const badgeClass = map[key] || "bg-black/10 text-white/85 border-white/20";

    return (
        <span
            className={[
                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                badgeClass,
            ].join(" ")}
        >
            {value || "Sin estado"}
        </span>
    );
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

function OrigenPicker({ value, onChange, canalesPermitidos }) {
    const permitidos = Array.isArray(canalesPermitidos) && canalesPermitidos.length
        ? new Set(canalesPermitidos)
        : null;

    const items = Object.entries(origenMeta).filter(([key]) => {
        if (!permitidos) return true;
        return permitidos.has(key);
    });

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

function buildCreateDraft({
    agenciaInicial = "Volvo",
    asesorDigitalInicial = "Mariana Tlamani",
} = {}) {

    const now = new Date();
    const nowLocal =
        `${now.getFullYear()}-` +
        `${String(now.getMonth() + 1).padStart(2, "0")}-` +
        `${String(now.getDate()).padStart(2, "0")}T` +
        `${String(now.getHours()).padStart(2, "0")}:` +
        `${String(now.getMinutes()).padStart(2, "0")}`;

    return {
        id_exp: null,
        agencia: agenciaInicial || "Volvo",
        tiene_nombre: false,
        cliente_nombre: "",
        cliente_apellidos: "",
        nombre_cliente: "",
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
        asesor_digital: asesorDigitalInicial || "Mariana Tlamani",
        asesor_solicita: "",
        creado: nowLocal,
        primer_contacto_at: "",
        ultimo_contacto_at: "",
        resumen: "",
        resumen_actualizado_at: "",
        resumen_fuente: "",
    };
}

function prospectoToDraft(p) {
    const nombreCompleto = String(p?.nombre || "").trim();
    const tieneNombre = tieneNombreReal(nombreCompleto);

    return {
        id_exp: p?.id ?? null,
        agencia: p?.agencia || "",
        tiene_nombre: tieneNombre,
        nombre_cliente: tieneNombre ? nombreCompleto : "",
        cliente_nombre: "",
        cliente_apellidos: "",
        telefono: String(p?.telefono || ""),
        correo: p?.correo || "",
        linea: p?.business || "",
        origen: normalizarCanalContacto(p?.canal_contacto),
        pauta: p?.pauta || "",
        estado: p?.estado || "",
        motivo_descalificacion: p?.motivo_descalificacion || "",
        cliente_interes: p?.auto_interes || "",
        comentarios: p?.comentarios || "",
        enganche_monto: p?.enganche_monto ?? "",
        presupuesto_mensual: p?.presupuesto_mensual ?? "",
        buro_estado: p?.buro_estado || "",
        forma_pago: p?.forma_pago || "",
        tipo_cliente: p?.tipo_cliente || "",
        plazo_compra: p?.plazo_compra || "",
        uso_vehiculo: p?.uso_vehiculo || "",
        comprobacion_ingresos: p?.comprobacion_ingresos || "",
        id_cotizacion: p?.id_cotizacion || "",
        folio_solicitud_credito: p?.folio_solicitud_credito || "",
        solicitud_credito_estado: p?.solicitud_credito_estado || "",
        vin_facturado: p?.vin_facturado || "",
        vin_estatus_entrega: p?.vin_estatus_entrega || "",
        resumen: p?.resumen || "",
        resumen_actualizado_at: toDTLocal(p?.resumen_actualizado_at),
        resumen_fuente: p?.resumen_fuente || "",
        asesor_digital: p?.asesor_digital || "",
        asesor_solicita: p?.asesor_ventas || "",
        creado: toDTLocal(p?.creado),
        primer_contacto_at: toDTLocal(p?.primer_contacto_at),
        ultimo_contacto_at: toDTLocal(p?.ultimo_contacto_at),
    };
}

export default function NuevoProspectoModal({
    open,
    mode = "create",
    estadoInicial = "",
    prospectoId = null,
    onClose,
    onCreado,
    onActualizado,
    onGuardado,
    agencias = DEFAULT_DEALERS,
    vehiculos = DEFAULT_VEHICULOS,
    canales = Object.keys(origenMeta),
    asesoresDigitales = DEFAULT_ASESORES_DIGITALES,
    asesores = DEFAULT_ASESORES,
    agenciaInicial = "Volvo",
    asesorDigitalInicial = "Mariana Tlamani",
    isAdmin = true,
    userAgencias = [],
    contextoDigitalSesion = null,
}) {
    const [draft, setDraft] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);
    const [touchedSave, setTouchedSave] = useState(false);

    const [pautasMeta, setPautasMeta] = useState([]);
    const [loadingPautas, setLoadingPautas] = useState(false);

    const esEdicion = mode === "edit";

    const descalificacionForzada =
        normalizeText(estadoInicial) === "descalificado";

    const motivoDescalificacionPendiente =
        descalificacionForzada &&
        !String(draft?.motivo_descalificacion || "").trim();

    const dealersDisponibles =
        Array.isArray(agencias) && agencias.length
            ? agencias
            : DEFAULT_DEALERS;

    const vehiculosDisponibles =
        Array.isArray(vehiculos) && vehiculos.length
            ? vehiculos
            : DEFAULT_VEHICULOS;

    const asesoresDigitalesDisponibles =
        Array.isArray(asesoresDigitales) && asesoresDigitales.length
            ? asesoresDigitales
            : DEFAULT_ASESORES_DIGITALES;

    const asesoresDisponibles =
        Array.isArray(asesores) && asesores.length
            ? asesores
            : DEFAULT_ASESORES;

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

    const missing = useMemo(() => {
        if (!draft) return [];

        const m = [];

        const telefono = draft.telefono;

        if (
            telefono === null ||
            telefono === undefined ||
            String(telefono).trim() === ""
        ) {
            m.push("telefono");
        }

        if (
            normalizeText(draft.estado) === "descalificado" &&
            !String(draft.motivo_descalificacion || "").trim()
        ) {
            m.push("motivo_descalificacion");
        }

        return m;
    }, [draft]);

    const isInvalid = (key) => touchedSave && missing.includes(key);

    const telDigits = useMemo(
        () => String(draft?.telefono || "").replace(/\D/g, ""),
        [draft?.telefono]
    );

    const telIsOk = useMemo(
        () => /^(?:\d{10}|52\d{10})$/.test(telDigits),
        [telDigits]
    );

    const telIsNormalized = useMemo(
        () => /^52\d{10}$/.test(telDigits),
        [telDigits]
    );

    const telError = useMemo(() => {
        if (!open) return "";
        if (!draft) return "";
        if (!telDigits) return "";
        if (/^\d{10}$/.test(telDigits)) return "";
        if (/^52\d{10}$/.test(telDigits)) return "";

        if (telDigits.length < 10) {
            return "Número incompleto (mínimo 10 dígitos)";
        }

        if (telDigits.length === 11) {
            return "Número incorrecto (11 dígitos no válido)";
        }

        if (telDigits.length === 12 && !telDigits.startsWith("52")) {
            return "Número inválido: si tiene 12 dígitos debe iniciar con 52";
        }

        if (telDigits.length > 12) {
            return "Número incorrecto (máximo 12 dígitos)";
        }

        return "Número inválido";
    }, [open, draft, telDigits]);

    const telInvalid = Boolean(telError);

    const inputBase =
        "w-full rounded-lg border px-3 py-2.5 text-sm text-black font-semibold outline-none transition";

    const inputOk = "border-black/10 bg-neutral-100";
    const inputBad = "border-red-500 bg-red-50";

    const cargarPautasMeta = useCallback(async () => {
        if (typeof api.digitalesCampanasMeta !== "function") {
            setPautasMeta([]);
            return;
        }

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
            console.error(
                "Error cargando campañas de campanas_meta_volvo:",
                e
            );
            setPautasMeta([]);
        } finally {
            setLoadingPautas(false);
        }
    }, []);

    useEffect(() => {
        if (!open) {
            setDraft(null);
            setTouchedSave(false);
            setLoadingDetail(false);
            return;
        }

        let cancelled = false;

        async function prepararModal() {
            setTouchedSave(false);

            if (!esEdicion) {
                setDraft(
                    buildCreateDraft({
                        agenciaInicial:
                            agenciaInicial ||
                            dealersDisponibles[0] ||
                            "Volvo",
                        asesorDigitalInicial:
                            asesorDigitalInicial ||
                            asesoresDigitalesDisponibles[0] ||
                            "Mariana Tlamani",
                    })
                );
                return;
            }

            if (!prospectoId) {
                console.error(
                    "NuevoProspectoModal: mode='edit' requiere prospectoId"
                );
                return;
            }

            setLoadingDetail(true);

            try {
                const p = await api.digitalesGetProspecto(prospectoId);

                if (!cancelled) {
                    const nextDraft = prospectoToDraft(p);

                    if (estadoInicial) {
                        nextDraft.estado = estadoInicial;
                    }

                    setDraft(nextDraft);
                }
            } catch (e) {
                console.error(e);

                if (!cancelled) {
                    alert(
                        "No se pudo abrir el prospecto para editar (revisa consola)."
                    );
                    onClose?.();
                }
            } finally {
                if (!cancelled) {
                    setLoadingDetail(false);
                }
            }
        }

        prepararModal();

        return () => {
            cancelled = true;
        };
    }, [
            open,
            esEdicion,
            prospectoId,
            agenciaInicial,
            asesorDigitalInicial,
            estadoInicial,
        ]);

    useEffect(() => {
        if (!open) return;
        if (pautasMeta.length) return;

        cargarPautasMeta();
    }, [open, pautasMeta.length, cargarPautasMeta]);

    function closeModal() {
        if (saving) return;

        if (motivoDescalificacionPendiente) {
            setTouchedSave(true);
            return;
        }

        onClose?.();
    }

    async function save() {
        if (!draft || saving) return;

        setTouchedSave(true);

        if (missing.length) return;
        if (!telIsOk || telInvalid) return;

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
                        ? String(
                            draft.motivo_descalificacion || ""
                        ).trim()
                        : "",
                asesor_digital: asesorDigitalFinal,
                asesor_ventas: draft.asesor_solicita || "",
                auto_interes: draft.cliente_interes || "",
                comentarios: draft.comentarios || "",
                enganche_monto: toNullableNumber(draft.enganche_monto),
                presupuesto_mensual: toNullableNumber(
                    draft.presupuesto_mensual
                ),
                buro_estado: draft.buro_estado || "",
                forma_pago: draft.forma_pago || "",
                tipo_cliente: draft.tipo_cliente || "",
                plazo_compra: draft.plazo_compra || "",
                uso_vehiculo: draft.uso_vehiculo || "",
                comprobacion_ingresos:
                    draft.comprobacion_ingresos || "",
                id_cotizacion: String(
                    draft.id_cotizacion || ""
                ).trim(),
                folio_solicitud_credito: String(
                    draft.folio_solicitud_credito || ""
                ).trim(),
                solicitud_credito_estado:
                    draft.solicitud_credito_estado || "",
                vin_facturado: String(
                    draft.vin_facturado || ""
                )
                    .trim()
                    .toUpperCase(),
                vin_estatus_entrega:
                    draft.vin_estatus_entrega || "",
            };

            let saved;

            if (!esEdicion) {
                payload.primer_contacto_at =
                    draft.primer_contacto_at || null;
                payload.ultimo_contacto_at =
                    draft.ultimo_contacto_at || null;

                saved = await api.digitalesCreateProspecto(payload);

                onCreado?.(saved);
            } else {
                saved = await api.digitalesUpdateProspecto(
                    draft.id_exp,
                    payload
                );

                onActualizado?.(saved);
            }

            onGuardado?.(saved, esEdicion ? "edit" : "create");
            onClose?.();
        } catch (e) {
            console.error(e);
            alert("Error guardando el prospecto (revisa consola).");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal
            open={open}
            title={
                esEdicion
                    ? `Editar prospecto • ${draft?.id_exp || prospectoId || ""}`
                    : "Nuevo prospecto"
            }
            onClose={closeModal}
            footer={
                <>
                    <button
                        type="button"
                        onClick={closeModal}
                        disabled={saving || motivoDescalificacionPendiente}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-red-400 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-red-600 hover:text-white disabled:opacity-60"
                    >
                        <X className="h-4 w-4" />
                        Cancelar
                    </button>

                    <button
                        type="button"
                        onClick={save}
                        disabled={
                            saving ||
                            loadingDetail ||
                            motivoDescalificacionPendiente ||
                            telInvalid ||
                            (draft?.telefono ? !telIsOk : false)
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-black/85 px-4 py-2 text-sm font-bold text-white/90 hover:bg-black hover:text-white disabled:opacity-60"
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
                    {touchedSave && missing.length ? (
                        <div className="md:col-span-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <div className="font-extrabold">
                                Faltan campos obligatorios
                            </div>

                            <div className="mt-1 text-xs font-semibold">
                                {missing
                                    .map((k) => REQUIRED[k])
                                    .join(" • ")}
                            </div>
                        </div>
                    ) : null}

                    <Field label="Dealer" icon={Building2}>
                        <select
                            value={draft.agencia || ""}
                            disabled={!isAdmin && userAgencias.length <= 1}
                            onChange={(e) =>
                                setDraft((p) => ({
                                    ...p,
                                    agencia: e.target.value,
                                }))
                            }
                            className={[
                                inputBase,
                                isInvalid("agencia")
                                    ? inputBad
                                    : inputOk,
                            ].join(" ")}
                        >
                            <option value="" disabled>
                                Selecciona un dealer...
                            </option>

                            {(
                                isAdmin
                                    ? dealersDisponibles
                                    : userAgencias.length > 0
                                        ? userAgencias
                                        : dealersDisponibles
                            ).map((d) => (
                                <option key={d} value={d}>
                                    {d}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Asesor Digital" icon={User}>
                        <select
                            value={draft.asesor_digital || ""}
                            onChange={(e) =>
                                setDraft((p) => ({
                                    ...p,
                                    asesor_digital: e.target.value,
                                }))
                            }
                            className={[inputBase, inputOk].join(" ")}
                        >
                            <option value="">
                                — Selecciona —
                            </option>

                            {asesoresDigitalesDisponibles.map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Asignado a" icon={User}>
                        <select
                            value={draft.asesor_solicita || ""}
                            onChange={(e) =>
                                setDraft((p) => ({
                                    ...p,
                                    asesor_solicita: e.target.value,
                                }))
                            }
                            className={[inputBase, inputOk].join(" ")}
                        >
                            <option value="">
                                — Selecciona —
                            </option>

                            {asesoresDisponibles.map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
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
                                            checked={Boolean(
                                                draft.tiene_nombre
                                            )}
                                            onChange={(e) =>
                                                setDraft((p) => ({
                                                    ...p,
                                                    tiene_nombre:
                                                        e.target.checked,
                                                    nombre_cliente:
                                                        e.target.checked
                                                            ? p.nombre_cliente
                                                            : "",
                                                }))
                                            }
                                            className="h-4 w-4"
                                        />

                                        Nombre del Prospecto
                                    </label>

                                    <input
                                        value={
                                            draft.nombre_cliente || ""
                                        }
                                        onChange={(e) =>
                                            setDraft((p) => ({
                                                ...p,
                                                nombre_cliente:
                                                    e.target.value,
                                            }))
                                        }
                                        disabled={!draft.tiene_nombre}
                                        className={[
                                            inputBase,
                                            inputOk,
                                            !draft.tiene_nombre
                                                ? "cursor-not-allowed opacity-70"
                                                : "",
                                        ].join(" ")}
                                        placeholder={
                                            draft.tiene_nombre
                                                ? "Nombre"
                                                : "SIN NOMBRE"
                                        }
                                    />
                                </div>

                                <div>
                                    <div className="mb-1 text-sm font-bold text-black">
                                        Teléfono
                                    </div>

                                    <input
                                        maxLength={12}
                                        disabled={telIsNormalized}
                                        value={draft.telefono || ""}
                                        onChange={(e) =>
                                            setDraft((p) => ({
                                                ...p,
                                                telefono:
                                                    e.target.value
                                                        .replace(
                                                            /\D/g,
                                                            ""
                                                        )
                                                        .slice(0, 12),
                                            }))
                                        }
                                        className={[
                                            inputBase,
                                            telIsNormalized
                                                ? "cursor-not-allowed opacity-70"
                                                : "",
                                            isInvalid("telefono") ||
                                            telInvalid
                                                ? inputBad
                                                : inputOk,
                                        ].join(" ")}
                                    />

                                    {isInvalid("telefono") ? (
                                        <div className="mt-1 text-xs font-bold text-red-600">
                                            Teléfono es requerido.
                                        </div>
                                    ) : null}

                                    {!isInvalid("telefono") &&
                                    telError ? (
                                        <div className="mt-1 text-xs font-bold text-red-600">
                                            {telError}
                                        </div>
                                    ) : null}
                                </div>

                                <div>
                                    <div className="mb-1 text-sm font-bold text-black">
                                        Volvo de sus sueños
                                    </div>

                                    <select
                                        value={
                                            draft.cliente_interes || ""
                                        }
                                        onChange={(e) =>
                                            setDraft((p) => ({
                                                ...p,
                                                cliente_interes:
                                                    e.target.value,
                                            }))
                                        }
                                        className={[
                                            inputBase,
                                            inputOk,
                                        ].join(" ")}
                                    >
                                        <option value="" disabled>
                                            Selecciona un modelo...
                                        </option>

                                        {vehiculosDisponibles.map((d) => (
                                            <option key={d} value={d}>
                                                {d}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-3 md:grid-cols-2">
                                <div>
                                    <div className="mb-1 text-sm font-bold text-black">
                                        Estado
                                    </div>

                                    <select
                                        value={draft.estado || ""}
                                        onChange={(e) => {
                                            const estado =
                                                e.target.value;

                                            setDraft((p) => ({
                                                ...p,
                                                estado,
                                                motivo_descalificacion:
                                                    normalizeText(
                                                        estado
                                                    ) ===
                                                    "descalificado"
                                                        ? p.motivo_descalificacion ||
                                                          ""
                                                        : "",
                                            }));
                                        }}
                                        className={[
                                            inputBase,
                                            inputOk,
                                        ].join(" ")}
                                    >
                                        {ESTADOS_PROSPECTO.map((s) => (
                                            <option
                                                key={s}
                                                value={s}
                                                className="bg-neutral-200"
                                            >
                                                {s}
                                            </option>
                                        ))}
                                    </select>

                                    <div className="mt-2">
                                        <BadgeEstado
                                            value={draft.estado}
                                        />
                                    </div>

                                    {normalizeText(draft.estado) ===
                                    "descalificado" ? (
                                        <div className="mt-3">
                                            <div className="mb-1 text-sm font-bold text-black">
                                                Motivo de
                                                descalificación{" "}
                                                <span className="text-red-600">
                                                    *
                                                </span>
                                            </div>

                                            <select
                                                value={
                                                    draft.motivo_descalificacion ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    setDraft((p) => ({
                                                        ...p,
                                                        motivo_descalificacion:
                                                            e.target
                                                                .value,
                                                    }))
                                                }
                                                className={[
                                                    inputBase,
                                                    isInvalid(
                                                        "motivo_descalificacion"
                                                    )
                                                        ? inputBad
                                                        : inputOk,
                                                ].join(" ")}
                                            >
                                                <option value="">
                                                    — Selecciona el
                                                    motivo —
                                                </option>

                                                {MOTIVOS_DESCALIFICACION.map(
                                                    (motivo) => (
                                                        <option
                                                            key={
                                                                motivo
                                                            }
                                                            value={
                                                                motivo
                                                            }
                                                        >
                                                            {motivo}
                                                        </option>
                                                    )
                                                )}
                                            </select>

                                            {isInvalid(
                                                "motivo_descalificacion"
                                            ) ? (
                                                <div className="mt-1 text-xs font-bold text-red-600">
                                                    Selecciona el motivo
                                                    de descalificación.
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>

                                <div>
                                    <div className="mb-1 text-sm font-bold text-black">
                                        Canal de Contacto
                                    </div>

                                    <OrigenPicker
                                        value={draft.origen}
                                        onChange={(v) =>
                                            setDraft((p) => ({
                                                ...p,
                                                origen: v,
                                            }))
                                        }
                                        canalesPermitidos={canales}
                                    />
                                </div>
                            </div>

                            <div className="mt-5 grid gap-3 md:grid-cols-2">
                                <div>
                                    <div className="mb-1 text-sm font-bold text-black">
                                        Business
                                    </div>

                                    <LineaPicker
                                        value={draft.linea}
                                        onChange={(v) =>
                                            setDraft((p) => ({
                                                ...p,
                                                linea: v,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="mt-5">
                                    <div className="mb-1 flex items-center justify-between gap-2">
                                        <div className="text-sm font-bold text-black">
                                            Pauta de Origen
                                        </div>

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
                                        className={[
                                            inputBase,
                                            inputOk,
                                        ].join(" ")}
                                    >
                                        <option value="">
                                            {loadingPautas
                                                ? "Cargando campañas..."
                                                : "— Selecciona campaña —"}
                                        </option>

                                        {draft.pauta &&
                                        !pautasOptions.some(
                                            (item) =>
                                                normalizeText(
                                                    item.value
                                                ) ===
                                                normalizeText(
                                                    draft.pauta
                                                )
                                        ) ? (
                                            <option
                                                value={draft.pauta}
                                            >
                                                {draft.pauta} (actual)
                                            </option>
                                        ) : null}

                                        {pautasOptions.map((item) => (
                                            <option
                                                key={item.value}
                                                value={item.value}
                                            >
                                                {item.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </Field>
                    </div>

                    <div className="md:col-span-3">
                        <Field
                            label="Perfil financiero y de compra"
                            icon={Gauge}
                        >
                            <div className="grid gap-3 md:grid-cols-4">
                                <div>
                                    <div className="mb-1 text-sm font-bold text-black">
                                        Enganche disponible
                                    </div>

                                    <input
                                        type="number"
                                        min="0"
                                        inputMode="numeric"
                                        value={
                                            draft.enganche_monto || ""
                                        }
                                        onChange={(e) =>
                                            setDraft((p) => ({
                                                ...p,
                                                enganche_monto:
                                                    e.target.value.replace(
                                                        /\D/g,
                                                        ""
                                                    ),
                                            }))
                                        }
                                        className={[
                                            inputBase,
                                            inputOk,
                                        ].join(" ")}
                                        placeholder="Ej. 150000"
                                    />
                                </div>

                                <div>
                                    <div className="mb-1 text-sm font-bold text-black">
                                        Presupuesto mensual
                                    </div>

                                    <input
                                        type="number"
                                        min="0"
                                        inputMode="numeric"
                                        value={
                                            draft.presupuesto_mensual ||
                                            ""
                                        }
                                        onChange={(e) =>
                                            setDraft((p) => ({
                                                ...p,
                                                presupuesto_mensual:
                                                    e.target.value.replace(
                                                        /\D/g,
                                                        ""
                                                    ),
                                            }))
                                        }
                                        className={[
                                            inputBase,
                                            inputOk,
                                        ].join(" ")}
                                        placeholder="Ej. 18000"
                                    />
                                </div>

                                <div>
                                    <div className="mb-1 text-sm font-bold text-black">
                                        Buró de crédito
                                    </div>

                                    <select
                                        value={
                                            draft.buro_estado || ""
                                        }
                                        onChange={(e) =>
                                            setDraft((p) => ({
                                                ...p,
                                                buro_estado:
                                                    e.target.value,
                                            }))
                                        }
                                        className={[
                                            inputBase,
                                            inputOk,
                                        ].join(" ")}
                                    >
                                        {BURO_OPTIONS.map((item) => (
                                            <option
                                                key={item.value}
                                                value={item.value}
                                            >
                                                {item.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <div className="mb-1 text-sm font-bold text-black">
                                        Forma de pago
                                    </div>

                                    <select
                                        value={
                                            draft.forma_pago || ""
                                        }
                                        onChange={(e) =>
                                            setDraft((p) => ({
                                                ...p,
                                                forma_pago:
                                                    e.target.value,
                                            }))
                                        }
                                        className={[
                                            inputBase,
                                            inputOk,
                                        ].join(" ")}
                                    >
                                        {FORMA_PAGO_OPTIONS.map(
                                            (item) => (
                                                <option
                                                    key={item.value}
                                                    value={item.value}
                                                >
                                                    {item.label}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-4">
                                <div>
                                    <div className="mb-1 text-sm font-bold text-black">
                                        Tipo de cliente
                                    </div>

                                    <select
                                        value={
                                            draft.tipo_cliente || ""
                                        }
                                        onChange={(e) =>
                                            setDraft((p) => ({
                                                ...p,
                                                tipo_cliente:
                                                    e.target.value,
                                            }))
                                        }
                                        className={[
                                            inputBase,
                                            inputOk,
                                        ].join(" ")}
                                    >
                                        {TIPO_CLIENTE_OPTIONS.map(
                                            (item) => (
                                                <option
                                                    key={item.value}
                                                    value={item.value}
                                                >
                                                    {item.label}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <div className="mb-1 text-sm font-bold text-black">
                                        Plazo de compra
                                    </div>

                                    <select
                                        value={
                                            draft.plazo_compra || ""
                                        }
                                        onChange={(e) =>
                                            setDraft((p) => ({
                                                ...p,
                                                plazo_compra:
                                                    e.target.value,
                                            }))
                                        }
                                        className={[
                                            inputBase,
                                            inputOk,
                                        ].join(" ")}
                                    >
                                        {PLAZO_COMPRA_OPTIONS.map(
                                            (item) => (
                                                <option
                                                    key={
                                                        item ||
                                                        "vacio"
                                                    }
                                                    value={item}
                                                >
                                                    {item ||
                                                        "— Selecciona —"}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <div className="mb-1 text-sm font-bold text-black">
                                        Uso del vehículo
                                    </div>

                                    <input
                                        value={
                                            draft.uso_vehiculo || ""
                                        }
                                        onChange={(e) =>
                                            setDraft((p) => ({
                                                ...p,
                                                uso_vehiculo:
                                                    e.target.value,
                                            }))
                                        }
                                        className={[
                                            inputBase,
                                            inputOk,
                                        ].join(" ")}
                                        placeholder="Personal, familiar, empresarial..."
                                    />
                                </div>

                                <div>
                                    <div className="mb-1 text-sm font-bold text-black">
                                        Comprobación de ingresos
                                    </div>

                                    <input
                                        value={
                                            draft.comprobacion_ingresos ||
                                            ""
                                        }
                                        onChange={(e) =>
                                            setDraft((p) => ({
                                                ...p,
                                                comprobacion_ingresos:
                                                    e.target.value,
                                            }))
                                        }
                                        className={[
                                            inputBase,
                                            inputOk,
                                        ].join(" ")}
                                        placeholder="Nómina, estados de cuenta, negocio..."
                                    />
                                </div>
                            </div>
                        </Field>
                    </div>

                    <div className="md:col-span-3">
                        <Field
                            label="Seguimiento comercial"
                            icon={ClipboardCheck}
                        >
                            <div className="grid gap-3 md:grid-cols-4">
                                <div>
                                    <div className="mb-1 text-sm font-bold text-black">
                                        ID de cotización
                                    </div>

                                    <input
                                        value={
                                            draft.id_cotizacion || ""
                                        }
                                        onChange={(e) =>
                                            setDraft((p) => ({
                                                ...p,
                                                id_cotizacion:
                                                    e.target.value,
                                            }))
                                        }
                                        className={[
                                            inputBase,
                                            inputOk,
                                        ].join(" ")}
                                        placeholder="Folio o ID interno"
                                    />
                                </div>

                                <div>
                                    <div className="mb-1 text-sm font-bold text-black">
                                        Folio solicitud de crédito
                                    </div>

                                    <input
                                        value={
                                            draft.folio_solicitud_credito ||
                                            ""
                                        }
                                        onChange={(e) =>
                                            setDraft((p) => ({
                                                ...p,
                                                folio_solicitud_credito:
                                                    e.target.value,
                                            }))
                                        }
                                        className={[
                                            inputBase,
                                            inputOk,
                                        ].join(" ")}
                                        placeholder="Folio de la financiera"
                                    />
                                </div>

                                <div>
                                    <div className="mb-1 text-sm font-bold text-black">
                                        Estado de solicitud
                                    </div>

                                    <select
                                        value={
                                            draft.solicitud_credito_estado ||
                                            ""
                                        }
                                        onChange={(e) =>
                                            setDraft((p) => ({
                                                ...p,
                                                solicitud_credito_estado:
                                                    e.target.value,
                                            }))
                                        }
                                        className={[
                                            inputBase,
                                            inputOk,
                                        ].join(" ")}
                                    >
                                        {SOLICITUD_CREDITO_OPTIONS.map(
                                            (item) => (
                                                <option
                                                    key={item.value}
                                                    value={item.value}
                                                >
                                                    {item.label}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <div className="mb-1 text-sm font-bold text-black">
                                        VIN facturado
                                    </div>

                                    <input
                                        value={
                                            draft.vin_facturado || ""
                                        }
                                        onChange={(e) =>
                                            setDraft((p) => ({
                                                ...p,
                                                vin_facturado:
                                                    e.target.value
                                                        .toUpperCase()
                                                        .slice(0, 32),
                                            }))
                                        }
                                        className={[
                                            inputBase,
                                            inputOk,
                                        ].join(" ")}
                                        placeholder="VIN del vehículo"
                                    />
                                </div>
                            </div>

                            <div className="mt-4 max-w-sm">
                                <div className="mb-1 text-sm font-bold text-black">
                                    Estatus de entrega
                                </div>

                                <select
                                    value={
                                        draft.vin_estatus_entrega || ""
                                    }
                                    onChange={(e) =>
                                        setDraft((p) => ({
                                            ...p,
                                            vin_estatus_entrega:
                                                e.target.value,
                                        }))
                                    }
                                    className={[
                                        inputBase,
                                        inputOk,
                                    ].join(" ")}
                                >
                                    <option value="">
                                        — Sin definir —
                                    </option>
                                    <option value="entregado">
                                        Entregado
                                    </option>
                                    <option value="cancelado">
                                        Cancelado
                                    </option>
                                </select>
                            </div>
                        </Field>
                    </div>

                    <div className="md:col-span-1">
                        <Field
                            label="Comentarios Adicionales"
                            icon={FileText}
                        >
                            <textarea
                                value={draft.comentarios || ""}
                                onChange={(e) =>
                                    setDraft((p) => ({
                                        ...p,
                                        comentarios: e.target.value,
                                    }))
                                }
                                rows={4}
                                className={[
                                    inputBase,
                                    inputOk,
                                ].join(" ")}
                            />
                        </Field>
                    </div>

                    <div className="md:col-span-2">
                        <Field
                            label="Resumen de conversación"
                            icon={ClipboardCheck}
                        >
                            <textarea
                                value={draft.resumen || ""}
                                disabled
                                rows={5}
                                className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-black outline-none"
                            />

                            {draft.resumen_actualizado_at ? (
                                <div className="mt-2 text-xs font-semibold text-slate-500">
                                    Última actualización:{" "}
                                    {fmtDTIntl(
                                        draft.resumen_actualizado_at
                                    )}
                                    {draft.resumen_fuente
                                        ? ` • ${draft.resumen_fuente}`
                                        : ""}
                                </div>
                            ) : null}
                        </Field>
                    </div>
                </div>
            )}
        </Modal>
    );
}
