// src/components/Sidebar.jsx
import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    BriefcaseBusiness,
    LogOut,
    X,
    BadgeCheck,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const BASE_PATH = "/crm_volvo";

const menuItems = [
    {
        label: "Inicio",
        to: `${BASE_PATH}/`,
        icon: LayoutDashboard,
        end: true,
    },
    {
        label: "Gestión Comercial",
        to: `${BASE_PATH}/comercial`,
        icon: BriefcaseBusiness,
        end: false,
    },
    {
        label: "Gestión Calidad",
        to: `${BASE_PATH}/calidad`,
        icon: BadgeCheck,
        end: false,
    },
];

function getLinkClass({ isActive }) {
    return [
        "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition",
        isActive
            ? "bg-white text-black shadow-sm"
            : "text-white/70 hover:bg-white/10 hover:text-white",
    ].join(" ");
}

export default function Sidebar({ onClose, isMobile = false }) {
    const { logout, user } = useAuth();

    const nombreUsuario =
        user?.nombreCompleto ||
        `${user?.nombre || ""} ${user?.apellidos || ""}`.trim() ||
        user?.usuario ||
        "Usuario";

    const handleLogout = () => {
        if (typeof logout === "function") {
            logout();
            return;
        }
        localStorage.removeItem("crm_volvo_token");
        localStorage.removeItem("crm_volvo_usuario");
        localStorage.removeItem("auth.access");
        localStorage.removeItem("auth");
        window.location.href = `${BASE_PATH}/login`;
    };

    const handleNavigate = () => {
        if (typeof onClose === "function") onClose();
    };

    return (
        <aside className="flex h-full min-h-screen w-[280px] flex-col bg-[linear-gradient(180deg,#0a0a0a_0%,#1a1a1a_50%,#2a2a2a_100%)] px-4 py-5 text-white shadow-2xl">
            {/* Logo / marca */}
            <div className="mb-8 flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-black text-black">
                        V
                    </div>
                    <div className="min-w-0">
                        <div className="truncate text-sm font-black uppercase tracking-[0.2em] text-white">
                            Volvo
                        </div>
                        <div className="truncate text-xs font-semibold text-white/60">
                            CRM Comercial
                        </div>
                    </div>
                </div>

                {isMobile && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white hover:text-black"
                        aria-label="Cerrar menú"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Nav links */}
            <nav className="flex-1 space-y-2">
                {menuItems.map(({ label, to, icon: Icon, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        onClick={handleNavigate}
                        className={getLinkClass}
                    >
                        <Icon size={20} className="shrink-0 transition group-hover:scale-105" />
                        <span className="truncate">{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer usuario */}
            <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
                <div className="rounded-2xl bg-white/10 px-4 py-3">
                    <div className="truncate text-sm font-bold text-white">{nombreUsuario}</div>
                    <div className="truncate text-xs text-white/55">{user?.correo || "Sin correo"}</div>
                </div>

                <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white/80 transition hover:bg-white hover:text-black"
                >
                    <LogOut size={18} />
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );
}