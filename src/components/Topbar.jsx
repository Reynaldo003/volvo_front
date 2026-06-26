// src/components/Topbar.jsx
import { useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import volvoLogo from "../assets/volvo_sin_fondo.png";
import {
    CalendarDays, Car, ClipboardList, Gauge,
    Handshake, Menu, UserRoundSearch, ChevronDown, LogOut,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const BASE_PATH = "/crm_volvo";

const gestionCalidadTabs = [
    { label: "Check Recepción", to: `${BASE_PATH}/calidad/checklist_recepcion`, icon: UserRoundSearch },
    { label: "Check Entrega",   to: `${BASE_PATH}/calidad/checklist_entrega`,   icon: CalendarDays },
    { label: "Check General",   to: `${BASE_PATH}/calidad/checklist_general`,   icon: ClipboardList },
];

const gestionComercialTabs = [
    { label: "Prospectos",     to: `${BASE_PATH}/comercial/prospectos`,          icon: UserRoundSearch },
    { label: "Contacto",       to: `${BASE_PATH}/comercial/prospectos/contacto`, icon: UserRoundSearch },
    { label: "Citas",          to: `${BASE_PATH}/comercial/citas`,               icon: CalendarDays },
    { label: "Control piso",   to: `${BASE_PATH}/comercial/control_piso`,        icon: ClipboardList },
    { label: "Tráfico piso",   to: `${BASE_PATH}/comercial/trafico_piso`,        icon: Gauge },
    { label: "Pruebas manejo", to: `${BASE_PATH}/comercial/pruebas_manejo`,      icon: Car },
    { label: "Entregas",       to: `${BASE_PATH}/comercial/entregas`,            icon: Handshake },
];

function getTabClass({ isActive }) {
    return [
        "group relative flex items-center gap-2.5 px-5 py-3 rounded-xl",
        "text-[14px] font-medium tracking-wide whitespace-nowrap",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-[2px] hover:shadow-sm",
        isActive
            ? "bg-slate-100 text-slate-900 shadow-sm"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
    ].join(" ");
}

export default function Topbar({ onOpenSidebar }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const nombreUsuario = useMemo(() => (
        user?.nombreCompleto ||
        `${user?.nombre || ""} ${user?.apellidos || ""}`.trim() ||
        user?.usuario || "Usuario"
    ), [user]);

    const inicial = useMemo(() =>
        nombreUsuario.trim().slice(0, 1).toUpperCase() || "U"
    , [nombreUsuario]);

    const mostrarTopnavGestion = location.pathname.startsWith(`${BASE_PATH}/comercial`);
    const mostrarTopnavCalidad = location.pathname.startsWith(`${BASE_PATH}/calidad`);
    const mostrarTabs = mostrarTopnavGestion || mostrarTopnavCalidad;
    const tabs = mostrarTopnavGestion ? gestionComercialTabs : gestionCalidadTabs;

    return (
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">

            {/* ── Fila principal — h-20 para que quede al nivel del logo del sidebar ── */}
            <div className="flex items-center gap-4 px-4 h-20">

                {/* Hamburguesa móvil */}
                <button
                    type="button"
                    onClick={onOpenSidebar}
                    className="flex lg:hidden items-center justify-center h-9 w-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition shrink-0"
                    aria-label="Abrir menú"
                >
                    <Menu size={18} />
                </button>

               {/* Logo */}
<button
    onClick={() => navigate(`${BASE_PATH}/`)}
    className="flex flex-col items-start leading-none select-none shrink-0 gap-1"
>
    <img
        src={volvoLogo}
        alt="Volvo"
        className="h-4 w-auto object-contain"
        style={{ filter: "brightness(0)" }}
    />
    <span className="text-[9px] font-semibold tracking-widest text-slate-400 uppercase">
    
    </span>
</button>

                <div className="flex-1" />

                {/* Usuario */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowUserMenu((v) => !v)}
                        className="
flex items-center gap-3
rounded-2xl
border border-slate-200
bg-white
px-4 py-2.5
shadow-sm
hover:shadow-md
hover:-translate-y-[1px]
transition-all
duration-300
select-none
w-[240px]
"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white text-sm font-bold">
                            {inicial}
                        </div>
                        <div className="flex flex-col items-start min-w-0 flex-1">
                            <span className="text-sm font-semibold text-slate-900 leading-tight truncate max-w-[160px]">
                                {nombreUsuario}
                            </span>
                            <span className="text-xs text-slate-400 leading-tight truncate max-w-[160px]">
                                {user?.correo || "Sin correo"}
                            </span>
                        </div>
                        <ChevronDown size={14} className="text-slate-400 shrink-0" />
                    </button>

                    {showUserMenu && (
                        <div className="absolute right-0 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg py-1 z-50">
                            <div className="px-4 py-3 border-b border-slate-100">
                                <p className="text-sm font-semibold text-slate-800 truncate">{nombreUsuario}</p>
                                <p className="text-xs text-slate-400 truncate">{user?.correo || "Sin correo"}</p>
                            </div>
                            <button
                                onClick={() => { setShowUserMenu(false); logout?.(); }}
                                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                            >
                                <LogOut size={15} />
                                Cerrar sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Tabs ── */}
            {mostrarTabs && (
                <div className="overflow-x-auto border-t border-slate-200 bg-white">
                    <nav className="flex min-w-max gap-2 px-5 py-2">
                        {tabs.map(({ label, to, icon: Icon }) => (
                            <NavLink
    key={to}
    to={to}
    end={to.endsWith("prospectos")}
>
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
                        ))}
                    </nav>
                </div>
            )}
        </header>
    );
}