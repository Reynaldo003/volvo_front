//src/components/ModuleHeader.jsx
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

function cls(...valores) {
    return valores.filter(Boolean).join(" ");
}

export default function ModuleHeader({
    titulo = "Módulo",
    subtitulo = "",
    chips = [],
    chipActivo = "",
    mostrarVolver = false,
    onVolver,
}) {
    const navigate = useNavigate();

    const handleVolver = () => {
        if (typeof onVolver === "function") {
            onVolver();
            return;
        }
        navigate(-1);
    };

    return (
        <section className="relative overflow-hidden rounded-lg bg-[linear-gradient(135deg,#0177D9_0%,#0A84E8_55%,#0A6BC1_100%)] px-5 py-5 shadow-[0_12px_30px_rgba(1,119,217,0.22)] sm:px-6 lg:px-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.10),transparent_24%)]" />
            <div className="relative rounded-lg border-2 border-white/85 px-5 py-5 sm:px-6 lg:px-7">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className={cls("min-w-0 flex-1", mostrarVolver && "pl-8 sm:pl-10 lg:pl-0")}>
                        {subtitulo ? (
                            <p className="text-sm font-bold tracking-wide text-white/95 sm:text-base">
                                {subtitulo}
                            </p>
                        ) : null}

                        <h1 className="mt-1 truncate text-[2.1rem] font-black leading-none tracking-[-0.03em] text-[#CDB89A] sm:text-[3rem] lg:text-[3.4rem]">
                            {titulo}
                        </h1>
                    </div>

                    <div className="flex flex-col items-start gap-4 lg:items-end">
                        {chips.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {chips.map((chip) => {
                                    const activo = chip === chipActivo;

                                    return (
                                        <button
                                            key={chip}
                                            type="button"
                                            className={cls(
                                                "rounded-md px-4 py-2 text-sm font-medium shadow-sm transition",
                                                activo
                                                    ? "bg-[#1F1F1F] text-white"
                                                    : "bg-white text-slate-700 hover:bg-slate-100"
                                            )}
                                        >
                                            {chip}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : null}

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
    );
}