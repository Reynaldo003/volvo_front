// src/pages/Digitales/DigitalesTopNav.jsx
import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, Phone, Contact, ChartNoAxesCombined, CalendarCheck2, CalendarClock } from "lucide-react";
import vwWhite from "../../assets/vw_white.png";
import ryr from "../../assets/ryr.png";

const BRAND_BLUE = "#131E5C";

export default function DigitalesTopNav() {
    const location = useLocation();

    const tabs = useMemo(
        () => [
            { label: "Avaluos", href: "/avaluos", icon: CalendarCheck2 },
            { label: "Ventas Cruzadas", href: "/citas/resumen", icon: ChartNoAxesCombined },
        ],
        []
    );

    const isActive = (href) => location.pathname.startsWith(href);

    return (
        <header className="w-full">
            <div
                className="relative overflow-hidden rounded-lg shadow-lg"
                style={{ backgroundColor: BRAND_BLUE }}
            >
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-20 -left-28 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/0 to-black/15" />
                </div>

                <div className="relative px-5 py-5 sm:px-7 sm:py-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="font-vw-header truncate text-lg font-extrabold text-white sm:text-xl">
                                    Gestión de Citas
                                </h1>
                            </div>
                            <p className="mt-1 text-sm text-white/80">
                                Registro y seguimiento de citas.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
                            <nav className="flex w-full gap-2 sm:w-auto overflow-x-auto">
                                {tabs.map((t) => {
                                    const Icon = t.icon;
                                    const active = isActive(t.href);
                                    return (
                                        <Link
                                            key={t.href}
                                            to={t.href}
                                            className={[
                                                "group inline-flex flex-1 w-40 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm transition",
                                                "border",
                                                active
                                                    ? "border-white/35 bg-white/20 text-white shadow-sm"
                                                    : "border-white/20 bg-white/10 text-white/85 hover:bg-white/15 hover:text-white",
                                            ].join(" ")}
                                            aria-current={active ? "page" : undefined}
                                        >
                                            <Icon className="h-4 w-4 opacity-90" />
                                            {t.label}
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="flex items-center justify-between gap-3 sm:justify-end">
                                <img
                                    src={vwWhite}
                                    alt="VW"
                                    className="h-10 w-auto opacity-95"
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

                    <div className="mt-5 h-px w-full bg-gradient-to-r from-white/25 via-white/50 to-white/25" />
                </div>
            </div>
        </header>
    );
}
