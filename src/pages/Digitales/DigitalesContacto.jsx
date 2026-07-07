//volvo
// src/pages/Digitales/DigitalesContacto.jsx
import { useEffect, useMemo, useRef, useState, useDeferredValue } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import {
    ArrowLeft,
    Send,
    Smile,
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
    Play,
    Pause,
    Plus,
    Copy,
    Check,
    CheckCheck,
    AlertCircle,
    Save,
    MailOpen,
    Pencil,
    Activity,
    Zap,
    ZapOff,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { api } from "../../lib/apiPruebas";
import { Phone } from "lucide-react";

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

const BURO_OPTIONS = [
    { value: "", label: "— Selecciona —" },
    { value: "Bueno", label: "Bueno" },
    { value: "Regular", label: "Regular" },
    { value: "Iniciando", label: "Iniciando" },
    { value: "Desconocido", label: "Desconocido" },
];

const FORMA_PAGO_OPTIONS = [
    { value: "", label: "— Selecciona —" },
    { value: "Contado", label: "Contado" },
    { value: "Crédito", label: "Crédito" },
    { value: "Arrendamiento", label: "Arrendamiento" },
    { value: "Desconocido", label: "Desconocido" },
];

const TIPO_CLIENTE_OPTIONS = [
    { value: "", label: "— Selecciona —" },
    { value: "Persona física", label: "Persona física" },
    { value: "Persona moral", label: "Persona moral" },
    { value: "Desconocido", label: "Desconocido" },
];

const PLAZO_COMPRA_OPTIONS = [
    "",
    "Inmediato",
    "1 a 3 meses",
    "Más de 3 meses",
    "Desconocido",
];

const CHAT_FILTERS = [
    { key: "todos", label: "Todos" },
    { key: "no_leidos", label: "No leídos" },
    { key: "contactado", label: "Contactado", estados: ["contactado"] },
    { key: "sin_respuesta", label: "Sin respuesta", estados: ["sin respuesta", "sin_respuesta"] },
    { key: "descalificado", label: "Descalificado", estados: ["descalificado"] },
];

const ESTADOS_HEADER = [
    "Sin Respuesta",
    "Contactado",
    "Descalificado",
];

// ─── helpers ────────────────────────────────────────────────────────────────

function getCampanaMetaProspecto(prospecto = {}) {
    const campanaMeta = prospecto?.campana_meta || {};

    const nombreCampana = String(
        campanaMeta?.nombre_campana ||
        prospecto?.campana_meta_nombre ||
        ""
    ).trim();

    const sucursal = String(
        campanaMeta?.sucursal ||
        prospecto?.campana_meta_sucursal ||
        ""
    ).trim();

    const pauta = String(
        campanaMeta?.pauta ||
        prospecto?.pauta ||
        ""
    ).trim();

    return {
        id_campana: String(campanaMeta?.id_campana || prospecto?.campana_meta_id || "").trim(),
        nombre_campana: nombreCampana,
        sucursal,
        pauta,
        label: nombreCampana || pauta || "Sin campaña detectada",
        encontrada: Boolean(campanaMeta?.encontrada),
        origen: campanaMeta?.origen || "",
    };
}

function normalizarPautasMetaOptions(responseOrItems) {
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

    function addOption(value, label = value, extra = {}) {
        const valueLimpio = String(value || "").trim();
        const labelLimpio = String(label || value || "").trim();

        if (!valueLimpio) return;

        const key = normalizeText(valueLimpio);

        if (vistos.has(key)) return;

        vistos.add(key);

        opciones.push({
            value: valueLimpio,
            label: labelLimpio,
            id_campana: extra.id_campana || "",
            sucursal: extra.sucursal || "",
            nombre_campana: extra.nombre_campana || "",
        });
    }

    for (const item of rawItems) {
        if (typeof item === "string") {
            addOption(item);
            continue;
        }

        const sucursal = String(item?.sucursal || "").trim();
        const nombreCampana = String(item?.nombre_campana || "").trim();
        const value = String(
            item?.value ||
            item?.label ||
            item?.pauta ||
            item?.pauta_origen ||
            item?.nombre ||
            item?.name ||
            nombreCampana ||
            item?.campaign_name ||
            item?.campaign ||
            ""
        ).trim();

        if (sucursal && nombreCampana) {
            addOption(`${sucursal} - ${nombreCampana}`, `${sucursal} - ${nombreCampana}`, {
                id_campana: item?.id_campana || "",
                sucursal,
                nombre_campana: nombreCampana,
            });
            continue;
        }

        addOption(value, item?.label || value, {
            id_campana: item?.id_campana || "",
            sucursal,
            nombre_campana: nombreCampana,
        });
    }

    return opciones.sort((a, b) =>
        a.label.localeCompare(b.label, "es", { sensitivity: "base" })
    );
}

function renderPautasMetaOptions(options, currentValue, placeholder = "Sin campaña detectada") {
    const value = String(currentValue || "").trim();
    const exists = (options || []).some((option) =>
        String(option?.value || option || "").trim().toLowerCase() === value.toLowerCase()
    );

    return (
        <>
            <option value="">{placeholder}</option>
            {value && !exists ? <option value={value}>{value} (actual)</option> : null}
            {(options || []).map((option) => {
                const optionValue = String(option?.value || option || "").trim();
                const optionLabel = String(option?.label || optionValue || "").trim();

                if (!optionValue) return null;

                return (
                    <option key={optionValue} value={optionValue}>
                        {optionLabel}
                    </option>
                );
            })}
        </>
    );
}

function renderOptionsConValorActual(options, currentValue, placeholder = "Selecciona una opción…") {
    const value = String(currentValue || "").trim();
    const exists = (options || []).some((o) => String(o || "").trim().toLowerCase() === value.toLowerCase());
    return (
        <>
            <option value="">{placeholder}</option>
            {value && !exists ? <option value={value}>{value} (actual)</option> : null}
            {(options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </>
    );
}

function getStatusDotColor(estado) {
    const v = String(estado || "").toLowerCase();
    if (v === "descalificado") return "#3B82F6";
    if (v === "sin respuesta" || v === "sin_respuesta" || v === "") return "#EF4444";
    return "#22C55E";
}

function cls(...items) { return items.filter(Boolean).join(" "); }
function safeLower(v) { return String(v || "").toLowerCase(); }

function normalizeTemplateLookupKey(value) {
    return normalizeText(value).replace(/[^a-z0-9]/g, "");
}

function getTemplateCandidateKeys(template = {}) {
    const keys = [
        template.key,
        template.name,
        template.template_name,
        template.title,
    ]
        .map((value) => String(value || "").trim())
        .filter(Boolean);

    const output = [];
    const seen = new Set();

    for (const key of keys) {
        const variants = [key, key.toLowerCase(), normalizeTemplateLookupKey(key)]
            .map((item) => String(item || "").trim())
            .filter(Boolean);

        for (const variant of variants) {
            if (seen.has(variant)) continue;
            seen.add(variant);
            output.push(variant);
        }
    }

    return output;
}

function resolveTemplateFromMap(templateMap, templateName) {
    const name = String(templateName || "").trim();

    if (!name || !templateMap) return null;

    return (
        templateMap.get(name) ||
        templateMap.get(name.toLowerCase()) ||
        templateMap.get(normalizeTemplateLookupKey(name)) ||
        null
    );
}

function getTemplateContextFallback(index, context = {}) {
    const values = [
        context.nombre,
        context.modelo,
        context.agencia,
        context.asesor,
        context.canal,
        context.tema,
        context.dato,
    ];

    return String(values[Number(index) - 1] || "").trim();
}

function normalizeText(value) {
    return String(value || "").normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
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
        last: { text: p.comentarios || "Sin historial reciente", time: "" },
        isOnlyProspecto: true,
    };
}

function mergeChatsConProspectos(chats, prospectos) {
    const map = new Map();
    for (const chat of chats || []) { if (chat.telefono) map.set(chat.telefono, chat); }
    for (const p of prospectos || []) {
        const chat = normalizeProspectoToChat(p);
        if (!chat.telefono) continue;
        if (!map.has(chat.telefono)) map.set(chat.telefono, chat);
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
    const v = String(status || "").toLowerCase();
    if (v === "accepted") return "aceptado";
    if (v === "sent") return "enviado";
    if (v === "delivered") return "entregado";
    if (v === "read") return "leído";
    if (v === "failed") return "falló";
    if (v === "received") return "";
    return v || "—";
}

function labelBloqueoIa(value) {
    const map = {
        numero_asesor_invalido: "Número asesor inválido",
        configuracion_ia_no_existe: "Configuración IA no existe",
        configuracion_ia_inactiva: "Configuración IA apagada",
        fuera_de_horario: "Fuera de horario",
        expediente_no_encontrado: "Expediente no encontrado",
        expediente_ia_pausada: "Expediente IA pausada",
        conversacion_ia_inactiva: "Conversación IA inactiva",
        conversacion_ia_pausada: "Conversación IA pausada",
    };
    return map[value] || String(value || "Bloqueo desconocido");
}

function getIaEstadoVisual(estadoIa) {
    const bloqueos = Array.isArray(estadoIa?.bloqueos) ? estadoIa.bloqueos : [];
    if (!estadoIa) return { label: "IA sin diagnóstico", detail: "Abre un chat para consultar el estado operativo.", cls: "border-slate-200 bg-slate-50 text-slate-700" };
    if (estadoIa.puede_responder) return { label: "IA lista para responder", detail: "Configuración activa, conversación habilitada y dentro de horario.", cls: "border-emerald-200 bg-emerald-50 text-emerald-800" };
    return { label: "IA no responderá", detail: bloqueos.length ? bloqueos.map(labelBloqueoIa).join(" · ") : "Hay un bloqueo operativo sin clasificar.", cls: "border-amber-200 bg-amber-50 text-amber-900" };
}

function parseWhatsAppFormat(texto) {
    let r = String(texto || "");
    r = r.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    r = r.replace(/```([\s\S]+?)```/g, '<code class="inline-block rounded-md bg-black/10 px-1.5 py-0.5 font-mono text-[13px]">$1</code>');
    r = r.replace(/\*([^*\n]+)\*/g, '<strong class="font-black">$1</strong>');
    r = r.replace(/_([^_\n]+)_/g, "<em>$1</em>");
    r = r.replace(/~([^~\n]+)~/g, "<del>$1</del>");
    r = r.replace(/\n/g, "<br>");
    return r;
}

function parseWhatsAppComposerFormat(texto) {
    let r = String(texto || "");
    r = r.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    r = r.replace(/```([\s\S]+?)```/g, '<code class="inline-block rounded-md bg-black/10 px-1.5 py-0.5 font-mono text-[13px]">$1</code>');
    r = r.replace(/\*([^*\n]+)\*/g, '<strong class="font-black">$1</strong>');
    r = r.replace(/_([^_\n]+)_/g, "<em>$1</em>");
    r = r.replace(/~([^~\n]+)~/g, "<del>$1</del>");
    r = r.replace(/\n/g, "<br>");
    return r;
}

function WhatsAppComposerInput({ value, onChange, onSend, disabled, placeholder, inputRef, onPaste }) {
    const internalRef = useRef(null);
    const mirrorRef = useRef(null);
    const setRefs = (node) => { internalRef.current = node; if (inputRef) inputRef.current = node; };

    useEffect(() => {
        const ta = internalRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        ta.style.height = `${Math.min(ta.scrollHeight, 128)}px`;
    }, [value]);

    function syncScroll() {
        if (!internalRef.current || !mirrorRef.current) return;
        mirrorRef.current.scrollTop = internalRef.current.scrollTop;
    }

    function handleKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
    }

    return (
        <div className="relative min-h-[40px] flex-1">
            {!String(value || "").length ? (
                <div className="pointer-events-none absolute left-2 top-2 z-0 text-sm font-medium text-slate-400">{placeholder}</div>
            ) : null}
            <div ref={mirrorRef} aria-hidden="true"
                className={cls("pointer-events-none absolute inset-0 z-0 max-h-32 overflow-y-auto whitespace-pre-wrap break-words px-2 py-2 text-sm font-medium leading-relaxed text-[#000000]", "[&_strong]:font-black [&_em]:italic [&_del]:line-through", "[&_code]:rounded-md [&_code]:bg-black/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px]")}
                dangerouslySetInnerHTML={{ __html: value ? parseWhatsAppComposerFormat(value) : "" }}
            />
            <textarea ref={setRefs} value={value} onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown} onPaste={onPaste} onScroll={syncScroll}
                disabled={disabled} rows={1} spellCheck
                className={cls("relative z-10 block max-h-32 min-h-[40px] w-full resize-none overflow-y-auto bg-transparent px-2 py-2 text-sm font-medium leading-relaxed outline-none", "text-transparent caret-[#000000] placeholder:text-slate-400", "selection:bg-[#000000]/20 selection:text-transparent", disabled ? "cursor-not-allowed opacity-60" : "")}
            />
        </div>
    );
}

function getMessageKey(m) { return String(m?.wa_message_id || m?.id || ""); }

function getMessageTimeValue(m) {
    const v = m?.created_at || m?.local_created_at || "";
    const t = new Date(v).getTime();
    return Number.isNaN(t) ? 0 : t;
}

function mergeMessages(oldMessages, newMessages) {
    const map = new Map();
    for (const m of oldMessages || []) { const k = getMessageKey(m); if (k) map.set(k, m); }
    for (const m of newMessages || []) { const k = getMessageKey(m); if (k) map.set(k, m); }
    return Array.from(map.values()).sort((a, b) => {
        const da = getMessageTimeValue(a), db = getMessageTimeValue(b);
        if (da !== db) return da - db;
        return Number(a.id || 0) - Number(b.id || 0);
    });
}

function isNearBottom(el, threshold = 180) {
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
}

// ─── helper: id del mensaje al que se responde (estilo WhatsApp "context") ──
function getReplyToId(message = {}) {
    return (
        message.context?.id ||
        message.reply_to_message_id ||
        message.reply_to_id ||
        message.quoted_message_id ||
        message.quoted_id ||
        message?.raw?.context?.id ||
        ""
    );
}

function Avatar({ name = "?" }) {
    const initials = String(name || "?").split(" ").filter(Boolean).slice(0, 2).map(i => i[0]?.toUpperCase()).join("");
    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm">
            <span className="text-sm font-extrabold text-[#000000]">{initials || "?"}</span>
        </div>
    );
}

function Sk({ className = "" }) { return <div className={cls("animate-pulse rounded-md bg-slate-200", className)} />; }

function ChatListSkeleton({ rows = 8 }) {
    return (
        <div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 border-b border-black/5 px-4 py-3">
                    <Sk className="h-10 w-10 rounded-full shrink-0" />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                            <Sk className="h-3.5 w-32 rounded" />
                            <Sk className="h-3 w-10 rounded" />
                        </div>
                        <Sk className="h-3 w-48 rounded mb-2" />
                        <div className="flex gap-1.5">
                            <Sk className="h-4 w-20 rounded-full" />
                            <Sk className="h-4 w-16 rounded-full" />
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
            {Array.from({ length: bubbles }).map((_, i) => {
                const mine = i % 2 === 0;
                return (
                    <div key={i} className={cls("flex w-full", mine ? "justify-end" : "justify-start")}>
                        <div className={cls("max-w-[78%] rounded-2xl border px-4 py-3 shadow-sm", mine ? "border-white/10 bg-[#000000]/10" : "border-black/10 bg-white")}>
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
    const v = String(name || "");
    if (v.length <= 22) return v;
    return `${v.slice(0, 12)}…${v.slice(-8)}`;
}

function formatAudioTime(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds || 0)));
    const min = Math.floor(total / 60);
    const sec = total % 60;
    return `${min}:${String(sec).padStart(2, "0")}`;
}

function humanBytes(bytes) {
    const value = Number(bytes || 0);

    if (!Number.isFinite(value) || value <= 0) {
        return "0 B";
    }

    const units = ["B", "KB", "MB", "GB", "TB"];
    const index = Math.min(
        Math.floor(Math.log(value) / Math.log(1024)),
        units.length - 1
    );

    const size = value / Math.pow(1024, index);

    return `${size >= 10 || index === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[index]}`;
}

function cleanMediaTextForBubble(text, attachments = []) {
    let value = String(text || "").trim();

    // Quita marcadores internos del backend: [FILE:nombre.jpg]
    value = value.replace(/\[FILE:[^\]]+\]/gi, "").trim();

    const upper = value.toUpperCase();

    if (
        attachments.length &&
        [
            "[IMAGE]",
            "[VIDEO]",
            "[AUDIO]",
            "[STICKER]",
            "[DOCUMENT]",
            "ADJUNTO",
            "ARCHIVO",
        ].includes(upper)
    ) {
        return "";
    }

    return value;
}

function extractFilesFromDataTransfer(dt) {
    if (!dt) return [];
    const list = dt.files ? Array.from(dt.files) : [];
    if (list.length) return list.filter(f => f && typeof f.size === "number");
    const items = dt.items ? Array.from(dt.items) : [];
    const output = [];
    for (const item of items) {
        if (item.kind === "file") { const f = item.getAsFile?.(); if (f && typeof f.size === "number") output.push(f); }
    }
    return output;
}

function inferAttachmentKind(a = {}) {
    const type = String(a.kind || a.type || a.media_type || "").toLowerCase();
    const mime = String(a.mime || a.mime_type || "").toLowerCase();
    if (type === "sticker") return "sticker";
    if (type === "image" || mime.startsWith("image/")) return "image";
    if (type === "video" || mime.startsWith("video/")) return "video";
    if (type === "audio" || mime.startsWith("audio/")) return "audio";
    return "file";
}

function normalizeMessageAttachments(message = {}) {
    if (Array.isArray(message.attachments) && message.attachments.length) {
        return message.attachments.map((a, i) => {
            const src = a.url || a.previewUrl || "";
            return { id: a.id || `${message.wa_message_id || message.id || "msg"}-${i}`, kind: inferAttachmentKind(a), previewUrl: src, url: src, name: a.name || a.filename || "", size: a.size || 0, mime: a.mime || a.mime_type || "" };
        }).filter(a => a.url);
    }
    const rawList = Array.isArray(message.media) ? message.media : message.media_url || message.image_url || message.sticker_url ? [message] : [];
    return rawList.map((a, i) => {
        const src = a.previewUrl || a.url || a.media_url || a.image_url || a.sticker_url || a.src || "";
        return { id: a.id || a.media_id || `${message.wa_message_id || message.id || "msg"}-${i}`, kind: inferAttachmentKind(a), previewUrl: src, url: src, name: a.name || a.filename || "", size: a.size || a.file_size || 0, mime: a.mime || a.mime_type || "" };
    }).filter(a => a.url);
}

function getMessageReactions(message = {}) {
    const raw = message.raw || {};

    const source = Array.isArray(message.reactions)
        ? message.reactions
        : Array.isArray(raw.reactions)
            ? raw.reactions
            : [];

    return source
        .map((item, index) => ({
            id: item.reaction_message_id || `${message.wa_message_id || message.id}-reaction-${index}`,
            emoji: String(item.emoji || "").trim(),
            telefono: item.telefono || "",
            from: item.from || "cliente",
        }))
        .filter((item) => item.emoji);
}

function isReactionEvent(message = {}) {
    const raw = message.raw || {};
    return Boolean(
        raw.is_reaction_event ||
        raw.type === "reaction" ||
        message.type === "reaction"
    );
}

function applyReactionEvents(messages = []) {
    const map = new Map();

    for (const msg of messages || []) {
        const key = getMessageKey(msg);
        if (!key) continue;

        map.set(key, {
            ...msg,
            reactions: getMessageReactions(msg),
        });
    }

    for (const msg of messages || []) {
        const raw = msg.raw || {};

        if (!isReactionEvent(msg)) continue;

        const targetId =
            raw.reaction_target_id ||
            raw?.reaction?.message_id ||
            "";

        if (!targetId || !map.has(String(targetId))) continue;

        const target = map.get(String(targetId));
        const emoji =
            raw.reaction_emoji ||
            raw?.reaction?.emoji ||
            "";

        const removed = Boolean(
            raw.reaction_removed ||
            !String(emoji || "").trim()
        );

        let reactions = Array.isArray(target.reactions)
            ? [...target.reactions]
            : [];

        const telefono = msg.telefono || raw.from || raw.telefono || "";

        reactions = reactions.filter((r) => String(r.telefono || "") !== String(telefono || ""));

        if (!removed && emoji) {
            reactions.push({
                id: msg.wa_message_id || msg.id || crypto.randomUUID(),
                emoji,
                telefono,
                from: "cliente",
            });
        }

        map.set(String(targetId), {
            ...target,
            reactions,
        });
    }

    return Array.from(map.values())
        .filter((msg) => !isReactionEvent(msg))
        .sort((a, b) => {
            const da = getMessageTimeValue(a);
            const db = getMessageTimeValue(b);

            if (da !== db) return da - db;

            return Number(a.id || 0) - Number(b.id || 0);
        });
}

function normalizeMessage(message = {}) {
    const raw = message.raw || {};
    const reactionEvent = isReactionEvent(message);

    const templatePreview =
        message.template_preview ||
        message.preview_text ||
        raw.template_preview ||
        raw.preview_text ||
        "";

    return {
        ...message,
        id: message.id || message.wa_message_id || crypto.randomUUID(),
        text: reactionEvent ? "" : (templatePreview || message.text || message.body || message.caption || ""),
        attachments: reactionEvent ? [] : normalizeMessageAttachments(message),
        is_ai: Boolean(message.is_ai || message?.raw?.openai_model || message?.raw?.ia_model || message?.raw?.ia_provider),
        reply_to_id: message.reply_to_id || getReplyToId(message),
        reactions: getMessageReactions(message),
        is_reaction_event: reactionEvent,
    };
}

function getTemplateComponentType(c = {}) { return String(c.type || "").toLowerCase(); }

function replaceMetaVariables(text, componentType, draft, context = {}) {
    return String(text || "").replace(/\{\{(\d+)\}\}/g, (_, idx) => {
        const key = `${componentType}_${idx}`;
        const value = String(draft?.[key] ?? draft?.[`body_${idx}`] ?? "").trim();

        if (value) return value;

        const fallback = getTemplateContextFallback(idx, context);

        return fallback || `{{${idx}}}`;
    });
}

function interpolateNumberedText(text, fields, draft) {
    const vals = (fields || []).map(f => String(draft?.[f.key] || "").trim());
    return String(text || "").replace(/\((\d+)\)/g, (_, idx) => vals[Number(idx) - 1] || "");
}

function buildTemplatePreviewText(template, draft, context = {}) {
    if (!template) return "";

    const components = Array.isArray(template.components_meta)
        ? template.components_meta
        : Array.isArray(template.components)
            ? template.components
            : [];

    const fromMeta = components
        .filter((component) => {
            const type = getTemplateComponentType(component);
            return ["header", "body", "footer"].includes(type) && String(component.text || "").trim();
        })
        .map((component) =>
            replaceMetaVariables(
                component.text,
                getTemplateComponentType(component),
                draft,
                context,
            ),
        )
        .filter(Boolean)
        .join("\n");

    if (fromMeta) return fromMeta;

    return interpolateNumberedText(template.help || template.text || "", template.fields || [], draft);
}

function parseTemplateMarkerText(text) {
    const value = String(text || "").trim();

    const metaMatch = value.match(/^\[TEMPLATE:\s*([^\]]+)\]\s*(.*)$/is);

    if (metaMatch) {
        const templateName = String(metaMatch[1] || "").trim();
        const params = String(metaMatch[2] || "")
            .split("|")
            .map((item) => item.trim())
            .filter(Boolean);

        return { isTemplate: true, templateName, params, plainText: value };
    }

    const uiMatch = value.match(/^Plantilla\s*:\s*([^\n|]+)\s*([\s\S]*)$/i);

    if (uiMatch) {
        const templateName = String(uiMatch[1] || "").trim();
        const rest = String(uiMatch[2] || "").trim();
        const params = rest
            ? rest
                .split(/[|\n]/)
                .map((item) => item.trim())
                .filter(Boolean)
            : [];

        return { isTemplate: true, templateName, params, plainText: value };
    }

    return { isTemplate: false, templateName: "", params: [], plainText: String(text || "") };
}

function buildDraftFromTemplateParams(template, params = [], context = {}) {
    const draft = {};
    const fields = Array.isArray(template?.fields) ? template.fields : [];

    fields.forEach((field, index) => {
        const fromParams = String(params[index] || "").trim();
        draft[field.key] = fromParams || getDefaultValueForTemplateField(field, context);
    });

    if (!fields.length) {
        const components = Array.isArray(template?.components_meta)
            ? template.components_meta
            : Array.isArray(template?.components)
                ? template.components
                : [];

        let paramIndex = 0;

        for (const component of components) {
            const type = getTemplateComponentType(component);
            const text = String(component?.text || "");
            const matches = [...text.matchAll(/\{\{(\d+)\}\}/g)];

            for (const match of matches) {
                const index = match[1];
                const key = `${type}_${index}`;

                if (draft[key]) continue;

                draft[key] = String(params[paramIndex] || "").trim() || getTemplateContextFallback(index, context);
                paramIndex += 1;
            }
        }
    }

    return draft;
}

function formatTemplateMarkerText(text, templateMap, context = {}) {
    const parsed = parseTemplateMarkerText(text);

    if (!parsed.isTemplate) return parsed.plainText;

    const template = resolveTemplateFromMap(templateMap, parsed.templateName);

    if (template) {
        const draft = buildDraftFromTemplateParams(template, parsed.params, context);
        const preview = buildTemplatePreviewText(template, draft, context);

        if (String(preview || "").trim()) return preview;
    }

    return `Plantilla: ${parsed.templateName}${parsed.params.length ? "\n" + parsed.params.join("\n") : ""}`;
}

function getFieldOptions(field) {
    if (Array.isArray(field?.options) && field.options.length) return field.options;
    const label = safeLower(field?.label), key = safeLower(field?.key);
    if (label.includes("dealer") || label.includes("agencia") || key.includes("dealer") || key.includes("agencia")) return DEALERS;
    if (label.includes("canal") || key.includes("canal")) return CANALES;
    return [];
}

function getDefaultValueForTemplateField(field, context) {
    const label = safeLower(field?.label), key = safeLower(field?.key);
    if (label.includes("asesor") || key.includes("asesor") || label.includes("quién eres")) return context.asesor || "";
    if (label.includes("nombre") || label.includes("prospecto") || label.includes("cliente") || key.includes("nombre")) return context.nombre || "";
    if (label.includes("dealer") || label.includes("agencia") || key.includes("dealer") || key.includes("agencia")) return context.agencia || "";
    if (label.includes("modelo") || label.includes("auto") || label.includes("vehículo") || key.includes("modelo") || key.includes("auto")) return context.modelo || "";
    if (label.includes("canal") || key.includes("canal")) return context.canal || "";
    if (label.includes("tema") || key.includes("tema")) return context.tema || "";
    if (label.includes("dato") || label.includes("pides") || key.includes("dato")) return context.dato || "";
    return "";
}

function buildDynamicTemplateComponents(template, draft) {
    const fields = Array.isArray(template?.fields) ? template.fields : [];
    const grouped = fields.reduce((acc, f) => { const c = String(f.component || "body").toLowerCase(); if (!acc[c]) acc[c] = []; acc[c].push(f); return acc; }, {});
    return Object.entries(grouped).map(([type, items]) => ({
        type,
        parameters: items.sort((a, b) => Number(a.index || 0) - Number(b.index || 0)).map(f => ({ type: "text", text: String(draft?.[f.key] || "").trim() })),
    })).filter(c => c.parameters.length > 0);
}

function WhatsAppWaveform({ progress = 0, mine = false, onSeek }) {
    const bars = [8, 14, 10, 18, 12, 22, 16, 26, 20, 16, 24, 14, 18, 10, 22, 12, 16, 8, 14, 20, 12, 18, 10, 15, 9, 13, 18, 11, 16, 10];

    return (
        <button
            type="button"
            onClick={onSeek}
            className="flex h-9 flex-1 items-center gap-[2px] overflow-hidden rounded-lg px-1"
            title="Avanzar audio"
        >
            {bars.map((h, index) => {
                const active = index / bars.length <= progress;

                return (
                    <span
                        key={index}
                        className={cls(
                            "w-[3px] rounded-full transition",
                            active
                                ? mine
                                    ? "bg-[#075E54]"
                                    : "bg-[#128C7E]"
                                : mine
                                    ? "bg-[#075E54]/25"
                                    : "bg-slate-300"
                        )}
                        style={{ height: `${h}px` }}
                    />
                );
            })}
        </button>
    );
}

function WhatsAppAudioPlayer({ src, mine }) {
    const audioRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [current, setCurrent] = useState(0);

    const progress = duration ? Math.min(1, current / duration) : 0;

    async function togglePlay() {
        const audio = audioRef.current;

        if (!audio) return;

        if (playing) {
            audio.pause();
            setPlaying(false);
            return;
        }

        try {
            await audio.play();
            setPlaying(true);
        } catch (error) {
            console.error("No se pudo reproducir audio:", error);
        }
    }

    function handleSeek(e) {
        const audio = audioRef.current;

        if (!audio || !duration) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));

        audio.currentTime = pct * duration;
        setCurrent(audio.currentTime);
    }

    return (
        <div
            className={cls(
                "flex min-w-[260px] max-w-[360px] items-center gap-3 rounded-2xl px-3 py-2",
                mine ? "bg-[#D9FDD3] text-[#111B21]" : "bg-white text-[#111B21]"
            )}
        >
            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
                onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime || 0)}
                onEnded={() => {
                    setPlaying(false);
                    setCurrent(0);
                }}
                className="hidden"
            />

            <button
                type="button"
                onClick={togglePlay}
                className={cls(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm transition",
                    mine
                        ? "bg-[#075E54] text-white hover:bg-[#064C43]"
                        : "bg-[#128C7E] text-white hover:bg-[#0F766E]"
                )}
                title={playing ? "Pausar" : "Reproducir"}
            >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
            </button>

            <div className="min-w-0 flex-1">
                <WhatsAppWaveform progress={progress} mine={mine} onSeek={handleSeek} />

                <div className="mt-0.5 flex items-center justify-between text-[11px] font-semibold text-[#667781]">
                    <span>{formatAudioTime(current || duration || 0)}</span>
                    <span>audio</span>
                </div>
            </div>
        </div>
    );
}

function WhatsAppAttachment({ mine, attachment }) {
    const src = attachment.url || attachment.previewUrl;

    if (!src) return null;

    if (attachment.kind === "sticker") {
        return (
            <a href={src} target="_blank" rel="noreferrer" className="block">
                <img
                    src={src}
                    alt={attachment.name || "sticker"}
                    className="max-h-44 max-w-44 object-contain"
                    loading="lazy"
                />
            </a>
        );
    }

    if (attachment.kind === "image") {
        return (
            <a href={src} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl">
                <img
                    src={src}
                    alt={attachment.name || "imagen"}
                    className="block max-h-[360px] w-full max-w-[330px] object-cover"
                    loading="lazy"
                />
            </a>
        );
    }

    if (attachment.kind === "video") {
        return (
            <div className="overflow-hidden rounded-xl bg-black">
                <video
                    src={src}
                    controls
                    playsInline
                    preload="metadata"
                    className="block max-h-[360px] w-full max-w-[330px] bg-black object-contain"
                />
            </div>
        );
    }

    if (attachment.kind === "audio") {
        return <WhatsAppAudioPlayer src={src} mine={mine} />;
    }

    return (
        <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className={cls(
                "flex min-w-[240px] max-w-[330px] items-center gap-3 rounded-xl px-3 py-3 transition hover:opacity-90",
                mine ? "bg-[#D9FDD3] text-[#111B21]" : "bg-white text-[#111B21]"
            )}
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#128C7E]/10 text-[#128C7E]">
                <FileText className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">
                    {attachment.name ? shortName(attachment.name) : "Documento"}
                </div>

                <div className="text-[11px] font-semibold text-[#667781]">
                    {attachment.size ? humanBytes(attachment.size) : "Abrir archivo"}
                </div>
            </div>
        </a>
    );
}

// ─── Ticks de estado estilo WhatsApp (reloj / ✓ / ✓✓ gris / ✓✓ azul) ────────

function MessageStatusTicks({ status, pending }) {
    if (pending) {
        return <Clock className="h-3.5 w-3.5 opacity-60" title="Enviando…" />;
    }
    const v = String(status || "").toLowerCase();
    if (v === "failed") {
        return <AlertCircle className="h-3.5 w-3.5 text-red-300" title="Falló el envío" />;
    }
    if (v === "read") {
        return <CheckCheck className="h-3.5 w-3.5" style={{ color: "#53BDEB" }} title="Leído" />;
    }
    if (v === "delivered") {
        return <CheckCheck className="h-3.5 w-3.5 opacity-70" title="Entregado" />;
    }
    if (v === "sent" || v === "accepted") {
        return <Check className="h-3.5 w-3.5 opacity-70" title="Enviado" />;
    }
    if (v === "received") return null;
    return <Check className="h-3.5 w-3.5 opacity-50" title="Enviado" />;
}

// ─── Formateador de fecha estilo WhatsApp: "Hoy", "Ayer", o fecha completa ──
function formatWhatsAppDate(isoString) {
    if (!isoString) return "—";
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "—";

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Formatear hora (12h)
    const timeStr = date.toLocaleTimeString("es-MX", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/Mexico_City"
    });

    // Determinar si es Hoy, Ayer u otra fecha
    if (msgDate.getTime() === today.getTime()) {
        return `Hoy ${timeStr}`;
    } else if (msgDate.getTime() === yesterday.getTime()) {
        return `Ayer ${timeStr}`;
    } else {
        // Formato: "24 de junio de 2026 3:45 PM"
        const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
            "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
        return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()} ${timeStr}`;
    }
}

// ─── Formateador de hora corta para burbujas ──────────────────────────────
function formatMessageTime(isoString) {
    if (!isoString) return "—";
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleTimeString("es-MX", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/Mexico_City"
    });
}

// ─── Separador de fecha entre mensajes ─────────────────────────────────────
// DESPUÉS
function DateSeparator({ date }) {
    if (!date) return null;
    return (
        <div className="sticky top-2 z-10 flex justify-center my-4 pointer-events-none">
            <div className="pointer-events-auto rounded-full border border-black/10 bg-white/90 backdrop-blur-sm px-4 py-1.5 text-xs font-extrabold text-[#000000] shadow-sm">
                {formatWhatsAppDate(date)}
            </div>
        </div>
    );
}

// ─── Función para agrupar mensajes por fecha ──────────────────────────────
function groupMessagesByDate(messages) {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    for (const msg of messages) {
        const msgDate = msg.created_at || msg.local_created_at || "";
        if (!msgDate) {
            // Si no tiene fecha, lo agregamos al grupo actual o creamos uno nuevo
            if (currentGroup.length === 0) {
                currentGroup.push(msg);
            } else {
                currentGroup.push(msg);
            }
            continue;
        }

        const dateObj = new Date(msgDate);
        if (Number.isNaN(dateObj.getTime())) {
            if (currentGroup.length === 0) {
                currentGroup.push(msg);
            } else {
                currentGroup.push(msg);
            }
            continue;
        }

        const dateKey = dateObj.toDateString();

        if (currentDate === null) {
            currentDate = dateKey;
            currentGroup = [msg];
        } else if (dateKey === currentDate) {
            currentGroup.push(msg);
        } else {
            // Guardar grupo anterior
            groups.push({
                date: currentGroup[0]?.created_at || currentGroup[0]?.local_created_at || "",
                messages: currentGroup
            });
            // Iniciar nuevo grupo
            currentDate = dateKey;
            currentGroup = [msg];
        }
    }

    // Guardar último grupo
    if (currentGroup.length > 0) {
        groups.push({
            date: currentGroup[0]?.created_at || currentGroup[0]?.local_created_at || "",
            messages: currentGroup
        });
    }

    return groups;
}

function MessageBubble({
    mine,
    text,
    time,
    status = "sent",
    attachments = [],
    reactions = [],
    isAi = false,
    renderText,
    onReply,
    replyPreview,
    localPending,
    domId,
    highlighted,
}) {
    const rawText = renderText ? renderText(text) : text;
    const shown = cleanMediaTextForBubble(rawText, attachments);

    const hasText = Boolean(String(shown || "").trim());
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
    const stickerOnly =
        hasAttachments &&
        attachments.length === 1 &&
        attachments[0]?.kind === "sticker" &&
        !hasText;

    const audioOnly =
        hasAttachments &&
        attachments.length === 1 &&
        attachments[0]?.kind === "audio" &&
        !hasText;

    const visualOnly =
        hasAttachments &&
        attachments.every((a) => ["image", "video", "sticker"].includes(a.kind)) &&
        !hasText;

    return (
        <div
            id={domId}
            className={cls(
                "flex w-full rounded-2xl transition-colors duration-700 my-4",
                mine ? "justify-end" : "justify-start",
                highlighted ? "bg-amber-100/60" : ""
            )}
        >
            <div
                className={cls(
                    "max-w-[88%] sm:max-w-[82%] lg:max-w-[76%] xl:max-w-[72%]",
                    hasAttachments ? "w-fit" : ""
                )}
            >
                <div
                    className={cls(
                        "relative shadow-sm",
                        stickerOnly
                            ? "bg-transparent p-0 shadow-none"
                            : cls(
                                "rounded-2xl",
                                mine
                                    ? "rounded-br-md bg-[#D9FDD3] text-[#111B21]"
                                    : "rounded-bl-md bg-white text-[#111B21] ring-1 ring-black/10",
                                visualOnly ? "p-1.5" : audioOnly ? "p-1.5" : "px-3 py-2"
                            )
                    )}
                >
                    {replyPreview && !stickerOnly ? (
                        <button
                            type="button"
                            onClick={replyPreview.onClick}
                            className={cls(
                                "mb-2 flex w-full min-w-[220px] items-start gap-2 rounded-lg border-l-4 px-2.5 py-1.5 text-left transition",
                                mine
                                    ? "border-[#128C7E] bg-[#128C7E]/10 hover:bg-[#128C7E]/15"
                                    : "border-[#128C7E] bg-[#128C7E]/5 hover:bg-[#128C7E]/10"
                            )}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="text-[11px] font-extrabold text-[#128C7E]">
                                    {replyPreview.author}
                                </div>
                                <div className="truncate text-[12px] font-medium text-[#667781]">
                                    {replyPreview.text}
                                </div>
                            </div>
                        </button>
                    ) : null}

                    {hasAttachments ? (
                        <div className={cls("grid gap-1.5", hasText ? "mb-1.5" : "")}>
                            {attachments.map((a) => (
                                <WhatsAppAttachment
                                    key={a.id}
                                    mine={mine}
                                    attachment={a}
                                />
                            ))}
                        </div>
                    ) : null}

                    {hasText ? (
                        <div
                            className="whitespace-pre-wrap px-0.5 text-[15px] font-medium leading-relaxed md:text-base [&_strong]:font-black [&_em]:italic [&_del]:line-through"
                            dangerouslySetInnerHTML={{ __html: parseWhatsAppFormat(shown) }}
                        />
                    ) : null}

                    {!stickerOnly ? (
                        <div
                            className={cls(
                                "mt-1 flex items-center justify-end gap-1.5 px-0.5 text-[11px] font-semibold",
                                "text-[#667781]"
                            )}
                        >
                            {isAi ? (
                                <span
                                    className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-extrabold leading-none text-violet-700 ring-1 ring-violet-300"
                                    title="Mensaje generado por IA"
                                >
                                    ✦ IA
                                </span>
                            ) : null}

                            <span>{time}</span>

                            {mine ? (
                                <MessageStatusTicks
                                    status={status}
                                    pending={localPending}
                                />
                            ) : null}
                        </div>
                    ) : (
                        <div className="mt-0.5 flex items-center justify-end gap-1.5 text-[11px] font-semibold text-[#667781]">
                            <span>{time}</span>
                            {mine ? (
                                <MessageStatusTicks
                                    status={status}
                                    pending={localPending}
                                />
                            ) : null}
                        </div>
                    )}

                    {onReply ? (
                        <div className={cls("mt-1.5 ml-1.5 mb-1.5 flex", mine ? "justify-end" : "justify-start")}>
                            <button
                                type="button"
                                onClick={onReply}
                                className={cls(
                                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold transition",
                                    mine
                                        ? "bg-[#075E54]/10 text-[#075E54] hover:bg-[#075E54]/15"
                                        : "bg-[#128C7E]/10 text-[#128C7E] hover:bg-[#128C7E]/15"
                                )}
                                title="Responder a este mensaje"
                            >
                                <Pencil className="h-3 w-3" />
                                Responder
                            </button>
                        </div>
                    ) : null}
                </div>

                {Array.isArray(reactions) && reactions.length ? (
                    <div className={cls("relative z-10 -mt-2 flex px-3", mine ? "justify-end" : "justify-start")}>
                        <div className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2 py-0.5 text-sm shadow-sm">
                            {reactions.slice(0, 4).map((reaction) => (
                                <span key={reaction.id || reaction.emoji}>{reaction.emoji}</span>
                            ))}

                            {reactions.length > 4 ? (
                                <span className="text-[10px] font-extrabold text-slate-400">
                                    +{reactions.length - 4}
                                </span>
                            ) : null}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

// ─── Dropdown genérico reutilizable (plantillas + mensajes rápidos) ──────────

function ComposerDropdown({ open, onClose, dropdownRef, children, title, headerRight }) {
    if (!open) return null;
    return (
        <div ref={dropdownRef} className="absolute bottom-14 left-0 z-50 w-80 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/5 px-4 py-2.5">
                <span className="text-xs font-extrabold text-[#000000]">{title}</span>
                <div className="flex items-center gap-2">
                    {headerRight}
                    <button type="button" onClick={onClose}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-neutral-100 hover:text-slate-600 transition">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
            {children}
        </div>
    );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function DigitalesContacto() {
    const navigate = useNavigate();
    const location = useLocation();
    const [params] = useSearchParams();
    const [replyToMsg, setReplyToMsg] = useState(null);

    const telParam = params.get("tel") || "";
    const directParam = params.get("direct") || "";
    const tel = useMemo(() => normalizaTelefonoMx(telParam), [telParam]);
    const isDirectChatMode = useMemo(() => Boolean(tel && directParam === "1"), [tel, directParam]);

    const [q, setQ] = useState("");
    const [chatFilter, setChatFilter] = useState("todos");
    const [loadingList, setLoadingList] = useState(false);
    const [loadingChat, setLoadingChat] = useState(false);
    const [chats, setChats] = useState([]);
    const [prospectosIndex, setProspectosIndex] = useState([]);
    const deferredQ = useDeferredValue(q);
    const [activeTel, setActiveTel] = useState("");
    const [prospecto, setProspecto] = useState(null);
    const [iaEstado, setIaEstado] = useState(null);
    const [loadingIaAction, setLoadingIaAction] = useState(false);
    const [mensajes, setMensajes] = useState([]);
    const [draftMsg, setDraftMsg] = useState("");
    const [mobileView, setMobileView] = useState("list");
    const [chatSidebarCollapsed, setChatSidebarCollapsed] = useState(false);
    const [headerEstado, setHeaderEstado] = useState("");

    // Resaltado temporal al saltar a un mensaje citado
    const [highlightedMsgId, setHighlightedMsgId] = useState("");

    // Dropdowns compositor
    const [showQuickBubblesDropdown, setShowQuickBubblesDropdown] = useState(false);
    const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
    const quickBubblesDropdownRef = useRef(null);
    const templatesDropdownRef = useRef(null);

    const [chatHasMore, setChatHasMore] = useState(false);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [oldestMessageId, setOldestMessageId] = useState(null);

    // Templates state (en dropdown)
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
        try { const s = localStorage.getItem(QUICK_BUBBLES_KEY); if (!s) return []; const p = JSON.parse(s); return Array.isArray(p) ? p : []; } catch { return []; }
    });
    const [showAddBubble, setShowAddBubble] = useState(false);
    const [newBubbleText, setNewBubbleText] = useState("");
    const [newBubbleTitle, setNewBubbleTitle] = useState("");

    const [quickEditDraft, setQuickEditDraft] = useState({});
    const [savingQuickEdit, setSavingQuickEdit] = useState(false);
    const [pautasOptions, setPautasOptions] = useState([]);
    const [loadingPautas, setLoadingPautas] = useState(false);
    const [savingHeaderPauta, setSavingHeaderPauta] = useState(false);

    const [copiedTel, setCopiedTel] = useState(false);
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
            for (const key of getTemplateCandidateKeys(template)) {
                map.set(key, template);
            }
        }

        return map;
    }, [templatesDisponibles]);

    const activeChat = useMemo(() => {
        if (!activeTel) return null;
        const fromList = chats.find(c => c.telefono === activeTel);
        if (fromList) return fromList;
        return { id: activeTel, telefono: activeTel, nombre: prospecto?.nombre || "Prospecto", agencia: prospecto?.agencia || "", linea: prospecto?.business || "", estado: prospecto?.estado || "", unread: 0, last: { text: "", time: "" } };
    }, [activeTel, chats, prospecto]);

    const campanaMetaProspecto = useMemo(() => {
        return getCampanaMetaProspecto(prospecto);
    }, [prospecto]);

    const pautaActual = useMemo(() => {
        return String(
            quickEditDraft.pauta ||
            prospecto?.pauta ||
            campanaMetaProspecto.pauta ||
            ""
        ).trim();
    }, [quickEditDraft.pauta, prospecto?.pauta, campanaMetaProspecto.pauta]);

    const filteredChats = useMemo(() => {
        const query = normalizeText(deferredQ);
        const queryPhone = normalizaTelefonoMx(deferredQ);
        const base = query ? mergeChatsConProspectos(chats, prospectosIndex) : chats;
        const filterDef = CHAT_FILTERS.find(f => f.key === chatFilter);
        return base.filter(chat => {
            if (chatFilter === "no_leidos" && !(chat.unread > 0)) return false;
            if (filterDef?.estados) { const en = normalizeText(chat.estado); if (!filterDef.estados.some(e => en.includes(normalizeText(e)))) return false; }
            if (!query) return true;
            return normalizeText(chat.nombre).includes(query) ||
                normalizaTelefonoMx(chat.telefono).includes(queryPhone || query) ||
                normalizeText(chat.agencia).includes(query) ||
                normalizeText(chat.linea).includes(query) ||
                normalizeText(chat.estado).includes(query) ||
                normalizeText(chat.last?.text).includes(query);
        });
    }, [chats, prospectosIndex, deferredQ, chatFilter]);

    const composerHint = useMemo(() => activeTel ? "Escribe tu mensaje…" : "Selecciona un chat para escribir…", [activeTel]);

    const templatePreview = useMemo(() => tplSelected ? buildTemplatePreviewText(tplSelected, tplDraft) : "", [tplSelected, tplDraft]);

    const templatesParaEnviar = useMemo(() => {
        const utility = (templatesDisponibles || []).filter((template) => {
            const category = String(template?.category || "").trim().toUpperCase();
            return !category || category === "UTILITY";
        });

        return utility.length ? utility : templatesDisponibles;
    }, [templatesDisponibles]);

    const puedeGestionarIa = Boolean(
        activeTel &&
        iaEstado &&
        typeof api.iaPausarConversacion === "function" &&
        typeof api.iaReactivarConversacion === "function"
    );

    // Índice rápido id de mensaje -> mensaje (para resolver citas tipo WhatsApp)
    const messagesById = useMemo(() => {
        const map = new Map();
        for (const m of mensajes) {
            const key = m.wa_message_id || m.id;
            if (key) map.set(String(key), m);
        }
        return map;
    }, [mensajes]);

    function fmtDT(iso) {
        if (!iso) return "—";
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return "—";
        return new Intl.DateTimeFormat("es-MX", { dateStyle: "short", timeStyle: "short", hour12: true, timeZone: "America/Mexico_City" }).format(d);
    }

    function cleanupPreviews(list) {
        for (const a of list || []) { if (a?.previewUrl?.startsWith("blob:")) { try { URL.revokeObjectURL(a.previewUrl); } catch { } } }
    }

    function renderTextForBubble(text) {
        const asesorAuto =
            (prospecto?.asesor_digital || "").trim() ||
            (prospecto?.asesor_ventas || "").trim() ||
            (prospecto?.responsable || "").trim() ||
            "";

        return formatTemplateMarkerText(text, templateMap, {
            nombre: (prospecto?.nombre || activeChat?.nombre || "").trim(),
            agencia: (prospecto?.agencia || activeChat?.agencia || "").trim(),
            modelo: (prospecto?.auto_interes || "").trim(),
            canal: (prospecto?.canal_contacto || "").trim(),
            asesor: asesorAuto,
            tema: prospecto?.auto_interes ? "auto de interés" : "cita",
            dato: "horario",
        });
    }

    function scrollToMessage(domId) {
        const el = document.getElementById(domId);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedMsgId(domId);
        setTimeout(() => setHighlightedMsgId(prev => prev === domId ? "" : prev), 1500);
    }

    function guardarChatEnCache(tel52, payload = {}) {
        const key = normalizaTelefonoMx(tel52);
        if (!key) return;
        const actuales = Array.isArray(payload.mensajes) ? payload.mensajes : mensajesRef.current;
        mensajesCacheRef.current.set(key, {
            prospecto: payload.prospecto || prospecto || null,
            ia_estado: payload.ia_estado || iaEstado || null,
            mensajes: actuales.map(normalizeMessage).slice(-CHAT_CACHE_LIMIT),
            paginacion: payload.paginacion || {},
            updatedAt: Date.now(),
        });
    }

    function pintarChatDesdeCache(tel52) {
        const key = normalizaTelefonoMx(tel52);
        const cached = mensajesCacheRef.current.get(key);
        if (!cached) return false;
        setProspecto(cached.prospecto || null);
        setIaEstado(cached.ia_estado || null);
        setMensajes(cached.mensajes || []);
        setChatHasMore(Boolean(cached.paginacion?.has_more));
        setOldestMessageId(cached.paginacion?.oldest_id || cached.mensajes?.[0]?.id || null);
        shouldStickToBottomRef.current = true;
        requestAnimationFrame(() => { endRef.current?.scrollIntoView({ behavior: "auto" }); });
        return true;
    }

    async function prefetchChat(tel52) {
        const target = normalizaTelefonoMx(tel52);
        if (!target || target === activeTelRef.current) return;
        if (mensajesCacheRef.current.has(target)) return;
        if (prefetchedChatsRef.current.has(target)) return;
        prefetchedChatsRef.current.add(target);
        try {
            const data = await api.digitalesContacto(target, { limit: PREFETCH_CHAT_LIMIT, mark_read: 0 });
            guardarChatEnCache(target, data);
        } catch { prefetchedChatsRef.current.delete(target); }
    }

    async function refreshChats() {
        const data = await api.digitalesChats();
        const normalized = (Array.isArray(data) ? data : []).map(chat => ({
            id: chat.id || chat.telefono || crypto.randomUUID(),
            telefono: normalizaTelefonoMx(chat.telefono || ""),
            nombre: chat.nombre || "Prospecto",
            agencia: chat.agencia || "",
            linea: chat.linea || "",
            estado: chat.estado || "",
            ia_estado: chat.ia_estado || null,
            ia_pausada: Boolean(chat.ia_pausada),
            ia_bloqueos: Array.isArray(chat.ia_bloqueos) ? chat.ia_bloqueos : [],
            unread: Number(chat.unread || 0),
            last: { text: chat.last_text || "", time: chat.last_time || "" },
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
        if (!hadCache) { setProspecto(null); setIaEstado(null); setMensajes([]); setChatHasMore(false); setOldestMessageId(null); }
        shouldStickToBottomRef.current = true;
        try {
            const data = await api.digitalesContacto(target, { limit: CHAT_PAGE_SIZE, mark_read: 1 });
            if (chatRequestRef.current !== requestId) return;
            const items = (Array.isArray(data.mensajes) ? data.mensajes : []).map(normalizeMessage);
            const paginacion = data.paginacion || {};
            guardarChatEnCache(target, data);
            setProspecto(data.prospecto || null);
            setIaEstado(data.ia_estado || null);
            setMensajes(items);
            setChatHasMore(Boolean(paginacion.has_more));
            setOldestMessageId(paginacion.oldest_id || items[0]?.id || null);
            if (!isDirectChatMode) await refreshChats().catch(() => { });
            requestAnimationFrame(() => { endRef.current?.scrollIntoView({ behavior: "auto" }); });
        } catch (error) {
            console.error("Error cargando chat:", error);
            if (chatRequestRef.current !== requestId) return;
            setProspecto(null); setIaEstado(null); setMensajes([]); setChatHasMore(false); setOldestMessageId(null);
        } finally { if (chatRequestRef.current === requestId) setLoadingChat(false); }
    }

    async function refreshActiveChat(tel52, { forceBottom = false } = {}) {
        const target = tel52 || activeTel;
        if (!target) return;
        const data = await api.digitalesContacto(target, { limit: CHAT_PAGE_SIZE, mark_read: forceBottom ? 1 : 0 });
        const incoming = (Array.isArray(data.mensajes) ? data.mensajes : []).map(normalizeMessage);
        const paginacion = data.paginacion || {};
        setProspecto(data.prospecto || null);
        setIaEstado(data.ia_estado || null);
        setMensajes(prev => mergeMessages(prev.filter(m => !m.local_pending), incoming));
        setOldestMessageId(prev => prev || paginacion.oldest_id || incoming[0]?.id || null);
        setChatHasMore(prev => prev || Boolean(paginacion.has_more));
        if (forceBottom) shouldStickToBottomRef.current = true;
        if (!isDirectChatMode) await refreshChats().catch(() => { });
    }

    async function pausarIaActiva() {
        if (!activeTel || loadingIaAction) return;
        if (typeof api.iaPausarConversacion !== "function") {
            alert("Este proyecto todavía no tiene configurado api.iaPausarConversacion.");
            return;
        }

        setLoadingIaAction(true);
        try {
            const res = await api.iaPausarConversacion({ tel: activeTel, motivo: "manual_desde_chat" });
            setIaEstado(res?.estado_ia || null);
            await refreshActiveChat(activeTel).catch(() => { });
        } catch (error) { console.error(error); alert(error?.message || "No se pudo pausar la IA."); }
        finally { setLoadingIaAction(false); }
    }

    async function reactivarIaActiva() {
        if (!activeTel || loadingIaAction) return;
        if (typeof api.iaReactivarConversacion !== "function") {
            alert("Este proyecto todavía no tiene configurado api.iaReactivarConversacion.");
            return;
        }

        setLoadingIaAction(true);
        try {
            const res = await api.iaReactivarConversacion({ tel: activeTel });
            setIaEstado(res?.estado_ia || null);
            await refreshActiveChat(activeTel).catch(() => { });
        } catch (error) { console.error(error); alert(error?.message || "No se pudo reactivar la IA."); }
        finally { setLoadingIaAction(false); }
    }

    async function cargarMensajesAnteriores() {
        if (!activeTel || !chatHasMore || !oldestMessageId || loadingOlderRef.current) return;
        const container = messagesScrollRef.current;
        const prevH = container?.scrollHeight || 0, prevT = container?.scrollTop || 0;
        try {
            loadingOlderRef.current = true; setLoadingOlder(true);
            const data = await api.digitalesContacto(activeTel, { limit: CHAT_PAGE_SIZE, before_id: oldestMessageId, mark_read: 0 });
            const older = (Array.isArray(data.mensajes) ? data.mensajes : []).map(normalizeMessage);
            const paginacion = data.paginacion || {};
            if (older.length) { setMensajes(prev => mergeMessages(older, prev)); setOldestMessageId(paginacion.oldest_id || older[0]?.id || oldestMessageId); }
            setChatHasMore(Boolean(paginacion.has_more));
            requestAnimationFrame(() => { const cur = messagesScrollRef.current; if (!cur) return; cur.scrollTop = cur.scrollHeight - prevH + prevT; });
        } catch (error) { console.error("Error cargando mensajes anteriores:", error); }
        finally { loadingOlderRef.current = false; setLoadingOlder(false); }
    }

    function onMessagesScroll(e) {
        const el = e.currentTarget;
        shouldStickToBottomRef.current = isNearBottom(el);
        if (el.scrollTop <= 120) cargarMensajesAnteriores();
    }

    async function cargarPlantillas() {
        try {
            setLoadingTemplates(true);
            setTemplatesError("");

            const response = await api.digitalesPlantillas();
            const items = Array.isArray(response?.items) ? response.items : [];

            // Guardamos todas para poder reconstruir mensajes históricos.
            // En el dropdown de envío se priorizan las Utility con templatesParaEnviar.
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

        setAttachments(prev => {
            const next = [...prev];

            const sig = (f) => `${f?.name || ""}|${f?.size || 0}|${f?.lastModified || 0}`;
            const existing = new Set(next.map(a => sig(a.file)));

            for (const file of arr) {
                if (!file) continue;

                const key = sig(file);

                if (existing.has(key)) continue;

                const id = crypto.randomUUID();
                const kind = fileKind(file);
                const localUrl = URL.createObjectURL(file);

                next.push({
                    id,
                    file,
                    kind,
                    previewUrl: localUrl,
                    url: localUrl,
                    name: file.name,
                    size: file.size,
                    mime: file.type || "",
                });

                existing.add(key);
            }

            return next.slice(0, 10);
        });
    }

    function removeAttachment(id) {
        setAttachments(prev => {
            const t = prev.find(i => i.id === id);
            if (t?.previewUrl?.startsWith("blob:")) { try { URL.revokeObjectURL(t.previewUrl); } catch { } }
            return prev.filter(i => i.id !== id);
        });
    }

    function resetComposer() {
        setDraftMsg("");
        if (inputRef.current) inputRef.current.value = "";
        setEditingMsgId(null); setReplyToMsg(null); setOpenEmoji(false);
        cleanupPreviews(attachments); setAttachments([]);
    }

    function clearTelQueryIfAny() {
        if (!telParam) return;
        navigate({ pathname: location.pathname, search: "" }, { replace: true });
    }

    async function openChatByTel(tel52) {
        const normalized = normalizaTelefonoMx(tel52);
        if (!normalized) return;
        clearTelQueryIfAny();
        setActiveTel(normalized); setMobileView("chat");
        localStorage.setItem("last_active_chat", normalized);
        setChats(prev => prev.map(c => c.telefono === normalized ? { ...c, unread: 0 } : c));
    }

    function onPickEmoji(emojiObj) {
        const emoji = emojiObj?.emoji || "";
        if (!emoji) return;
        const input = inputRef.current;
        if (input && typeof input.selectionStart === "number") {
            const s = input.selectionStart, e = input.selectionEnd;
            const next = `${draftMsg.slice(0, s)}${emoji}${draftMsg.slice(e)}`;
            setDraftMsg(next);
            requestAnimationFrame(() => { input.focus(); input.setSelectionRange(s + emoji.length, s + emoji.length); });
            return;
        }
        setDraftMsg(prev => `${prev}${emoji}`);
        requestAnimationFrame(() => inputRef.current?.focus?.());
    }

    function onPasteInComposer(e) {
        if (!activeTel) return;
        const items = e.clipboardData?.items ? Array.from(e.clipboardData.items) : [];
        const files = [];
        for (const item of items) { if (item.kind === "file") { const f = item.getAsFile?.(); if (f) files.push(f); } }
        if (files.length) { e.preventDefault(); addFilesAsAttachments(files); }
    }

    function onDragEnterComposer(e) { if (!activeTel) return; e.preventDefault(); e.stopPropagation(); dragDepthRef.current += 1; setDragOver(true); }
    function onDragOverComposer(e) { if (!activeTel) return; e.preventDefault(); e.stopPropagation(); if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"; setDragOver(true); }
    function onDragLeaveComposer(e) { if (!activeTel) return; e.preventDefault(); e.stopPropagation(); dragDepthRef.current = Math.max(0, dragDepthRef.current - 1); if (dragDepthRef.current === 0) setDragOver(false); }
    function onDropComposer(e) {
        if (!activeTel) return; e.preventDefault(); e.stopPropagation();
        dragDepthRef.current = 0; setDragOver(false);
        const files = extractFilesFromDataTransfer(e.dataTransfer);
        if (files.length) addFilesAsAttachments(files);
        inputRef.current?.focus?.();
    }

    function abrirPlantillasDropdown() {
        if (!activeTel) return;
        setTplSelected(null); setTplDraft({});
        setShowTemplatesDropdown(prev => !prev);
        setShowQuickBubblesDropdown(false);
        if (!showTemplatesDropdown) cargarPlantillas();
    }

    function pickTemplate(template) {
        setTplSelected(template);
        const currentAgencia = (prospecto?.agencia || activeChat?.agencia || "").trim();
        const bestDealer = DEALERS.find(d => d.toLowerCase() === currentAgencia.toLowerCase()) || DEALERS.find(d => currentAgencia.toLowerCase().includes(d.toLowerCase())) || "";
        const bestCanal = CANALES.find(c => c.toLowerCase() === (prospecto?.canal_contacto || "").trim().toLowerCase()) || "";
        const asesorAuto = (prospecto?.asesor_digital || "").trim() || (prospecto?.asesor_ventas || "").trim() || (prospecto?.responsable || "").trim() || "";
        const context = { nombre: (prospecto?.nombre || activeChat?.nombre || "").trim(), agencia: bestDealer, modelo: (prospecto?.auto_interes || "").trim(), canal: bestCanal, asesor: asesorAuto, tema: prospecto?.auto_interes ? "auto de interés" : "cita", dato: "horario" };
        const draft = {};
        for (const field of template.fields || []) { draft[field.key] = getDefaultValueForTemplateField(field, context); }
        setTplDraft(draft);
    }

    function addQuickBubble() {
        const text = newBubbleText.trim();
        if (!text) return;
        setQuickBubbles(prev => [...prev, { id: crypto.randomUUID(), title: newBubbleTitle.trim() || text.slice(0, 25), text, createdAt: new Date().toISOString() }]);
        setNewBubbleText(""); setNewBubbleTitle(""); setShowAddBubble(false);
    }

    function deleteQuickBubble(id) { setQuickBubbles(prev => prev.filter(b => b.id !== id)); }

    async function sendQuickBubble(text) {
        if (!activeTel || !text.trim()) return;
        setShowQuickBubblesDropdown(false);
        const optimisticId = crypto.randomUUID();
        shouldStickToBottomRef.current = true;
        setMensajes(prev => [...prev, { id: optimisticId, local_pending: true, local_created_at: new Date().toISOString(), mine: true, text: text.replace(/\r\n/g, "\n").trim(), time: "Ahora", status: "sent", reply_to_id: replyToMsg?.wa_message_id || "", attachments: [] }]);
        try {
            await api.digitalesEnviarMensaje({ to: activeTel, text: text.trim(), reply_to_message_id: replyToMsg?.wa_message_id || "" });
            setReplyToMsg(null);
            await refreshActiveChat(activeTel, { forceBottom: true });
        } catch (error) {
            alert(`Falló: ${error.message}`);
            await refreshActiveChat(activeTel).catch(() => { });
        }
    }

    function getReplyPreview(message) {
        if (!message) return "";
        const text = String(message.text || message.body || "").trim();
        if (text) return text.length > 90 ? `${text.slice(0, 90)}…` : text;
        return (Array.isArray(message.attachments) && message.attachments.length > 0) ? "Archivo adjunto" : "Mensaje seleccionado";
    }

    function getReplyAuthor(message) {
        if (!message) return "";
        if (message.mine) return (message.is_ai || message?.raw?.ia_provider || message?.raw?.ia_model) ? "IA" : "Asesor";
        return "Cliente";
    }

    async function enviarMensaje() {
        if (!activeTel) return;

        const text = draftMsg.replace(/\r\n/g, "\n").trim();
        const hasText = Boolean(text);
        const hasAttachments = attachments.length > 0;

        if (!hasText && !hasAttachments) return;

        const editId = editingMsgId;
        const currentAttachments = attachments;
        const replyMessageId = replyToMsg?.wa_message_id || replyToMsg?.id || "";

        // ── Edición de mensaje ─────────────────────────────────────────────
        if (editId) {
            if (!hasText) {
                alert("Para editar, escribe texto.");
                return;
            }

            setMensajes(prev =>
                prev.map(m =>
                    (m.wa_message_id || m.id) === editId
                        ? {
                            ...m,
                            text,
                            status: "sent",
                            edited: true,
                        }
                        : m
                )
            );

            resetComposer();

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

        // ── Mensaje nuevo ──────────────────────────────────────────────────
        const optimisticId = crypto.randomUUID();

        const optimisticAttachments = currentAttachments.map((a) => {
            const localUrl = a.file
                ? URL.createObjectURL(a.file)
                : (a.url || a.previewUrl || "");

            return {
                id: a.id,
                kind: a.kind,
                previewUrl: localUrl,
                url: localUrl,
                name: a.name,
                size: a.size,
                mime: a.mime || a.file?.type || "",
            };
        });

        shouldStickToBottomRef.current = true;

        setMensajes(prev => [
            ...prev,
            {
                id: optimisticId,
                local_pending: true,
                local_created_at: new Date().toISOString(),
                mine: true,
                text: hasText ? text : "Adjunto",
                time: "Ahora",
                status: "sent",
                reply_to_id: replyMessageId || "",
                attachments: optimisticAttachments,
            },
        ]);

        resetComposer();

        try {
            if (hasAttachments) {
                await api.digitalesEnviarMedia({
                    to: activeTel,
                    text: hasText ? text : "",
                    files: currentAttachments
                        .map(a => a.file)
                        .filter(Boolean),
                    reply_to_message_id: replyMessageId,
                });
            } else {
                await api.digitalesEnviarMensaje({
                    to: activeTel,
                    text,
                    reply_to_message_id: replyMessageId,
                });
            }

            await refreshActiveChat(activeTel, { forceBottom: true });
        } catch (error) {
            alert(`Falló: ${error.message}`);
            await refreshActiveChat(activeTel).catch(() => { });
        } finally {
            cleanupPreviews(optimisticAttachments);
        }
    }

    async function enviarPlantilla() {
        if (!activeTel || !tplSelected) return;
        const fields = Array.isArray(tplSelected.fields) ? tplSelected.fields : [];
        if (fields.some(f => !String(tplDraft[f.key] || "").trim())) { alert("Completa todos los campos de la plantilla."); return; }
        const idioma = tplSelected.idioma || tplSelected.language || "es_MX";
        const textoPreview = buildTemplatePreviewText(tplSelected, tplDraft);
        const components = buildDynamicTemplateComponents(tplSelected, tplDraft);
        shouldStickToBottomRef.current = true;
        setMensajes(prev => [...prev, { id: crypto.randomUUID(), local_pending: true, local_created_at: new Date().toISOString(), mine: true, text: textoPreview || `Plantilla: ${tplSelected.key}`, time: "Ahora", status: "sent" }]);
        try {
            await api.digitalesEnviarPlantilla({
                to: activeTel,
                template_name: tplSelected.key,
                idioma,
                components: components.length ? components : undefined,
                params: components.length ? undefined : [],
                preview_text: textoPreview || "",
            });
            setShowTemplatesDropdown(false); setTplSelected(null);
            await refreshActiveChat(activeTel, { forceBottom: true });
        } catch (error) { alert(`Falló plantilla: ${error.message}`); await refreshActiveChat(activeTel).catch(() => { }); }
    }

    function copyTel() {
        if (!activeTel) return;
        navigator.clipboard?.writeText(formateaTelUi(activeTel).replace(/\s/g, "").replace("+", "")).then(() => { setCopiedTel(true); setTimeout(() => setCopiedTel(false), 2000); }).catch(() => { });
    }

    async function llamarMarkUnread(tel52) {
        if (typeof api.digitalesMarkUnread === "function") return api.digitalesMarkUnread({ tel: tel52 });
        if (typeof api.post === "function") return api.post("/digitales/chats/mark-unread/", { tel: tel52 });
        throw new Error("Falta agregar api.digitalesMarkUnread en src/lib/apiPruebas.js");
    }

    async function marcarChatComoNoLeido(tel52 = activeTel) {
        const target = normalizaTelefonoMx(tel52);
        if (!target || markingUnreadTel) return;
        setChatMenu(null); setMarkingUnreadTel(target);
        try {
            await llamarMarkUnread(target);
            setChats(prev => prev.map(c => c.telefono === target ? { ...c, unread: Math.max(Number(c.unread || 0), 1) } : c));
            mensajesCacheRef.current.delete(target);
            if (!isDirectChatMode) await refreshChats().catch(() => { });
        } catch (error) { alert(`No se pudo marcar como no leído: ${error.message}`); }
        finally { setMarkingUnreadTel(""); }
    }

    function abrirMenuChat(e, chat) {
        e.preventDefault(); e.stopPropagation();
        if (!chat?.telefono) return;
        setChatMenu({ x: e.clientX, y: e.clientY, tel: chat.telefono, nombre: chat.nombre || "Prospecto" });
    }

    async function saveQuickEdit() {
        if (!prospecto?.id || !activeTel) return;
        setSavingQuickEdit(true);
        try {
            const payload = {
                nombre: quickEditDraft.nombre || "", auto_interes: quickEditDraft.auto_interes || "", estado: quickEditDraft.estado || "",
                canal_contacto: quickEditDraft.canal_contacto || "", comentarios: quickEditDraft.comentarios || "",
                enganche_monto: quickEditDraft.enganche_monto ? Number(String(quickEditDraft.enganche_monto).replace(/\D/g, "")) || null : null,
                presupuesto_mensual: quickEditDraft.presupuesto_mensual ? Number(String(quickEditDraft.presupuesto_mensual).replace(/\D/g, "")) || null : null,
                buro_estado: quickEditDraft.buro_estado || "", forma_pago: quickEditDraft.forma_pago || "", tipo_cliente: quickEditDraft.tipo_cliente || "",
                uso_vehiculo: quickEditDraft.uso_vehiculo || "", plazo_compra: quickEditDraft.plazo_compra || "", comprobacion_ingresos: quickEditDraft.comprobacion_ingresos || "",
                pauta: String(quickEditDraft.pauta || "").trim(),
            };
            await api.digitalesPatchProspecto(prospecto.id, payload);
            await refreshActiveChat(activeTel);
        } catch (error) { alert(`No se pudo guardar: ${error.message}`); }
        finally { setSavingQuickEdit(false); }
    }

    async function saveHeaderEstado(nuevoEstado) {
        if (!prospecto?.id || !activeTel) return;
        setHeaderEstado(nuevoEstado);
        setQuickEditDraft(p => ({ ...p, estado: nuevoEstado }));
        try { await api.digitalesPatchProspecto(prospecto.id, { estado: nuevoEstado }); await refreshActiveChat(activeTel).catch(() => { }); }
        catch (error) { console.error("Error guardando estado:", error); }
    }

    async function cargarPautasMetaContacto() {
        setLoadingPautas(true);

        try {
            if (typeof api.digitalesCampanasMeta !== "function") {
                setPautasOptions([]);
                return;
            }

            const response = await api.digitalesCampanasMeta(180);
            setPautasOptions(normalizarPautasMetaOptions(response));
        } catch (error) {
            console.error("Error cargando campañas de campanas_meta_volvo:", error);
            setPautasOptions([]);
        } finally {
            setLoadingPautas(false);
        }
    }

    async function saveHeaderPauta(nuevaPauta) {
        if (!activeTel) return;

        const pauta = String(nuevaPauta || "").trim();
        const pautaAnterior = pautaActual;

        setQuickEditDraft((prev) => ({
            ...prev,
            pauta,
        }));

        if (!prospecto?.id) return;

        setSavingHeaderPauta(true);

        try {
            await api.digitalesPatchProspecto(prospecto.id, { pauta });
            await refreshActiveChat(activeTel).catch(() => { });

            if (!isDirectChatMode) {
                await refreshChats().catch(() => { });
            }
        } catch (error) {
            console.error("Error guardando pauta:", error);

            setQuickEditDraft((prev) => ({
                ...prev,
                pauta: pautaAnterior,
            }));

            alert(error?.message || "No se pudo guardar la pauta.");
        } finally {
            setSavingHeaderPauta(false);
        }
    }

    // ── Effects ───────────────────────────────────────────────────────────────

    useEffect(() => {
        cargarPlantillas().catch(() => { });
    }, []);

    useEffect(() => {
        cargarPautasMetaContacto().catch(() => { });
    }, []);

    useEffect(() => { try { localStorage.setItem(QUICK_BUBBLES_KEY, JSON.stringify(quickBubbles)); } catch { } }, [quickBubbles]);
    useEffect(() => { activeTelRef.current = activeTel; }, [activeTel]);

    useEffect(() => {
        if (!prospecto) return;
        setHeaderEstado(prospecto.estado || "");
        setQuickEditDraft({
            nombre: prospecto.nombre || "",
            auto_interes: prospecto.auto_interes || "",
            estado: prospecto.estado || "",
            canal_contacto: prospecto.canal_contacto || "",
            pauta: prospecto.pauta || prospecto.pauta_origen || "",
            comentarios: prospecto.comentarios || prospecto.comentario || "",
            enganche_monto: prospecto.enganche_monto || "",
            presupuesto_mensual: prospecto.presupuesto_mensual || "",
            buro_estado: prospecto.buro_estado || "",
            forma_pago: prospecto.forma_pago || "",
            tipo_cliente: prospecto.tipo_cliente || "",
            uso_vehiculo: prospecto.uso_vehiculo || "",
            plazo_compra: prospecto.plazo_compra || "",
            comprobacion_ingresos: prospecto.comprobacion_ingresos || "",
        });
    }, [prospecto]);

    useEffect(() => {
        mensajesRef.current = mensajes;
        if (activeTel && mensajes.length) guardarChatEnCache(activeTel, { prospecto, ia_estado: iaEstado, mensajes, paginacion: { has_more: chatHasMore, oldest_id: oldestMessageId } });
    }, [mensajes, activeTel, prospecto, iaEstado, chatHasMore, oldestMessageId]);

    useEffect(() => { if (!shouldStickToBottomRef.current) return; endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensajes.length, activeTel]);
    useEffect(() => () => cleanupPreviews(attachments), []);

    // Cerrar emoji al click fuera
    useEffect(() => {
        const onDoc = (e) => { if (!openEmoji) return; if (emojiRef.current && !emojiRef.current.contains(e.target)) setOpenEmoji(false); };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [openEmoji]);

    // Cerrar dropdowns al click fuera
    useEffect(() => {
        if (!showQuickBubblesDropdown) return;
        const onDoc = (e) => { if (quickBubblesDropdownRef.current && !quickBubblesDropdownRef.current.contains(e.target)) setShowQuickBubblesDropdown(false); };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [showQuickBubblesDropdown]);

    useEffect(() => {
        if (!showTemplatesDropdown) return;
        const onDoc = (e) => { if (templatesDropdownRef.current && !templatesDropdownRef.current.contains(e.target)) { setShowTemplatesDropdown(false); setTplSelected(null); } };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [showTemplatesDropdown]);

    useEffect(() => {
        if (!chatMenu) return;
        const cerrar = () => setChatMenu(null);
        document.addEventListener("mousedown", cerrar);
        window.addEventListener("scroll", cerrar, true);
        window.addEventListener("resize", cerrar);
        return () => { document.removeEventListener("mousedown", cerrar); window.removeEventListener("scroll", cerrar, true); window.removeEventListener("resize", cerrar); };
    }, [chatMenu]);

    useEffect(() => {
        const onNuevoMensaje = async (e) => {
            const data = e.detail || {};
            const telefonoMensaje = normalizaTelefonoMx(data.telefono || "");
            if (!telefonoMensaje) return;
            if (telefonoMensaje === activeTelRef.current) { await refreshActiveChat(telefonoMensaje, { forceBottom: true }).catch(() => { }); return; }
            if (!isDirectChatMode) await refreshChats().catch(() => { });
        };
        window.addEventListener("whatsapp:nuevo-mensaje", onNuevoMensaje);
        return () => window.removeEventListener("whatsapp:nuevo-mensaje", onNuevoMensaje);
    }, [isDirectChatMode]);

    useEffect(() => {
        let ignore = false;
        if (isDirectChatMode) { setChats([]); setLoadingList(false); return () => { ignore = true; }; }
        (async () => {
            try { setLoadingList(true); await refreshChats(); }
            catch { if (!ignore) setChats([]); }
            finally { if (!ignore) setLoadingList(false); }
        })();
        return () => { ignore = true; };
    }, [isDirectChatMode]);

    useEffect(() => {
        if (tel && !didInitFromQuery.current) {
            didInitFromQuery.current = true; setActiveTel(tel); setMobileView("chat");
            const last = localStorage.getItem("last_active_chat");
            if (last && last !== tel) localStorage.setItem("last_active_chat", tel);
            return;
        }
        if (!tel && !activeTel && chats.length) {
            const last = localStorage.getItem("last_active_chat");
            if (last && chats.some(c => c.telefono === last)) setActiveTel(last);
            else setActiveTel(chats[0].telefono);
        }
    }, [tel, chats, activeTel]);

    useEffect(() => {
        if (!activeTel) { setProspecto(null); setMensajes([]); setChatHasMore(false); setOldestMessageId(null); return; }
        cargarChatInicial(activeTel);
    }, [activeTel, isDirectChatMode]);

    useEffect(() => {
        let ignore = false;
        if (isDirectChatMode) return;
        (async () => {
            try { const data = await api.digitalesListProspectos(); if (ignore) return; setProspectosIndex(Array.isArray(data) ? data : []); }
            catch (error) { console.error("Error cargando índice de prospectos:", error); if (!ignore) setProspectosIndex([]); }
        })();
        return () => { ignore = true; };
    }, [isDirectChatMode]);

    useEffect(() => {
        let alive = true, timer = null, tickCount = 0;
        const tick = async () => {
            try {
                const target = activeTelRef.current;
                if (!target) { timer = setTimeout(tick, 3500); return; }
                const prev = mensajesRef.current || [], last = prev[prev.length - 1];
                const lastId = last?.id || last?.wa_message_id || "", lastCreatedAt = last?.created_at || "";
                if (!lastId && !lastCreatedAt) { timer = setTimeout(tick, 3500); return; }
                const data = await api.digitalesContactoUpdates(target, lastCreatedAt, { limit: CHAT_UPDATES_LIMIT, after_id: lastId, mark_read: 1 });
                if (!alive) return;
                const incoming = (Array.isArray(data?.mensajes) ? data.mensajes : []).map(normalizeMessage);
                if (incoming.length) {
                    shouldStickToBottomRef.current = isNearBottom(messagesScrollRef.current);
                    setMensajes(old => mergeMessages(old, incoming));
                    if (!isDirectChatMode) await refreshChats().catch(() => { });
                } else {
                    tickCount += 1;
                    if (!isDirectChatMode && tickCount % 5 === 0) await refreshChats().catch(() => { });
                }
            } catch { }
            timer = setTimeout(tick, 3500);
        };
        tick();
        return () => { alive = false; if (timer) clearTimeout(timer); };
    }, [isDirectChatMode]);

    const llamarProspecto = () => {
        if (!activeTel) { alert("Selecciona un chat primero"); return; }
        window.open(`https://wa.me/${activeTel}`, "_blank");
    };

    // ── RENDER ────────────────────────────────────────────────────────────────

    return (
        <div className="w-full min-w-0">
            <div className="relative overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">

                <div className={cls(
                    "grid min-h-0 h-[calc(100dvh-64px)] overflow-hidden transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    isDirectChatMode ? "grid-cols-1" : chatSidebarCollapsed ? "grid-cols-1 lg:grid-cols-[58px_minmax(0,1fr)]" : "grid-cols-1 lg:grid-cols-[310px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]"
                )}>

                    {/* ── SIDEBAR DE CHATS ──────────────────────────────────── */}
                    <aside className={cls(
                        "min-h-0 border-r border-black/10 bg-neutral-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        isDirectChatMode ? "hidden" : mobileView === "chat" ? "hidden lg:flex lg:flex-col" : "flex flex-col lg:flex lg:flex-col",
                    )}>
                        {chatSidebarCollapsed ? (
                            <div className="hidden h-full flex-col items-center gap-3 bg-white py-3 lg:flex">
                                <button onClick={() => setChatSidebarCollapsed(false)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-[#000000] shadow-sm transition hover:scale-105 hover:bg-neutral-50"
                                    title="Expandir chats" type="button">
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                                <div className="h-px w-8 bg-black/10" />
                                <div className="rotate-90 whitespace-nowrap text-[11px] font-extrabold uppercase tracking-wider text-[#000000]/60">Chats</div>
                            </div>
                        ) : (
                            <>
                                {/* Barra superior del sidebar */}
                                <div className="border-b border-black/10 bg-white px-3 pt-3 pb-2 shrink-0">
                                    <div className="mb-2.5 flex items-center justify-between gap-2">
                                        <button onClick={() => navigate("/crm_volvo/comercial/prospectos")}
                                            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-extrabold text-[#000000] hover:bg-neutral-100 transition"
                                            title="Volver" type="button">
                                            <ArrowLeft className="h-4 w-4" />Volver
                                        </button>
                                        <button onClick={() => setChatSidebarCollapsed(true)}
                                            className="hidden h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-white text-[#000000] transition hover:bg-neutral-50 lg:inline-flex"
                                            title="Contraer" type="button">
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {/* Búsqueda */}
                                    <div className="flex items-center gap-2 rounded-2xl bg-neutral-100 px-3 py-2">
                                        <Search className="h-4 w-4 shrink-0 text-slate-400" />
                                        <input value={q} onChange={(e) => setQ(e.target.value)}
                                            placeholder="Buscar prospecto…"
                                            className="w-full bg-transparent text-sm font-semibold text-[#000000] outline-none placeholder:text-slate-400" />
                                        {q ? (<button type="button" onClick={() => setQ("")} className="shrink-0 text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>) : null}
                                    </div>

                                    {/* Filtros con scroll horizontal */}
                                    <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                                        {CHAT_FILTERS.map((f) => (
                                            <button key={f.key} onClick={() => setChatFilter(f.key)}
                                                className={cls(
                                                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-extrabold transition whitespace-nowrap",
                                                    chatFilter === f.key ? "bg-[#000000] text-white" : "text-slate-500 hover:bg-neutral-200"
                                                )}
                                                type="button">
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Lista de chats estilo WhatsApp */}
                                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                                    {loadingList ? <ChatListSkeleton rows={9} /> : filteredChats.length ? (
                                        filteredChats.map((chat) => {
                                            const isActive = chat.telefono === activeTel;
                                            return (
                                                <button key={chat.id}
                                                    onMouseEnter={() => prefetchChat(chat.telefono)}
                                                    onFocus={() => prefetchChat(chat.telefono)}
                                                    onClick={() => openChatByTel(chat.telefono)}
                                                    onContextMenu={(e) => abrirMenuChat(e, chat)}
                                                    className={cls(
                                                        "w-full border-b border-black/5 px-4 py-3 text-left transition",
                                                        isActive ? "bg-white" : "bg-neutral-50 hover:bg-white",
                                                    )}
                                                    type="button">
                                                    <div className="flex items-center gap-3">
                                                        {/* Avatar con dot de estado */}
                                                        <div className="relative shrink-0">
                                                            <Avatar name={chat.nombre} />
                                                            <span
                                                                className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white"
                                                                style={{ backgroundColor: getStatusDotColor(chat.estado) }}
                                                                title={chat.estado || "Sin respuesta"}
                                                            />
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            {/* Fila 1: nombre + hora */}
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="truncate text-sm font-extrabold text-[#000000] leading-tight">{chat.nombre}</div>
                                                                <div className="shrink-0 text-[11px] font-semibold text-slate-400 leading-tight">{chat.last?.time || ""}</div>
                                                            </div>

                                                            {/* Fila 2: último mensaje + badge unread */}
                                                            <div className="mt-0.5 flex items-center justify-between gap-2">
                                                                <div className="truncate text-xs font-medium text-slate-500">{chat.last?.text || formateaTelUi(chat.telefono)}</div>
                                                                {chat.unread > 0 ? (
                                                                    <span className="ml-1 shrink-0 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-extrabold text-white">
                                                                        {chat.unread}
                                                                    </span>
                                                                ) : null}
                                                            </div>

                                                            {/* Fila 3: badges */}
                                                            <div className="mt-1.5 flex flex-wrap items-center gap-1">
                                                                <span className={cls(
                                                                    "inline-flex items-center rounded-full border border-black/10 bg-white px-2 py-0.5 text-[10px] font-bold leading-tight",
                                                                    chat.estado ? "text-slate-600" : "text-slate-400",
                                                                )}>
                                                                    {chat.estado || "Sin estado"}
                                                                </span>

                                                                {(chat.ia_estado || chat.ia_pausada || chat.ia_bloqueos?.length) ? (
                                                                    <span className={cls(
                                                                        "inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[10px] font-extrabold leading-tight",
                                                                        chat.ia_estado?.puede_responder ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800",
                                                                    )}
                                                                        title={(chat.ia_bloqueos || chat.ia_estado?.bloqueos || []).map(labelBloqueoIa).join(" · ")}>
                                                                        <Zap className="h-2.5 w-2.5" />
                                                                        {chat.ia_estado?.puede_responder ? "IA lista" : "IA bloqueada"}
                                                                    </span>
                                                                ) : null}

                                                                {chat.agencia ? (
                                                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-400">
                                                                        <Building2 className="h-2.5 w-2.5" />{chat.agencia}
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <div className="p-8 text-center text-sm font-extrabold text-[#000000]">Sin historial aún</div>
                                    )}
                                </div>
                            </>
                        )}
                    </aside>

                    {/* ── SECCIÓN PRINCIPAL DEL CHAT ────────────────────────── */}
                    <section className={cls(
                        "relative flex min-h-0 flex-col bg-white transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        isDirectChatMode ? "flex" : mobileView === "list" ? "hidden lg:flex" : "flex",
                    )}>

                        {/* ── HEADER COMPACTO ─────────────────────────────────── */}
                        <div className="shrink-0 border-b border-black/10 bg-white px-3 py-2 sm:px-4">
                            <div className="flex items-center gap-2">
                                {/* Botón volver mobile */}
                                {!isDirectChatMode ? (
                                    <button onClick={() => setMobileView("list")}
                                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white text-[#000000] hover:bg-neutral-50 lg:hidden"
                                        type="button" title="Ver chats">
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                ) : null}

                                <Avatar name={activeChat?.nombre || "Prospecto"} />

                                {/* Centro: nombre + teléfono + estado + pauta en una sola fila, fechas debajo */}
                                <div className="min-w-0 flex-1">
                                    {/* Fila 1: nombre + teléfono + estado + pauta (todo en línea, overflow hidden) */}
                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                        <span className="shrink-0 text-sm font-extrabold text-[#000000] truncate max-w-[120px] sm:max-w-[180px]">
                                            {activeChat?.nombre || "Selecciona un chat"}
                                        </span>
                                        <button type="button" onClick={copyTel}
                                            className="shrink-0 inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[11px] font-semibold text-slate-400 hover:bg-neutral-100 transition"
                                            title="Copiar número">
                                            {copiedTel ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                            <span className={copiedTel ? "text-emerald-500 font-bold" : ""}>{activeTel ? formateaTelUi(activeTel) : "—"}</span>
                                        </button>
                                        {/* Estado prospecto */}
                                        {activeTel ? (
                                            <select value={headerEstado} onChange={(e) => saveHeaderEstado(e.target.value)}
                                                className="shrink-0 h-6 rounded-md border border-black/10 bg-white px-1.5 text-[11px] font-semibold text-[#000000] outline-none focus:border-[#000000]/40"
                                                title="Estado del prospecto">
                                                {renderOptionsConValorActual(ESTADOS_HEADER, headerEstado, "Sin estado")}
                                            </select>
                                        ) : null}
                                        {activeTel ? (
                                            <select
                                                value={pautaActual}
                                                onChange={(e) => saveHeaderPauta(e.target.value)}
                                                disabled={loadingPautas || savingHeaderPauta || !prospecto?.id}
                                                className={cls(
                                                    "shrink-0 h-6 max-w-[280px] rounded-md border px-1.5 text-[11px] font-extrabold outline-none transition",
                                                    pautaActual
                                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                        : "border-amber-200 bg-amber-50 text-amber-700",
                                                    loadingPautas || savingHeaderPauta || !prospecto?.id
                                                        ? "cursor-not-allowed opacity-70"
                                                        : "cursor-pointer hover:opacity-90"
                                                )}
                                                title={pautaActual || "Sin campaña detectada"}
                                            >
                                                {loadingPautas ? (
                                                    <option value={pautaActual}>{pautaActual || "Cargando campañas..."}</option>
                                                ) : (
                                                    renderPautasMetaOptions(pautasOptions, pautaActual, "Sin campaña detectada")
                                                )}
                                            </select>
                                        ) : null}
                                    </div>

                                    {/* Fila 2: fechas */}
                                    {activeTel && !isDirectChatMode ? (
                                        <div className="mt-0.5 text-[10px] font-semibold text-slate-400 truncate">
                                            Reg: {fmtDT(prospecto?.creado)} · 1er: {fmtDT(prospecto?.primer_contacto_at)} · Últ: {fmtDT(prospecto?.ultimo_contacto_at)}
                                        </div>
                                    ) : null}
                                </div>

                                {/* Derecha: botones de acción — siempre en la misma fila */}
                                <div className="flex shrink-0 items-center gap-1">
                                    {/* Marcar no leído */}
                                    {!isDirectChatMode ? (
                                        <button type="button" onClick={() => marcarChatComoNoLeido(activeTel)}
                                            disabled={!activeTel || markingUnreadTel === activeTel}
                                            className="inline-flex h-7 items-center gap-1 rounded-lg border border-black/10 bg-white px-2 text-[11px] font-semibold text-slate-500 hover:bg-neutral-50 disabled:opacity-50 transition"
                                            title="Marcar como no leído">
                                            <MailOpen className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">{markingUnreadTel === activeTel ? "..." : "No leído"}</span>
                                        </button>
                                    ) : null}

                                    {/* Pausar / Reactivar IA */}
                                    {puedeGestionarIa ? (
                                        iaEstado?.puede_responder ? (
                                            <button type="button" onClick={pausarIaActiva} disabled={loadingIaAction}
                                                className="inline-flex h-7 items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 text-[11px] font-extrabold text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition"
                                                title="Pausar IA">
                                                <ZapOff className="h-3.5 w-3.5" />
                                                <span className="hidden sm:inline">Pausar IA</span>
                                            </button>
                                        ) : (
                                            <button type="button" onClick={reactivarIaActiva} disabled={loadingIaAction}
                                                className="inline-flex h-7 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 text-[11px] font-extrabold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition"
                                                title="Reactivar IA">
                                                <Zap className="h-3.5 w-3.5" />
                                                <span className="hidden sm:inline">Reactivar IA</span>
                                            </button>
                                        )
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        {/* ── BANNER DATOS DEL PROSPECTO (desplegable) ─────────── */}
                        {activeTel ? (
                            <details className="group shrink-0 border-b border-[#000000]/10 bg-[#000000]/[0.03]">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-2">
                                    <div className="flex min-w-0 flex-1 items-center gap-2">
                                        <Pencil className="h-3.5 w-3.5 shrink-0 text-[#000000]/60" />
                                        <span className="text-xs font-extrabold text-[#000000]">Datos del prospecto</span>
                                        <span className="hidden truncate text-[11px] font-semibold text-[#000000]/60 sm:inline">
                                            — {[quickEditDraft.auto_interes || prospecto?.auto_interes, quickEditDraft.estado || prospecto?.estado].filter(Boolean).join(" · ") || "Sin datos aún"}
                                        </span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 shrink-0 text-[#000000]/40 transition-transform duration-200 group-open:rotate-180" />
                                </summary>

                                <div className="border-t border-[#000000]/10 px-4 py-4">
                                    <div className="mx-auto max-w-5xl">
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                            <div>
                                                <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-[#000000]/60">Vehículo</div>
                                                <select value={quickEditDraft.auto_interes || ""} onChange={(e) => setQuickEditDraft(p => ({ ...p, auto_interes: e.target.value }))} className="h-9 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-[#000000] outline-none focus:border-[#000000]/40 focus:ring-1 focus:ring-[#000000]/20">{renderOptionsConValorActual(VEHICULOS, quickEditDraft.auto_interes)}</select>
                                            </div>
                                            <div>
                                                <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-[#000000]/60">Estado</div>
                                                <select value={quickEditDraft.estado || ""} onChange={(e) => setQuickEditDraft(p => ({ ...p, estado: e.target.value }))} className="h-9 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-[#000000] outline-none focus:border-[#000000]/40 focus:ring-1 focus:ring-[#000000]/20">{renderOptionsConValorActual(ESTADOS_PROSPECTO, quickEditDraft.estado)}</select>
                                            </div>
                                            <div>
                                                <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-[#000000]/60">Canal</div>
                                                <select value={quickEditDraft.canal_contacto || ""} onChange={(e) => setQuickEditDraft(p => ({ ...p, canal_contacto: e.target.value }))} className="h-9 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-[#000000] outline-none focus:border-[#000000]/40 focus:ring-1 focus:ring-[#000000]/20">{renderOptionsConValorActual(CANALES, quickEditDraft.canal_contacto)}</select>
                                            </div>
                                            <div>
                                                <div className="mb-1 flex items-center justify-between gap-2">
                                                    <div className="text-[11px] font-extrabold uppercase tracking-wide text-[#000000]/60">Campaña Meta</div>
                                                    <button
                                                        type="button"
                                                        onClick={cargarPautasMetaContacto}
                                                        disabled={loadingPautas}
                                                        className="inline-flex h-5 items-center rounded-md border border-black/10 bg-white px-1.5 text-[10px] font-extrabold text-[#000000]/60 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                        title="Recargar campañas"
                                                    >
                                                        {loadingPautas ? "..." : "Recargar"}
                                                    </button>
                                                </div>

                                                <select
                                                    value={quickEditDraft.pauta || pautaActual}
                                                    onChange={(e) =>
                                                        setQuickEditDraft((prev) => ({
                                                            ...prev,
                                                            pauta: e.target.value,
                                                        }))
                                                    }
                                                    disabled={loadingPautas}
                                                    className={cls(
                                                        "h-9 w-full rounded-lg border px-3 text-xs font-extrabold outline-none focus:border-[#000000]/40 focus:ring-1 focus:ring-[#000000]/20",
                                                        quickEditDraft.pauta || pautaActual
                                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                            : "border-amber-200 bg-amber-50 text-amber-700",
                                                        loadingPautas ? "cursor-not-allowed opacity-70" : ""
                                                    )}
                                                    title={quickEditDraft.pauta || pautaActual || "Sin campaña detectada"}
                                                >
                                                    {loadingPautas ? (
                                                        <option value={quickEditDraft.pauta || pautaActual}>
                                                            {(quickEditDraft.pauta || pautaActual) || "Cargando campañas..."}
                                                        </option>
                                                    ) : (
                                                        renderPautasMetaOptions(
                                                            pautasOptions,
                                                            quickEditDraft.pauta || pautaActual,
                                                            "Sin campaña detectada"
                                                        )
                                                    )}
                                                </select>

                                                {campanaMetaProspecto.id_campana ? (
                                                    <div className="mt-1 truncate text-[10px] font-semibold text-[#000000]/40">
                                                        Detectada por Meta · ID: {campanaMetaProspecto.id_campana}
                                                    </div>
                                                ) : (
                                                    <div className="mt-1 truncate text-[10px] font-semibold text-[#000000]/40">
                                                        Puedes corregirla manualmente si la atribución vino equivocada.
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-[#000000]/60">Comentarios</div>
                                                <textarea value={quickEditDraft.comentarios || ""} onChange={(e) => setQuickEditDraft(p => ({ ...p, comentarios: e.target.value }))} rows={2} className="w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#000000] outline-none focus:border-[#000000]/40 focus:ring-1 focus:ring-[#000000]/20" />
                                            </div>
                                        </div>

                                        <div className="mt-4 rounded-xl border border-[#000000]/10 bg-white p-4">
                                            <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-[#000000]/60">
                                                <Activity className="h-3.5 w-3.5" />Perfil comercial y financiero
                                            </div>
                                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                                <div><div className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-[#000000]/60">Enganche</div><input type="number" min="0" inputMode="numeric" value={quickEditDraft.enganche_monto || ""} onChange={(e) => setQuickEditDraft(p => ({ ...p, enganche_monto: e.target.value.replace(/\D/g, "") }))} placeholder="Ej. 80000" className="h-9 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-[#000000] outline-none focus:border-[#000000]/40 focus:ring-1 focus:ring-[#000000]/20" /></div>
                                                <div><div className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-[#000000]/60">Presupuesto mensual</div><input type="number" min="0" inputMode="numeric" value={quickEditDraft.presupuesto_mensual || ""} onChange={(e) => setQuickEditDraft(p => ({ ...p, presupuesto_mensual: e.target.value.replace(/\D/g, "") }))} placeholder="Ej. 9000" className="h-9 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-[#000000] outline-none focus:border-[#000000]/40 focus:ring-1 focus:ring-[#000000]/20" /></div>
                                                <div><div className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-[#000000]/60">Buró</div><select value={quickEditDraft.buro_estado || ""} onChange={(e) => setQuickEditDraft(p => ({ ...p, buro_estado: e.target.value }))} className="h-9 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-[#000000] outline-none focus:border-[#000000]/40 focus:ring-1 focus:ring-[#000000]/20">{BURO_OPTIONS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}</select></div>
                                                <div><div className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-[#000000]/60">Forma de pago</div><select value={quickEditDraft.forma_pago || ""} onChange={(e) => setQuickEditDraft(p => ({ ...p, forma_pago: e.target.value }))} className="h-9 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-[#000000] outline-none focus:border-[#000000]/40 focus:ring-1 focus:ring-[#000000]/20">{FORMA_PAGO_OPTIONS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}</select></div>
                                                <div><div className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-[#000000]/60">Tipo cliente</div><select value={quickEditDraft.tipo_cliente || ""} onChange={(e) => setQuickEditDraft(p => ({ ...p, tipo_cliente: e.target.value }))} className="h-9 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-[#000000] outline-none focus:border-[#000000]/40 focus:ring-1 focus:ring-[#000000]/20">{TIPO_CLIENTE_OPTIONS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}</select></div>
                                                <div><div className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-[#000000]/60">Plazo de compra</div><select value={quickEditDraft.plazo_compra || ""} onChange={(e) => setQuickEditDraft(p => ({ ...p, plazo_compra: e.target.value }))} className="h-9 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-[#000000] outline-none focus:border-[#000000]/40 focus:ring-1 focus:ring-[#000000]/20">{PLAZO_COMPRA_OPTIONS.map(i => <option key={i || "empty"} value={i}>{i || "— Selecciona —"}</option>)}</select></div>
                                                <div><div className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-[#000000]/60">Uso del vehículo</div><input value={quickEditDraft.uso_vehiculo || ""} onChange={(e) => setQuickEditDraft(p => ({ ...p, uso_vehiculo: e.target.value }))} placeholder="Personal, familiar…" className="h-9 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-[#000000] outline-none focus:border-[#000000]/40 focus:ring-1 focus:ring-[#000000]/20" /></div>
                                                <div><div className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-[#000000]/60">Comprobación ingresos</div><input value={quickEditDraft.comprobacion_ingresos || ""} onChange={(e) => setQuickEditDraft(p => ({ ...p, comprobacion_ingresos: e.target.value }))} placeholder="Nómina, estados…" className="h-9 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-[#000000] outline-none focus:border-[#000000]/40 focus:ring-1 focus:ring-[#000000]/20" /></div>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex justify-end">
                                            <button onClick={saveQuickEdit} disabled={savingQuickEdit || !prospecto?.id}
                                                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                                style={{ backgroundColor: BRAND_BLUE }} type="button">
                                                <Save className="h-4 w-4" />
                                                {savingQuickEdit ? "Guardando..." : "Guardar cambios"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </details>
                        ) : null}

                        {/* ── ÁREA DE MENSAJES ──────────────────────────────────── */}
                        <div
                            ref={messagesScrollRef}
                            onScroll={onMessagesScroll}
                            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 lg:px-8"
                            style={{
                                backgroundImage: `
                                linear-gradient(rgba(255,255,255,0.84), rgba(255,255,255,0.7)),
                                url('/crm_volvo/chat/fondo_chat.png')
                                `,
                                backgroundRepeat: "repeat",
                                backgroundPosition: "center top",
                                backgroundSize: "520px auto",
                            }}
                        >
                            <div className="mx-auto w-full max-w-5xl space-y-3">
                                {activeTel && !loadingChat ? (
                                    <div className="mb-3 flex justify-center">
                                        {loadingOlder ? (
                                            <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-extrabold text-slate-500 shadow-sm">Cargando mensajes anteriores...</div>
                                        ) : chatHasMore ? (
                                            <button onClick={cargarMensajesAnteriores}
                                                className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-extrabold text-[#000000] shadow-sm hover:bg-neutral-50"
                                                type="button">Cargar mensajes anteriores</button>
                                        ) : mensajes.length > 0 ? (
                                            <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-bold text-slate-400 shadow-sm">Inicio de la conversación</div>
                                        ) : null}
                                    </div>
                                ) : null}

                                {!activeTel ? (
                                    <div className="py-10 text-center font-semibold text-slate-500">Selecciona un chat del historial para ver la conversación.</div>
                                ) : loadingChat ? (
                                    <MessagesSkeleton bubbles={10} />
                                ) : mensajes.length === 0 ? (
                                    <div className="py-10 text-center font-semibold text-slate-500">Aún no hay mensajes con este número.</div>
                                ) : (
                                    // Agrupar mensajes por fecha y mostrar separadores
                                    groupMessagesByDate(applyReactionEvents(mensajes)).map((group, groupIndex) => (
                                        <div key={`group-${groupIndex}-${group.date}`} className="relative">
                                            <DateSeparator date={group.date} />
                                            {group.messages.map((message) => {
                                                const messageId = message.wa_message_id || "";
                                                const domId = `msg-${getMessageKey(message)}`;
                                                const quoted = message.reply_to_id ? messagesById.get(String(message.reply_to_id)) : null;
                                                // Usar formato de hora corta para la burbuja
                                                const timeDisplay = formatMessageTime(message.created_at || message.local_created_at);
                                                return (
                                                    <MessageBubble
                                                        key={getMessageKey(message)}
                                                        domId={domId}
                                                        highlighted={highlightedMsgId === domId}
                                                        mine={Boolean(message.mine)}
                                                        text={message.text}
                                                        time={timeDisplay}
                                                        status={message.status || "sent"}
                                                        localPending={Boolean(message.local_pending)}
                                                        attachments={message.attachments || []}
                                                        reactions={message.reactions || []}
                                                        isAi={Boolean(message.is_ai)}
                                                        renderText={renderTextForBubble}
                                                        replyPreview={quoted ? {
                                                            author: getReplyAuthor(quoted),
                                                            text: getReplyPreview(quoted),
                                                            onClick: () => scrollToMessage(`msg-${getMessageKey(quoted)}`)
                                                        } : null}
                                                        onReply={messageId && !message.local_pending ? () => {
                                                            setReplyToMsg(message);
                                                            requestAnimationFrame(() => inputRef.current?.focus?.());
                                                        } : null}
                                                    />
                                                );
                                            })}
                                        </div>
                                    ))
                                )}
                                <div ref={endRef} />
                            </div>
                        </div>

                        {/* ── REPLY PREVIEW ─────────────────────────────────────── */}
                        {replyToMsg ? (
                            <div className="shrink-0 border-t border-black/10 bg-[#000000]/5 px-4 py-2">
                                <div className="mx-auto flex max-w-5xl items-center gap-3 rounded-xl border border-[#000000]/15 bg-white px-3 py-2 shadow-sm">
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[11px] font-extrabold uppercase tracking-wide text-[#000000]/60">Respondiendo a {getReplyAuthor(replyToMsg)}</div>
                                        <div className="truncate text-xs font-semibold text-[#000000]">{getReplyPreview(replyToMsg)}</div>
                                    </div>
                                    <button type="button" onClick={() => setReplyToMsg(null)}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-white text-slate-500 hover:bg-neutral-50"
                                        title="Cancelar respuesta">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ) : null}

                        {/* ── COMPOSITOR ───────────────────────────────────────── */}
                        <div className={cls("shrink-0 border-t border-black/10 bg-white px-3 py-3", dragOver ? "relative" : "")}
                            onDragEnter={onDragEnterComposer} onDragOver={onDragOverComposer}
                            onDragLeave={onDragLeaveComposer} onDrop={onDropComposer}>
                            <div className="mx-auto w-full max-w-5xl">
                                {dragOver && activeTel ? (
                                    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
                                        <div className="rounded-2xl border border-dashed border-[#000000]/40 bg-white px-6 py-4 shadow-lg">
                                            <div className="flex items-center gap-3"><Paperclip className="h-5 w-5 text-[#000000]" /><div className="text-sm font-extrabold text-[#000000]">Suelta para adjuntar archivos</div></div>
                                            <div className="mt-1 text-xs font-semibold text-slate-500">Se adjuntarán al mensaje, máximo 10.</div>
                                        </div>
                                    </div>
                                ) : null}

                                {/* Previews adjuntos */}
                                {attachments.length ? (
                                    <div className="mb-2 flex flex-wrap gap-2">
                                        {attachments.map((a) => (
                                            <div key={a.id} className="flex items-center gap-2 rounded-xl border border-black/10 bg-neutral-50 px-3 py-2">
                                                {a.kind === "image" ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-10 w-10 overflow-hidden rounded-lg border border-black/10 bg-white"><img src={a.previewUrl} alt={a.name} className="h-full w-full object-cover" /></div>
                                                        <div className="min-w-0"><div className="max-w-[180px] truncate text-xs font-extrabold text-[#000000]">{a.name ? shortName(a.name) : "Imagen"}</div><div className="text-[11px] font-bold text-slate-500">{humanBytes(a.size)}</div></div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-[#000000]" />
                                                        <div className="min-w-0"><div className="max-w-[180px] truncate text-xs font-extrabold text-[#000000]">{a.name ? shortName(a.name) : "Archivo"}</div><div className="text-[11px] font-bold text-slate-500">{humanBytes(a.size)}</div></div>
                                                    </div>
                                                )}
                                                <button type="button" onClick={() => removeAttachment(a.id)} className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-white hover:bg-neutral-100" title="Quitar"><X className="h-4 w-4 text-[#000000]" /></button>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}

                                {/* Caja compositor */}
                                <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
                                    <div className="px-2 pt-2">
                                        <WhatsAppComposerInput value={draftMsg} onChange={setDraftMsg} onSend={enviarMensaje}
                                            disabled={!activeTel} placeholder={composerHint} inputRef={inputRef} onPaste={onPasteInComposer} />
                                    </div>

                                    {/* Barra de botones */}
                                    <div className="flex items-center gap-0.5 px-2 pb-2 pt-1">
                                        {/* Emoji */}
                                        <div className="relative" ref={emojiRef}>
                                            <button className={cls("inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-neutral-100 hover:text-[#000000] transition", !activeTel ? "cursor-not-allowed opacity-50" : "")}
                                                title="Emojis" type="button" disabled={!activeTel} onClick={() => setOpenEmoji(p => !p)}>
                                                <Smile className="h-4 w-4" />
                                            </button>
                                            {openEmoji ? (
                                                <div className="absolute bottom-10 left-0 z-50 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
                                                    <EmojiPicker onEmojiClick={onPickEmoji} searchDisabled={false} skinTonesDisabled={false} lazyLoadEmojis height={360} width={320} />
                                                </div>
                                            ) : null}
                                        </div>

                                        {/* Adjuntar */}
                                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => { addFilesAsAttachments(e.target.files); e.target.value = ""; }} />
                                        <button className={cls("inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-neutral-100 hover:text-[#000000] transition", !activeTel ? "cursor-not-allowed opacity-50" : "")}
                                            title="Adjuntar" type="button" disabled={!activeTel} onClick={() => fileInputRef.current?.click()}>
                                            <Paperclip className="h-4 w-4" />
                                        </button>

                                        {/* Plantillas — dropdown igual que mensajes rápidos */}
                                        <div className="relative" ref={templatesDropdownRef}>
                                            <button onClick={abrirPlantillasDropdown} disabled={!activeTel}
                                                className={cls(
                                                    "inline-flex h-8 items-center gap-1 rounded-xl px-2 text-xs font-extrabold text-slate-400 hover:bg-neutral-100 hover:text-[#000000] transition",
                                                    !activeTel ? "cursor-not-allowed opacity-50" : "",
                                                    showTemplatesDropdown ? "bg-neutral-100 text-[#000000]" : ""
                                                )}
                                                type="button" title="Plantillas">
                                                <LayoutTemplate className="h-4 w-4" />
                                                <span className="hidden sm:inline">Plantillas</span>
                                            </button>

                                            {showTemplatesDropdown ? (
                                                <div className="absolute bottom-12 left-0 z-50 w-96 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
                                                    <div className="flex items-center justify-between border-b border-black/5 px-4 py-2.5">
                                                        <div className="flex items-center gap-2">
                                                            {tplSelected ? (
                                                                <button type="button" onClick={() => setTplSelected(null)} className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-neutral-100 transition">
                                                                    <ChevronLeft className="h-3.5 w-3.5" />
                                                                </button>
                                                            ) : null}
                                                            <span className="text-xs font-extrabold text-[#000000]">
                                                                {tplSelected ? `Plantilla: ${tplSelected.title || tplSelected.key}` : "Plantillas"}
                                                            </span>
                                                        </div>
                                                        <button type="button" onClick={() => { setShowTemplatesDropdown(false); setTplSelected(null); }}
                                                            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-neutral-100 transition">
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>

                                                    <div className="max-h-80 overflow-y-auto">
                                                        {!tplSelected ? (
                                                            // Lista de plantillas
                                                            loadingTemplates ? (
                                                                <div className="px-4 py-6 text-center text-xs font-semibold text-slate-400">Cargando plantillas...</div>
                                                            ) : templatesError ? (
                                                                <div className="px-4 py-4 text-xs font-bold text-red-600">{templatesError}</div>
                                                            ) : templatesParaEnviar.length === 0 ? (
                                                                <div className="px-4 py-6 text-center text-xs font-semibold text-slate-400">No hay plantillas disponibles.</div>
                                                            ) : (
                                                                templatesParaEnviar.map((template) => (
                                                                    <button key={`${template.key}-${template.idioma || template.language || "x"}`} type="button" onClick={() => pickTemplate(template)}
                                                                        className="w-full border-b border-black/5 px-4 py-3 text-left last:border-0 hover:bg-neutral-50 transition">
                                                                        <div className="text-xs font-extrabold text-[#000000]">{template.title || template.key}</div>
                                                                        <div className="mt-0.5 text-[11px] font-semibold text-slate-400">{template.key} · {template.idioma || template.language || "es_MX"} · {template.category || "Sin categoría"}</div>
                                                                        {template.help ? <div className="mt-1 truncate text-[11px] text-slate-500">{template.help}</div> : null}
                                                                    </button>
                                                                ))
                                                            )
                                                        ) : (
                                                            // Detalle de plantilla seleccionada
                                                            <div className="p-4 space-y-3">
                                                                <div className="whitespace-pre-wrap rounded-xl border border-black/10 bg-neutral-50 p-3 text-xs font-semibold text-[#000000]">
                                                                    {templatePreview || tplSelected.help || "Sin texto visible."}
                                                                </div>
                                                                {(tplSelected.fields || []).map((field) => {
                                                                    const options = getFieldOptions(field);
                                                                    return (
                                                                        <div key={field.key}>
                                                                            <div className="mb-1 text-[11px] font-extrabold text-[#000000]">{field.label || field.key}</div>
                                                                            {options.length ? (
                                                                                <select value={tplDraft[field.key] || ""} onChange={(e) => setTplDraft(p => ({ ...p, [field.key]: e.target.value }))}
                                                                                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-[#000000] outline-none">
                                                                                    <option value="" disabled>Selecciona…</option>
                                                                                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                                                                                </select>
                                                                            ) : (
                                                                                <input value={tplDraft[field.key] || ""} onChange={(e) => setTplDraft(p => ({ ...p, [field.key]: e.target.value }))}
                                                                                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-[#000000] outline-none" />
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                                {!(tplSelected.fields || []).length ? (
                                                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">Esta plantilla no requiere parámetros.</div>
                                                                ) : null}
                                                                <button type="button" onClick={enviarPlantilla}
                                                                    className="w-full rounded-xl py-2.5 text-xs font-extrabold text-white transition hover:opacity-90"
                                                                    style={{ backgroundColor: BRAND_BLUE }}>
                                                                    Enviar plantilla
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>

                                        {/* Mensajes rápidos — dropdown */}
                                        <div className="relative" ref={quickBubblesDropdownRef}>
                                            <button type="button" disabled={!activeTel}
                                                onClick={() => { setShowQuickBubblesDropdown(p => !p); setShowTemplatesDropdown(false); }}
                                                className={cls(
                                                    "inline-flex h-8 items-center gap-1 rounded-xl px-2 text-xs font-extrabold text-slate-400 hover:bg-neutral-100 hover:text-[#000000] transition",
                                                    !activeTel ? "cursor-not-allowed opacity-50" : "",
                                                    showQuickBubblesDropdown ? "bg-neutral-100 text-[#000000]" : ""
                                                )}
                                                title="Respuesta rápida">
                                                <Zap className="h-4 w-4" />
                                                <span className="hidden sm:inline">Rápidos</span>
                                            </button>

                                            {showQuickBubblesDropdown ? (
                                                <div className="absolute bottom-12 left-0 z-50 w-72 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
                                                    <div className="flex items-center justify-between border-b border-black/5 px-4 py-2.5">
                                                        <span className="text-xs font-extrabold text-[#000000]">Mensajes rápidos</span>
                                                        <div className="flex items-center gap-1">
                                                            <button type="button" onClick={() => setShowAddBubble(p => !p)}
                                                                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#000000]/10 text-[#000000] hover:bg-[#000000] hover:text-white transition"
                                                                title="Nuevo mensaje rápido">
                                                                <Plus className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button type="button" onClick={() => setShowQuickBubblesDropdown(false)}
                                                                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-neutral-100 transition">
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {showAddBubble ? (
                                                        <div className="border-b border-black/5 bg-neutral-50 p-3">
                                                            <input value={newBubbleTitle} onChange={(e) => setNewBubbleTitle(e.target.value)} placeholder="Título (opcional)"
                                                                className="mb-2 w-full rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-[#000000] outline-none placeholder:text-slate-400" />
                                                            <textarea value={newBubbleText} onChange={(e) => setNewBubbleText(e.target.value)} placeholder="Escribe el mensaje…" rows={2}
                                                                className="mb-2 w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-[#000000] outline-none placeholder:text-slate-400" />
                                                            <div className="flex justify-end gap-2">
                                                                <button type="button" onClick={() => { setShowAddBubble(false); setNewBubbleText(""); setNewBubbleTitle(""); }}
                                                                    className="rounded-lg border border-black/10 bg-white px-3 py-1 text-xs font-bold text-slate-600 hover:bg-neutral-100">Cancelar</button>
                                                                <button type="button" onClick={addQuickBubble} disabled={!newBubbleText.trim()}
                                                                    className="rounded-lg px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
                                                                    style={{ backgroundColor: BRAND_BLUE }}>Guardar</button>
                                                            </div>
                                                        </div>
                                                    ) : null}

                                                    <div className="max-h-56 overflow-y-auto">
                                                        {quickBubbles.length === 0 ? (
                                                            <div className="px-4 py-5 text-center text-xs font-semibold text-slate-400">Sin mensajes rápidos aún.<br />Agrega uno con el botón +</div>
                                                        ) : (
                                                            quickBubbles.map((bubble) => (
                                                                <div key={bubble.id} className="group flex items-center gap-2 border-b border-black/5 px-4 py-2.5 last:border-0 hover:bg-neutral-50">
                                                                    <button type="button" onClick={() => sendQuickBubble(bubble.text)} className="min-w-0 flex-1 text-left" title={bubble.text}>
                                                                        <div className="truncate text-xs font-extrabold text-[#000000]">{bubble.title}</div>
                                                                        <div className="mt-0.5 truncate text-[11px] font-medium text-slate-500">{bubble.text}</div>
                                                                    </button>
                                                                    <button type="button" onClick={() => deleteQuickBubble(bubble.id)}
                                                                        className="invisible h-6 w-6 shrink-0 items-center justify-center rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 group-hover:inline-flex"
                                                                        title="Eliminar">
                                                                        <X className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="flex-1" />

                                        {/* Cancelar edición */}
                                        {activeTel && editingMsgId ? (
                                            <button type="button" onClick={() => { setEditingMsgId(null); setDraftMsg(""); }}
                                                className="rounded-lg border border-black/10 bg-white px-2.5 py-1 text-[11px] font-extrabold text-[#000000] hover:bg-neutral-50">
                                                Cancelar edición
                                            </button>
                                        ) : null}

                                        {/* Enviar */}
                                        <button onClick={enviarMensaje}
                                            disabled={!activeTel || (!draftMsg.trim() && attachments.length === 0)}
                                            className={cls(
                                                "inline-flex h-8 items-center gap-1 rounded-xl px-3 text-xs font-extrabold text-white shadow-sm transition",
                                                !activeTel || (!draftMsg.trim() && attachments.length === 0) ? "cursor-not-allowed bg-slate-300" : "hover:opacity-90"
                                            )}
                                            style={{ backgroundColor: !activeTel || (!draftMsg.trim() && attachments.length === 0) ? undefined : BRAND_BLUE }}
                                            title="Enviar" type="button">
                                            <Send className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">Enviar</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* ── MENÚ CONTEXTUAL ───────────────────────────────────────────── */}
            {chatMenu ? (
                <div className="fixed z-[90] min-w-[210px] overflow-hidden rounded-xl border border-black/10 bg-white py-1 shadow-2xl"
                    style={{ left: Math.min(chatMenu.x, window.innerWidth - 230), top: Math.min(chatMenu.y, window.innerHeight - 90) }}
                    onMouseDown={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => marcarChatComoNoLeido(chatMenu.tel)} disabled={markingUnreadTel === chatMenu.tel}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-extrabold text-[#000000] hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60">
                        <MailOpen className="h-4 w-4" />
                        {markingUnreadTel === chatMenu.tel ? "Marcando..." : "Marcar como no leído"}
                    </button>
                </div>
            ) : null}
        </div>
    );
}