export function CabeceraRetencion({ segmentoActivo, onCambiarSegmento }) {
    return (
        <section className="overflow-hidden rounded-xl border border-black/10 bg-[radial-gradient(circle_at_top_left,rgba(201,167,93,0.18),transparent_28%),linear-gradient(135deg,#050505_0%,#0F172A_55%,#050505_100%)] px-4 py-4 text-white shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-5 sm:py-5 lg:px-6 lg:py-6">
            <div className="flex min-h-[150px] flex-col">
                <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 sm:text-[11px]">
                        Servicio y Partes
                    </div>

                    <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl xl:text-[40px]">
                        Retención de Franjas
                    </h1>
                </div>

                <div className="pt-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <SelectorSegmentos
                            segmentoActivo={segmentoActivo}
                            onCambiarSegmento={onCambiarSegmento}
                            variante="oscuro"
                        />

                        <div className="flex shrink-0 items-end justify-end">
                            <div className="flex items-end gap-4 xl:gap-5">
                                <div className="flex h-[44px] w-[60px] items-center justify-center">
                                    <img
                                        src={logoChevrolet}
                                        alt="Chevrolet"
                                        className="max-h-7 max-w-full object-contain opacity-95"
                                        loading="lazy"
                                    />
                                </div>

                                <div className="flex h-[44px] w-[90px] items-center justify-center">
                                    <img
                                        src={logoRyr}
                                        alt="Grupo Automotriz R&R"
                                        className="max-h-full max-w-full object-contain opacity-95"
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
