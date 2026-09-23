import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  Loader2,
  Search,
  Server,
  Users,
  X,
} from "lucide-react";

import { api } from "../../lib/apiPruebas";

const PAGE_SIZE = 50;

function fechaLocal(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

const FILTROS = [
  {
    key: "",
    label: "Todos",
    resumenKey: "total_resultados",
    Icon: Users,
  },
  {
    key: "AMBOS",
    label: "Ambos",
    resumenKey: null,
    Icon: Check,
  },
  {
    key: "SOLO_CRM",
    label: "Solo CRM",
    resumenKey: "solo_crm",
    Icon: Database,
  },
  {
    key: "SOLO_SALESFORCE",
    label: "Solo Salesforce",
    resumenKey: "solo_salesforce",
    Icon: Server,
  },
  {
    key: "SIN_IDENTIDAD",
    label: "Sin identidad",
    resumenKey: "sin_identidad",
    Icon: Users,
  },
];

function texto(value) {
  const str = String(value ?? "").trim();
  return str || "—";
}

function fecha(value) {
  if (!value) return "—";

  const str = String(value);

  const date = new Date(str);

  if (Number.isNaN(date.getTime())) {
    return str;
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: str.includes(":") ? "short" : undefined,
  }).format(date);
}

function nombreSalesforce(registro) {
  return [
    registro?.nombre,
    registro?.apellidos,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function nombrePrincipal(item) {
  const crm = item?.crm?.[0];

  if (crm?.nombre) {
    return crm.nombre;
  }

  const sf = item?.salesforce?.[0];

  return nombreSalesforce(sf) || "Sin nombre";
}

function cantidadAmbos(resumen) {
  return (
    Number(resumen?.ambos_email || 0) +
    Number(resumen?.ambos_nombre || 0) +
    Number(resumen?.ambos_varios_salesforce || 0)
  );
}

function tipoLabel(tipo) {
  const labels = {
    EMAIL_EXACTO: "Correo exacto",
    NOMBRE_EXACTO: "Nombre exacto",
    NOMBRE_EXACTO_VARIOS_SALESFORCE:
      "Nombre exacto · varios Salesforce",
    SIN_COINCIDENCIA: "Sin coincidencia",
    CRM_SIN_IDENTIDAD: "CRM sin identidad",
    SALESFORCE_SIN_IDENTIDAD:
      "Salesforce sin identidad",
    VARIOS_CRM_Y_SALESFORCE:
      "Requiere revisión",
  };

  return labels[tipo] || texto(tipo);
}

function origenLabel(origen) {
  const labels = {
    AMBOS: "Ambos",
    SOLO_CRM: "Solo CRM",
    SOLO_SALESFORCE: "Solo Salesforce",
    SIN_IDENTIDAD: "Sin identidad",
    REVISAR: "Revisar",
  };

  return labels[origen] || texto(origen);
}

function origenCls(origen) {
  if (origen === "AMBOS") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (origen === "SOLO_CRM") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (origen === "SOLO_SALESFORCE") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (origen === "SIN_IDENTIDAD") {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

function Campo({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
        {label}
      </div>

      <div className="mt-1 break-words text-sm font-semibold text-black">
        {texto(value)}
      </div>
    </div>
  );
}

function DetalleCRM({ registros = [] }) {
  if (!registros.length) {
    return (
      <div className="rounded-xl border border-dashed border-black/10 p-5 text-center text-sm text-neutral-400">
        No existe registro relacionado en CRM.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {registros.map((crm, index) => (
        <div
          key={
            crm?.expediente_id ||
            crm?.cliente_id ||
            `crm-${index}`
          }
          className="rounded-xl border border-black/10 bg-white p-4"
        >
          {registros.length > 1 ? (
            <div className="mb-3 text-xs font-black uppercase tracking-wide text-neutral-400">
              Registro CRM #{index + 1}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Campo label="Nombre" value={crm?.nombre} />
            <Campo label="Correo" value={crm?.correo} />
            <Campo label="Teléfono" value={crm?.telefono} />
            <Campo label="Estado" value={crm?.estado} />
            <Campo label="Business" value={crm?.business} />
            <Campo label="Agencia" value={crm?.agencia} />
            <Campo
              label="Asesor digital"
              value={crm?.asesor_digital}
            />
            <Campo
              label="Asesor ventas"
              value={crm?.asesor_ventas}
            />
            <Campo
              label="Fecha creación"
              value={fecha(crm?.creado)}
            />
            <Campo
              label="Última actualización"
              value={fecha(crm?.actualizado)}
            />
            <Campo
              label="Expediente"
              value={crm?.expediente_id}
            />
            <Campo
              label="Cliente ID"
              value={crm?.cliente_id}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DetalleSalesforce({ registros = [] }) {
  if (!registros.length) {
    return (
      <div className="rounded-xl border border-dashed border-black/10 p-5 text-center text-sm text-neutral-400">
        No existe registro relacionado en Salesforce.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {registros.map((sf, index) => (
        <div
          key={`${sf?.email || ""}-${sf?.fecha_creacion || ""}-${index}`}
          className="rounded-xl border border-black/10 bg-white p-4"
        >
          {registros.length > 1 ? (
            <div className="mb-3 text-xs font-black uppercase tracking-wide text-neutral-400">
              Registro Salesforce #{index + 1}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Campo
              label="Nombre"
              value={nombreSalesforce(sf)}
            />
            <Campo label="Email" value={sf?.email} />
            <Campo
              label="Estado lead"
              value={sf?.estado_lead}
            />
            <Campo label="Origen" value={sf?.origen} />
            <Campo
              label="Tipo solicitud"
              value={sf?.tipo_solicitud}
            />
            <Campo
              label="Propietario lead"
              value={sf?.propietario_lead}
            />
            <Campo
              label="Valoración"
              value={sf?.valoracion}
            />
            <Campo
              label="Compañía"
              value={sf?.compania}
            />
            <Campo label="Cargo" value={sf?.cargo} />
            <Campo label="Calle" value={sf?.calle} />
            <Campo
              label="Fecha creación"
              value={fecha(sf?.fecha_creacion)}
            />
          </div>

          {sf?.descripcion ? (
            <div className="mt-4 border-t border-black/10 pt-4">
              <Campo
                label="Descripción"
                value={sf.descripcion}
              />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function CruceSalesforce() {
  const [origen, setOrigen] = useState("");
  const [items, setItems] = useState([]);
  const [resumen, setResumen] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: PAGE_SIZE,
    offset: 0,
    siguiente_offset: null,
  });
  const [expanded, setExpanded] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] = useState("");
  const [filtros, setFiltros] = useState({
    dealer: "",
    business: "",
    estado_crm: "",
    estado_salesforce: "",
    registro_desde: "",
    registro_hasta: "",
  });

  const actualizarFiltro = (campo, valor) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
    }));

    setOffset(0);
    setExpanded(null);
  };

  const aplicarRangoRapido = (tipo) => {
    const ahora = new Date();

    const hoy = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate()
    );

    const desde = new Date(hoy);

    switch (tipo) {
      case "hoy":
        break;

      case "ayer":
        desde.setDate(desde.getDate() - 1);
        break;

      case "semana":
        desde.setDate(desde.getDate() - ((desde.getDay() + 6) % 7));
        break;

      case "7dias":
        desde.setDate(desde.getDate() - 6);
        break;

      case "30dias":
        desde.setDate(desde.getDate() - 29);
        break;

      case "mes":
        desde.setDate(1);
        break;

      default:
        return;
    }

    const hasta = tipo === "ayer"
      ? desde
      : hoy;

    setFiltros((prev) => ({
      ...prev,
      registro_desde: fechaLocal(desde),
      registro_hasta: fechaLocal(hasta),
    }));

    setOffset(0);
    setExpanded(null);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setBusquedaAplicada(busqueda.trim());
      setOffset(0);
      setExpanded(null);
    }, 350);

    return () => clearTimeout(timer);
  }, [busqueda]);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await api.digitalesCruceSalesforce({
        origen: origen || undefined,
        q: busquedaAplicada || undefined,

        dealer: filtros.dealer || undefined,
        business: filtros.business || undefined,
        estado_crm: filtros.estado_crm || undefined,
        estado_salesforce: filtros.estado_salesforce || undefined,

        registro_desde: filtros.registro_desde || undefined,
        registro_hasta: filtros.registro_hasta || undefined,

        limit: PAGE_SIZE,
        offset,
      });

      setItems(
        Array.isArray(data?.items)
          ? data.items
          : [],
      );

      setResumen(data?.resumen || {});
      setPagination(
        data?.paginacion || {
          total: 0,
          limit: PAGE_SIZE,
          offset,
          siguiente_offset: null,
        },
      );
    } catch (err) {
      console.error(
        "Error cargando cruce Salesforce:",
        err,
      );

      setError(
        err?.message ||
        "No se pudo cargar el cruce CRM / Salesforce.",
      );
    } finally {
      setLoading(false);
    }
  }, [origen, offset, busquedaAplicada, filtros]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    setOffset(0);
    setExpanded(null);
  }, [origen]);

const itemsFiltrados = items;

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      Number(pagination.total || 0) /
      PAGE_SIZE,
    ),
  );

  const paginaActual =
    Math.floor(offset / PAGE_SIZE) + 1;

  const cards = FILTROS.map((filtro) => {
    let cantidad = 0;

    if (filtro.key === "AMBOS") {
      cantidad = cantidadAmbos(resumen);
    } else if (
      filtro.resumenKey
    ) {
      cantidad =
        Number(
          resumen?.[filtro.resumenKey] || 0,
        );
    }

    return {
      ...filtro,
      cantidad,
    };
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(
          ({
            key,
            label,
            cantidad,
            Icon,
          }) => {
            const activo =
              origen === key;

            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setOrigen(key);
                  setBusqueda("");
                }}
                className={[
                  "rounded-2xl border p-4 text-left shadow-sm transition",
                  activo
                    ? "border-black bg-black text-white"
                    : "border-black/10 bg-white text-black hover:border-black/25 hover:bg-neutral-50",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={[
                      "text-xs font-bold uppercase tracking-wide",
                      activo
                        ? "text-white/60"
                        : "text-neutral-400",
                    ].join(" ")}
                  >
                    {label}
                  </span>

                  <Icon className="h-4 w-4" />
                </div>

                <div className="mt-2 text-2xl font-black">
                  {cantidad}
                </div>
              </button>
            );
          },
        )}
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

            <input
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
              placeholder="Buscar por nombre, correo, teléfono, estado..."
              className="h-10 w-full rounded-xl border border-black/10 bg-white pl-10 pr-10 text-sm font-semibold outline-none transition focus:border-black/30"
            />

            {busqueda ? (
              <button
                type="button"
                onClick={() =>
                  setBusqueda("")
                }
                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="text-sm font-semibold text-neutral-500">
            {pagination.total || 0} resultado
            {Number(pagination.total || 0) === 1
              ? ""
              : "s"}
          </div>
        </div>
      </div>

      {/* ── Filtros de fechas del cruce ── */}
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end">

        <div className="grid flex-1 gap-3 sm:grid-cols-2">

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-black">
              Registro desde
            </span>

            <input
              type="date"
              value={filtros.registro_desde}
              onChange={(e) =>
                actualizarFiltro("registro_desde", e.target.value)
              }
              className="h-10 w-full rounded-lg border border-black/15 bg-white px-3 text-sm font-semibold text-black"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-black">
              Registro hasta
            </span>

            <input
              type="date"
              value={filtros.registro_hasta}
              onChange={(e) =>
                actualizarFiltro("registro_hasta", e.target.value)
              }
              className="h-10 w-full rounded-lg border border-black/15 bg-white px-3 text-sm font-semibold text-black"
            />
          </label>

        </div>

        <div className="flex flex-wrap gap-2">

          {[
            ["Hoy", "hoy"],
            ["Ayer", "ayer"],
            ["Esta semana", "semana"],
            ["7 días", "7dias"],
            ["30 días", "30dias"],
            ["Este mes", "mes"],
          ].map(([label, tipo]) => (
            <button
              key={tipo}
              type="button"
              onClick={() => aplicarRangoRapido(tipo)}
              className="h-10 rounded-lg border border-black/15 bg-white px-3 text-xs font-bold text-black transition hover:bg-neutral-100"
            >
              {label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => {
              setBusqueda("");
              setBusquedaAplicada("");

              setFiltros({
                dealer: "",
                business: "",
                estado_crm: "",
                estado_salesforce: "",
                registro_desde: "",
                registro_hasta: "",
              });

              setOffset(0);
              setExpanded(null);
            }}
            className="h-10 rounded-lg border border-black/15 bg-white px-3 text-xs font-bold text-black transition hover:bg-neutral-100"
          >
            Limpiar fechas
          </button>

        </div>

      </div>
    </div>
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-black/10 bg-white shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando cruce...
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-black/10 bg-neutral-50 text-xs font-bold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="w-12 px-4 py-3" />
                  <th className="px-4 py-3">
                    Origen
                  </th>
                  <th className="px-4 py-3">
                    Prospecto
                  </th>
                  <th className="px-4 py-3">
                    CRM
                  </th>
                  <th className="px-4 py-3">
                    Salesforce
                  </th>
                  <th className="px-4 py-3">
                    Coincidencia
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-black/5">
                {itemsFiltrados.map(
                  (item, index) => {
                    const key =
                      `${offset}-${index}`;

                    const abierto =
                      expanded === key;

                    const crm =
                      item?.crm || [];

                    const salesforce =
                      item?.salesforce || [];

                    return (
                      <>
                        <tr
                          key={`${key}-row`}
                          className="cursor-pointer transition hover:bg-neutral-50"
                          onClick={() =>
                            setExpanded(
                              abierto
                                ? null
                                : key,
                            )
                          }
                        >
                          <td className="px-4 py-3">
                            <ChevronDown
                              className={[
                                "h-4 w-4 transition-transform",
                                abierto
                                  ? "rotate-180"
                                  : "",
                              ].join(" ")}
                            />
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={[
                                "inline-flex rounded-full border px-2.5 py-1 text-xs font-bold",
                                origenCls(
                                  item?.origen_cruce,
                                ),
                              ].join(" ")}
                            >
                              {origenLabel(
                                item?.origen_cruce,
                              )}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-bold text-black">
                              {nombrePrincipal(
                                item,
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            {crm.length ? (
                              <span className="font-bold text-emerald-600">
                                ✓ Sí
                              </span>
                            ) : (
                              <span className="text-neutral-300">
                                —
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {salesforce.length ? (
                              <div className="font-bold text-emerald-600">
                                ✓ Sí
                                {salesforce.length >
                                1
                                  ? ` (${salesforce.length})`
                                  : ""}
                              </div>
                            ) : (
                              <span className="text-neutral-300">
                                —
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-neutral-600">
                            {tipoLabel(
                              item?.tipo_coincidencia,
                            )}
                          </td>
                        </tr>

                        {abierto ? (
                          <tr
                            key={`${key}-detail`}
                            className="bg-neutral-50/70"
                          >
                            <td
                              colSpan={6}
                              className="p-5"
                            >
                              <div className="grid gap-5 xl:grid-cols-2">
                                <div>
                                  <div className="mb-3 flex items-center gap-2">
                                    <Database className="h-4 w-4" />
                                    <h3 className="font-extrabold text-black">
                                      CRM
                                    </h3>

                                    <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-bold text-neutral-500">
                                      {crm.length}
                                    </span>
                                  </div>

                                  <DetalleCRM
                                    registros={
                                      crm
                                    }
                                  />
                                </div>

                                <div>
                                  <div className="mb-3 flex items-center gap-2">
                                    <Server className="h-4 w-4" />

                                    <h3 className="font-extrabold text-black">
                                      Salesforce
                                    </h3>

                                    <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-bold text-neutral-500">
                                      {
                                        salesforce.length
                                      }
                                    </span>
                                  </div>

                                  <DetalleSalesforce
                                    registros={
                                      salesforce
                                    }
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </>
                    );
                  },
                )}

                {!itemsFiltrados.length ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center text-sm font-semibold text-neutral-400"
                    >
                      No hay registros para mostrar.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-black/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs font-semibold text-neutral-400">
              Página {paginaActual} de{" "}
              {totalPaginas}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={offset <= 0}
                onClick={() => {
                  setOffset((prev) =>
                    Math.max(
                      0,
                      prev - PAGE_SIZE,
                    ),
                  );
                  setExpanded(null);
                }}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-black/15 px-3 text-sm font-semibold text-black transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>

              <button
                type="button"
                disabled={
                  pagination.siguiente_offset ==
                  null
                }
                onClick={() => {
                  setOffset(
                    Number(
                      pagination.siguiente_offset,
                    ),
                  );
                  setExpanded(null);
                }}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-black/15 px-3 text-sm font-semibold text-black transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}