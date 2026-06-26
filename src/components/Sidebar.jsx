// src/components/Sidebar.jsx
import { useState } from "react";
import { NavLink } from "react-router-dom";
import volvoLogo from "../assets/volvo_sin_fondo.png";
import {
    LayoutDashboard,
    BriefcaseBusiness,
    BadgeCheck,
    HelpCircle,
    Settings,
    ChevronDown,
    X,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const BASE_PATH = "/crm_volvo";

function UserAvatar({ nombre }) {
    const initials = nombre
        ? nombre.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase()).join("")
        : "U";
    return (
        <div
           className="
flex
h-10
w-10
shrink-0
items-center
justify-center
rounded-full
text-sm
font-bold
text-white
transition-all
duration-300
group-hover:scale-110
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
        to: `${BASE_PATH}/`,
        icon: LayoutDashboard,
        end: true,
    },
];

const managementItems = [
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

const bottomItems = [
    { label: "Ayuda",         to: `${BASE_PATH}/ayuda`,         icon: HelpCircle },
    { label: "Configuración", to: `${BASE_PATH}/configuracion`, icon: Settings   },
];

function NavItem({ label, to, icon: Icon, end = false, onClick }) {
    return (
        <NavLink to={to} end={end} onClick={onClick}>
            {({ isActive }) => (
                <div
                    className={[
                        "group relative flex items-center gap-3 rounded-2xl px-4 py-3",
                        "transition-all duration-300 ease-out cursor-pointer select-none",
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
                            "text-[14px] tracking-wide",
                            isActive ? "font-semibold" : "font-medium",
                        ].join(" ")}
                    >
                        {label}
                    </span>

                    <span
                        className={[
                            "absolute left-4 right-4 bottom-0 h-[2px] rounded-full transition-all duration-300",
                            isActive
                                ? "bg-slate-900 opacity-100"
                                : "bg-slate-900 opacity-0 group-hover:opacity-20",
                        ].join(" ")}
                    />
                </div>
            )}
        </NavLink>
    );
}
export default function Sidebar({ onClose, isMobile = false }) {
    const { logout, user } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const nombreUsuario =
        user?.nombreCompleto ||
        `${user?.nombre || ""} ${user?.apellidos || ""}`.trim() ||
        user?.usuario ||
        "Usuario";

    const handleLogout = () => {
        if (typeof logout === "function") { logout(); return; }
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
        <aside
   className="
flex
h-full
min-h-screen
w-[235px]
flex-col
bg-[#fafafa]
px-4
py-6
transition-all
duration-300
"
style={{
    borderRight:"1px solid #ECECEC",
}}
    style={{ borderRight: "1px solid #ECEFF3" }}
>

      <div className="mb-7 flex items-center justify-between px-2">
  <div className="flex flex-col gap-1">
    <img
        src={volvoLogo}
        alt="Volvo"
        className="h-3 w-auto object-contain self-start"
        style={{ filter: "brightness(0)" }}
    />
   <span className="text-[11px] font-medium text-[#9CA3AF] tracking-wide" style={{ marginTop: "4px" }}>
    CRM Comercial
</span>
</div>
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
            </div>

            {/* ── Nav principal ── */}
            <nav className="flex flex-1 flex-col gap-5">
                {/* Inicio */}
                <div className="flex flex-col gap-0.5 transition-all duration-300 hover:opacity-80">
                    {mainItems.map((item) => (
                        <NavItem key={item.to} {...item} onClick={handleNavigate} />
                    ))}
                </div>

                {/* Separador */}
                <div
    className="my-2 mx-2"
    style={{
        height:1,
        background:"linear-gradient(90deg,transparent,#E5E7EB,transparent)"
    }}
/>

                {/* Gestión */}
                <div className="flex flex-col gap-2">
                    {managementItems.map((item) => (
                        <NavItem key={item.to} {...item} onClick={handleNavigate} />
                    ))}
                </div>
            </nav>

            {/* ── Footer ── */}
            <div className="mt-auto flex flex-col gap-0.5"
                 style={{ borderTop: "1px solid #E5E7EB", paddingTop: "1rem" }}>

                

                <div className="relative mt-4">

    <button
        type="button"
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 text-left shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md group"
    >
        <UserAvatar nombre={nombreUsuario} />

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
            className={`transition-all duration-300 ${
                showUserMenu ? "rotate-180" : ""
            }`}
        />
    </button>

    {showUserMenu && (
        <div className="absolute bottom-full left-0 mb-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

            <div className="border-b border-slate-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-slate-900">
                    {nombreUsuario}
                </p>

                <p className="truncate text-xs text-slate-400">
                    {user?.correo || "Sin correo"}
                </p>
            </div>

            <button
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