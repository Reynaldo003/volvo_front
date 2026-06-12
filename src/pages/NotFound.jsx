import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
            <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
                    Error 404
                </div>

                <h1 className="mt-3 text-4xl font-black text-slate-900">
                    Página no encontrada
                </h1>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                    La ruta que intentaste abrir no existe o todavía no fue creada.
                </p>

                <Link
                    to="/crm_volvo/"
                    className="mt-6 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
}