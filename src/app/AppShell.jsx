// src/app/AppShell.jsx
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function AppShell() {
    const location = useLocation();

    const [sidebarMovilAbierto, setSidebarMovilAbierto] = useState(false);

    const [sidebarContraido, setSidebarContraido] = useState(() => {
        return localStorage.getItem("crm_volvo_sidebar_contraido") === "1";
    });

    const toggleSidebarContraido = () => {
        setSidebarContraido((prev) => {
            const nuevoValor = !prev;
            localStorage.setItem("crm_volvo_sidebar_contraido", nuevoValor ? "1" : "0");
            return nuevoValor;
        });
    };

    useEffect(() => {
        setSidebarMovilAbierto(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!sidebarMovilAbierto) return;

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setSidebarMovilAbierto(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [sidebarMovilAbierto]);

    return (
        <div className="flex h-screen overflow-hidden bg-[#ffffff]">
            <div className="hidden h-full flex-none lg:block">
                <Sidebar
                    contraido={sidebarContraido}
                    onToggleContraido={toggleSidebarContraido}
                />
            </div>

            {sidebarMovilAbierto && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        aria-label="Cerrar menú"
                        onClick={() => setSidebarMovilAbierto(false)}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                    />

                    <div className="relative h-full w-[280px] max-w-[85vw]">
                        <Sidebar
                            isMobile
                            onClose={() => setSidebarMovilAbierto(false)}
                            contraido={false}
                        />
                    </div>
                </div>
            )}

            <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
                <Topbar onOpenSidebar={() => setSidebarMovilAbierto(true)} />

                <div className="flex-1 p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}