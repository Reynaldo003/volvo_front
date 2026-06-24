// src/pages/Digitales/DigitalesTopNav.jsx

import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Phone, Contact, ChartNoAxesCombined } from "lucide-react";
import volvoWhite from "../../assets/volvo.png";
import ryr from "../../assets/ryr.png";

const BRAND_BLUE = "#131E5C";

export default function DigitalesTopNav() {
    const location = useLocation();

    const tabs = useMemo(
        () => [
            { label: "Prospectos", href: "/crm_volvo/comercial/", exact: true, icon: Contact },
            { label: "Contacto", href: "/crm_volvo/comercial/contacto", icon: Phone },
        ],
        []
    );

    const isActive = (tab) => {
        if (tab.exact) {
            return location.pathname === tab.href;
        }

        return location.pathname === tab.href || location.pathname.startsWith(`${tab.href}/`);
    };

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
                            <h1 className="truncate text-lg font-extrabold text-white sm:text-xl">
                                Gestión de Prospectos Digitales
                            </h1>

                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">

                            <div className="flex items-center justify-between gap-3 sm:justify-end">
                                <img
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

                    <div className="mt-5 h-px w-full bg-gradient-to-r from-white/25 via-white/50 to-white/25" />
                </div>
            </div>
        </header>
    );
}