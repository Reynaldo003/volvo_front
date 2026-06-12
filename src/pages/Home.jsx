// src/pages/Home.jsx
import { useAuth } from "../auth/AuthContext";
import { Users, CarFront, ClipboardList, TrendingUp } from "lucide-react";

const cards = [
    {
        titulo: "Prospectos activos",
        valor: "128",
        descripcion: "Vista inicial de ejemplo",
        icono: Users,
    },
    {
        titulo: "Unidades en seguimiento",
        valor: "37",
        descripcion: "Datos simulados de front",
        icono: CarFront,
    },
    {
        titulo: "Tareas pendientes",
        valor: "18",
        descripcion: "Base para flujo comercial",
        icono: ClipboardList,
    },
    {
        titulo: "Conversión mensual",
        valor: "24%",
        descripcion: "Tarjeta demostrativa",
        icono: TrendingUp,
    },
];

export default function Home() {
    const { user } = useAuth();

    const nombreUsuario =
        user?.nombreCompleto ||
        `${user?.nombre || ""} ${user?.apellidos || ""}`.trim() ||
        user?.usuario ||
        "usuario";

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-lg bg-[linear-gradient(135deg,#212721,#212721,#212721)] p-6 text-white shadow-xl md:p-8">
                <div className="max-w-3xl">
                    <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                        Inicio
                    </div>

                    <h2 className="mt-4 text-3xl font-black md:text-4xl">
                        Bienvenido, {nombreUsuario}.
                    </h2>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {cards.map(({ titulo, valor, descripcion, icono: Icono }) => (
                    <div
                        key={titulo}
                        className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-500">
                                {titulo}
                            </div>

                            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                                <Icono size={20} />
                            </div>
                        </div>

                        <div className="mt-5 text-4xl font-black text-slate-900">
                            {valor}
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                            {descripcion}
                        </p>
                    </div>
                ))}
            </section>
        </div>
    );
}