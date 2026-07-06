// src/components/Sidebar.jsx
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import volvoLogo from "../assets/volvo_sin_fondo.png";
import {
    LayoutDashboard,
    BriefcaseBusiness,
    BadgeCheck,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    X,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";

function UserAvatar({ nombre }) {
    const initials = nombre
        ? nombre
            .split(" ")
            .slice(0, 2)
            .map((n) => n[0]?.toUpperCase())
            .join("")
        : "U";

    return (
        <div
            className="
        flex h-10 w-10 shrink-0 items-center justify-center
        rounded-full text-sm font-bold text-white
        transition-all duration-300 group-hover:scale-110
      "
            style={{ backgroundColor: "#1C2B4A" }}
        >
            {initials}
        </div>
    );
}

const mainItems = [
    {
        label: "Inicio",
        to: "/",
        icon: LayoutDashboard,
        end: true,
    },
];

const managementItems = [
    {
        label: "Gestión Comercial",
        to: "/comercial/prospectos",
        icon: BriefcaseBusiness,
        end: false,
    },
    {
        label: "Gestión Calidad",
        to: "/calidad/checklist_recepcion",
        icon: BadgeCheck,
        end: false,
    },
];

function NavItem({ label, to, icon: Icon, end = false, onClick, contraido }) {
    return (
        <NavLink to={to} end={end} onClick={onClick} title={contraido ? label : undefined}>
            {({ isActive }) => (
                <div
                    className={[
                        "group relative flex items-center rounded-2xl py-3",
                        "transition-all duration-300 ease-out cursor-pointer select-none",
                        contraido ? "justify-center px-0" : "gap-3 px-4",
                        isActive
                            ? "bg-white text-slate-900 shadow-md -translate-y-[1px]"
                            : "text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-md hover:-translate-y-[2px]",
                    ].join(" ")}
                >
                    <Icon
                        size={18}
                        className={[
                            "transition-all duration-300 shrink-0",
                            isActive
                                ? "text-slate-900"
                                : "text-slate-400 group-hover:text-slate-900 group-hover:scale-110",
                        ].join(" ")}
                    />

                    <span
                        className={[
                            "overflow-hidden whitespace-nowrap text-[14px] tracking-wide transition-all duration-300",
                            isActive ? "font-semibold" : "font-medium",
                            contraido ? "max-w-0 opacity-0" : "max-w-[150px] opacity-100",
                        ].join(" ")}
                    >
                        {label}
                    </span>

                    {!contraido && (
                        <span
                            className={[
                                "absolute left-4 right-4 bottom-0 h-[2px] rounded-full transition-all duration-300",
                                isActive
                                    ? "bg-slate-900 opacity-100"
                                    : "bg-slate-900 opacity-0 group-hover:opacity-20",
                            ].join(" ")}
                        />
                    )}

                    {contraido && isActive && (
                        <span className="absolute left-1 top-3 bottom-3 w-[3px] rounded-full bg-slate-900" />
                    )}
                </div>
            )}
        </NavLink>
    );
}

export default function Sidebar({
    onClose,
    isMobile = false,
    contraido = false,
    onToggleContraido,
}) {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const [showUserMenu, setShowUserMenu] = useState(false);

    const estaContraido = !isMobile && contraido;

    const nombreUsuario =
        user?.nombreCompleto ||
        `${user?.nombre || ""} ${user?.apellidos || ""}`.trim() ||
        user?.usuario ||
        "Usuario";

    const handleLogout = () => {
        if (typeof logout === "function") {
            logout();
        } else {
            localStorage.removeItem("crm_volvo_token");
            localStorage.removeItem("crm_volvo_usuario");
            localStorage.removeItem("auth.access");
            localStorage.removeItem("auth");
        }

        setShowUserMenu(false);

        if (typeof onClose === "function") {
            onClose();
        }

        navigate("/login", { replace: true });
    };

    const handleNavigate = () => {
        if (typeof onClose === "function") {
            onClose();
        }
    };

    return (
        <aside
            className={[
                "flex h-full min-h-screen shrink-0 flex-col bg-[#fafafa] py-6",
                "transition-all duration-300 ease-in-out",
                estaContraido ? "w-[78px] px-3" : "w-[235px] px-4",
            ].join(" ")}
            style={{ borderRight: "1px solid #ECEFF3" }}
        >
            <div
                className={[
                    "mb-7 flex items-center",
                    estaContraido ? "justify-center" : "justify-between px-2",
                ].join(" ")}
            >
                {estaContraido ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                        <img
                            src={volvoLogo}
                            alt="Volvo"
                            className="h-3 w-auto object-contain"
                            style={{ filter: "brightness(0)" }}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        <img
                            src={volvoLogo}
                            alt="Volvo"
                            className="h-3 w-auto object-contain self-start"
                            style={{ filter: "brightness(0)" }}
                        />

                        <span
                            className="text-[11px] font-medium text-[#9CA3AF] tracking-wide"
                            style={{ marginTop: "4px" }}
                        >
                            CRM Comercial
                        </span>
                    </div>
                )}

                {isMobile && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                        aria-label="Cerrar menú"
                    >
                        <X size={18} />
                    </button>
                )}

                {!isMobile && (
                    <button
                        type="button"
                        onClick={onToggleContraido}
                        className={[
                            "flex h-8 w-8 items-center justify-center rounded-xl z-40",
                            "text-slate-400 transition-all duration-300",
                            "hover:bg-white hover:text-slate-900 hover:shadow-sm",
                            estaContraido ? "absolute left-[62px] bg-white shadow-sm" : "",
                        ].join(" ")}
                        aria-label={estaContraido ? "Expandir menú" : "Contraer menú"}
                        title={estaContraido ? "Expandir menú" : "Contraer menú"}
                    >
                        {estaContraido ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
                    </button>
                )}
            </div>

            <nav className="flex flex-1 flex-col gap-5">
                <div className="flex flex-col gap-0.5 transition-all duration-300 hover:opacity-80">
                    {mainItems.map((item) => (
                        <NavItem
                            key={item.to}
                            {...item}
                            contraido={estaContraido}
                            onClick={handleNavigate}
                        />
                    ))}
                </div>

                <div
                    className={estaContraido ? "my-2 mx-auto w-8" : "my-2 mx-2"}
                    style={{
                        height: 1,
                        background: "linear-gradient(90deg, transparent, #E5E7EB, transparent)",
                    }}
                />

                <div className="flex flex-col gap-2">
                    {managementItems.map((item) => (
                        <NavItem
                            key={item.to}
                            {...item}
                            contraido={estaContraido}
                            onClick={handleNavigate}
                        />
                    ))}
                </div>
            </nav>

            <div
                className="mt-auto flex flex-col gap-0.5"
                style={{
                    borderTop: "1px solid #E5E7EB",
                    paddingTop: "1rem",
                }}
            >
                <div className="relative mt-4">
                    <button
                        type="button"
                        onClick={() => setShowUserMenu((prev) => !prev)}
                        className={[
                            "group flex w-full items-center rounded-2xl bg-white text-left shadow-sm",
                            "transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md",
                            estaContraido ? "justify-center px-0 py-3" : "gap-3 px-3 py-3",
                        ].join(" ")}
                        title={estaContraido ? nombreUsuario : undefined}
                    >
                        <UserAvatar nombre={nombreUsuario} />

                        {!estaContraido && (
                            <>
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-[13px] font-semibold text-[#111827]">
                                        {nombreUsuario}
                                    </div>

                                    <div className="truncate text-[11px] text-[#9CA3AF]">
                                        {user?.correo || "Sin correo"}
                                    </div>
                                </div>

                                <ChevronDown
                                    size={15}
                                    className={`transition-all duration-300 ${showUserMenu ? "rotate-180" : ""
                                        }`}
                                />
                            </>
                        )}
                    </button>

                    {showUserMenu && (
                        <div
                            className={[
                                "absolute z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl",
                                estaContraido
                                    ? "bottom-0 left-full ml-2 w-56"
                                    : "bottom-full left-0 mb-2 w-full",
                            ].join(" ")}
                        >
                            <div className="border-b border-slate-100 px-4 py-3">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                    {nombreUsuario}
                                </p>

                                <p className="truncate text-xs text-slate-400">
                                    {user?.correo || "Sin correo"}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                            >
                                Cerrar sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}