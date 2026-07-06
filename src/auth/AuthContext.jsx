// src/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
    authApi,
    clearAuthSession,
    getAuthToken,
    getStoredUser,
    setAuthSession,
} from "../lib/apiAuth";

const AuthContext = createContext(null);

function normalizarUsuario(data) {
    if (!data) return null;

    // Login Volvo responde: { token, user }
    if (data.user) return data.user;

    // Por compatibilidad con código anterior
    if (data.usuario) return data.usuario;

    // AuthMeView del backend responde directamente el usuario
    if (data.id_usuario || data.usuario || data.correo) return data;

    return null;
}

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(() => getStoredUser());
    const [token, setToken] = useState(() => getAuthToken());
    const [loadingSesion, setLoadingSesion] = useState(true);

    useEffect(() => {
        let activo = true;

        async function validarSesion() {
            const tokenGuardado = getAuthToken();

            if (!tokenGuardado) {
                clearAuthSession();

                if (activo) {
                    setUsuario(null);
                    setToken(null);
                    setLoadingSesion(false);
                }

                return;
            }

            try {
                const data = await authApi.me();
                const usuarioSesion = normalizarUsuario(data);

                if (!activo) return;

                if (!usuarioSesion) {
                    clearAuthSession();
                    setUsuario(null);
                    setToken(null);
                    return;
                }

                setUsuario(usuarioSesion);
                setToken(tokenGuardado);

                setAuthSession({
                    token: tokenGuardado,
                    usuario: usuarioSesion,
                });
            } catch {
                clearAuthSession();

                if (!activo) return;

                setUsuario(null);
                setToken(null);
            } finally {
                if (activo) {
                    setLoadingSesion(false);
                }
            }
        }

        validarSesion();

        return () => {
            activo = false;
        };
    }, []);

    async function login(payload) {
        const data = await authApi.login(payload);
        const usuarioSesion = normalizarUsuario(data);
        const tokenSesion = data?.token;

        if (!tokenSesion || !usuarioSesion) {
            throw new Error("La respuesta del servidor no incluye token o usuario.");
        }

        setAuthSession({
            token: tokenSesion,
            usuario: usuarioSesion,
        });

        setToken(tokenSesion);
        setUsuario(usuarioSesion);

        return {
            ...data,
            token: tokenSesion,
            user: usuarioSesion,
            usuario: usuarioSesion,
        };
    }

    async function register(payload) {
        return authApi.registro(payload);
    }

    function logout() {
        clearAuthSession();
        setToken(null);
        setUsuario(null);
        window.location.href = "/login";
    }

    function hasPermission(permiso) {
        if (!permiso) return false;

        const permisos = usuario?.permisos || [];

        return permisos.includes("ALL") || permisos.includes(permiso);
    }

    function hasAnyPermission(permisosRequeridos = []) {
        const permisos = usuario?.permisos || [];

        if (permisos.includes("ALL")) return true;

        return permisosRequeridos.some((permiso) => permisos.includes(permiso));
    }

    const value = useMemo(
        () => ({
            usuario,

            // Alias para componentes que usan "user"
            user: usuario,

            token,
            loadingSesion,
            isAuthenticated: Boolean(token && usuario),

            login,
            register,
            logout,

            hasPermission,
            hasAnyPermission,
        }),
        [usuario, token, loadingSesion]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth debe usarse dentro de AuthProvider.");
    }

    return context;
}