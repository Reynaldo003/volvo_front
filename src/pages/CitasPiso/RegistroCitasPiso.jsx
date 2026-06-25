// src/pages/CitasPiso/RegistroCitasPiso.jsx
import { useMemo, useState, useEffect, useRef } from "react";
import {
    Plus, Search, X, Save, User, CarFront, CalendarDays,
    ArrowUpDown, ChevronDown, ChevronUp, Trash2, Loader2,
    Phone, UserCheck, UserSearch, UserStar, Building2,
    MessageSquareText, LayoutList, CalendarRange, BarChart2,
    ChevronLeft, ChevronRight, CheckCircle2, Clock,
    Car, MessageSquare, Hash, Zap, Circle, XCircle,
} from "lucide-react";
import { apiCitasPiso } from "../../lib/apiCitasPiso";
import { createPortal } from "react-dom";
import { useAuth } from "../../auth/AuthContext";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";

// ─── constantes ───────────────────────────────────────────────────────────────
const MESES      = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_SEMANA= ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const DIAS_CORTOS= ["LUN","MAR","MIÉ","JUE","VIE","SÁB","DOM"];

const VIEWS = [
    { key: "tabla",    label: "Tabla",   Icon: LayoutList   },
    { key: "agenda",   label: "Agenda",  Icon: CalendarRange },
    { key: "graficas", label: "Gráficas",Icon: BarChart2     },
];

const DEALERS  = ["Volvo"];
const ASESORES = [
    "Enrique Vazquez Islas","Ricardo Platas",
    "Verónica Del Rayo Galindo León","Julio Camacho Barragán","Fernanda Romero Aguilar",
];
const FUENTE = [
    "Facebook","WhatsApp","VW-Concesionarios","Llamada Entrante","Prospeccion",
    "Cartera","Eternizacion de credito","Remarketing","Base de Datos","Ubicacion",
];
const VEHICULOS = [
    "EX30","EX40","EC40","EX90","XC60","XC90",
    "XC60 Black Edition","XC90 Black Edition","Seminuevos","Avaluo",
];

// ─── helpers generales ────────────────────────────────────────────────────────
const PAD = (n) => String(n).padStart(2, "0");
function normalizeStr(v) { return String(v ?? "").trim(); }

function parseLocalDT(raw) {
    if (!raw) return null;
    const d = new Date(String(raw));
    return isNaN(d.getTime()) ? null : d;
}
function localYMD(date) {
    return `${date.getFullYear()}-${PAD(date.getMonth() + 1)}-${PAD(date.getDate())}`;
}
function localHHMM(date) { return `${PAD(date.getHours())}:${PAD(date.getMinutes())}`; }
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function startOfWeek(date) {
    const d = new Date(date);
    const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}
function toDTLocal(isoOrNull) {
    if (!isoOrNull) return "";
    const s = String(isoOrNull);
    if (s.endsWith("Z")) {
        const d = new Date(s); if (Number.isNaN(d.getTime())) return "";
        return `${d.getFullYear()}-${PAD(d.getMonth()+1)}-${PAD(d.getDate())}T${PAD(d.getHours())}:${PAD(d.getMinutes())}`;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0,16);
    return "";
}
function fromDTLocalToISO(v) { return String(v||"").trim() || null; }
function toYMDLocal(dateLike) {
    const d = new Date(dateLike); if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${PAD(d.getMonth()+1)}-${PAD(d.getDate())}`;
}
function ymdToInt(ymd) {
    if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
    return Number(ymd.replaceAll("-",""));
}

// ─── Colores kanban por Be Back ───────────────────────────────────────────────
const BB_COLOR = {
    yes: { card:"bg-emerald-50 border-emerald-200", accent:"border-l-emerald-500", header:"bg-emerald-100", name:"text-emerald-900", meta:"text-emerald-700" },
    no:  { card:"bg-red-50 border-red-200",         accent:"border-l-red-400",     header:"bg-red-100",     name:"text-red-900",     meta:"text-red-700"     },
    nil: { card:"bg-slate-50 border-slate-200",     accent:"border-l-slate-400",   header:"bg-slate-100",   name:"text-slate-900",   meta:"text-slate-600"   },
};
function colorFor(beBack) {
    if (beBack === true)  return BB_COLOR.yes;
    if (beBack === false) return BB_COLOR.no;
    return BB_COLOR.nil;
}

// ─── micro-components ─────────────────────────────────────────────────────────
function Skeleton({ className="" }) {
    return <div className={["animate-pulse rounded-md bg-black/10", className].join(" ")} />;
}
function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({length:8}).map((_,i) => (
                <td key={i} className="px-4 py-3"><div className="h-4 w-28 rounded bg-slate-200/60"/></td>
            ))}
        </tr>
    );
}
function ModalSkeleton() {
    return (
        <div className="grid gap-3 md:grid-cols-2">
            {Array.from({length:8}).map((_,i) => (
                <div key={i} className="rounded-xl border border-black/8 bg-white p-4">
                    <Skeleton className="h-3.5 w-28"/><Skeleton className="mt-3 h-10 w-full rounded-lg"/>
                </div>
            ))}
        </div>
    );
}

function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;
    return createPortal(
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/45" onClick={onClose}/>
            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-black/10 bg-white">
                    <div className="flex items-center justify-between gap-3 border-b border-black/8 px-6 py-4">
                        <div className="truncate text-[15px] font-medium text-black">{title}</div>
                        <button onClick={onClose}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-black/40 transition hover:bg-black/5 hover:text-black">
                            <X className="h-4 w-4"/>
                        </button>
                    </div>
                    <div className="max-h-[72vh] overflow-auto px-6 py-5">{children}</div>
                    {footer && (
                        <div className="flex flex-col gap-2 border-t border-black/8 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

function Field({ label, icon: Icon, children }) {
    return (
        <div className="rounded-xl border border-black/8 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-[13px] font-medium text-black/55">
                {Icon && <Icon className="h-3.5 w-3.5 text-black/35"/>}
                <span>{label}</span>
            </div>
            {children}
        </div>
    );
}
function FilterBlock({ label, children }) {
    return (
        <div>
            <div className="mb-2 text-xs font-extrabold tracking-wide text-black">{label}</div>
            {children}
        </div>
    );
}
function ContextMenu({ ctxMenu, onDelete, onClose }) {
    if (!ctxMenu.open || !ctxMenu.row) return null;
    return createPortal(
        <div className="fixed z-[9999]" style={{left:ctxMenu.x,top:ctxMenu.y}} onClick={e=>e.stopPropagation()}>
            <div className="w-48 overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl">
                <button className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                    onClick={()=>onDelete(ctxMenu.row)}>
                    <Trash2 className="h-4 w-4"/> Eliminar
                </button>
                <button className="w-full px-4 py-2 text-left text-xs text-slate-500 hover:bg-slate-50" onClick={onClose}>Cerrar</button>
            </div>
        </div>,
        document.body
    );
}

// ─── Badge Be Back ────────────────────────────────────────────────────────────
function BeBackBadge({ value }) {
    if (value === true)
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-800 whitespace-nowrap">
                <CheckCircle2 className="h-3 w-3" /> Be Back
            </span>
        );
    if (value === false)
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 border border-red-300 px-2 py-0.5 text-[10px] font-bold text-red-700 whitespace-nowrap">
                <XCircle className="h-3 w-3" /> No regresó
            </span>
        );
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-300 px-2 py-0.5 text-[10px] font-bold text-slate-600 whitespace-nowrap">
            <Circle className="h-3 w-3" /> Sin definir
        </span>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  VISTA AGENDA — KANBAN SEMANAL (reemplaza AgendaView anterior)
// ═══════════════════════════════════════════════════════════════════════════════

// Tarjeta de ingreso
function PisoCard({ registro, onOpenEdit }) {
    const dt = parseLocalDT(registro.fecha_hora_cita);
    if (!dt) return null;
    const c = colorFor(registro.be_back);

    return (
        <div
            onClick={() => onOpenEdit(registro)}
            className={[
                "w-full rounded-lg border border-l-4 overflow-hidden cursor-pointer",
                "transition-all duration-150 hover:shadow-md hover:brightness-[.97]",
                c.card, c.accent,
            ].join(" ")}
        >
            {/* Cabecera */}
            <div className={["flex items-center justify-between gap-2 px-2.5 py-1.5", c.header].join(" ")}>
                <span className="text-[11px] font-extrabold text-black/70 shrink-0">
                    {localHHMM(dt)}
                </span>
                <BeBackBadge value={registro.be_back} />
            </div>

            {/* Cuerpo */}
            <div className="px-2.5 py-2 space-y-1.5">
                <p className={["text-[12px] font-extrabold leading-snug", c.name].join(" ")}>
                    {registro?.cliente?.nombre || "Cliente sin nombre"}
                </p>

                {registro.auto_interes && (
                    <div className={["flex items-center gap-1.5 text-[11px] font-semibold", c.meta].join(" ")}>
                        <Car className="h-3 w-3 shrink-0 opacity-70" />
                        <span>{registro.auto_interes}</span>
                    </div>
                )}

                {registro?.cliente?.telefono && (
                    <div className={["flex items-center gap-1.5 text-[11px]", c.meta].join(" ")}>
                        <Phone className="h-3 w-3 shrink-0 opacity-70" />
                        <span>{registro.cliente.telefono}</span>
                    </div>
                )}

                {registro.agencia && (
                    <div className={["flex items-center gap-1.5 text-[11px]", c.meta].join(" ")}>
                        <Building2 className="h-3 w-3 shrink-0 opacity-70" />
                        <span>{registro.agencia}</span>
                    </div>
                )}

                {(registro.asesor_piso || registro.fuente_prospeccion) && (
                    <div className="border-t border-black/[.07] pt-1 space-y-1">
                        {registro.asesor_piso && (
                            <div className={["flex items-start gap-1.5 text-[10px]", c.meta].join(" ")}>
                                <UserStar className="h-3 w-3 shrink-0 opacity-60 mt-px" />
                                <span><span className="opacity-60">Asesor: </span>{registro.asesor_piso}</span>
                            </div>
                        )}
                        {registro.fuente_prospeccion && (
                            <div className={["flex items-start gap-1.5 text-[10px]", c.meta].join(" ")}>
                                <Zap className="h-3 w-3 shrink-0 opacity-60 mt-px" />
                                <span><span className="opacity-60">Fuente: </span>{registro.fuente_prospeccion}</span>
                            </div>
                        )}
                    </div>
                )}

                {registro.folio && (
                    <div className={["flex items-center gap-1.5 text-[10px] border-t border-black/[.07] pt-1", c.meta].join(" ")}>
                        <Hash className="h-3 w-3 shrink-0 opacity-60" />
                        <span><span className="opacity-60">Folio: </span>{registro.folio}</span>
                    </div>
                )}

                {registro.comentarios_cliente && (
                    <div className={["flex items-start gap-1.5 text-[10px] border-t border-black/[.07] pt-1", c.meta].join(" ")}>
                        <MessageSquare className="h-3 w-3 shrink-0 opacity-60 mt-px" />
                        <span className="leading-relaxed opacity-80 break-words whitespace-normal">
                            {registro.comentarios_cliente}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

// Columna de un día
function DayColumn({ day, registros, isToday, onOpenEdit }) {
    const bebacks   = registros.filter((r) => r.be_back === true).length;
    const noRegreso = registros.filter((r) => r.be_back === false).length;

    return (
        <div className={["border-l border-black/[.07]", isToday ? "bg-blue-50/20" : "bg-white"].join(" ")}>
            {/* Cabecera sticky */}
            <div className={[
                "sticky top-0 z-10 flex flex-col items-center py-2 px-1 border-b border-black/[.07] backdrop-blur-sm",
                isToday ? "bg-blue-50/80" : "bg-white/95",
            ].join(" ")}>
                <span className="text-[9px] font-extrabold tracking-widest text-black/40">
                    {DIAS_CORTOS[(day.getDay() + 6) % 7]}
                </span>
                <span className={[
                    "flex h-7 w-7 items-center justify-center rounded-full text-sm font-extrabold mt-0.5",
                    isToday ? "bg-black text-white" : "text-black",
                ].join(" ")}>
                    {day.getDate()}
                </span>
                {registros.length > 0 ? (
                    <div className="flex flex-col items-center gap-0.5 mt-0.5">
                        <span className="text-[9px] font-bold text-black/40">
                            {registros.length} ingreso{registros.length > 1 ? "s" : ""}
                        </span>
                        <div className="flex items-center gap-1">
                            {bebacks > 0 && (
                                <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-px rounded-full border border-emerald-200">
                                    ✓ {bebacks}
                                </span>
                            )}
                            {noRegreso > 0 && (
                                <span className="text-[8px] font-bold text-red-600 bg-red-50 px-1.5 py-px rounded-full border border-red-200">
                                    ✗ {noRegreso}
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    <span className="h-3.5" />
                )}
            </div>

            {/* Tarjetas */}
            <div className="p-1.5">
                {registros.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-[10px] text-black/20 font-semibold">
                        Sin ingresos
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {registros
                            .slice()
                            .sort((a, b) => {
                                const da = parseLocalDT(a.fecha_hora_cita);
                                const db = parseLocalDT(b.fecha_hora_cita);
                                return (da?.getTime() ?? 0) - (db?.getTime() ?? 0);
                            })
                            .map((r) => (
                                <PisoCard key={r.id} registro={r} onOpenEdit={onOpenEdit} />
                            ))
                        }
                    </div>
                )}
            </div>
        </div>
    );
}

// Kanban semanal completo
function KanbanAgenda({ filtered, onOpenEdit, onOpenCreate, loading }) {
    const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
    const [search,    setSearch]    = useState("");

    const weekDays = useMemo(
        () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
        [weekStart]
    );
    const todayYMD = localYMD(new Date());

    const headerLabel = useMemo(() => {
        const from = weekDays[0], to = weekDays[6];
        if (from.getMonth() === to.getMonth())
            return `${from.getDate()} – ${to.getDate()} de ${MESES[from.getMonth()]} ${from.getFullYear()}`;
        return `${from.getDate()} ${MESES[from.getMonth()].slice(0,3)} – ${to.getDate()} ${MESES[to.getMonth()].slice(0,3)} ${to.getFullYear()}`;
    }, [weekDays]);

    // Búsqueda local dentro de la agenda
    const searched = useMemo(() => {
        if (!search.trim()) return filtered;
        const q = search.toLowerCase();
        return filtered.filter((r) =>
            r?.cliente?.nombre?.toLowerCase().includes(q)    ||
            r?.cliente?.telefono?.includes(q)                ||
            r?.agencia?.toLowerCase().includes(q)            ||
            r?.asesor_piso?.toLowerCase().includes(q)        ||
            r?.fuente_prospeccion?.toLowerCase().includes(q) ||
            r?.auto_interes?.toLowerCase().includes(q)       ||
            r?.folio?.toLowerCase().includes(q)
        );
    }, [filtered, search]);

    const byDay = useMemo(() => {
        const map = {};
        searched.forEach((r) => {
            const dt = parseLocalDT(r.fecha_hora_cita);
            if (!dt) return;
            const key = localYMD(dt);
            if (!map[key]) map[key] = [];
            map[key].push(r);
        });
        return map;
    }, [searched]);

    const weekStats = useMemo(() => {
        const ymds = new Set(weekDays.map(localYMD));
        const wk   = searched.filter((r) => {
            const dt = parseLocalDT(r.fecha_hora_cita);
            return dt && ymds.has(localYMD(dt));
        });
        return {
            total:   wk.length,
            bebacks: wk.filter((r) => r.be_back === true).length,
            noBack:  wk.filter((r) => r.be_back === false).length,
        };
    }, [searched, weekDays]);

    return (
        <div
            className="rounded-xl border border-black/10 bg-white shadow-sm overflow-hidden flex flex-col"
            style={{ height: "calc(100vh - 310px)", minHeight: 480 }}
        >
            {/* Top bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-black/10 shrink-0 flex-wrap">
                {/* Búsqueda */}
                <div className="flex items-center gap-2 flex-1 min-w-[180px] max-w-xs border border-black/15 rounded-lg px-3 py-1.5 bg-slate-50">
                    <Search className="h-3.5 w-3.5 text-black/30 shrink-0" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar en la semana…"
                        className="flex-1 bg-transparent text-xs outline-none text-black placeholder:text-black/30"
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="text-black/30 hover:text-black/60">
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>

                {/* Nav semana */}
                <div className="flex items-center gap-1.5 ml-auto">
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-black/30" />}
                    <button
                        onClick={() => setWeekStart((d) => addDays(d, -7))}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-black/15 hover:bg-black hover:text-white transition"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-extrabold text-black min-w-[200px] text-center">
                        {headerLabel}
                    </span>
                    <button
                        onClick={() => setWeekStart((d) => addDays(d, +7))}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-black/15 hover:bg-black hover:text-white transition"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setWeekStart(startOfWeek(new Date()))}
                        className="rounded-lg border border-black px-3 py-1.5 text-xs font-extrabold hover:bg-black hover:text-white transition ml-1"
                    >
                        Hoy
                    </button>
                    <button
                        onClick={onOpenCreate}
                        className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-xs font-bold text-white hover:bg-black/80 transition"
                    >
                        <Plus className="h-3.5 w-3.5" /> Nuevo ingreso
                    </button>
                </div>
            </div>

            {/* Leyenda + stats */}
            <div className="flex items-center gap-4 px-4 py-2 border-b border-black/[.06] shrink-0 bg-slate-50/50 flex-wrap">
                <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-semibold text-black/50">Be Back</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                    <span className="text-[10px] font-semibold text-black/50">No regresó</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    <span className="text-[10px] font-semibold text-black/50">Sin definir</span>
                </div>
                <div className="ml-auto flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-black/30 font-semibold">
                        {weekStats.total} ingreso{weekStats.total !== 1 ? "s" : ""} esta semana
                    </span>
                    {weekStats.bebacks > 0 && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            ✓ {weekStats.bebacks} Be Back
                        </span>
                    )}
                    {weekStats.noBack > 0 && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            ✗ {weekStats.noBack} no regresaron
                        </span>
                    )}
                    {weekStats.total > 0 && (
                        <span className="text-[10px] font-bold text-black/40 bg-black/5 px-2 py-0.5 rounded-full">
                            {Math.round((weekStats.bebacks / weekStats.total) * 100)}% tasa BB
                        </span>
                    )}
                </div>
            </div>

            {/* Grid kanban */}
            <div className="flex-1 overflow-x-auto overflow-y-auto">
                <div className="grid" style={{ gridTemplateColumns: "repeat(7, minmax(160px, 1fr))" }}>
                    {weekDays.map((day) => {
                        const ymd     = localYMD(day);
                        const isToday = ymd === todayYMD;
                        return (
                            <DayColumn
                                key={ymd}
                                day={day}
                                registros={byDay[ymd] || []}
                                isToday={isToday}
                                onOpenEdit={onOpenEdit}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── VISTA GRÁFICAS ───────────────────────────────────────────────────────────
function TooltipCustom({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-black/10 bg-white p-3 text-xs shadow-md">
            <div className="mb-1 font-extrabold text-black">{label}</div>
            {payload.map(p => (
                <div key={p.dataKey} className="flex items-center justify-between gap-6">
                    <span className="text-slate-500">{p.name}</span>
                    <span className="font-bold text-black">{p.value}</span>
                </div>
            ))}
        </div>
    );
}

function GraficasView({ registros }) {
    const total     = registros.length;
    const bebacks   = registros.filter(r=>r.be_back).length;
    const sinBeback = total - bebacks;

    const trendData = useMemo(() => {
        const hoy = new Date();
        return Array.from({length:7},(_,i)=>{
            const d = new Date(hoy); d.setDate(d.getDate()-(6-i));
            const key = toYMDLocal(d);
            const count = registros.filter(r=>r.fecha_hora_cita && toYMDLocal(r.fecha_hora_cita)===key).length;
            return { name: DIAS_SEMANA[d.getDay()], citas: count };
        });
    },[registros]);

    const porAsesor = useMemo(()=>{
        const map={};
        registros.forEach(r=>{ const k=(r.asesor_piso||"Sin asignar").split(" ").slice(0,2).join(" "); map[k]=(map[k]||0)+1; });
        return Object.entries(map).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,5);
    },[registros]);

    const porFuente = useMemo(()=>{
        const map={};
        registros.forEach(r=>{ const k=r.fuente_prospeccion||"Sin fuente"; map[k]=(map[k]||0)+1; });
        return Object.entries(map).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
    },[registros]);

    const porAuto = useMemo(()=>{
        const map={};
        registros.forEach(r=>{ const k=r.auto_interes||"—"; map[k]=(map[k]||0)+1; });
        return Object.entries(map).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,6);
    },[registros]);

    const pieData = [{ name:"Be Back", value:bebacks },{ name:"No regresó", value:sinBeback }];
    const card = "rounded-2xl border border-black/10 bg-white p-5 shadow-sm";

    return (
        <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { label:"Total ingresos",  value:total,    bg:"#1a1a1a" },
                    { label:"Be Back",          value:bebacks,  bg:"#2d5a27" },
                    { label:"No regresaron",    value:sinBeback,bg:"#5a2727" },
                    { label:"Tasa Be Back",     value:total>0?Math.round((bebacks/total)*100)+"%":"0%", bg:"#2d3a1e" },
                ].map(k=>(
                    <div key={k.label} className="relative overflow-hidden rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl" style={{background:k.bg,opacity:0.15}}/>
                        <div className="text-[11px] font-extrabold uppercase tracking-wide text-black/50">{k.label}</div>
                        <div className="mt-1 text-3xl font-extrabold text-black">{k.value}</div>
                    </div>
                ))}
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
                <div className={"lg:col-span-2 "+card}>
                    <p className="mb-1 text-sm font-extrabold text-black">Ingresos últimos 7 días</p>
                    <p className="mb-4 text-xs text-black/40">Citas registradas por día</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={trendData} margin={{top:5,right:10,left:-20,bottom:0}}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                            <XAxis dataKey="name" tick={{fontSize:11,fill:"#6b7280"}}/>
                            <YAxis tick={{fontSize:11,fill:"#6b7280"}}/>
                            <Tooltip content={<TooltipCustom/>}/>
                            <Area type="monotone" dataKey="citas" name="Citas" stroke="#1a1a1a" fill="#1a1a1a" fillOpacity={0.08} strokeWidth={2}/>
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className={card}>
                    <p className="mb-1 text-sm font-extrabold text-black">Be Back</p>
                    <p className="mb-4 text-xs text-black/40">¿Regresaron?</p>
                    <div className="flex items-center justify-center gap-6">
                        <ResponsiveContainer width="55%" height={160}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                                    <Cell fill="#1a1a1a"/><Cell fill="#d1d5db"/>
                                </Pie>
                                <Tooltip content={<TooltipCustom/>}/>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2">
                            {pieData.map((item,i)=>(
                                <div key={item.name} className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full" style={{background:i===0?"#1a1a1a":"#d1d5db"}}/>
                                    <span className="text-xs font-semibold text-black/60">{item.name}</span>
                                    <span className="text-sm font-extrabold text-black">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
                <div className={card}>
                    <p className="mb-1 text-sm font-extrabold text-black">Top asesores</p>
                    <p className="mb-4 text-xs text-black/40">Por número de citas</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={porAsesor} margin={{top:0,right:0,left:-20,bottom:0}}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                            <XAxis dataKey="name" tick={{fontSize:9,fill:"#6b7280"}}/>
                            <YAxis tick={{fontSize:11,fill:"#6b7280"}} allowDecimals={false}/>
                            <Tooltip content={<TooltipCustom/>}/>
                            <Bar dataKey="value" name="Citas" fill="#1a1a1a" radius={[4,4,0,0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className={card}>
                    <p className="mb-1 text-sm font-extrabold text-black">Fuente de prospección</p>
                    <p className="mb-4 text-xs text-black/40">Origen de los ingresos</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={porFuente} layout="vertical" margin={{top:0,right:0,left:10,bottom:0}}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false}/>
                            <XAxis type="number" tick={{fontSize:11,fill:"#6b7280"}} allowDecimals={false}/>
                            <YAxis type="category" dataKey="name" tick={{fontSize:9,fill:"#6b7280"}} width={80}/>
                            <Tooltip content={<TooltipCustom/>}/>
                            <Bar dataKey="value" name="Citas" fill="#3d3d3d" radius={[0,4,4,0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className={card}>
                    <p className="mb-1 text-sm font-extrabold text-black">Auto de interés</p>
                    <p className="mb-4 text-xs text-black/40">Modelos más solicitados</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={porAuto} layout="vertical" margin={{top:0,right:0,left:20,bottom:0}}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false}/>
                            <XAxis type="number" tick={{fontSize:11,fill:"#6b7280"}} allowDecimals={false}/>
                            <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:"#6b7280"}} width={60}/>
                            <Tooltip content={<TooltipCustom/>}/>
                            <Bar dataKey="value" name="Citas" fill="#616161" radius={[0,4,4,0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function RegistroCitasPiso() {
    const { user } = useAuth();

    const isAdmin = useMemo(()=>{
        const permisos = user?.permisos||[];
        const rol = String(user?.rol||"").trim().toLowerCase();
        return rol==="administrador"||permisos.includes("CRM_DIGITALES")||permisos.includes("ALL")||permisos.includes("USUARIOS_ADMIN");
    },[user]);

    const userAgencia = String(user?.agencia||"").trim();

    const [registros,   setRegistros]   = useState([]);
    const [activeView,  setActiveView]  = useState("tabla");
    const [ctxMenu,     setCtxMenu]     = useState({open:false,x:0,y:0,row:null});
    const [sort,        setSort]        = useState({key:"fecha_hora_cita",dir:"desc"});
    const [filters,     setFilters]     = useState({q:"",agencia:"Todos",rangoDesde:"",rangoHasta:""});
    const [openModal,   setOpenModal]   = useState(false);
    const [mode,        setMode]        = useState("create");
    const [draft,       setDraft]       = useState(null);
    const [loadingList,   setLoadingList]   = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving,        setSaving]        = useState(false);
    const [updatingInline,setUpdatingInline]= useState({});
    const [touchedSave,   setTouchedSave]   = useState(false);

    const REQUIRED = useMemo(()=>({cliente_telefono:"Teléfono",fecha_hora_cita:"Fecha y hora"}),[]);
    const missing = useMemo(()=>{
        if (!draft) return [];
        return Object.keys(REQUIRED).filter(key=>{
            const v=draft[key];
            return v===null||v===undefined||(typeof v==="string"&&v.trim()==="");
        });
    },[draft,REQUIRED]);
    const isInvalid = key => touchedSave && missing.includes(key);

    const telDigits       = useMemo(()=>String(draft?.cliente_telefono||"").replace(/\D/g,""),[draft?.cliente_telefono]);
    const telIsOk         = useMemo(()=>/^(?:\d{10}|52\d{10})$/.test(telDigits),[telDigits]);
    const telIsNormalized = useMemo(()=>/^52\d{10}$/.test(telDigits),[telDigits]);
    const telError = useMemo(()=>{
        if (!openModal||!draft||!telDigits) return "";
        if (/^\d{10}$/.test(telDigits)||/^52\d{10}$/.test(telDigits)) return "";
        if (telDigits.length<10) return "Número incompleto (mínimo 10 dígitos)";
        if (telDigits.length===11) return "Número incorrecto (11 dígitos no válido)";
        if (telDigits.length===12&&!telDigits.startsWith("52")) return "Para 12 dígitos debe iniciar con 52";
        if (telDigits.length>12) return "Número incorrecto (máximo 12 dígitos)";
        return "Número inválido";
    },[openModal,draft,telDigits]);
    const telInvalid = !!telError;

    const inputBase = "w-full rounded-lg border px-3 py-2 text-sm text-black font-medium outline-none transition";
    const inputOk   = "border-black/12 bg-white focus:border-black/30";
    const inputBad  = "border-red-300 bg-red-50";

    function toggleSort(key){ setSort(p=>p.key!==key?{key,dir:"asc"}:{key,dir:p.dir==="asc"?"desc":"asc"}); }

    useEffect(()=>{
        const fn=()=>setCtxMenu(p=>({...p,open:false,row:null}));
        window.addEventListener("click",fn);
        window.addEventListener("scroll",fn,true);
        window.addEventListener("resize",fn);
        return ()=>{ window.removeEventListener("click",fn); window.removeEventListener("scroll",fn,true); window.removeEventListener("resize",fn); };
    },[]);

    const onRowContextMenu=(e,row)=>{e.preventDefault();e.stopPropagation();setCtxMenu({open:true,x:e.clientX,y:e.clientY,row});};

    const refreshList = async()=>{
        setLoadingList(true);
        try{ const data=await apiCitasPiso.list(); setRegistros(Array.isArray(data)?data:[]); }
        catch(e){ console.error(e); setRegistros([]); }
        finally{ setLoadingList(false); }
    };
    useEffect(()=>{ refreshList(); },[]);

    const dealers = useMemo(()=>{
        const set=new Set((registros||[]).map(r=>normalizeStr(r.agencia)).filter(Boolean));
        if (!isAdmin&&userAgencia) return ["Todos",userAgencia];
        return ["Todos",...Array.from(set)];
    },[registros,isAdmin,userAgencia]);

    const filtered = useMemo(()=>{
        const q=filters.q.trim().toLowerCase();
        const desdeInt=ymdToInt(filters.rangoDesde);
        const hastaInt=ymdToInt(filters.rangoHasta);
        return (registros||[]).filter(r=>{
            if (!isAdmin&&userAgencia&&normalizeStr(r.agencia)!==normalizeStr(userAgencia)) return false;
            const matchQ=!q||[r.agencia,r?.cliente?.nombre,r?.cliente?.telefono,r.auto_interes,r.fuente_prospeccion,r.asesor_piso,r.comentarios_cliente]
                .map(v=>normalizeStr(v).toLowerCase()).join(" ").includes(q);
            const matchAgencia=filters.agencia==="Todos"||normalizeStr(r.agencia)===normalizeStr(filters.agencia);
            let matchRango=true;
            if (desdeInt!==null||hastaInt!==null){
                const ymdInt=ymdToInt(r.fecha_hora_cita?toYMDLocal(r.fecha_hora_cita):"");
                if (!ymdInt) return false;
                if (desdeInt!==null&&ymdInt<desdeInt) matchRango=false;
                if (hastaInt!==null&&ymdInt>hastaInt) matchRango=false;
            }
            return matchQ&&matchAgencia&&matchRango;
        });
    },[registros,filters,isAdmin,userAgencia]);

    const sorted = useMemo(()=>{
        const data=[...filtered];
        const {key,dir}=sort;
        if (!key) return data;
        const mult=dir==="asc"?1:-1;
        return data.sort((a,b)=>{
            if (key==="fecha_hora_cita"){
                const ta=a.fecha_hora_cita?new Date(a.fecha_hora_cita).getTime():0;
                const tb=b.fecha_hora_cita?new Date(b.fecha_hora_cita).getTime():0;
                return (ta-tb)*mult;
            }
            const va=normalizeStr(a?.[key]).toLowerCase();
            const vb=normalizeStr(b?.[key]).toLowerCase();
            return va<vb?-1*mult:va>vb?1*mult:0;
        });
    },[filtered,sort]);

    const openCreate=()=>{
        setTouchedSave(false); setMode("create");
        setDraft({id:null,cliente_id:null,agencia:isAdmin?"":userAgencia,
            cliente_nombre:"",cliente_telefono:"",auto_interes:"",
            fecha_hora_cita:"",folio:"",fuente_prospeccion:"",asesor_piso:"",
            be_back:false,comentarios_cliente:""});
        setOpenModal(true);
    };

    const openEdit=async(row)=>{
        if (!row?.id) return;
        try{
            setTouchedSave(false); setMode("edit"); setLoadingDetail(true); setOpenModal(true);
            const r=await apiCitasPiso.get(row.id);
            if (!isAdmin&&userAgencia&&normalizeStr(r.agencia)!==normalizeStr(userAgencia)){
                alert("Sin permisos para esta agencia."); setOpenModal(false); return;
            }
            setDraft({id:r.id,cliente_id:r?.cliente?.id_cliente??null,
                agencia:r.agencia||(isAdmin?"":userAgencia),
                cliente_nombre:r?.cliente?.nombre||"",cliente_telefono:r?.cliente?.telefono||"",
                auto_interes:r.auto_interes||"",fecha_hora_cita:toDTLocal(r.fecha_hora_cita),
                folio:r.folio||"",fuente_prospeccion:r.fuente_prospeccion||"",
                asesor_piso:r.asesor_piso||"",be_back:!!r.be_back,comentarios_cliente:r.comentarios_cliente||""});
        } catch(e){ console.error(e); alert("No se pudo abrir."); setOpenModal(false); }
        finally{ setLoadingDetail(false); }
    };

    const closeModal=()=>{ if (saving) return; setOpenModal(false); setDraft(null); };

    const eliminarRegistro=async(row)=>{
        if (!row?.id) return;
        if (!isAdmin&&userAgencia&&normalizeStr(row.agencia)!==normalizeStr(userAgencia)){ alert("Sin permisos."); return; }
        if (!confirm(`¿Eliminar el registro de ${row?.cliente?.nombre||row?.cliente?.telefono||"cliente"}?`)) return;
        try{
            await apiCitasPiso.remove(row.id);
            setRegistros(p=>p.filter(r=>r.id!==row.id));
            setCtxMenu({open:false,x:0,y:0,row:null});
        } catch(e){ console.error(e); alert("No se pudo eliminar."); }
    };

    const toggleBeBackInline=async(row)=>{
        const id=row?.id; if (!id) return;
        const prev=!!row.be_back;
        setRegistros(p=>p.map(c=>c.id===id?{...c,be_back:!prev}:c));
        setUpdatingInline(p=>({...p,[id]:true}));
        try{ await apiCitasPiso.patch(id,{be_back:!prev}); }
        catch(e){ console.error(e); setRegistros(p=>p.map(c=>c.id===id?{...c,be_back:prev}:c)); alert("No se pudo actualizar."); }
        finally{ setUpdatingInline(p=>{ const n={...p}; delete n[id]; return n; }); }
    };

    const changeFuenteInline=async(row,nextValue)=>{
        const id=row?.id; if (!id) return;
        const prev=row.fuente_prospeccion||"";
        setRegistros(p=>p.map(c=>c.id===id?{...c,fuente_prospeccion:nextValue}:c));
        setUpdatingInline(p=>({...p,[id]:true}));
        try{ await apiCitasPiso.patch(id,{fuente_prospeccion:nextValue}); }
        catch(e){ console.error(e); setRegistros(p=>p.map(c=>c.id===id?{...c,fuente_prospeccion:prev}:c)); alert("No se pudo actualizar."); }
        finally{ setUpdatingInline(p=>{ const n={...p}; delete n[id]; return n; }); }
    };

    const updateFolioInline=async(row,nextValue)=>{
        const id=row?.id; if (!id) return;
        const next=String(nextValue??""); const prev=row.folio||"";
        setRegistros(p=>p.map(r=>r.id===id?{...r,folio:next}:r));
        setUpdatingInline(p=>({...p,[id]:true}));
        try{ await apiCitasPiso.patch(id,{folio:next}); }
        catch(e){ console.error(e); setRegistros(p=>p.map(r=>r.id===id?{...r,folio:prev}:r)); alert("No se pudo actualizar."); }
        finally{ setUpdatingInline(p=>{ const n={...p}; delete n[id]; return n; }); }
    };

    const save=async()=>{
        if (!draft||saving) return;
        setTouchedSave(true);
        if (missing.length||!telIsOk||telInvalid) return;
        setSaving(true);
        try{
            const agenciaFinal=isAdmin?normalizeStr(draft.agencia||""):userAgencia;
            const payload={agencia:agenciaFinal,...(draft.cliente_id?{cliente_id:draft.cliente_id}:{}),
                nombre:draft.cliente_nombre||"",telefono:normalizeStr(draft.cliente_telefono),
                auto_interes:draft.auto_interes||"",fecha_hora_cita:fromDTLocalToISO(draft.fecha_hora_cita),
                folio:draft.folio||"",fuente_prospeccion:draft.fuente_prospeccion||"",
                asesor_piso:draft.asesor_piso||"",be_back:!!draft.be_back,comentarios_cliente:draft.comentarios_cliente||""};
            if (mode==="create") await apiCitasPiso.create(payload);
            else await apiCitasPiso.update(draft.id,payload);
            await refreshList(); closeModal();
        } catch(e){ console.error(e); alert("Error guardando."); }
        finally{ setSaving(false); }
    };

    const resetFilters=()=>setFilters({q:"",agencia:"Todos",rangoDesde:"",rangoHasta:""});
    const setHoy=()=>{ const h=toYMDLocal(new Date()); setFilters(p=>({...p,rangoDesde:h,rangoHasta:h})); };

    return (
        <div className="w-full space-y-4">

            {/* ── Header oscuro con selector de vista ── */}
          {/* ── Header premium Control de Piso ── */}
<div
    className="relative overflow-hidden rounded-2xl"
    style={{
        background: "linear-gradient(135deg, #0d0d0d 0%, #181818 40%, #111111 70%, #0a0a0a 100%)",
        border: "0.5px solid rgba(255,255,255,0.06)",
    }}
>
    {/* Línea de acento superior */}
    <div
        className="absolute top-0 left-0 right-0"
        style={{
            height: "1px",
            background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0) 10%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.55) 60%, rgba(255,255,255,0) 90%, transparent 100%)",
        }}
    />

    {/* Glows */}
    <div
        className="pointer-events-none absolute"
        style={{
            top: "-60px", left: "-60px",
            width: "260px", height: "200px",
            background: "radial-gradient(ellipse, rgba(255,255,255,0.03) 0%, transparent 70%)",
        }}
    />
    <div
        className="pointer-events-none absolute"
        style={{
            bottom: "-40px", right: "-20px",
            width: "220px", height: "160px",
            background: "radial-gradient(ellipse, rgba(255,255,255,0.02) 0%, transparent 70%)",
        }}
    />

    <div className="relative px-6 pt-5 pb-0" style={{ zIndex: 1 }}>

        {/* Fila 1 — breadcrumb + vista tabs */}
        <div className="flex items-center justify-between mb-5">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2.5">
                <div
                    className="rounded-full"
                    style={{ width: 6, height: 6, background: "rgba(255,255,255,0.9)" }}
                />
                <span
                    style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.35)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                    }}
                >
                    Comercial &nbsp;/&nbsp; Control piso
                </span>
            </div>

            {/* Selector de vista en pill-group */}
            <div
                className="flex gap-1 p-[3px] rounded-[10px]"
                style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "0.5px solid rgba(255,255,255,0.08)",
                }}
            >
                {VIEWS.map(({ key, label, Icon }) => {
                    const active = activeView === key;
                    return (
                        <button
                            key={key}
                            onClick={() => setActiveView(key)}
                            className="inline-flex items-center gap-1.5 whitespace-nowrap transition-all"
                            style={{
                                padding: "6px 14px",
                                borderRadius: 7,
                                fontSize: 12,
                                fontWeight: 500,
                                border: active
                                    ? "0.5px solid rgba(255,255,255,0.18)"
                                    : "0.5px solid transparent",
                                background: active ? "rgba(255,255,255,0.12)" : "transparent",
                                color: active ? "#ffffff" : "rgba(255,255,255,0.38)",
                            }}
                        >
                            <Icon size={13} />
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Divisor */}
        <div
            style={{
                height: "0.5px",
                background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 15%, rgba(255,255,255,0.08) 85%, transparent)",
                marginBottom: 18,
            }}
        />

        {/* Fila 2 — título + stats + botón */}
        <div className="flex items-end justify-between gap-4 pb-5">

            <div>
                <h2
                    style={{
                        fontSize: 26,
                        fontWeight: 500,
                        color: "#ffffff",
                        margin: "0 0 5px",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.1,
                    }}
                >
                    Control de Piso
                </h2>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                    {activeView === "tabla"
                        ? "Doble clic para editar un registro."
                        : activeView === "agenda"
                        ? "Vista semanal de ingresos."
                        : "Estadísticas de ingresos."}
                </p>
                {!isAdmin && userAgencia && (
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                        Agencia: <span style={{ color: "rgba(255,255,255,0.6)" }}>{userAgencia}</span>
                    </p>
                )}
            </div>

            <div className="flex items-center gap-3">
                {/* Mini-stats */}
                <div
                    className="flex items-stretch overflow-hidden rounded-[10px]"
                    style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                >
                    {[
                        { n: registros.length,                                                           l: "Total"     },
                        { n: registros.filter(r => r.be_back).length,                                    l: "Be Back"   },
                        { n: registros.length > 0 ? Math.round((registros.filter(r => r.be_back).length / registros.length) * 100) + "%" : "0%", l: "Tasa BB" },
                    ].map((s, i) => (
                        <div
                            key={i}
                            className="text-center px-[16px] py-[9px]"
                            style={{
                                background: "rgba(255,255,255,0.04)",
                                borderLeft: i > 0 ? "0.5px solid rgba(255,255,255,0.08)" : "none",
                            }}
                        >
                            <div style={{ fontSize: 18, fontWeight: 500, color: "#fff", lineHeight: 1 }}>
                                {s.n}
                            </div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                {s.l}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Botón nuevo ingreso — oculto en agenda porque el kanban tiene el suyo */}
                {activeView !== "agenda" && (
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 whitespace-nowrap transition-all"
                        style={{
                            padding: "8px 16px",
                            borderRadius: 9,
                            fontSize: 13,
                            fontWeight: 500,
                            background: "rgba(255,255,255,0.1)",
                            border: "0.5px solid rgba(255,255,255,0.18)",
                            color: "#ffffff",
                        }}
                    >
                        <Plus size={14} />
                        Nuevo ingreso
                    </button>
                )}
            </div>
        </div>
    </div>

    {/* Franja inferior decorativa */}
    <div
        style={{
            height: 3,
            background: "linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 30%, #1f1f1f 60%, #111 100%)",
        }}
    />
</div>
            {/* ── Filtros — solo visibles en tabla y gráficas ── */}
            {activeView !== "agenda" && (
                <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
                    <div className="grid gap-3 md:grid-cols-12">
                        <div className="md:col-span-6">
                            <FilterBlock label="Búsqueda">
                                <div className="flex items-center gap-2 rounded-lg border border-black bg-white px-3 py-2">
                                    <Search className="h-4 w-4 text-black"/>
                                    <input value={filters.q} onChange={e=>setFilters(p=>({...p,q:e.target.value}))}
                                        placeholder="Dealer, cliente, teléfono, asesor, fuente…"
                                        className="w-full text-sm text-black outline-none placeholder:text-black/40"/>
                                    {filters.q&&<button onClick={()=>setFilters(p=>({...p,q:""}))} className="p-1 text-black hover:text-red-500"><X className="h-4 w-4"/></button>}
                                </div>
                            </FilterBlock>
                        </div>
                        <div className="md:col-span-3">
                            <FilterBlock label="Dealer">
                                <select value={filters.agencia} onChange={e=>setFilters(p=>({...p,agencia:e.target.value}))}
                                    className="w-full rounded-lg border border-black bg-white px-3 py-2 text-sm text-black outline-none">
                                    {dealers.map(d=><option key={d} value={d}>{d}</option>)}
                                </select>
                            </FilterBlock>
                        </div>
                        <div className="md:col-span-3">
                            <FilterBlock label="Acciones">
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={setHoy}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                                        <CalendarDays className="h-4 w-4"/> Hoy
                                    </button>
                                    <button onClick={resetFilters}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black hover:text-white transition">
                                        <X className="h-4 w-4"/> Limpiar
                                    </button>
                                </div>
                            </FilterBlock>
                        </div>
                        <div className="md:col-span-6">
                            <FilterBlock label="Desde">
                                <input type="date" value={filters.rangoDesde} onChange={e=>setFilters(p=>({...p,rangoDesde:e.target.value}))}
                                    className="w-full rounded-lg border border-black bg-white px-3 py-2 text-sm text-black outline-none"/>
                            </FilterBlock>
                        </div>
                        <div className="md:col-span-6">
                            <FilterBlock label="Hasta">
                                <input type="date" value={filters.rangoHasta} onChange={e=>setFilters(p=>({...p,rangoHasta:e.target.value}))}
                                    className="w-full rounded-lg border border-black bg-white px-3 py-2 text-sm text-black outline-none"/>
                            </FilterBlock>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Vista Agenda (kanban semanal) ── */}
            {activeView === "agenda" && (
                <KanbanAgenda
                    filtered={filtered}
                    onOpenEdit={openEdit}
                    onOpenCreate={openCreate}
                    loading={loadingList}
                />
            )}

            {/* ── Vista Gráficas ── */}
            {activeView === "graficas" && (
                <GraficasView registros={filtered}/>
            )}

            {/* ── Vista Tabla ── */}
            {activeView === "tabla" && (
                <>
                    <div className="hidden overflow-hidden rounded-xl shadow-sm lg:block">
                        <div className="overflow-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="border border-black bg-black text-xs text-white">
                                    <tr>
                                        {[{label:"Fecha y Hora",key:"fecha_hora_cita"},{label:"Dealer",key:"agencia"}].map(({label,key})=>(
                                            <th key={key} className="px-4 py-3">
                                                <button type="button" onClick={()=>toggleSort(key)} className="inline-flex items-center gap-1 font-bold">
                                                    {label}
                                                    <span className="opacity-60">
                                                        {sort.key===key ? sort.dir==="asc"?<ChevronUp className="h-4"/>:<ChevronDown className="h-4"/> : <ArrowUpDown className="h-4"/>}
                                                    </span>
                                                </button>
                                            </th>
                                        ))}
                                        {["Cliente","Auto interés","Asesor piso","Folio","Fuente prospección","Be Back"].map(h=>(
                                            <th key={h} className="px-4 py-3">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/10 bg-white">
                                    {loadingList ? Array.from({length:8}).map((_,i)=><SkeletonRow key={i}/>) : sorted.length===0 ? (
                                        <tr><td colSpan={8} className="px-4 py-10 text-center text-black/40">No hay resultados.</td></tr>
                                    ) : sorted.map(row=>{
                                        const isUpdating=!!updatingInline[row.id];
                                        return (
                                            <tr key={row.id} onDoubleClick={()=>openEdit(row)} onContextMenu={e=>onRowContextMenu(e,row)}
                                                className="cursor-pointer hover:bg-slate-50 transition">
                                                <td className="px-4 py-3 font-semibold text-black">{row.fecha_hora_cita?toDTLocal(row.fecha_hora_cita).replace("T"," "):"—"}</td>
                                                <td className="px-4 py-3 font-semibold text-black">{row.agencia||"—"}</td>
                                                <td className="px-4 py-3 text-black"><div className="font-bold">{row?.cliente?.nombre||"—"}</div></td>
                                                <td className="px-4 py-3 text-black">{row.auto_interes||"—"}</td>
                                                <td className="px-4 py-3 text-black">{row.asesor_piso||"—"}</td>
                                                <td className="px-4 py-3" onClick={e=>e.stopPropagation()}>
                                                    <input defaultValue={row.folio||""} disabled={isUpdating} placeholder="—"
                                                        className="w-full max-w-[140px] rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-bold text-black outline-none focus:ring-2 focus:ring-black/20"
                                                        onKeyDown={e=>{ if (e.key==="Enter") e.currentTarget.blur(); if (e.key==="Escape"){e.currentTarget.value=row.folio||"";e.currentTarget.blur();} }}
                                                        onBlur={e=>{ if ((e.currentTarget.value||"")!==(row.folio||"")) updateFolioInline(row,e.currentTarget.value); }}/>
                                                </td>
                                                <td className="px-4 py-3" onClick={e=>e.stopPropagation()}>
                                                    <select value={row.fuente_prospeccion||""} disabled={isUpdating} onChange={e=>changeFuenteInline(row,e.target.value)}
                                                        className="w-full max-w-[200px] rounded-lg border border-black/10 px-2 py-1 text-xs font-bold text-black">
                                                        <option value="">—</option>
                                                        {FUENTE.map(s=><option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button disabled={isUpdating} onClick={e=>{e.stopPropagation();toggleBeBackInline(row);}}
                                                        className={["inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition",
                                                            row.be_back?"bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200":"bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
                                                            isUpdating?"opacity-70 cursor-not-allowed":""].join(" ")}>
                                                        {isUpdating?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:null}
                                                        {row.be_back?"Sí":"No"}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile cards */}
                    <div className="grid gap-3 lg:hidden">
                        {loadingList ? (
                            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                                <div className="flex items-center gap-2 font-bold text-black"><Loader2 className="h-5 w-5 animate-spin"/>Cargando...</div>
                            </div>
                        ) : sorted.length===0 ? (
                            <div className="rounded-xl border border-black/10 bg-white p-10 text-center text-black/40">No hay resultados.</div>
                        ) : sorted.map(row=>(
                            <button key={row.id} onClick={()=>openEdit(row)}
                                className="text-left rounded-xl border border-black/10 bg-white p-4 shadow-sm hover:bg-slate-50 transition">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-extrabold text-black">{row?.cliente?.nombre||"—"}</div>
                                        <div className="mt-1 text-xs text-black/50">{row.agencia||"—"} · {row?.cliente?.telefono||"—"}</div>
                                        <div className="mt-1 text-xs text-black/50">{row.fecha_hora_cita?toDTLocal(row.fecha_hora_cita).replace("T"," "):"—"}</div>
                                        <div className="mt-1 text-xs text-black/50">{row.fuente_prospeccion||"—"}</div>
                                    </div>
                                    <span className={["shrink-0 rounded-full border px-3 py-1 text-xs font-bold",
                                        row.be_back?"bg-emerald-100 text-emerald-800 border-emerald-300":"bg-red-50 text-red-700 border-red-200"].join(" ")}>
                                        {row.be_back?"Be Back":"No regresó"}
                                    </span>
                                </div>
                                <div className="mt-2 line-clamp-2 text-xs text-black/40">{row.comentarios_cliente||"—"}</div>
                            </button>
                        ))}
                    </div>
                </>
            )}

            <ContextMenu ctxMenu={ctxMenu}
                onDelete={async(row)=>{ await eliminarRegistro(row); setCtxMenu({open:false,x:0,y:0,row:null}); }}
                onClose={()=>setCtxMenu({open:false,x:0,y:0,row:null})}/>

            {/* ── Modal crear/editar ── */}
            <Modal open={openModal} title={mode==="create"?"Nuevo ingreso a piso":`Editar • ${draft?.id}`} onClose={closeModal}
                footer={
                    <>
                        <button onClick={closeModal} disabled={saving}
                            className="inline-flex items-center gap-2 rounded-full border border-black/15 px-4 py-2 text-sm font-medium text-black/60 transition hover:bg-black/5 hover:text-black disabled:opacity-50">
                            Cancelar
                        </button>
                        <button onClick={save} disabled={saving||loadingDetail||telInvalid||(draft?.cliente_telefono?!telIsOk:false)}
                            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition hover:bg-black/85 disabled:opacity-50">
                            {saving?<Loader2 className="h-4 w-4 animate-spin"/>:null}
                            {saving?"Guardando...":"Guardar cambios"}
                        </button>
                    </>
                }>
                {loadingDetail?<ModalSkeleton/>:!draft?null:(
                    <div className="grid gap-3 md:grid-cols-3">
                        <Field label="Dealer" icon={Building2}>
                            <select value={draft.agencia||""} onChange={e=>setDraft(p=>({...p,agencia:e.target.value}))} disabled={!isAdmin}
                                className={[inputBase,inputOk,!isAdmin?"opacity-75 cursor-not-allowed":""].join(" ")}>
                                <option value="" disabled>Selecciona un dealer...</option>
                                {(isAdmin?DEALERS:userAgencia?[userAgencia]:DEALERS).map(d=><option key={d} value={d}>{d}</option>)}
                            </select>
                        </Field>
                        <Field label="Prospecto" icon={User}>
                            <input value={draft.cliente_nombre} onChange={e=>setDraft(p=>({...p,cliente_nombre:e.target.value}))}
                                className={[inputBase,inputOk].join(" ")} placeholder="Nombre completo"/>
                        </Field>
                        <Field label="Teléfono" icon={Phone}>
                            <input maxLength={12} value={draft.cliente_telefono}
                                onChange={e=>setDraft(p=>({...p,cliente_telefono:e.target.value.replace(/\D/g,"").slice(0,12)}))}
                                disabled={mode==="edit"||telIsNormalized}
                                className={[inputBase,(isInvalid("cliente_telefono")||telInvalid)?inputBad:inputOk,(mode==="edit"||telIsNormalized)?"opacity-75 cursor-not-allowed":""].join(" ")}/>
                            {isInvalid("cliente_telefono")&&<div className="mt-1 text-xs font-bold text-red-600">Teléfono es requerido.</div>}
                            {!isInvalid("cliente_telefono")&&telError&&<div className="mt-1 text-xs font-bold text-red-600">{telError}</div>}
                        </Field>
                        <Field label="Auto de interés" icon={CarFront}>
                            <select value={draft.auto_interes||""} onChange={e=>setDraft(p=>({...p,auto_interes:e.target.value}))}
                                className={[inputBase,inputOk].join(" ")}>
                                <option value="" disabled>Selecciona un modelo...</option>
                                {VEHICULOS.map(d=><option key={d} value={d}>{d}</option>)}
                            </select>
                        </Field>
                        <Field label="Fecha y Hora" icon={CalendarDays}>
                            <input type="datetime-local" value={draft.fecha_hora_cita}
                                onChange={e=>setDraft(p=>({...p,fecha_hora_cita:e.target.value}))}
                                className={[inputBase,isInvalid("fecha_hora_cita")?inputBad:inputOk].join(" ")}/>
                            {isInvalid("fecha_hora_cita")&&<div className="mt-1 text-xs font-bold text-red-600">Fecha y hora requerido.</div>}
                        </Field>
                        <Field label="Fuente de prospección" icon={UserSearch}>
                            <select value={draft.fuente_prospeccion||""} onChange={e=>setDraft(p=>({...p,fuente_prospeccion:e.target.value}))}
                                className={[inputBase,inputOk].join(" ")}>
                                <option value="" disabled>Selecciona una fuente...</option>
                                {FUENTE.map(d=><option key={d} value={d}>{d}</option>)}
                            </select>
                        </Field>
                        <Field label="Asesor piso" icon={UserStar}>
                            <select value={draft.asesor_piso||""} onChange={e=>setDraft(p=>({...p,asesor_piso:e.target.value}))}
                                className={[inputBase,inputOk].join(" ")}>
                                <option value="" disabled>Selecciona un asesor...</option>
                                {ASESORES.map(d=><option key={d} value={d}>{d}</option>)}
                            </select>
                        </Field>
                        <Field label="Folio" icon={UserSearch}>
                            <input value={draft.folio||""} onChange={e=>setDraft(p=>({...p,folio:e.target.value}))}
                                className={[inputBase,inputOk].join(" ")} placeholder="A12B9981"/>
                        </Field>
                        <Field label="Be Back" icon={UserCheck}>
                            <button type="button" onClick={()=>setDraft(p=>({...p,be_back:!p.be_back}))}
                                className={["inline-flex w-full items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition",
                                    draft.be_back?"border-emerald-200 bg-emerald-50 text-emerald-700":"border-red-200 bg-red-50 text-red-600"].join(" ")}>
                                {draft.be_back?<CheckCircle2 className="h-4 w-4"/>:<X className="h-4 w-4"/>}
                                {draft.be_back?"Regresó":"No regresó"}
                            </button>
                        </Field>
                        <div className="md:col-span-3">
                            <Field label="Comentarios del cliente" icon={MessageSquareText}>
                                <textarea value={draft.comentarios_cliente} onChange={e=>setDraft(p=>({...p,comentarios_cliente:e.target.value}))}
                                    className={[inputBase,inputOk,"min-h-[100px]"].join(" ")} placeholder="Notas / comentarios..."/>
                            </Field>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}