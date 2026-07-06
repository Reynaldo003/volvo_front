// src/pages/Citas/CitasTopNav.jsx
import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChartNoAxesCombined, CalendarCheck2, CalendarDays } from "lucide-react";

const BASE = "/comercial/citas";

export default function CitasTopNav() {
    const location = useLocation();

    const tabs = useMemo(
        () => [
            { label: "Citas", href: BASE, icon: CalendarCheck2 },
            { label: "Agenda", href: `${BASE}/agenda`, icon: CalendarDays },
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold text-black tracking-tight">Citas</h1>
                    <p className="mt-1 text-sm text-neutral-500">
                        Gestione y dé seguimiento a las citas con sus clientes.
                    </p>
                </div>

                <nav className="flex items-center gap-1 self-start rounded-lg border border-black/10 bg-neutral-50 p-1">
                    {tabs.map((t) => {
                        const Icon = t.icon;
                        const active = isActive(t.href);
                        return (
                            <Link
                                key={t.href}
                                to={t.href}
                                aria-current={active ? "page" : undefined}
                                className={[
                                    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition",
                                    active
                                        ? "bg-white text-black shadow-sm border border-black/10"
                                        : "text-neutral-500 hover:text-black",
                                ].join(" ")}
                            >
                                <Icon className="h-4 w-4" />
                                {t.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}