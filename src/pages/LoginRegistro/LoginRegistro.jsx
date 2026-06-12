// src/pages/LoginRegistro/LoginRegistro.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
    Eye,
    EyeOff,
    Lock,
    Mail,
    User,
    Building2,
    ArrowRight,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

import logoVolvo from "../../assets/logo.png";
import logoRyr from "../../assets/ryr_blue.png";

const AGENCIAS = [
    "Volvo",
];

function Input({
    label,
    icon: Icon,
    type = "text",
    value,
    onChange,
    placeholder,
    autoComplete,
    rightElement,
    required = false,
}) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur">
            <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
                <Icon size={14} />
                {label}
            </label>

            <div className="relative">
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    required={required}
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/95 px-4 pr-12 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0D3896] focus:ring-4 focus:ring-[#0D3896]/20"
                />

                {rightElement && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {rightElement}
                    </div>
                )}
            </div>
        </div>
    );
}

function PanelInfo({ bgImage }) {
    const items = [
        "Seguimiento de prospectos y clientes",
        "Vista centralizada de la operación comercial",
        "Acceso seguro para personal autorizado",
    ];

    return (
        <div className="relative hidden min-h-[780px] overflow-hidden lg:block">
            <AnimatePresence mode="wait">
                <motion.div
                    key={bgImage}
                    initial={{ scale: 1.06, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.02, opacity: 0 }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                >
                    <img
                        src={bgImage}
                        alt="Fondo CRM Volvo"
                        className="h-full w-full object-cover"
                    />
                </motion.div>
            </AnimatePresence>

            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,28,63,0.10),rgba(0,28,63,0.64),rgba(3,10,24,0.95))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(13,56,150,0.32),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(144,178,213,0.16),transparent_28%)]" />

            <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-12">
                <div>
                    <div className="flex items-center justify-between gap-4">
                        <motion.div
                            initial={{ opacity: 0, x: -18 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.55 }}
                            className="flex items-center gap-4"
                        >
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
                                <img
                                    src={logoRyr}
                                    alt="Grupo R&R"
                                    className="h-full w-full object-contain"
                                />
                            </div>

                            <div>
                                <div className="text-xs font-bold uppercase tracking-[0.24em] text-white/65">
                                    Grupo Automotriz R&R
                                </div>
                                <div className="mt-1 text-lg font-semibold text-white">
                                    CRM Volvo
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 18 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.55, delay: 0.08 }}
                            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#001C3F]/35 px-4 py-3 backdrop-blur"
                        >
                            <img
                                src={logoVolvo}
                                alt="Volvo"
                                className="h-8 w-auto object-contain"
                            />

                            <div className="h-6 w-px bg-white/10" />

                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/75">
                                Volvo
                            </span>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.55 }}
                        className="mt-28 max-w-xl"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.22, duration: 0.5 }}
                            className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#90B2D5] backdrop-blur"
                        >
                            Plataforma interna
                        </motion.div>

                        <h2 className="mt-6 text-5xl font-black leading-tight text-white">
                            Controla tu operación comercial.
                        </h2>

                        <p className="mt-5 max-w-lg text-base leading-7 text-white/75">
                            CRM enfocado en organización, seguimiento y crecimiento.
                        </p>

                        <div className="mt-8 space-y-3">
                            {items.map((item, index) => (
                                <motion.div
                                    key={item}
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.28 + index * 0.08 }}
                                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white/90 backdrop-blur"
                                >
                                    <div className="h-2.5 w-2.5 rounded-full bg-[#90B2D5]" />
                                    <span>{item}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.55, duration: 0.5 }}
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40"
                >
                    Acceso interno · Personal autorizado
                </motion.div>
            </div>
        </div>
    );
}

export default function LoginRegistro() {
    const navigate = useNavigate();
    const location = useLocation();

    const {
        login,
        register,
        isAuthenticated,
        loadingSesion,
    } = useAuth();

    const destino = location.state?.from?.pathname || "/crm_volvo/";

    const [tab, setTab] = useState("login");
    const [bgIndex, setBgIndex] = useState(0);

    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [mensaje, setMensaje] = useState({
        tipo: "",
        texto: "",
    });

    const [formLogin, setFormLogin] = useState({
        usuario: "",
        contrasena: "",
    });

    const [formRegistro, setFormRegistro] = useState({
        nombreCompleto: "",
        usuario: "",
        correo: "",
        agencia: "",
        contrasena: "",
        confirmarContrasena: "",
    });

    const fondos = useMemo(() => {
        const base = import.meta.env.BASE_URL || "/";

        return [
            `${base}fondo1.jpeg`,
            `${base}fondo2.jpeg`,
        ];
    }, []);
    useEffect(() => {
        if (!loadingSesion && isAuthenticated) {
            navigate(destino, { replace: true });
        }
    }, [loadingSesion, isAuthenticated, navigate, destino]);

    useEffect(() => {
        const interval = setInterval(() => {
            setBgIndex((prev) => (prev + 1) % fondos.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [fondos.length]);

    const limpiarMensaje = () => {
        setMensaje({
            tipo: "",
            texto: "",
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        limpiarMensaje();
        setLoading(true);

        try {
            await login({
                usuario: formLogin.usuario.trim(),
                contrasena: formLogin.contrasena,
            });

            navigate(destino, { replace: true });
        } catch (error) {
            setMensaje({
                tipo: "error",
                texto: error.message || "No se pudo iniciar sesión.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRegistro = async (e) => {
        e.preventDefault();
        limpiarMensaje();

        if (formRegistro.contrasena !== formRegistro.confirmarContrasena) {
            setMensaje({
                tipo: "error",
                texto: "Las contraseñas no coinciden.",
            });
            return;
        }

        setLoading(true);

        try {
            await register({
                nombreCompleto: formRegistro.nombreCompleto.trim(),
                usuario: formRegistro.usuario.trim(),
                correo: formRegistro.correo.trim(),
                agencia: formRegistro.agencia,
                contrasena: formRegistro.contrasena,
                confirmarContrasena: formRegistro.confirmarContrasena,
            });

            setMensaje({
                tipo: "ok",
                texto: "Cuenta creada correctamente. Ahora inicia sesión.",
            });

            setFormLogin({
                usuario: formRegistro.usuario,
                contrasena: "",
            });

            setFormRegistro({
                nombreCompleto: "",
                usuario: "",
                correo: "",
                agencia: "",
                contrasena: "",
                confirmarContrasena: "",
            });

            setTab("login");
        } catch (error) {
            setMensaje({
                tipo: "error",
                texto: error.message || "No se pudo crear la cuenta.",
            });
        } finally {
            setLoading(false);
        }
    };

    const claseMensaje =
        mensaje.tipo === "error"
            ? "border-red-400/20 bg-red-500/10 text-red-200"
            : "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";

    if (loadingSesion) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#030A18] text-white">
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold shadow-2xl backdrop-blur"
                >
                    Validando sesión...
                </motion.div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#030A18]">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(13,56,150,0.20),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(144,178,213,0.13),transparent_24%)]"
            />

            <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                        duration: 0.55,
                        ease: [0.22, 1, 0.36, 1],
                    }}
                    className="grid w-full max-w-7xl overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]"
                >
                    <PanelInfo bgImage={fondos[bgIndex]} />

                    <div className="relative flex items-center justify-center bg-[linear-gradient(180deg,#001C3F,#202A44,#030A18)] p-4 sm:p-6 lg:p-8 xl:p-10">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(144,178,213,0.14),transparent_28%)]"
                        />

                        <div className="relative z-10 w-full max-w-xl">
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.45 }}
                                className="mb-6 flex items-center justify-between lg:hidden"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white p-2">
                                        <img
                                            src={logoRyr}
                                            alt="R&R"
                                            className="h-full w-full object-contain"
                                        />
                                    </div>

                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                                            Grupo Automotriz R&R
                                        </div>
                                        <div className="text-base font-bold text-white">
                                            CRM Volvo
                                        </div>
                                    </div>
                                </div>

                                <img
                                    src={logoVolvo}
                                    alt="Volvo"
                                    className="h-7 w-auto object-contain"
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.16, duration: 0.5 }}
                                className="rounded-[28px] border border-white/10 bg-white/[0.055] p-4 shadow-2xl backdrop-blur-xl sm:p-6 md:p-7"
                            >
                                <div className="mb-6 flex justify-center">
                                    <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] p-1.5">
                                        <button
                                            type="button"
                                            disabled={loading}
                                            onClick={() => {
                                                limpiarMensaje();
                                                setTab("login");
                                            }}
                                            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-70 ${tab === "login"
                                                ? "bg-[#0D3896] text-white shadow-[0_10px_25px_rgba(13,56,150,0.35)]"
                                                : "text-slate-300 hover:text-white"
                                                }`}
                                        >
                                            Iniciar sesión
                                        </button>

                                        <button
                                            type="button"
                                            disabled={loading}
                                            onClick={() => {
                                                limpiarMensaje();
                                                setTab("registro");
                                            }}
                                            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-70 ${tab === "registro"
                                                ? "bg-[#0D3896] text-white shadow-[0_10px_25px_rgba(13,56,150,0.35)]"
                                                : "text-slate-300 hover:text-white"
                                                }`}
                                        >
                                            Crear cuenta
                                        </button>
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {mensaje.texto ? (
                                        <motion.div
                                            key={mensaje.texto}
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.25 }}
                                            className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-medium ${claseMensaje}`}
                                        >
                                            {mensaje.texto}
                                        </motion.div>
                                    ) : null}
                                </AnimatePresence>

                                <AnimatePresence mode="wait">
                                    {tab === "login" ? (
                                        <motion.form
                                            key="login"
                                            initial={{ opacity: 0, y: 18 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -12 }}
                                            transition={{ duration: 0.35 }}
                                            onSubmit={handleLogin}
                                            className="space-y-4"
                                        >
                                            <div className="text-center">
                                                <div className="text-xs font-bold uppercase tracking-[0.24em] text-[#90B2D5]">
                                                    Bienvenido
                                                </div>

                                                <h1 className="mt-2 text-3xl font-black text-white">
                                                    Entra al CRM
                                                </h1>
                                            </div>

                                            <Input
                                                label="Usuario"
                                                icon={User}
                                                value={formLogin.usuario}
                                                onChange={(e) =>
                                                    setFormLogin((prev) => ({
                                                        ...prev,
                                                        usuario: e.target.value,
                                                    }))
                                                }
                                                placeholder="Ingresa tu usuario"
                                                autoComplete="username"
                                                required
                                            />

                                            <Input
                                                label="Contraseña"
                                                icon={Lock}
                                                type={showLoginPassword ? "text" : "password"}
                                                value={formLogin.contrasena}
                                                onChange={(e) =>
                                                    setFormLogin((prev) => ({
                                                        ...prev,
                                                        contrasena: e.target.value,
                                                    }))
                                                }
                                                placeholder="••••••••"
                                                autoComplete="current-password"
                                                required
                                                rightElement={
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setShowLoginPassword((prev) => !prev)
                                                        }
                                                        className="text-slate-500 transition hover:text-slate-900"
                                                        aria-label={
                                                            showLoginPassword
                                                                ? "Ocultar contraseña"
                                                                : "Mostrar contraseña"
                                                        }
                                                    >
                                                        {showLoginPassword ? (
                                                            <EyeOff size={18} />
                                                        ) : (
                                                            <Eye size={18} />
                                                        )}
                                                    </button>
                                                }
                                            />

                                            <motion.button
                                                whileHover={
                                                    loading
                                                        ? undefined
                                                        : { y: -1, scale: 1.01 }
                                                }
                                                whileTap={
                                                    loading
                                                        ? undefined
                                                        : { scale: 0.99 }
                                                }
                                                disabled={loading}
                                                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0D3896] px-5 py-4 text-sm font-extrabold text-white shadow-[0_16px_35px_rgba(13,56,150,0.35)] transition hover:bg-[#073498] disabled:cursor-not-allowed disabled:opacity-70"
                                            >
                                                {loading ? "Entrando..." : "Entrar al CRM"}
                                                {!loading && <ArrowRight size={18} />}
                                            </motion.button>
                                        </motion.form>
                                    ) : (
                                        <motion.form
                                            key="registro"
                                            initial={{ opacity: 0, y: 18 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -12 }}
                                            transition={{ duration: 0.35 }}
                                            onSubmit={handleRegistro}
                                            className="space-y-4"
                                        >
                                            <div className="text-center">
                                                <div className="text-xs font-bold uppercase tracking-[0.24em] text-[#90B2D5]">
                                                    Nuevo usuario
                                                </div>

                                                <h2 className="mt-2 text-3xl font-black text-white">
                                                    Crear cuenta
                                                </h2>
                                            </div>

                                            <Input
                                                label="Nombre completo"
                                                icon={User}
                                                value={formRegistro.nombreCompleto}
                                                onChange={(e) =>
                                                    setFormRegistro((prev) => ({
                                                        ...prev,
                                                        nombreCompleto: e.target.value,
                                                    }))
                                                }
                                                placeholder="Nombre del asesor o usuario"
                                                autoComplete="name"
                                                required
                                            />

                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <Input
                                                    label="Usuario"
                                                    icon={User}
                                                    value={formRegistro.usuario}
                                                    onChange={(e) =>
                                                        setFormRegistro((prev) => ({
                                                            ...prev,
                                                            usuario: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="Usuario"
                                                    autoComplete="username"
                                                    required
                                                />

                                                <Input
                                                    label="Correo"
                                                    icon={Mail}
                                                    type="email"
                                                    value={formRegistro.correo}
                                                    onChange={(e) =>
                                                        setFormRegistro((prev) => ({
                                                            ...prev,
                                                            correo: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="correo@empresa.com"
                                                    autoComplete="email"
                                                    required
                                                />
                                            </div>

                                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur">
                                                <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
                                                    <Building2 size={14} />
                                                    Agencia
                                                </label>

                                                <select
                                                    value={formRegistro.agencia}
                                                    required
                                                    onChange={(e) =>
                                                        setFormRegistro((prev) => ({
                                                            ...prev,
                                                            agencia: e.target.value,
                                                        }))
                                                    }
                                                    className="h-12 w-full rounded-xl border border-white/10 bg-white/95 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-[#0D3896] focus:ring-4 focus:ring-[#0D3896]/20"
                                                >
                                                    <option value="">
                                                        Selecciona una agencia
                                                    </option>

                                                    {AGENCIAS.map((agencia) => (
                                                        <option key={agencia} value={agencia}>
                                                            {agencia}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <Input
                                                    label="Contraseña"
                                                    icon={Lock}
                                                    type={
                                                        showRegisterPassword
                                                            ? "text"
                                                            : "password"
                                                    }
                                                    value={formRegistro.contrasena}
                                                    onChange={(e) =>
                                                        setFormRegistro((prev) => ({
                                                            ...prev,
                                                            contrasena: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="Crea una contraseña"
                                                    autoComplete="new-password"
                                                    required
                                                    rightElement={
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setShowRegisterPassword(
                                                                    (prev) => !prev
                                                                )
                                                            }
                                                            className="text-slate-500 transition hover:text-slate-900"
                                                            aria-label={
                                                                showRegisterPassword
                                                                    ? "Ocultar contraseña"
                                                                    : "Mostrar contraseña"
                                                            }
                                                        >
                                                            {showRegisterPassword ? (
                                                                <EyeOff size={18} />
                                                            ) : (
                                                                <Eye size={18} />
                                                            )}
                                                        </button>
                                                    }
                                                />

                                                <Input
                                                    label="Confirmar contraseña"
                                                    icon={Lock}
                                                    type={
                                                        showRegisterPassword
                                                            ? "text"
                                                            : "password"
                                                    }
                                                    value={formRegistro.confirmarContrasena}
                                                    onChange={(e) =>
                                                        setFormRegistro((prev) => ({
                                                            ...prev,
                                                            confirmarContrasena:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    placeholder="Repite la contraseña"
                                                    autoComplete="new-password"
                                                    required
                                                />
                                            </div>

                                            <motion.button
                                                whileHover={
                                                    loading
                                                        ? undefined
                                                        : { y: -1, scale: 1.01 }
                                                }
                                                whileTap={
                                                    loading
                                                        ? undefined
                                                        : { scale: 0.99 }
                                                }
                                                disabled={loading}
                                                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-extrabold text-[#001C3F] shadow transition hover:bg-[#F3F7FB] disabled:cursor-not-allowed disabled:opacity-70"
                                            >
                                                {loading ? "Creando cuenta..." : "Crear cuenta"}
                                                {!loading && <ArrowRight size={18} />}
                                            </motion.button>
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}