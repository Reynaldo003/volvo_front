// src/pages/Digitales/DigitalesTopNav.jsx

import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Phone, Contact, ChartNoAxesCombined } from "lucide-react";

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

    // La tarjeta de título azul se quitó: el título "Prospectos" y su
    // descripción ahora viven directamente en DigitalesProspectos.jsx,
    // siguiendo el mismo patrón que el módulo de Citas.
    return null;
}