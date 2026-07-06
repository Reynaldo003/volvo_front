// src/pages/Comercial/ComercialTopNav.jsx
import { NavLink } from "react-router-dom";
import {
    CalendarDays,
    Car,
    ClipboardList,
    Gauge,
    Handshake,
    LayoutDashboard,
    UserRoundSearch,
} from "lucide-react";

const tabs = [
    {
        label: "Prospectos",
        to: "/comercial/prospectos",
        icon: UserRoundSearch,
    },
    {
        label: "Citas",
        to: "/comercial/citas",
        icon: CalendarDays,
    },
    {
        label: "Control piso",
        to: "/comercial/control_piso",
        icon: ClipboardList,
    },
    {
        label: "Tráfico piso",
        to: "/comercial/trafico_piso",
        icon: Gauge,
    },
    {
        label: "Pruebas manejo",
        to: "/comercial/pruebas_manejo",
        icon: Car,
    },
    {
        label: "Entregas",
        to: "/comercial/entregas",
        icon: Handshake,
    },
];

function getNavClass({ isActive }) {
    return [
        "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold whitespace-nowrap transition",
        isActive
            ? "bg-[#001C3F] text-white shadow-sm"
            : "bg-white text-slate-600 hover:bg-slate-100 hover:text-[#001C3F]",
    ].join(" ");
}

export default function ComercialTopNav() {
    return (
        <div className="overflow-x-auto pb-1">
            <nav className="flex min-w-max gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-2">
                {tabs.map(({ label, to, icon: Icon, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={getNavClass}
                    >
                        <Icon size={17} />
                        {label}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}