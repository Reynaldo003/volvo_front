// src/components/Topbar.jsx
import { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
    CalendarDays,
    Car,
    ClipboardList,
    Gauge,
    Handshake,
    LayoutDashboard,
    Menu,
    UserRoundSearch,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const BASE_PATH = "/crm_volvo";

const TITULOS = [
    {
        path: `${BASE_PATH}/`,
        title: "Inicio",
        exact: true,
    },
    {
        path: `${BASE_PATH}/comercial`,
        title: "Gestión comercial",
    },
    {
        path: `${BASE_PATH}/comercial/prospectos`,
        title: "Prospectos digitales",
    },
    {
        path: `${BASE_PATH}/comercial/contacto`,
        title: "Prospectos digitales",
    },
    {
        path: `${BASE_PATH}/comercial/citas`,
        title: "Citas",
    },
    {
        path: `${BASE_PATH}/comercial/control_piso`,
        title: "Control piso",
    },
    {
        path: `${BASE_PATH}/comercial/trafico_piso`,
        title: "Tráfico piso",
    },
    {
        path: `${BASE_PATH}/comercial/pruebas_manejo`,
        title: "Pruebas de manejo",
    },
    {
        path: `${BASE_PATH}/comercial/entregas`,
        title: "Entregas",
    },
];
const gestionCalidadTabs = [
    {
        label: "Check Recepcion",
        to: `${BASE_PATH}/calidad/checklist_recepcion`,
        icon: UserRoundSearch,
    },
    {
        label: "Check Entrega",
        to: `${BASE_PATH}/calidad/checklist_entrega`,
        icon: CalendarDays,
    },
    {
        label: "Check General",
        to: `${BASE_PATH}/calidad/checklist_general`,
        icon: ClipboardList,
    },
];

const gestionComercialTabs = [
    {
        label: "Prospectos",
        to: `${BASE_PATH}/comercial/prospectos`,
        icon: UserRoundSearch,
    },
    {
        label: "Contacto",
        to: `${BASE_PATH}/comercial/prospectos/contacto`,
        icon: UserRoundSearch,
    },
    {
        label: "Citas",
        to: `${BASE_PATH}/comercial/citas`,
        icon: CalendarDays,
    },
    {
        label: "Control piso",
        to: `${BASE_PATH}/comercial/control_piso`,
        icon: ClipboardList,
    },
    {
        label: "Tráfico piso",
        to: `${BASE_PATH}/comercial/trafico_piso`,
        icon: Gauge,
    },
    {
        label: "Pruebas manejo",
        to: `${BASE_PATH}/comercial/pruebas_manejo`,
        icon: Car,
    },
    {
        label: "Entregas",
        to: `${BASE_PATH}/comercial/entregas`,
        icon: Handshake,
    },
];

function obtenerTitulo(pathname) {
    if (!pathname) {
        return "CRM Volvo";
    }

    const exacta = TITULOS.find((item) => item.exact && item.path === pathname);

    if (exacta) {
        return exacta.title;
    }

    const coincidencias = TITULOS
        .filter((item) => !item.exact)
        .filter((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
        .sort((a, b) => b.path.length - a.path.length);

    return coincidencias[0]?.title || "CRM Volvo";
}

function getTabClass({ isActive }) {
    return [
        "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold whitespace-nowrap transition",
        isActive
            ? "bg-[#212721] text-white shadow-sm"
            : "bg-white text-slate-600 hover:bg-slate-100 hover:text-[#001C3F]",
    ].join(" ");
}

export default function Topbar({ onOpenSidebar }) {
    const { user } = useAuth();
    const location = useLocation();

    const titulo = useMemo(() => {
        return obtenerTitulo(location.pathname);
    }, [location.pathname]);

    const nombreUsuario = useMemo(() => {
        return (
            user?.nombreCompleto ||
            `${user?.nombre || ""} ${user?.apellidos || ""}`.trim() ||
            user?.usuario ||
            "Usuario"
        );
    }, [user]);

    const inicial = useMemo(() => {
        return nombreUsuario.trim().slice(0, 1).toUpperCase() || "U";
    }, [nombreUsuario]);

    const mostrarTopnavGestion = location.pathname.startsWith(
        `${BASE_PATH}/comercial`,
    );

    const mostrarTopnavCalidad = location.pathname.startsWith(
        `${BASE_PATH}/calidad`,
    );

    return (
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
            <div className="px-3 py-3 sm:px-4 md:px-6 lg:px-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={onOpenSidebar}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 lg:hidden"
                            aria-label="Abrir menú"
                        >
                            <Menu size={22} />
                        </button>

                        <div className="min-w-0">
                            <h1 className="mt-1 truncate text-xl font-black text-slate-900 sm:text-2xl lg:text-[30px]">
                                {titulo}
                            </h1>
                        </div>
                    </div>

                    <div className="flex w-full min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-4 md:w-auto md:max-w-[360px]">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#001C3F] text-sm font-black text-white sm:h-11 sm:w-11">
                            {inicial}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-bold text-slate-900">
                                {nombreUsuario}
                            </div>

                            <div className="truncate text-xs text-slate-500 sm:text-sm">
                                {user?.correo || "Sin correo"}
                            </div>
                        </div>
                    </div>
                </div>

                {mostrarTopnavGestion && (
                    <div className="mt-4 overflow-x-auto pb-1">
                        <nav className="flex min-w-max gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-2">
                            {gestionComercialTabs.map(({ label, to, icon: Icon, end }) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    end={end}
                                    className={getTabClass}
                                >
                                    <Icon size={17} />
                                    {label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                )}

                {mostrarTopnavCalidad && (
                    <nav className="flex min-w-max gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-2">
                        {gestionCalidadTabs.map(({ label, to, icon: Icon, end }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={end}
                                className={getTabClass}
                            >
                                <Icon size={17} />
                                {label}
                            </NavLink>
                        ))}
                    </nav>
                )}

            </div>
        </header>
    );
}