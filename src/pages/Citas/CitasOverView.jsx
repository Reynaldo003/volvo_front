// src/pages/Citas/CitasOverView.jsx
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import CitasTopNav from "./CitasTopNav";

const kpis = [
    { label: "Citas agendadas", value: "34", delta: "+8%", up: true },
    { label: "Asistencias confirmadas", value: "21", delta: "+5", up: true },
    { label: "Tasa de asistencia", value: "61%", delta: "+3%", up: true },
    { label: "Citas este mes", value: "34", delta: "+12%", up: true },
];

const trendData = [
    { name: "Lun", agendadas: 5, asistidas: 3 },
    { name: "Mar", agendadas: 7, asistidas: 5 },
    { name: "Mié", agendadas: 6, asistidas: 4 },
    { name: "Jue", agendadas: 8, asistidas: 6 },
    { name: "Vie", agendadas: 9, asistidas: 7 },
    { name: "Sáb", agendadas: 5, asistidas: 3 },
    { name: "Dom", agendadas: 3, asistidas: 1 },
];

const byTipo = [
    { name: "Prueba de Manejo", value: 14 },
    { name: "Tradicional", value: 12 },
    { name: "Digital", value: 8 },
];

const byAuto = [
    { auto: "EX30", citas: 9 },
    { auto: "EX40", citas: 7 },
    { auto: "XC60", citas: 6 },
    { auto: "EX90", citas: 5 },
    { auto: "XC90", citas: 4 },
    { auto: "EC40", citas: 3 },
];

const byFuente = [
    { fuente: "WhatsApp", citas: 11 },
    { fuente: "Facebook", citas: 8 },
    { fuente: "Llamada", citas: 6 },
    { fuente: "Cartera", citas: 5 },
    { fuente: "VW-Conc.", citas: 4 },
];

const recentActivity = [
    { when: "Hace 10 min", who: "Mariana T.", what: "Agendó cita para EX30 • Prueba de Manejo" },
    { when: "Hace 45 min", who: "Enrique V.", what: "Confirmó asistencia de cliente • XC60" },
    { when: "Hoy", who: "Mariana T.", what: "Registró cita digital • EX40" },
    { when: "Ayer", who: "Ricardo P.", what: "Canceló cita • EX90" },
];

const PIE_COLORS = ["#000000", "#404040", "#808080"];

function KpiCard({ label, value, delta, up }) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-black/5 blur-3xl" />
            <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</div>
            <div className="mt-2 text-3xl font-extrabold text-black">{value}</div>
            <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-black/10 bg-slate-50 px-2.5 py-1 text-xs">
                {up ? <ArrowUpRight size={13} className="text-black" /> : <ArrowDownRight size={13} className="text-black" />}
                <span className="font-bold text-black">{delta}</span>
                <span className="text-slate-500">vs semana pasada</span>
            </div>
        </div>
    );
}

function ChartCard({ title, subtitle, children }) {
    return (
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-1 text-sm font-extrabold text-black">{title}</div>
            {subtitle ? <div className="mb-4 text-xs text-slate-500">{subtitle}</div> : <div className="mb-4" />}
            <div className="h-64">{children}</div>
        </div>
    );
}

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-black/10 bg-white p-3 text-xs shadow-md">
            <div className="mb-1 font-extrabold text-black">{label}</div>
            {payload.map((p) => (
                <div key={p.dataKey} className="flex items-center justify-between gap-6">
                    <span className="text-slate-500">{p.name}</span>
                    <span className="font-bold text-black">{p.value}</span>
                </div>
            ))}
        </div>
    );
}

export default function CitasOverView() {
    return (
        <div className="w-full space-y-4">
            <CitasTopNav />

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
            </div>

            {/* fila 1: tendencia + pie */}
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <ChartCard title="Tendencia semanal" subtitle="Citas agendadas vs asistencias">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
                                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="agendadas" name="Agendadas" stroke="#000" fill="#000" fillOpacity={0.1} strokeWidth={2} />
                                <Area type="monotone" dataKey="asistidas" name="Asistidas" stroke="#404040" fill="#404040" fillOpacity={0.1} strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>

                <ChartCard title="Citas por tipo" subtitle="Distribución de modalidad">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                            <Pie data={byTipo} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                                {byTipo.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* fila 2: por auto + por fuente + actividad */}
            <div className="grid gap-4 lg:grid-cols-3">
                <ChartCard title="Citas por modelo" subtitle="Auto de interés más solicitado">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={byAuto} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="auto" tick={{ fontSize: 10, fill: "#6b7280" }} />
                            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="citas" name="Citas" fill="#000" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Citas por fuente" subtitle="Canal de prospección">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={byFuente} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <YAxis dataKey="fuente" type="category" tick={{ fontSize: 10, fill: "#6b7280" }} width={60} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="citas" name="Citas" fill="#404040" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* actividad reciente */}
                <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                    <div className="mb-1 text-sm font-extrabold text-black">Actividad reciente</div>
                    <div className="mb-4 text-xs text-slate-500">Últimas acciones registradas</div>
                    <div className="space-y-3">
                        {recentActivity.map((a, idx) => (
                            <div key={idx} className="rounded-xl border border-black/10 bg-slate-50 p-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-extrabold text-black">{a.who}</span>
                                    <span className="text-slate-500">{a.when}</span>
                                </div>
                                <div className="mt-1 text-xs text-slate-600">{a.what}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}