//src/pages/PlaceHolderPage.jsx
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const opciones = [
    "Prospectos",
    "5-11",
    "12-18",
    "13-48",
    "13-96",
    "General",
];

export default function PlaceholderPage({ titulo = "Retención" }) {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <section className="relative overflow-hidden rounded-lg bg-[linear-gradient(135deg,#0177D9_0%,#0A84E8_55%,#0A6BC1_100%)] px-5 py-5 shadow-[0_12px_30px_rgba(1,119,217,0.22)] sm:px-7 lg:px-8">
                {/* brillo suave */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.10),transparent_24%)]" />

                {/* marco interno */}
                <div className="relative rounded-[22px] border-2 border-white/85 px-5 py-5 sm:px-6 lg:px-7">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        {/* lado izquierdo */}
                        <div className="min-w-0 flex-1 pl-8 sm:pl-10 lg:pl-0">
                            <h1 className="mt-1 truncate text-[2.2rem] font-black leading-none tracking-tight text-neutral-200 sm:text-[3rem] lg:text-[3.4rem]">
                                {titulo}
                            </h1>
                        </div>

                        {/* lado derecho */}
                        <div className="flex flex-col items-start gap-4 lg:items-end">
                            <div className="flex flex-wrap gap-2">
                                {opciones.map((item) => {
                                    const activa = item === "General";

                                    return (
                                        <button
                                            key={item}
                                            type="button"
                                            className={[
                                                "rounded-md px-4 py-2 text-sm font-medium shadow-sm transition",
                                                activa
                                                    ? "bg-[#1F1F1F] text-white"
                                                    : "bg-white text-slate-700 hover:bg-slate-100",
                                            ].join(" ")}
                                        >
                                            {item}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex items-center gap-4 self-end">
                                <img
                                    src="/logo.png"
                                    alt="Chevrolet"
                                    className="h-7 w-auto object-contain sm:h-8"
                                />

                                <div className="h-8 w-px bg-white/60" />

                                <img
                                    src="/ryr.png"
                                    alt="Grupo R&R"
                                    className="h-7 w-auto object-contain sm:h-8"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-[28px] border border-dashed border-slate-300 bg-white p-6 shadow-sm">
                <div className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    En construcción
                </div>

                <h2 className="mt-4 text-2xl font-black text-slate-900">
                    {titulo}
                </h2>

                <p className="mt-2 text-sm leading-7 text-slate-600">
                    Aquí ya puedes empezar a montar el contenido real del módulo:
                    filtros, tabla, KPIs, tarjetas, gráficas o tabs secundarias.
                </p>
            </section>
        </div>
    );
}