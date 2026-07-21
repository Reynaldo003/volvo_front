// src/components/Topbar.jsx
import { NavLink, useLocation } from "react-router-dom";
import {
    CalendarDays,
    Car,
    ClipboardList,
    Gauge,
    Handshake,
    Menu,
    UserRoundSearch,
    ChartNoAxesColumn,
    LayoutPanelTop,
} from "lucide-react";

const gestionCalidadTabs = [
    {
        label: "Check Recepción",
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

const gestionComercialTabs = [
    {
        label: "Prospectos",
        to: "/comercial/prospectos",
        icon: UserRoundSearch,
        end: true,
    },
    {
        label: "Plantillas",
        to: "/comercial/prospectos/plantillas",
        icon: LayoutPanelTop,
    },
    {
        label: "Contacto",
        to: "/comercial/prospectos/contacto",
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
    {
        label: "Campañas Meta",
        to: "/comercial/campanas_meta",
        icon: ChartNoAxesColumn,
    },
];

function TabItem({ label, to, icon: Icon, end = false }) {
    return (
        <NavLink to={to} end={end}>
            {({ isActive }) => (
                <div
                    className={[
                        "group relative flex items-center gap-2.5 px-5 py-3 rounded-xl",
                        "text-[14px] font-medium tracking-wide whitespace-nowrap",
                        "transition-all duration-300 ease-out cursor-pointer",
                        "hover:-translate-y-[2px] hover:shadow-md",
                        isActive
                            ? "bg-slate-100 text-slate-900 shadow-sm"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                    ].join(" ")}
                >
                    <Icon
                        size={18}
                        className="
              transition-all
              duration-300
              group-hover:scale-110
              group-hover:-translate-y-[1px]
            "
                    />

                    <span>{label}</span>

                    <span
                        className={[
                            "absolute left-4 right-4 bottom-0 h-[2px] rounded-full",
                            "transition-all duration-300",
                            isActive
                                ? "bg-slate-900 opacity-100"
                                : "opacity-0 group-hover:opacity-20 bg-slate-900",
                        ].join(" ")}
                    />
                </div>
            )}
        </NavLink>
    );
}

export default function Topbar({ onOpenSidebar }) {
    const location = useLocation();

    const mostrarTopnavGestion = location.pathname.startsWith("/comercial");
    const mostrarTopnavCalidad = location.pathname.startsWith("/calidad");

    const mostrarTabs = mostrarTopnavGestion || mostrarTopnavCalidad;

    const tabs = mostrarTopnavGestion
        ? gestionComercialTabs
        : gestionCalidadTabs;

    return (
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
            {mostrarTabs && (
                <div className="overflow-x-auto border-t border-slate-200 bg-white">
                    <nav className="flex min-w-max gap-2 px-5 py-2">
                        <button
                            type="button"
                            onClick={onOpenSidebar}
                            className="flex lg:hidden items-center justify-center h-9 w-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition shrink-0"
                            aria-label="Abrir menú"
                        >
                            <Menu size={18} />
                        </button>

                        {tabs.map((tab) => (
                            <TabItem
                                key={tab.to}
                                label={tab.label}
                                to={tab.to}
                                icon={tab.icon}
                                end={tab.end}
                            />
                        ))}
                    </nav>
                </div>
            )}
        </header>
    );
}