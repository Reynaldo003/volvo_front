// src/pages/CitasPiso/RegistroCitasPiso.jsx
import { useMemo, useState, useEffect } from "react";
import {
    Plus, Search, X, Save, User, CarFront, CalendarDays,
    ArrowUpDown, ChevronDown, ChevronUp, Trash2, Loader2,
    Phone, UserCheck, UserSearch, UserStar, Building2,
    MessageSquareText, LayoutList, CalendarRange, BarChart2,
    ChevronLeft, ChevronRight, CheckCircle2, Clock,
} from "lucide-react";
import { apiCitasPiso } from "../../lib/apiCitasPiso";
import { createPortal } from "react-dom";
import { useAuth } from "../../auth/AuthContext";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";

// ─── constantes ───────────────────────────────────────────────────────────────
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_SEMANA = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const CHART_COLORS = ["#1a1a1a","#3d3d3d","#616161","#8a8a8a","#b3b3b3"];

const VIEWS = [
    { key: "tabla",    label: "Tabla",    Icon: LayoutList   },
    { key: "agenda",   label: "Agenda",   Icon: CalendarRange },
    { key: "graficas", label: "Gráficas", Icon: BarChart2     },
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

// ─── helpers ──────────────────────────────────────────────────────────────────
function normalizeStr(v) { return String(v ?? "").trim(); }

function toDTLocal(isoOrNull) {
    if (!isoOrNull) return "";
    const s = String(isoOrNull);
    if (s.endsWith("Z")) {
        const d = new Date(s); if (Number.isNaN(d.getTime())) return "";
        const p = (n) => String(n).padStart(2,"0");
        return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0,16);
    return "";
}
function fromDTLocalToISO(v) { return String(v||"").trim() || null; }
function toYMDLocal(dateLike) {
    const d = new Date(dateLike); if (Number.isNaN(d.getTime())) return "";
    const p = (n) => String(n).padStart(2,"0");
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
}
function ymdToInt(ymd) {
    if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
    return Number(ymd.replaceAll("-",""));
}

// ─── micro-components ─────────────────────────────────────────────────────────
function Skeleton({ className="" }) { return <div className={["animate-pulse rounded-md bg-black/10",className].join(" ")}/>; }

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
                <div key={i} className="rounded-lg border border-black/10 bg-neutral-200/50 p-4">
                    <Skeleton className="h-4 w-32"/><Skeleton className="mt-3 h-10 w-full rounded-lg"/>
                </div>
            ))}
        </div>
    );
}

function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;
    return createPortal(
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose}/>
            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-black bg-neutral-100 shadow-2xl">
                    <div className="flex items-center justify-between gap-3 px-5 py-4"
                        style={{background:"linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%)"}}>
                        <div className="truncate text-base font-extrabold text-white">{title}</div>
                        <button onClick={onClose}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20">
                            <X className="h-5 w-5"/>
                        </button>
                    </div>
                    <div className="max-h-[72vh] overflow-auto p-5">{children}</div>
                    {footer && (
                        <div className="flex flex-col gap-2 border-t border-black/10 bg-white/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
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
        <div className="rounded-lg border border-black/10 bg-neutral-200/50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-black">
                {Icon && <Icon className="h-4 w-4"/>}
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

// ─── VISTA AGENDA ─────────────────────────────────────────────────────────────
function AgendaView({ registros, onOpenEdit, onOpenCreate }) {
    const hoy = new Date();
    const [year, setYear]   = useState(hoy.getFullYear());
    const [month, setMonth] = useState(hoy.getMonth());
    const [diaSeleccionado, setDiaSeleccionado] = useState(null);

    const primerDia  = new Date(year, month, 1).getDay();
    const diasEnMes  = new Date(year, month+1, 0).getDate();

    const byDay = useMemo(() => {
        const map = {};
        registros.forEach(r => {
            if (!r.fecha_hora_cita) return;
            const d = new Date(r.fecha_hora_cita);
            if (d.getFullYear()===year && d.getMonth()===month) {
                const key = d.getDate();
                if (!map[key]) map[key]=[];
                map[key].push(r);
            }
        });
        return map;
    }, [registros, year, month]);

    const cells = [];
    for (let i=0; i<primerDia; i++) cells.push(null);
    for (let d=1; d<=diasEnMes; d++) cells.push(d);
    while (cells.length%7!==0) cells.push(null);

    const esHoy = d => d===hoy.getDate() && month===hoy.getMonth() && year===hoy.getFullYear();
    const prevMonth = () => month===0 ? (setMonth(11),setYear(y=>y-1)) : setMonth(m=>m-1);
    const nextMonth = () => month===11 ? (setMonth(0),setYear(y=>y+1)) : setMonth(m=>m+1);

    const eventosDia = diaSeleccionado ? (byDay[diaSeleccionado]||[]) : [];

    return (
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            {/* Calendario */}
            <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
                {/* Nav mes */}
                <div className="flex items-center justify-between px-5 py-3"
                    style={{background:"linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%)"}}>
                    <button onClick={prevMonth} className="rounded-lg p-2 text-white hover:bg-white/10 transition">
                        <ChevronLeft className="h-5 w-5"/>
                    </button>
                    <span className="text-base font-extrabold text-white">{MESES[month]} {year}</span>
                    <button onClick={nextMonth} className="rounded-lg p-2 text-white hover:bg-white/10 transition">
                        <ChevronRight className="h-5 w-5"/>
                    </button>
                </div>

                {/* Días semana */}
                <div className="grid grid-cols-7 border-b border-black/10 bg-slate-50">
                    {DIAS_SEMANA.map(d => (
                        <div key={d} className="py-2 text-center text-xs font-extrabold uppercase tracking-wider text-black/40">{d}</div>
                    ))}
                </div>

                {/* Celdas */}
                <div className="grid grid-cols-7">
                    {cells.map((dia, idx) => {
                        const eventos = dia ? (byDay[dia]||[]) : [];
                        const seleccionado = dia===diaSeleccionado;
                        const bebacks = eventos.filter(r=>r.be_back).length;
                        return (
                            <div key={idx}
                                onClick={() => dia && setDiaSeleccionado(seleccionado ? null : dia)}
                                className={[
                                    "min-h-[88px] cursor-pointer border-b border-r border-black/5 p-1.5 transition",
                                    !dia ? "bg-neutral-50" :
                                    seleccionado ? "bg-black/5 ring-2 ring-inset ring-black/20" :
                                    "bg-white hover:bg-slate-50",
                                ].join(" ")}
                            >
                                {dia && (
                                    <>
                                        <div className={[
                                            "mb-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                                            esHoy(dia) ? "bg-black text-white" :
                                            seleccionado ? "bg-black/80 text-white" : "text-black/70",
                                        ].join(" ")}>{dia}</div>

                                        {/* Pills de eventos */}
                                        <div className="space-y-0.5">
                                            {eventos.slice(0,2).map(r => (
                                                <button key={r.id}
                                                    onClick={e=>{e.stopPropagation();onOpenEdit(r);}}
                                                    className="w-full truncate rounded bg-[#2d2d2d] px-1.5 py-0.5 text-left text-[10px] font-semibold text-white hover:bg-black transition"
                                                    title={r?.cliente?.nombre||"—"}>
                                                    {toDTLocal(r.fecha_hora_cita).slice(11,16)} {r?.cliente?.nombre||"—"}
                                                </button>
                                            ))}
                                            {eventos.length>2 && (
                                                <div className="text-[10px] font-bold text-black/40">+{eventos.length-2} más</div>
                                            )}
                                        </div>

                                        {/* Indicador be-back */}
                                        {bebacks>0 && (
                                            <div className="mt-0.5 text-[9px] font-bold text-emerald-600">✓ {bebacks} be-back</div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-black/10 px-5 py-2">
                    <span className="text-xs font-semibold text-black/40">
                        {Object.values(byDay).flat().length} cita(s) en {MESES[month]}
                    </span>
                    <button onClick={()=>onOpenCreate()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-xs font-bold text-white hover:bg-black/80 transition">
                        <Plus className="h-3.5 w-3.5"/> Nueva cita
                    </button>
                </div>
            </div>

            {/* Panel lateral: detalle del día */}
            <div className="rounded-xl border border-black/10 bg-white overflow-hidden shadow-sm">
                <div className="border-b border-black/10 px-4 py-3"
                    style={{background:"linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%)"}}>
                    <p className="text-sm font-extrabold text-white">
                        {diaSeleccionado
                            ? `${diaSeleccionado} de ${MESES[month]}`
                            : "Selecciona un día"}
                    </p>
                    <p className="text-xs text-white/50">{eventosDia.length} cita(s)</p>
                </div>

                {!diaSeleccionado ? (
                    <div className="flex flex-col items-center justify-center py-16 text-black/30">
                        <CalendarDays className="h-10 w-10 mb-2"/>
                        <p className="text-sm font-semibold">Toca un día para ver sus citas</p>
                    </div>
                ) : eventosDia.length===0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-black/30">
                        <Clock className="h-10 w-10 mb-2"/>
                        <p className="text-sm font-semibold">Sin citas este día</p>
                        <button onClick={()=>onOpenCreate()}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-xs font-bold text-white hover:bg-black/80">
                            <Plus className="h-3 w-3"/> Agregar
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-black/5">
                        {eventosDia.map(r => (
                            <button key={r.id} onClick={()=>onOpenEdit(r)}
                                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/5">
                                    <CalendarDays className="h-4 w-4 text-black/60"/>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-black truncate">
                                        {toDTLocal(r.fecha_hora_cita).slice(11,16)} — {r?.cliente?.nombre||"—"}
                                    </p>
                                    <p className="text-xs text-black/50 truncate">{r.auto_interes||"—"} · {r.asesor_piso||"—"}</p>
                                    <p className="text-xs text-black/40 truncate">{r.fuente_prospeccion||"—"}</p>
                                </div>
                                <span className={[
                                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                                    r.be_back ? "bg-emerald-100 text-emerald-700" : "bg-red-50 text-red-500",
                                ].join(" ")}>
                                    {r.be_back ? "Be Back" : "No regresó"}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
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
    const total   = registros.length;
    const bebacks = registros.filter(r=>r.be_back).length;
    const sinBeback = total - bebacks;

    // Tendencia últimos 7 días
    const trendData = useMemo(() => {
        const hoy = new Date();
        return Array.from({length:7},(_,i)=>{
            const d = new Date(hoy); d.setDate(d.getDate()-(6-i));
            const key = toYMDLocal(d);
            const count = registros.filter(r=>r.fecha_hora_cita && toYMDLocal(r.fecha_hora_cita)===key).length;
            return { name: DIAS_SEMANA[d.getDay()], citas: count };
        });
    },[registros]);

    // Por asesor
    const porAsesor = useMemo(()=>{
        const map={};
        registros.forEach(r=>{ const k=(r.asesor_piso||"Sin asignar").split(" ").slice(0,2).join(" "); map[k]=(map[k]||0)+1; });
        return Object.entries(map).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,5);
    },[registros]);

    // Por fuente
    const porFuente = useMemo(()=>{
        const map={};
        registros.forEach(r=>{ const k=r.fuente_prospeccion||"Sin fuente"; map[k]=(map[k]||0)+1; });
        return Object.entries(map).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
    },[registros]);

    // Por auto
    const porAuto = useMemo(()=>{
        const map={};
        registros.forEach(r=>{ const k=r.auto_interes||"—"; map[k]=(map[k]||0)+1; });
        return Object.entries(map).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,6);
    },[registros]);

    const pieData = [
        { name:"Be Back", value:bebacks },
        { name:"No regresó", value:sinBeback },
    ];

    const cardStyle = "rounded-2xl border border-black/10 bg-white p-5 shadow-sm";

    return (
        <div className="space-y-5">
            {/* KPIs */}
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

            {/* Fila 1 */}
            <div className="grid gap-5 lg:grid-cols-3">
                <div className={"lg:col-span-2 "+cardStyle}>
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

                <div className={cardStyle}>
                    <p className="mb-1 text-sm font-extrabold text-black">Be Back</p>
                    <p className="mb-4 text-xs text-black/40">¿Regresaron?</p>
                    <div className="flex items-center justify-center gap-6">
                        <ResponsiveContainer width="55%" height={160}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                                    <Cell fill="#1a1a1a"/>
                                    <Cell fill="#d1d5db"/>
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

            {/* Fila 2 */}
            <div className="grid gap-5 lg:grid-cols-3">
                <div className={cardStyle}>
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

                <div className={cardStyle}>
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

                <div className={cardStyle}>
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
    const [registros, setRegistros] = useState([]);
    const [activeView, setActiveView] = useState("tabla");

    const [ctxMenu, setCtxMenu]   = useState({open:false,x:0,y:0,row:null});
    const [sort, setSort]         = useState({key:"fecha_hora_cita",dir:"desc"});
    const [filters, setFilters]   = useState({q:"",agencia:"Todos",rangoDesde:"",rangoHasta:""});
    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode]           = useState("create");
    const [draft, setDraft]         = useState(null);
    const [loadingList, setLoadingList]     = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving]               = useState(false);
    const [updatingInline, setUpdatingInline] = useState({});
    const [touchedSave, setTouchedSave]     = useState(false);

    const REQUIRED = useMemo(()=>({cliente_telefono:"Teléfono",fecha_hora_cita:"Fecha y hora"}),[]);

    const missing = useMemo(()=>{
        if (!draft) return [];
        return Object.keys(REQUIRED).filter(key=>{
            const v=draft[key];
            return v===null||v===undefined||(typeof v==="string"&&v.trim()==="");
        });
    },[draft,REQUIRED]);

    const isInvalid = key => touchedSave && missing.includes(key);

    const telDigits     = useMemo(()=>String(draft?.cliente_telefono||"").replace(/\D/g,""),[draft?.cliente_telefono]);
    const telIsOk       = useMemo(()=>/^(?:\d{10}|52\d{10})$/.test(telDigits),[telDigits]);
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

    const inputBase = "w-full rounded-lg border shadow-sm px-3 py-2 text-sm text-black font-semibold outline-none";
    const inputOk   = "border-black/15 bg-neutral-100";
    const inputBad  = "border-red-500 bg-red-50";

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

    // ─── RENDER ───────────────────────────────────────────────────────────────
    return (
        <div className="w-full space-y-4">

            {/* ══ HEADER con degradado gris antracita ══ */}
            <div className="relative overflow-hidden rounded-xl shadow-lg"
                style={{background:"linear-gradient(135deg,#111111 0%,#2d2d2d 55%,#3d3d3d 100%)"}}>
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-20 -left-24 h-64 w-64 rounded-full bg-white/5 blur-3xl"/>
                    <div className="absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-white/5 blur-3xl"/>
                </div>

                <div className="relative px-5 py-5 sm:px-7 sm:py-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <h2 className="truncate text-lg font-extrabold text-white sm:text-xl">Control de piso</h2>
                            <p className="mt-1 text-sm text-white/60">Doble clic para editar un registro.</p>
                            {!isAdmin&&userAgencia&&(
                                <p className="mt-1 text-xs font-semibold text-white/40">
                                    Agencia: <span className="text-white/70">{userAgencia}</span>
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Toggle vistas */}
                            <div className="flex overflow-hidden rounded-lg border border-white/20 bg-white/10 p-0.5 backdrop-blur-sm">
                                {VIEWS.map(({key,label,Icon})=>{
                                    const active=activeView===key;
                                    return (
                                        <button key={key} onClick={()=>setActiveView(key)}
                                            className={["inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all",
                                                active?"bg-white text-[#2d2d2d] shadow":"text-white/70 hover:bg-white/15 hover:text-white"].join(" ")}>
                                            <Icon className="h-3.5 w-3.5"/>
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Botón nuevo */}
                            <button onClick={openCreate}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white hover:text-[#2d2d2d]">
                                <Plus className="h-4 w-4"/>
                                Nuevo ingreso
                            </button>
                        </div>
                    </div>
                    <div className="mt-5 h-px w-full bg-gradient-to-r from-white/5 via-white/20 to-white/5"/>
                </div>
            </div>

            {/* ══ FILTROS ══ */}
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

            {/* ══ VISTAS ══ */}

            {activeView==="agenda" && (
                <AgendaView registros={filtered} onOpenEdit={openEdit} onOpenCreate={openCreate}/>
            )}

            {activeView==="graficas" && (
                <GraficasView registros={filtered}/>
            )}

            {activeView==="tabla" && (
                <>
                    {/* Desktop */}
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

                    {/* Mobile */}
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

            {/* ══ MODAL ══ */}
            <Modal open={openModal} title={mode==="create"?"Nuevo ingreso a piso":`Editar • ${draft?.id}`} onClose={closeModal}
                footer={
                    <>
                        <button onClick={closeModal} disabled={saving}
                            className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60">
                            <X className="h-4 w-4"/> Cancelar
                        </button>
                        <button onClick={save} disabled={saving||loadingDetail||telInvalid||(draft?.cliente_telefono?!telIsOk:false)}
                            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-bold text-white hover:bg-black/80 disabled:opacity-60 transition">
                            {saving?<Loader2 className="h-4 w-4 animate-spin"/>:<Save className="h-4 w-4"/>}
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
                                className={["w-full rounded-lg border px-3 py-2 text-sm font-black transition",
                                    draft.be_back?"border-emerald-300 bg-emerald-100 text-emerald-800":"border-red-200 bg-red-50 text-red-700"].join(" ")}>
                                {draft.be_back?"✓ Regresó":"✗ No regresó"}
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