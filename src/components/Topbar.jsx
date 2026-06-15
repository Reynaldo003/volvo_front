// src/components/Topbar.jsx
import { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
    CalendarDays,
    Car,
    ClipboardList,
    Gauge,
    Handshake,
    Menu,
    UserRoundSearch,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const BASE_PATH = "/crm_volvo";

const TITULOS = [
    { path: `${BASE_PATH}/`,                          title: "Inicio",               exact: true },
    { path: `${BASE_PATH}/comercial`,                 title: "Gestión comercial" },
    { path: `${BASE_PATH}/comercial/prospectos`,      title: "Prospectos digitales" },
    { path: `${BASE_PATH}/comercial/citas`,           title: "Citas" },
    { path: `${BASE_PATH}/comercial/control_piso`,    title: "Control piso" },
    { path: `${BASE_PATH}/comercial/trafico_piso`,    title: "Tráfico piso" },
    { path: `${BASE_PATH}/comercial/pruebas_manejo`,  title: "Pruebas de manejo" },
    { path: `${BASE_PATH}/comercial/entregas`,        title: "Entregas" },
];

const gestionCalidadTabs = [
    { label: "Check Recepción", to: `${BASE_PATH}/calidad/checklist_recepcion`, icon: UserRoundSearch },
    { label: "Check Entrega",   to: `${BASE_PATH}/calidad/checklist_entrega`,   icon: CalendarDays },
    { label: "Check General",   to: `${BASE_PATH}/calidad/checklist_general`,   icon: ClipboardList },
];

const gestionComercialTabs = [
    { label: "Prospectos",      to: `${BASE_PATH}/comercial/prospectos`,     icon: UserRoundSearch },
    { label: "Citas",           to: `${BASE_PATH}/comercial/citas`,          icon: CalendarDays },
    { label: "Control piso",    to: `${BASE_PATH}/comercial/control_piso`,   icon: ClipboardList },
    { label: "Tráfico piso",    to: `${BASE_PATH}/comercial/trafico_piso`,   icon: Gauge },
    { label: "Pruebas manejo",  to: `${BASE_PATH}/comercial/pruebas_manejo`, icon: Car },
    { label: "Entregas",        to: `${BASE_PATH}/comercial/entregas`,       icon: Handshake },
];

function obtenerTitulo(pathname) {
    if (!pathname) return "CRM Volvo";
    const exacta = TITULOS.find((item) => item.exact && item.path === pathname);
    if (exacta) return exacta.title;
    const coincidencias = TITULOS
        .filter((item) => !item.exact)
        .filter((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
        .sort((a, b) => b.path.length - a.path.length);
    return coincidencias[0]?.title || "CRM Volvo";
}

function getTabClass({ isActive }) {
    return [
        "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold whitespace-nowrap transition",
        isActive
            ? "bg-black text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-200 hover:text-black",
    ].join(" ");
}

export default function Topbar({ onOpenSidebar }) {
    const { user } = useAuth();
    const location = useLocation();

    const titulo = useMemo(() => obtenerTitulo(location.pathname), [location.pathname]);

    const nombreUsuario = useMemo(() => (
        user?.nombreCompleto ||
        `${user?.nombre || ""} ${user?.apellidos || ""}`.trim() ||
        user?.usuario ||
        "Usuario"
    ), [user]);

    const inicial = useMemo(() => nombreUsuario.trim().slice(0, 1).toUpperCase() || "U", [nombreUsuario]);

    const mostrarTopnavGestion = location.pathname.startsWith(`${BASE_PATH}/comercial`);
    const mostrarTopnavCalidad = location.pathname.startsWith(`${BASE_PATH}/calidad`);

    return (
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
            <div className="px-3 py-3 sm:px-4 md:px-6 lg:px-8">

                {/* Fila superior: título + usuario */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        {/* Botón hamburguesa (móvil) */}
                        <button
                            type="button"
                            onClick={onOpenSidebar}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-black hover:text-white lg:hidden"
                            aria-label="Abrir menú"
                        >
                            <Menu size={20} />
                        </button>

                        <h1 className="truncate text-xl font-black text-slate-900 sm:text-2xl">
                            {titulo}
                        </h1>
                    </div>

                    {/* Avatar usuario */}
                    <div className="flex shrink-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black text-sm font-black text-white">
                            {inicial}
                        </div>
                        <div className="hidden min-w-0 sm:block">
                            <div className="truncate text-sm font-bold text-slate-900">{nombreUsuario}</div>
                            <div className="truncate text-xs text-slate-500">{user?.correo || "Sin correo"}</div>
                        </div>
                    </div>
                </div>

                {/* Tabs submódulos Comercial */}
                {mostrarTopnavGestion && (
                    <div className="mt-3 overflow-x-auto pb-0.5">
                        <nav className="flex min-w-max gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1.5">
                            {gestionComercialTabs.map(({ label, to, icon: Icon }) => (
                                <NavLink key={to} to={to} className={getTabClass}>
                                    <Icon size={16} />
                                    {label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                )}

                {/* Tabs submódulos Calidad */}
                {mostrarTopnavCalidad && (
                    <div className="mt-3 overflow-x-auto pb-0.5">
                        <nav className="flex min-w-max gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1.5">
                            {gestionCalidadTabs.map(({ label, to, icon: Icon }) => (
                                <NavLink key={to} to={to} className={getTabClass}>
                                    <Icon size={16} />
                                    {label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}