//src/pages/Digitales/DigitalesContacto.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import {
    ArrowLeft,
    Send,
    Smile,
    User,
    Building2,
    Clock,
    Search,
    X,
    LayoutTemplate,
    ChevronLeft,
    ChevronDown,
    Paperclip,
    FileText,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { api } from "../../lib/apiPruebas";

const BRAND_BLUE = "#131E5C";

const DEALERS = [
    "Volvo",
];

const CANALES = [
    "Volvo-Concesionario",
    "WhatsApp",
    "Facebook",
    "Llamada Entrante",
];

function cls(...items) {
    return items.filter(Boolean).join(" ");
}

function Avatar({ name = "?" }) {
    const initials = String(name || "?")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((item) => item[0]?.toUpperCase())
        .join("");

    return (
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm">
            <span className="text-sm font-extrabold text-[#131E5C]">
                {initials || "?"}
            </span>
        </div>
    );
}

function prettyStatus(status) {
    const value = String(status || "").toLowerCase();

    if (value === "sent") return "enviado";
    if (value === "delivered") return "entregado";
    if (value === "read") return "leído";
    if (value === "failed") return "falló";
    if (value === "received") return "";

    return value || "—";
}

function normalizaTelefonoMx(tel) {
    const digits = String(tel || "").replace(/\D/g, "");

    if (!digits) return "";
    if (digits.startsWith("521") && digits.length === 13) return `52${digits.slice(3)}`;
    if (digits.length === 10) return `52${digits}`;
    if (digits.length === 12 && digits.startsWith("52")) return digits;

    return digits;
}

function formateaTelUi(tel52) {
    const digits = String(tel52 || "").replace(/\D/g, "");

    if (!digits) return "";

    if (digits.length === 12 && digits.startsWith("52")) {
        const ten = digits.slice(2);
        return `+52 ${ten.slice(0, 3)} ${ten.slice(3, 6)} ${ten.slice(6)}`;
    }

    return `+${digits}`;
}

function safeLower(value) {
    return String(value || "").toLowerCase();
}

function inferAttachmentKind(attachment = {}) {
    const type = String(
        attachment.kind ||
        attachment.type ||
        attachment.media_type ||
        "",
    ).toLowerCase();

    const mime = String(
        attachment.mime ||
        attachment.mime_type ||
        "",
    ).toLowerCase();

    if (type === "sticker") return "sticker";
    if (type === "image" || mime.startsWith("image/")) return "image";
    if (type === "video" || mime.startsWith("video/")) return "video";
    if (type === "audio" || mime.startsWith("audio/")) return "audio";

    return "file";
}

function normalizeMessageAttachments(message = {}) {
    if (Array.isArray(message.attachments) && message.attachments.length) {
        return message.attachments
            .map((attachment, index) => {
                const src = attachment.url || attachment.previewUrl || "";

                return {
                    id: attachment.id || `${message.wa_message_id || message.id || "msg"}-${index}`,
                    kind: inferAttachmentKind(attachment),
                    previewUrl: src,
                    url: src,
                    name: attachment.name || attachment.filename || "",
                    size: attachment.size || 0,
                    mime: attachment.mime || attachment.mime_type || "",
                };
            })
            .filter((attachment) => attachment.url);
    }

    const rawList =
        Array.isArray(message.media)
            ? message.media
            : message.media_url || message.image_url || message.sticker_url
                ? [message]
                : [];

    return rawList
        .map((attachment, index) => {
            const src =
                attachment.previewUrl ||
                attachment.url ||
                attachment.media_url ||
                attachment.image_url ||
                attachment.sticker_url ||
                attachment.src ||
                "";

            return {
                id: attachment.id || attachment.media_id || `${message.wa_message_id || message.id || "msg"}-${index}`,
                kind: inferAttachmentKind(attachment),
                previewUrl: src,
                url: src,
                name: attachment.name || attachment.filename || "",
                size: attachment.size || attachment.file_size || 0,
                mime: attachment.mime || attachment.mime_type || "",
            };
        })
        .filter((attachment) => attachment.url);
}

function normalizeMessage(message = {}) {
    return {
        ...message,
        id: message.id || message.wa_message_id || crypto.randomUUID(),
        text: message.text || message.body || message.caption || "",
        attachments: normalizeMessageAttachments(message),
        is_ai: Boolean(message.is_ai || message?.raw?.openai_model),
    };
}

function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[80]">
            <div
                className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl">
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
                            type="button"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="max-h-[72vh] overflow-auto p-5">
                        {children}
                    </div>

                    {footer ? (
                        <div className="flex flex-col gap-2 border-t border-black/10 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
                            {footer}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function Sk({ className = "" }) {
    return <div className={cls("animate-pulse rounded-md bg-slate-200", className)} />;
}

function ChatListSkeleton({ rows = 8 }) {
    return (
        <div className="p-2">
            {Array.from({ length: rows }).map((_, index) => (
                <div
                    key={index}
                    className="w-full border-b border-black/5 bg-neutral-50 px-4 py-3 text-left"
                >
                    <div className="flex items-center gap-3">
                        <Sk className="h-11 w-11 rounded-full" />

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                                <Sk className="h-4 w-40 rounded" />
                                <Sk className="h-3 w-12 rounded" />
                            </div>

                            <div className="mt-2 flex items-center justify-between gap-2">
                                <Sk className="h-3 w-56 rounded" />
                                <Sk className="h-5 w-6 rounded-full" />
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <Sk className="h-5 w-24 rounded-full" />
                                <Sk className="h-4 w-28 rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function MessagesSkeleton({ bubbles = 10 }) {
    return (
        <div className="mx-auto max-w-3xl space-y-3">
            {Array.from({ length: bubbles }).map((_, index) => {
                const mine = index % 2 === 0;

                return (
                    <div
                        key={index}
                        className={cls("flex w-full", mine ? "justify-end" : "justify-start")}
                    >
                        <div
                            className={cls(
                                "max-w-[78%] rounded-2xl border px-4 py-3 shadow-sm",
                                mine
                                    ? "border-white/10 bg-[#131E5C]/10"
                                    : "border-black/10 bg-white",
                            )}
                        >
                            <Sk className="h-3 w-52 rounded" />
                            <Sk className="mt-2 h-3 w-64 rounded" />

                            <div className="mt-3 flex items-center justify-end gap-2">
                                <Sk className="h-3 w-10 rounded" />
                                {mine ? <Sk className="h-3 w-16 rounded" /> : null}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function fileKind(file) {
    const mime = String(file?.type || "");

    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "audio";

    return "file";
}

function shortName(name = "") {
    const value = String(name || "");

    if (value.length <= 22) return value;

    return `${value.slice(0, 12)}…${value.slice(-8)}`;
}

function humanBytes(size) {
    const bytes = Number(size || 0);

    if (!bytes) return "0 B";

    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let index = 0;

    while (value >= 1024 && index < units.length - 1) {
        value /= 1024;
        index += 1;
    }

    return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function extractFilesFromDataTransfer(dataTransfer) {
    if (!dataTransfer) return [];

    const list = dataTransfer.files ? Array.from(dataTransfer.files) : [];
    if (list.length) return list.filter((file) => file && typeof file.size === "number");

    const items = dataTransfer.items ? Array.from(dataTransfer.items) : [];
    const output = [];

    for (const item of items) {
        if (item.kind === "file") {
            const file = item.getAsFile?.();

            if (file && typeof file.size === "number") {
                output.push(file);
            }
        }
    }

    return output;
}

function getTemplateComponentType(component = {}) {
    return String(component.type || "").toLowerCase();
}

function replaceMetaVariables(text, componentType, draft) {
    return String(text || "").replace(/\{\{(\d+)\}\}/g, (_, index) => {
        const key = `${componentType}_${index}`;
        return String(draft?.[key] ?? "").trim();
    });
}

function interpolateNumberedText(text, fields, draft) {
    const orderedValues = (fields || []).map((field) =>
        String(draft?.[field.key] || "").trim(),
    );

    return String(text || "").replace(/\((\d+)\)/g, (_, index) => {
        return orderedValues[Number(index) - 1] || "";
    });
}

function buildTemplatePreviewText(template, draft) {
    if (!template) return "";

    const components = Array.isArray(template.components_meta)
        ? template.components_meta
        : [];

    const visibleFromMeta = components
        .filter((component) => {
            const type = getTemplateComponentType(component);
            return ["header", "body", "footer"].includes(type) && String(component.text || "").trim();
        })
        .map((component) => {
            const type = getTemplateComponentType(component);
            return replaceMetaVariables(component.text, type, draft);
        })
        .filter(Boolean)
        .join("\n");

    if (visibleFromMeta) return visibleFromMeta;

    return interpolateNumberedText(
        template.help || "",
        template.fields || [],
        draft,
    );
}

function parseTemplateMarkerText(text) {
    const value = String(text || "");
    const match = value.match(/^\[TEMPLATE:([^\]]+)\]\s*(.*)$/s);

    if (!match) {
        return {
            isTemplate: false,
            templateName: "",
            params: [],
            plainText: value,
        };
    }

    const templateName = match[1] || "";
    const params = String(match[2] || "")
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean);

    return {
        isTemplate: true,
        templateName,
        params,
        plainText: value,
    };
}

function buildDraftFromTemplateParams(template, params = []) {
    const draft = {};
    const fields = Array.isArray(template?.fields) ? template.fields : [];

    fields.forEach((field, index) => {
        draft[field.key] = params[index] || "";
    });

    return draft;
}

function formatTemplateMarkerText(text, templateMap) {
    const parsed = parseTemplateMarkerText(text);

    if (!parsed.isTemplate) return parsed.plainText;

    const template = templateMap.get(parsed.templateName);

    if (template) {
        const draft = buildDraftFromTemplateParams(template, parsed.params);
        const preview = buildTemplatePreviewText(template, draft);

        if (preview) return preview;
    }

    const paramsText = parsed.params.length
        ? `\n${parsed.params.join("\n")}`
        : "";

    return `Plantilla: ${parsed.templateName}${paramsText}`;
}

function getFieldOptions(field) {
    if (Array.isArray(field?.options) && field.options.length) {
        return field.options;
    }

    const label = safeLower(field?.label);
    const key = safeLower(field?.key);

    if (
        label.includes("dealer") ||
        label.includes("agencia") ||
        key.includes("dealer") ||
        key.includes("agencia")
    ) {
        return DEALERS;
    }

    if (
        label.includes("canal") ||
        key.includes("canal")
    ) {
        return CANALES;
    }

    return [];
}

function getDefaultValueForTemplateField(field, context) {
    const label = safeLower(field?.label);
    const key = safeLower(field?.key);

    if (
        label.includes("asesor") ||
        key.includes("asesor") ||
        label.includes("quién eres")
    ) {
        return context.asesor || "";
    }

    if (
        label.includes("nombre") ||
        label.includes("prospecto") ||
        label.includes("cliente") ||
        key.includes("nombre")
    ) {
        return context.nombre || "";
    }

    if (
        label.includes("dealer") ||
        label.includes("agencia") ||
        key.includes("dealer") ||
        key.includes("agencia")
    ) {
        return context.agencia || "";
    }

    if (
        label.includes("modelo") ||
        label.includes("auto") ||
        label.includes("vehículo") ||
        key.includes("modelo") ||
        key.includes("auto")
    ) {
        return context.modelo || "";
    }

    if (
        label.includes("canal") ||
        key.includes("canal")
    ) {
        return context.canal || "";
    }

    if (
        label.includes("tema") ||
        key.includes("tema")
    ) {
        return context.tema || "";
    }

    if (
        label.includes("dato") ||
        label.includes("pides") ||
        key.includes("dato")
    ) {
        return context.dato || "";
    }

    return "";
}

function buildDynamicTemplateComponents(template, draft) {
    const fields = Array.isArray(template?.fields) ? template.fields : [];

    const grouped = fields.reduce((acc, field) => {
        const component = String(field.component || "body").toLowerCase();

        if (!acc[component]) acc[component] = [];

        acc[component].push(field);

        return acc;
    }, {});

    return Object.entries(grouped)
        .map(([type, items]) => ({
            type,
            parameters: items
                .sort((a, b) => Number(a.index || 0) - Number(b.index || 0))
                .map((field) => ({
                    type: "text",
                    text: String(draft?.[field.key] || "").trim(),
                })),
        }))
        .filter((component) => component.parameters.length > 0);
}

function AttachmentShell({ mine, attachment, children }) {
    const isImageLike = attachment.kind === "image" || attachment.kind === "sticker";

    return (
        <div
            className={cls(
                "relative overflow-hidden rounded-xl border shadow-sm",
                mine ? "border-white/15 bg-white/5" : "border-black/10 bg-white",
            )}
        >
            {children}

            {!isImageLike ? (
                <div
                    className={cls(
                        "px-3 py-2 text-xs font-bold",
                        mine ? "text-white/80" : "text-slate-600",
                    )}
                >
                    {attachment.name ? shortName(attachment.name) : "archivo"}
                </div>
            ) : null}
        </div>
    );
}

function MessageBubble({
    mine,
    text,
    time,
    status = "sent",
    attachments = [],
    isAi = false,
    renderText,
}) {
    const shown = renderText ? renderText(text) : text;
    const statusText = prettyStatus(status);

    return (
        <div className={cls("flex w-full", mine ? "justify-end" : "justify-start")}>
            <div className="relative max-w-[78%]">
                <div
                    className={cls(
                        "rounded-2xl border px-4 py-2 shadow-sm",
                        mine
                            ? "border-white/10 bg-[#131E5C] text-white"
                            : "border-black/10 bg-white text-[#131E5C]",
                    )}
                >
                    {attachments?.length ? (
                        <div className="mb-2 grid gap-2">
                            {attachments.map((attachment) => {
                                const src = attachment.url || attachment.previewUrl;
                                if (!src) return null;

                                if (attachment.kind === "sticker" || attachment.kind === "image") {
                                    const isSticker = attachment.kind === "sticker";

                                    return (
                                        <AttachmentShell
                                            key={attachment.id}
                                            mine={mine}
                                            attachment={attachment}
                                        >
                                            <a
                                                href={src}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block"
                                                title="Abrir"
                                            >
                                                <img
                                                    src={src}
                                                    alt={attachment.name || (isSticker ? "sticker" : "imagen")}
                                                    className={cls(
                                                        "w-full",
                                                        isSticker
                                                            ? "max-h-44 object-contain p-2"
                                                            : "max-h-64 object-cover",
                                                    )}
                                                    loading="lazy"
                                                />

                                                {!isSticker ? (
                                                    <div
                                                        className={cls(
                                                            "px-3 py-2 text-xs font-bold",
                                                            mine ? "text-white/80" : "text-slate-600",
                                                        )}
                                                    >
                                                        {attachment.name ? shortName(attachment.name) : "Imagen"}
                                                    </div>
                                                ) : null}
                                            </a>
                                        </AttachmentShell>
                                    );
                                }

                                if (attachment.kind === "video") {
                                    return (
                                        <AttachmentShell
                                            key={attachment.id}
                                            mine={mine}
                                            attachment={attachment}
                                        >
                                            <video
                                                src={src}
                                                controls
                                                className="max-h-72 w-full bg-black"
                                                preload="metadata"
                                            />
                                        </AttachmentShell>
                                    );
                                }

                                if (attachment.kind === "audio") {
                                    return (
                                        <AttachmentShell
                                            key={attachment.id}
                                            mine={mine}
                                            attachment={attachment}
                                        >
                                            <div className="px-3 py-2">
                                                <div
                                                    className={cls(
                                                        "mb-2 text-xs font-extrabold",
                                                        mine ? "text-white/85" : "text-[#131E5C]",
                                                    )}
                                                >
                                                    {attachment.name ? shortName(attachment.name) : "Audio"}
                                                </div>

                                                <audio
                                                    src={src}
                                                    controls
                                                    className="w-full"
                                                    preload="metadata"
                                                />
                                            </div>
                                        </AttachmentShell>
                                    );
                                }

                                return (
                                    <AttachmentShell
                                        key={attachment.id}
                                        mine={mine}
                                        attachment={attachment}
                                    >
                                        <a
                                            href={src}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={cls(
                                                "flex items-center gap-2 px-3 py-3 hover:opacity-90",
                                                mine ? "text-white" : "text-[#131E5C]",
                                            )}
                                            title="Abrir archivo"
                                        >
                                            <FileText
                                                className={cls(
                                                    "h-4 w-4",
                                                    mine ? "text-white/85" : "text-[#131E5C]",
                                                )}
                                            />

                                            <div className="min-w-0">
                                                <div
                                                    className={cls(
                                                        "truncate text-xs font-extrabold",
                                                        mine ? "text-white" : "text-[#131E5C]",
                                                    )}
                                                >
                                                    {attachment.name ? shortName(attachment.name) : "Archivo"}
                                                </div>

                                                <div
                                                    className={cls(
                                                        "text-[11px] font-bold",
                                                        mine ? "text-white/70" : "text-slate-500",
                                                    )}
                                                >
                                                    {attachment.mime ? attachment.mime : ""}
                                                    {attachment.size ? ` · ${humanBytes(attachment.size)}` : ""}
                                                </div>
                                            </div>
                                        </a>
                                    </AttachmentShell>
                                );
                            })}
                        </div>
                    ) : null}

                    <div className="whitespace-pre-wrap text-sm font-semibold leading-relaxed">
                        {shown}
                    </div>

                    {isAi ? (
                        <div className="mt-2">
                            <span
                                className={cls(
                                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-extrabold",
                                    mine
                                        ? "border-white/20 bg-white/10 text-white"
                                        : "border-emerald-200 bg-emerald-50 text-emerald-700",
                                )}
                            >
                                IA
                            </span>
                        </div>
                    ) : null}

                    <div
                        className={cls(
                            "mt-1 flex items-center justify-end gap-2 text-[11px] font-bold",
                            mine ? "text-white/75" : "text-slate-500",
                        )}
                    >
                        <span>{time}</span>
                        {mine ? <span className="text-white/80">{statusText}</span> : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DigitalesContacto() {
    const navigate = useNavigate();
    const location = useLocation();
    const [params] = useSearchParams();

    const telParam = params.get("tel") || "";
    const tel = useMemo(() => normalizaTelefonoMx(telParam), [telParam]);
    const directParam = params.get("direct") || "";
    const isDirectChatMode = useMemo(
        () => Boolean(tel && directParam === "1"),
        [tel, directParam],
    );

    const [q, setQ] = useState("");
    const [loadingList, setLoadingList] = useState(false);
    const [loadingChat, setLoadingChat] = useState(false);
    const [chats, setChats] = useState([]);
    const [activeTel, setActiveTel] = useState("");
    const [prospecto, setProspecto] = useState(null);
    const [mensajes, setMensajes] = useState([]);
    const [draftMsg, setDraftMsg] = useState("");
    const [mobileView, setMobileView] = useState("list");

    const [openTpl, setOpenTpl] = useState(false);
    const [tplSelected, setTplSelected] = useState(null);
    const [tplDraft, setTplDraft] = useState({});
    const [templatesDisponibles, setTemplatesDisponibles] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [templatesError, setTemplatesError] = useState("");

    const [openEmoji, setOpenEmoji] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const [dragOver, setDragOver] = useState(false);
    const [editingMsgId, setEditingMsgId] = useState(null);

    const endRef = useRef(null);
    const activeTelRef = useRef("");
    const mensajesRef = useRef([]);
    const didInitFromQuery = useRef(false);
    const emojiRef = useRef(null);
    const fileInputRef = useRef(null);
    const inputRef = useRef(null);
    const dragDepthRef = useRef(0);

    const templateMap = useMemo(() => {
        const map = new Map();

        for (const template of templatesDisponibles || []) {
            if (template?.key) {
                map.set(template.key, template);
            }
        }

        return map;
    }, [templatesDisponibles]);

    function fmtDT(iso) {
        if (!iso) return "—";

        const date = new Date(iso);

        if (Number.isNaN(date.getTime())) return "—";

        return new Intl.DateTimeFormat("es-MX", {
            dateStyle: "short",
            timeStyle: "short",
            hour12: true,
            timeZone: "America/Mexico_City",
        }).format(date);
    }

    function cleanupPreviews(list) {
        for (const attachment of list) {
            if (attachment?.previewUrl?.startsWith("blob:")) {
                try {
                    URL.revokeObjectURL(attachment.previewUrl);
                } catch {
                    // sin acción
                }
            }
        }
    }

    function renderTextForBubble(text) {
        return formatTemplateMarkerText(text, templateMap);
    }

    async function cargarPlantillas() {
        try {
            setLoadingTemplates(true);
            setTemplatesError("");

            const response = await api.digitalesPlantillas();
            const items = Array.isArray(response?.items) ? response.items : [];

            setTemplatesDisponibles(items);
        } catch (error) {
            console.error(error);
            setTemplatesDisponibles([]);
            setTemplatesError(error?.message || "No se pudieron cargar las plantillas.");
        } finally {
            setLoadingTemplates(false);
        }
    }

    async function refreshChats() {
        const data = await api.digitalesChats();

        const normalized = (Array.isArray(data) ? data : []).map((chat) => ({
            id: chat.id || chat.telefono || crypto.randomUUID(),
            telefono: normalizaTelefonoMx(chat.telefono || ""),
            nombre: chat.nombre || "Prospecto",
            agencia: chat.agencia || "",
            linea: chat.linea || "",
            estado: chat.estado || "",
            unread: Number(chat.unread || 0),
            last: {
                text: chat.last_text || "",
                time: chat.last_time || "",
            },
        }));

        setChats(normalized);
    }

    async function refreshActiveChat(tel52) {
        const target = tel52 || activeTel;

        if (!target) return;

        const data = await api.digitalesContacto(target, {
            limit: 80,
            days: 3,
        });

        setProspecto(data.prospecto || null);
        setMensajes(
            (Array.isArray(data.mensajes) ? data.mensajes : []).map(normalizeMessage),
        );

        if (!isDirectChatMode) {
            await refreshChats().catch(() => { });
        }
    }

    function addFilesAsAttachments(files) {
        const arr = Array.from(files || []);

        if (!arr.length) return;

        setAttachments((prev) => {
            const next = [...prev];

            const signature = (file) =>
                `${file?.name || ""}|${file?.size || 0}|${file?.lastModified || 0}`;

            const existing = new Set(next.map((attachment) => signature(attachment.file)));

            for (const file of arr) {
                if (!file) continue;

                const key = signature(file);

                if (existing.has(key)) continue;

                const id = crypto.randomUUID();
                const kind = fileKind(file);
                const previewUrl = kind === "image" ? URL.createObjectURL(file) : "";

                next.push({
                    id,
                    file,
                    kind,
                    previewUrl,
                    name: file.name,
                    size: file.size,
                });

                existing.add(key);
            }

            return next.slice(0, 10);
        });
    }

    function removeAttachment(id) {
        setAttachments((prev) => {
            const target = prev.find((item) => item.id === id);

            if (target?.previewUrl?.startsWith("blob:")) {
                try {
                    URL.revokeObjectURL(target.previewUrl);
                } catch {
                    // sin acción
                }
            }

            return prev.filter((item) => item.id !== id);
        });
    }

    function resetComposer() {
        setDraftMsg("");
        setEditingMsgId(null);
        setOpenEmoji(false);
        cleanupPreviews(attachments);
        setAttachments([]);
    }

    function clearTelQueryIfAny() {
        if (!telParam) return;

        navigate(
            {
                pathname: location.pathname,
                search: "",
            },
            {
                replace: true,
            },
        );
    }

    async function openChatByTel(tel52) {
        const normalized = normalizaTelefonoMx(tel52);

        if (!normalized) return;

        clearTelQueryIfAny();

        setActiveTel(normalized);
        setMobileView("chat");

        setChats((prev) =>
            prev.map((chat) =>
                chat.telefono === normalized
                    ? {
                        ...chat,
                        unread: 0,
                    }
                    : chat,
            ),
        );

        await refreshChats().catch(() => { });
    }

    function onPickEmoji(emojiObj) {
        const emoji = emojiObj?.emoji || "";

        if (!emoji) return;

        setDraftMsg((prev) => prev + emoji);
        inputRef.current?.focus?.();
    }

    function onPasteInComposer(event) {
        if (!activeTel) return;

        const items = event.clipboardData?.items
            ? Array.from(event.clipboardData.items)
            : [];

        if (!items.length) return;

        const files = [];

        for (const item of items) {
            if (item.kind === "file") {
                const file = item.getAsFile?.();

                if (file) files.push(file);
            }
        }

        if (files.length) {
            event.preventDefault();
            addFilesAsAttachments(files);
        }
    }

    function onDragEnterComposer(event) {
        if (!activeTel) return;

        event.preventDefault();
        event.stopPropagation();

        dragDepthRef.current += 1;
        setDragOver(true);
    }

    function onDragOverComposer(event) {
        if (!activeTel) return;

        event.preventDefault();
        event.stopPropagation();

        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = "copy";
        }

        setDragOver(true);
    }

    function onDragLeaveComposer(event) {
        if (!activeTel) return;

        event.preventDefault();
        event.stopPropagation();

        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

        if (dragDepthRef.current === 0) {
            setDragOver(false);
        }
    }

    function onDropComposer(event) {
        if (!activeTel) return;

        event.preventDefault();
        event.stopPropagation();

        dragDepthRef.current = 0;
        setDragOver(false);

        const files = extractFilesFromDataTransfer(event.dataTransfer);

        if (files.length) {
            addFilesAsAttachments(files);
        }

        inputRef.current?.focus?.();
    }

    function abrirPlantillas() {
        if (!activeTel) return;

        setTplSelected(null);
        setTplDraft({});
        setOpenTpl(true);

        cargarPlantillas();
    }

    function pickTemplate(template) {
        setTplSelected(template);

        const currentAgencia = (prospecto?.agencia || activeChat?.agencia || "").trim();

        const bestDealer =
            DEALERS.find((dealer) => dealer.toLowerCase() === currentAgencia.toLowerCase()) ||
            DEALERS.find((dealer) => currentAgencia.toLowerCase().includes(dealer.toLowerCase())) ||
            "";

        const currentCanal = (prospecto?.canal_contacto || "").trim();

        const bestCanal =
            CANALES.find((canal) => canal.toLowerCase() === currentCanal.toLowerCase()) ||
            "";

        const asesorAuto =
            (prospecto?.asesor_digital || "").trim() ||
            (prospecto?.asesor_ventas || "").trim() ||
            (prospecto?.responsable || "").trim() ||
            "";

        const context = {
            nombre: (prospecto?.nombre || activeChat?.nombre || "").trim(),
            agencia: bestDealer,
            modelo: (prospecto?.auto_interes || "").trim(),
            canal: bestCanal,
            asesor: asesorAuto,
            tema: prospecto?.auto_interes ? "auto de interés" : "cita",
            dato: "horario",
        };

        const draft = {};

        for (const field of template.fields || []) {
            draft[field.key] = getDefaultValueForTemplateField(field, context);
        }

        setTplDraft(draft);
    }

    async function enviarMensaje() {
        if (!activeTel) return;

        const text = draftMsg.trim();
        const hasText = Boolean(text);
        const hasAttachments = attachments.length > 0;

        if (!hasText && !hasAttachments) return;

        const editId = editingMsgId;
        const currentAttachments = attachments;

        if (editId) {
            if (!hasText) {
                alert("Para editar, escribe texto.");
                return;
            }

            setMensajes((prev) =>
                prev.map((message) =>
                    (message.wa_message_id || message.id) === editId
                        ? {
                            ...message,
                            text,
                            status: "sent",
                            edited: true,
                            time: message.time,
                        }
                        : message,
                ),
            );

            setDraftMsg("");
            setEditingMsgId(null);
            setOpenEmoji(false);

            try {
                await api.digitalesEditarMensaje({
                    to: activeTel,
                    message_id: editId,
                    text,
                });

                await refreshActiveChat(activeTel);
            } catch (error) {
                alert(`Falló edición: ${error.message}`);
                await refreshActiveChat(activeTel).catch(() => { });
            }

            return;
        }

        const optimisticId = crypto.randomUUID();

        setMensajes((prev) => [
            ...prev,
            {
                id: optimisticId,
                mine: true,
                text: hasText ? text : "Adjunto",
                time: "Ahora",
                status: "sent",
                attachments: currentAttachments.map((attachment) => ({
                    id: attachment.id,
                    kind: attachment.kind,
                    previewUrl: attachment.previewUrl,
                    name: attachment.name,
                    size: attachment.size,
                })),
            },
        ]);

        resetComposer();

        try {
            if (hasAttachments) {
                await api.digitalesEnviarMedia({
                    to: activeTel,
                    text: hasText ? text : "",
                    files: currentAttachments.map((attachment) => attachment.file),
                });
            } else {
                await api.digitalesEnviarMensaje({
                    to: activeTel,
                    text,
                });
            }

            await refreshActiveChat(activeTel);
        } catch (error) {
            alert(`Falló: ${error.message}`);
            await refreshActiveChat(activeTel).catch(() => { });
        }
    }

    async function enviarPlantilla() {
        if (!activeTel || !tplSelected) return;

        const fields = Array.isArray(tplSelected.fields) ? tplSelected.fields : [];

        const missing = fields.some((field) =>
            !String(tplDraft[field.key] || "").trim(),
        );

        if (missing) {
            alert("Completa todos los campos de la plantilla.");
            return;
        }

        const idioma = tplSelected.idioma || tplSelected.language || "es_MX";
        const textoPreview = buildTemplatePreviewText(tplSelected, tplDraft);
        const components = buildDynamicTemplateComponents(tplSelected, tplDraft);

        setMensajes((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                mine: true,
                text: textoPreview || `Plantilla: ${tplSelected.key}`,
                time: "Ahora",
                status: "sent",
            },
        ]);

        try {
            await api.digitalesEnviarPlantilla({
                to: activeTel,
                template_name: tplSelected.key,
                idioma,
                components: components.length ? components : undefined,
                params: components.length ? undefined : [],
            });

            setOpenTpl(false);
            await refreshActiveChat(activeTel);
        } catch (error) {
            alert(`Falló plantilla: ${error.message}`);
            await refreshActiveChat(activeTel).catch(() => { });
        }
    }

    function startEditMessage(message) {
        if (!message?.mine) return;

        setEditingMsgId(message.wa_message_id || message.id);
        setDraftMsg(String(message.text || ""));
        inputRef.current?.focus?.();
    }

    async function deleteMessage(message) {
        if (!message?.mine) return;

        const id = message.wa_message_id || message.id;

        setMensajes((prev) =>
            prev.filter((item) => (item.wa_message_id || item.id) !== id),
        );

        try {
            if (typeof api.digitalesEliminarMensaje !== "function") {
                alert("Falta implementar api.digitalesEliminarMensaje en tu lib/apiPruebas.");
            } else {
                await api.digitalesEliminarMensaje({
                    to: activeTel,
                    message_id: id,
                });
            }

            await refreshChats().catch(() => { });
        } catch (error) {
            alert(`No se pudo eliminar: ${error.message}`);
            await refreshActiveChat(activeTel).catch(() => { });
        }
    }

    useEffect(() => {
        endRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [mensajes.length, activeTel]);

    useEffect(() => {
        activeTelRef.current = activeTel;
    }, [activeTel]);

    useEffect(() => {
        mensajesRef.current = mensajes;
    }, [mensajes]);

    useEffect(() => {
        return () => cleanupPreviews(attachments);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const onDoc = (event) => {
            if (!openEmoji) return;

            if (emojiRef.current && !emojiRef.current.contains(event.target)) {
                setOpenEmoji(false);
            }
        };

        document.addEventListener("mousedown", onDoc);

        return () => document.removeEventListener("mousedown", onDoc);
    }, [openEmoji]);

    useEffect(() => {
        const onNuevoMensaje = async (event) => {
            const data = event.detail || {};
            const telefonoMensaje = normalizaTelefonoMx(data.telefono || "");

            if (!telefonoMensaje) return;

            if (telefonoMensaje === activeTelRef.current) {
                await refreshActiveChat(telefonoMensaje).catch(() => { });
                return;
            }

            if (!isDirectChatMode) {
                await refreshChats().catch(() => { });
            }
        };

        window.addEventListener("whatsapp:nuevo-mensaje", onNuevoMensaje);

        return () => {
            window.removeEventListener("whatsapp:nuevo-mensaje", onNuevoMensaje);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDirectChatMode]);

    useEffect(() => {
        let ignore = false;

        if (isDirectChatMode) {
            setChats([]);
            setLoadingList(false);

            return () => {
                ignore = true;
            };
        }

        (async () => {
            try {
                setLoadingList(true);
                await refreshChats();
            } catch {
                if (!ignore) setChats([]);
            } finally {
                if (!ignore) setLoadingList(false);
            }
        })();

        return () => {
            ignore = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDirectChatMode]);

    useEffect(() => {
        if (tel && !didInitFromQuery.current) {
            didInitFromQuery.current = true;
            setActiveTel(tel);
            setMobileView("chat");
            return;
        }

        if (!tel && !activeTel && chats.length) {
            setActiveTel(chats[0].telefono);
        }
    }, [tel, chats, activeTel]);

    useEffect(() => {
        let ignore = false;

        (async () => {
            if (!activeTel) {
                setProspecto(null);
                setMensajes([]);
                return;
            }

            try {
                setLoadingChat(true);

                const data = await api.digitalesContacto(activeTel, {
                    limit: 80,
                    days: 3,
                });

                if (ignore) return;

                setProspecto(data.prospecto || null);
                setMensajes(
                    (Array.isArray(data.mensajes) ? data.mensajes : []).map(normalizeMessage),
                );

                if (!isDirectChatMode) {
                    await refreshChats().catch(() => { });
                }
            } catch {
                if (ignore) return;

                setProspecto(null);
                setMensajes([]);
            } finally {
                if (!ignore) {
                    setLoadingChat(false);
                }
            }
        })();

        return () => {
            ignore = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTel, isDirectChatMode]);

    useEffect(() => {
        let alive = true;
        let timer = null;
        let tickCount = 0;

        const tick = async () => {
            try {
                const target = activeTelRef.current;

                if (!target) {
                    timer = setTimeout(tick, 3500);
                    return;
                }

                const prev = mensajesRef.current || [];
                const last = prev[prev.length - 1];
                const after = last?.created_at ? last.created_at : "";

                const data = await api.digitalesContactoUpdates(target, after, {
                    days: 3,
                });

                if (!alive) return;

                const incoming = (Array.isArray(data?.mensajes) ? data.mensajes : [])
                    .map(normalizeMessage);

                if (incoming.length) {
                    setMensajes((old) => {
                        const seen = new Set(
                            old.map((message) => message.wa_message_id || message.id),
                        );

                        const add = incoming.filter(
                            (message) => !seen.has(message.wa_message_id || message.id),
                        );

                        return add.length ? [...old, ...add] : old;
                    });

                    if (!isDirectChatMode) {
                        await refreshChats().catch(() => { });
                    }
                } else {
                    tickCount += 1;

                    if (!isDirectChatMode && tickCount % 5 === 0) {
                        await refreshChats().catch(() => { });
                    }
                }
            } catch {
                // polling silencioso
            }

            timer = setTimeout(tick, 3500);
        };

        tick();

        return () => {
            alive = false;

            if (timer) {
                clearTimeout(timer);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDirectChatMode]);

    const activeChat = useMemo(() => {
        if (!activeTel) return null;

        const fromList = chats.find((chat) => chat.telefono === activeTel);

        if (fromList) return fromList;

        return {
            id: activeTel,
            telefono: activeTel,
            nombre: prospecto?.nombre || "Prospecto",
            agencia: prospecto?.agencia || "",
            linea: prospecto?.business || "",
            estado: prospecto?.estado || "",
            unread: 0,
            last: {
                text: "",
                time: "",
            },
        };
    }, [activeTel, chats, prospecto]);

    const filteredChats = useMemo(() => {
        const query = q.trim().toLowerCase();

        return chats.filter((chat) => {
            if (!query) return true;

            return (
                safeLower(chat.nombre).includes(query) ||
                safeLower(chat.telefono).includes(query) ||
                safeLower(chat.agencia).includes(query) ||
                safeLower(chat.linea).includes(query) ||
                safeLower(chat.estado).includes(query) ||
                safeLower(chat.last?.text).includes(query)
            );
        });
    }, [chats, q]);

    const composerHint = useMemo(() => {
        if (!activeTel) return "Selecciona un chat para escribir…";
        if (editingMsgId) return "Editando mensaje… (Enter para guardar)";

        return "Escribe un mensaje…";
    }, [activeTel, editingMsgId]);

    const templatePreview = useMemo(() => {
        if (!tplSelected) return "";

        return buildTemplatePreviewText(tplSelected, tplDraft);
    }, [tplSelected, tplDraft]);

    return (
        <div className="w-full">
            <div className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
                <div
                    className="px-4 py-4 text-white sm:px-5"
                    style={{ backgroundColor: BRAND_BLUE }}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-lg font-extrabold">
                                Seguimiento por WhatsApp
                            </div>

                            <div className="text-xs opacity-80">
                                {activeTel ? `Chat: ${formateaTelUi(activeTel)}` : "Selecciona un chat"}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setMobileView("list")}
                                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-extrabold text-white hover:bg-white/15 lg:hidden"
                                type="button"
                                title="Ver chats"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Chats
                            </button>

                            <button
                                onClick={() => navigate("/comercial/prospectos")}
                                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-extrabold text-white hover:bg-white/15"
                                title="Volver a Prospectos"
                                type="button"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Volver
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    className={cls(
                        "grid h-[calc(100dvh-170px)] sm:h-[75vh]",
                        isDirectChatMode
                            ? "grid-cols-1"
                            : "grid-cols-1 lg:grid-cols-[360px_1fr]",
                    )}
                >
                    <aside
                        className={cls(
                            "border-r border-black/10 bg-neutral-50",
                            isDirectChatMode
                                ? "hidden"
                                : mobileView === "chat"
                                    ? "hidden lg:block"
                                    : "block",
                        )}
                    >
                        <div className="border-b border-black/10 bg-white p-4">
                            <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-neutral-100 px-3 py-2">
                                <Search className="h-4 w-4 text-[#131E5C]" />

                                <input
                                    value={q}
                                    onChange={(event) => setQ(event.target.value)}
                                    placeholder="Buscar prospecto, número, agencia…"
                                    className="w-full bg-transparent text-sm font-semibold text-[#131E5C] outline-none placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        <div className="h-[calc(100dvh-270px)] overflow-auto sm:h-[calc(75vh-88px)]">
                            {loadingList ? (
                                <ChatListSkeleton rows={9} />
                            ) : filteredChats.length ? (
                                filteredChats.map((chat) => {
                                    const isActive = chat.telefono === activeTel;

                                    return (
                                        <button
                                            key={chat.id}
                                            onClick={() => openChatByTel(chat.telefono)}
                                            className={cls(
                                                "w-full border-b border-black/5 px-4 py-3 text-left transition",
                                                isActive
                                                    ? "bg-white"
                                                    : "bg-neutral-50 hover:bg-white",
                                            )}
                                            type="button"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar name={chat.nombre} />

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="truncate text-sm font-extrabold text-[#131E5C]">
                                                            {chat.nombre}
                                                        </div>

                                                        <div className="text-[11px] font-bold text-slate-400">
                                                            {chat.last?.time || ""}
                                                        </div>
                                                    </div>

                                                    <div className="mt-0.5 flex items-center justify-between gap-2">
                                                        <div className="truncate text-xs font-semibold text-slate-500">
                                                            {chat.last?.text || formateaTelUi(chat.telefono)}
                                                        </div>

                                                        {chat.unread > 0 ? (
                                                            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[11px] font-extrabold text-white">
                                                                {chat.unread}
                                                            </span>
                                                        ) : null}
                                                    </div>

                                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                                        <span
                                                            className={cls(
                                                                "inline-flex items-center rounded-full border border-black/10 bg-white px-2 py-0.5 text-[11px] font-bold",
                                                                chat.estado ? "text-slate-600" : "text-slate-400",
                                                            )}
                                                        >
                                                            {chat.estado || "Sin estado"}
                                                        </span>

                                                        {chat.agencia ? (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                                                                <Building2 className="h-3.5 w-3.5" />
                                                                {chat.agencia}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="p-8 text-center">
                                    <div className="text-sm font-extrabold text-[#131E5C]">
                                        Sin historial aún
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>

                    <section
                        className={cls(
                            "relative flex min-h-0 flex-col bg-white",
                            mobileView === "list" ? "hidden lg:flex" : "flex",
                        )}
                    >
                        <div className="flex items-center justify-between gap-3 border-b border-black/10 bg-white px-4 py-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <Avatar name={activeChat?.nombre || "Prospecto"} />

                                <div className="min-w-0">
                                    <div className="truncate text-sm font-extrabold text-[#131E5C]">
                                        {activeChat?.nombre || "Selecciona un chat"}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
                                        <span className="inline-flex items-center gap-1">
                                            <User className="h-3.5 w-3.5" />
                                            {activeTel ? formateaTelUi(activeTel) : "—"}
                                        </span>

                                        <span className="inline-flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            {loadingChat ? "Cargando..." : "Listo"}
                                        </span>

                                        <span className="text-[11px] font-bold text-slate-500">
                                            Registro: {fmtDT(prospecto?.creado)} · Primer contacto: {fmtDT(prospecto?.primer_contacto_at)} · Último contacto: {fmtDT(prospecto?.ultimo_contacto_at)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={abrirPlantillas}
                                disabled={!activeTel}
                                className={cls(
                                    "inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-[#131E5C] hover:bg-neutral-50",
                                    !activeTel ? "cursor-not-allowed opacity-60" : "",
                                )}
                                type="button"
                                title="Enviar plantilla"
                            >
                                <LayoutTemplate className="h-4 w-4" />
                                Plantillas
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-50 via-white to-neutral-50 px-3 py-4 sm:px-4">
                            <div className="mx-auto max-w-3xl space-y-3">
                                {!activeTel ? (
                                    <div className="py-10 text-center font-semibold text-slate-500">
                                        Selecciona un chat del historial para ver la conversación.
                                    </div>
                                ) : loadingChat ? (
                                    <MessagesSkeleton bubbles={10} />
                                ) : mensajes.length === 0 ? (
                                    <div className="py-10 text-center font-semibold text-slate-500">
                                        Aún no hay mensajes con este número.
                                    </div>
                                ) : (
                                    mensajes.map((message) => (
                                        <MessageBubble
                                            key={message.id}
                                            mine={Boolean(message.mine)}
                                            text={message.text}
                                            time={message.time || ""}
                                            status={message.status || "sent"}
                                            attachments={message.attachments || []}
                                            isAi={Boolean(message.is_ai)}
                                            renderText={renderTextForBubble}
                                            onEdit={() => startEditMessage(message)}
                                            onDelete={() => deleteMessage(message)}
                                        />
                                    ))
                                )}

                                <div ref={endRef} />
                            </div>
                        </div>

                        <div
                            className={cls(
                                "border-t border-black/10 bg-white px-3 py-3",
                                dragOver ? "relative" : "",
                            )}
                            onDragEnter={onDragEnterComposer}
                            onDragOver={onDragOverComposer}
                            onDragLeave={onDragLeaveComposer}
                            onDrop={onDropComposer}
                        >
                            <div className="mx-auto max-w-3xl">
                                {dragOver && activeTel ? (
                                    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
                                        <div className="rounded-2xl border border-dashed border-[#131E5C]/40 bg-white px-6 py-4 shadow-lg">
                                            <div className="flex items-center gap-3">
                                                <Paperclip className="h-5 w-5 text-[#131E5C]" />

                                                <div className="text-sm font-extrabold text-[#131E5C]">
                                                    Suelta para adjuntar archivos
                                                </div>
                                            </div>

                                            <div className="mt-1 text-xs font-semibold text-slate-500">
                                                Se adjuntarán al mensaje, máximo 10.
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                {attachments.length ? (
                                    <div className="mb-2 flex flex-wrap gap-2">
                                        {attachments.map((attachment) => (
                                            <div
                                                key={attachment.id}
                                                className="flex items-center gap-2 rounded-xl border border-black/10 bg-neutral-50 px-3 py-2"
                                            >
                                                {attachment.kind === "image" ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-10 w-10 overflow-hidden rounded-lg border border-black/10 bg-white">
                                                            <img
                                                                src={attachment.previewUrl}
                                                                alt={attachment.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </div>

                                                        <div className="min-w-0">
                                                            <div className="max-w-[180px] truncate text-xs font-extrabold text-[#131E5C]">
                                                                {attachment.name ? shortName(attachment.name) : "Imagen"}
                                                            </div>

                                                            <div className="text-[11px] font-bold text-slate-500">
                                                                {humanBytes(attachment.size)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-[#131E5C]" />

                                                        <div className="min-w-0">
                                                            <div className="max-w-[180px] truncate text-xs font-extrabold text-[#131E5C]">
                                                                {attachment.name ? shortName(attachment.name) : "Archivo"}
                                                            </div>

                                                            <div className="text-[11px] font-bold text-slate-500">
                                                                {humanBytes(attachment.size)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachment(attachment.id)}
                                                    className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-white hover:bg-neutral-100"
                                                    title="Quitar"
                                                >
                                                    <X className="h-4 w-4 text-[#131E5C]" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}

                                <div className="flex items-center gap-2">
                                    <div className="relative" ref={emojiRef}>
                                        <button
                                            className={cls(
                                                "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white hover:bg-neutral-50",
                                                !activeTel ? "cursor-not-allowed opacity-60" : "",
                                            )}
                                            title="Emojis"
                                            type="button"
                                            disabled={!activeTel}
                                            onClick={() => setOpenEmoji((prev) => !prev)}
                                        >
                                            <Smile className="h-5 w-5 text-[#131E5C]" />
                                        </button>

                                        {openEmoji ? (
                                            <div className="absolute bottom-14 left-0 z-50 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
                                                <EmojiPicker
                                                    onEmojiClick={(emojiObj) => onPickEmoji(emojiObj)}
                                                    searchDisabled={false}
                                                    skinTonesDisabled={false}
                                                    lazyLoadEmojis
                                                    height={360}
                                                    width={320}
                                                />
                                            </div>
                                        ) : null}
                                    </div>

                                    <div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            className="hidden"
                                            onChange={(event) => {
                                                const files = event.target.files;
                                                addFilesAsAttachments(files);
                                                event.target.value = "";
                                            }}
                                        />

                                        <button
                                            className={cls(
                                                "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white hover:bg-neutral-50",
                                                !activeTel ? "cursor-not-allowed opacity-60" : "",
                                            )}
                                            title="Adjuntar"
                                            type="button"
                                            disabled={!activeTel}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Paperclip className="h-5 w-5 text-[#131E5C]" />
                                        </button>
                                    </div>

                                    <input
                                        ref={inputRef}
                                        value={draftMsg}
                                        onChange={(event) => setDraftMsg(event.target.value)}
                                        onPaste={onPasteInComposer}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter") {
                                                enviarMensaje();
                                            }
                                        }}
                                        onDragEnter={onDragEnterComposer}
                                        onDragOver={onDragOverComposer}
                                        onDragLeave={onDragLeaveComposer}
                                        onDrop={onDropComposer}
                                        placeholder={composerHint}
                                        disabled={!activeTel}
                                        className={cls(
                                            "h-11 flex-1 rounded-xl border border-black/10 bg-neutral-100 px-4 text-sm font-semibold text-[#131E5C] outline-none placeholder:text-slate-400",
                                            !activeTel ? "cursor-not-allowed opacity-60" : "",
                                            dragOver && activeTel
                                                ? "border-[#131E5C]/25 bg-[#131E5C]/[0.04] ring-2 ring-[#131E5C]/30"
                                                : "",
                                        )}
                                    />

                                    <button
                                        onClick={enviarMensaje}
                                        disabled={!activeTel}
                                        className={cls(
                                            "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold text-white shadow-sm hover:opacity-95",
                                            !activeTel ? "cursor-not-allowed opacity-60" : "",
                                        )}
                                        style={{ backgroundColor: BRAND_BLUE }}
                                        title={editingMsgId ? "Guardar" : "Enviar"}
                                        type="button"
                                    >
                                        <Send className="h-4 w-4" />
                                        <span className="hidden sm:inline">
                                            {editingMsgId ? "Guardar" : "Enviar"}
                                        </span>
                                    </button>
                                </div>

                                {activeTel && editingMsgId ? (
                                    <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-slate-500">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingMsgId(null);
                                                setDraftMsg("");
                                            }}
                                            className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[11px] font-extrabold text-[#131E5C] hover:bg-neutral-50"
                                        >
                                            Cancelar edición
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <Modal
                open={openTpl}
                title={tplSelected ? `Plantilla: ${tplSelected.title}` : "Plantillas"}
                onClose={() => setOpenTpl(false)}
                footer={
                    tplSelected ? (
                        <>
                            <button
                                onClick={() => setTplSelected(null)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-[#131E5C] hover:bg-neutral-50"
                                type="button"
                            >
                                Volver
                            </button>

                            <button
                                onClick={enviarPlantilla}
                                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white hover:opacity-95"
                                style={{ backgroundColor: BRAND_BLUE }}
                                type="button"
                            >
                                Enviar plantilla
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setOpenTpl(false)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white hover:opacity-95"
                            style={{ backgroundColor: BRAND_BLUE }}
                            type="button"
                        >
                            Cerrar
                        </button>
                    )
                }
            >
                {!tplSelected ? (
                    <div className="grid gap-3">
                        {loadingTemplates ? (
                            <div className="rounded-xl border border-black/10 bg-neutral-50 p-4 text-sm font-bold text-[#131E5C]">
                                Cargando plantillas...
                            </div>
                        ) : templatesError ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                                {templatesError}
                            </div>
                        ) : templatesDisponibles.length === 0 ? (
                            <div className="rounded-xl border border-black/10 bg-neutral-50 p-4 text-sm font-bold text-[#131E5C]">
                                No hay plantillas disponibles para esta línea.
                            </div>
                        ) : (
                            templatesDisponibles.map((template) => (
                                <button
                                    key={`${template.key}-${template.idioma || template.language || "sin-idioma"}`}
                                    type="button"
                                    onClick={() => pickTemplate(template)}
                                    className="w-full rounded-xl border border-black/10 bg-white p-4 text-left shadow-sm transition hover:bg-neutral-50"
                                >
                                    <div className="text-sm font-extrabold text-[#131E5C]">
                                        {template.title || template.key}
                                    </div>

                                    <div className="mt-1 text-xs font-bold text-slate-500">
                                        {template.key} · {template.idioma || template.language || "sin idioma"} · {template.category || "Sin categoría"}
                                    </div>

                                    {template.help ? (
                                        <div className="mt-3 whitespace-pre-wrap text-sm font-semibold text-slate-600">
                                            {template.help}
                                        </div>
                                    ) : null}
                                </button>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="grid gap-3">
                        <div>
                            <div className="text-base font-extrabold text-[#131E5C]">
                                Texto de plantilla
                            </div>

                            <div className="mt-1 text-xs font-bold text-slate-500">
                                {tplSelected.key} · idioma: {tplSelected.idioma || tplSelected.language || "es_MX"}
                            </div>

                            <div className="mt-3 whitespace-pre-wrap rounded-xl border border-black/10 bg-neutral-50 p-4 text-sm font-semibold text-[#131E5C]">
                                {templatePreview || tplSelected.help || "Esta plantilla no tiene texto visible."}
                            </div>
                        </div>

                        {(tplSelected.fields || []).length ? (
                            (tplSelected.fields || []).map((field) => {
                                const options = getFieldOptions(field);

                                return (
                                    <div key={field.key}>
                                        <div className="mb-1 text-xs font-extrabold text-[#131E5C]">
                                            {field.label || field.key}
                                        </div>

                                        {options.length ? (
                                            <div className="relative">
                                                <select
                                                    value={tplDraft[field.key] || ""}
                                                    onChange={(event) =>
                                                        setTplDraft((prev) => ({
                                                            ...prev,
                                                            [field.key]: event.target.value,
                                                        }))
                                                    }
                                                    className="w-full appearance-none rounded-xl border border-black/10 bg-white px-4 py-3 pr-10 text-sm font-semibold text-[#131E5C] outline-none"
                                                >
                                                    <option value="" disabled>
                                                        Selecciona una opción…
                                                    </option>

                                                    {options.map((option) => (
                                                        <option key={option} value={option}>
                                                            {option}
                                                        </option>
                                                    ))}
                                                </select>

                                                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                                                    <ChevronDown className="h-4 w-4 text-[#131E5C]/60" />
                                                </span>
                                            </div>
                                        ) : (
                                            <input
                                                value={tplDraft[field.key] || ""}
                                                onChange={(event) =>
                                                    setTplDraft((prev) => ({
                                                        ...prev,
                                                        [field.key]: event.target.value,
                                                    }))
                                                }
                                                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[#131E5C] outline-none"
                                            />
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                                Esta plantilla no requiere parámetros.
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}