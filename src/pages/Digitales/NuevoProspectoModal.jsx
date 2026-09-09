import { useEffect, useState } from "react";
import {
    Loader2,
    UserRoundPlus,
    X,
} from "lucide-react";

import { api } from "../../lib/apiPruebas";

const INITIAL_FORM = {
    nombre: "",
    telefono: "",
    correo: "",
    agencia: "",
    auto_interes: "",
    canal_contacto: "Manual",
    asesor_digital: "",
    asesor_ventas: "",
    comentarios: "",
};

function limpiarTelefono(value) {
    return String(value || "").replace(/\D/g, "").slice(0, 12);
}

function obtenerMensajeError(error) {
    const data = error?.data || error?.response?.data;

    if (data?.telefono) {
        return Array.isArray(data.telefono)
            ? data.telefono.join(" ")
            : String(data.telefono);
    }

    if (data?.correo) {
        return Array.isArray(data.correo)
            ? data.correo.join(" ")
            : String(data.correo);
    }

    if (data?.detail) {
        return String(data.detail);
    }

    return error?.message || "No se pudo crear el prospecto.";
}

export default function NuevoProspectoModal({
    open,
    onClose,
    onCreado,
    agencias = [],
    vehiculos = [],
    canales = [],
    asesores = [],
}) {
    const [form, setForm] = useState(INITIAL_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;

        setForm(INITIAL_FORM);
        setError("");
        setSaving(false);
    }, [open]);

    if (!open) return null;

    function actualizar(campo, valor) {
        setForm((prev) => ({
            ...prev,
            [campo]: valor,
        }));

        if (error) {
            setError("");
        }
    }

    async function guardar(e) {
        e.preventDefault();

        if (saving) return;

        const nombre = form.nombre.trim();
        const telefono = limpiarTelefono(form.telefono);
        const correo = form.correo.trim();

        if (!nombre) {
            setError("Escribe el nombre del prospecto.");
            return;
        }

        if (!telefono) {
            setError("Escribe el número de teléfono.");
            return;
        }

        if (![10, 12].includes(telefono.length)) {
            setError(
                "El teléfono debe tener 10 dígitos o formato 52XXXXXXXXXX."
            );
            return;
        }

        setSaving(true);
        setError("");

        try {
            const payload = {
                nombre,
                telefono,
                correo,
                agencia: form.agencia.trim(),
                auto_interes: form.auto_interes.trim(),
                canal_contacto:
                    form.canal_contacto.trim() || "Manual",
                asesor_digital: form.asesor_digital.trim(),
                asesor_ventas: form.asesor_ventas.trim(),
                comentarios: form.comentarios.trim(),
            };

            const creado = await api.digitalesCreateProspecto(payload);

            onCreado?.(creado);
            onClose?.();
        } catch (err) {
            console.error("Error creando prospecto Volvo:", err);
            setError(obtenerMensajeError(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !saving) {
                    onClose?.();
                }
            }}
        >
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#DBE7FF] text-[#1746D1]">
                            <UserRoundPlus className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                            <h2 className="text-lg font-black text-[#131E5C]">
                                Nuevo prospecto
                            </h2>

                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                                Registra un prospecto manualmente en Volvo.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                        title="Cerrar"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form
                    onSubmit={guardar}
                    className="min-h-0 flex-1 overflow-y-auto"
                >
                    <div className="space-y-6 px-6 py-5">
                        {/* DATOS DEL CLIENTE */}
                        <section>
                            <h3 className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-[#131E5C]">
                                Datos del cliente
                            </h3>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-bold text-slate-600">
                                        Nombre *
                                    </span>

                                    <input
                                        type="text"
                                        value={form.nombre}
                                        onChange={(e) =>
                                            actualizar(
                                                "nombre",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Nombre completo"
                                        autoFocus
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#1746D1] focus:ring-2 focus:ring-[#1746D1]/10"
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-bold text-slate-600">
                                        Teléfono *
                                    </span>

                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        value={form.telefono}
                                        onChange={(e) =>
                                            actualizar(
                                                "telefono",
                                                limpiarTelefono(
                                                    e.target.value
                                                )
                                            )
                                        }
                                        placeholder="10 dígitos"
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#1746D1] focus:ring-2 focus:ring-[#1746D1]/10"
                                    />
                                </label>

                                <label className="block sm:col-span-2">
                                    <span className="mb-1.5 block text-xs font-bold text-slate-600">
                                        Correo electrónico
                                    </span>

                                    <input
                                        type="email"
                                        value={form.correo}
                                        onChange={(e) =>
                                            actualizar(
                                                "correo",
                                                e.target.value
                                            )
                                        }
                                        placeholder="correo@ejemplo.com"
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#1746D1] focus:ring-2 focus:ring-[#1746D1]/10"
                                    />
                                </label>
                            </div>
                        </section>

                        {/* INFORMACIÓN COMERCIAL */}
                        <section>
                            <h3 className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-[#131E5C]">
                                Información comercial
                            </h3>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-bold text-slate-600">
                                        Agencia
                                    </span>

                                    {agencias.length ? (
                                        <select
                                            value={form.agencia}
                                            onChange={(e) =>
                                                actualizar(
                                                    "agencia",
                                                    e.target.value
                                                )
                                            }
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#1746D1] focus:ring-2 focus:ring-[#1746D1]/10"
                                        >
                                            <option value="">
                                                Selecciona agencia
                                            </option>

                                            {agencias.map((agencia) => (
                                                <option
                                                    key={agencia}
                                                    value={agencia}
                                                >
                                                    {agencia}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={form.agencia}
                                            onChange={(e) =>
                                                actualizar(
                                                    "agencia",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Agencia"
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#1746D1] focus:ring-2 focus:ring-[#1746D1]/10"
                                        />
                                    )}
                                </label>

                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-bold text-slate-600">
                                        Vehículo de interés
                                    </span>

                                  {vehiculos.length ? (
                                    <select
                                        value={form.auto_interes}
                                        onChange={(e) =>
                                            actualizar(
                                                "auto_interes",
                                                e.target.value
                                            )
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#1746D1] focus:ring-2 focus:ring-[#1746D1]/10"
                                    >
                                        <option value="">
                                            Selecciona vehículo
                                        </option>

                                        {vehiculos.map((vehiculo) => (
                                            <option
                                                key={vehiculo}
                                                value={vehiculo}
                                            >
                                                {vehiculo}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={form.auto_interes}
                                        onChange={(e) =>
                                            actualizar(
                                                "auto_interes",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Ej. XC60 2026"
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#1746D1] focus:ring-2 focus:ring-[#1746D1]/10"
                                    />
                                )}
                                </label>

                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-bold text-slate-600">
                                        Canal
                                    </span>

                                    <select
                                        value={form.canal_contacto}
                                        onChange={(e) =>
                                            actualizar(
                                                "canal_contacto",
                                                e.target.value
                                            )
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#1746D1] focus:ring-2 focus:ring-[#1746D1]/10"
                                    >
                                        <option value="Manual">
                                            Manual
                                        </option>

                                        {canales
                                            .filter((canal) => canal !== "Manual")
                                            .map((canal) => (
                                                <option
                                                    key={canal}
                                                    value={canal}
                                                >
                                                    {canal}
                                                </option>
                                            ))}
                                    </select>
                                </label>

                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-bold text-slate-600">
                                        Asesor digital
                                    </span>

                                    {asesores.length ? (
                                        <select
                                            value={form.asesor_digital}
                                            onChange={(e) =>
                                                actualizar(
                                                    "asesor_digital",
                                                    e.target.value
                                                )
                                            }
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#1746D1] focus:ring-2 focus:ring-[#1746D1]/10"
                                        >
                                            <option value="">
                                                Sin asignar
                                            </option>

                                            {asesores.map((asesor) => (
                                                <option
                                                    key={asesor}
                                                    value={asesor}
                                                >
                                                    {asesor}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={form.asesor_digital}
                                            onChange={(e) =>
                                                actualizar(
                                                    "asesor_digital",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Asesor digital"
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#1746D1] focus:ring-2 focus:ring-[#1746D1]/10"
                                        />
                                    )}
                                </label>

                                <label className="block sm:col-span-2">
                                    <span className="mb-1.5 block text-xs font-bold text-slate-600">
                                        Asesor de ventas
                                    </span>

                                    {asesores.length ? (
                                        <select
                                            value={form.asesor_ventas}
                                            onChange={(e) =>
                                                actualizar(
                                                    "asesor_ventas",
                                                    e.target.value
                                                )
                                            }
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#1746D1] focus:ring-2 focus:ring-[#1746D1]/10"
                                        >
                                            <option value="">
                                                Sin asignar
                                            </option>

                                            {asesores.map((asesor) => (
                                                <option
                                                    key={asesor}
                                                    value={asesor}
                                                >
                                                    {asesor}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={form.asesor_ventas}
                                            onChange={(e) =>
                                                actualizar(
                                                    "asesor_ventas",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Asesor de ventas"
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#1746D1] focus:ring-2 focus:ring-[#1746D1]/10"
                                        />
                                    )}
                                </label>

                                <label className="block sm:col-span-2">
                                    <span className="mb-1.5 block text-xs font-bold text-slate-600">
                                        Comentarios
                                    </span>

                                    <textarea
                                        value={form.comentarios}
                                        onChange={(e) =>
                                            actualizar(
                                                "comentarios",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Información adicional del prospecto"
                                        rows={3}
                                        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#1746D1] focus:ring-2 focus:ring-[#1746D1]/10"
                                    />
                                </label>
                            </div>
                        </section>

                        {error ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                {error}
                            </div>
                        ) : null}
                    </div>

                    {/* FOOTER */}
                    <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="h-10 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#1746D1] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#1238aa] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creando...
                                </>
                            ) : (
                                <>
                                    <UserRoundPlus className="h-4 w-4" />
                                    Crear prospecto
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}