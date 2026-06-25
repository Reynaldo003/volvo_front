// src/pages/PruebasManejo/RegistroPruebaManejo.jsx
import { useMemo, useState, useEffect, useRef } from "react";
import {
    Plus, Search, X, Save, User, CarFront, CalendarDays,
    ArrowUpDown, ChevronDown, ChevronUp, Trash2, Loader2,
    Phone, Mail, FileText, Hash, Building2, MessageSquareText,
    Camera, Eye, UploadCloud, Copy, LayoutList, CalendarRange,
    BarChart2, CheckCircle2, Clock, ChevronLeft, ChevronRight,
} from "lucide-react";
import { apiPruebaManejo, apiEvidenciasPruebaManejo } from "../../lib/apiPruebaManejo";
import { createPortal } from "react-dom";
import { useAuth } from "../../auth/AuthContext";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, PieChart, Pie, Cell,
} from "recharts";

const BRAND = "#0c0c0c";
const API_BASE = import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";

function normalizeStr(v) { return String(v ?? "").trim(); }

function Skeleton({ className = "" }) {
    return <div className={["animate-pulse rounded-md bg-black/10", className].join(" ")} />;
}
function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {[36,28,40,28,28,40,28].map((w,i)=>(
                <td key={i} className="px-4 py-3"><div className="h-4 rounded bg-slate-200" style={{width:w*4}}/></td>
            ))}
        </tr>
    );
}
function ModalSkeleton() {
    return (
        <div className="grid gap-3 md:grid-cols-2">
            {Array.from({length:10}).map((_,i)=>(
                <div key={i} className="rounded-lg border border-black/10 bg-neutral-100 p-4">
                    <Skeleton className="h-4 w-32"/><Skeleton className="mt-3 h-10 w-full rounded-lg"/>
                </div>
            ))}
            <div className="md:col-span-2 rounded-lg border border-black/10 bg-neutral-100 p-4">
                <Skeleton className="h-4 w-40"/><Skeleton className="mt-3 h-24 w-full rounded-lg"/>
            </div>
        </div>
    );
}

function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose}/>
            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    <div className="flex items-center justify-between gap-3 px-6 py-4" style={{background:BRAND}}>
                        <div className="truncate text-base font-bold text-white">{title}</div>
                        <button onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors">
                            <X className="h-4 w-4"/>
                        </button>
                    </div>
                    <div className="max-h-[72vh] overflow-auto p-6">{children}</div>
                    {footer && (
                        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Field({ label, icon: Icon, children }) {
    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {Icon && <Icon className="h-3.5 w-3.5"/>}<span>{label}</span>
            </div>
            {children}
        </div>
    );
}
function FilterBlock({ label, children }) {
    return (
        <div>
            <div className="mb-1.5 text-xs font-semibold text-slate-500">{label}</div>
            {children}
        </div>
    );
}

function toDTLocal(isoOrNull) {
    if (!isoOrNull) return "";
    const s = String(isoOrNull);
    if (s.endsWith("Z")) {
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return "";
        const pad = n=>String(n).padStart(2,"0");
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0,16);
    return "";
}
function fromDTLocalToISO(v) { return String(v||"").trim()||null; }
function toYMDLocal(dateLike) {
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return "";
    const pad = n=>String(n).padStart(2,"0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function ymdToInt(ymd) {
    if (!ymd||!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
    return Number(ymd.replaceAll("-",""));
}

function ContextMenu({ ctxMenu, onDelete, onClose }) {
    if (!ctxMenu.open||!ctxMenu.row) return null;
    return createPortal(
        <div className="fixed z-[9999]" style={{left:ctxMenu.x,top:ctxMenu.y}} onClick={e=>e.stopPropagation()}>
            <div className="w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <button className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    onClick={()=>onDelete(ctxMenu.row)}>
                    <Trash2 className="h-4 w-4"/> Eliminar
                </button>
                <button className="w-full px-4 py-2 text-left text-xs text-slate-400 hover:bg-slate-50 transition-colors" onClick={onClose}>
                    Cerrar
                </button>
            </div>
        </div>, document.body
    );
}

function formatBytes(bytes=0) {
    if (!bytes) return "—";
    const units=["B","KB","MB","GB"]; let i=0,v=bytes;
    while(v>=1024&&i<units.length-1){v/=1024;i++;}
    return `${v.toFixed(i===0?0:1)} ${units[i]}`;
}
function resolveMediaUrl(url) {
    const u=String(url||"").trim();
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith("/")) return `${API_BASE}${u}`;
    if (u.startsWith("media/")) return `${API_BASE}/${u}`;
    return `${API_BASE}/media/${u}`;
}
function isImageMime(mime=""){return String(mime||"").toLowerCase().startsWith("image/");}
function guessIsImageFromName(name=""){
    const n=String(name||"").toLowerCase();
    return[".jpg",".jpeg",".png",".webp",".gif"].some(ext=>n.endsWith(ext));
}

function EvidenciasUploader({ evidencias=[], onSubir, onEliminar, disabled }) {
    const inputPickRef=useRef(null), inputCamRef=useRef(null);
    const [preview,setPreview]=useState({open:false,url:"",title:"",mime:""});
    const openPreview=ev=>{const url=resolveMediaUrl(ev?.archivo);if(!url)return;setPreview({open:true,url,title:ev?.nombre_original||"Evidencia",mime:ev?.tipo_mime||""});};
    const closePreview=()=>setPreview({open:false,url:"",title:"",mime:""});
    const copyLink=async ev=>{const url=resolveMediaUrl(ev?.archivo);if(!url)return;try{await navigator.clipboard.writeText(url);alert("Link copiado ✅");}catch{alert("No se pudo copiar.");}};
    return (
        <div className="space-y-3">
            <input ref={inputPickRef} type="file" multiple accept="image/*,video/*,.pdf" className="hidden" onChange={e=>{const f=Array.from(e.target.files||[]);e.target.value="";if(f.length)onSubir?.(f);}}/>
            <input ref={inputCamRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e=>{const f=Array.from(e.target.files||[]);e.target.value="";if(f.length)onSubir?.(f);}}/>
            <div className="grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={()=>inputCamRef.current?.click()} disabled={disabled}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60">
                    <Camera className="h-4 w-4"/> Tomar foto
                </button>
                <button type="button" onClick={()=>inputPickRef.current?.click()} disabled={disabled}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60">
                    <UploadCloud className="h-4 w-4"/> Adjuntar archivos
                </button>
            </div>
            {(!evidencias||evidencias.length===0)?(
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">Sin evidencias adjuntas.</div>
            ):(
                <>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {evidencias.map(ev=>{
                            const url=resolveMediaUrl(ev?.archivo);
                            const isImg=isImageMime(ev?.tipo_mime)||guessIsImageFromName(ev?.nombre_original);
                            return(
                                <div key={ev.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                    <div className="relative aspect-[16/10] bg-slate-100">
                                        {isImg&&url?(<img src={url} alt={ev?.nombre_original||"evidencia"} className="h-full w-full object-cover" loading="lazy" onError={e=>{e.currentTarget.style.display="none";}}/>):(
                                            <div className="flex h-full w-full items-center justify-center text-slate-400"><FileText className="h-7 w-7"/></div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                            <div className="truncate text-xs font-semibold text-white">{ev?.nombre_original||"archivo"}</div>
                                            <div className="text-[10px] text-white/70">{formatBytes(ev?.tamano_bytes||0)}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-1 p-2">
                                        <div className="flex items-center gap-1">
                                            {url&&(<button type="button" onClick={()=>openPreview(ev)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"><Eye className="h-3.5 w-3.5"/> Ver</button>)}
                                            {url&&(<button type="button" onClick={()=>copyLink(ev)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"><Copy className="h-3.5 w-3.5"/> Link</button>)}
                                        </div>
                                        <button type="button" disabled={disabled} onClick={()=>onEliminar?.(ev)} className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-60"><Trash2 className="h-3.5 w-3.5"/> Quitar</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <Modal open={preview.open} title={preview.title||"Evidencia"} onClose={closePreview}
                        footer={<>
                            <button onClick={closePreview} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"><X className="h-4 w-4"/> Cerrar</button>
                            {preview.url&&(<button onClick={()=>window.open(preview.url,"_blank","noopener,noreferrer")} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90" style={{background:BRAND}}><Eye className="h-4 w-4"/> Abrir en pestaña</button>)}
                        </>}>
                        <div className="space-y-3">
                            {preview.url?(
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    {preview.mime.toLowerCase().startsWith("image/")?(<img src={preview.url} alt={preview.title} className="mx-auto max-h-[60vh] w-auto rounded-lg object-contain"/>):(<div className="text-sm text-slate-500 text-center py-8">Este archivo no es imagen. Usa "Abrir en pestaña".</div>)}
                                </div>
                            ):(<div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">No hay URL para previsualizar.</div>)}
                            {preview.url&&<div className="break-all text-xs text-slate-400">{preview.url}</div>}
                        </div>
                    </Modal>
                </>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
//  VISTA AGENDA — Grid de calendario semanal con cuadrícula real
// ═══════════════════════════════════════════════════════════════════════════
const MESES      = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_CORTO = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

// Horas visibles en el grid (7:00 – 17:00, una columna por hora)
const HOURS  = Array.from({ length: 11 }, (_, i) => i + 7); // [7,8,...,17]
const ROW_H  = 90; // alto de cada fila (día)
const DAY_W  = 64; // ancho columna día

function toYMD(d){const p=n=>String(n).padStart(2,"0");return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;}

function fmtHourLabel(h) {
    const ap = h < 12 ? "AM" : "PM";
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}:00 ${ap}`;
}

function AgendaView({ registros, onOpenEdit }) {
    const hoy    = new Date();
    const hoyYMD = toYMD(hoy);

    const getWeekStart = (d) => {
        const s = new Date(d);
        s.setDate(s.getDate() - s.getDay());
        s.setHours(0,0,0,0);
        return s;
    };

    const [weekStart, setWeekStart] = useState(() => getWeekStart(hoy));

    const weekEnd = useMemo(()=>{
        const e = new Date(weekStart);
        e.setDate(e.getDate()+6);
        e.setHours(23,59,59,999);
        return e;
    },[weekStart]);

    const navWeek = dir => {
        setWeekStart(prev=>{
            const n=new Date(prev);
            n.setDate(n.getDate()+dir*7);
            return n;
        });
    };

    const goToday = () => setWeekStart(getWeekStart(hoy));

    const weekDays = useMemo(()=>{
        return Array.from({length:7},(_,i)=>{
            const d=new Date(weekStart);
            d.setDate(d.getDate()+i);
            return d;
        });
    },[weekStart]);

    // Solo días laborales (Lun–Sáb), igual que el calendario de referencia
    const visibleDays = useMemo(() => weekDays.filter(d => d.getDay() !== 0), [weekDays]);

    const weekData = useMemo(()=>{
        const map={};
        registros.forEach(r=>{
            if(!r.fecha_hora_cita) return;
            const d=new Date(r.fecha_hora_cita);
            if(d<weekStart||d>weekEnd) return;
            const k=toYMD(d);
            if(!map[k]) map[k]=[];
            map[k].push(r);
        });
        return map;
    },[registros,weekStart,weekEnd]);

    const weekLabel = useMemo(()=>{
        const s=weekStart, e=weekEnd;
        return `${s.getDate()} – ${e.getDate()} de ${MESES[e.getMonth()]} de ${e.getFullYear()}`;
    },[weekStart,weekEnd]);

    // ¿En qué celda (hora) cae un evento?
    function hourIndexFor(iso) {
        const d = new Date(iso);
        const idx = HOURS.indexOf(d.getHours());
        return idx; // -1 si está fuera del rango visible
    }

    return (
        <div className="flex flex-col gap-3">

            {/* ── Barra superior: semana ── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-100 bg-white px-5 py-3 shadow-sm">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">SEMANA</p>
                    <p className="text-sm font-bold text-slate-800">{weekLabel}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={()=>navWeek(-1)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition">
                        <ChevronLeft className="h-4 w-4"/>
                    </button>
                    <button onClick={goToday}
                        className="h-8 px-4 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
                        Semana actual
                    </button>
                    <button onClick={()=>navWeek(1)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition">
                        <ChevronRight className="h-4 w-4"/>
                    </button>
                </div>
            </div>

            {/* ── Grid de calendario (cuadrícula real) ── */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse" style={{ minWidth: DAY_W + HOURS.length * 130 }}>
                        <thead>
                            <tr>
                                <th
                                    className="sticky left-0 z-10 border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-left"
                                    style={{ width: DAY_W, minWidth: DAY_W }}
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Día</span>
                                </th>
                                {HOURS.map((h) => (
                                    <th
                                        key={h}
                                        className="border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-left last:border-r-0"
                                        style={{ minWidth: 130 }}
                                    >
                                        <span className="text-[11px] font-bold text-slate-400">{fmtHourLabel(h)}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {visibleDays.map((dayObj) => {
                                const ymd     = toYMD(dayObj);
                                const isToday = ymd === hoyYMD;
                                const events  = weekData[ymd] || [];

                                // Eventos agrupados por índice de hora visible
                                const byHourIdx = {};
                                events.forEach((r) => {
                                    const idx = hourIndexFor(r.fecha_hora_cita);
                                    if (idx < 0) return;
                                    if (!byHourIdx[idx]) byHourIdx[idx] = [];
                                    byHourIdx[idx].push(r);
                                });

                                return (
                                    <tr key={ymd} style={{ height: ROW_H }}>
                                        {/* Columna día */}
                                        <td
                                            className={[
                                                "sticky left-0 z-10 border-b border-r border-slate-200 px-2 py-2 align-top",
                                                isToday ? "bg-blue-50/70" : "bg-white",
                                            ].join(" ")}
                                            style={{ width: DAY_W, minWidth: DAY_W }}
                                        >
                                            <div className="flex flex-col items-center">
                                                <span className={`text-[10px] font-bold uppercase tracking-wide ${isToday ? "text-blue-500" : "text-slate-400"}`}>
                                                    {DIAS_CORTO[dayObj.getDay()]}
                                                </span>
                                                <span className={`text-lg font-extrabold leading-none ${isToday ? "text-blue-600" : "text-slate-700"}`}>
                                                    {String(dayObj.getDate()).padStart(2, "0")}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Celdas de hora */}
                                        {HOURS.map((h, hi) => {
                                            const evs = byHourIdx[hi] || [];
                                            return (
                                                <td
                                                    key={h}
                                                    className={[
                                                        "relative border-b border-r border-slate-200 p-1 align-top last:border-r-0",
                                                        isToday ? "bg-blue-50/30" : "bg-white",
                                                    ].join(" ")}
                                                    style={{ minWidth: 130 }}
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        {evs.map((r) => {
                                                            const d = new Date(r.fecha_hora_cita);
                                                            let hh = d.getHours();
                                                            const mm = d.getMinutes();
                                                            const ap = hh < 12 ? "AM" : "PM";
                                                            hh = hh % 12 || 12;
                                                            const timeStr = `${hh}:${String(mm).padStart(2, "0")} ${ap}`;
                                                            return (
                                                                <div
                                                                    key={r.id}
                                                                    onClick={() => onOpenEdit(r)}
                                                                    className="cursor-pointer rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1.5 text-left transition hover:shadow-sm hover:border-indigo-300"
                                                                >
                                                                    <div className="flex items-center justify-between gap-1">
                                                                        <span className="text-[10px] font-bold text-indigo-700">{timeStr}</span>
                                                                        <span className={[
                                                                            "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold border",
                                                                            r.asistencia
                                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                                : "bg-slate-50 text-slate-500 border-slate-200",
                                                                        ].join(" ")}>
                                                                            {r.asistencia ? "Asist" : "Pend"}
                                                                        </span>
                                                                    </div>
                                                                    <div className="truncate text-[11px] font-extrabold text-slate-800 leading-tight">
                                                                        {(r?.cliente?.nombre || "—").toUpperCase()}
                                                                    </div>
                                                                    {r.auto_interes && (
                                                                        <div className="truncate text-[10px] text-slate-500">{r.auto_interes}</div>
                                                                    )}
                                                                    {r.asesor_piso && (
                                                                        <div className="truncate text-[10px] text-slate-400">
                                                                            {r.asesor_piso.split(" ").slice(0, 2).join(" ")}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
//  VISTA GRÁFICAS
// ═══════════════════════════════════════════════════════════════════════════
const CHART_COLORS=[BRAND,"#0f0f0f","#0c0c0c","#050203","#020505"];

function GraficasView({ registros }) {
    const porVehiculo=useMemo(()=>{
        const map={};
        registros.forEach(r=>{const k=r.auto_interes||"Sin especificar";map[k]=(map[k]||0)+1;});
        return Object.entries(map).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
    },[registros]);
    const porAsesor=useMemo(()=>{
        const map={};
        registros.forEach(r=>{const k=r.asesor_piso||"Sin asignar";const short=k.split(" ").slice(0,2).join(" ");map[short]=(map[short]||0)+1;});
        return Object.entries(map).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
    },[registros]);
    const porMes=useMemo(()=>{
        const map={};
        registros.forEach(r=>{if(!r.fecha_hora_cita)return;const d=new Date(r.fecha_hora_cita);const key=`${MESES[d.getMonth()].slice(0,3)} ${d.getFullYear()}`;map[key]=(map[key]||0)+1;});
        return Object.entries(map).map(([name,value])=>({name,value})).slice(-6);
    },[registros]);
    const asistencia=useMemo(()=>{const si=registros.filter(r=>r.asistencia).length;return[{name:"Asistió",value:si},{name:"No asistió",value:registros.length-si}];},[registros]);
    const total=registros.length, asistieron=registros.filter(r=>r.asistencia).length;
    const tooltipStyle={borderRadius:10,border:"1px solid #1c1e20",fontSize:12,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"};
    return (
        <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
                {[
                    {label:"Total pruebas",value:total,icon:CarFront,bg:"bg-indigo-50",icon_c:"text-indigo-600"},
                    {label:"Asistencias",value:asistieron,icon:CheckCircle2,bg:"bg-emerald-50",icon_c:"text-emerald-600"},
                    {label:"Pendientes",value:total-asistieron,icon:Clock,bg:"bg-amber-50",icon_c:"text-amber-600"},
                ].map(({label,value,icon:Icon,bg,icon_c})=>(
                    <div key={label} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}><Icon className={`h-5 w-5 ${icon_c}`}/></div>
                        <div><div className="text-2xl font-bold" style={{color:BRAND}}>{value}</div><div className="text-xs font-semibold text-slate-400">{label}</div></div>
                    </div>
                ))}
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-bold text-slate-700">Pruebas por mes</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={porMes} margin={{top:0,right:0,left:-20,bottom:0}}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#202224"/><XAxis dataKey="name" tick={{fontSize:11,fill:"#111213"}}/><YAxis tick={{fontSize:11,fill:"#131414"}} allowDecimals={false}/><Tooltip contentStyle={tooltipStyle}/><Bar dataKey="value" name="Pruebas" fill={BRAND} radius={[5,5,0,0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-bold text-slate-700">Por modelo de interés</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={porVehiculo} layout="vertical" margin={{top:0,right:0,left:20,bottom:0}}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#0f0f0f" horizontal={false}/><XAxis type="number" tick={{fontSize:11,fill:"#101011"}} allowDecimals={false}/><YAxis type="category" dataKey="name" tick={{fontSize:10,fill:"#050505"}} width={80}/><Tooltip contentStyle={tooltipStyle}/><Bar dataKey="value" name="Pruebas" fill={BRAND} radius={[0,5,5,0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-bold text-slate-700">Por asesor de piso</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={porAsesor} margin={{top:0,right:0,left:-20,bottom:0}}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#141414"/><XAxis dataKey="name" tick={{fontSize:10,fill:"#0d0d0e"}}/><YAxis tick={{fontSize:11,fill:"#111111"}} allowDecimals={false}/><Tooltip contentStyle={tooltipStyle}/><Bar dataKey="value" name="Pruebas" fill="#0d0d0e" radius={[5,5,0,0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-bold text-slate-700">Tasa de asistencia</h3>
                    <div className="flex items-center justify-center gap-8">
                        <ResponsiveContainer width="50%" height={180}>
                            <PieChart><Pie data={asistencia} cx="50%" cy="50%" innerRadius={48} outerRadius={78} dataKey="value" paddingAngle={3}>{asistencia.map((_,i)=><Cell key={i} fill={CHART_COLORS[i]}/>)}</Pie><Tooltip contentStyle={tooltipStyle}/></PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-3">
                            {asistencia.map((item,i)=>(
                                <div key={item.name} className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full" style={{background:CHART_COLORS[i]}}/><span className="text-xs font-semibold text-slate-500">{item.name}</span><span className="text-sm font-bold" style={{color:BRAND}}>{item.value}</span>
                                </div>
                            ))}
                            {total>0&&<div className="pt-1 text-xs font-semibold text-slate-400">{Math.round((asistieron/total)*100)}% asistencia</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export default function RegistroPruebaManejo() {
    const { user } = useAuth();
    const isAdmin = useMemo(()=>{
        const permisos=user?.permisos||[];
        const rol=String(user?.rol||"").trim().toLowerCase();
        return rol==="administrador"||permisos.includes("CRM_DIGITALES")||permisos.includes("ALL")||permisos.includes("USUARIOS_ADMIN");
    },[user]);
    const userAgencia=String(user?.agencia||"").trim();
    const [registros,setRegistros]=useState([]);
    const [activeView,setActiveView]=useState("tabla");

    const VIEWS=[
        {key:"tabla",   label:"Tabla",   Icon:LayoutList},
        {key:"agenda",  label:"Agenda",  Icon:CalendarRange},
        {key:"graficas",label:"Gráficas",Icon:BarChart2},
    ];
    const DEALERS=["Volvo"];
    const ASESORES=["Enrique Vazquez Islas","Ricardo Platas","Verónica Del Rayo Galindo León","Julio Camacho Barragán","Fernanda Romero Aguilar"];
    const VEHICULOS=["EX30","EX40","EC40","EX90","XC60","XC90","XC60 Black Edition","XC90 Black Edition","Seminuevos","Avaluo"];

    const [ctxMenu,setCtxMenu]=useState({open:false,x:0,y:0,row:null});
    const [sort,setSort]=useState({key:"fecha_hora_cita",dir:"desc"});
    const toggleSort=key=>setSort(prev=>prev.key!==key?{key,dir:"asc"}:{key,dir:prev.dir==="asc"?"desc":"asc"});
    const [filters,setFilters]=useState({q:"",agencia:"Todos",rangoDesde:"",rangoHasta:""});
    const [openModal,setOpenModal]=useState(false);
    const [mode,setMode]=useState("create");
    const [draft,setDraft]=useState(null);
    const [loadingList,setLoadingList]=useState(false);
    const [loadingDetail,setLoadingDetail]=useState(false);
    const [saving,setSaving]=useState(false);
    const [subiendoEvidencia,setSubiendoEvidencia]=useState(false);
    const REQUIRED=useMemo(()=>({telefono:"Teléfono",fecha_hora_cita:"Fecha y hora"}),[]);
    const [touchedSave,setTouchedSave]=useState(false);
    const missing=useMemo(()=>{if(!draft)return[];return Object.keys(REQUIRED).filter(key=>{const v=draft[key];return v===null||v===undefined||(typeof v==="string"&&v.trim()==="");});},[draft,REQUIRED]);
    const isInvalid=key=>touchedSave&&missing.includes(key);
    const telDigits=useMemo(()=>String(draft?.telefono||"").replace(/\D/g,""),[draft?.telefono]);
    const telIs10=useMemo(()=>/^\d{10}$/.test(telDigits),[telDigits]);
    const telIs52Plus10=useMemo(()=>/^52\d{10}$/.test(telDigits),[telDigits]);
    const telIsOk=telIs10||telIs52Plus10;
    const telIsNormalized=telIs52Plus10;
    const telError=useMemo(()=>{
        if(!openModal||!draft||!telDigits)return"";
        if(telIs10||telIs52Plus10)return"";
        if(telDigits.length<10)return"Número incompleto (mínimo 10 dígitos)";
        if(telDigits.length===11)return"Número incorrecto (formato inválido)";
        if(telDigits.length===12&&!telDigits.startsWith("52"))return"Para 12 dígitos debe iniciar con 52";
        if(telDigits.length>12)return"Número incorrecto (máximo 12 dígitos)";
        return"Número inválido";
    },[openModal,draft,telDigits,telIs10,telIs52Plus10]);
    const telInvalid=!!telError;
    const inputBase="w-full rounded-lg border px-3 py-2.5 text-sm font-medium outline-none transition-colors";
    const inputOk="border-slate-200 bg-white text-slate-800 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50";
    const inputBad="border-red-300 bg-red-50 text-red-800";

    useEffect(()=>{
        const close=()=>setCtxMenu(p=>({...p,open:false,row:null}));
        window.addEventListener("click",close);window.addEventListener("scroll",close,true);window.addEventListener("resize",close);
        return()=>{window.removeEventListener("click",close);window.removeEventListener("scroll",close,true);window.removeEventListener("resize",close);};
    },[]);

    const onRowContextMenu=(e,row)=>{e.preventDefault();e.stopPropagation();setCtxMenu({open:true,x:e.clientX,y:e.clientY,row});};

    const refreshList=async()=>{
        setLoadingList(true);
        try{const data=await apiPruebaManejo.list();setRegistros(Array.isArray(data)?data:[]);}
        catch(e){console.error(e);setRegistros([]);}
        finally{setLoadingList(false);}
    };
    useEffect(()=>{refreshList();},[]);

    const dealers=useMemo(()=>{
        const set=new Set((registros||[]).map(r=>normalizeStr(r.agencia)).filter(Boolean));
        if(!isAdmin&&userAgencia)return["Todos",userAgencia];
        return["Todos",...Array.from(set)];
    },[registros,isAdmin,userAgencia]);

    const filtered=useMemo(()=>{
        const q=filters.q.trim().toLowerCase();
        const desdeInt=ymdToInt(filters.rangoDesde), hastaInt=ymdToInt(filters.rangoHasta);
        return(registros||[]).filter(r=>{
            if(!isAdmin&&userAgencia&&normalizeStr(r.agencia)!==normalizeStr(userAgencia))return false;
            const matchQ=!q||normalizeStr(r.agencia).toLowerCase().includes(q)||normalizeStr(r?.cliente?.nombre).toLowerCase().includes(q)||normalizeStr(r?.cliente?.telefono).toLowerCase().includes(q)||normalizeStr(r?.cliente?.correo).toLowerCase().includes(q)||normalizeStr(r.auto_interes).toLowerCase().includes(q)||normalizeStr(r.asesor_piso).toLowerCase().includes(q)||normalizeStr(r.num_serie).toLowerCase().includes(q)||normalizeStr(r.folio_salida).toLowerCase().includes(q)||normalizeStr(r.comentarios_cliente).toLowerCase().includes(q);
            const matchAgencia=filters.agencia==="Todos"||normalizeStr(r.agencia)===normalizeStr(filters.agencia);
            let matchRango=true;
            if(desdeInt!==null||hastaInt!==null){const ymdInt=ymdToInt(r.fecha_hora_cita?toYMDLocal(r.fecha_hora_cita):"");if(!ymdInt)return false;if(desdeInt!==null&&ymdInt<desdeInt)matchRango=false;if(hastaInt!==null&&ymdInt>hastaInt)matchRango=false;}
            return matchQ&&matchAgencia&&matchRango;
        });
    },[registros,filters,isAdmin,userAgencia]);

    const sorted=useMemo(()=>{
        const data=[...filtered];const{key,dir}=sort;if(!key)return data;const mult=dir==="asc"?1:-1;
        return data.sort((a,b)=>{
            if(key==="fecha_hora_cita"){const ta=a.fecha_hora_cita?new Date(a.fecha_hora_cita).getTime():0;const tb=b.fecha_hora_cita?new Date(b.fecha_hora_cita).getTime():0;return(ta-tb)*mult;}
            const va=normalizeStr(a?.[key]).toLowerCase(), vb=normalizeStr(b?.[key]).toLowerCase();
            if(va<vb)return-1*mult;if(va>vb)return 1*mult;return 0;
        });
    },[filtered,sort]);

    const openCreate=()=>{
        setTouchedSave(false);setMode("create");
        setDraft({id:null,agencia:isAdmin?"":userAgencia,nombre:"",telefono:"",correo:"",auto_interes:"",fecha_hora_cita:"",asistencia:false,num_serie:"",asesor_piso:"",folio_salida:"",comentarios_cliente:"",evidencias:[]});
        setOpenModal(true);
    };

    const openEdit=async row=>{
        if(!row?.id)return;
        try{
            setTouchedSave(false);setMode("edit");setLoadingDetail(true);setOpenModal(true);
            const c=await apiPruebaManejo.get(row.id);
            if(!isAdmin&&userAgencia&&normalizeStr(c.agencia)!==normalizeStr(userAgencia)){alert("No tienes permisos para ver registros de otra agencia.");setOpenModal(false);return;}
            setDraft({id:c.id,agencia:c.agencia||(isAdmin?"":userAgencia),nombre:c?.cliente?.nombre||"",telefono:c?.cliente?.telefono||"",correo:c?.cliente?.correo||"",auto_interes:c.auto_interes||"",fecha_hora_cita:toDTLocal(c.fecha_hora_cita),asistencia:!!c.asistencia,num_serie:c.num_serie||"",asesor_piso:c.asesor_piso||"",folio_salida:c.folio_salida||"",comentarios_cliente:c.comentarios_cliente||"",evidencias:Array.isArray(c.evidencias)?c.evidencias:[]});
        }catch(e){console.error(e);alert("No se pudo abrir el registro.");setOpenModal(false);}
        finally{setLoadingDetail(false);}
    };

    const closeModal=()=>{if(saving||subiendoEvidencia)return;setOpenModal(false);setDraft(null);};

    const eliminarRegistro=async row=>{
        if(!row?.id)return;
        if(!isAdmin&&userAgencia&&normalizeStr(row.agencia)!==normalizeStr(userAgencia)){alert("No tienes permisos para eliminar registros de otra agencia.");return;}
        const nombre=row?.cliente?.nombre||row?.cliente?.telefono||"esta prueba";
        if(!confirm(`¿Eliminar la prueba de manejo de ${nombre}? Esta acción no se puede deshacer.`))return;
        try{await apiPruebaManejo.remove(row.id);setRegistros(prev=>prev.filter(x=>x.id!==row.id));setCtxMenu({open:false,x:0,y:0,row:null});}
        catch(e){console.error(e);alert("No se pudo eliminar.");}
    };

    const save=async()=>{
        if(!draft||saving)return;setTouchedSave(true);if(missing.length||!telIsOk||telInvalid)return;setSaving(true);
        try{
            const agenciaFinal=isAdmin?normalizeStr(draft.agencia||""):userAgencia;
            const payload={agencia:agenciaFinal,nombre:draft.nombre||"",telefono:normalizeStr(draft.telefono),correo:draft.correo||"",auto_interes:draft.auto_interes||"",fecha_hora_cita:fromDTLocalToISO(draft.fecha_hora_cita),asistencia:!!draft.asistencia,num_serie:draft.num_serie||"",asesor_piso:draft.asesor_piso||"",folio_salida:draft.folio_salida||"",comentarios_cliente:draft.comentarios_cliente||""};
            let saved;
            if(mode==="create")saved=await apiPruebaManejo.create(payload);
            else saved=await apiPruebaManejo.update(draft.id,payload);
            await refreshList();
            if(mode==="create"&&saved?.id){const detalle=await apiPruebaManejo.get(saved.id);setDraft(p=>({...p,id:detalle.id,evidencias:Array.isArray(detalle.evidencias)?detalle.evidencias:[]}));setMode("edit");return;}
            closeModal();
        }catch(e){console.error(e);alert("Error guardando.");}
        finally{setSaving(false);}
    };

    const subirEvidencias=async files=>{
        if(!draft?.id){alert("Primero guarda la prueba para poder adjuntar evidencias.");return;}
        setSubiendoEvidencia(true);
        try{for(const f of files)await apiEvidenciasPruebaManejo.create({id_prueba_manejo:draft.id,archivo:f});const detalle=await apiPruebaManejo.get(draft.id);setDraft(p=>({...p,evidencias:Array.isArray(detalle.evidencias)?detalle.evidencias:[]}));}
        catch(e){console.error(e);alert("No se pudieron subir evidencias.");}
        finally{setSubiendoEvidencia(false);}
    };

    const eliminarEvidencia=async ev=>{
        if(!confirm(`¿Eliminar evidencia "${ev?.nombre_original||"archivo"}"?`))return;
        setSubiendoEvidencia(true);
        try{await apiEvidenciasPruebaManejo.remove(ev.id);const detalle=await apiPruebaManejo.get(draft.id);setDraft(p=>({...p,evidencias:Array.isArray(detalle.evidencias)?detalle.evidencias:[]}));}
        catch(e){console.error(e);alert("No se pudo eliminar evidencia.");}
        finally{setSubiendoEvidencia(false);}
    };

    const resetFilters=()=>setFilters({q:"",agencia:"Todos",rangoDesde:"",rangoHasta:""});
    const setHoy=()=>{const h=toYMDLocal(new Date());setFilters(p=>({...p,rangoDesde:h,rangoHasta:h}));};

    const SortIcon=({k})=>(
        <span className="ml-1 opacity-50">
            {sort.key===k?sort.dir==="asc"?<ChevronUp className="inline h-3.5"/>:<ChevronDown className="inline h-3.5"/>:<ArrowUpDown className="inline h-3.5"/>}
        </span>
    );

    return (
        <div className="w-full space-y-4">
          {/* ── Header premium Pruebas de Manejo ── */}
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
                    Comercial &nbsp;/&nbsp; Pruebas de manejo
                </span>
            </div>

            {/* Selector de vista pill-group */}
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
                    Pruebas de Manejo
                </h2>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                    {!isAdmin && userAgencia
                        ? <span>Agencia: <span style={{ color: "rgba(255,255,255,0.6)" }}>{userAgencia}</span></span>
                        : activeView === "tabla"
                        ? "Registro y seguimiento de pruebas. Doble clic para editar."
                        : activeView === "agenda"
                        ? "Vista semanal de pruebas agendadas."
                        : "Estadísticas de pruebas de manejo."}
                </p>
            </div>

            <div className="flex items-center gap-3">
                {/* Mini-stats dinámicos */}
                <div
                    className="flex items-stretch overflow-hidden rounded-[10px]"
                    style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                >
                    {[
                        { n: registros.length,                                   l: "Total"      },
                        { n: registros.filter(r => r.asistencia).length,         l: "Asistieron" },
                        { n: registros.filter(r => !r.asistencia).length,        l: "Pendientes" },
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
                            <div
                                style={{
                                    fontSize: 10,
                                    color: "rgba(255,255,255,0.3)",
                                    marginTop: 3,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                }}
                            >
                                {s.l}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Botón nueva prueba — oculto en gráficas */}
                {activeView !== "graficas" && (
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
                        Nueva Prueba
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

            {/* ── Agenda ── */}
            {activeView==="agenda"&&<AgendaView registros={filtered} onOpenEdit={openEdit}/>}

            {/* ── Gráficas ── */}
            {activeView==="graficas"&&<GraficasView registros={filtered}/>}

            {/* ── Tabla ── */}
            {activeView==="tabla"&&(
                <>
                    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                        <div className="grid gap-3 md:grid-cols-12">
                            <div className="md:col-span-6">
                                <FilterBlock label="Búsqueda">
                                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-50 transition-all">
                                        <Search className="h-4 w-4 flex-shrink-0 text-slate-400"/>
                                        <input value={filters.q} onChange={e=>setFilters(p=>({...p,q:e.target.value}))} placeholder="Buscar por dealer, cliente, teléfono, serie, folio, asesor…" className="w-full text-sm text-slate-700 bg-transparent outline-none placeholder:text-slate-400"/>
                                        {filters.q&&(<button onClick={()=>setFilters(p=>({...p,q:""}))} className="rounded p-0.5 text-slate-400 hover:text-red-500 transition-colors"><X className="h-3.5 w-3.5"/></button>)}
                                    </div>
                                </FilterBlock>
                            </div>
                            <div className="md:col-span-3">
                                <FilterBlock label="Dealer">
                                    <select value={filters.agencia} onChange={e=>setFilters(p=>({...p,agencia:e.target.value}))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all">
                                        {dealers.map(d=><option key={d} value={d}>{d}</option>)}
                                    </select>
                                </FilterBlock>
                            </div>
                            <div className="md:col-span-3">
                                <FilterBlock label="Acciones">
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={setHoy} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2.5 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"><CalendarDays className="h-3.5 w-3.5"/> Hoy</button>
                                        <button onClick={resetFilters} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"><X className="h-3.5 w-3.5"/> Limpiar</button>
                                    </div>
                                </FilterBlock>
                            </div>
                            <div className="md:col-span-6">
                                <FilterBlock label="Desde"><input type="date" value={filters.rangoDesde} onChange={e=>setFilters(p=>({...p,rangoDesde:e.target.value}))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all"/></FilterBlock>
                            </div>
                            <div className="md:col-span-6">
                                <FilterBlock label="Hasta"><input type="date" value={filters.rangoHasta} onChange={e=>setFilters(p=>({...p,rangoHasta:e.target.value}))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all"/></FilterBlock>
                            </div>
                        </div>
                    </div>

                    {/* Desktop table */}
                    <div className="hidden overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm lg:block">
                        <div className="overflow-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50 text-xs">
                                        {[{key:"fecha_hora_cita",label:"Fecha y hora",sortable:true},{key:"agencia",label:"Dealer",sortable:true},{key:null,label:"Cliente"},{key:null,label:"Auto interés"},{key:null,label:"Asesor piso"},{key:null,label:"No. Serie"},{key:null,label:"Folio salida"}].map(({key,label,sortable})=>(
                                            <th key={label} className="px-4 py-3 font-semibold text-slate-500">
                                                {sortable?(<button type="button" onClick={()=>toggleSort(key)} className="inline-flex items-center gap-1 hover:text-slate-800 transition-colors">{label}<SortIcon k={key}/></button>):label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loadingList?Array.from({length:8}).map((_,i)=><SkeletonRow key={i}/>):(
                                        <>
                                            {sorted.map(row=>(
                                                <tr key={row.id} onDoubleClick={()=>openEdit(row)} onContextMenu={e=>onRowContextMenu(e,row)} className="cursor-pointer transition-colors hover:bg-slate-50" title="Doble clic para editar">
                                                    <td className="px-4 py-3 text-slate-600 text-xs tabular-nums">{row.fecha_hora_cita?toDTLocal(row.fecha_hora_cita).replace("T"," "):"—"}</td>
                                                    <td className="px-4 py-3"><span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold" style={{background:"#EEF1FF",color:BRAND}}>{row.agencia||"—"}</span></td>
                                                    <td className="px-4 py-3"><div className="font-semibold text-slate-800">{row?.cliente?.nombre||"—"}</div><div className="text-xs text-slate-400">{row?.cliente?.telefono||""}</div></td>
                                                    <td className="px-4 py-3 text-slate-600">{row.auto_interes||"—"}</td>
                                                    <td className="px-4 py-3 text-slate-600 text-xs">{row.asesor_piso||"—"}</td>
                                                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{row.num_serie||"—"}</td>
                                                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{row.folio_salida||"—"}</td>
                                                </tr>
                                            ))}
                                            {sorted.length===0&&(<tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No hay resultados con esos filtros.</td></tr>)}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <ContextMenu ctxMenu={ctxMenu} onDelete={async row=>{await eliminarRegistro(row);setCtxMenu({open:false,x:0,y:0,row:null});}} onClose={()=>setCtxMenu({open:false,x:0,y:0,row:null})}/>
                    </div>

                    {/* Mobile */}
                    <div className="grid gap-3 lg:hidden">
                        {loadingList?Array.from({length:5}).map((_,i)=>(<div key={i} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><Skeleton className="h-4 w-48"/><Skeleton className="mt-2 h-3 w-36"/><Skeleton className="mt-3 h-3 w-full"/><Skeleton className="mt-2 h-3 w-3/4"/></div>)):(
                            <>
                                {sorted.map(row=>(
                                    <button key={row.id} onClick={()=>openEdit(row)} className="text-left w-full rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-bold text-slate-800">{row?.cliente?.nombre||"—"}</div>
                                                <div className="mt-0.5 text-xs text-slate-400">{row.agencia||"—"} • {row?.cliente?.telefono||"—"}</div>
                                                <div className="mt-0.5 text-xs text-slate-400">{row.fecha_hora_cita?toDTLocal(row.fecha_hora_cita).replace("T"," "):"—"}</div>
                                                <div className="mt-0.5 text-xs text-slate-400">Serie: {row.num_serie||"—"} • Folio: {row.folio_salida||"—"}</div>
                                            </div>
                                            <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold" style={{background:"#EEF1FF",color:BRAND}}>{row.auto_interes||"—"}</span>
                                        </div>
                                        {row.comentarios_cliente&&<div className="mt-2 text-xs text-slate-500 line-clamp-2">{row.comentarios_cliente}</div>}
                                    </button>
                                ))}
                                {sorted.length===0&&<div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-slate-400">No hay resultados.</div>}
                            </>
                        )}
                    </div>
                </>
            )}

            {/* ── Modal ── */}
            <Modal open={openModal} title={mode==="create"?"Nueva Prueba de Manejo":`Editar prueba #${draft?.id||""}`} onClose={closeModal}
                footer={<>
                    <button onClick={closeModal} disabled={saving||subiendoEvidencia} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"><X className="h-4 w-4"/> Cancelar</button>
                    <button onClick={save} disabled={saving||loadingDetail||subiendoEvidencia||telInvalid||(draft?.telefono?!telIsOk:false)} className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60" style={{background:BRAND}}>
                        {saving?<Loader2 className="h-4 w-4 animate-spin"/>:<Save className="h-4 w-4"/>}
                        {saving?"Guardando...":mode==="create"?"Guardar y continuar":"Guardar cambios"}
                    </button>
                </>}>
                {loadingDetail?<ModalSkeleton/>:!draft?null:(
                    <div className="grid gap-3 md:grid-cols-3">
                        <Field label="Dealer" icon={Building2}>
                            <select value={draft.agencia||""} onChange={e=>setDraft(p=>({...p,agencia:e.target.value}))} disabled={!isAdmin} className={[inputBase,inputOk,!isAdmin?"opacity-60 cursor-not-allowed":""].join(" ")}>
                                <option value="" disabled>Selecciona un dealer...</option>
                                {(isAdmin?DEALERS:(userAgencia?[userAgencia]:DEALERS)).map(d=><option key={d} value={d}>{d}</option>)}
                            </select>
                        </Field>
                        <Field label="Prospecto" icon={User}><input value={draft.nombre} onChange={e=>setDraft(p=>({...p,nombre:e.target.value}))} className={[inputBase,inputOk].join(" ")} placeholder="Nombre completo"/></Field>
                        <Field label="Teléfono" icon={Phone}>
                            <input maxLength={12} value={draft.telefono||""} onChange={e=>setDraft(p=>({...p,telefono:e.target.value.replace(/\D/g,"").slice(0,12)}))} disabled={telIsNormalized} className={[inputBase,(isInvalid("telefono")||telInvalid)?inputBad:inputOk,telIsNormalized?"opacity-60 cursor-not-allowed":""].join(" ")}/>
                            {isInvalid("telefono")&&<p className="mt-1.5 text-xs font-semibold text-red-600">Teléfono es requerido.</p>}
                            {!isInvalid("telefono")&&telError&&<p className="mt-1.5 text-xs font-semibold text-red-600">{telError}</p>}
                        </Field>
                        <Field label="Correo" icon={Mail}><input value={draft.correo} onChange={e=>setDraft(p=>({...p,correo:e.target.value}))} className={[inputBase,inputOk].join(" ")} placeholder="correo@ejemplo.com"/></Field>
                        <Field label="Modelo de interés" icon={CarFront}>
                            <select value={draft.auto_interes||""} onChange={e=>setDraft(p=>({...p,auto_interes:e.target.value}))} className={[inputBase,inputOk].join(" ")}>
                                <option value="" disabled>Selecciona un modelo...</option>
                                {VEHICULOS.map(d=><option key={d} value={d}>{d}</option>)}
                            </select>
                        </Field>
                        <Field label="Fecha y hora" icon={CalendarDays}>
                            <input type="datetime-local" value={draft.fecha_hora_cita} onChange={e=>setDraft(p=>({...p,fecha_hora_cita:e.target.value}))} className={[inputBase,isInvalid("fecha_hora_cita")?inputBad:inputOk].join(" ")}/>
                            {isInvalid("fecha_hora_cita")&&<p className="mt-1.5 text-xs font-semibold text-red-600">Fecha y hora es requerido.</p>}
                        </Field>
                        <Field label="Asesor piso" icon={User}>
                            <select value={draft.asesor_piso||""} onChange={e=>setDraft(p=>({...p,asesor_piso:e.target.value}))} className={[inputBase,inputOk].join(" ")}>
                                <option value="" disabled>Selecciona un asesor...</option>
                                {ASESORES.map(d=><option key={d} value={d}>{d}</option>)}
                            </select>
                        </Field>
                        <Field label="No. Serie" icon={Hash}><input value={draft.num_serie} onChange={e=>setDraft(p=>({...p,num_serie:e.target.value}))} className={[inputBase,inputOk,"font-mono"].join(" ")} placeholder="Ej. 3VWSA..."/></Field>
                        <Field label="Folio pase de salida" icon={FileText}><input value={draft.folio_salida} onChange={e=>setDraft(p=>({...p,folio_salida:e.target.value}))} className={[inputBase,inputOk,"font-mono"].join(" ")}/></Field>
                        <div className="md:col-span-3">
                            <Field label="Comentarios del cliente" icon={MessageSquareText}>
                                <textarea value={draft.comentarios_cliente} onChange={e=>setDraft(p=>({...p,comentarios_cliente:e.target.value}))} className={[inputBase,inputOk,"min-h-[80px] resize-none"].join(" ")} placeholder="Notas / comentarios del cliente..."/>
                            </Field>
                        </div>
                        <div className="md:col-span-3">
                            <Field label="Evidencias" icon={Camera}>
                                <EvidenciasUploader evidencias={draft.evidencias||[]} disabled={saving||subiendoEvidencia} onSubir={subirEvidencias} onEliminar={eliminarEvidencia}/>
                                {!draft.id&&<p className="mt-2 text-xs text-slate-400">* Guarda primero la prueba para poder adjuntar evidencias.</p>}
                            </Field>
                        </div>
                        {subiendoEvidencia&&(
                            <div className="md:col-span-3 flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-sm font-semibold" style={{color:BRAND}}>
                                <Loader2 className="h-4 w-4 animate-spin"/> Procesando evidencias...
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}