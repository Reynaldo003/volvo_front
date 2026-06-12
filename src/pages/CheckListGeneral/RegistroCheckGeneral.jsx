//src/pages/CheckListGeneral/RegistroCheckGeneral.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    BadgeCheck,
    Building2,
    CalendarDays,
    Camera,
    CarFront,
    CheckCircle2,
    ClipboardCheck,
    ClipboardList,
    Eye,
    FileText,
    Gauge,
    Hash,
    Image as ImageIcon,
    Loader2,
    Lock,
    Mail,
    MessageSquareText,
    Phone,
    Plus,
    Printer,
    Save,
    Search,
    ShieldCheck,
    Trash2,
    UploadCloud,
    User,
    UserCheck,
    UserStar,
    Wrench,
    X,
} from "lucide-react";

import { apiChecklistGeneral } from "../../lib/apiChecklistGeneral";
import { useAuth } from "../../auth/AuthContext";

const VOLVO_MAIN = "#212721";
const VOLVO_MAIN_2 = "#0B2C5F";
const VOLVO_LIGHT = "#F4F7FA";
const API_BASE = (import.meta.env.VITE_API_URL || "https://crmvolvo.grupoautomotrizryr.com").replace(/\/$/, "");

const DEALERS = ["Volvo"];

const ASESORES_VOLVO = [
    "Edgar Valencia",
    "Carlos Macedonio",
    "Luis Enrique Ramos",
    "Juan Carlos Ubaldo",
];


const CHECKLIST_GENERAL = [
    {
        titulo: "1. Validación administrativa previa",
        items: [
            ["pre_factura_preparada", "Pre-factura preparada", true],
            ["orden_servicio_final_impresa_firmas", "Orden de servicio final impresa con firmas", true],
            ["garantias_documentadas", "Garantías documentadas", true],
            ["salida_almacen", "Salida de almacén", true],
        ],
    },
    {
        titulo: "2. Validación técnica final en taller",
        items: [
            ["torque_correcto_componentes", "Verificar torque correcto en componentes intervenidos", true],
            ["ausencia_fugas", "Validar ausencia de fugas", true],
            ["niveles_fluidos_correctos", "Confirmar niveles correctos de fluidos", true],
            ["instalacion_piezas_conectores", "Verificar correcta instalación de piezas y conectores", true],
            ["escaneo_final_realizado", "Escaneo final realizado", true],
            ["sin_codigos_dtc_activos", "Sin códigos DTC activos", true],
            ["reinicio_recordatorios_mantenimiento", "Reinicio correcto de recordatorios de mantenimiento", true],
            ["apriete_ruedas", "Confirmar apriete de ruedas", true],
            ["presion_neumaticos", "Verificar presión de neumáticos", true],
            ["funcionamiento_frenos", "Confirmar funcionamiento de frenos", true],
            ["funcionamiento_luces", "Verificar funcionamiento de luces", true],
            ["limpiaparabrisas_lavaparabrisas", "Verificar limpiaparabrisas y lavaparabrisas", true],
            ["funcionamiento_cinturones", "Validar funcionamiento de cinturones", true],
        ],
    },
    {
        titulo: "3. Checklist de prueba de manejo",
        ayuda: "Obligatorio para diagnósticos y cambios de frenos. Si no aplica, desactiva el switch de prueba de manejo.",
        items: [
            ["encendido_correcto", "Encendido correcto", true],
            ["marcha_minima_estable", "Marcha mínima estable", true],
            ["sin_vibraciones_anormales_ruta", "Sin vibraciones anormales", true],
            ["aceleracion_normal", "Aceleración normal", true],
            ["sin_perdida_potencia", "Sin pérdida de potencia", true],
            ["temperatura_operacion_normal", "Temperatura de operación normal", true],
            ["sin_ruidos_interiores", "Sin ruidos interiores", true],
            ["sin_olores_extranos", "Sin olores extraños", true],
            ["cambios_suaves_acople_marchas", "Cambios suaves y acople de marchas", true],
            ["sin_jaloneos", "Sin jaloneos", true],
            ["sin_ruidos_anormales_transmision", "Sin ruidos anormales en transmisión", true],
            ["sin_ruidos_suspension", "Sin ruidos en suspensión", true],
            ["alineacion_validada", "Alineación validada", true],
            ["frenos_sin_ruidos_rechinidos", "Frenos sin ruidos o rechinidos", true],
            ["aire_acondicionado_funcional", "Aire acondicionado funcional", true],
            ["audio_pantalla_funcionales", "Audio y pantalla funcionales", true],
        ],
    },
    {
        titulo: "4. Inspección estética final",
        items: [
            ["vehiculo_lavado", "Vehículo lavado", true],
            ["sin_manchas_grasa", "Sin manchas de grasa", true],
            ["cofre_puertas_cajuela_limpias", "Cofre, puertas y cajuela limpias", true],
            ["sin_danos_nuevos", "Sin daños nuevos", true],
            ["proteccion_removida_correctamente", "Protección removida correctamente", true],
            ["asientos_limpios", "Asientos limpios", true],
            ["volante_palanca_limpios", "Volante y palanca limpios", true],
            ["tapetes_limpios", "Tapetes limpios", true],
            ["sin_residuos_taller", "Sin residuos de taller", true],
            ["sin_herramientas_olvidadas", "Sin herramientas olvidadas", true],
        ],
    },
    {
        titulo: "5. Validación final de calidad (ANDON)",
        items: [
            ["checklist_completo_firmado", "Checklist completo y firmado", true],
            ["prueba_manejo_validada", "Prueba de manejo validada", true],
            ["sin_pendientes_tecnicos", "Sin pendientes técnicos", true],
            ["vehiculo_listo_entrega", "Vehículo listo para entrega", true],
            ["asesor_informado_liberacion", "Asesor informado de liberación", true],
        ],
    },
    {
        titulo: "6. Confirmación previa a entrega con cliente",
        items: [
            ["explicar_trabajos_realizados", "Explicar trabajos realizados", true],
            ["explicar_pruebas_efectuadas", "Explicar pruebas efectuadas", true],
            ["explicar_garantia", "Explicar garantía", true],
            ["informar_recomendaciones_futuras", "Informar recomendaciones futuras", true],
            ["resolver_dudas_cliente", "Resolver dudas del cliente", true],
            ["revisar_unidad_junto_cliente", "Revisar unidad junto al cliente", true],
            ["recordatorio_encuesta_satisfaccion", "Recordatorio de encuesta de satisfacción", true],
            ["confirmar_refacciones_cliente", "Confirmar con el cliente si requiere llevarse sus refacciones reemplazadas", false],
            ["concientizacion_residuo_peligroso", "Si aplica residuo peligroso, firmar concientización de riesgos y explicar sugerencias", false],
        ],
    },
];

const PRUEBA_IDS = new Set(CHECKLIST_GENERAL[2].items.map(([id]) => id));

const TABS = [
    { key: "cliente", label: "Cliente", icon: User },
    { key: "vehiculo", label: "Vehículo", icon: CarFront },
    { key: "prueba", label: "Prueba manejo", icon: Gauge },
    { key: "checklist", label: "Checklist", icon: ClipboardList },
    { key: "evidencias", label: "Evidencias", icon: Camera },
];

function normalizeStr(value) {
    return String(value ?? "").trim();
}

function normalizarRol(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function obtenerUsuario(auth) {
    return auth?.usuario || auth?.user || auth?.currentUser || null;
}

function obtenerRol(user) {
    return user?.rol_nombre || user?.rol?.nombre || user?.rol || user?.role || "";
}

function obtenerPermisos(user) {
    if (Array.isArray(user?.permisos)) return user.permisos;
    if (Array.isArray(user?.permissions)) return user.permissions;
    return [];
}

function toDTLocal(value) {
    if (!value) return "";
    const raw = String(value);
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw) && !raw.endsWith("Z")) return raw.slice(0, 16);
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (number) => String(number).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function todayInput() {
    const date = new Date();
    const pad = (number) => String(number).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function timeInput() {
    const date = new Date();
    const pad = (number) => String(number).padStart(2, "0");
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function normalizarTelefonoMx(value) {
    const digits = String(value || "").replace(/\D/g, "");
    if (/^\d{10}$/.test(digits)) return `52${digits}`;
    return digits;
}

function telefonoValido(value) {
    const digits = String(value || "").replace(/\D/g, "");
    return /^\d{10}$/.test(digits) || /^52\d{10}$/.test(digits);
}

function fechaTabla(value) {
    const local = toDTLocal(value);
    return local ? local.replace("T", " ") : "—";
}

function resolveUrl(rawUrl) {
    const value = String(rawUrl || "").trim();
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("blob:")) return value;
    if (value.startsWith("/")) return `${API_BASE}${value}`;
    return `${API_BASE}/${value}`;
}

function generarTempId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return `tmp-${crypto.randomUUID()}`;
    return `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function crearEvidenciaLocal(file) {
    return {
        _tmpId: generarTempId(),
        id: null,
        nombre: file?.name || "imagen",
        file,
        url: URL.createObjectURL(file),
        descripcion: "",
        isLocal: true,
    };
}

function limpiarPreview(item) {
    if (String(item?.url || "").startsWith("blob:")) {
        try {
            URL.revokeObjectURL(item.url);
        } catch {
            // no hacer nada
        }
    }
}

function createEmptyDraft({ agenciaDefault = "Volvo" } = {}) {
    return {
        id: null,
        cliente_id: null,
        agencia: agenciaDefault,
        cliente_nombre: "",
        cliente_telefono: "",
        cliente_correo: "",
        asesor_servicio: "",
        tecnico_inspector: "",
        gerente_servicio: "",
        pst: "",
        placas: "",
        vin: "",
        modelo: "",
        kilometraje: "",
        orden_servicio: "",
        fecha_hora_revision: toDTLocal(new Date().toISOString()),
        requiere_prueba_manejo: true,
        fecha_prueba: todayInput(),
        hora_prueba: timeInput(),
        kilometraje_inicial: "",
        kilometraje_final: "",
        checklist: {},
        observaciones: "",
        checklist_terminado: false,
        fecha_terminado: "",
        evidencias_guardadas: [],
        evidencias_nuevas: [],
        delete_evidencia_ids: [],
    };
}

function Modal({ open, title, subtitle, onClose, children, footer }) {
    if (!open || typeof document === "undefined") return null;
    return createPortal(
        <div className="fixed inset-0 z-[9998]">
            <div className="absolute inset-0 bg-black/55" onClick={onClose} />
            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-7xl overflow-hidden rounded-2xl border bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
                    <div className="flex items-center justify-between gap-3 border-b px-5 py-4" style={{ background: `linear-gradient(135deg, ${VOLVO_MAIN}, ${VOLVO_MAIN_2})` }}>
                        <div className="min-w-0">
                            <h2 className="truncate text-base font-extrabold text-white">{title}</h2>
                            {subtitle ? <p className="mt-1 text-xs font-semibold text-white/70">{subtitle}</p> : null}
                        </div>
                        <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="max-h-[78vh] overflow-auto bg-white p-5">{children}</div>
                    {footer ? <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-end">{footer}</div> : null}
                </div>
            </div>
        </div>,
        document.body,
    );
}

function Field({ label, icon: Icon, children, className = "" }) {
    return (
        <div className={["rounded-xl border border-slate-200 bg-white p-4 shadow-sm", className].join(" ")}>
            {label ? (
                <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-slate-900">
                    {Icon ? <Icon className="h-4 w-4" style={{ color: VOLVO_MAIN }} /> : null}
                    <span>{label}</span>
                </div>
            ) : null}
            {children}
        </div>
    );
}

function SectionTitle({ title, icon: Icon, subtitle }) {
    return (
        <div className="md:col-span-3">
            <div className="flex flex-col gap-1 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: `${VOLVO_MAIN}33`, background: VOLVO_LIGHT }}>
                <div className="flex items-center gap-2">
                    {Icon ? <Icon className="h-5 w-5" style={{ color: VOLVO_MAIN }} /> : null}
                    <h3 className="text-sm font-extrabold text-slate-950">{title}</h3>
                </div>
                {subtitle ? <p className="text-xs font-semibold text-slate-500">{subtitle}</p> : null}
            </div>
        </div>
    );
}

function EvidenceCard({ item, disabled, onRemove, onChange }) {
    const url = resolveUrl(item?.url || item?.archivo);
    const nombre = item?.nombre || item?.file?.name || "imagen";
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="relative">
                {url ? <img src={url} alt={nombre} className="h-44 w-full object-cover" loading="lazy" /> : (
                    <div className="flex h-44 w-full items-center justify-center bg-slate-100"><div className="text-center"><ImageIcon className="mx-auto h-10 w-10 text-slate-500" /><p className="mt-2 text-xs font-bold text-slate-600">Vista previa no disponible</p></div></div>
                )}
                <button type="button" onClick={onRemove} disabled={disabled} className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-black/60 text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3 p-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0"><div className="truncate text-sm font-bold text-slate-950">{nombre}</div><div className="mt-1 text-xs font-semibold text-slate-500">Evidencia fotográfica</div></div>
                    {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-950 hover:bg-slate-100"><Eye className="h-3.5 w-3.5" /> Ver</a> : null}
                </div>
                <textarea value={item.descripcion || ""} onChange={(event) => onChange("descripcion", event.target.value)} disabled={disabled} placeholder="Descripción de la evidencia..." className="min-h-[80px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-[#001C48] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100" />
            </div>
        </div>
    );
}

export default function RegistroCheckGeneral() {
    const auth = useAuth();
    const user = obtenerUsuario(auth);
    const fileInputRef = useRef(null);

    const rolNormalizado = useMemo(() => normalizarRol(obtenerRol(user)), [user]);
    const permisosNormalizados = useMemo(() => obtenerPermisos(user).map((permiso) => normalizarRol(permiso)), [user]);
    const isAdmin = useMemo(() => rolNormalizado.includes("administrador") || rolNormalizado.includes("admin") || permisosNormalizados.includes("all") || permisosNormalizados.includes("usuarios_admin"), [rolNormalizado, permisosNormalizados]);
    const userAgencia = String(user?.agencia || "").trim();

    const [rows, setRows] = useState([]);
    const [filters, setFilters] = useState({ q: "" });
    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState("create");
    const [draft, setDraft] = useState(null);
    const [activeTab, setActiveTab] = useState("cliente");
    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [finishing, setFinishing] = useState(false);
    const [touchedSave, setTouchedSave] = useState(false);

    const inputBase = "w-full rounded-lg border px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm outline-none transition focus:border-[#001C48] focus:ring-2 focus:ring-blue-100";
    const inputOk = "border-slate-200 bg-white";
    const inputBad = "border-red-500 bg-red-50";
    const inputDisabled = "cursor-not-allowed bg-slate-100 text-slate-500";
    const bloqueoGeneral = saving || Boolean(draft?.checklist_terminado);

    const missing = useMemo(() => {
        if (!draft) return [];
        const requeridos = [
            ["cliente_nombre", "Nombre del cliente"],
            ["cliente_telefono", "Teléfono"],
            ["fecha_hora_revision", "Fecha de revisión"],
        ];
        return requeridos.filter(([key]) => !String(draft[key] || "").trim());
    }, [draft]);

    const telIsOk = telefonoValido(draft?.cliente_telefono || "");

    const progress = useMemo(() => {
        if (!draft) return { total: 0, hechos: 0 };
        const ids = CHECKLIST_GENERAL.flatMap((seccion) => seccion.items.map(([id]) => id)).filter((id) => draft.requiere_prueba_manejo || !PRUEBA_IDS.has(id));
        const hechos = ids.filter((id) => ["ok", "na"].includes(draft.checklist?.[id]?.estado)).length;
        return { total: ids.length, hechos };
    }, [draft]);

    const filteredRows = useMemo(() => {
        const q = filters.q.trim().toLowerCase();
        return rows.filter((row) => {
            if (!isAdmin && userAgencia && normalizeStr(row.agencia) !== normalizeStr(userAgencia)) return false;
            if (!q) return true;
            const valores = [row?.cliente?.nombre, row?.cliente?.telefono, row?.cliente?.correo, row.agencia, row.asesor_servicio, row.tecnico_inspector, row.gerente_servicio, row.pst, row.placas, row.vin, row.modelo, row.kilometraje, row.orden_servicio, row.observaciones];
            return valores.some((value) => normalizeStr(value).toLowerCase().includes(q));
        });
    }, [rows, filters.q, isAdmin, userAgencia]);

    async function refreshList() {
        setLoadingList(true);
        try {
            const data = await apiChecklistGeneral.list();
            setRows(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setRows([]);
        } finally {
            setLoadingList(false);
        }
    }

    useEffect(() => {
        if (auth?.loadingSesion) return;
        if (auth?.token === null) return;
        refreshList();
    }, [auth?.loadingSesion, auth?.token]);

    function setDraftField(key, value) {
        setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    }

    function limpiarEvidenciasTemporales(currentDraft) {
        (currentDraft?.evidencias_nuevas || []).forEach((item) => limpiarPreview(item));
    }

    function openCreate() {
        limpiarEvidenciasTemporales(draft);
        setMode("create");
        setDraft(createEmptyDraft({ agenciaDefault: isAdmin ? "Volvo" : userAgencia || "Volvo" }));
        setTouchedSave(false);
        setActiveTab("cliente");
        setOpenModal(true);
    }

    async function openEdit(row) {
        if (!row?.id) return;
        limpiarEvidenciasTemporales(draft);
        setMode("edit");
        setTouchedSave(false);
        setLoadingDetail(true);
        setActiveTab("cliente");
        setOpenModal(true);
        try {
            const item = await apiChecklistGeneral.get(row.id);
            setDraft({
                ...createEmptyDraft({ agenciaDefault: item.agencia || "Volvo" }),
                id: item.id,
                cliente_id: item?.cliente?.id_cliente ?? null,
                agencia: item.agencia || "Volvo",
                cliente_nombre: item?.cliente?.nombre || "",
                cliente_telefono: item?.cliente?.telefono || "",
                cliente_correo: item?.cliente?.correo || "",
                asesor_servicio: item.asesor_servicio || "",
                tecnico_inspector: item.tecnico_inspector || "",
                gerente_servicio: item.gerente_servicio || "",
                pst: item.pst || "",
                placas: item.placas || "",
                vin: item.vin || "",
                modelo: item.modelo || "",
                kilometraje: item.kilometraje || "",
                orden_servicio: item.orden_servicio || "",
                fecha_hora_revision: toDTLocal(item.fecha_hora_revision),
                requiere_prueba_manejo: Boolean(item.requiere_prueba_manejo),
                fecha_prueba: item.fecha_prueba || "",
                hora_prueba: item.hora_prueba ? String(item.hora_prueba).slice(0, 5) : "",
                kilometraje_inicial: item.kilometraje_inicial || "",
                kilometraje_final: item.kilometraje_final || "",
                checklist: item.checklist || {},
                observaciones: item.observaciones || "",
                checklist_terminado: Boolean(item.checklist_terminado),
                fecha_terminado: toDTLocal(item.fecha_terminado),
                evidencias_guardadas: Array.isArray(item.evidencias) ? item.evidencias.map((ev) => ({ ...ev, url: resolveUrl(ev.url || ev.archivo), descripcion: ev.descripcion || "", isLocal: false })) : [],
                evidencias_nuevas: [],
                delete_evidencia_ids: [],
            });
        } catch (error) {
            console.error(error);
            alert(error.message || "No se pudo abrir el checklist general.");
            setOpenModal(false);
        } finally {
            setLoadingDetail(false);
        }
    }

    function closeModal() {
        if (saving || finishing) return;
        limpiarEvidenciasTemporales(draft);
        setOpenModal(false);
        setDraft(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function updateChecklist(itemId, field, value) {
        setDraft((prev) => {
            if (!prev) return prev;
            const next = { ...(prev.checklist || {}) };
            const current = next[itemId] || { estado: "", comentario: "" };
            next[itemId] = { ...current, [field]: value };
            if (!next[itemId].estado && !next[itemId].comentario) delete next[itemId];
            return { ...prev, checklist: next };
        });
    }

    function marcarSeccion(items, estado) {
        setDraft((prev) => {
            if (!prev) return prev;
            const next = { ...(prev.checklist || {}) };
            items.forEach(([itemId]) => {
                if (!prev.requiere_prueba_manejo && PRUEBA_IDS.has(itemId)) return;
                const current = next[itemId] || { estado: "", comentario: "" };
                next[itemId] = { ...current, estado };
            });
            return { ...prev, checklist: next };
        });
    }

    function toggleRequierePrueba(value) {
        setDraft((prev) => {
            if (!prev) return prev;
            const next = { ...prev, requiere_prueba_manejo: value };
            if (!value) {
                const checklist = { ...(prev.checklist || {}) };
                PRUEBA_IDS.forEach((id) => delete checklist[id]);
                next.checklist = checklist;
            }
            return next;
        });
    }

    function handleAddFiles(fileList) {
        const files = Array.from(fileList || []);
        if (!files.length) return;
        const imagenes = files.filter((file) => String(file.type || "").startsWith("image/"));
        if (imagenes.length !== files.length) alert("Solo se permiten imágenes.");
        if (!imagenes.length) return;
        setDraft((prev) => prev ? { ...prev, evidencias_nuevas: [...(prev.evidencias_nuevas || []), ...imagenes.map((file) => crearEvidenciaLocal(file))] } : prev);
    }

    function removeNewEvidence(tmpId) {
        setDraft((prev) => {
            if (!prev) return prev;
            const target = (prev.evidencias_nuevas || []).find((item) => item._tmpId === tmpId);
            if (target) limpiarPreview(target);
            return { ...prev, evidencias_nuevas: (prev.evidencias_nuevas || []).filter((item) => item._tmpId !== tmpId) };
        });
    }

    function removeSavedEvidence(id) {
        setDraft((prev) => prev ? { ...prev, evidencias_guardadas: (prev.evidencias_guardadas || []).filter((item) => item.id !== id), delete_evidencia_ids: [...(prev.delete_evidencia_ids || []), id].filter(Boolean) } : prev);
    }

    function updateNewEvidence(tmpId, field, value) {
        setDraft((prev) => prev ? { ...prev, evidencias_nuevas: (prev.evidencias_nuevas || []).map((item) => item._tmpId === tmpId ? { ...item, [field]: value } : item) } : prev);
    }

    function updateSavedEvidence(id, field, value) {
        setDraft((prev) => prev ? { ...prev, evidencias_guardadas: (prev.evidencias_guardadas || []).map((item) => item.id === id ? { ...item, [field]: value } : item) } : prev);
    }

    function buildPayload() {
        return {
            ...(draft.cliente_id ? { cliente_id: draft.cliente_id } : {}),
            agencia: isAdmin ? draft.agencia || "Volvo" : userAgencia || "Volvo",
            nombre: draft.cliente_nombre || "",
            telefono: normalizarTelefonoMx(draft.cliente_telefono),
            correo: draft.cliente_correo || "",
            asesor_servicio: draft.asesor_servicio || "",
            tecnico_inspector: draft.tecnico_inspector || "",
            gerente_servicio: draft.gerente_servicio || "",
            pst: draft.pst || "",
            placas: draft.placas || "",
            vin: draft.vin || "",
            modelo: draft.modelo || "",
            kilometraje: draft.kilometraje || "",
            orden_servicio: draft.orden_servicio || "",
            fecha_hora_revision: draft.fecha_hora_revision || null,
            requiere_prueba_manejo: Boolean(draft.requiere_prueba_manejo),
            fecha_prueba: draft.requiere_prueba_manejo ? draft.fecha_prueba || null : null,
            hora_prueba: draft.requiere_prueba_manejo ? draft.hora_prueba || null : null,
            kilometraje_inicial: draft.requiere_prueba_manejo ? draft.kilometraje_inicial || "" : "",
            kilometraje_final: draft.requiere_prueba_manejo ? draft.kilometraje_final || "" : "",
            checklist: draft.checklist || {},
            observaciones: draft.observaciones || "",
            evidencias_nuevas: draft.evidencias_nuevas || [],
            evidencias_existentes: (draft.evidencias_guardadas || []).map((item) => ({ id: item.id, descripcion: item.descripcion || "" })),
            delete_evidencia_ids: draft.delete_evidencia_ids || [],
        };
    }

    async function save() {
        if (!draft || saving) return;
        setTouchedSave(true);
        if (!telIsOk) {
            setActiveTab("cliente");
            return;
        }
        if (missing.length) {
            setActiveTab("cliente");
            return;
        }
        setSaving(true);
        try {
            const payload = buildPayload();
            const response = mode === "create" ? await apiChecklistGeneral.create(payload) : await apiChecklistGeneral.update(draft.id, payload);
            await refreshList();
            if (mode === "create" && response?.id) await openEdit({ id: response.id });
            else if (draft.id) await openEdit({ id: draft.id });
        } catch (error) {
            console.error(error);
            alert(error.message || "Error guardando checklist general.");
        } finally {
            setSaving(false);
        }
    }

    async function imprimirPdf() {
        if (!draft?.id || printing) return;
        setPrinting(true);
        try {
            const blob = await apiChecklistGeneral.checklistPdf(draft.id);
            const pdfBlob = new Blob([blob], { type: "application/pdf" });
            const url = URL.createObjectURL(pdfBlob);
            window.open(url, "_blank");
            setTimeout(() => URL.revokeObjectURL(url), 30 * 60 * 1000);
        } catch (error) {
            console.error(error);
            alert(error.message || "No se pudo generar el PDF.");
        } finally {
            setPrinting(false);
        }
    }

    async function terminarChecklist() {
        if (!draft?.id || finishing) return;
        const ok = confirm("¿Terminar checklist general? El backend validará calidad, seguridad, prueba de manejo si aplica y ANDON. Después ya no se podrá editar.");
        if (!ok) return;
        setFinishing(true);
        try {
            const updated = await apiChecklistGeneral.terminar(draft.id);
            setDraft((prev) => ({ ...prev, checklist_terminado: Boolean(updated.checklist_terminado), fecha_terminado: toDTLocal(updated.fecha_terminado) }));
            await refreshList();
        } catch (error) {
            console.error(error);
            alert(error.message || "No se pudo terminar el checklist.");
        } finally {
            setFinishing(false);
        }
    }

    async function eliminarChecklist(row) {
        if (!row?.id) return;
        const ok = confirm(`¿Eliminar checklist general de ${row?.cliente?.nombre || "cliente"}?`);
        if (!ok) return;
        try {
            await apiChecklistGeneral.remove(row.id);
            setRows((prev) => prev.filter((item) => item.id !== row.id));
        } catch (error) {
            console.error(error);
            alert(error.message || "No se pudo eliminar.");
        }
    }

    function renderCliente() {
        return (
            <>
                <SectionTitle icon={User} title="Datos del cliente" />
                <Field label="Dealer" icon={Building2}>
                    <select value={draft.agencia} onChange={(event) => setDraftField("agencia", event.target.value)} disabled={!isAdmin || bloqueoGeneral} className={[inputBase, inputOk, !isAdmin || bloqueoGeneral ? inputDisabled : ""].join(" ")}>
                        {(isAdmin ? DEALERS : [userAgencia || "Volvo"]).map((dealer) => <option key={dealer} value={dealer}>{dealer}</option>)}
                    </select>
                </Field>
                <Field label="Nombre completo cliente" icon={User}>
                    <input value={draft.cliente_nombre} onChange={(event) => setDraftField("cliente_nombre", event.target.value)} disabled={bloqueoGeneral} className={[inputBase, touchedSave && !draft.cliente_nombre ? inputBad : inputOk, bloqueoGeneral ? inputDisabled : ""].join(" ")} placeholder="Nombre completo" />
                </Field>
                <Field label="Teléfono" icon={Phone}>
                    <input value={draft.cliente_telefono} maxLength={12} onChange={(event) => setDraftField("cliente_telefono", event.target.value.replace(/\D/g, "").slice(0, 12))} disabled={mode === "edit" || bloqueoGeneral} className={[inputBase, touchedSave && !telIsOk ? inputBad : inputOk, mode === "edit" || bloqueoGeneral ? inputDisabled : ""].join(" ")} placeholder="10 dígitos o 52 + 10 dígitos" />
                    {touchedSave && !telIsOk ? <p className="mt-2 text-xs font-bold text-red-600">Teléfono inválido.</p> : null}
                </Field>
                <Field label="Correo" icon={Mail}>
                    <input type="email" value={draft.cliente_correo} onChange={(event) => setDraftField("cliente_correo", event.target.value)} disabled={bloqueoGeneral} className={[inputBase, inputOk, bloqueoGeneral ? inputDisabled : ""].join(" ")} placeholder="correo@dominio.com" />
                </Field>
                <Field label="Fecha y hora revisión" icon={CalendarDays}>
                    <input type="datetime-local" value={draft.fecha_hora_revision} onChange={(event) => setDraftField("fecha_hora_revision", event.target.value)} disabled={bloqueoGeneral} className={[inputBase, touchedSave && !draft.fecha_hora_revision ? inputBad : inputOk, bloqueoGeneral ? inputDisabled : ""].join(" ")} />
                </Field>
            </>
        );
    }

    function renderVehiculo() {
        return (
            <>
                <SectionTitle icon={CarFront} title="Datos del vehículo y responsables" />
                <Field label="PST" icon={UserStar}>
                    <select value={draft.asesor_servicio} onChange={(event) => setDraftField("asesor_servicio", event.target.value)} disabled={bloqueoGeneral} className={[inputBase, inputOk, bloqueoGeneral ? inputDisabled : ""].join(" ")}>
                        <option value="">Selecciona un asesor...</option>
                        {ASESORES_VOLVO.map((asesor) => <option key={asesor} value={asesor}>{asesor}</option>)}
                    </select>
                </Field>
                <Field label="Técnico / inspector" icon={Wrench}>
                    <input value={draft.tecnico_inspector} onChange={(event) => setDraftField("tecnico_inspector", event.target.value)} disabled={bloqueoGeneral} className={[inputBase, inputOk, bloqueoGeneral ? inputDisabled : ""].join(" ")} placeholder="Nombre del técnico o inspector" />
                </Field>
                <Field label="Gerente de servicio" icon={UserCheck}>
                    <input value={draft.gerente_servicio} onChange={(event) => setDraftField("gerente_servicio", event.target.value)} disabled={bloqueoGeneral} className={[inputBase, inputOk, bloqueoGeneral ? inputDisabled : ""].join(" ")} placeholder="Nombre del gerente" />
                </Field>
                <Field label="Orden de servicio" icon={FileText}>
                    <input value={draft.orden_servicio} onChange={(event) => setDraftField("orden_servicio", event.target.value.toUpperCase())} disabled={bloqueoGeneral} className={[inputBase, inputOk, bloqueoGeneral ? inputDisabled : ""].join(" ")} placeholder="Número de orden" />
                </Field>
                <Field label="Placas" icon={BadgeCheck}>
                    <input value={draft.placas} onChange={(event) => setDraftField("placas", event.target.value.toUpperCase())} disabled={bloqueoGeneral} className={[inputBase, inputOk, bloqueoGeneral ? inputDisabled : ""].join(" ")} placeholder="Ej. YXX123A" />
                </Field>
                <Field label="VIN" icon={Hash}>
                    <input value={draft.vin} onChange={(event) => setDraftField("vin", event.target.value.toUpperCase())} disabled={bloqueoGeneral} className={[inputBase, inputOk, bloqueoGeneral ? inputDisabled : ""].join(" ")} placeholder="Número VIN" />
                </Field>
                <Field label="Modelo" icon={CarFront}>
                    <input value={draft.modelo} onChange={(event) => setDraftField("modelo", event.target.value)} disabled={bloqueoGeneral} className={[inputBase, inputOk, bloqueoGeneral ? inputDisabled : ""].join(" ")} placeholder="Ej. XC60, XC90, EX30..." />
                </Field>
                <Field label="Kilometraje actual" icon={Gauge}>
                    <input value={draft.kilometraje} onChange={(event) => setDraftField("kilometraje", event.target.value)} disabled={bloqueoGeneral} className={[inputBase, inputOk, bloqueoGeneral ? inputDisabled : ""].join(" ")} placeholder="Ej. 45000" />
                </Field>
                <Field label="Observaciones generales" icon={MessageSquareText} className="md:col-span-3">
                    <textarea value={draft.observaciones} onChange={(event) => setDraftField("observaciones", event.target.value)} disabled={bloqueoGeneral} className={[inputBase, inputOk, "min-h-[105px] resize-y", bloqueoGeneral ? inputDisabled : ""].join(" ")} placeholder="Comentarios generales de calidad..." />
                </Field>
            </>
        );
    }

    function renderPrueba() {
        return (
            <>
                <SectionTitle icon={Gauge} title="Datos de prueba de manejo" subtitle="Obligatoria para diagnósticos y cambios de frenos" />
                <Field label="¿Requiere prueba de manejo?" icon={ShieldCheck}>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => toggleRequierePrueba(true)} disabled={bloqueoGeneral} className={["flex-1 rounded-xl border px-3 py-2 text-sm font-extrabold", draft.requiere_prueba_manejo ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600"].join(" ")}>Sí aplica</button>
                        <button type="button" onClick={() => toggleRequierePrueba(false)} disabled={bloqueoGeneral} className={["flex-1 rounded-xl border px-3 py-2 text-sm font-extrabold", !draft.requiere_prueba_manejo ? "border-slate-500 bg-slate-100 text-slate-800" : "border-slate-200 bg-white text-slate-600"].join(" ")}>No aplica</button>
                    </div>
                </Field>
                <Field label="Fecha de prueba" icon={CalendarDays}>
                    <input type="date" value={draft.fecha_prueba || ""} onChange={(event) => setDraftField("fecha_prueba", event.target.value)} disabled={bloqueoGeneral || !draft.requiere_prueba_manejo} className={[inputBase, inputOk, bloqueoGeneral || !draft.requiere_prueba_manejo ? inputDisabled : ""].join(" ")} />
                </Field>
                <Field label="Hora de prueba" icon={Gauge}>
                    <input type="time" value={draft.hora_prueba || ""} onChange={(event) => setDraftField("hora_prueba", event.target.value)} disabled={bloqueoGeneral || !draft.requiere_prueba_manejo} className={[inputBase, inputOk, bloqueoGeneral || !draft.requiere_prueba_manejo ? inputDisabled : ""].join(" ")} />
                </Field>
                <Field label="Kilometraje inicial" icon={Gauge}>
                    <input value={draft.kilometraje_inicial} onChange={(event) => setDraftField("kilometraje_inicial", event.target.value)} disabled={bloqueoGeneral || !draft.requiere_prueba_manejo} className={[inputBase, inputOk, bloqueoGeneral || !draft.requiere_prueba_manejo ? inputDisabled : ""].join(" ")} placeholder="KM inicial" />
                </Field>
                <Field label="Kilometraje final" icon={Gauge}>
                    <input value={draft.kilometraje_final} onChange={(event) => setDraftField("kilometraje_final", event.target.value)} disabled={bloqueoGeneral || !draft.requiere_prueba_manejo} className={[inputBase, inputOk, bloqueoGeneral || !draft.requiere_prueba_manejo ? inputDisabled : ""].join(" ")} placeholder="KM final" />
                </Field>
            </>
        );
    }

    function renderChecklist() {
        return (
            <>
                <SectionTitle icon={ShieldCheck} title="Checklist general de calidad" subtitle={`${progress.hechos}/${progress.total} puntos completados`} />
                <div className="md:col-span-3 space-y-4">
                    {CHECKLIST_GENERAL.map((seccion) => {
                        const esPrueba = seccion.items.some(([id]) => PRUEBA_IDS.has(id));
                        if (esPrueba && !draft.requiere_prueba_manejo) return null;
                        return (
                            <div key={seccion.titulo} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ background: VOLVO_LIGHT }}>
                                    <div><h3 className="text-sm font-extrabold text-slate-950">{seccion.titulo}</h3>{seccion.ayuda ? <p className="mt-1 text-xs font-bold text-slate-500">{seccion.ayuda}</p> : null}</div>
                                    <div className="flex flex-wrap gap-2"><button type="button" onClick={() => marcarSeccion(seccion.items, "ok")} disabled={bloqueoGeneral} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">Todo correcto</button><button type="button" onClick={() => marcarSeccion(seccion.items, "na")} disabled={bloqueoGeneral} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100 disabled:opacity-50">Todo N/A</button></div>
                                </div>
                                <div className="divide-y divide-slate-200">
                                    {seccion.items.map(([itemId, descripcion, obligatorio]) => {
                                        const current = draft.checklist?.[itemId] || { estado: "", comentario: "" };
                                        return (
                                            <div key={itemId} className="grid gap-3 p-4 lg:grid-cols-[1fr_390px]">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-slate-900">{descripcion}</p>{obligatorio ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-black text-red-600">OBLIGATORIO</span> : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-600">SI APLICA</span>}</div>
                                                    <textarea value={current.comentario || ""} onChange={(event) => updateChecklist(itemId, "comentario", event.target.value)} disabled={bloqueoGeneral} className="mt-2 min-h-[70px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-[#001C48] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100" placeholder="Comentario u observación..." />
                                                </div>
                                                <div className="flex flex-wrap items-start gap-2 lg:justify-end">
                                                    {[["ok", "Correcto", "border-emerald-500 bg-emerald-50 text-emerald-700"], ["observacion", "Observación", "border-amber-500 bg-amber-50 text-amber-700"], ["na", "N/A", "border-slate-400 bg-slate-100 text-slate-700"]].map(([estado, label, activeClass]) => {
                                                        const active = current.estado === estado;
                                                        return <button key={estado} type="button" onClick={() => updateChecklist(itemId, "estado", active ? "" : estado)} disabled={bloqueoGeneral || (obligatorio && estado === "na")} className={["inline-flex min-w-[115px] items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-40", active ? activeClass : "border-slate-200 bg-white text-slate-500 hover:border-[#001C48] hover:bg-blue-50 hover:text-slate-950"].join(" ")}>{active ? <CheckCircle2 className="h-4 w-4" /> : null}{label}</button>;
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </>
        );
    }

    function renderEvidencias() {
        const total = (draft.evidencias_guardadas?.length || 0) + (draft.evidencias_nuevas?.length || 0);
        return (
            <>
                <SectionTitle icon={Camera} title="Evidencias fotográficas" />
                <Field className="md:col-span-3">
                    <input ref={fileInputRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(event) => { handleAddFiles(event.target.files); event.target.value = ""; }} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={bloqueoGeneral} className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-6 text-slate-950 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" style={{ borderColor: `${VOLVO_MAIN}55`, background: VOLVO_LIGHT }}>
                        <UploadCloud className="h-6 w-6" style={{ color: VOLVO_MAIN }} />
                        <div className="text-left"><div className="text-sm font-extrabold">Tomar foto o subir evidencia</div><div className="text-xs font-semibold text-slate-500">Evidencias de calidad, prueba de manejo, estética, refacciones o daños.</div></div>
                    </button>
                    <div className="mt-4 w-max rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">Total evidencias: {total}</div>
                    {draft.evidencias_guardadas?.length ? <div className="mt-4"><h4 className="mb-2 text-sm font-extrabold text-slate-950">Evidencias guardadas</h4><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{draft.evidencias_guardadas.map((item) => <EvidenceCard key={`saved-${item.id}`} item={item} disabled={bloqueoGeneral} onRemove={() => removeSavedEvidence(item.id)} onChange={(field, value) => updateSavedEvidence(item.id, field, value)} />)}</div></div> : null}
                    {draft.evidencias_nuevas?.length ? <div className="mt-4"><h4 className="mb-2 text-sm font-extrabold text-slate-950">Evidencias nuevas</h4><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{draft.evidencias_nuevas.map((item) => <EvidenceCard key={item._tmpId} item={item} disabled={bloqueoGeneral} onRemove={() => removeNewEvidence(item._tmpId)} onChange={(field, value) => updateNewEvidence(item._tmpId, field, value)} />)}</div></div> : null}
                    {!total ? <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">Todavía no hay evidencias.</div> : null}
                </Field>
            </>
        );
    }

    function renderActiveTab() {
        if (!draft) return null;
        if (activeTab === "cliente") return renderCliente();
        if (activeTab === "vehiculo") return renderVehiculo();
        if (activeTab === "prueba") return renderPrueba();
        if (activeTab === "checklist") return renderChecklist();
        if (activeTab === "evidencias") return renderEvidencias();
        return renderCliente();
    }

    return (
        <div className="w-full">
            <div className="mb-4 overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: `${VOLVO_MAIN}33` }}>
                <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between" style={{ background: VOLVO_MAIN }}>
                    <div><h2 className="text-lg font-extrabold text-white">Checklist general de calidad</h2><p className="text-xs font-semibold text-white/70">Validación administrativa, técnica, prueba de manejo, estética, ANDON y entrega.</p></div>
                    <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-extrabold shadow-sm hover:bg-slate-100" style={{ color: VOLVO_MAIN }}><Plus className="h-4 w-4" /> Nuevo checklist</button>
                </div>
                <div className="border-t border-slate-200 px-4 py-3" style={{ background: VOLVO_LIGHT }}>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"><Search className="h-4 w-4 text-slate-500" /><input value={filters.q} onChange={(event) => setFilters({ q: event.target.value })} placeholder="Buscar por cliente, teléfono, placas, VIN, orden, inspector..." className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400" />{filters.q ? <button type="button" onClick={() => setFilters({ q: "" })} className="rounded-lg p-1 text-slate-600 hover:bg-red-50 hover:text-red-600"><X className="h-4 w-4" /></button> : null}</div>
                </div>
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg lg:block">
                <div className="overflow-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="text-xs text-white" style={{ background: VOLVO_MAIN }}>
                            <tr><th className="px-4 py-3 font-extrabold">Fecha revisión</th><th className="px-4 py-3 font-extrabold">Cliente</th><th className="px-4 py-3 font-extrabold">Teléfono</th><th className="px-4 py-3 font-extrabold">Inspector</th><th className="px-4 py-3 font-extrabold">Modelo</th><th className="px-4 py-3 font-extrabold">Placas</th><th className="px-4 py-3 font-extrabold">Orden</th><th className="px-4 py-3 font-extrabold">Estado</th><th className="px-4 py-3 font-extrabold">Acciones</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loadingList ? <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-500">Cargando checklists...</td></tr> : filteredRows.length ? filteredRows.map((row) => (
                                <tr key={row.id} onDoubleClick={() => openEdit(row)} className="cursor-pointer transition hover:bg-blue-50/50">
                                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">{fechaTabla(row.fecha_hora_revision)}</td><td className="whitespace-nowrap px-4 py-3 font-bold text-slate-950">{row?.cliente?.nombre || "—"}</td><td className="whitespace-nowrap px-4 py-3 text-slate-700">{row?.cliente?.telefono || "—"}</td><td className="whitespace-nowrap px-4 py-3 text-slate-700">{row.tecnico_inspector || "—"}</td><td className="whitespace-nowrap px-4 py-3 text-slate-700">{row.modelo || "—"}</td><td className="whitespace-nowrap px-4 py-3 font-bold text-slate-950">{row.placas || "—"}</td><td className="whitespace-nowrap px-4 py-3 text-slate-700">{row.orden_servicio || "—"}</td><td className="whitespace-nowrap px-4 py-3"><span className={["rounded-full border px-3 py-1 text-xs font-bold", row.checklist_terminado ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-blue-200 bg-blue-50 text-blue-700"].join(" ")}>{row.checklist_terminado ? "Terminado" : "Abierto"}</span></td><td className="whitespace-nowrap px-4 py-3"><div className="flex gap-2"><button type="button" onClick={() => openEdit(row)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">Abrir</button>{isAdmin ? <button type="button" onClick={() => eliminarChecklist(row)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100">Eliminar</button> : null}</div></td>
                                </tr>
                            )) : <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-500">No hay resultados.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid gap-3 lg:hidden">
                {loadingList ? <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500">Cargando...</div> : filteredRows.length ? filteredRows.map((row) => (
                    <div key={row.id} onClick={() => openEdit(row)} className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#001C48]"><div className="flex items-start justify-between gap-3"><div><p className="font-extrabold text-slate-950">{row?.cliente?.nombre || "—"}</p><p className="text-xs font-semibold text-slate-500">{fechaTabla(row.fecha_hora_revision)}</p></div><span className={["rounded-full border px-3 py-1 text-xs font-bold", row.checklist_terminado ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-blue-200 bg-blue-50 text-blue-700"].join(" ")}>{row.checklist_terminado ? "Terminado" : "Abierto"}</span></div><div className="mt-3 grid gap-2 text-xs font-semibold text-slate-600"><div>Teléfono: {row?.cliente?.telefono || "—"}</div><div>Vehículo: {row.modelo || "—"}</div><div>Placas: {row.placas || "—"}</div><div>Orden: {row.orden_servicio || "—"}</div></div></div>
                )) : <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500">No hay resultados.</div>}
            </div>

            <Modal
                open={openModal}
                title={mode === "create" ? "Nuevo checklist general" : `Checklist general • ${draft?.id || ""}`}
                subtitle={draft?.checklist_terminado ? "Checklist terminado: solo lectura" : "Captura de calidad, prueba de manejo, evidencias y PDF"}
                onClose={closeModal}
                footer={<>{draft?.checklist_terminado ? <div className="mr-auto inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700"><Lock className="h-4 w-4" /> Checklist terminado</div> : null}{mode === "edit" && draft?.id ? <><button type="button" onClick={imprimirPdf} disabled={printing} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-950 hover:bg-slate-100 disabled:opacity-60">{printing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />} PDF</button>{!draft.checklist_terminado ? <button type="button" onClick={terminarChecklist} disabled={finishing} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60">{finishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />} Terminar checklist</button> : null}</> : null}<button type="button" onClick={closeModal} disabled={saving || finishing} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-950 hover:bg-slate-100 disabled:opacity-60"><X className="h-4 w-4" /> Cerrar</button>{!draft?.checklist_terminado ? <button type="button" onClick={save} disabled={saving || loadingDetail} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white shadow-sm hover:opacity-95 disabled:opacity-60" style={{ background: VOLVO_MAIN }}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {saving ? "Guardando..." : "Guardar cambios"}</button> : null}</>}
            >
                {loadingDetail ? <div className="grid gap-3 md:grid-cols-3">{Array.from({ length: 9 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-xl bg-slate-100" />)}</div> : !draft ? null : <><div className="mb-4 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-2"><div className="flex min-w-max gap-2">{TABS.map((tab) => { const Icon = tab.icon; const active = activeTab === tab.key; return <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={["inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-extrabold transition", active ? "text-white" : "bg-white text-slate-600 hover:bg-blue-50 hover:text-slate-950"].join(" ")} style={active ? { background: VOLVO_MAIN } : {}}><Icon className="h-4 w-4" />{tab.label}</button>; })}</div></div>{touchedSave && missing.length ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">Faltan campos requeridos: {missing.map((item) => item[1]).join(", ")}.</div> : null}<div className="grid gap-3 md:grid-cols-3">{renderActiveTab()}</div></>}
            </Modal>
        </div>
    );
}
