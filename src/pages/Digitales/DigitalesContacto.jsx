// src/pages/Digitales/DigitalesContacto.jsx
import { useEffect, useMemo, useRef, useState, useDeferredValue } from "react";
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
    ChevronRight,
    ChevronDown,
    Paperclip,
    FileText,
    Plus,
    Copy,
    Check,
    Save,
    MailOpen,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { api } from "../../lib/apiPruebas";

const BRAND_BLUE = "#000000";
const QUICK_BUBBLES_KEY = "volvo_digitales_quick_bubbles_global";
const CHAT_PAGE_SIZE = 24;
const CHAT_UPDATES_LIMIT = 80;
const CHAT_CACHE_LIMIT = 80;
const PREFETCH_CHAT_LIMIT = 12;

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
    "Avalúo",
];

const CANALES = [
    "Volvo-Concesionario",
    "WhatsApp",
    "Facebook",
    "Llamada Entrante",
];

const ESTADOS_PROSPECTO = ["Descalificado", "Contactado", "Sin Respuesta"];


const BUSINESS_OPTIONS = [
    "Nuevos",
    "Usados",
    "Comerciales",
];

const PAUTAS_ORIGEN = [
    "Facebook Ads",
    "Google Ads",
    "Instagram Ads",
    "Orgánico",
    "Referido",
    "WhatsApp",
    "Evento",
    "Otro",
];

function normalizeCampanasMetaOptions(response) {
    const rawItems = Array.isArray(response)
        ? response
        : Array.isArray(response?.items)
            ? response.items
            : Array.isArray(response?.results)
                ? response.results
                : Array.isArray(response?.data)
                    ? response.data
                    : [];

    const values = rawItems
        .map((item) => {
            if (typeof item === "string") return item;

            return (
                item?.value ||
                item?.label ||
                item?.pauta ||
                item?.pauta_origen ||
                item?.nombre ||
                item?.name ||
                item?.campana ||
                item?.campaign_name ||
                item?.campaign ||
                item?.ad_name ||
                ""
            );
        })
        .map((value) => String(value || "").trim())
        .filter(Boolean);

    const unique = [];
    const seen = new Set();

    for (const value of [...values, ...PAUTAS_ORIGEN]) {
        const key = value.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(value);
    }

    return unique;
}

function renderOptionsConValorActual(
    options,
    currentValue,
    placeholder = "Selecciona una opción…"
) {
    const value = String(currentValue || "").trim();

    const exists = (options || []).some(
        (option) => String(option || "").trim().toLowerCase() === value.toLowerCase()
    );

    return (
        <>
            <option value="">{placeholder}</option>

            {value && !exists ? (
                <option value={value}>{value} (actual)</option>
            ) : null}

            {(options || []).map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </>
    );
}

function getStatusDotColor(estado) {
    const value = String(estado || "").toLowerCase();
    if (value === "descalificado") return "#3B82F6"; // azul
    if (value === "sin respuesta" || value === "sin_respuesta" || value === "") return "#EF4444"; // rojo
    return "#22C55E"; // verde — respondió / tiene estado activo
}

function cls(...items) {
    return items.filter(Boolean).join(" ");
}

function safeLower(value) {
    return String(value || "").toLowerCase();
}

function normalizeText(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function normalizeProspectoToChat(p) {
    return {
        id: `prospecto-${p.id || p.telefono}`,
        prospectoId: p.id,
        telefono: normalizaTelefonoMx(p.telefono || ""),
        nombre: p.nombre || "Prospecto",
        agencia: p.agencia || "",
        linea: p.business || "",
        estado: p.estado || "",
        unread: 0,
        last: {
            text: p.comentarios || "Sin historial reciente",
            time: "",
        },
        isOnlyProspecto: true,
    };
}

function mergeChatsConProspectos(chats, prospectos) {
    const map = new Map();

    for (const chat of chats || []) {
        if (chat.telefono) map.set(chat.telefono, chat);
    }

    for (const prospecto of prospectos || []) {
        const chat = normalizeProspectoToChat(prospecto);
        if (!chat.telefono) continue;

        if (!map.has(chat.telefono)) {
            map.set(chat.telefono, chat);
        }
    }

    return Array.from(map.values());
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

function prettyStatus(status) {
    const value = String(status || "").toLowerCase();

    if (value === "accepted") return "aceptado";
    if (value === "sent") return "enviado";
    if (value === "delivered") return "entregado";
    if (value === "read") return "leído";
    if (value === "failed") return "falló";
    if (value === "received") return "";

    return value || "—";
}

function parseWhatsAppFormat(texto) {
    let resultado = String(texto || "");

    resultado = resultado
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    resultado = resultado.replace(
        /```([\s\S]+?)```/g,
        '<code class="inline-block rounded-md bg-black/10 px-1.5 py-0.5 font-mono text-[13px]">$1</code>'
    );

    resultado = resultado.replace(/\*([^*\n]+)\*/g, '<strong class="font-black">$1</strong>');
    resultado = resultado.replace(/_([^_\n]+)_/g, "<em>$1</em>");
    resultado = resultado.replace(/~([^~\n]+)~/g, "<del>$1</del>");
    resultado = resultado.replace(/\n/g, "<br>");

    return resultado;
}
function parseWhatsAppComposerFormat(texto) {
    let resultado = String(texto || "");

    resultado = resultado
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    resultado = resultado.replace(
        /```([\s\S]+?)```/g,
        '<code class="inline-block rounded-md bg-black/10 px-1.5 py-0.5 font-mono text-[13px]">$1</code>'
    );

    resultado = resultado.replace(/\*([^*\n]+)\*/g, '<strong class="font-black">$1</strong>');
    resultado = resultado.replace(/_([^_\n]+)_/g, "<em>$1</em>");
    resultado = resultado.replace(/~([^~\n]+)~/g, "<del>$1</del>");
    resultado = resultado.replace(/\n/g, "<br>");

    return resultado;
}
function WhatsAppComposerInput({
    value,
    onChange,
    onSend,
    disabled,
    placeholder,
    inputRef,
    onPaste,
}) {
    const internalRef = useRef(null);
    const mirrorRef = useRef(null);

    const setRefs = (node) => {
        internalRef.current = node;
        if (inputRef) inputRef.current = node;
    };

    useEffect(() => {
        const textarea = internalRef.current;
        if (!textarea) return;

        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
    }, [value]);

    function syncScroll() {
        if (!internalRef.current || !mirrorRef.current) return;

        mirrorRef.current.scrollTop = internalRef.current.scrollTop;
    }

    function handleKeyDown(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSend();
        }
    }

    return (
        <div className="relative min-h-[40px] flex-1">
            {!String(value || "").length ? (
                <div className="pointer-events-none absolute left-2 top-2 z-0 text-sm font-medium text-slate-400">
                    {placeholder}
                </div>
            ) : null}

            <div
                ref={mirrorRef}
                aria-hidden="true"
                className={cls(
                    "pointer-events-none absolute inset-0 z-0 max-h-32 overflow-y-auto whitespace-pre-wrap break-words px-2 py-2 text-sm font-medium leading-relaxed text-black",
                    "[&_strong]:font-black [&_em]:italic [&_del]:line-through",
                    "[&_code]:rounded-md [&_code]:bg-black/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px]"
                )}
                dangerouslySetInnerHTML={{
                    __html: value ? parseWhatsAppComposerFormat(value) : "",
                }}
            />

            <textarea
                ref={setRefs}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={onPaste}
                onScroll={syncScroll}
                disabled={disabled}
                rows={1}
                spellCheck
                className={cls(
                    "relative z-10 block max-h-32 min-h-[40px] w-full resize-none overflow-y-auto bg-transparent px-2 py-2 text-sm font-medium leading-relaxed outline-none",
                    "text-transparent caret-black placeholder:text-slate-400",
                    "selection:bg-black/20 selection:text-transparent",
                    disabled ? "cursor-not-allowed opacity-60" : ""
                )}
            />
        </div>
    );
}

function getMessageKey(message) {
    return String(message?.wa_message_id || message?.id || "");
}

function getMessageTimeValue(message) {
    const value = message?.created_at || message?.local_created_at || "";
    const time = new Date(value).getTime();

    if (Number.isNaN(time)) return 0;

    return time;
}

function mergeMessages(oldMessages, newMessages) {
    const map = new Map();

    for (const message of oldMessages || []) {
        const key = getMessageKey(message);
        if (key) map.set(key, message);
    }

    for (const message of newMessages || []) {
        const key = getMessageKey(message);
        if (key) map.set(key, message);
    }

    return Array.from(map.values()).sort((a, b) => {
        const da = getMessageTimeValue(a);
        const db = getMessageTimeValue(b);

        if (da !== db) return da - db;

        return Number(a.id || 0) - Number(b.id || 0);
    });
}

function isNearBottom(element, threshold = 180) {
    if (!element) return true;

    return element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
}

function Avatar({ name = "?" }) {
    const initials = String(name || "?")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((item) => item[0]?.toUpperCase())
        .join("");

    return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm">
            <span className="text-sm font-extrabold text-black">
                {initials || "?"}
            </span>
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
        <div className="mx-auto w-full max-w-5xl space-y-3">
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
                                    ? "border-white/10 bg-black/10"
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

    if (list.length) {
        return list.filter((file) => file && typeof file.size === "number");
    }

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

    if (label.includes("canal") || key.includes("canal")) {
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

    if (label.includes("canal") || key.includes("canal")) {
        return context.canal || "";
    }

    if (label.includes("tema") || key.includes("tema")) {
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
            <div className="max-w-[88%] sm:max-w-[82%] lg:max-w-[76%] xl:max-w-[72%]">
                <div
                    className={cls(
                        "rounded-2xl px-4 py-2.5 shadow-sm",
                        mine
                            ? "rounded-br-md bg-black text-white"
                            : "rounded-bl-md border border-black/10 bg-white text-black"
                    )}
                >
                    {attachments?.length ? (
                        <div className="mb-2 grid gap-2">
                            {attachments.map((attachment) => {
                                const src = attachment.url || attachment.previewUrl;
                                if (!src) return null;

                                if (attachment.kind === "sticker" || attachment.kind === "image") {
                                    return (
                                        <AttachmentShell key={attachment.id} mine={mine} attachment={attachment}>
                                            <a href={src} target="_blank" rel="noreferrer" className="block">
                                                <img
                                                    src={src}
                                                    alt={attachment.name || "imagen"}
                                                    className="max-h-64 w-full object-cover"
                                                    loading="lazy"
                                                />
                                            </a>
                                        </AttachmentShell>
                                    );
                                }

                                if (attachment.kind === "video") {
                                    return (
                                        <AttachmentShell key={attachment.id} mine={mine} attachment={attachment}>
                                            <video src={src} controls className="max-h-72 w-full bg-black" preload="metadata" />
                                        </AttachmentShell>
                                    );
                                }

                                if (attachment.kind === "audio") {
                                    return (
                                        <AttachmentShell key={attachment.id} mine={mine} attachment={attachment}>
                                            <div className="px-3 py-2">
                                                <audio src={src} controls className="w-full" preload="metadata" />
                                            </div>
                                        </AttachmentShell>
                                    );
                                }

                                return (
                                    <AttachmentShell key={attachment.id} mine={mine} attachment={attachment}>
                                        <a
                                            href={src}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={cls(
                                                "flex items-center gap-2 px-3 py-3 hover:opacity-90",
                                                mine ? "text-white" : "text-black"
                                            )}
                                        >
                                            <FileText className="h-4 w-4" />
                                            <div className="min-w-0">
                                                <div className="truncate text-xs font-extrabold">
                                                    {attachment.name ? shortName(attachment.name) : "Archivo"}
                                                </div>
                                                <div className={cls("text-[11px] font-bold", mine ? "text-white/70" : "text-slate-500")}>
                                                    {attachment.size ? humanBytes(attachment.size) : ""}
                                                </div>
                                            </div>
                                        </a>
                                    </AttachmentShell>
                                );
                            })}
                        </div>
                    ) : null}

                    <div
                        className="whitespace-pre-wrap text-[15px] font-medium leading-relaxed md:text-base [&_strong]:font-black [&_em]:italic [&_del]:line-through"
                        dangerouslySetInnerHTML={{
                            __html: parseWhatsAppFormat(shown),
                        }}
                    />

                    {isAi ? (
                        <div className="mt-2">
                            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-extrabold">
                                IA
                            </span>
                        </div>
                    ) : null}

                    <div className={cls("mt-1 flex items-center justify-end gap-2 text-[11px] font-bold", mine ? "text-white/75" : "text-slate-500")}>
                        <span>{time}</span>
                        {mine ? <span>{statusText}</span> : null}
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
    const directParam = params.get("direct") || "";

    const tel = useMemo(() => normalizaTelefonoMx(telParam), [telParam]);

    const isDirectChatMode = useMemo(
        () => Boolean(tel && directParam === "1"),
        [tel, directParam],
    );

    const [q, setQ] = useState("");
    const [chatFilter, setChatFilter] = useState("todos");
    const [loadingList, setLoadingList] = useState(false);
    const [loadingChat, setLoadingChat] = useState(false);
    const [chats, setChats] = useState([]);
    const [prospectosIndex, setProspectosIndex] = useState([]);
    const deferredQ = useDeferredValue(q);
    const [activeTel, setActiveTel] = useState("");
    const [prospecto, setProspecto] = useState(null);
    const [mensajes, setMensajes] = useState([]);
    const [draftMsg, setDraftMsg] = useState("");
    const [mobileView, setMobileView] = useState("list");
    const [chatSidebarCollapsed, setChatSidebarCollapsed] = useState(false);
    const [pautasOptions, setPautasOptions] = useState(PAUTAS_ORIGEN);

    const [chatHasMore, setChatHasMore] = useState(false);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [oldestMessageId, setOldestMessageId] = useState(null);

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

    const [quickBubbles, setQuickBubbles] = useState(() => {
        try {
            const saved = localStorage.getItem(QUICK_BUBBLES_KEY);
            if (!saved) return [];

            const parsed = JSON.parse(saved);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });

    const [showAddBubble, setShowAddBubble] = useState(false);
    const [newBubbleText, setNewBubbleText] = useState("");
    const [newBubbleTitle, setNewBubbleTitle] = useState("");

    // Edición rápida del prospecto
    const [showQuickEdit, setShowQuickEdit] = useState(false);
    const [quickEditDraft, setQuickEditDraft] = useState({});
    const [savingQuickEdit, setSavingQuickEdit] = useState(false);

    // Feedback de copia de teléfono
    const [copiedTel, setCopiedTel] = useState(false);

    // Acción de marcar chat como no leído
    const [markingUnreadTel, setMarkingUnreadTel] = useState("");
    const [chatMenu, setChatMenu] = useState(null);

    const endRef = useRef(null);
    const messagesScrollRef = useRef(null);
    const activeTelRef = useRef("");
    const mensajesRef = useRef([]);
    const didInitFromQuery = useRef(false);
    const emojiRef = useRef(null);
    const fileInputRef = useRef(null);
    const inputRef = useRef(null);
    const dragDepthRef = useRef(0);
    const shouldStickToBottomRef = useRef(true);
    const chatRequestRef = useRef(0);
    const loadingOlderRef = useRef(false);
    const mensajesCacheRef = useRef(new Map());
    const prefetchedChatsRef = useRef(new Set());

    const templateMap = useMemo(() => {
        const map = new Map();

        for (const template of templatesDisponibles || []) {
            if (template?.key) map.set(template.key, template);
        }

        return map;
    }, [templatesDisponibles]);

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
        const query = normalizeText(deferredQ);
        const queryPhone = normalizaTelefonoMx(deferredQ);

        const base = query
            ? mergeChatsConProspectos(chats, prospectosIndex)
            : chats;

        return base.filter((chat) => {
            if (chatFilter === "no_leidos" && !(chat.unread > 0)) return false;
            if (!query) return true;

            const nombre = normalizeText(chat.nombre);
            const telefono = normalizaTelefonoMx(chat.telefono);
            const agencia = normalizeText(chat.agencia);
            const linea = normalizeText(chat.linea);
            const estado = normalizeText(chat.estado);
            const ultimoTexto = normalizeText(chat.last?.text);

            return (
                nombre.includes(query) ||
                telefono.includes(queryPhone || query) ||
                agencia.includes(query) ||
                linea.includes(query) ||
                estado.includes(query) ||
                ultimoTexto.includes(query)
            );
        });
    }, [chats, prospectosIndex, deferredQ, chatFilter]);

    const composerHint = useMemo(() => {
        if (!activeTel) return "Selecciona un chat para escribir…";
        return "Mensaje";
    }, [activeTel]);

    const templatePreview = useMemo(() => {
        if (!tplSelected) return "";

        return buildTemplatePreviewText(tplSelected, tplDraft);
    }, [tplSelected, tplDraft]);

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
        for (const attachment of list || []) {
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

    function guardarChatEnCache(tel52, payload = {}) {
        const key = normalizaTelefonoMx(tel52);
        if (!key) return;

        const actuales = Array.isArray(payload.mensajes) ? payload.mensajes : mensajesRef.current;
        const normalizados = actuales.map(normalizeMessage).slice(-CHAT_CACHE_LIMIT);

        mensajesCacheRef.current.set(key, {
            prospecto: payload.prospecto || prospecto || null,
            mensajes: normalizados,
            paginacion: payload.paginacion || {},
            updatedAt: Date.now(),
        });
    }

    function pintarChatDesdeCache(tel52) {
        const key = normalizaTelefonoMx(tel52);
        const cached = mensajesCacheRef.current.get(key);

        if (!cached) return false;

        setProspecto(cached.prospecto || null);
        setMensajes(cached.mensajes || []);
        setChatHasMore(Boolean(cached.paginacion?.has_more));
        setOldestMessageId(cached.paginacion?.oldest_id || cached.mensajes?.[0]?.id || null);
        shouldStickToBottomRef.current = true;

        requestAnimationFrame(() => {
            endRef.current?.scrollIntoView({ behavior: "auto" });
        });

        return true;
    }

    async function prefetchChat(tel52) {
        const target = normalizaTelefonoMx(tel52);
        if (!target || target === activeTelRef.current) return;
        if (mensajesCacheRef.current.has(target)) return;
        if (prefetchedChatsRef.current.has(target)) return;

        prefetchedChatsRef.current.add(target);

        try {
            const data = await api.digitalesContacto(target, {
                limit: PREFETCH_CHAT_LIMIT,
                mark_read: 0,
            });

            guardarChatEnCache(target, data);
        } catch {
            prefetchedChatsRef.current.delete(target);
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

    async function cargarChatInicial(tel52) {
        const target = normalizaTelefonoMx(tel52);

        if (!target) return;

        const requestId = chatRequestRef.current + 1;
        chatRequestRef.current = requestId;

        const hadCache = pintarChatDesdeCache(target);

        setLoadingChat(!hadCache);

        if (!hadCache) {
            setProspecto(null);
            setMensajes([]);
            setChatHasMore(false);
            setOldestMessageId(null);
        }

        shouldStickToBottomRef.current = true;

        try {
            const data = await api.digitalesContacto(target, {
                limit: CHAT_PAGE_SIZE,
                mark_read: 1,
            });

            if (chatRequestRef.current !== requestId) return;

            const items = (Array.isArray(data.mensajes) ? data.mensajes : []).map(normalizeMessage);
            const paginacion = data.paginacion || {};

            guardarChatEnCache(target, data);

            setProspecto(data.prospecto || null);
            setMensajes(items);
            setChatHasMore(Boolean(paginacion.has_more));
            setOldestMessageId(paginacion.oldest_id || items[0]?.id || null);

            if (!isDirectChatMode) {
                await refreshChats().catch(() => { });
            }

            requestAnimationFrame(() => {
                endRef.current?.scrollIntoView({ behavior: "auto" });
            });
        } catch (error) {
            console.error("Error cargando chat:", error);

            if (chatRequestRef.current !== requestId) return;

            setProspecto(null);
            setMensajes([]);
            setChatHasMore(false);
            setOldestMessageId(null);
        } finally {
            if (chatRequestRef.current === requestId) {
                setLoadingChat(false);
            }
        }
    }

    async function refreshActiveChat(tel52, { forceBottom = false } = {}) {
        const target = tel52 || activeTel;

        if (!target) return;

        const data = await api.digitalesContacto(target, {
            limit: CHAT_PAGE_SIZE,
            mark_read: forceBottom ? 1 : 0,
        });

        const incoming = (Array.isArray(data.mensajes) ? data.mensajes : []).map(normalizeMessage);
        const paginacion = data.paginacion || {};

        setProspecto(data.prospecto || null);

        setMensajes((prev) => {
            const withoutLocalPending = prev.filter((message) => !message.local_pending);
            return mergeMessages(withoutLocalPending, incoming);
        });

        setOldestMessageId((prev) => prev || paginacion.oldest_id || incoming[0]?.id || null);
        setChatHasMore((prev) => prev || Boolean(paginacion.has_more));

        if (forceBottom) {
            shouldStickToBottomRef.current = true;
        }

        if (!isDirectChatMode) {
            await refreshChats().catch(() => { });
        }
    }

    async function cargarMensajesAnteriores() {
        if (!activeTel) return;
        if (!chatHasMore) return;
        if (!oldestMessageId) return;
        if (loadingOlderRef.current) return;

        const container = messagesScrollRef.current;
        const previousScrollHeight = container?.scrollHeight || 0;
        const previousScrollTop = container?.scrollTop || 0;

        try {
            loadingOlderRef.current = true;
            setLoadingOlder(true);

            const data = await api.digitalesContacto(activeTel, {
                limit: CHAT_PAGE_SIZE,
                before_id: oldestMessageId,
                mark_read: 0,
            });

            const older = (Array.isArray(data.mensajes) ? data.mensajes : []).map(normalizeMessage);
            const paginacion = data.paginacion || {};

            if (older.length) {
                setMensajes((prev) => mergeMessages(older, prev));
                setOldestMessageId(paginacion.oldest_id || older[0]?.id || oldestMessageId);
            }

            setChatHasMore(Boolean(paginacion.has_more));

            requestAnimationFrame(() => {
                const current = messagesScrollRef.current;
                if (!current) return;

                const newScrollHeight = current.scrollHeight;
                current.scrollTop = newScrollHeight - previousScrollHeight + previousScrollTop;
            });
        } catch (error) {
            console.error("Error cargando mensajes anteriores:", error);
        } finally {
            loadingOlderRef.current = false;
            setLoadingOlder(false);
        }
    }

    function onMessagesScroll(event) {
        const element = event.currentTarget;

        shouldStickToBottomRef.current = isNearBottom(element);

        if (element.scrollTop <= 120) {
            cargarMensajesAnteriores();
        }
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
        if (inputRef.current) {
            inputRef.current.value = "";
        }
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
        localStorage.setItem("last_active_chat", normalized);

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

        // La lista se refresca por polling. Aquí evitamos bloquear el cambio de chat.
    }

    function onPickEmoji(emojiObj) {
        const emoji = emojiObj?.emoji || "";

        if (!emoji) return;

        const input = inputRef.current;

        if (input && typeof input.selectionStart === "number") {
            const start = input.selectionStart;
            const end = input.selectionEnd;
            const next = `${draftMsg.slice(0, start)}${emoji}${draftMsg.slice(end)}`;
            const nextCursor = start + emoji.length;

            setDraftMsg(next);

            requestAnimationFrame(() => {
                input.focus();
                input.setSelectionRange(nextCursor, nextCursor);
            });

            return;
        }

        setDraftMsg((prev) => `${prev}${emoji}`);

        requestAnimationFrame(() => {
            inputRef.current?.focus?.();
        });
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

    function addQuickBubble() {
        const text = newBubbleText.trim();

        if (!text) return;

        const newBubble = {
            id: crypto.randomUUID(),
            title: newBubbleTitle.trim() || text.slice(0, 25),
            text,
            createdAt: new Date().toISOString(),
        };

        setQuickBubbles((prev) => [...prev, newBubble]);
        setNewBubbleText("");
        setNewBubbleTitle("");
        setShowAddBubble(false);
    }

    function deleteQuickBubble(id) {
        setQuickBubbles((prev) => prev.filter((bubble) => bubble.id !== id));
    }

    async function sendQuickBubble(text) {
        if (!activeTel || !text.trim()) return;

        const optimisticId = crypto.randomUUID();

        shouldStickToBottomRef.current = true;

        setMensajes((prev) => [
            ...prev,
            {
                id: optimisticId,
                local_pending: true,
                local_created_at: new Date().toISOString(),
                mine: true,
                text: text.replace(/\r\n/g, "\n").trim(),
                time: "Ahora",
                status: "sent",
                attachments: [],
            },
        ]);

        try {
            await api.digitalesEnviarMensaje({
                to: activeTel,
                text: text.trim(),
            });

            await refreshActiveChat(activeTel, { forceBottom: true });
        } catch (error) {
            alert(`Falló: ${error.message}`);
            await refreshActiveChat(activeTel).catch(() => { });
        }
    }

    async function enviarMensaje() {
        if (!activeTel) return;

        const text = draftMsg.replace(/\r\n/g, "\n").trim();
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

                await refreshActiveChat(activeTel, { forceBottom: true });
            } catch (error) {
                alert(`Falló edición: ${error.message}`);
                await refreshActiveChat(activeTel).catch(() => { });
            }

            return;
        }

        const optimisticId = crypto.randomUUID();

        shouldStickToBottomRef.current = true;

        setMensajes((prev) => [
            ...prev,
            {
                id: optimisticId,
                local_pending: true,
                local_created_at: new Date().toISOString(),
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

            await refreshActiveChat(activeTel, { forceBottom: true });
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

        shouldStickToBottomRef.current = true;

        setMensajes((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                local_pending: true,
                local_created_at: new Date().toISOString(),
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
            await refreshActiveChat(activeTel, { forceBottom: true });
        } catch (error) {
            alert(`Falló plantilla: ${error.message}`);
            await refreshActiveChat(activeTel).catch(() => { });
        }
    }

    function copyTel() {
        if (!activeTel) return;
        const display = formateaTelUi(activeTel);
        const numero = display.replace(/\s/g, "");
        navigator.clipboard?.writeText(numero.replace("+", "")).then(() => {
            setCopiedTel(true);
            setTimeout(() => setCopiedTel(false), 2000);
        }).catch(() => { });
    }

    async function llamarMarkUnread(tel52) {
        if (typeof api.digitalesMarkUnread === "function") {
            return api.digitalesMarkUnread({ tel: tel52 });
        }

        if (typeof api.post === "function") {
            return api.post("/digitales/chats/mark-unread/", {
                tel: tel52,
            });
        }

        throw new Error("Falta agregar api.digitalesMarkUnread en src/lib/apiPruebas.js");
    }

    async function marcarChatComoNoLeido(tel52 = activeTel) {
        const target = normalizaTelefonoMx(tel52);

        if (!target || markingUnreadTel) return;

        setChatMenu(null);
        setMarkingUnreadTel(target);

        try {
            await llamarMarkUnread(target);

            setChats((prev) =>
                prev.map((chat) =>
                    chat.telefono === target
                        ? {
                            ...chat,
                            unread: Math.max(Number(chat.unread || 0), 1),
                        }
                        : chat,
                ),
            );

            mensajesCacheRef.current.delete(target);

            if (!isDirectChatMode) {
                await refreshChats().catch(() => { });
            }
        } catch (error) {
            alert(`No se pudo marcar como no leído: ${error.message}`);
        } finally {
            setMarkingUnreadTel("");
        }
    }

    function abrirMenuChat(event, chat) {
        event.preventDefault();
        event.stopPropagation();

        if (!chat?.telefono) return;

        setChatMenu({
            x: event.clientX,
            y: event.clientY,
            tel: chat.telefono,
            nombre: chat.nombre || "Prospecto",
        });
    }

    function openQuickEdit() {
        setQuickEditDraft({
            nombre: prospecto?.nombre || "",
            auto_interes: prospecto?.auto_interes || "",
            estado: prospecto?.estado || "",
            canal_contacto: prospecto?.canal_contacto || "",
            business: prospecto?.business || "",
            pauta: prospecto?.pauta || prospecto?.pauta_origen || "",
            comentarios: prospecto?.comentarios || prospecto?.comentario || "",
        });
        setShowQuickEdit(true);
    }

    async function saveQuickEdit() {
        if (!prospecto?.id || !activeTel) return;

        setSavingQuickEdit(true);

        try {
            const payload = {
                nombre: quickEditDraft.nombre || "",
                auto_interes: quickEditDraft.auto_interes || "",
                estado: quickEditDraft.estado || "",
                canal_contacto: quickEditDraft.canal_contacto || "",
                business: quickEditDraft.business || "",
                comentarios: quickEditDraft.comentarios || "",
            };

            const pautaLimpia = String(quickEditDraft.pauta || "").trim();
            if (pautaLimpia) {
                payload.pauta = pautaLimpia;
            }

            await api.digitalesPatchProspecto(prospecto.id, payload);

            await refreshActiveChat(activeTel);
            setShowQuickEdit(false);
        } catch (error) {
            alert(`No se pudo guardar: ${error.message}`);
        } finally {
            setSavingQuickEdit(false);
        }
    }

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                if (typeof api.digitalesCampanasMeta !== "function") return;

                const response = await api.digitalesCampanasMeta(90);
                if (!mounted) return;

                setPautasOptions(normalizeCampanasMetaOptions(response));
            } catch (error) {
                console.error("No se pudieron cargar las pautas de Meta:", error);
                if (mounted) setPautasOptions(PAUTAS_ORIGEN);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(QUICK_BUBBLES_KEY, JSON.stringify(quickBubbles));
        } catch {
            // sin acción
        }
    }, [quickBubbles]);

    useEffect(() => {
        activeTelRef.current = activeTel;
    }, [activeTel]);

    // Sincronizar el draft de edición rápida cada vez que carga un nuevo prospecto
    useEffect(() => {
        if (!prospecto) return;
        setQuickEditDraft({
            nombre: prospecto.nombre || "",
            auto_interes: prospecto.auto_interes || "",
            estado: prospecto.estado || "",
            canal_contacto: prospecto.canal_contacto || "",
            business: prospecto.business || "",
            pauta: prospecto.pauta || prospecto.pauta_origen || "",
            comentarios: prospecto.comentarios || prospecto.comentario || "",
        });
    }, [prospecto]);

    useEffect(() => {
        mensajesRef.current = mensajes;

        if (activeTel && mensajes.length) {
            guardarChatEnCache(activeTel, {
                prospecto,
                mensajes,
                paginacion: {
                    has_more: chatHasMore,
                    oldest_id: oldestMessageId,
                },
            });
        }
    }, [mensajes, activeTel, prospecto, chatHasMore, oldestMessageId]);

    useEffect(() => {
        if (!shouldStickToBottomRef.current) return;

        endRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [mensajes.length, activeTel]);

    useEffect(() => {
        return () => cleanupPreviews(attachments);
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
        if (!chatMenu) return;

        const cerrar = () => setChatMenu(null);

        document.addEventListener("mousedown", cerrar);
        window.addEventListener("scroll", cerrar, true);
        window.addEventListener("resize", cerrar);

        return () => {
            document.removeEventListener("mousedown", cerrar);
            window.removeEventListener("scroll", cerrar, true);
            window.removeEventListener("resize", cerrar);
        };
    }, [chatMenu]);

    useEffect(() => {
        const onNuevoMensaje = async (event) => {
            const data = event.detail || {};
            const telefonoMensaje = normalizaTelefonoMx(data.telefono || "");

            if (!telefonoMensaje) return;

            if (telefonoMensaje === activeTelRef.current) {
                await refreshActiveChat(telefonoMensaje, { forceBottom: true }).catch(() => { });
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
    }, [isDirectChatMode]);

    useEffect(() => {
        if (tel && !didInitFromQuery.current) {
            didInitFromQuery.current = true;
            setActiveTel(tel);
            setMobileView("chat");

            const lastChat = localStorage.getItem("last_active_chat");

            if (lastChat && lastChat !== tel) {
                localStorage.setItem("last_active_chat", tel);
            }

            return;
        }

        if (!tel && !activeTel && chats.length) {
            const lastChat = localStorage.getItem("last_active_chat");

            if (lastChat && chats.some((chat) => chat.telefono === lastChat)) {
                setActiveTel(lastChat);
            } else {
                setActiveTel(chats[0].telefono);
            }
        }
    }, [tel, chats, activeTel]);

    useEffect(() => {
        if (!activeTel) {
            setProspecto(null);
            setMensajes([]);
            setChatHasMore(false);
            setOldestMessageId(null);
            return;
        }

        cargarChatInicial(activeTel);
    }, [activeTel, isDirectChatMode]);

    useEffect(() => {
        let ignore = false;

        if (isDirectChatMode) return;

        (async () => {
            try {
                const data = await api.digitalesListProspectos();

                if (ignore) return;

                setProspectosIndex(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error cargando índice de prospectos:", error);

                if (!ignore) {
                    setProspectosIndex([]);
                }
            }
        })();

        return () => {
            ignore = true;
        };
    }, [isDirectChatMode]);

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

                const lastId = last?.id || last?.wa_message_id || "";
                const lastCreatedAt = last?.created_at || "";

                if (!lastId && !lastCreatedAt) {
                    timer = setTimeout(tick, 3500);
                    return;
                }

                const data = await api.digitalesContactoUpdates(
                    target,
                    lastCreatedAt,
                    {
                        limit: CHAT_UPDATES_LIMIT,
                        after_id: lastId,
                        mark_read: 1,
                    },
                );

                if (!alive) return;

                const incoming = (Array.isArray(data?.mensajes) ? data.mensajes : [])
                    .map(normalizeMessage);

                if (incoming.length) {
                    shouldStickToBottomRef.current = isNearBottom(messagesScrollRef.current);
                    setMensajes((old) => mergeMessages(old, incoming));

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
    }, [isDirectChatMode]);

    return (
        <div className="w-full min-w-0">
            <div className="relative overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
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
                                onClick={() => navigate("/crm_volvo/comercial/prospectos")}
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
                        "grid min-h-0 h-[calc(100dvh-118px)] overflow-hidden transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        isDirectChatMode
                            ? "grid-cols-1"
                            : chatSidebarCollapsed
                                ? "grid-cols-1 lg:grid-cols-[58px_minmax(0,1fr)]"
                                : "grid-cols-1 lg:grid-cols-[310px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]"
                    )}
                >
                    <aside
                        className={cls(
                            "min-h-0 border-r border-black/10 bg-neutral-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex lg:flex-col",
                            isDirectChatMode
                                ? "hidden"
                                : mobileView === "chat"
                                    ? "hidden lg:flex"
                                    : "flex flex-col",
                        )}
                    >
                        {chatSidebarCollapsed ? (
                            <div className="hidden h-full flex-col items-center gap-3 bg-white py-3 lg:flex">
                                <button
                                    onClick={() => setChatSidebarCollapsed(false)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-black shadow-sm transition hover:scale-105 hover:bg-neutral-50"
                                    title="Expandir chats"
                                    type="button"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                                <div className="h-px w-8 bg-black/10" />
                                <div className="rotate-90 whitespace-nowrap text-[11px] font-extrabold uppercase tracking-wider text-black/60">
                                    Chats
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="border-b border-black/10 bg-white p-3">
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <div className="text-xs font-extrabold uppercase tracking-wide text-black/60">Chats</div>
                                        <button
                                            onClick={() => setChatSidebarCollapsed(true)}
                                            className="hidden h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-white text-black transition hover:bg-neutral-50 lg:inline-flex"
                                            title="Contraer chats"
                                            type="button"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-neutral-100 px-3 py-2">
                                        <Search className="h-4 w-4 text-black" />

                                        <input
                                            value={q}
                                            onChange={(event) => setQ(event.target.value)}
                                            placeholder="Buscar prospecto, número, agencia…"
                                            className="w-full bg-transparent text-sm font-semibold text-black outline-none placeholder:text-slate-400"
                                        />
                                    </div>

                                    <div className="mt-2 flex gap-2">
                                        <button
                                            onClick={() => setChatFilter("todos")}
                                            className={cls(
                                                "flex-1 rounded-lg border py-1.5 text-xs font-extrabold transition",
                                                chatFilter === "todos"
                                                    ? "border-black bg-black text-white"
                                                    : "border-black/10 bg-white text-black hover:bg-neutral-100"
                                            )}
                                            type="button"
                                        >
                                            Todos
                                        </button>
                                        <button
                                            onClick={() => setChatFilter("no_leidos")}
                                            className={cls(
                                                "flex-1 rounded-lg border py-1.5 text-xs font-extrabold transition",
                                                chatFilter === "no_leidos"
                                                    ? "border-black bg-black text-white"
                                                    : "border-black/10 bg-white text-black hover:bg-neutral-100"
                                            )}
                                            type="button"
                                        >
                                            No leídos
                                        </button>
                                    </div>
                                </div>

                                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                                    {loadingList ? (
                                        <ChatListSkeleton rows={9} />
                                    ) : filteredChats.length ? (
                                        filteredChats.map((chat) => {
                                            const isActive = chat.telefono === activeTel;

                                            return (
                                                <button
                                                    key={chat.id}
                                                    onMouseEnter={() => prefetchChat(chat.telefono)}
                                                    onFocus={() => prefetchChat(chat.telefono)}
                                                    onClick={() => openChatByTel(chat.telefono)}
                                                    onContextMenu={(event) => abrirMenuChat(event, chat)}
                                                    className={cls(
                                                        "w-full border-b border-black/5 px-4 py-3 text-left transition",
                                                        isActive
                                                            ? "bg-white"
                                                            : "bg-neutral-50 hover:bg-white",
                                                    )}
                                                    type="button"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative shrink-0">
                                                            <Avatar name={chat.nombre} />
                                                            <span
                                                                className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white"
                                                                style={{ backgroundColor: getStatusDotColor(chat.estado) }}
                                                                title={chat.estado || "Sin respuesta"}
                                                            />
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="truncate text-sm font-extrabold text-black">
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
                                            <div className="text-sm font-extrabold text-black">
                                                Sin historial aún
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </aside>

                    <section
                        className={cls(
                            "relative flex min-h-0 flex-col bg-white transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                            mobileView === "list" ? "hidden lg:flex" : "flex",
                        )}
                    >
                        <div className="border-b border-black/10 bg-white px-3 py-3 sm:px-4">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 flex-1 items-center gap-3">
                                        <Avatar name={activeChat?.nombre || "Prospecto"} />

                                        <div className="min-w-0 flex-1">
                                            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_.8fr_1fr_auto_auto]">
                                                <input
                                                    value={activeChat?.nombre || "Selecciona un chat" || quickEditDraft.nombre || ""}
                                                    onChange={(e) =>
                                                        setQuickEditDraft((p) => ({ ...p, nombre: e.target.value }))
                                                    }
                                                    placeholder="Nombre"
                                                    className="h-8 min-w-0 max-w-40 rounded-lg border border-black/10 bg-white px-3 text-xs font-semibold text-black outline-none focus:border-black/40"
                                                />

                                                <select
                                                    value={quickEditDraft.auto_interes || ""}
                                                    onChange={(e) =>
                                                        setQuickEditDraft((p) => ({ ...p, auto_interes: e.target.value }))
                                                    }
                                                    className="h-8 min-w-0 max-w-35 rounded-lg border border-black/10 bg-white px-2 text-xs font-semibold text-black outline-none focus:border-black/40"
                                                >
                                                    {renderOptionsConValorActual(VEHICULOS, quickEditDraft.auto_interes)}
                                                </select>

                                                <select
                                                    value={quickEditDraft.estado || ""}
                                                    onChange={(e) =>
                                                        setQuickEditDraft((p) => ({ ...p, estado: e.target.value }))
                                                    }
                                                    className="h-8 min-w-0 max-w-40 rounded-lg border border-black/10 bg-white px-2 text-xs font-semibold text-black outline-none focus:border-black/40"
                                                >
                                                    {renderOptionsConValorActual(ESTADOS_PROSPECTO, quickEditDraft.estado)}
                                                </select>

                                                <select
                                                    value={quickEditDraft.canal_contacto || ""}
                                                    onChange={(e) =>
                                                        setQuickEditDraft((p) => ({ ...p, canal_contacto: e.target.value }))
                                                    }
                                                    className="h-8 min-w-0 max-w-30 rounded-lg border border-black/10 bg-white px-1 text-xs font-semibold text-black outline-none focus:border-black/40"
                                                >
                                                    {renderOptionsConValorActual(CANALES, quickEditDraft.canal_contacto)}
                                                </select>

                                                <select
                                                    value={quickEditDraft.business || ""}
                                                    onChange={(e) =>
                                                        setQuickEditDraft((p) => ({ ...p, business: e.target.value }))
                                                    }
                                                    className="h-8 min-w-0 max-w-25 rounded-lg border border-black/10 bg-white px-2 text-xs font-semibold text-black outline-none focus:border-black/40"
                                                >
                                                    {renderOptionsConValorActual(BUSINESS_OPTIONS, quickEditDraft.business)}
                                                </select>

                                                <select
                                                    value={quickEditDraft.pauta || ""}
                                                    onChange={(e) =>
                                                        setQuickEditDraft((p) => ({ ...p, pauta: e.target.value }))
                                                    }
                                                    className="h-8 min-w-0 rounded-lg border border-black/10 bg-white px-3 text-xs font-semibold text-black outline-none focus:border-black/40"
                                                >
                                                    {renderOptionsConValorActual(pautasOptions, quickEditDraft.pauta, "Sin campaña detectada")}                                                </select>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={saveQuickEdit}
                                                        disabled={savingQuickEdit}
                                                        className="inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
                                                        style={{ backgroundColor: BRAND_BLUE }}
                                                        type="button"
                                                        title="Guardar cambios"
                                                    >
                                                        <Save className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={abrirPlantillas}
                                                        disabled={!activeTel}
                                                        className={cls(
                                                            "inline-flex h-8 items-center justify-center rounded-lg border border-black/10 bg-white px-3 text-xs font-extrabold text-black hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60",
                                                        )}
                                                        type="button"
                                                        title="Enviar plantilla"
                                                    >
                                                        <LayoutTemplate className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-500 sm:text-xs">
                                                <button
                                                    type="button"
                                                    onClick={copyTel}
                                                    className="inline-flex items-center gap-1 rounded-md py-0.5 transition hover:bg-neutral-100 sm:px-1"
                                                    title="Copiar número"
                                                >
                                                    {copiedTel ? (
                                                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                    ) : (
                                                        <Copy className="h-3.5 w-3.5" />
                                                    )}

                                                    <span className={copiedTel ? "font-bold text-emerald-600" : ""}>
                                                        {activeTel ? formateaTelUi(activeTel) : "—"}
                                                    </span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => marcarChatComoNoLeido(activeTel)}
                                                    disabled={!activeTel || markingUnreadTel === activeTel}
                                                    className="inline-flex items-center gap-1 rounded-md py-0.5 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60 sm:px-1"
                                                    title="Marcar este chat como no leído"
                                                >
                                                    <MailOpen className="h-3.5 w-3.5" />
                                                    <span>
                                                        {markingUnreadTel === activeTel ? "Marcando..." : "Marcar no leído"}
                                                    </span>
                                                </button>

                                                <span className="inline-flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {loadingChat ? "Cargando..." : "Listo"}
                                                </span>

                                                <span className="hidden text-[11px] font-bold text-slate-500 xl:inline">
                                                    Registro: {fmtDT(prospecto?.creado)} · Primer contacto: {fmtDT(prospecto?.primer_contacto_at)} · Último contacto: {fmtDT(prospecto?.ultimo_contacto_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {activeTel ? (
                                    <details className="group rounded-2xl border border-black/10 bg-neutral-50 p-2 sm:p-3 lg:hidden">
                                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-1 py-1">
                                            <span className="text-xs font-extrabold uppercase tracking-wide text-black/70">
                                                Datos del prospecto
                                            </span>

                                            <input
                                                value={activeChat?.nombre || "Selecciona un chat" || quickEditDraft.nombre || ""}
                                                onChange={(e) =>
                                                    setQuickEditDraft((p) => ({ ...p, nombre: e.target.value }))
                                                }
                                                placeholder="Nombre"
                                                className="h-8 min-w-0 rounded-lg border border-black/10 bg-white px-3 text-xs font-semibold text-black outline-none focus:border-black/40"
                                            />

                                            <select
                                                value={quickEditDraft.auto_interes || ""}
                                                onChange={(e) =>
                                                    setQuickEditDraft((p) => ({ ...p, auto_interes: e.target.value }))
                                                }
                                                className="h-8 min-w-0 max-w-35 rounded-lg border border-black/10 bg-white px-2 text-xs font-semibold text-black outline-none focus:border-black/40"
                                            >
                                                {renderOptionsConValorActual(VEHICULOS, quickEditDraft.auto_interes)}
                                            </select>

                                            <select
                                                value={quickEditDraft.estado || ""}
                                                onChange={(e) =>
                                                    setQuickEditDraft((p) => ({ ...p, estado: e.target.value }))
                                                }
                                                className="h-8 min-w-0 max-w-40 rounded-lg border border-black/10 bg-white px-2 text-xs font-semibold text-black outline-none focus:border-black/40"
                                            >
                                                {renderOptionsConValorActual(ESTADOS_PROSPECTO, quickEditDraft.estado)}
                                            </select>

                                            <select
                                                value={quickEditDraft.canal_contacto || ""}
                                                onChange={(e) =>
                                                    setQuickEditDraft((p) => ({ ...p, canal_contacto: e.target.value }))
                                                }
                                                className="h-8 min-w-0 max-w-30 rounded-lg border border-black/10 bg-white px-1 text-xs font-semibold text-black outline-none focus:border-black/40"
                                            >
                                                {renderOptionsConValorActual(CANALES, quickEditDraft.canal_contacto)}
                                            </select>

                                            <select
                                                value={quickEditDraft.business || ""}
                                                onChange={(e) =>
                                                    setQuickEditDraft((p) => ({ ...p, business: e.target.value }))
                                                }
                                                className="h-8 min-w-0 max-w-25 rounded-lg border border-black/10 bg-white px-2 text-xs font-semibold text-black outline-none focus:border-black/40"
                                            >
                                                {renderOptionsConValorActual(BUSINESS_OPTIONS, quickEditDraft.business)}
                                            </select>

                                            <select
                                                value={quickEditDraft.pauta || ""}
                                                onChange={(e) =>
                                                    setQuickEditDraft((p) => ({ ...p, pauta: e.target.value }))
                                                }
                                                className="h-8 min-w-0 rounded-lg border border-black/10 bg-white px-3 text-xs font-semibold text-black outline-none focus:border-black/40"
                                            >
                                                {renderOptionsConValorActual(pautasOptions, quickEditDraft.pauta)}
                                            </select>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={saveQuickEdit}
                                                    disabled={savingQuickEdit}
                                                    className="inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
                                                    style={{ backgroundColor: BRAND_BLUE }}
                                                    type="button"
                                                    title="Guardar cambios"
                                                >
                                                    <Save className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={abrirPlantillas}
                                                    disabled={!activeTel}
                                                    className={cls(
                                                        "inline-flex h-8 items-center justify-center rounded-lg border border-black/10 bg-white px-3 text-xs font-extrabold text-black hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60",
                                                    )}
                                                    type="button"
                                                    title="Enviar plantilla"
                                                >
                                                    <LayoutTemplate className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                            <ChevronDown className="h-4 w-4 text-black/60 transition group-open:rotate-180" />
                                        </summary>
                                    </details>
                                ) : null}
                            </div>
                        </div>
                        <div
                            ref={messagesScrollRef}
                            onScroll={onMessagesScroll}
                            className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-50 via-white to-slate-50 px-4 py-5 sm:px-6 lg:px-8"
                        >
                            <div className="mx-auto w-full max-w-5xl space-y-3">
                                {activeTel && !loadingChat ? (
                                    <div className="mb-3 flex justify-center">
                                        {loadingOlder ? (
                                            <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-extrabold text-slate-500 shadow-sm">
                                                Cargando mensajes anteriores...
                                            </div>
                                        ) : chatHasMore ? (
                                            <button
                                                onClick={cargarMensajesAnteriores}
                                                className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-extrabold text-black shadow-sm hover:bg-neutral-50"
                                                type="button"
                                            >
                                                Cargar mensajes anteriores
                                            </button>
                                        ) : mensajes.length > 0 ? (
                                            <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-bold text-slate-400 shadow-sm">
                                                Inicio de la conversación
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}

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
                                            key={getMessageKey(message)}
                                            mine={Boolean(message.mine)}
                                            text={message.text}
                                            time={message.time || ""}
                                            status={message.status || "sent"}
                                            attachments={message.attachments || []}
                                            isAi={Boolean(message.is_ai)}
                                            renderText={renderTextForBubble}
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
                            <div className="mx-auto w-full max-w-5xl">
                                {dragOver && activeTel ? (
                                    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
                                        <div className="rounded-2xl border border-dashed border-black/40 bg-white px-6 py-4 shadow-lg">
                                            <div className="flex items-center gap-3">
                                                <Paperclip className="h-5 w-5 text-black" />

                                                <div className="text-sm font-extrabold text-black">
                                                    Suelta para adjuntar archivos
                                                </div>
                                            </div>

                                            <div className="mt-1 text-xs font-semibold text-slate-500">
                                                Se adjuntarán al mensaje, máximo 10.
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                {activeTel ? (
                                    <div className="mb-3">
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-xs font-extrabold uppercase tracking-wide text-black/60">
                                                Mensajes rápidos
                                            </span>

                                            <button
                                                onClick={() => setShowAddBubble((prev) => !prev)}
                                                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/10 text-black transition hover:bg-black hover:text-white"
                                                title="Agregar mensaje rápido"
                                                type="button"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                            </button>
                                        </div>

                                        {showAddBubble ? (
                                            <div className="mb-3 rounded-xl border border-black/20 bg-neutral-50 p-3">
                                                <input
                                                    value={newBubbleTitle}
                                                    onChange={(event) => setNewBubbleTitle(event.target.value)}
                                                    placeholder="Título (opcional)"
                                                    className="mb-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-black outline-none placeholder:text-slate-400"
                                                />

                                                <textarea
                                                    value={newBubbleText}
                                                    onChange={(event) => setNewBubbleText(event.target.value)}
                                                    placeholder="Escribe el mensaje que quieres guardar..."
                                                    rows={2}
                                                    className="mb-2 w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-black outline-none placeholder:text-slate-400"
                                                />

                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setShowAddBubble(false);
                                                            setNewBubbleText("");
                                                            setNewBubbleTitle("");
                                                        }}
                                                        className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-neutral-100"
                                                        type="button"
                                                    >
                                                        Cancelar
                                                    </button>

                                                    <button
                                                        onClick={addQuickBubble}
                                                        disabled={!newBubbleText.trim()}
                                                        className={cls(
                                                            "rounded-lg px-3 py-1.5 text-xs font-bold text-white",
                                                            !newBubbleText.trim()
                                                                ? "cursor-not-allowed opacity-50"
                                                                : "hover:opacity-90",
                                                        )}
                                                        style={{ backgroundColor: BRAND_BLUE }}
                                                        type="button"
                                                    >
                                                        Guardar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : null}

                                        {quickBubbles.length > 0 ? (
                                            <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto pb-1">
                                                {quickBubbles.map((bubble) => (
                                                    <div
                                                        key={bubble.id}
                                                        className="group relative inline-flex max-w-[200px] items-center gap-1 rounded-full border border-black/20 bg-white shadow-sm transition-all hover:shadow-md"
                                                    >
                                                        <button
                                                            onClick={() => sendQuickBubble(bubble.text)}
                                                            className="flex-1 truncate px-3 py-1.5 text-left text-xs font-semibold text-black hover:text-black/80"
                                                            title={bubble.text}
                                                            type="button"
                                                        >
                                                            {bubble.title}
                                                        </button>

                                                        <button
                                                            onClick={() => deleteQuickBubble(bubble.id)}
                                                            className="invisible absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 group-hover:visible"
                                                            title="Eliminar"
                                                            type="button"
                                                        >
                                                            <X className="h-2.5 w-2.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : null}
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
                                                            <div className="max-w-[180px] truncate text-xs font-extrabold text-black">
                                                                {attachment.name ? shortName(attachment.name) : "Imagen"}
                                                            </div>

                                                            <div className="text-[11px] font-bold text-slate-500">
                                                                {humanBytes(attachment.size)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-black" />

                                                        <div className="min-w-0">
                                                            <div className="max-w-[180px] truncate text-xs font-extrabold text-black">
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
                                                    <X className="h-4 w-4 text-black" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}


                                <div className="flex items-end gap-2 rounded-2xl border border-black/10 bg-white p-2 shadow-sm">
                                    <div className="relative" ref={emojiRef}>
                                        <button
                                            className={cls(
                                                "inline-flex h-10 w-10 items-center justify-center rounded-full text-black hover:bg-neutral-100",
                                                !activeTel ? "cursor-not-allowed opacity-60" : ""
                                            )}
                                            title="Emojis"
                                            type="button"
                                            disabled={!activeTel}
                                            onClick={() => setOpenEmoji((prev) => !prev)}
                                        >
                                            <Smile className="h-5 w-5" />
                                        </button>

                                        {openEmoji ? (
                                            <div className="absolute bottom-12 left-0 z-50 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
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

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={(event) => {
                                            addFilesAsAttachments(event.target.files);
                                            event.target.value = "";
                                        }}
                                    />

                                    <button
                                        className={cls(
                                            "inline-flex h-10 w-10 items-center justify-center rounded-full text-black hover:bg-neutral-100",
                                            !activeTel ? "cursor-not-allowed opacity-60" : ""
                                        )}
                                        title="Adjuntar"
                                        type="button"
                                        disabled={!activeTel}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Paperclip className="h-5 w-5" />
                                    </button>

                                    <WhatsAppComposerInput
                                        value={draftMsg}
                                        onChange={setDraftMsg}
                                        onSend={enviarMensaje}
                                        disabled={!activeTel}
                                        placeholder={composerHint}
                                        inputRef={inputRef}
                                        onPaste={onPasteInComposer}
                                    />

                                    <button
                                        onClick={enviarMensaje}
                                        disabled={!activeTel || (!draftMsg.trim() && attachments.length === 0)}
                                        className={cls(
                                            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition",
                                            !activeTel || (!draftMsg.trim() && attachments.length === 0)
                                                ? "cursor-not-allowed bg-slate-300"
                                                : "hover:scale-105"
                                        )}
                                        style={{
                                            backgroundColor:
                                                !activeTel || (!draftMsg.trim() && attachments.length === 0)
                                                    ? undefined
                                                    : BRAND_BLUE,
                                        }}
                                        title="Enviar"
                                        type="button"
                                    >
                                        <Send className="h-4 w-4" />
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
                                            className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[11px] font-extrabold text-black hover:bg-neutral-50"
                                        >
                                            Cancelar edición
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </section>
                </div>
            </div >

            {chatMenu ? (
                <div
                    className="fixed z-[90] min-w-[210px] overflow-hidden rounded-xl border border-black/10 bg-white py-1 shadow-2xl"
                    style={{
                        left: Math.min(chatMenu.x, window.innerWidth - 230),
                        top: Math.min(chatMenu.y, window.innerHeight - 90),
                    }}
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    <button
                        type="button"
                        onClick={() => marcarChatComoNoLeido(chatMenu.tel)}
                        disabled={markingUnreadTel === chatMenu.tel}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-extrabold text-black hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <MailOpen className="h-4 w-4" />
                        {markingUnreadTel === chatMenu.tel ? "Marcando..." : "Marcar como no leído"}
                    </button>
                </div>
            ) : null}

            <Modal
                open={openTpl}
                title={tplSelected ? `Plantilla: ${tplSelected.title}` : "Plantillas"}
                onClose={() => setOpenTpl(false)}
                footer={
                    tplSelected ? (
                        <>
                            <button
                                onClick={() => setTplSelected(null)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-black hover:bg-neutral-50"
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
                            <div className="rounded-xl border border-black/10 bg-neutral-50 p-4 text-sm font-bold text-black">
                                Cargando plantillas...
                            </div>
                        ) : templatesError ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                                {templatesError}
                            </div>
                        ) : templatesDisponibles.length === 0 ? (
                            <div className="rounded-xl border border-black/10 bg-neutral-50 p-4 text-sm font-bold text-black">
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
                                    <div className="text-sm font-extrabold text-black">
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
                            <div className="text-base font-extrabold text-black">
                                Texto de plantilla
                            </div>

                            <div className="mt-1 text-xs font-bold text-slate-500">
                                {tplSelected.key} · idioma: {tplSelected.idioma || tplSelected.language || "es_MX"}
                            </div>

                            <div className="mt-3 whitespace-pre-wrap rounded-xl border border-black/10 bg-neutral-50 p-4 text-sm font-semibold text-black">
                                {templatePreview || tplSelected.help || "Esta plantilla no tiene texto visible."}
                            </div>
                        </div>

                        {(tplSelected.fields || []).length ? (
                            (tplSelected.fields || []).map((field) => {
                                const options = getFieldOptions(field);

                                return (
                                    <div key={field.key}>
                                        <div className="mb-1 text-xs font-extrabold text-black">
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
                                                    className="w-full appearance-none rounded-xl border border-black/10 bg-white px-4 py-3 pr-10 text-sm font-semibold text-black outline-none"
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
                                                    <ChevronDown className="h-4 w-4 text-black/60" />
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
                                                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-black outline-none"
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
        </div >
    );
}