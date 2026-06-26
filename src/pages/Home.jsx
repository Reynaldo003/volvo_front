// src/pages/Home.jsx
import { useAuth } from "../auth/AuthContext";
import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import {
    CalendarDays,
    Users,
    TrendingUp,
    CarFront,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";

// ── Datos simulados ───────────────────────────────────────────────────────────
const kpis = [
    { titulo: "Citas este mes",          valor: "142", delta: "+12%", positivo: true,  sub: "vs. mes anterior", icono: CalendarDays },
    { titulo: "Prospectos activos",      valor: "128", delta: "+8%",  positivo: true,  sub: "vs. mes anterior", icono: Users },
    { titulo: "Conversión mensual",      valor: "24%", delta: "-2%",  positivo: false, sub: "vs. mes anterior", icono: TrendingUp },
    { titulo: "Unidades en seguimiento", valor: "37",  delta: "+5%",  positivo: true,  sub: "vs. mes anterior", icono: CarFront },
];

const citasPorDia = {
    dias:    ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    actual:  [10, 9, 15, 20, 16, 7, 3],
    anterior:[8, 14, 10, 18, 12, 5, 2],
};

const prospectosPorSucursal = {
    sucursales: ["Córdoba", "Orizaba", "Poza Rica", "Tuxpan", "Tuxtepec"],
    nuevos:  [22, 18, 31, 14, 25],
    activos: [45, 38, 60, 29, 52],
};

const conversionData = [
    { value: 24, name: "Convertidos"    },
    { value: 41, name: "En seguimiento" },
    { value: 22, name: "Sin contactar"  },
    { value: 13, name: "Perdidos"       },
];
// colores oscuros monocromáticos para la dona
const donaColores = ["#1a1a1a", "#3d3d3d", "#6b6b6b", "#a3a3a3"];

// ── Tooltip compartido ────────────────────────────────────────────────────────
const ttStyle = {
    backgroundColor: "#111111",
    borderColor: "#222222",
    textStyle: { color: "#f5f5f5", fontSize: 12 },
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ titulo, valor, delta, positivo, sub, icono: Icono }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: hovered ? "#111111" : "#ffffff",
                border: hovered ? "1.5px solid #111111" : "1.5px solid #e5e7eb",
                borderRadius: 16,
                padding: "20px 22px",
                cursor: "default",
                transform: hovered ? "translateY(-5px)" : "translateY(0)",
                boxShadow: hovered
                    ? "0 20px 40px rgba(0,0,0,0.18)"
                    : "0 1px 4px rgba(0,0,0,0.05)",
                transition:"all .65s cubic-bezier(.22,1,.36,1)",
                color: hovered ? "#ffffff" : "#111111",
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <p style={{
                    fontSize: 12, fontWeight: 600, letterSpacing: "0.02em",
                    color: hovered ? "rgba(255,255,255,0.55)" : "#6b7280",
                    textTransform: "uppercase",
                }}>
                    {titulo}
                </p>
                <span style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 36, height: 36, borderRadius: 10,
                    background: hovered ? "rgba(255,255,255,0.10)" : "#f3f4f6",
                    transition: "all 0.25s ease",
                    transform: hovered ? "scale(1.1)" : "scale(1)",
                }}>
                    <Icono size={17} color={hovered ? "#ffffff" : "#374151"} strokeWidth={2} />
                </span>
            </div>

            <div style={{ marginTop: 18, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                <span style={{ fontSize: "2.4rem", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1 }}>
                    {valor}
                </span>
                <span style={{
                    display: "flex", alignItems: "center", gap: 2,
                    fontSize: 11, fontWeight: 700,
                    padding: "3px 9px", borderRadius: 99,
                    background: hovered
                        ? (positivo ? "rgba(255,255,255,0.12)" : "rgba(255,80,80,0.18)")
                        : (positivo ? "#f0fdf4" : "#fef2f2"),
                    color: hovered
                        ? (positivo ? "#86efac" : "#fca5a5")
                        : (positivo ? "#15803d" : "#b91c1c"),
                }}>
                    {positivo ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {delta}
                </span>
            </div>
            <p style={{
                marginTop: 6, fontSize: 11,
                color: hovered ? "rgba(255,255,255,0.35)" : "#9ca3af",
            }}>
                {sub}
            </p>
        </div>
    );
}

function ChartCitasDia() {
    const ref = useRef(null);
    useEffect(() => {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const gridC  = isDark ? '#2c2c2a' : '#e1e0d9';
        const mutedC = '#898781';
        const surfC  = isDark ? '#1a1a19' : '#ffffff';

        const chart = echarts.init(ref.current, null, { renderer: 'canvas' });
        chart.setOption({
            animation: true,
            animationDuration: 1200,
            animationEasing: 'cubicInOut',
            tooltip: {
                trigger: 'axis',
                backgroundColor: isDark ? '#1a1a19' : '#0b0b0b',
                borderColor: 'transparent',
                textStyle: { color: '#fff', fontSize: 12 },
                axisPointer: {
                    type: 'line',
                    lineStyle: { color: gridC, width: 1, type: 'dashed' },
                },
            },
            legend: { show: false },
            grid: { left: 8, right: 12, top: 8, bottom: 28, containLabel: true },
            xAxis: {
                type: 'category',
                data: citasPorDia.dias,
                boundaryGap: false,
                axisLine: { lineStyle: { color: gridC, width: 0.5 } },
                axisTick: { show: false },
                axisLabel: { color: mutedC, fontSize: 11 },
            },
            yAxis: {
                type: 'value',
                min: 0, max: 26,
                splitLine: { lineStyle: { color: gridC, width: 0.5 } },
                axisLabel: { color: mutedC, fontSize: 11 },
                axisLine: { show: false },
                axisTick: { show: false },
            },
            series: [
                {
                    name: 'Anterior',
                    type: 'line',
                    data: citasPorDia.anterior,
                    smooth: 0.45,
                    symbol: 'none',
                    lineStyle: { width: 1.5, color: mutedC, type: 'dashed' },
                    z: 1,
                },
                {
                    name: 'Esta semana',
                    type: 'line',
                    data: citasPorDia.actual,
                    smooth: 0.45,
                    symbol: 'circle',
                    symbolSize: (val) =>
                        val === Math.max(...citasPorDia.actual) ? 10 : 7,
                    lineStyle: { width: 2.5, color: '#050505' },
                    itemStyle: {
                        color: (p) =>
                            p.value === Math.max(...citasPorDia.actual)
                                ? '#242425'
                                : surfC,
                        borderColor: '#141414',
                        borderWidth: 2,
                    },
                    areaStyle: {
                        color: isDark
                            ? 'rgba(42,120,214,0.08)'
                            : 'rgba(42,120,214,0.06)',
                    },
                    z: 2,
                },
            ],
        });

        const ro = new ResizeObserver(() => chart.resize());
        ro.observe(ref.current);
        return () => { chart.dispose(); ro.disconnect(); };
    }, []);

    return (
        <>
            <div style={{ display: 'flex', gap: 16, marginBottom: 14, fontSize: 11, color: '#898781' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#070707', display: 'inline-block' }} />
                    Esta semana
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 16, height: 0, borderTop: '1.5px dashed #252525', display: 'inline-block', marginBottom: 1 }} />
                    Anterior
                </span>
            </div>
            <div ref={ref} style={{ width: '100%', height: 220 }} />
        </>
    );
}

// ── Gráfica: Prospectos por sucursal — Barras + delta ────────────────────────
function ChartProspectosSucursal() {
    const ref = useRef(null);
    useEffect(() => {
        const chart = echarts.init(ref.current, null, { renderer: "canvas" });

        const sucursales = [...prospectosPorSucursal.sucursales].reverse();
        const nuevos     = [...prospectosPorSucursal.nuevos].reverse();
        const activos    = [...prospectosPorSucursal.activos].reverse();
        const maxVal     = Math.max(...activos) + 14;

        chart.setOption({
            animation: true,
            animationDuration: 1600,
            animationEasing: "cubicOut",
            animationDelay: (idx) => idx * 80,
            tooltip: {
                trigger: "axis",
                axisPointer: { type: "none" },
                ...ttStyle,
                formatter: (params) => {
                    const nombre = params[0].name;
                    const nv = params.find(p => p.seriesName === "Nuevos")?.value ?? 0;
                    const ac = params.find(p => p.seriesName === "Activos")?.value ?? 0;
                    const delta = ac - nv;
                    return `
                        <div style="font-weight:700;margin-bottom:6px;color:#f5f5f5">${nombre}</div>
                        <div style="display:flex;align-items:center;gap:8px;margin-top:3px">
                            <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:#111111"></span>
                            <span style="color:#d1d5db">Nuevos:</span>
                            <span style="font-weight:700;color:#fff">${nv}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;margin-top:3px">
                            <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:#9ca3af"></span>
                            <span style="color:#d1d5db">Activos:</span>
                            <span style="font-weight:700;color:#fff">${ac}</span>
                        </div>
                        <div style="margin-top:6px;padding-top:6px;border-top:1px solid #333;color:#86efac;font-weight:700">
                            +${delta} conversión
                        </div>`;
                },
            },
            legend: {
                bottom: 0,
                icon: "roundRect",
                itemWidth: 10, itemHeight: 6,
                itemGap: 20,
                textStyle: { color: "#9ca3af", fontSize: 11 },
            },
            grid: { left: 12, right: 56, top: 8, bottom: 36, containLabel: true },
            xAxis: {
                type: "value",
                max: maxVal,
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { color: "#9ca3af", fontSize: 11 },
                splitLine: { lineStyle: { color: "#f3f4f6", type: "dashed" } },
            },
            yAxis: {
                type: "category",
                data: sucursales,
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: {
                    color: "#374151",
                    fontSize: 12,
                    fontWeight: 700,
                },
            },
            series: [
                {
                    name: "Activos",
                    type: "bar",
                    data: activos,
                    barWidth: 10,
                    barGap: "60%",
                    itemStyle: {
                        borderRadius: [0, 6, 6, 0],
                        color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
                            { offset: 0, color: "#9ca3af" },
                            { offset: 1, color: "#e5e7eb" },
                        ]),
                    },
                    label: {
                        show: true,
                        position: "right",
                        color: "#9ca3af",
                        fontSize: 11,
                        fontWeight: 700,
                    },
                    z: 1,
                },
                {
                    name: "Nuevos",
                    type: "bar",
                    data: nuevos,
                    barWidth: 10,
                    itemStyle: {
                        borderRadius: [0, 6, 6, 0],
                        color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
                            { offset: 0, color: "#111111" },
                            { offset: 1, color: "#374151" },
                        ]),
                    },
                    label: {
                        show: true,
                        position: "right",
                        color: "#374151",
                        fontSize: 11,
                        fontWeight: 700,
                    },
                    z: 2,
                },
            ],
        });

        const ro = new ResizeObserver(() => chart.resize());
        ro.observe(ref.current);
        return () => { chart.dispose(); ro.disconnect(); };
    }, []);
    return <div ref={ref} style={{ width: "100%", height: 260 }} />;
}
// ── Gráfica: Conversión dona ──────────────────────────────────────────────────
function ChartConversion() {
    const ref = useRef(null);
    useEffect(() => {
        const chart = echarts.init(ref.current, null, { renderer: "canvas" });
        chart.setOption({
            animation: true,
            animationDuration: 2000,
            animationEasing: "cubicOut",
            tooltip: {
                trigger: "item",
                ...ttStyle,
                formatter: "{b}: {c}%",
            },
            series: [
                // Arco de fondo
                {
                    type: "gauge",
                    startAngle: 200,
                    endAngle: -20,
                    min: 0,
                    max: 100,
                    radius: "88%",
                    center: ["50%", "58%"],
                    splitNumber: 0,
                    pointer: { show: false },
                    progress: {
                        show: true,
                        width: 22,
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                                { offset: 0, color: "#374151" },
                                { offset: 1, color: "#111111" },
                            ]),
                        },
                    },
                    axisLine: {
                        lineStyle: {
                            width: 22,
                            color: [[1, "#f3f4f6"]],
                        },
                    },
                    axisTick: { show: false },
                    splitLine: { show: false },
                    axisLabel: { show: false },
                    detail: {
                        valueAnimation: true,
                        fontSize: 32,
                        fontWeight: 900,
                        color: "#111111",
                        formatter: "{value}%",
                        offsetCenter: [0, "-8%"],
                    },
                    title: {
                        offsetCenter: [0, "22%"],
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#9ca3af",
                        text: "Conversión",
                    },
                    data: [{ value: 24, name: "Conversión" }],
                },
                // Arco decorativo interior
                {
                    type: "gauge",
                    startAngle: 200,
                    endAngle: -20,
                    min: 0,
                    max: 100,
                    radius: "68%",
                    center: ["50%", "58%"],
                    splitNumber: 0,
                    pointer: { show: false },
                    progress: {
                        show: true,
                        width: 8,
                        itemStyle: { color: "#e5e7eb" },
                    },
                    axisLine: {
                        lineStyle: { width: 8, color: [[1, "#f9fafb"]] },
                    },
                    axisTick: { show: false },
                    splitLine: { show: false },
                    axisLabel: { show: false },
                    detail: { show: false },
                    title: { show: false },
                    data: [{ value: 41 }],
                },
            ],
        });
        const ro = new ResizeObserver(() => chart.resize());
        ro.observe(ref.current);
        return () => { chart.dispose(); ro.disconnect(); };
    }, []);

    return (
        <div style={{ position: "relative", width: "100%", height: 280 }}>
            <div ref={ref} style={{ width: "100%", height: "100%" }} />
            {/* Leyenda manual debajo */}
            <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                display: "flex", justifyContent: "center", gap: 16,
                flexWrap: "wrap",
            }}>
                {conversionData.map((d, i) => (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: donaColores[i],
                            display: "inline-block",
                        }} />
                        <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}>
                            {d.name} <strong style={{ color: "#374151" }}>{d.value}%</strong>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Chart Card ────────────────────────────────────────────────────────────────
function ChartCard({ titulo, icono: Icono, children }) {
    const [hovered, setHovered] = useState(false);
const [visible, setVisible] = useState(false);

useEffect(() => {
    const t = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(t);
}, []);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: "#ffffff",
                border: hovered ? "1.5px solid #111111" : "1.5px solid #e5e7eb",
                borderRadius: 16,
                overflow: "hidden",
               transform: visible
    ? (hovered
        ? "translateY(-8px) scale(1.01)"
        : "translateY(0) scale(1)")
    : "translateY(35px) scale(.97)",
                boxShadow: hovered
                    ? "0 20px 40px rgba(0,0,0,0.12)"
                    : "0 1px 4px rgba(0,0,0,0.05)",
                transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
            }}
        >
            <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "14px 18px 12px",
                borderBottom: "1px solid #f3f4f6",
            }}>
                {Icono && <Icono size={14} color="#6b7280" strokeWidth={2.2} />}
                <p style={{ fontSize: 12, fontWeight: 700, color: "#374151",
                    letterSpacing: "0.03em", textTransform: "uppercase" }}>
                    {titulo}
                </p>
            </div>
            <div style={{ padding: "12px 16px 14px" }}>{children}</div>
        </div>
    );
}

// ── Home ──────────────────────────────────────────────────────────────────────
export default function Home() {
    const { user } = useAuth();

    const nombreUsuario =
        user?.nombreCompleto ||
        `${user?.nombre || ""} ${user?.apellidos || ""}`.trim() ||
        user?.usuario ||
        "usuario";

  const fechaActual = new Date();

const fechaStr = fechaActual.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
});

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* ── Hero ── */}
            <section style={{
                background: "#ffffff",
                border:"1px solid #e5e7eb",
                boxShadow:"0 10px 30px rgba(0,0,0,.06)",
                borderRadius: 18,
                padding: "32px 36px 28px",
                color: "#111827",
                position: "relative",
                overflow: "hidden",
            }}>
                {/* patrón de puntos sutil */}
                <div style={{
                    position: "absolute", inset: 0, opacity: 0.04,
                    backgroundImage: "radial-gradient(#11182710 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                    pointerEvents: "none",
                }} />

                <div style={{ position: "relative" }}>
                    {/* eyebrow */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                        <span style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: "0.16em",
                            textTransform: "uppercase", color:"#6b7280",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: 99, padding: "3px 10px",
                        }}>
                           
                        </span>
                        
                    </div>

                    {/* nombre */}
                    <h2 style={{ fontSize: "clamp(1.7rem,3vw,2.4rem)", fontWeight: 900,
                        letterSpacing: "-0.03em", lineHeight: 1.1, margin: 0 }}>
                        Bienvenido, {nombreUsuario}.
                    </h2>
                    <p style={{ marginTop: 8, fontSize: 13, color:"#6b7280",
                        textTransform: "capitalize" }}>
                        {fechaStr}
                    </p>

                    {/* divider */}
                    <div style={{ height: 1, background:"#f3f4f6", margin: "20px 0" }} />

                    {/* mini stats */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 28 }}>
                        {[
                            { label: "Sucursales", valor: "5 activas" },
                            { label: "Asesores en línea", valor: "12" },
                            { label: "Actividad hoy", valor: "Alta" },
                            { label: "Red de concesionarios", valor: "VW México" },
                        ].map(({ label, valor }) => (
                            <div key={label}>
                                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
                                    textTransform: "uppercase", color:"#6b7280",
                                    margin: 0 }}>
                                    {label}
                                </p>
                                <p style={{ fontSize: 15, fontWeight: 700, color: "#111827",
                                    margin: "3px 0 0" }}>
                                    {valor}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── KPIs ── */}
            <section style={{ display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
                {kpis.map((k) => <KpiCard key={k.titulo} {...k} />)}
            </section>

            {/* ── Gráficas fila 1 ── */}
            <section style={{ display: "grid",
                gridTemplateColumns: "2fr 1fr", gap: 14 }}>
                <ChartCard titulo="Citas por día — semana actual vs. anterior" icono={CalendarDays}>
                    <ChartCitasDia />
                </ChartCard>
                <ChartCard titulo="Conversión mensual" icono={TrendingUp}>
                    <ChartConversion />
                </ChartCard>
            </section>

            {/* ── Gráficas fila 2 ── */}
            <ChartCard titulo="Prospectos por sucursal — nuevos vs. activos" icono={Users}>
                <ChartProspectosSucursal />
            </ChartCard>

        </div>
    );
}