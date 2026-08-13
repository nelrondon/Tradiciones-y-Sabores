"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ReceiptText,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  XCircle,
  Search
} from "lucide-react";
import { api, type Orden, type EstatusOrden } from "../../api";
import { useToast } from "../ui/Toast";

// ── Helpers ───────────────────────────────────────────────────────────────────

function BadgeEstatus({ estatus }: { estatus: EstatusOrden }) {
  const estilos: Record<EstatusOrden, string> = {
    recibido: "bg-surface-dim text-on-surface-variant border border-outline-variant",
    preparando: "bg-[#fbbf24] text-black",
    listo: "bg-[#10b981] text-white",
    cancelado: "",
    entregado: ""
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded ${estilos[estatus]}`}
    >
      {estatus === "preparando" ? (
        <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></span>
      ) : null}
      {estatus}
    </span>
  );
}

function BadgeTipo({ tipo }: { tipo: Orden["tipo"] }) {
  const icons: Record<Orden["tipo"], string> = {
    mesa: "🪑",
    pickup: "🛍️",
    delivery: "🛵"
  };
  const labels: Record<Orden["tipo"], string> = {
    mesa: "Mesa",
    pickup: "Para Llevar",
    delivery: "Delivery"
  };
  return (
    <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded inline-flex items-center gap-1">
      {icons[tipo]} {labels[tipo]}
    </span>
  );
}

// ── Constantes ────────────────────────────────────────────────────────────────

const ESTADOS: EstatusOrden[] = ["recibido", "preparando", "listo"];
const ESTADOS_FILTROS: (EstatusOrden | "")[] = ["", ...ESTADOS];

// ── Vista Principal ───────────────────────────────────────────────────────────

export default function OrdersView() {
  const { showToast } = useToast();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<EstatusOrden | "">("");
  const [busqueda, setBusqueda] = useState("");
  const [expandida, setExpandida] = useState<number | null>(null);
  const [cancelando, setCancelando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getOrdenes();
      setOrdenes(data);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error cargando pedidos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const filtradas = ordenes
    .filter(o =>
      filtroEstado
        ? (o.Estatus_Orden || "").toLowerCase().includes(filtroEstado.toLowerCase())
        : true
    )
    .filter(o => {
      if (!busqueda.trim()) return true;
      const q = busqueda
        .trim()
        .toLowerCase()
        .replace(/[^0-9a-z]/g, "");
      const ticket = String(o.num_ticket || o.id_pedido || "").toLowerCase();
      const cliente = (o.cliente_nombre || "").toLowerCase();
      const cedula = (o.cliente_cedula || "").toLowerCase().replace(/[^0-9a-z]/g, "");
      const telf = (o.cliente_telefono || "").toLowerCase().replace(/[^0-9a-z]/g, "");
      return (
        ticket.includes(q) ||
        cliente.includes(busqueda.trim().toLowerCase()) ||
        cedula.includes(q) ||
        telf.includes(q)
      );
    });

  const conteo = (e: EstatusOrden) => ordenes.filter(o => o.Estatus_Orden === e).length;

  const toggleExpandida = (id: number) => setExpandida(prev => (prev === id ? null : id));

  const cancelarOrden = async (orden: Orden) => {
    if (
      !confirm(
        `¿Cancelar el pedido #${orden.id_pedido} de ${orden.cliente_nombre}? Esta acción no se puede deshacer.`
      )
    )
      return;
    setCancelando(orden.id_pedido);
    try {
      await api.cancelarOrden(orden.id_pedido);
      setOrdenes(prev => prev.filter(o => o.id_pedido !== orden.id_pedido));
      showToast("success", `Pedido #${orden.id_pedido} cancelado`, orden.cliente_nombre);
      setExpandida(null);
    } catch (e: unknown) {
      showToast(
        "error",
        "Error al cancelar",
        e instanceof Error ? e.message : "Intente nuevamente"
      );
    } finally {
      setCancelando(null);
    }
  };

  return (
    <div className="p-8 flex-1 flex flex-col gap-6 max-w-[1200px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-outline-variant">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight flex items-center gap-3">
            <ReceiptText size={30} /> Pedidos
          </h2>
          <p className="text-base text-on-surface-variant mt-2">
            Historial y estado de todos los pedidos del sistema.
          </p>
        </div>
        <button
          onClick={cargar}
          className="flex items-center gap-2 text-sm font-bold border border-outline-variant px-4 py-2 rounded hover:bg-surface-variant transition-colors text-on-surface-variant"
        >
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      {/* Contadores por estado (actúan como filtros) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ESTADOS.map(e => {
          const borderColors: Partial<Record<EstatusOrden, string>> = {
            recibido: "border-outline-variant",
            preparando: "border-[#fbbf24]",
            listo: "border-[#10b981]"
          };
          const activeColors: Partial<Record<EstatusOrden, string>> = {
            recibido: "border-primary bg-surface-container",
            preparando: "border-[#fbbf24] bg-[#fbbf24]/10",
            listo: "border-[#10b981] bg-[#10b981]/10"
          };
          const isActive = filtroEstado === e;
          return (
            <button
              key={e}
              onClick={() => setFiltroEstado(isActive ? "" : e)}
              className={`bg-surface border-2 rounded-lg p-4 text-left transition-all hover:shadow-sm ${
                isActive ? activeColors[e] : borderColors[e]
              }`}
            >
              <div className="text-4xl font-black text-primary">{conteo(e)}</div>
              <div className="text-xs font-bold text-on-surface-variant uppercase mt-1 flex items-center gap-1">
                <BadgeEstatus estatus={e} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Barra de Búsqueda para Vendedores / Cajeros */}
      <div className="relative w-full">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
        />
        <input
          type="text"
          placeholder="🔍 Buscar pedido por Cédula de cliente, Nombre, Ticket (#) o Teléfono..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-12 h-11 bg-surface border-2 border-outline-variant/80 rounded-xl text-sm font-semibold text-on-surface focus:border-secondary-container focus:ring-1 focus:ring-secondary-container outline-none transition-all placeholder:text-outline shadow-sm"
        />
        {busqueda && (
          <button
            onClick={() => setBusqueda("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-outline hover:text-on-surface bg-surface-container px-2 py-1 rounded"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Filtros rápidos por estado */}
      <div className="flex items-center gap-2 flex-wrap">
        {ESTADOS_FILTROS.map(e => (
          <button
            key={e}
            onClick={() => setFiltroEstado(e)}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
              filtroEstado === e
                ? "bg-primary text-on-primary"
                : "bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-surface-variant"
            }`}
          >
            {e === "" ? `Todos (${ordenes.length})` : `${e} (${conteo(e)})`}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded flex items-center gap-3 border border-error text-sm">
          <AlertTriangle size={18} /> {error}
          <button onClick={cargar} className="ml-auto font-bold underline">
            Reintentar
          </button>
        </div>
      )}

      {/* Lista de órdenes */}
      <div className="flex flex-col gap-2">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant gap-3">
            <Loader2 size={28} className="animate-spin" /> Cargando pedidos...
          </div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant">
            No hay pedidos con ese filtro.
          </div>
        ) : (
          filtradas.map(orden => {
            const estaExpandida = expandida === orden.id_pedido;
            return (
              <div
                key={orden.id_pedido}
                className="bg-surface border border-outline-variant rounded-lg overflow-hidden fade-in-up"
              >
                {/* Fila resumen */}
                <button
                  className="w-full p-4 flex items-center justify-between gap-4 hover:bg-surface-variant transition-colors text-left"
                  onClick={() => toggleExpandida(orden.id_pedido)}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xl font-black text-primary">
                      #{orden.id_pedido}
                    </span>
                    <BadgeTipo tipo={orden.tipo} />
                    <span className="font-bold text-on-surface">
                      {orden.cliente_nombre}
                    </span>
                    {orden.cliente_telefono && (
                      <span className="text-xs text-on-surface-variant font-mono hidden sm:inline">
                        {orden.cliente_telefono}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono font-bold text-primary">
                      ${orden.total.toFixed(2)}
                    </span>
                    <span className="text-xs text-on-surface-variant hidden md:inline">
                      {orden.hora_creacion}
                    </span>
                    <BadgeEstatus estatus={orden.Estatus_Orden} />
                    {estaExpandida ? (
                      <ChevronUp size={18} className="text-on-surface-variant" />
                    ) : (
                      <ChevronDown size={18} className="text-on-surface-variant" />
                    )}
                  </div>
                </button>

                {/* Detalle expandido */}
                {estaExpandida && (
                  <div className="border-t border-outline-variant p-5 bg-surface-container-low fade-in">
                    {/* Info del cliente */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-5">
                      {orden.cliente_cedula && (
                        <div>
                          <span className="text-on-surface-variant font-bold block text-xs uppercase">
                            Cédula
                          </span>
                          <span className="font-mono">{orden.cliente_cedula}</span>
                        </div>
                      )}
                      {orden.cliente_telefono && (
                        <div>
                          <span className="text-on-surface-variant font-bold block text-xs uppercase">
                            Teléfono
                          </span>
                          <span className="font-mono">{orden.cliente_telefono}</span>
                        </div>
                      )}
                      {orden.tipo === "mesa" && orden.mesa && (
                        <div>
                          <span className="text-on-surface-variant font-bold block text-xs uppercase">
                            Mesa
                          </span>
                          <span className="font-bold text-2xl">{orden.mesa}</span>
                        </div>
                      )}
                      {orden.tipo === "delivery" && orden.direccion && (
                        <div className="col-span-2">
                          <span className="text-on-surface-variant font-bold block text-xs uppercase">
                            Dirección
                          </span>
                          <span>{orden.direccion}</span>
                        </div>
                      )}
                    </div>

                    {/* Tabla de ítems con scroll horizontal en móviles */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[500px]">
                        <thead>
                          <tr className="text-xs text-on-surface-variant uppercase border-b border-outline-variant">
                            <th className="text-left pb-2">Ítem</th>
                            <th className="text-center pb-2 w-16">Cant.</th>
                            <th className="text-right pb-2 w-24">Precio U.</th>
                            <th className="text-right pb-2 w-24">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orden.items.map((item, i) => (
                            <tr
                              key={i}
                              className="border-b border-outline-variant/40 last:border-0"
                            >
                              <td className="py-2 font-bold">
                                {item.nombre}
                                {item.notas && (
                                  <span className="ml-2 text-xs text-error font-medium">
                                    ({item.notas})
                                  </span>
                                )}
                              </td>
                              <td className="py-2 text-center text-on-surface-variant">
                                {item.cantidad}
                              </td>
                              <td className="py-2 text-right font-mono text-on-surface-variant">
                                ${item.precio_unitario.toFixed(2)}
                              </td>
                              <td className="py-2 text-right font-mono">
                                ${(item.precio_unitario * item.cantidad).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t-2 border-outline-variant">
                          <tr>
                            <td
                              colSpan={3}
                              className="pt-2 text-right text-on-surface-variant text-xs uppercase font-bold"
                            >
                              IVA (16%)
                            </td>
                            <td className="pt-2 text-right font-mono">
                              ${orden.iva.toFixed(2)}
                            </td>
                          </tr>
                          <tr>
                            <td
                              colSpan={3}
                              className="text-right font-black uppercase text-base"
                            >
                              Total
                            </td>
                            <td className="ml-2 inline-block text-right font-mono font-black text-xl text-secondary-container">
                              ${orden.total.toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Botón cancelar — solo si no está Listo */}
                    {orden.Estatus_Orden !== "listo" && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => cancelarOrden(orden)}
                          disabled={cancelando === orden.id_pedido}
                          className="flex items-center gap-2 text-sm font-bold text-error border border-error/30 bg-error-container/30 hover:bg-error-container px-4 py-2 rounded transition-colors disabled:opacity-50"
                        >
                          {cancelando === orden.id_pedido ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <XCircle size={15} />
                          )}
                          Cancelar pedido
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
