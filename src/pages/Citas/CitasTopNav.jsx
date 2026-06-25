// src/pages/Citas/CitasTopNav.jsx
import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChartNoAxesCombined, CalendarCheck2, CalendarDays } from "lucide-react";
import volvoWhite from "../../assets/volvo_sin_fondo.png";
import ryr from "../../assets/ryr.png";
const BASE = "/crm_volvo/comercial/citas";

export default function CitasTopNav() {
    const location = useLocation();

    const tabs = useMemo(
        () => [
            { label: "Citas",    href: BASE,              icon: CalendarCheck2      },
            { label: "Agenda",   href: `${BASE}/agenda`,  icon: CalendarDays        },
            { label: "Gráficas", href: `${BASE}/resumen`, icon: ChartNoAxesCombined },
        ],
        []
    );

    const isActive = (href) => {
        if (href === BASE) return location.pathname === BASE || location.pathname === BASE + "/";
        return location.pathname.startsWith(href);
    };

    return (
        <header className="w-full">
            <div
                className="relative overflow-hidden rounded-2xl"
                style={{
                    background: "linear-gradient(135deg, #3a3a3a 0%, #1c1c1c 45%, #050505 100%)",
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

                    {/* Fila 1 — breadcrumb + tabs */}
                    <div className="flex items-center justify-between mb-5">

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
                                Comercial &nbsp;/&nbsp; Citas
                            </span>
                        </div>

                        <nav
                            className="flex gap-1 p-[3px] rounded-[10px]"
                            style={{
                                background: "rgba(255,255,255,0.05)",
                                border: "0.5px solid rgba(255,255,255,0.08)",
                            }}
                        >
                            {tabs.map((t) => {
                                const Icon   = t.icon;
                                const active = isActive(t.href);
                                return (
                                    <Link
                                        key={t.href}
                                        to={t.href}
                                        aria-current={active ? "page" : undefined}
                                        className="inline-flex items-center gap-1.5 whitespace-nowrap transition-all"
                                        style={{
                                            padding: "6px 14px",
                                            borderRadius: 7,
                                            fontSize: 12,
                                            fontWeight: 500,
                                            textDecoration: "none",
                                            background: active ? "rgba(255,255,255,0.12)" : "transparent",
                                            border: active
                                                ? "0.5px solid rgba(255,255,255,0.18)"
                                                : "0.5px solid transparent",
                                            color: active ? "#ffffff" : "rgba(255,255,255,0.38)",
                                        }}
                                    >
                                        <Icon size={13} />
                                        {t.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">

                            <div className="flex items-center justify-between gap-3 sm:justify-end">
                                /*<img
                                    src={volvoWhite}
                                    alt="Volvo"
                                    className="h-10 w-auto opacity-95 rounded-lg"
                                    loading="lazy"
                                />

                                <img
                                    src={ryr}
                                    alt="RYR"
                                    className="h-10 w-auto opacity-95"
                                    loading="lazy"
                                />
                            </div>
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

                    {/* Fila 2 — título + stats */}
                    <div className="flex items-end justify-between gap-4 pb-5">

                        <div>
                            <h1
                                style={{
                                    fontSize: 26,
                                    fontWeight: 500,
                                    color: "#ffffff",
                                    margin: "0 0 5px",
                                    letterSpacing: "-0.02em",
                                    lineHeight: 1.1,
                                }}
                            >
                                Gestión de Citas
                            </h1>
                            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                                Registro y seguimiento de citas.
                            </p>
                        </div>

                        <div
                            className="flex items-stretch overflow-hidden rounded-[10px]"
                            style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                        >
                            {[
                                { n: "34",  l: "Este mes"   },
                                { n: "61%", l: "Asistencia" },
                            ].map((s, i) => (
                                <div
                                    key={i}
                                    className="text-center px-[18px] py-[10px]"
                                    style={{
                                        background: "rgba(255,255,255,0.04)",
                                        borderLeft: i > 0 ? "0.5px solid rgba(255,255,255,0.08)" : "none",
                                    }}
                                >
                                    <div style={{ fontSize: 20, fontWeight: 500, color: "#fff", lineHeight: 1 }}>
                                        {s.n}
                                    </div>
                                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                        {s.l}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Franja inferior */}
                <div
                    style={{
                        height: 3,
                        background: "linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 30%, #1f1f1f 60%, #111 100%)",
                    }}
                />
            </div>
        </header>
    );
}