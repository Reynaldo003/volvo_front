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
                transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
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

// ── Gráfica: Citas por día ────────────────────────────────────────────────────
function ChartCitasDia() {
    const ref = useRef(null);
    useEffect(() => {
        const chart = echarts.init(ref.current, null, { renderer: "canvas" });
        chart.setOption({
            animation: true,
            animationDuration: 1200,
            animationEasing: "cubicOut",
            tooltip: { trigger: "axis", ...ttStyle,
                axisPointer: { type: "cross", crossStyle: { color: "#444" } },
            },
            legend: {
                bottom: 0, icon: "roundRect",
                itemWidth: 10, itemHeight: 10,
                textStyle: { color: "#9ca3af", fontSize: 11 },
            },
            grid: { left: 8, right: 8, top: 8, bottom: 36, containLabel: true },
            xAxis: {
                type: "category", data: citasPorDia.dias,
                axisLine: { lineStyle: { color: "#e5e7eb" } },
                axisTick: { show: false },
                axisLabel: { color: "#9ca3af", fontSize: 11 },
            },
            yAxis: {
                type: "value",
                splitLine: { lineStyle: { color: "#f3f4f6", type: "dashed" } },
                axisLabel: { color: "#9ca3af", fontSize: 11 },
            },
            series: [
                {
                    name: "Semana actual",
                    type: "line", data: citasPorDia.actual,
                    smooth: true, symbol: "circle", symbolSize: 7,
                    lineStyle: { width: 3, color: "#111111" },
                    itemStyle: { color: "#111111", borderWidth: 2, borderColor: "#fff" },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: "rgba(17,17,17,0.18)" },
                            { offset: 1, color: "rgba(17,17,17,0.00)" },
                        ]),
                    },
                },
                {
                    name: "Semana anterior",
                    type: "line", data: citasPorDia.anterior,
                    smooth: true, symbol: "circle", symbolSize: 5,
                    lineStyle: { width: 1.5, color: "#d1d5db", type: "dashed" },
                    itemStyle: { color: "#9ca3af", borderWidth: 2, borderColor: "#fff" },
                },
            ],
        });
        const ro = new ResizeObserver(() => chart.resize());
        ro.observe(ref.current);
        return () => { chart.dispose(); ro.disconnect(); };
    }, []);
    return <div ref={ref} style={{ width: "100%", height: 260 }} />;
}

// ── Gráfica: Prospectos por sucursal ─────────────────────────────────────────
function ChartProspectosSucursal() {
    const ref = useRef(null);
    useEffect(() => {
        const chart = echarts.init(ref.current, null, { renderer: "canvas" });
        chart.setOption({
            animation: true,
            animationDuration: 1000,
            animationEasing: "elasticOut",
            tooltip: { trigger: "axis", ...ttStyle, axisPointer: { type: "shadow" } },
            legend: {
                bottom: 0, icon: "roundRect",
                itemWidth: 10, itemHeight: 10,
                textStyle: { color: "#9ca3af", fontSize: 11 },
            },
            grid: { left: 8, right: 8, top: 8, bottom: 36, containLabel: true },
            xAxis: {
                type: "category", data: prospectosPorSucursal.sucursales,
                axisLine: { lineStyle: { color: "#e5e7eb" } },
                axisTick: { show: false },
                axisLabel: { color: "#9ca3af", fontSize: 11, interval: 0 },
            },
            yAxis: {
                type: "value",
                splitLine: { lineStyle: { color: "#f3f4f6", type: "dashed" } },
                axisLabel: { color: "#9ca3af", fontSize: 11 },
            },
            series: [
                {
                    name: "Nuevos", type: "bar",
                    data: prospectosPorSucursal.nuevos, barWidth: "28%",
                    itemStyle: {
                        borderRadius: [6, 6, 0, 0],
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: "#374151" },
                            { offset: 1, color: "#111111" },
                        ]),
                    },
                },
                {
                    name: "Activos", type: "bar",
                    data: prospectosPorSucursal.activos, barWidth: "28%",
                    itemStyle: {
                        borderRadius: [6, 6, 0, 0],
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: "#9ca3af" },
                            { offset: 1, color: "#6b7280" },
                        ]),
                    },
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
            animationDuration: 1400,
            animationEasing: "cubicOut",
            tooltip: { trigger: "item", ...ttStyle, formatter: "{b}: {c}% ({d}%)" },
            legend: {
                orient: "vertical", right: "2%", top: "center",
                icon: "circle", itemWidth: 8, itemHeight: 8,
                textStyle: { color: "#6b7280", fontSize: 11 },
                formatter: (name) => {
                    const item = conversionData.find(d => d.name === name);
                    return item ? `${name}  ${item.value}%` : name;
                },
            },
            series: [{
                type: "pie",
                radius: ["52%", "80%"],
                center: ["36%", "50%"],
                avoidLabelOverlap: false,
                label: {
                    show: true, position: "center",
                    formatter: () => "24%\nConversión",
                    color: "#111111", fontSize: 14,
                    fontWeight: "bold", lineHeight: 22,
                },
                emphasis: { label: { show: true }, scale: true, scaleSize: 6 },
                labelLine: { show: false },
                data: conversionData.map((d, i) => ({
                    ...d,
                    itemStyle: { color: donaColores[i] },
                })),
            }],
        });
        const ro = new ResizeObserver(() => chart.resize());
        ro.observe(ref.current);
        return () => { chart.dispose(); ro.disconnect(); };
    }, []);
    return <div ref={ref} style={{ width: "100%", height: 260 }} />;
}

// ── Chart Card ────────────────────────────────────────────────────────────────
function ChartCard({ titulo, icono: Icono, children }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: "#ffffff",
                border: hovered ? "1.5px solid #111111" : "1.5px solid #e5e7eb",
                borderRadius: 16,
                overflow: "hidden",
                transform: hovered ? "translateY(-4px)" : "translateY(0)",
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
    const [hora, setHora] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setHora(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const nombreUsuario =
        user?.nombreCompleto ||
        `${user?.nombre || ""} ${user?.apellidos || ""}`.trim() ||
        user?.usuario ||
        "usuario";

    const fechaStr = hora.toLocaleDateString("es-MX", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    const horaStr = hora.toLocaleTimeString("es-MX", {
        hour: "2-digit", minute: "2-digit", second: "2-digit",
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
                        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>·</span>
                        <span style={{ fontSize: 11, color:"#6b7280",
                            fontVariantNumeric: "tabular-nums" }}>
                            {horaStr}
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