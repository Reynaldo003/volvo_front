// src/auth/ProtectedLayout.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedLayout() {
    const location = useLocation();

    const {
        isAuthenticated,
        loadingSesion,
    } = useAuth();

    if (loadingSesion) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#030A18] text-white">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold shadow-2xl backdrop-blur">
                    Validando sesión...
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    return <Outlet />;
}