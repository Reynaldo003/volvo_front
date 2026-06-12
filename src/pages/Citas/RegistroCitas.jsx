// src/pages/Citas/RegistroCitas.jsx
import { useMemo, useState, useEffect } from "react";
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
    LayoutList,
    UserCheck,
    UserSearch,
    UserMinus,
    UserStar,
    MessageSquareText,
    Building2,
    CalendarClock, Table2
} from "lucide-react";
import { apiCitas } from "../../lib/apiCitas";
import { createPortal } from "react-dom";
import { useAuth } from "../../auth/AuthContext";

const BRAND_BLUE = "#131E5C";

function normalizeStr(v) {
    return String(v ?? "").trim();
}

function Skeleton({ className = "" }) {
    return <div className={["animate-pulse rounded-md bg-black/10", className].join(" ")} />;
}

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            <td className="px-4 py-3">
                <div className="h-4 w-36 rounded bg-slate-200/60" />
            </td>
            <td className="px-4 py-3">
                <div className="h-4 w-28 rounded bg-slate-200/60" />
            </td>
            <td className="px-4 py-3">
                <div className="h-4 w-40 rounded bg-slate-200/60" />
            </td>
            <td className="px-4 py-3">
                <div className="h-4 w-28 rounded bg-slate-200/60" />
            </td>
            <td className="px-4 py-3">
                <div className="h-4 w-28 rounded bg-slate-200/60" />
            </td>
            <td className="px-4 py-3">
                <div className="h-4 w-64 rounded bg-slate-200/60" />
            </td>
            <td className="px-4 py-3">
                <div className="h-6 w-20 rounded-full bg-slate-200/60" />
            </td>
        </tr>
    );
}

function ModalSkeleton() {
    return (
        <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 10 }).map((_, i) => (
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

function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} />
            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-4xl overflow-hidden rounded-lg border border-[#131E5C] bg-neutral-100 shadow-2xl">
                    <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ backgroundColor: BRAND_BLUE }}>
                        <div className="min-w-0">
                            <div className="truncate text-base font-extrabold text-white">{title}</div>
                        </div>

                        <button
                            onClick={onClose}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white hover:bg-white/15"
                            aria-label="Cerrar"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="max-h-[72vh] overflow-auto p-5">{children}</div>

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

function Field({ label, icon: Icon, children }) {
    return (
        <div className="rounded-lg border border-white/10 bg-neutral-200/50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#131E5C]">
                {Icon ? <Icon className="h-4 w-4" /> : null}
                <span>{label}</span>
            </div>
            {children}
        </div>
    );
}

// ===== Fechas: API <-> input datetime-local =====
function toDTLocal(isoOrNull) {
    if (!isoOrNull) return "";
    const s = String(isoOrNull);

    if (s.endsWith("Z")) {
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return "";
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16);
    return "";
}

function fromDTLocalToISO(dtLocalOrEmpty) {
    const v = String(dtLocalOrEmpty || "").trim();
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

function FilterBlock({ label, children }) {
    return (
        <div className="rounded-lg">
            <div className="mb-2 text-xs font-extrabold tracking-wide text-[#131E5C]">{label}</div>
            {children}
        </div>
    );
}

function ContextMenu({ ctxMenu, onDelete, onClose }) {
    if (!ctxMenu.open || !ctxMenu.row) return null;

    return createPortal(
        <div className="fixed z-[9999]" style={{ left: ctxMenu.x, top: ctxMenu.y }} onClick={(e) => e.stopPropagation()}>
            <div className="w-48 overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl">
                <button
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(ctxMenu.row)}
                >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                </button>

                <button className="w-full px-4 py-2 text-left text-xs text-slate-500 hover:bg-slate-50" onClick={onClose}>
                    Cerrar
                </button>
            </div>
        </div>,
        document.body
    );
}
function MobileCardList({ rows, loading, onEdit, onContext, onToggleAsistencia, updatingInline }) {
    return (
        <div className="lg:hidden">
            <div className="overflow-hidden rounded-lg bg-white/[0.03] shadow-lg">
                {loading ? (
                    <div className="grid gap-3 p-3 sm:grid-cols-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="mt-3 h-4 w-28" />
                                <Skeleton className="mt-3 h-4 w-56" />
                                <Skeleton className="mt-4 h-8 w-24 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : rows.length === 0 ? (
                    <div className="px-4 py-10 text-center text-[#131E5C]">No hay resultados con esos filtros.</div>
                ) : (
                    <div className="grid gap-3 p-3 sm:grid-cols-2">
                        {rows.map((row) => {
                            const isUpdating = !!updatingInline[row.id];
                            const nombreCliente = row?.cliente?.nombre || "—";
                            const telCliente = row?.cliente?.telefono || "—";
                            const fecha = row.fecha_hora_cita ? toDTLocal(row.fecha_hora_cita).replace("T", " ") : "—";

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
                                                <span className="truncate">{fecha}</span>
                                            </div>
                                            <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                                                <Building2 className="h-4 w-4" />
                                                <span className="truncate">{row.agencia || "—"}</span>
                                            </div>
                                        </div>

                                        <button
                                            disabled={isUpdating}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleAsistencia(row);
                                            }}
                                            className={[
                                                "shrink-0 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold",
                                                row.asistencia
                                                    ? "bg-emerald-200 text-emerald-800 border-emerald-300"
                                                    : "bg-red-200 text-red-800 border-red-300",
                                                isUpdating ? "opacity-70 cursor-not-allowed" : "hover:opacity-90",
                                            ].join(" ")}
                                            title="Cambiar asistencia"
                                        >
                                            {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                            {row.asistencia ? "Sí" : "No"}
                                        </button>
                                    </div>

                                    <div className="mt-3 grid gap-2">
                                        <div className="flex items-center gap-2 text-sm font-bold text-[#131E5C]">
                                            <User className="h-4 w-4" />
                                            <span className="truncate">{nombreCliente}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <Phone className="h-4 w-4 text-[#131E5C]" />
                                            <span className="truncate">{telCliente}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <CarFront className="h-4 w-4 text-[#131E5C]" />
                                            <span className="truncate">{row.auto_interes || "—"}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <LayoutList className="h-4 w-4 text-[#131E5C]" />
                                            <span className="truncate">{row.tipo_cita || "—"}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <UserMinus className="h-4 w-4 text-[#131E5C]" />
                                            <span className="truncate">{row.asesor_digital || "—"}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <UserStar className="h-4 w-4 text-[#131E5C]" />
                                            <span className="truncate">{row.asesor_piso || "—"}</span>
                                        </div>

                                        <div className="mt-1 text-xs text-slate-600">
                                            <div className="flex items-start gap-2">
                                                <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-[#131E5C]" />
                                                <span className="line-clamp-2">{row.comentarios || "—"}</span>
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

export default function RegistroCitas() {
    const { user } = useAuth();

    // Igual que CrmCases
    const isAdmin = useMemo(() => {
        const permisos = user?.permisos || [];
        const rol = String(user?.rol || "").trim().toLowerCase();
        return rol === "administrador" || permisos.includes("CRM_DIGITALES") || permisos.includes("ALL") || permisos.includes("USUARIOS_ADMIN");
    }, [user]);

    const userAgencia = String(user?.agencia || "").trim();

    const [citas, setCitas] = useState([]);

    const DEALERS = useMemo(
        () => ["Volvo",],
        []
    );
    const ASESORES_DIGITALES = ["Mariana Tlamani"];
    const ASESORES = [
        "Enrique Vazquez Islas",
        "Ricardo Platas",
        "Verónica Del Rayo Galindo León",
        "Julio Camacho Barragán",
        "Fernanda Romero Aguilar"
    ];

    const FUENTE = [
        "Facebook",
        "WhatsApp",
        "VW-Concesionarios",
        "Llamada Entrante",
        "Prospeccion",
        "Cartera",
        "Eternizacion de credito",
        "Remarketing",
        "Base de Datos",
        "Ubicacion",
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

    const TIPO_CITA = ["Prueba de Manejo", "Tradicional", "Digital"];

    const [ctxMenu, setCtxMenu] = useState({ open: false, x: 0, y: 0, row: null });

    const [sort, setSort] = useState({ key: "fecha_hora_cita", dir: "desc" });
    function toggleSort(key) {
        setSort((prev) => {
            if (prev.key !== key) return { key, dir: "asc" };
            return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
        });
    }

    const [filters, setFilters] = useState(() => ({
        q: "",
        agencia: "Todos",
        asesorDigital: "Todos",
        rangoDesde: "",
        rangoHasta: "",
    }));

    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState("create");
    const [draft, setDraft] = useState(null);

    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);

    const REQUIRED = useMemo(
        () => ({
            cliente_telefono: "Teléfono",
            fecha_hora_cita: "Fecha y hora",
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
    // ✅ Validación teléfono (10 dígitos o 52 + 10 dígitos)
    const telDigits = useMemo(
        () => String(draft?.cliente_telefono || "").replace(/\D/g, ""),
        [draft?.cliente_telefono]
    );

    const telIsOk = useMemo(() => /^(?:\d{10}|52\d{10})$/.test(telDigits), [telDigits]);
    const telIsNormalized = useMemo(() => /^52\d{10}$/.test(telDigits), [telDigits]); // bandera visual

    const telError = useMemo(() => {
        if (!openModal) return "";
        if (!draft) return "";
        if (!telDigits) return ""; // required lo maneja missing

        if (/^\d{10}$/.test(telDigits)) return "";
        if (/^52\d{10}$/.test(telDigits)) return "";

        if (telDigits.length < 10) return "Número incompleto (mínimo 10 dígitos)";
        if (telDigits.length === 11) return "Número incorrecto (11 dígitos no válido)";
        if (telDigits.length === 12 && !telDigits.startsWith("52"))
            return "Número inválido: si tiene 12 dígitos debe iniciar con 52";
        if (telDigits.length > 12) return "Número incorrecto (máximo 12 dígitos)";
        return "Número inválido";
    }, [openModal, draft, telDigits]);

    const telInvalid = !!telError;
    const inputBase = "w-full rounded-lg border shadow-lg px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none";
    const inputOk = "border-black/10 bg-neutral-100";
    const inputBad = "border-red-500 bg-red-50";

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

    const onRowContextMenu = (e, row) => {
        e.preventDefault();
        e.stopPropagation();
        setCtxMenu({ open: true, x: e.clientX, y: e.clientY, row });
    };

    const refreshList = async () => {
        setLoadingList(true);
        try {
            const data = await apiCitas.list();
            setCitas(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setCitas([]);
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        refreshList();
    }, []);

    const dealers = useMemo(() => {
        const set = new Set((citas || []).map((c) => normalizeStr(c.agencia)).filter(Boolean));
        const all = ["Todos", ...Array.from(set)];
        if (!isAdmin && userAgencia) return ["Todos", userAgencia];
        return all;
    }, [citas, isAdmin, userAgencia]);

    const asesoresDigitalesFiltro = useMemo(() => {
        const set = new Set([
            ...ASESORES_DIGITALES.map((a) => normalizeStr(a)),
            ...(citas || []).map((c) => normalizeStr(c.asesor_digital)),
        ].filter(Boolean));

        return ["Todos", ...Array.from(set)];
    }, [citas]);

    const filtered = useMemo(() => {
        const q = filters.q.trim().toLowerCase();

        const desdeInt = ymdToInt(filters.rangoDesde);
        const hastaInt = ymdToInt(filters.rangoHasta);
        const minInt = desdeInt ?? null;
        const maxInt = hastaInt ?? null;

        return (citas || []).filter((c) => {
            if (!isAdmin && userAgencia && normalizeStr(c.agencia) !== normalizeStr(userAgencia)) return false;

            const nombreCliente = normalizeStr(c?.cliente?.nombre);
            const telCliente = normalizeStr(c?.cliente?.telefono);

            const matchQ =
                !q ||
                normalizeStr(c.agencia).toLowerCase().includes(q) ||
                nombreCliente.toLowerCase().includes(q) ||
                telCliente.toLowerCase().includes(q) ||
                normalizeStr(c.auto_interes).toLowerCase().includes(q) ||
                normalizeStr(c.tipo_cita).toLowerCase().includes(q) ||
                normalizeStr(c.fuente_prospeccion).toLowerCase().includes(q) ||
                normalizeStr(c.asesor_digital).toLowerCase().includes(q) ||
                normalizeStr(c.asesor_piso).toLowerCase().includes(q) ||
                normalizeStr(c.comentarios).toLowerCase().includes(q);

            const matchAgencia = filters.agencia === "Todos" || normalizeStr(c.agencia) === normalizeStr(filters.agencia);

            const matchAsesorDigital =
                filters.asesorDigital === "Todos" ||
                normalizeStr(c.asesor_digital) === normalizeStr(filters.asesorDigital);

            let matchRango = true;
            if (minInt !== null || maxInt !== null) {
                const ymdCita = c.fecha_hora_cita ? toYMDLocal(c.fecha_hora_cita) : "";
                const ymdInt = ymdToInt(ymdCita);
                if (!ymdInt) return false;
                if (minInt !== null && ymdInt < minInt) matchRango = false;
                if (maxInt !== null && ymdInt > maxInt) matchRango = false;
            }

            return matchQ && matchAgencia && matchAsesorDigital && matchRango;
        });
    }, [citas, filters, isAdmin, userAgencia]);

    const sorted = useMemo(() => {
        const data = [...filtered];
        const { key, dir } = sort || {};
        if (!key) return data;
        const mult = dir === "asc" ? 1 : -1;

        return data.sort((a, b) => {
            if (key === "fecha_hora_cita") {
                const ta = a.fecha_hora_cita ? new Date(a.fecha_hora_cita).getTime() : 0;
                const tb = b.fecha_hora_cita ? new Date(b.fecha_hora_cita).getTime() : 0;
                return (ta - tb) * mult;
            }
            const va = normalizeStr(a?.[key]).toLowerCase();
            const vb = normalizeStr(b?.[key]).toLowerCase();
            if (va < vb) return -1 * mult;
            if (va > vb) return 1 * mult;
            return 0;
        });
    }, [filtered, sort]);

    const openCreate = () => {
        setTouchedSave(false);
        setMode("create");

        const agenciaDefault = isAdmin ? "" : userAgencia;

        setDraft({
            id: null,
            cliente_id: null,

            agencia: agenciaDefault,
            cliente_nombre: "",
            cliente_telefono: "",

            auto_interes: "",
            fecha_hora_cita: "",
            asistencia: false,

            tipo_cita: "",
            fuente_prospeccion: "",
            asesor_digital: "",
            asesor_piso: "",
            comentarios: "",
        });
        setOpenModal(true);
    };

    const openEdit = async (row) => {
        if (!row?.id) return;
        try {
            setTouchedSave(false);
            setMode("edit");
            setLoadingDetail(true);
            setOpenModal(true);

            const c = await apiCitas.get(row.id);

            if (!isAdmin && userAgencia && normalizeStr(c.agencia) !== normalizeStr(userAgencia)) {
                alert("No tienes permisos para ver registros de otra agencia.");
                setOpenModal(false);
                return;
            }

            setDraft({
                id: c.id,
                cliente_id: c?.cliente?.id_cliente ?? null,

                agencia: c.agencia || (isAdmin ? "" : userAgencia),
                cliente_nombre: c?.cliente?.nombre || "",
                cliente_telefono: c?.cliente?.telefono || "",

                auto_interes: c.auto_interes || "",
                fecha_hora_cita: toDTLocal(c.fecha_hora_cita),
                asistencia: !!c.asistencia,

                tipo_cita: c.tipo_cita || "",
                fuente_prospeccion: c.fuente_prospeccion || "",
                asesor_digital: c.asesor_digital || "",
                asesor_piso: c.asesor_piso || "",

                comentarios: c.comentarios || "",
            });
        } catch (e) {
            console.error(e);
            alert("No se pudo abrir la cita (revisa consola).");
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

    const eliminarCita = async (row) => {
        if (!row?.id) return;

        if (!isAdmin && userAgencia && normalizeStr(row.agencia) !== normalizeStr(userAgencia)) {
            alert("No tienes permisos para eliminar registros de otra agencia.");
            return;
        }

        const ok = confirm(`¿Eliminar la cita de ${row?.cliente?.nombre || row?.cliente?.telefono || "cliente"}?`);
        if (!ok) return;

        try {
            await apiCitas.remove(row.id);
            setCitas((prev) => prev.filter((c) => c.id !== row.id));
            setCtxMenu({ open: false, x: 0, y: 0, row: null });
        } catch (e) {
            console.error(e);
            alert("No se pudo eliminar (revisa consola / backend).");
        }
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

                // ✅ cliente por relación (id_cliente) cuando exista
                ...(draft.cliente_id ? { cliente_id: draft.cliente_id } : {}),

                // ✅ input para crear/actualizar cliente (sin correo)
                nombre: draft.cliente_nombre || "",
                telefono: normalizeStr(draft.cliente_telefono),

                auto_interes: draft.auto_interes || "",
                fecha_hora_cita: fromDTLocalToISO(draft.fecha_hora_cita),
                asistencia: !!draft.asistencia,

                tipo_cita: draft.tipo_cita || "",
                fuente_prospeccion: draft.fuente_prospeccion || "",
                asesor_digital: draft.asesor_digital || "",
                asesor_piso: draft.asesor_piso || "",
                comentarios: draft.comentarios || "",
            };

            if (mode === "create") await apiCitas.create(payload);
            else await apiCitas.update(draft.id, payload);

            await refreshList();
            closeModal();
        } catch (e) {
            console.error(e);
            alert("Error guardando la cita (revisa consola).");
        } finally {
            setSaving(false);
        }
    };

    const [updatingInline, setUpdatingInline] = useState({});
    const toggleAsistenciaInline = async (row) => {
        const id = row?.id;
        if (!id) return;

        if (!isAdmin && userAgencia && normalizeStr(row.agencia) !== normalizeStr(userAgencia)) {
            alert("No tienes permisos para modificar registros de otra agencia.");
            return;
        }

        const prev = !!row.asistencia;

        setCitas((p) => p.map((c) => (c.id === id ? { ...c, asistencia: !prev } : c)));
        setUpdatingInline((p) => ({ ...p, [id]: true }));

        try {
            await apiCitas.patch(id, { asistencia: !prev });
        } catch (e) {
            console.error(e);
            setCitas((p) => p.map((c) => (c.id === id ? { ...c, asistencia: prev } : c)));
            alert("No se pudo actualizar asistencia (revisa backend).");
        } finally {
            setUpdatingInline((p) => {
                const n = { ...p };
                delete n[id];
                return n;
            });
        }
    };

    const resetFilters = () =>
        setFilters({
            q: "",
            agencia: "Todos",
            asesorDigital: "Todos",
            rangoDesde: "",
            rangoHasta: "",
        });

    const setHoy = () => {
        const hoy = toYMDLocal(new Date());
        setFilters((p) => ({ ...p, rangoDesde: hoy, rangoHasta: hoy }));
    };

    return (
        <div className="w-full">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="font-vw-header truncate text-lg font-extrabold text-[#131E5C]">Citas</h2>
                    {!isAdmin && userAgencia ? (
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Agencia asignada: <span className="text-[#131E5C]">{userAgencia}</span>
                        </p>
                    ) : null}
                </div>

                <button
                    onClick={openCreate}
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm bg-[#131E5C] hover:bg-[#131E5C]/80 text-white shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    Nueva Cita
                </button>
            </div>

            <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="grid gap-3 md:grid-cols-12">
                    <div className="md:col-span-3">
                        <FilterBlock label="Búsqueda">
                            <div className="flex items-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2">
                                <Search className="h-4 w-4 text-[#131E5C]" />
                                <input
                                    value={filters.q}
                                    onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                                    placeholder="Buscar por dealer, cliente, teléfono, serie, folio, asesor…"
                                    className="w-full text-sm text-[#131E5C] outline-none placeholder:text-[#131E5C]"
                                />
                                {filters.q ? (
                                    <button
                                        onClick={() => setFilters((p) => ({ ...p, q: "" }))}
                                        className="rounded-lg p-1 bg-white text-[#131E5C] hover:bg-white/80 hover:text-red-500"
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
                                onChange={(e) => setFilters((p) => ({ ...p, agencia: e.target.value }))}
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            >
                                {dealers.map((d) => (
                                    <option key={d} value={d} className="bg-neutral-100 text-[#131E5C]">
                                        {d}
                                    </option>
                                ))}
                            </select>
                        </FilterBlock>
                    </div>
                    <div className="md:col-span-3">
                        <FilterBlock label="Asesor Digital">
                            <select
                                value={filters.asesorDigital}
                                onChange={(e) => setFilters((p) => ({ ...p, asesorDigital: e.target.value }))}
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            >
                                {asesoresDigitalesFiltro.map((a) => (
                                    <option key={a} value={a} className="bg-neutral-100 text-[#131E5C]">
                                        {a}
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
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                                    title="Mostrar solo registros del día de hoy"
                                >
                                    <CalendarDays className="h-4 w-4" />
                                    Hoy
                                </button>
                                <button
                                    onClick={resetFilters}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#131E5C] px-3 py-2 text-sm font-semibold bg-white text-[#131E5C] hover:text-white hover:bg-[#131E5C]"
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

            {/* MOBILE / TABLET */}
            <MobileCardList
                rows={sorted}
                loading={loadingList}
                onEdit={openEdit}
                onContext={onRowContextMenu}
                onToggleAsistencia={toggleAsistenciaInline}
                updatingInline={updatingInline}
            />

            {/* DESKTOP */}
            <div className="hidden overflow-hidden rounded-lg shadow-lg bg-white/[0.03] lg:block">
                <div className="overflow-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="font-vw-header text-xs bg-[#131E5C] text-white border border-black">
                            <tr>
                                <th className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("fecha_hora_cita")}
                                        className="inline-flex items-center gap-1 text-xs font-bold"
                                    >
                                        Fecha y Hora Cita
                                        <span className="opacity-60">
                                            {sort.key === "fecha_hora_cita" ? (
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

                                <th className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("agencia")}
                                        className="inline-flex items-center gap-1 text-xs font-bold"
                                    >
                                        Dealer
                                        <span className="opacity-60">
                                            {sort.key === "agencia" ? (
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

                                <th className="px-4 py-3">Cliente</th>
                                <th className="px-4 py-3">Auto interés</th>
                                <th className="px-4 py-3">Asesor Digital</th>
                                <th className="px-4 py-3">Asesor Piso</th>
                                <th className="px-4 py-3">Tipo Cita</th>
                                <th className="px-4 py-3">Comentarios</th>
                                <th className="px-4 py-3">¿Asistió?</th>
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
                                    {sorted.map((row) => {
                                        const isUpdating = !!updatingInline[row.id];
                                        const nombreCliente = row?.cliente?.nombre || "—";

                                        return (
                                            <tr
                                                key={row.id}
                                                onDoubleClick={() => openEdit(row)}
                                                onContextMenu={(e) => onRowContextMenu(e, row)}
                                                className="cursor-pointer hover:bg-white/[0.04]"
                                                title="Doble clic para editar"
                                            >
                                                <td className="px-4 py-3 text-[#131E5C]">
                                                    {row.fecha_hora_cita ? toDTLocal(row.fecha_hora_cita).replace("T", " ") : "—"}
                                                </td>

                                                <td className="px-4 py-3 font-semibold text-[#131E5C]">{row.agencia || "—"}</td>

                                                <td className="px-4 py-3 text-[#131E5C]">
                                                    <div className="font-bold">{nombreCliente}</div>
                                                </td>

                                                <td className="px-4 py-3 text-[#131E5C]">{row.auto_interes || "—"}</td>
                                                <td className="px-4 py-3 text-[#131E5C]">{row.asesor_digital}</td>
                                                <td className="px-4 py-3 text-[#131E5C]">{row.asesor_piso || "--"}</td>
                                                <td className="px-4 py-3 text-[#131E5C]">{row.tipo_cita || "—"}</td>
                                                <td className="px-4 py-3 text-[#131E5C]">
                                                    <span className="line-clamp-2">{row.comentarios || "—"}</span>
                                                </td>

                                                <td className="px-4 py-3 text-[#131E5C]">
                                                    <button
                                                        disabled={isUpdating}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleAsistenciaInline(row);
                                                        }}
                                                        className={[
                                                            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold",
                                                            row.asistencia
                                                                ? "bg-emerald-200 text-emerald-800 border-emerald-300"
                                                                : "bg-red-200 text-red-800 border-red-300",
                                                            isUpdating ? "opacity-70 cursor-not-allowed" : "hover:opacity-90",
                                                        ].join(" ")}
                                                        title="Click para cambiar asistencia"
                                                    >
                                                        {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                                        {row.asistencia ? "Sí" : "No"}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {sorted.length === 0 ? (
                                        <tr>
                                            {/* 9 columnas */}
                                            <td colSpan={9} className="px-4 py-10 text-center text-[#131E5C]">
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
                            await eliminarCita(row);
                            setCtxMenu({ open: false, x: 0, y: 0, row: null });
                        }}
                        onClose={() => setCtxMenu({ open: false, x: 0, y: 0, row: null })}
                    />
                </div>
            </div>

            {/* MODAL */}
            <Modal
                open={openModal}
                title={mode === "create" ? "Nueva Cita" : `Editar Cita • ${draft?.id}`}
                onClose={closeModal}
                footer={
                    <>
                        <button
                            onClick={closeModal}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-red-400 px-4 py-2 text-sm font-semibold text-white/90 hover:text-white hover:bg-red-600 disabled:opacity-60"
                        >
                            <X className="h-4 w-4" />
                            Cancelar
                        </button>

                        <button
                            onClick={save}
                            disabled={saving || loadingDetail || telInvalid || (draft?.cliente_telefono ? !telIsOk : false)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 bg-[#131E5C]/85 py-2 text-sm font-bold text-white/90 hover:bg-[#131E5C] hover:text-white disabled:opacity-60"
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
                        <div className="md:col-span-3">
                            <Field label="Tipo de cita" icon={LayoutList}>
                                <select
                                    value={draft.tipo_cita || ""}
                                    onChange={(e) => setDraft((p) => ({ ...p, tipo_cita: e.target.value }))}
                                    className={[inputBase, inputOk].join(" ")}
                                >
                                    <option value="" disabled>
                                        Selecciona un tipo de cita...
                                    </option>
                                    {TIPO_CITA.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        </div>

                        <Field label="Dealer" icon={Building2}>
                            <select
                                value={draft.agencia || ""}
                                onChange={(e) => setDraft((p) => ({ ...p, agencia: e.target.value }))}
                                disabled={!isAdmin}
                                className={[inputBase, inputOk, !isAdmin ? "opacity-75 cursor-not-allowed" : ""].join(" ")}
                            >
                                <option value="" disabled>
                                    Selecciona un dealer...
                                </option>
                                {(isAdmin ? DEALERS : userAgencia ? [userAgencia] : DEALERS).map((d) => (
                                    <option key={d} value={d}>
                                        {d}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Nombre del cliente" icon={User}>
                            <input
                                value={draft.cliente_nombre}
                                onChange={(e) => setDraft((p) => ({ ...p, cliente_nombre: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")}
                                placeholder="Nombre completo"
                            />
                        </Field>

                        <Field label="Teléfono" icon={Phone}>
                            <input
                                maxLength={12}
                                value={draft.cliente_telefono}
                                onChange={(e) =>
                                    setDraft((p) => ({
                                        ...p,
                                        cliente_telefono: e.target.value.replace(/\D/g, "").slice(0, 12),
                                    }))
                                }
                                disabled={mode === "edit" || telIsNormalized}
                                className={[
                                    inputBase,
                                    (isInvalid("cliente_telefono") || telInvalid) ? inputBad : inputOk,
                                    (mode === "edit" || telIsNormalized) ? "opacity-75 cursor-not-allowed" : "",
                                ].join(" ")}
                            />
                            {isInvalid("cliente_telefono") ? (
                                <div className="mt-2 text-xs font-bold text-red-600">Teléfono es requerido.</div>
                            ) : null}

                            {!isInvalid("cliente_telefono") && telError ? (
                                <div className="mt-2 text-xs font-bold text-red-600">{telError}</div>
                            ) : null}
                        </Field>

                        <Field label="VW de sus sueños" icon={CarFront}>
                            <select
                                value={draft.auto_interes || ""}
                                onChange={(e) => setDraft((p) => ({ ...p, auto_interes: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")}
                            >
                                <option value="" disabled>
                                    Selecciona un modelo...
                                </option>
                                {VEHICULOS.map((d) => (
                                    <option key={d} value={d}>
                                        {d}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Fecha y Hora de cita" icon={CalendarDays}>
                            <input
                                type="datetime-local"
                                value={draft.fecha_hora_cita}
                                onChange={(e) => setDraft((p) => ({ ...p, fecha_hora_cita: e.target.value }))}
                                className={[inputBase, isInvalid("fecha_hora_cita") ? inputBad : inputOk].join(" ")}
                            />
                            {isInvalid("fecha_hora_cita") ? (
                                <div className="mt-2 text-xs font-bold text-red-600">Fecha y hora es requerido.</div>
                            ) : null}
                        </Field>

                        <Field label="Fuente de Prospección" icon={UserSearch}>
                            <select
                                value={draft.fuente_prospeccion || ""}
                                onChange={(e) => setDraft((p) => ({ ...p, fuente_prospeccion: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")}
                            >
                                <option value="" disabled>
                                    Selecciona una fuente ...
                                </option>
                                {FUENTE.map((d) => (
                                    <option key={d} value={d}>
                                        {d}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Asistencia de cita" icon={UserCheck}>
                            <label className="flex items-center gap-3 text-sm font-semibold text-[#131E5C]">
                                <input
                                    type="checkbox"
                                    checked={!!draft.asistencia}
                                    onChange={(e) => setDraft((p) => ({ ...p, asistencia: e.target.checked }))}
                                    className="h-4 w-4"
                                />
                                ¿Asistió?
                            </label>
                        </Field>

                        <Field label="Asesor Digital" icon={UserMinus}>
                            <select
                                value={draft.asesor_digital || ""}
                                onChange={(e) => setDraft((p) => ({ ...p, asesor_digital: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")}
                            >
                                <option value="" disabled>
                                    Selecciona un asesor ...
                                </option>
                                {ASESORES_DIGITALES.map((d) => (
                                    <option key={d} value={d}>
                                        {d}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Asesor Piso" icon={UserStar}>
                            <select
                                value={draft.asesor_piso || ""}
                                onChange={(e) => setDraft((p) => ({ ...p, asesor_piso: e.target.value }))}
                                className={[inputBase, inputOk].join(" ")}
                            >
                                <option value="" disabled>
                                    Selecciona un asesor ...
                                </option>
                                {ASESORES.map((d) => (
                                    <option key={d} value={d}>
                                        {d}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <div className="md:col-span-3">
                            <Field label="Comentarios" icon={MessageSquareText}>
                                <textarea
                                    value={draft.comentarios}
                                    onChange={(e) => setDraft((p) => ({ ...p, comentarios: e.target.value }))}
                                    className={[inputBase, inputOk, "min-h-[110px]"].join(" ")}
                                    placeholder="Notas internas..."
                                />
                            </Field>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}