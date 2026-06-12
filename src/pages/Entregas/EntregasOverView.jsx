import React from "react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react";

const kpis = [
    { label: "Casos abiertos", value: "18", delta: "+12%", up: true },
    { label: "Alta prioridad", value: "4", delta: "+2", up: true },
    { label: "Tiempo prom. cierre", value: "3.6 días", delta: "-0.8", up: false },
    { label: "Cerrados (mes)", value: "27", delta: "+9%", up: true },
];

const trendData = [
    { name: "Lun", abiertos: 16, cerrados: 6 },
    { name: "Mar", abiertos: 18, cerrados: 8 },
    { name: "Mié", abiertos: 17, cerrados: 7 },
    { name: "Jue", abiertos: 19, cerrados: 9 },
    { name: "Vie", abiertos: 18, cerrados: 11 },
    { name: "Sáb", abiertos: 15, cerrados: 10 },
    { name: "Dom", abiertos: 14, cerrados: 12 },
];

const byStatus = [
    { name: "Nuevo", value: 6 },
    { name: "En análisis", value: 5 },
    { name: "En ejecución", value: 4 },
    { name: "Cerrado", value: 12 },
];

const byType = [
    { tipo: "Retraso", casos: 8 },
    { tipo: "Daño", casos: 5 },
    { tipo: "Calidad", casos: 7 },
    { tipo: "Atención", casos: 4 },
    { tipo: "Documentación", casos: 3 },
];

const activity = [
    { when: "Hace 12 min", who: "Supervisor", what: "Asignó NC-00124 a Taller Norte" },
    { when: "Hace 1 h", who: "Calidad", what: "Agregó evidencia a NC-00123" },
    { when: "Hoy", who: "Atención", what: "Cerró NC-00119 con nota de cierre" },
    { when: "Ayer", who: "Supervisor", what: "Cambió prioridad de NC-00118 a Alta" },
];

const PIE_COLORS = ["#0f172a", "#334155", "#64748b", "#94a3b8"];

function KpiCard({ label, value, delta, up }) {
    return (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-slate-900/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-24 -bottom-24 h-56 w-56 rounded-full bg-slate-500/10 blur-3xl" />

            <div className="text-sm text-slate-600">{label}</div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>

            <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs">
                {up ? (
                    <ArrowUpRight size={14} className="text-slate-900" />
                ) : (
                    <ArrowDownRight size={14} className="text-slate-900" />
                )}
                <span className="font-semibold text-slate-900">{delta}</span>
                <span className="text-slate-500">vs semana pasada</span>
            </div>
        </div>
    );
}

function ChartCard({ title, subtitle, children, rightSlot }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-base font-semibold">{title}</h2>
                    {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
                </div>
                {rightSlot ? rightSlot : null}
            </div>
            <div className="mt-4 h-72">{children}</div>
        </div>
    );
}

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs shadow-sm">
            <div className="font-semibold text-slate-900">{label}</div>
            <div className="mt-1 space-y-1">
                {payload.map((p) => (
                    <div key={p.dataKey} className="flex items-center justify-between gap-6">
                        <span className="text-slate-600">{p.name}</span>
                        <span className="font-semibold text-slate-900">{p.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function DigitalesOverview() {
    return (

        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {kpis.map((k) => (
                    <KpiCard key={k.label} {...k} />
                ))}
            </div>

            {/* Charts */}
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <ChartCard
                        title="Tendencia semanal"
                        subtitle="Abiertos vs Cerrados"
                        rightSlot={
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                                Vista: Semana
                            </div>
                        }
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="abiertos" name="Abiertos" fillOpacity={0.25} />
                                <Area type="monotone" dataKey="cerrados" name="Cerrados" fillOpacity={0.25} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>

                <ChartCard
                    title="Distribución por estado"
                    subtitle="Rendimiento de casos"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Pie
                                data={byStatus}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={62}
                                outerRadius={90}
                                paddingAngle={2}
                            >
                                {byStatus.map((_, idx) => (
                                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <ChartCard
                        title="Casos por categoría"
                        subtitle="Enfoca el esfuerzo donde más duele"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={byType} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="tipo" />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="casos" name="Casos" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-base font-semibold">Actividad reciente</h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Cambios, asignaciones y evidencia.
                    </p>

                    <div className="mt-4 space-y-3">
                        {activity.map((a, idx) => (
                            <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-900">{a.who}</span>
                                    <span className="text-slate-500">{a.when}</span>
                                </div>
                                <div className="mt-1 text-sm text-slate-700">{a.what}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
