// src/pages/Citas/CitasTopNav.jsx
import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChartNoAxesCombined, CalendarCheck2 } from "lucide-react";

export default function CitasTopNav() {
    const location = useLocation();

    const tabs = useMemo(
        () => [
            { label: "Citas", href: "/crm_volvo/comercial/citas", icon: CalendarCheck2 },
            { label: "Resumen", href: "/crm_volvo/comercial/citas/resumen", icon: ChartNoAxesCombined },
        ],
        []
    );

    const isActive = (href) => location.pathname === href || location.pathname.startsWith(href + "/");

    return (
        <header className="w-full">
            <div className="relative overflow-hidden rounded-xl shadow-lg bg-black">
                {/* Destellos decorativos */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-20 -left-28 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
                    <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
                </div>

                <div className="relative px-5 py-5 sm:px-7 sm:py-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <h1 className="truncate text-lg font-extrabold text-white sm:text-xl">
                                Gestión de Citas
                            </h1>
                            <p className="mt-1 text-sm text-white/70">
                                Registro y seguimiento de citas.
                            </p>
                        </div>

                        <nav className="flex gap-2 overflow-x-auto">
                            {tabs.map((t) => {
                                const Icon = t.icon;
                                const active = isActive(t.href);
                                return (
                                    <Link
                                        key={t.href}
                                        to={t.href}
                                        className={[
                                            "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition border whitespace-nowrap",
                                            active
                                                ? "border-white/30 bg-white text-black shadow-sm"
                                                : "border-white/20 bg-white/10 text-white/80 hover:bg-white/20 hover:text-white",
                                        ].join(" ")}
                                        aria-current={active ? "page" : undefined}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {t.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="mt-5 h-px w-full bg-gradient-to-r from-white/10 via-white/30 to-white/10" />
                </div>
            </div>
        </header>
    );
}