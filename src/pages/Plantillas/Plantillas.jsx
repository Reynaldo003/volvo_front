//src/pages/Plantillas/Plantillas.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    AlertCircle,
    Braces,
    CheckCircle2,
    Clock3,
    Edit3,
    FileText,
    Loader2,
    Plus,
    RefreshCw,
    Search,
    ShieldAlert,
    Trash2,
    X,
} from "lucide-react";
import { api } from "../../lib/apiPruebas";
import { useAuth } from "../../auth/AuthContext";

const inputCls = "w-full rounded-xl border border-[#E4E7F0] bg-white px-3.5 py-2.5 text-sm text-[#1A1F3C] outline-none transition placeholder:text-[#C8CEDF] focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10";
const textareaCls = `${inputCls} resize-y`;

const STATUS_CFG = {
    APPROVED: { label: "Aprobada", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    PENDING: { label: "En revisión", cls: "border-amber-200 bg-amber-50 text-amber-700" },
    REJECTED: { label: "Rechazada", cls: "border-red-200 bg-red-50 text-red-700" },
    PAUSED: { label: "Pausada", cls: "border-orange-200 bg-orange-50 text-orange-700" },
    DISABLED: { label: "Deshabilitada", cls: "border-gray-200 bg-gray-100 text-gray-600" },
    IN_APPEAL: { label: "En apelación", cls: "border-blue-200 bg-blue-50 text-blue-700" },
    PENDING_DELETION: { label: "Pendiente de eliminación", cls: "border-slate-200 bg-slate-50 text-slate-700" },
    FLAGGED: { label: "Con observaciones", cls: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700" },
    DELETED: { label: "Eliminada", cls: "border-slate-200 bg-slate-100 text-slate-600" },
};

const DEFAULT_RULES = [
    "Debe responder a una solicitud, cita o proceso que el cliente ya inició.",
    "Debe informar, confirmar o actualizar un proceso existente.",
    "Evita promociones, descuentos, precios especiales y llamados de compra.",
    "No mezcles una actualización operativa con recomendaciones comerciales.",
    "Usa variables para datos concretos: nombre, fecha, hora, folio o modelo solicitado.",
];

const MARKETING_SIGNALS = [
    ["promoción", 28], ["promocion", 28], ["oferta", 28], ["descuento", 30],
    ["bono", 24], ["cashback", 30], ["gratis", 25], ["sin costo", 22],
    ["precio especial", 30], ["meses sin intereses", 30], ["enganche desde", 28],
    ["mensualidad desde", 28], ["aprovecha", 24], ["por tiempo limitado", 28],
    ["últimos días", 25], ["ultimos dias", 25], ["estrena", 24], ["compra", 18],
    ["cotiza", 18], ["descubre", 16], ["nuevo lanzamiento", 25],
    ["agenda una prueba", 18], ["visítanos", 16], ["visitanos", 16],
];

const UTILITY_ANCHORS = [
    "confirmamos tu cita", "recordatorio de tu cita", "tu solicitud",
    "solicitud registrada", "seguimiento de tu solicitud", "folio", "pedido",
    "factura", "pago recibido", "servicio programado", "mantenimiento programado",
    "documento pendiente", "cambio solicitado", "prueba de manejo programada",
];

function normalizeText(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function normalizePhone(value) {
    const digits = String(value || "").replace(/\D/g, "");

    if (!digits) return "";
    if (digits.startsWith("521") && digits.length === 13) return `52${digits.slice(3)}`;
    if (digits.length === 10) return `52${digits}`;
    if (digits.length === 12 && digits.startsWith("52")) return digits;

    return digits;
}

function getUserPhone(user) {
    return normalizePhone(
        user?.telefono ||
        user?.numero_asesor ||
        user?.whatsapp_number ||
        user?.phone ||
        "",
    );
}

function emptyDraft() {
    return {
        id: "",
        name: "",
        language: "es_MX",
        category: "UTILITY",
        headerEnabled: false,
        headerText: "",
        headerExamples: {},
        preservedHeader: null,
        body: "",
        bodyExamples: {},
        footer: "",
        buttons: [],
        aceptarRiesgo: false,
        allowCategoryChange: true,
    };
}

function normalizeName(value) {
    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
        .replace(/_+/g, "_");
}

function variableIndexes(text) {
    const found = [...String(text || "").matchAll(/\{\{(\d+)\}\}/g)].map((match) => Number(match[1]));
    return [...new Set(found)].sort((a, b) => a - b);
}

function normalizeVariablesAndExamples(text, examples = {}) {
    const mapping = new Map();
    let nextIndex = 1;

    const normalizedText = String(text || "").replace(/\{\{(\d+)\}\}/g, (_, rawIndex) => {
        const oldIndex = Number(rawIndex);

        if (!mapping.has(oldIndex)) {
            mapping.set(oldIndex, nextIndex);
            nextIndex += 1;
        }

        return `{{${mapping.get(oldIndex)}}}`;
    });

    const normalizedExamples = {};

    mapping.forEach((newIndex, oldIndex) => {
        normalizedExamples[newIndex] = String(examples?.[oldIndex] || "");
    });

    return {
        text: normalizedText,
        examples: normalizedExamples,
    };
}

function insertTokenAtSelection(text, token, element) {
    const value = String(text || "");
    const start = Number.isInteger(element?.selectionStart) ? element.selectionStart : value.length;
    const end = Number.isInteger(element?.selectionEnd) ? element.selectionEnd : start;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const prefix = before && !/\s$/.test(before) ? " " : "";
    const suffix = after && !/^\s/.test(after) ? " " : "";
    const nextText = `${before}${prefix}${token}${suffix}${after}`;

    return {
        text: nextText,
        caret: before.length + prefix.length + token.length + suffix.length,
    };
}

function extractExamples(component, type) {
    if (!component) return {};
    const values = type === "header"
        ? component?.example?.header_text || []
        : component?.example?.body_text?.[0] || [];

    return Object.fromEntries(values.map((value, index) => [index + 1, String(value ?? "")]));
}

function draftFromTemplate(template) {
    const components = Array.isArray(template?.components_meta) ? template.components_meta : [];
    const header = components.find((item) => String(item?.type || "").toUpperCase() === "HEADER");
    const body = components.find((item) => String(item?.type || "").toUpperCase() === "BODY");
    const footer = components.find((item) => String(item?.type || "").toUpperCase() === "FOOTER");
    const buttons = components.find((item) => String(item?.type || "").toUpperCase() === "BUTTONS");
    const headerFormat = String(header?.format || "TEXT").toUpperCase();

    return {
        ...emptyDraft(),
        id: String(template?.id || ""),
        name: String(template?.name || template?.key || ""),
        language: String(template?.language || template?.idioma || "es_MX"),
        category: String(template?.category || "UTILITY").toUpperCase(),
        headerEnabled: Boolean(header),
        headerText: headerFormat === "TEXT" ? String(header?.text || "") : "",
        headerExamples: extractExamples(header, "header"),
        preservedHeader: header && headerFormat !== "TEXT" ? header : null,
        body: String(body?.text || ""),
        bodyExamples: extractExamples(body, "body"),
        footer: String(footer?.text || ""),
        buttons: Array.isArray(buttons?.buttons)
            ? buttons.buttons.map((button) => ({
                type: String(button?.type || "QUICK_REPLY").toUpperCase(),
                text: String(button?.text || ""),
                url: String(button?.url || ""),
                phone_number: String(button?.phone_number || ""),
                example: Array.isArray(button?.example) ? String(button.example[0] || "") : "",
            }))
            : [],
    };
}

function buildComponents(draft) {
    const components = [];

    if (draft.preservedHeader) {
        components.push(draft.preservedHeader);
    } else if (draft.headerEnabled && draft.headerText.trim()) {
        const vars = variableIndexes(draft.headerText);
        const header = { type: "HEADER", format: "TEXT", text: draft.headerText.trim() };
        if (vars.length) header.example = { header_text: vars.map((index) => String(draft.headerExamples[index] || "")) };
        components.push(header);
    }

    const bodyVars = variableIndexes(draft.body);
    const body = { type: "BODY", text: draft.body.trim() };
    if (bodyVars.length) body.example = { body_text: [bodyVars.map((index) => String(draft.bodyExamples[index] || ""))] };
    components.push(body);

    if (draft.footer.trim()) components.push({ type: "FOOTER", text: draft.footer.trim() });

    const buttons = draft.buttons
        .filter((button) => button.text.trim())
        .map((button) => {
            const base = { type: button.type, text: button.text.trim() };
            if (button.type === "URL") {
                base.url = button.url.trim();
                if (variableIndexes(button.url).length && button.example.trim()) base.example = [button.example.trim()];
            }
            if (button.type === "PHONE_NUMBER") base.phone_number = button.phone_number.trim();
            return base;
        });

    if (buttons.length) components.push({ type: "BUTTONS", buttons });
    return components;
}

function analyzeRisk(draft) {
    const text = [draft.headerText, draft.body, draft.footer, ...draft.buttons.flatMap((b) => [b.text, b.url])]
        .join(" ")
        .toLowerCase();
    let score = 0;
    const findings = [];

    MARKETING_SIGNALS.forEach(([signal, weight]) => {
        if (text.includes(signal)) {
            score += weight;
            findings.push(signal);
        }
    });

    const anchors = UTILITY_ANCHORS.filter((anchor) => text.includes(anchor));
    if (anchors.length) score = Math.max(0, score - Math.min(20, anchors.length * 7));
    score = Math.min(100, score);

    return {
        score,
        level: score >= 45 ? "alto" : score >= 18 ? "medio" : "bajo",
        findings,
        anchors,
        requiresConfirmation: draft.category === "UTILITY" && score >= 18,
    };
}

function getReturnedCategory(response) {
    const candidates = [
        response?.category,
        response?.meta?.category,
        response?.meta?.data?.category,
        response?.payload?.category,
    ];

    return String(candidates.find(Boolean) || "").toUpperCase().trim();
}

function StatusBadge({ status }) {
    const key = String(status || "").toUpperCase();
    const cfg = STATUS_CFG[key] || { label: key || "Sin estado", cls: "border-gray-200 bg-gray-50 text-gray-600" };
    return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${cfg.cls}`}>{cfg.label}</span>;
}

function Modal({ open, title, onClose, children, footer }) {
    useEffect(() => {
        if (!open) return undefined;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <button className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} aria-label="Cerrar" />
            <div className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
                <div className="flex items-center justify-between border-b border-[#E4E7F0] px-6 py-4">
                    <div>
                        <h2 className="text-base font-bold text-[#1A1F3C]">{title}</h2>
                        <p className="mt-0.5 text-base text-[#8891AD]">Meta revisará el contenido y asignará el estado final.</p>
                    </div>
                    <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E4E7F0] text-[#8891AD] hover:bg-[#F7F8FC]"><X className="h-4 w-4" /></button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
                <div className="border-t border-[#E4E7F0] bg-[#F7F8FC] px-6 py-4">{footer}</div>
            </div>
        </div>
    );
}

function RiskDialog({ data, saving, onClose, onConfirm }) {
    useEffect(() => {
        if (!data) return undefined;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, [data]);

    if (!data) return null;

    const alreadyChanged = data.type === "reclassified";
    const findings = data.analysis?.riesgo_marketing?.hallazgos || data.analysis?.hallazgos || [];
    const score = data.analysis?.riesgo_marketing?.score ?? data.analysis?.score ?? 0;

    return (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
            <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={saving ? undefined : onClose} aria-label="Cerrar advertencia" />

            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="border-b border-amber-200 bg-amber-50 px-6 py-5">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-amber-950">
                                {alreadyChanged ? "Meta cambió la categoría" : "La plantilla puede ser Marketing"}
                            </h3>
                            <p className="mt-1 text-sm leading-relaxed text-amber-900">
                                {alreadyChanged
                                    ? `La categoría solicitada era ${data.requestedCategory || "UTILITY"}, pero Meta respondió con ${data.detectedCategory || "MARKETING"}.`
                                    : "El análisis del CRM detectó contenido comercial. Meta puede aprobarla como Marketing aunque hayas seleccionado Utility."}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 px-6 py-5">
                    {!alreadyChanged && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Riesgo detectado</span>
                                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">{score}/100</span>
                            </div>

                            {findings.length > 0 && (
                                <div className="mt-3 space-y-1.5">
                                    {findings.slice(0, 6).map((finding, index) => (
                                        <p key={`${finding?.texto || finding}-${index}`} className="text-xs leading-relaxed text-amber-900">
                                            • {finding?.texto || finding}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <p className="text-sm leading-relaxed text-[#515778]">
                        {alreadyChanged
                            ? "La plantilla ya fue enviada. Revisa su categoría y estado en la lista después de sincronizar."
                            : "Puedes regresar a editar el texto o enviarlo aceptando que Meta ajuste la categoría automáticamente."}
                    </p>
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-[#E4E7F0] bg-[#F7F8FC] px-6 py-4 sm:flex-row sm:justify-end">
                    {!alreadyChanged && (
                        <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-[#E4E7F0] bg-white px-5 py-2.5 text-sm font-bold text-[#515778] disabled:opacity-50">
                            Volver a editar
                        </button>
                    )}

                    <button type="button" onClick={alreadyChanged ? onClose : onConfirm} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#131E5C] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        {alreadyChanged ? "Entendido" : "Enviar y permitir reclasificación"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Toast({ data, onClose }) {
    useEffect(() => {
        if (!data) return undefined;
        const timer = window.setTimeout(onClose, 3800);
        return () => window.clearTimeout(timer);
    }, [data, onClose]);

    if (!data) return null;

    const isError = data.type === "error";

    return (
        <div className={`fixed bottom-6 right-6 z-[180] flex max-w-md items-start gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-2xl ${isError ? "bg-red-600" : "bg-emerald-600"}`}>
            {isError ? <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />}
            <span className="flex-1">{data.message}</span>
            <button type="button" onClick={onClose} className="opacity-75 transition hover:opacity-100" aria-label="Cerrar aviso">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

function VariableExamples({ title, text, values, onChange, onRemove }) {
    const indexes = variableIndexes(text);
    if (!indexes.length) return null;

    return (
        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3">
            <div className="mb-3">
                <p className="text-[13px] font-bold uppercase tracking-wider text-blue-800">Datos variables de {title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-blue-700">
                    Estos campos son obligatorios porque Meta necesita ejemplos reales para revisar la plantilla.
                </p>
            </div>

            <div className="space-y-2">
                {indexes.map((index) => {
                    const empty = !String(values[index] || "").trim();

                    return (
                        <div key={index} className={`rounded-xl border bg-white p-3 ${empty ? "border-red-200" : "border-blue-100"}`}>
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-black text-blue-800">
                                    {index}
                                </div>

                                <label className="min-w-0 flex-1 text-sm font-semibold text-blue-900">
                                    Dato variable {index} <span className="text-red-600">*</span>
                                    <input
                                        required
                                        value={values[index] || ""}
                                        onChange={(event) => onChange(index, event.target.value)}
                                        className={`${inputCls} mt-1 bg-white ${empty ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""}`}
                                        placeholder={index === 1 ? "Ejemplo: Reynaldo" : "Escribe un ejemplo real"}
                                    />
                                    <span className={`mt-1 block text-[12px] font-normal ${empty ? "text-red-600" : "text-blue-700"}`}>
                                        {empty ? "Este ejemplo es obligatorio." : "Este valor solo se usa como ejemplo durante la revisión."}
                                    </span>
                                </label>

                                <button
                                    type="button"
                                    onClick={() => onRemove(index)}
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50"
                                    title={`Quitar dato variable ${index}`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function TemplatePreview({ draft }) {
    const replace = (text, examples) => String(text || "").replace(/\{\{(\d+)\}\}/g, (_, index) => examples[Number(index)] || `{{${index}}}`);

    return (
        <div className="rounded-2xl border border-[#D9E0DA] bg-[#E9E4DC] p-4">
            <p className="mb-3 text-[12px] font-bold uppercase tracking-widest text-[#6D756D]">Vista previa</p>
            <div className="ml-auto max-w-md rounded-xl rounded-tr-sm bg-[#D9FDD3] p-3 shadow-sm">
                {draft.preservedHeader && <p className="mb-2 text-xs font-bold text-[#1A1F3C]">Encabezado multimedia existente</p>}
                {draft.headerEnabled && draft.headerText && <p className="mb-2 text-sm font-bold text-[#1A1F3C]">{replace(draft.headerText, draft.headerExamples)}</p>}
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#1A1F3C]">{replace(draft.body, draft.bodyExamples) || "Escribe el cuerpo de la plantilla..."}</p>
                {draft.footer && <p className="mt-2 text-[11px] text-[#667085]">{draft.footer}</p>}
                {draft.buttons.filter((button) => button.text).map((button, index) => (
                    <div key={`${button.type}-${index}`} className="mt-2 border-t border-[#BFD9BA] pt-2 text-center text-xs font-bold text-[#027EB5]">{button.text}</div>
                ))}
            </div>
        </div>
    );
}

export default function Plantillas() {
    const { user, ready } = useAuth();
    const headerInputRef = useRef(null);
    const bodyInputRef = useRef(null);

    const userPhone = useMemo(() => getUserPhone(user), [user]);

    const [lineasIA, setLineasIA] = useState([]);
    const [numeroSeleccionado, setNumeroSeleccionado] = useState("");
    const [loadingLines, setLoadingLines] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [rules, setRules] = useState(DEFAULT_RULES);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [modalOpen, setModalOpen] = useState(false);
    const [draft, setDraft] = useState(emptyDraft());
    const [toast, setToast] = useState(null);
    const [serverAnalysis, setServerAnalysis] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [riskDialog, setRiskDialog] = useState(null);

    const showToast = useCallback((message, type = "success") => {
        setToast({
            id: Date.now(),
            message: String(message || "Operación completada."),
            type,
        });
    }, []);

    const lineaActual = useMemo(
        () => lineasIA.find((line) => normalizePhone(line?.numero) === normalizePhone(numeroSeleccionado)) || null,
        [lineasIA, numeroSeleccionado],
    );

    const risk = useMemo(() => analyzeRisk(draft), [draft]);
    const isEditing = Boolean(draft.id);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return templates.filter((item) => {
            if (statusFilter !== "ALL" && String(item.status || "").toUpperCase() !== statusFilter) return false;
            if (categoryFilter !== "ALL" && String(item.category || "").toUpperCase() !== categoryFilter) return false;
            if (!q) return true;
            return [item.name, item.title, item.help, item.language, item.category, item.status].join(" ").toLowerCase().includes(q);
        });
    }, [templates, query, statusFilter, categoryFilter]);

    const counts = useMemo(() => {
        const count = (...statuses) => templates.filter(
            (item) => statuses.includes(String(item.status || "").toUpperCase()),
        ).length;

        return {
            approved: count("APPROVED"),
            pending: count("PENDING", "IN_APPEAL"),
            rejected: count("REJECTED"),
            paused: count("PAUSED"),
            disabled: count("DISABLED", "PENDING_DELETION", "DELETED"),
        };
    }, [templates]);

    const statusOptions = useMemo(() => {
        const statuses = new Set(
            templates
                .map((item) => String(item.status || "").toUpperCase().trim())
                .filter(Boolean),
        );

        return [...statuses].sort((a, b) => {
            const labelA = STATUS_CFG[a]?.label || a;
            const labelB = STATUS_CFG[b]?.label || b;
            return labelA.localeCompare(labelB, "es");
        });
    }, [templates]);

    const loadLines = useCallback(async () => {
        if (ready === false) return;

        setLoadingLines(true);

        try {
            const response = await api.iaLineas();
            const allLines = Array.isArray(response?.items) ? response.items : [];

            setLineasIA(allLines);

            setNumeroSeleccionado((current) => {
                const currentExists = allLines.some(
                    (line) => normalizePhone(line?.numero) === normalizePhone(current),
                );

                if (currentExists) return normalizePhone(current);

                const assignedLine = userPhone
                    ? allLines.find(
                        (line) => normalizePhone(line?.numero) === userPhone,
                    )
                    : null;

                return normalizePhone(
                    assignedLine?.numero || allLines[0]?.numero || "",
                );
            });

            if (allLines.length === 0) {
                showToast(
                    "No hay líneas de WhatsApp configuradas.",
                    "error",
                );
            }
        } catch (error) {
            setLineasIA([]);
            setNumeroSeleccionado("");
            showToast(
                error?.message || "No se pudieron cargar las líneas de WhatsApp.",
                "error",
            );
        } finally {
            setLoadingLines(false);
        }
    }, [ready, showToast, userPhone]);

    const loadTemplates = useCallback(async () => {
        if (!numeroSeleccionado) {
            setTemplates([]);
            setRules(DEFAULT_RULES);
            return;
        }

        setLoading(true);

        try {
            const response = await api.digitalesPlantillasAdmin(numeroSeleccionado);
            setTemplates(Array.isArray(response?.items) ? response.items : []);
            setRules(
                Array.isArray(response?.reglas_utility) &&
                    response.reglas_utility.length
                    ? response.reglas_utility
                    : DEFAULT_RULES,
            );
        } catch (error) {
            setTemplates([]);
            showToast(
                error?.message || "No se pudieron cargar las plantillas.",
                "error",
            );
        } finally {
            setLoading(false);
        }
    }, [numeroSeleccionado, showToast]);

    useEffect(() => {
        loadLines();
    }, [loadLines]);

    useEffect(() => {
        loadTemplates();
    }, [loadTemplates]);

    useEffect(() => {
        setServerAnalysis(null);
    }, [draft]);

    function openCreate() {
        setServerAnalysis(null);
        setDraft(emptyDraft());
        setModalOpen(true);
    }

    function openEdit(template) {
        const status = String(template?.status || "").toUpperCase();
        if (!["APPROVED", "REJECTED", "PAUSED"].includes(status)) {
            showToast("Meta solo permite editar plantillas aprobadas, rechazadas o pausadas.", "error");
            return;
        }
        setServerAnalysis(null);
        setDraft(draftFromTemplate(template));
        setModalOpen(true);
    }

    function patchDraft(field, value) {
        setDraft((current) => ({ ...current, [field]: value, ...(field === "category" ? { aceptarRiesgo: false } : {}) }));
    }

    function patchExample(field, index, value) {
        setDraft((current) => ({ ...current, [field]: { ...current[field], [index]: value } }));
    }

    function patchVariableText(textField, examplesField, value) {
        setDraft((current) => {
            const normalized = normalizeVariablesAndExamples(value, current[examplesField]);

            return {
                ...current,
                [textField]: normalized.text,
                [examplesField]: normalized.examples,
            };
        });
    }

    function addVariable(textField, examplesField, inputRef) {
        const currentText = String(draft[textField] || "");
        const indexes = variableIndexes(currentText);
        const nextIndex = indexes.length ? Math.max(...indexes) + 1 : 1;
        const token = `{{${nextIndex}}}`;
        const inserted = insertTokenAtSelection(currentText, token, inputRef.current);
        const maxLength = textField === "headerText" ? 60 : 1024;

        if (inserted.text.length > maxLength) {
            showToast(`No hay espacio suficiente para agregar otro dato variable en ${textField === "headerText" ? "el encabezado" : "el cuerpo"}.`, "error");
            return;
        }

        setDraft((current) => ({
            ...current,
            [textField]: inserted.text,
            [examplesField]: {
                ...current[examplesField],
                [nextIndex]: "",
            },
        }));

        requestAnimationFrame(() => {
            inputRef.current?.focus?.();
            inputRef.current?.setSelectionRange?.(inserted.caret, inserted.caret);
        });
    }

    function removeVariable(textField, examplesField, index) {
        setDraft((current) => {
            const withoutToken = String(current[textField] || "")
                .replace(new RegExp(`\\{\\{${index}\\}\\}`, "g"), "")
                .replace(/[ \t]{2,}/g, " ")
                .replace(/ +\n/g, "\n");

            const normalized = normalizeVariablesAndExamples(withoutToken, current[examplesField]);

            return {
                ...current,
                [textField]: normalized.text,
                [examplesField]: normalized.examples,
            };
        });
    }

    function addButton() {
        if (draft.buttons.length >= 3) return;
        setDraft((current) => ({ ...current, buttons: [...current.buttons, { type: "QUICK_REPLY", text: "", url: "", phone_number: "", example: "" }] }));
    }

    function patchButton(index, field, value) {
        setDraft((current) => ({
            ...current,
            buttons: current.buttons.map((button, buttonIndex) => buttonIndex === index ? { ...button, [field]: value } : button),
        }));
    }

    function removeButton(index) {
        setDraft((current) => ({ ...current, buttons: current.buttons.filter((_, buttonIndex) => buttonIndex !== index) }));
    }

    function validateDraft() {
        if (!isEditing && !draft.name.trim()) return "Escribe el nombre de la plantilla.";
        if (draft.headerEnabled && !draft.preservedHeader && !draft.headerText.trim()) return "Escribe el encabezado o desactiva esa opción.";
        if (!draft.body.trim()) return "El cuerpo de la plantilla es obligatorio.";
        if (variableIndexes(draft.headerText).some((index) => !String(draft.headerExamples[index] || "").trim())) return "Completa todos los datos variables del encabezado.";
        if (variableIndexes(draft.body).some((index) => !String(draft.bodyExamples[index] || "").trim())) return "Completa todos los datos variables del cuerpo.";

        const dynamicUrlWithoutExample = draft.buttons.some(
            (button) => button.type === "URL" && variableIndexes(button.url).length > 0 && !String(button.example || "").trim(),
        );

        if (dynamicUrlWithoutExample) return "Completa el ejemplo de la URL dinámica.";
        return "";
    }

    async function analyzeTemplate({ showSuccess = true } = {}) {
        if (!numeroSeleccionado) {
            showToast("Selecciona una línea de WhatsApp antes de analizar.", "error");
            return null;
        }

        setAnalyzing(true);

        try {
            const response = await api.digitalesPlantillaAnalizar(
                numeroSeleccionado,
                {
                    category: draft.category,
                    components: buildComponents(draft),
                },
            );

            const analysis = response?.analysis || null;
            setServerAnalysis(analysis);

            if (showSuccess && analysis) {
                showToast(
                    analysis.valida
                        ? "Análisis completado. La estructura es válida."
                        : "El análisis encontró errores que debes corregir.",
                    analysis.valida ? "success" : "error",
                );
            }

            return analysis;
        } catch (error) {
            const analysis = error?.data?.analysis || null;
            if (analysis) setServerAnalysis(analysis);

            showToast(
                error?.message || "No se pudo analizar la estructura de la plantilla.",
                "error",
            );

            return null;
        } finally {
            setAnalyzing(false);
        }
    }

    async function submitTemplate({ acceptRisk = false } = {}) {
        setSaving(true);

        const payload = {
            name: normalizeName(draft.name),
            language: draft.language,
            category: draft.category,
            components: buildComponents(draft),
            aceptar_riesgo_marketing: Boolean(acceptRisk || draft.aceptarRiesgo),
            allow_category_change: draft.allowCategoryChange,
        };

        try {
            const response = isEditing
                ? await api.digitalesPlantillaEditar(numeroSeleccionado, draft.id, payload)
                : await api.digitalesPlantillaCrear(numeroSeleccionado, payload);

            const returnedCategory = getReturnedCategory(response);
            const requestedCategory = String(draft.category || "").toUpperCase();
            const reclassified = returnedCategory && requestedCategory && returnedCategory !== requestedCategory;

            setModalOpen(false);
            setRiskDialog(null);
            await loadTemplates();

            if (reclassified) {
                setRiskDialog({
                    type: "reclassified",
                    requestedCategory,
                    detectedCategory: returnedCategory,
                });
                return;
            }

            showToast(isEditing ? "Cambios enviados a revisión de Meta." : "Plantilla enviada a revisión de Meta.");
        } catch (requestError) {
            const analysis = requestError?.data?.analysis || null;
            const requiresConfirmation = Boolean(
                requestError?.data?.requires_confirmation ||
                analysis?.requiere_confirmacion ||
                analysis?.requiere_confirmacion_marketing,
            );

            if (analysis) setServerAnalysis(analysis);

            if (requiresConfirmation && !acceptRisk) {
                setRiskDialog({
                    type: "confirm",
                    analysis,
                });
                return;
            }

            showToast(requestError?.message || "No se pudo guardar la plantilla.", "error");
        } finally {
            setSaving(false);
        }
    }

    async function saveTemplate() {
        const error = validateDraft();
        if (error) {
            showToast(error, "error");
            return;
        }

        const analysis = await analyzeTemplate({ showSuccess: false });

        if (!analysis) return;

        if (!analysis.valida) {
            showToast("Corrige los errores de estructura antes de enviar la plantilla.", "error");
            return;
        }

        if ((analysis.requiere_confirmacion_marketing || risk.requiresConfirmation) && !draft.aceptarRiesgo) {
            setRiskDialog({
                type: "confirm",
                analysis,
            });
            return;
        }

        await submitTemplate();
    }

    async function confirmRiskAndSubmit() {
        await submitTemplate({ acceptRisk: true });
    }

    async function deleteTemplate(template) {
        if (!confirm(`¿Eliminar la plantilla ${template.name}? Esta acción también la eliminará en Meta.`)) return;
        try {
            await api.digitalesPlantillaEliminar(numeroSeleccionado, template.id, template.name);
            showToast("Plantilla eliminada correctamente.");
            await loadTemplates();
        } catch (error) {
            showToast(error?.message || "No se pudo eliminar la plantilla.", "error");
        }
    }

    if (ready === false) {
        return (
            <div className="flex min-h-[320px] items-center justify-center gap-2 text-sm font-semibold text-[#8891AD]">
                <Loader2 className="h-5 w-5 animate-spin" />
                Cargando sesión...
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                {[
                    ["Total", templates.length, FileText, "text-[#131E5C]", "bg-[#131E5C]/8"],
                    ["Aprobadas", counts.approved, CheckCircle2, "text-emerald-600", "bg-emerald-50"],
                    ["En revisión", counts.pending, Clock3, "text-amber-600", "bg-amber-50"],
                    ["Rechazadas", counts.rejected, AlertCircle, "text-red-600", "bg-red-50"],
                    ["Pausadas", counts.paused, ShieldAlert, "text-orange-600", "bg-orange-50"],
                    ["Deshabilitadas", counts.disabled, X, "text-gray-600", "bg-gray-100"],
                ].map(([label, value, Icon, iconCls, bgCls]) => (
                    <div key={label} className="rounded-2xl border border-[#E4E7F0] bg-white p-5">
                        <div className="flex items-center justify-between">
                            <div><p className="text-[11px] font-bold uppercase tracking-widest text-[#8891AD]">{label}</p><p className="mt-2 text-2xl font-bold text-[#1A1F3C]">{loading ? "—" : value}</p></div>
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bgCls}`}><Icon className={`h-5 w-5 ${iconCls}`} /></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-[#E4E7F0] bg-white p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-[#8891AD]">
                                Línea de WhatsApp
                            </label>
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                                Gestión de plantillas habilitada
                            </span>
                        </div>

                        <select
                            value={numeroSeleccionado}
                            onChange={(event) => setNumeroSeleccionado(normalizePhone(event.target.value))}
                            disabled={loadingLines || lineasIA.length === 0}
                            className={`${inputCls} max-w-xl disabled:cursor-not-allowed disabled:bg-[#F7F8FC] disabled:text-[#8891AD]`}
                        >
                            {loadingLines ? (
                                <option value="">Cargando líneas...</option>
                            ) : lineasIA.length === 0 ? (
                                <option value="">Sin línea disponible</option>
                            ) : (
                                lineasIA.map((line) => (
                                    <option key={line.numero} value={normalizePhone(line.numero)}>
                                        {line.label || line.asesor_digital || "Línea WhatsApp"} · {line.numero}
                                    </option>
                                ))
                            )}
                        </select>

                        <p className="mt-1.5 text-xs text-[#8891AD]">
                            Cuenta: {lineaActual?.agencia || "—"} · {lineaActual?.business || "—"}
                            {lineaActual?.phone_number_id ? ` · ID ${lineaActual.phone_number_id}` : ""}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={loadTemplates}
                            disabled={loading || loadingLines || !numeroSeleccionado}
                            className="inline-flex items-center gap-2 rounded-xl border border-[#E4E7F0] px-4 py-2.5 text-sm font-bold text-[#515778] hover:bg-[#F7F8FC] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Sincronizar
                        </button>

                        <button
                            onClick={openCreate}
                            disabled={!numeroSeleccionado || loadingLines}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#131E5C] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0A1340] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus className="h-4 w-4" />
                            Nueva plantilla
                        </button>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
                    <div>
                        <h3 className="text-lg font-bold text-amber-900">Reglas para conservar la categoría Utility</h3>
                        <div className="mt-2 grid gap-1.5 md:grid-cols-2">
                            {rules.map((rule) => <p key={rule} className="text-base leading-relaxed text-amber-900">• {rule}</p>)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white">
                <div className="flex flex-col gap-3 border-b border-[#E4E7F0] p-4 lg:flex-row lg:items-center">
                    <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8891AD]" /><input value={query} onChange={(e) => setQuery(e.target.value)} className={`${inputCls} pl-9`} placeholder="Buscar por nombre, texto o estado..." /></div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputCls} lg:w-52`}>
                        <option value="ALL">Todos los estados</option>
                        {statusOptions.map((status) => (
                            <option key={status} value={status}>
                                {STATUS_CFG[status]?.label || status}
                            </option>
                        ))}
                    </select>
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={`${inputCls} lg:w-44`}><option value="ALL">Todas las categorías</option><option value="UTILITY">Utility</option><option value="MARKETING">Marketing</option><option value="AUTHENTICATION">Authentication</option></select>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-20 text-sm font-semibold text-[#8891AD]"><Loader2 className="h-5 w-5 animate-spin" /> Consultando Meta...</div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center"><FileText className="mx-auto h-10 w-10 text-[#C8CEDF]" /><p className="mt-3 text-sm font-bold text-[#1A1F3C]">No hay plantillas</p><p className="mt-1 text-xs text-[#8891AD]">Crea una nueva o cambia los filtros.</p></div>
                ) : (
                    <div className="divide-y divide-[#E4E7F0]">
                        {filtered.map((template) => (
                            <div key={`${template.id}-${template.language}`} className="p-5 hover:bg-[#F7F8FC]/70">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold text-[#1A1F3C]">{template.title || template.name}</h3><StatusBadge status={template.status} /><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${String(template.category).toUpperCase() === "UTILITY" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>{template.category || "—"}</span></div>
                                        <p className="mt-1 font-mono text-[11px] text-[#8891AD]">{template.name} · {template.language}</p>
                                        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#515778]">{template.help || "Sin texto visible."}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(template)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#E4E7F0] px-3 text-xs font-bold text-[#515778] hover:bg-white"><Edit3 className="h-3.5 w-3.5" /> Editar</button>
                                        <button onClick={() => deleteTemplate(template)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-200 px-3 text-xs font-bold text-red-700 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Eliminar</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Modal open={modalOpen} title={isEditing ? `Editar ${draft.name}` : "Nueva plantilla de WhatsApp"} onClose={() => !saving && setModalOpen(false)} footer={
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button onClick={() => setModalOpen(false)} disabled={saving} className="rounded-xl border border-[#E4E7F0] bg-white px-5 py-2.5 text-sm font-bold text-[#515778]">Cancelar</button><button onClick={saveTemplate} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#131E5C] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{isEditing ? "Guardar cambios" : "Enviar a revisión"}</button></div>
            }>
                <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
                    <div className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="text-sm font-bold text-[#515778]">Nombre interno<input disabled={isEditing} value={draft.name} onChange={(e) => patchDraft("name", normalizeName(e.target.value))} className={`${inputCls} mt-1.5 disabled:bg-[#F7F8FC]`} placeholder="confirmacion_cita_servicio" /><span className="mt-1 block text-[13px] font-normal text-[#8891AD]">Minúsculas, números y guion bajo. No puede cambiarse después.</span></label>
                            <label className="text-sm font-bold text-[#515778]">Idioma<select disabled={isEditing} value={draft.language} onChange={(e) => patchDraft("language", e.target.value)} className={`${inputCls} mt-1.5 disabled:bg-[#F7F8FC]`}><option value="es_MX">Español México</option><option value="es">Español</option><option value="en_US">English US</option></select></label>
                            <label className="text-sm font-bold text-[#515778]">Categoría<select value={draft.category} onChange={(e) => patchDraft("category", e.target.value)} className={`${inputCls} mt-1.5`}><option value="UTILITY">Utility</option><option value="MARKETING">Marketing</option></select></label>
                            <label className="flex items-center gap-2 self-end rounded-xl border border-[#E4E7F0] px-3.5 py-3 text-sm font-semibold text-[#515778]"><input disabled type="checkbox" checked={draft.allowCategoryChange} onChange={(e) => patchDraft("allowCategoryChange", e.target.checked)} /> Permitir que Meta ajuste la categoría</label>
                        </div>

                        {draft.preservedHeader ? (
                            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-800">Esta plantilla tiene encabezado multimedia. El CRM lo conservará y te permitirá editar el cuerpo, pie y botones.</div>
                        ) : (
                            <div className="space-y-3 rounded-2xl border border-[#E4E7F0] p-4">
                                <label className="flex items-center gap-2 text-sm font-bold text-[#1A1F3C]"><input type="checkbox" checked={draft.headerEnabled} onChange={(e) => patchDraft("headerEnabled", e.target.checked)} /> Agregar encabezado de texto</label>

                                {draft.headerEnabled && (
                                    <>
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                            <input
                                                ref={headerInputRef}
                                                value={draft.headerText}
                                                maxLength={60}
                                                onChange={(event) => patchVariableText("headerText", "headerExamples", event.target.value)}
                                                className={inputCls}
                                                placeholder="Confirmación de cita"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => addVariable("headerText", "headerExamples", headerInputRef)}
                                                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#131E5C]/20 bg-[#131E5C]/5 px-3 py-2.5 text-xs font-bold text-[#131E5C] transition hover:bg-[#131E5C]/10"
                                            >
                                                <Braces className="h-4 w-4" />
                                                Agregar variable
                                            </button>
                                        </div>

                                        <p className="text-[12px] leading-relaxed text-[#8891AD]">
                                            Coloca el cursor donde debe aparecer el dato y presiona “Agregar variable”.
                                        </p>

                                        <VariableExamples
                                            title="encabezado"
                                            text={draft.headerText}
                                            values={draft.headerExamples}
                                            onChange={(index, value) => patchExample("headerExamples", index, value)}
                                            onRemove={(index) => removeVariable("headerText", "headerExamples", index)}
                                        />
                                    </>
                                )}
                            </div>
                        )}

                        <div className="space-y-3 rounded-2xl border border-[#E4E7F0] p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <label className="text-sm font-bold text-[#1A1F3C]">Cuerpo del mensaje *</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-[#8891AD]">{draft.body.length}/1024</span>
                                    <button
                                        type="button"
                                        onClick={() => addVariable("body", "bodyExamples", bodyInputRef)}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#131E5C]/20 bg-[#131E5C]/5 px-3 py-2 text-xs font-bold text-[#131E5C] transition hover:bg-[#131E5C]/10"
                                    >
                                        <Braces className="h-4 w-4" />
                                        Agregar variable
                                    </button>
                                </div>
                            </div>

                            <textarea
                                ref={bodyInputRef}
                                value={draft.body}
                                maxLength={1024}
                                rows={7}
                                onChange={(event) => patchVariableText("body", "bodyExamples", event.target.value)}
                                className={textareaCls}
                                placeholder="Hola, confirmamos que tu cita quedó programada."
                            />

                            <p className="text-[13px] leading-relaxed text-[#8891AD]">
                                Ejemplo: escribe “Hola ”, coloca el cursor después del espacio y agrega un dato variable para el nombre del cliente.
                            </p>

                            <VariableExamples
                                title="cuerpo"
                                text={draft.body}
                                values={draft.bodyExamples}
                                onChange={(index, value) => patchExample("bodyExamples", index, value)}
                                onRemove={(index) => removeVariable("body", "bodyExamples", index)}
                            />
                        </div>

                        <div className="space-y-2 rounded-2xl border border-[#E4E7F0] p-4"><div className="flex items-center justify-between"><label className="text-sm font-bold text-[#1A1F3C]">Pie opcional</label><span className="text-[11px] text-[#8891AD]">{draft.footer.length}/60</span></div><input value={draft.footer} maxLength={60} onChange={(e) => patchDraft("footer", e.target.value)} className={inputCls} placeholder="Grupo Automotriz R&R" /></div>

                        <div className="space-y-3 rounded-2xl border border-[#E4E7F0] p-4">
                            <div className="flex items-center justify-between"><div><h3 className="text-sm font-bold text-[#1A1F3C]">Botones</h3><p className="text-[11px] text-[#8891AD]">Hasta 3 botones.</p></div><button onClick={addButton} disabled={draft.buttons.length >= 3} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E7F0] px-3 py-2 text-xs font-bold text-[#131E5C] disabled:opacity-40"><Plus className="h-3.5 w-3.5" /> Agregar</button></div>
                            {draft.buttons.map((button, index) => (
                                <div key={index} className="grid gap-2 rounded-xl bg-[#F7F8FC] p-3 sm:grid-cols-[150px_1fr_auto]">
                                    <select value={button.type} onChange={(e) => patchButton(index, "type", e.target.value)} className={inputCls}><option value="QUICK_REPLY">Respuesta rápida</option><option value="URL">Abrir URL</option></select>
                                    <div className="space-y-2"><input value={button.text} maxLength={25} onChange={(e) => patchButton(index, "text", e.target.value)} className={inputCls} placeholder="Texto del botón" />{button.type === "URL" && <><input value={button.url} onChange={(e) => patchButton(index, "url", e.target.value)} className={inputCls} placeholder="https://ejemplo.com/cita/{{1}}" />{variableIndexes(button.url).length > 0 && <input value={button.example} onChange={(e) => patchButton(index, "example", e.target.value)} className={inputCls} placeholder="Ejemplo para la variable de URL" />}</>}{button.type === "PHONE_NUMBER" && <input value={button.phone_number} onChange={(e) => patchButton(index, "phone_number", e.target.value)} className={inputCls} placeholder="+522711234567" />}</div>
                                    <button onClick={() => removeButton(index)} className="flex h-10 w-10 items-center justify-center rounded-xl text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <TemplatePreview draft={draft} />
                        <div className={`rounded-2xl border p-4 ${risk.level === "alto" ? "border-red-200 bg-red-50" : risk.level === "medio" ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <ShieldAlert className={`mt-0.5 h-5 w-5 ${risk.level === "alto" ? "text-red-700" : risk.level === "medio" ? "text-amber-700" : "text-emerald-700"}`} />
                                    <div>
                                        <h3 className="text-base font-bold text-[#1A1F3C]">Riesgo comercial preliminar: {risk.level}</h3>
                                        <p className="mt-1 text-sm leading-relaxed text-[#515778]">Puntuación local: {risk.score}/100. Usa el análisis completo para validar variables, ejemplos, botones y estructura.</p>
                                        {risk.findings.length > 0 && <p className="mt-2 text-xs font-semibold text-[#515778]">Señales detectadas: {risk.findings.join(", ")}.</p>}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => analyzeTemplate()}
                                    disabled={analyzing || saving}
                                    className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-[#131E5C]/20 bg-white px-3 py-2 text-sm font-bold text-[#131E5C] disabled:opacity-50"
                                >
                                    {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                    Analizar estructura
                                </button>
                            </div>

                            {serverAnalysis && (
                                <div className="mt-4 space-y-3 rounded-xl border border-white/80 bg-white/75 p-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${serverAnalysis.valida ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                                            {serverAnalysis.valida ? "Estructura válida" : "Estructura inválida"}
                                        </span>
                                        <span className="text-xs font-semibold text-[#515778]">
                                            Calidad estructural: {serverAnalysis.score_estructura ?? 0}/100
                                        </span>
                                        <span className="text-xs text-[#8891AD]">
                                            {serverAnalysis.resumen?.total_componentes ?? 0} componentes · {serverAnalysis.resumen?.variables?.body?.cantidad ?? 0} variables en cuerpo · {serverAnalysis.resumen?.botones?.cantidad ?? 0} botones
                                        </span>
                                    </div>

                                    {serverAnalysis.errores?.length > 0 && (
                                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                                            <p className="text-xs font-bold text-red-800">Errores que bloquean el envío</p>
                                            {serverAnalysis.errores.map((item) => <p key={item} className="mt-1 text-xs leading-relaxed text-red-700">• {item}</p>)}
                                        </div>
                                    )}

                                    {serverAnalysis.advertencias?.length > 0 && (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                            <p className="text-xs font-bold text-amber-900">Advertencias</p>
                                            {serverAnalysis.advertencias.map((item) => <p key={item} className="mt-1 text-xs leading-relaxed text-amber-800">• {item}</p>)}
                                        </div>
                                    )}

                                    {serverAnalysis.recomendaciones?.length > 0 && (
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                            <p className="text-xs font-bold text-blue-900">Recomendaciones</p>
                                            {serverAnalysis.recomendaciones.map((item) => <p key={item} className="mt-1 text-xs leading-relaxed text-blue-800">• {item}</p>)}
                                        </div>
                                    )}
                                </div>
                            )}

                            {(risk.requiresConfirmation || serverAnalysis?.requiere_confirmacion_marketing) && (
                                <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-white/70 p-3 text-xs font-semibold text-amber-900">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                    Al intentar enviarla, el CRM te pedirá confirmar la posible reclasificación a Marketing.
                                </div>
                            )}
                        </div>
                        <div className="rounded-2xl border border-[#E4E7F0] bg-[#F7F8FC] p-4"><h3 className="text-lg font-bold text-[#1A1F3C]">Checklist Utility</h3><div className="mt-2 space-y-2">{rules.map((rule) => <p key={rule} className="flex gap-2 text-base leading-relaxed text-[#515778]"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#131E5C]" />{rule}</p>)}</div></div>
                    </div>
                </div>
            </Modal>

            <RiskDialog
                data={riskDialog}
                saving={saving}
                onClose={() => setRiskDialog(null)}
                onConfirm={confirmRiskAndSubmit}
            />

            <Toast
                data={toast}
                onClose={() => setToast(null)}
            />
        </div>
    );
}