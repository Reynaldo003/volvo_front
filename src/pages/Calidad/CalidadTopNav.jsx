// src/pages/Calidad/CalidadTopNav.jsx
import { useMemo } from "react";
import { Link, useLocation, NavLink } from "react-router-dom";
import { LayoutGrid, Phone, Contact, ChartNoAxesCombined } from "lucide-react";
import {
    CalendarDays,
    Car,
    ClipboardList,
    Gauge,
    Handshake,
    LayoutDashboard,
    UserRoundSearch,
} from "lucide-react";
import vwWhite from "../../assets/vw_white.png";
import ryr from "../../assets/ryr.png";

const BRAND_BLUE = "#131E5C";

const tabs = [
    {
        label: "Check Recepcion",
        to: "/calidad/checklist_recepcion",
        icon: UserRoundSearch,
    },
    {
        label: "Check Entrega",
        to: "/calidad/checklist_entrega",
        icon: CalendarDays,
    },
    {
        label: "Check General",
        to: "/calidad/checklist_general",
        icon: ClipboardList,
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

export default function CalidadTopNav() {
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
