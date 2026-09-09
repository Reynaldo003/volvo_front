import { useEffect, useState } from "react";
import {
  CalendarDays,
  Users,
  Car,
  BadgeCheck,
  WalletCards,
} from "lucide-react";

import { apiTraficoPiso } from "../../lib/apiTraficoPiso";

const MESES = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

const MESES_NUMERO = {
  ENE: 0,
  FEB: 1,
  MAR: 2,
  ABR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AGO: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DIC: 11,
};

function fechaValida(valor) {
  if (!valor) return null;

  const fecha = new Date(valor);

  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function tieneValor(valor) {
  return (
    valor !== null &&
    valor !== undefined &&
    String(valor).trim() !== ""
  );
}

function normalizarTexto(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function numero(valor) {
  const resultado = Number(valor);
  return Number.isFinite(resultado) ? resultado : 0;
}

function moneda(valor) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(valor || 0);
}

function agruparPorCampo(registros, campo, fallback = "Sin especificar") {
  const mapa = new Map();

  registros.forEach((registro) => {
    const valorOriginal = String(registro?.[campo] ?? "").trim();
    const label = valorOriginal || fallback;
    const clave = normalizarTexto(label);

    if (!mapa.has(clave)) {
      mapa.set(clave, {
        label,
        value: 0,
      });
    }

    mapa.get(clave).value += 1;
  });

  return [...mapa.values()].sort((a, b) => b.value - a.value);
}

function topNConOtros(items, limite = 6) {
  if (items.length <= limite) return items;

  const principales = items.slice(0, limite);

  const otros = items
    .slice(limite)
    .reduce((total, item) => total + item.value, 0);

  return [
    ...principales,
    {
      label: "Otros",
      value: otros,
    },
  ];
}

function agruparEdades(registros) {
  const rangos = [
    { label: "18 - 25", min: 18, max: 25, value: 0 },
    { label: "26 - 35", min: 26, max: 35, value: 0 },
    { label: "36 - 45", min: 36, max: 45, value: 0 },
    { label: "46 - 55", min: 46, max: 55, value: 0 },
    { label: "56 - 65", min: 56, max: 65, value: 0 },
    { label: "66+", min: 66, max: 200, value: 0 },
  ];

  let sinEdad = 0;

  registros.forEach((registro) => {
    const edad = Number(registro.edad);

    if (!Number.isFinite(edad) || edad <= 0) {
      sinEdad += 1;
      return;
    }

    const rango = rangos.find(
      (item) => edad >= item.min && edad <= item.max,
    );

    if (rango) {
      rango.value += 1;
    }
  });

  const resultado = rangos
    .filter((item) => item.value > 0)
    .map(({ label, value }) => ({ label, value }));

  if (sinEdad > 0) {
    resultado.push({
      label: "Sin edad registrada",
      value: sinEdad,
    });
  }

  return resultado;
}

function RankingCard({
  title,
  subtitle,
  items,
  total,
  emptyText = "Sin información para el periodo seleccionado",
}) {
  const maximo = Math.max(
    ...items.map((item) => item.value),
    1,
  );

  return (
    <article className="flex min-h-[340px] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-sm font-bold text-[#001E50]">
          {title}
        </h2>

        <p className="mt-0.5 text-xs text-slate-400">
          {subtitle}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
          {emptyText}
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {items.map((item) => {
            const porcentaje =
              total > 0
                ? (item.value / total) * 100
                : 0;

            const ancho =
              (item.value / maximo) * 100;

            return (
              <div key={item.label}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                  <span
                    className="truncate font-semibold text-slate-700"
                    title={item.label}
                  >
                    {item.label}
                  </span>

                  <span className="shrink-0 font-bold text-[#001E50]">
                    {item.value}

                    <span className="ml-1 font-normal text-slate-400">
                      ({porcentaje.toFixed(1)}%)
                    </span>
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                        normalizarTexto(item.label).startsWith("sin ")
                        ? "bg-slate-400"
                        : "bg-[#001E50]"
                    }`}
                    style={{
                        width: `${ancho}%`,
                    }}
                    />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

function formatearFecha(valor) {
  const fecha = fechaValida(valor);

  if (!fecha) return "—";

  return fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function PrimeraVisita() {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");

  const [anio, setAnio] = useState("");
  const [mes, setMes] = useState("");
  const [diaInicio] = useState(1);
  const [diaFin, setDiaFin] = useState(31);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setErrorCarga("");

        const respuesta = await apiTraficoPiso.list();

        const lista = Array.isArray(respuesta)
          ? respuesta
          : Array.isArray(respuesta?.results)
            ? respuesta.results
            : [];

        setRegistros(lista);

        const fechasDisponibles = lista
          .map((registro) => fechaValida(registro.creado_en))
          .filter(Boolean)
          .sort((a, b) => b.getTime() - a.getTime());

        if (fechasDisponibles.length > 0) {
          const fechaMasReciente = fechasDisponibles[0];

          setAnio(fechaMasReciente.getFullYear());
          setMes(MESES[fechaMasReciente.getMonth()]);
        }
      } catch (error) {
        console.error("Error cargando Primera Visita:", error);

        setErrorCarga(
          error?.message ||
            "No fue posible cargar la información de Primera Visita.",
        );
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const aniosDisponibles = [
    ...new Set(
      registros
        .map((registro) => fechaValida(registro.creado_en))
        .filter(Boolean)
        .map((fecha) => fecha.getFullYear()),
    ),
  ].sort((a, b) => b - a);

  const registrosFiltrados = registros.filter((registro) => {
    const fecha = fechaValida(registro.creado_en);

    if (!fecha) return false;

    const coincideAnio =
      fecha.getFullYear() === Number(anio);

    const coincideMes =
      fecha.getMonth() === MESES_NUMERO[mes];

    const dia = fecha.getDate();

    const coincideDia =
      dia >= Number(diaInicio) &&
      dia <= Number(diaFin);

    return coincideAnio && coincideMes && coincideDia;
  });

  const totalVisitas = registrosFiltrados.length;

  const totalAutoCuenta = registrosFiltrados.filter(
    (registro) =>
      registro.deja_auto_cuenta === true ||
      normalizarTexto(registro.deja_auto_cuenta) === "true",
  ).length;

  const totalCompruebanIngresos = registrosFiltrados.filter(
    (registro) =>
      registro.comprueba_ingresos === true ||
      normalizarTexto(registro.comprueba_ingresos) === "true",
  ).length;

  const presupuestosValidos = registrosFiltrados
    .map((registro) => numero(registro.presupuesto_estimado))
    .filter((valor) => valor > 0);

  const promedioPresupuesto =
    presupuestosValidos.length > 0
      ? presupuestosValidos.reduce(
          (total, valor) => total + valor,
          0,
        ) / presupuestosValidos.length
      : 0;

  const asesores = topNConOtros(
    agruparPorCampo(
      registrosFiltrados,
      "asesor_ventas",
      "Sin asesor",
    ),
    6,
  );

  const motivosIngreso = topNConOtros(
    agruparPorCampo(
      registrosFiltrados,
      "motivo_ingreso",
      "Sin motivo de ingreso",
    ),
    6,
  );

  const tiemposCompra = topNConOtros(
    agruparPorCampo(
      registrosFiltrados,
      "tiempo_compra",
      "Sin plazo definido",
    ),
    6,
  );

  const modelosInteres = topNConOtros(
    agruparPorCampo(
      registrosFiltrados,
      "auto_suenos",
      "Sin modelo especificado",
    ),
    6,
  );

  const rangosEdad = agruparEdades(registrosFiltrados);

  const motivosCompra = topNConOtros(
    agruparPorCampo(
      registrosFiltrados,
      "motivo_compra",
      "Sin motivo de compra",
    ),
    6,
  );

  const formasCapitalizacion = topNConOtros(
    agruparPorCampo(
      registrosFiltrados,
      "forma_capitalizacion",
      "Sin forma de capitalización",
    ),
    6,
  );

  const perfilesProfesionales = topNConOtros(
    agruparPorCampo(
      registrosFiltrados,
      "perfil_profesional",
      "Sin perfil registrado",
    ),
    6,
  );

  const pasatiempos = topNConOtros(
    agruparPorCampo(
      registrosFiltrados,
      "pasatiempos",
      "Sin intereses registrados",
    ),
    6,
  );
    const registrosTabla = [...registrosFiltrados].sort((a, b) => {
        const fechaA = fechaValida(a.creado_en)?.getTime() || 0;
        const fechaB = fechaValida(b.creado_en)?.getTime() || 0;

        return fechaB - fechaA;
        });

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6 px-4 pb-8">
      {/* ENCABEZADO */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Primera Visita
        </h1>

        <p className="mt-1 text-slate-500">
          Análisis de primeras visitas y tráfico de piso.
        </p>
      </div>

      {errorCarga && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorCarga}
        </div>
      )}

      {/* FILTROS */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">

          <div className="flex flex-wrap items-center gap-3">

            {/* AÑO */}
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <CalendarDays
                size={16}
                className="text-[#001E50]"
              />

              <select
                value={anio}
                onChange={(e) =>
                  setAnio(Number(e.target.value))
                }
                className="bg-transparent text-sm font-semibold text-[#001E50] outline-none"
              >
                {aniosDisponibles.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden h-7 w-px bg-slate-200 md:block" />

            {/* MESES */}
            <div className="flex flex-wrap items-center gap-1">
              {MESES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMes(item)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    mes === item
                      ? "bg-[#001E50] text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* DÍAS */}
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Rango días
            </span>

            <span className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-[#001E50]">
              {String(diaInicio).padStart(2, "0")}
            </span>

            <input
              type="range"
              min="1"
              max="31"
              value={diaFin}
              onChange={(e) =>
                setDiaFin(Number(e.target.value))
              }
              className="w-28 accent-[#001E50]"
            />

            <span className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-[#001E50]">
              {String(diaFin).padStart(2, "0")}
            </span>
          </div>

        </div>
      </section>

      {/* KPI */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* PRIMERAS VISITAS */}
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Primeras visitas
            </span>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users size={20} />
            </div>
          </div>

          <div className="mt-5 flex items-end gap-2">
            <span className="text-4xl font-bold text-[#001E50]">
              {cargando ? "..." : totalVisitas}
            </span>

            <span className="mb-1 text-xs text-slate-400">
              prospectos
            </span>
          </div>
        </article>

        {/* AUTO A CUENTA */}
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Dejan auto a cuenta
            </span>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Car size={20} />
            </div>
          </div>

          <div className="mt-5 flex items-end gap-2">
            <span className="text-4xl font-bold text-[#001E50]">
              {cargando ? "..." : totalAutoCuenta}
            </span>

            <span className="mb-1 text-xs text-slate-400">
              interesados
            </span>
          </div>
        </article>

        {/* COMPRUEBAN INGRESOS */}
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Comprueban ingresos
            </span>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <BadgeCheck size={20} />
            </div>
          </div>

          <div className="mt-5 flex items-end gap-2">
            <span className="text-4xl font-bold text-[#001E50]">
              {cargando ? "..." : totalCompruebanIngresos}
            </span>

            <span className="mb-1 text-xs text-slate-400">
              prospectos
            </span>
          </div>
        </article>

        {/* PRESUPUESTO */}
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Presupuesto promedio
            </span>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[#001E50]">
              <WalletCards size={20} />
            </div>
          </div>

          <div className="mt-5">
            <span className="text-3xl font-bold text-[#001E50]">
              {cargando
                ? "..."
                : moneda(promedioPresupuesto)}
            </span>

            <p className="mt-1 text-xs text-slate-400">
              sobre presupuestos capturados
            </p>
          </div>
        </article>

      </section>

      {/* FILA 1 */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">

        <RankingCard
          title="Atendidos por consultor"
          subtitle="Distribución de primeras visitas por asesor"
          items={asesores}
          total={totalVisitas}
        />

        <RankingCard
          title="Motivos de ingreso"
          subtitle="Razón principal de la visita al dealer"
          items={motivosIngreso}
          total={totalVisitas}
        />

        <RankingCard
          title="Fecha estimada de compra"
          subtitle="Horizonte de decisión de compra"
          items={tiemposCompra}
          total={totalVisitas}
        />

      </section>

      {/* FILA 2 */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">

        <RankingCard
          title="Modelo de interés"
          subtitle="Vehículos de mayor interés en primera visita"
          items={modelosInteres}
          total={totalVisitas}
        />

        <RankingCard
          title="Rango de edades"
          subtitle="Distribución etaria de prospectos"
          items={rangosEdad}
          total={totalVisitas}
        />

        <RankingCard
          title="Motivo de compra"
          subtitle="Principales razones declaradas de compra"
          items={motivosCompra}
          total={totalVisitas}
        />

      </section>

      {/* FILA 3 */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">

        <RankingCard
          title="Forma de capitalización"
          subtitle="Forma prevista de capitalización"
          items={formasCapitalizacion}
          total={totalVisitas}
        />

        <RankingCard
          title="Perfil de prospectos"
          subtitle="Perfil profesional registrado"
          items={perfilesProfesionales}
          total={totalVisitas}
        />

        <RankingCard
          title="Intereses de prospectos"
          subtitle="Pasatiempos e intereses declarados"
          items={pasatiempos}
          total={totalVisitas}
        />

      </section>

        {/* DETALLE DE PRIMERAS VISITAS */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
            <h2 className="text-sm font-bold text-[#001E50]">
                Detalle de primeras visitas
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
                Registros correspondientes al periodo seleccionado
            </p>
            </div>

            <span className="rounded-md border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#001E50]">
            {registrosTabla.length} registros
            </span>
        </div>

        {registrosTabla.length === 0 ? (
            <div className="flex min-h-[180px] items-center justify-center px-5 py-10 text-sm text-slate-400">
            No hay primeras visitas para el periodo seleccionado.
            </div>
        ) : (
            <div className="max-h-[480px] overflow-auto">

            <table className="min-w-[1200px] w-full border-collapse text-left text-xs">

                <thead className="sticky top-0 z-10 bg-slate-50">
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wide text-slate-500">

                    <th className="whitespace-nowrap px-4 py-3">
                    Fecha
                    </th>

                    <th className="whitespace-nowrap px-4 py-3">
                    Prospecto
                    </th>

                    <th className="whitespace-nowrap px-4 py-3">
                    Teléfono
                    </th>

                    <th className="whitespace-nowrap px-4 py-3">
                    Consultor
                    </th>

                    <th className="whitespace-nowrap px-4 py-3">
                    Motivo ingreso
                    </th>

                    <th className="whitespace-nowrap px-4 py-3">
                    Modelo interés
                    </th>

                    <th className="whitespace-nowrap px-4 py-3">
                    Tiempo compra
                    </th>

                    <th className="whitespace-nowrap px-4 py-3">
                    Edad
                    </th>

                    <th className="whitespace-nowrap px-4 py-3">
                    Capitalización
                    </th>

                </tr>
                </thead>

                <tbody>
                {registrosTabla.map((registro) => (
                    <tr
                    key={registro.id_trafico}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                    >
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        {formatearFecha(registro.creado_en)}
                    </td>

                    <td className="max-w-[220px] px-4 py-3">
                        <div
                        className="truncate font-semibold text-slate-800"
                        title={registro.nombre_prospecto || ""}
                        >
                        {registro.nombre_prospecto || "Sin nombre"}
                        </div>

                        <div className="mt-0.5 truncate text-[11px] text-slate-400">
                        {registro.email || "Sin correo"}
                        </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {registro.telefono || "—"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {registro.asesor_ventas || "Sin asignar"}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                        {registro.motivo_ingreso || "—"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-[#001E50]">
                        {registro.auto_suenos || "—"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {registro.tiempo_compra || "—"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {numero(registro.edad) > 0
                        ? `${numero(registro.edad)} años`
                        : "—"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {registro.forma_capitalizacion || "—"}
                    </td>
                    </tr>
                ))}
                </tbody>

            </table>
            </div>
        )}

        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
            Fuente: Tráfico de Piso · CRM Volvo
        </div>

        </section>
    </div>
  );
}