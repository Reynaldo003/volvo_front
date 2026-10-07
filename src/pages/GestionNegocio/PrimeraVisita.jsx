import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

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
    <article className="flex min-h-[340px] flex-col bg-white p-6 font-light border-b border-[#E5E5E5]">
      <div className="border-b border-[#E5E5E5] pb-3">
        <h2 className="text-xs font-light uppercase tracking-[0.2em] text-[#141414]">
          {title}
        </h2>

        <p className="mt-0.5 text-[11px] font-light tracking-wide text-[#707070]">
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
                <div className="mb-1.5 flex items-center justify-between gap-3 text-xs font-light">
                  <span
                    className="truncate font-light tracking-wide text-[#141414]"
                    title={item.label}
                  >
                    {item.label}
                  </span>

                  <span className="shrink-0 font-light text-[#141414]">
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
    <div className="w-full space-y-6 bg-white px-4 py-6 text-[#141414] md:px-8 font-bahnschrift font-light">
      <style>{`
        .font-bahnschrift {
          font-family: 'Bahnschrift Light', 'Bahnschrift', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
        }
      `}</style>

      {errorCarga && (
        <div className="border-b border-red-200 bg-red-50 p-3 text-xs font-light text-red-600">
          {errorCarga}
        </div>
      )}

      <section className="relative w-full overflow-hidden border-b border-[#E5E5E5] p-6 text-white md:p-8 font-light">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        >
          <source src="../video.webm" type="video/webm" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/55 to-black/90" />

        <div className="relative z-10">
          <div className="flex flex-col gap-2 border-b border-white/20 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="text-[10px] font-light uppercase tracking-[0.3em] text-slate-300">
                Volvo Suecia Car Angelopolis · CRM Dashboard
              </span>
              <h1 className="mt-1 text-2xl font-light tracking-tight text-white md:text-3xl">
                Análisis Comercial de Primera Visita
              </h1>
            </div>
            <div className="text-xs font-light tracking-wide text-slate-300">
              Periodo Activo:{" "}
              <span className="font-light text-white">
                {mes} {anio}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <p className="text-[11px] font-light uppercase tracking-[0.2em] text-slate-300">
                Primeras Visitas Registradas
              </p>
              <div className="mt-1 flex items-baseline gap-3">
                <h2 className="text-5xl font-light tracking-tight text-white md:text-6xl">
                  {cargando ? "..." : totalVisitas}
                </h2>
                <span className="border border-white/20 bg-black/40 px-2.5 py-1 text-xs font-light tracking-wider text-slate-200 backdrop-blur-md">
                  prospectos
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-px border border-white/20 bg-white/20 sm:grid-cols-3 lg:col-span-7">
              <div className="bg-black/50 p-4 backdrop-blur-xs">
                <p className="text-[9px] font-light uppercase tracking-[0.2em] text-slate-300">
                  Dejan auto a cuenta
                </p>
                <p className="mt-1 text-2xl font-light text-white">
                  {totalAutoCuenta}
                </p>
                <p className="mt-0.5 text-[10px] font-light text-slate-400">
                  Interesados
                </p>
              </div>

              <div className="bg-black/50 p-4 backdrop-blur-xs">
                <p className="text-[9px] font-light uppercase tracking-[0.2em] text-slate-300">
                  Comprueban ingresos
                </p>
                <p className="mt-1 text-2xl font-light text-white">
                  {totalCompruebanIngresos}
                </p>
                <p className="mt-0.5 text-[10px] font-light text-slate-400">
                  Prospectos
                </p>
              </div>

              <div className="bg-black/50 p-4 backdrop-blur-xs">
                <p className="text-[9px] font-light uppercase tracking-[0.2em] text-slate-300">
                  Presupuesto promedio
                </p>
                <p className="mt-1 text-xl font-light text-white">
                  {cargando ? "..." : moneda(promedioPresupuesto)}
                </p>
                <p className="mt-0.5 text-[10px] font-light text-slate-400">
                  Presupuestos capturados
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full border-b border-[#E5E5E5] pb-4 pt-2 font-light">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 border-b border-[#E5E5E5] py-1">
              <CalendarDays size={13} className="text-[#141414]" strokeWidth={1.5} />
              <select
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value))}
                className="cursor-pointer bg-transparent text-xs font-light uppercase tracking-[0.15em] text-[#141414] outline-none"
              >
                {aniosDisponibles.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden h-4 w-px bg-[#E5E5E5] md:block" />

            <div className="flex flex-wrap items-center gap-1">
              {MESES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMes(item)}
                  className={`px-2.5 py-1 text-xs font-light tracking-wider transition-colors ${
                    mes === item
                      ? "bg-[#141414] text-white"
                      : "text-[#707070] hover:bg-[#F5F5F5]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5 border-b border-[#E5E5E5] py-1">
            <span className="text-[10px] font-light uppercase tracking-[0.15em] text-[#707070]">
              Días
            </span>
            <span className="text-xs font-light text-[#141414]">
              {String(diaInicio).padStart(2, "0")}
            </span>
            <input
              type="range"
              min="1"
              max="31"
              value={diaFin}
              onChange={(e) => setDiaFin(Number(e.target.value))}
              className="w-20 cursor-pointer accent-[#141414]"
            />
            <span className="text-xs font-light text-[#141414]">
              {String(diaFin).padStart(2, "0")}
            </span>
          </div>
        </div>
      </section>

      <section className="grid w-full grid-cols-1 gap-6 xl:grid-cols-3">
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

      <section className="grid w-full grid-cols-1 gap-6 xl:grid-cols-3">
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

      <section className="grid w-full grid-cols-1 gap-6 xl:grid-cols-3">
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

      <section className="w-full overflow-hidden border-b border-[#E5E5E5] bg-white font-light">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E5E5] px-6 py-4">
          <div>
            <h2 className="text-xs font-light uppercase tracking-[0.2em] text-[#141414]">
              Detalle de primeras visitas
            </h2>
            <p className="mt-0.5 text-[11px] font-light tracking-wide text-[#707070]">
              Registros correspondientes al periodo seleccionado
            </p>
          </div>
          <span className="text-xs font-light tracking-wide text-[#707070]">
            {registrosTabla.length} registros
          </span>
        </div>

        {registrosTabla.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center px-5 py-10 text-xs font-light text-[#707070]">
            No hay primeras visitas para el periodo seleccionado.
          </div>
        ) : (
          <div className="max-h-[480px] overflow-auto">
            <table className="w-full min-w-[1200px] border-collapse text-left text-xs">
              <thead className="sticky top-0 z-10 bg-[#F8F8F7]">
                <tr className="border-b border-[#E5E5E5] text-[10px] font-light uppercase tracking-[0.15em] text-[#707070]">
                  <th className="whitespace-nowrap px-4 py-3">Fecha</th>
                  <th className="whitespace-nowrap px-4 py-3">Prospecto</th>
                  <th className="whitespace-nowrap px-4 py-3">Teléfono</th>
                  <th className="whitespace-nowrap px-4 py-3">Consultor</th>
                  <th className="whitespace-nowrap px-4 py-3">Motivo ingreso</th>
                  <th className="whitespace-nowrap px-4 py-3">Modelo interés</th>
                  <th className="whitespace-nowrap px-4 py-3">Tiempo compra</th>
                  <th className="whitespace-nowrap px-4 py-3">Edad</th>
                  <th className="whitespace-nowrap px-4 py-3">Capitalización</th>
                </tr>
              </thead>
              <tbody>
                {registrosTabla.map((registro) => (
                  <tr
                    key={registro.id_trafico}
                    className="border-b border-[#F0F0EE] transition-colors hover:bg-[#FAFAF9]"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-light text-[#707070]">
                      {formatearFecha(registro.creado_en)}
                    </td>
                    <td className="max-w-[220px] px-4 py-3">
                      <div
                        className="truncate font-light text-[#141414]"
                        title={registro.nombre_prospecto || ""}
                      >
                        {registro.nombre_prospecto || "Sin nombre"}
                      </div>
                      <div className="mt-0.5 truncate text-[10px] font-light text-[#A0A0A0]">
                        {registro.email || "Sin correo"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-light text-[#707070]">
                      {registro.telefono || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-light text-[#707070]">
                      {registro.asesor_ventas || "Sin asignar"}
                    </td>
                    <td className="px-4 py-3 font-light text-[#707070]">
                      {registro.motivo_ingreso || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-light text-[#141414]">
                      {registro.auto_suenos || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-light text-[#707070]">
                      {registro.tiempo_compra || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-light text-[#707070]">
                      {numero(registro.edad) > 0
                        ? `${numero(registro.edad)} años`
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-light text-[#707070]">
                      {registro.forma_capitalizacion || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-[#E5E5E5] px-6 py-3 text-[10px] font-light uppercase tracking-[0.15em] text-[#A0A0A0]">
          Fuente: Tráfico de Piso · CRM Volvo
        </div>
      </section>
    </div>
  );
}
