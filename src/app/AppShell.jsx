// src/app/AppShell.jsx
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function AppShell() {
    const location = useLocation();
    const [sidebarMovilAbierto, setSidebarMovilAbierto] = useState(false);

    useEffect(() => {
        setSidebarMovilAbierto(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!sidebarMovilAbierto) return;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
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
        <div className="min-h-screen bg-slate-100">
            <div className="flex min-h-screen">
                <div className="hidden lg:block">
                    <Sidebar />
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
                            />
                        </div>
                    </div>
                )}

                <main className="flex min-w-0 flex-1 flex-col">
                    <Topbar
                        onOpenSidebar={() => setSidebarMovilAbierto(true)}
                    />

                    <div className="flex-1 p-4 sm:p-6 lg:p-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}