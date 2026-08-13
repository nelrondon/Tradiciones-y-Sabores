import {
  AlertTriangle,
  Info,
  Loader2,
  MessageCircle,
  Minus,
  Plus,
  Search,
  Send,
  ShoppingBag,
  Trash2
} from "lucide-react";
import { useEffect, useState } from "react";
import { api, type Producto } from "../../api";
import { useToast } from "../ui/Toast";

// ── Constantes ────────────────────────────────────────────────────────────────

const IVA_RATE = 0.16;

/** Número WhatsApp del restaurante, configurable en .env.local */
const WA_NUMERO = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? "584140000000";

/** Genera un número de ticket único basado en timestamp */
const nuevoTicketId = () => `T-${Date.now().toString(36).toUpperCase().slice(-6)}`;

// ── Tipos locales ─────────────────────────────────────────────────────────────

interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  notas: string;
}

interface InfoCliente {
  nombre: string;
  cedula: string;
  telefono: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCategoriaLabel(cat: string): string {
  if (!cat) return "General";
  const c = cat.toLowerCase().replace(/_/g, " ");
  if (c === "todos") return "Todos los Platos";
  if (c === "plato principal" || c === "platos principales") return "Platos Principales";
  if (c === "bebida" || c === "bebidas") return "Bebidas";
  if (c === "postre" || c === "postres") return "Postres";
  if (c === "adicional" || c === "adicionales") return "Adicionales";
  return c.charAt(0).toUpperCase() + c.slice(1);
}

function generarMensajeWA(
  ticketId: string,
  cliente: InfoCliente,
  carrito: ItemCarrito[],
  orderType: "mesa" | "pickup" | "delivery",
  mesa: string,
  direccion: string,
  subtotal: number,
  iva: number,
  total: number
): string {
  const tipoLabel =
    orderType === "mesa"
      ? `🪑 Mesa ${mesa}`
      : orderType === "pickup"
        ? "🛍️ Para Llevar"
        : `🛵 Delivery: ${direccion}`;

  const items = carrito
    .map(
      i =>
        `• ${i.cantidad}x ${i.producto.nombre}` +
        (i.notas ? ` _(${i.notas.toUpperCase()})_` : "")
    )
    .join("\n");

  return (
    `🍔 *NUEVO PEDIDO #${ticketId}*\n\n` +
    `*Cliente:* ${cliente.nombre}\n` +
    `*Teléfono:* ${cliente.telefono || "—"}\n` +
    `*Cédula/RIF:* ${cliente.cedula || "—"}\n` +
    `*Tipo:* ${tipoLabel}\n\n` +
    `*Ítems:*\n${items}\n\n` +
    `Subtotal: $${subtotal.toFixed(2)}\n` +
    `IVA (16%): $${iva.toFixed(2)}\n` +
    `*TOTAL: $${total.toFixed(2)}*`
  );
}

// ── Vista Principal ───────────────────────────────────────────────────────────

export default function PosView() {
  const { showToast } = useToast();

  // Catálogo
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [errorProductos, setErrorProductos] = useState<string | null>(null);
  const [categoriaActiva, setCategoriaActiva] = useState("");
  const [busqueda, setBusqueda] = useState("");

  // Carrito
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);

  // Formulario de cliente
  const [cliente, setCliente] = useState<InfoCliente>({
    nombre: "",
    cedula: "",
    telefono: ""
  });

  // Tipo de pedido
  const [orderType, setOrderType] = useState<"mesa" | "pickup" | "delivery">("mesa");
  const [mesa, setMesa] = useState("");
  const [direccion, setDireccion] = useState("");

  // Estado del envío
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [ticketActual] = useState(() => nuevoTicketId());

  // Navegación responsiva en móviles: Catálogo vs Carrito
  const [activeMobileTab, setActiveMobileTab] = useState<"catalog" | "cart">("catalog");

  // ── Fetch catálogo ──
  useEffect(() => {
    api
      .getProductos()
      .then(data => {
        const safeData = Array.isArray(data) ? data : [];
        setProductos(safeData);
        if (safeData.length > 0 && safeData[0]?.categoria) {
          setCategoriaActiva(safeData[0].categoria);
        }
      })
      .catch((e: Error) => setErrorProductos(e?.message ?? "Error al cargar productos"))
      .finally(() => setLoadingProductos(false));
  }, []);

  // ── Derivados ──
  const safeProds = Array.isArray(productos) ? productos : [];
  const categorias = [
    ...new Set(safeProds.map(p => p?.categoria ?? "plato_principal"))
  ] as string[];
  const productosFiltrados = safeProds
    .filter(p => (p?.categoria ?? "plato_principal") === categoriaActiva)
    .filter(
      p =>
        busqueda === "" ||
        (p?.nombre ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
        (p?.descripcion ?? "").toLowerCase().includes(busqueda.toLowerCase())
    );
  const subtotal = (Array.isArray(carrito) ? carrito : []).reduce(
    (s, i) => s + (Number(i?.producto?.precio) || 0) * (Number(i?.cantidad) || 0),
    0
  );
  const iva = subtotal * IVA_RATE;
  const total = subtotal + iva;

  // ── Manejo del carrito ──
  const agregarAlCarrito = (producto: Producto) => {
    if (!producto.disponible) return;
    setCarrito(prev => {
      const existe = prev.find(i => i.producto.id_producto === producto.id_producto);
      if (existe)
        return prev.map(i =>
          i.producto.id_producto === producto.id_producto
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        );
      return [...prev, { producto, cantidad: 1, notas: "" }];
    });
  };

  const cambiarCantidad = (id: number, delta: number) =>
    setCarrito(prev =>
      prev
        .map(i =>
          i.producto.id_producto === id ? { ...i, cantidad: i.cantidad + delta } : i
        )
        .filter(i => i.cantidad > 0)
    );

  const actualizarNotas = (id: number, notas: string) =>
    setCarrito(prev =>
      prev.map(i => (i.producto.id_producto === id ? { ...i, notas } : i))
    );

  const eliminarItem = (id: number) =>
    setCarrito(prev => prev.filter(i => i.producto.id_producto !== id));

  // ── Procesar pedido ──
  const procesarPedido = async () => {
    setErrorEnvio(null);
    if (carrito.length === 0) {
      setErrorEnvio("El carrito está vacío.");
      return;
    }
    if (!cliente.nombre.trim()) {
      setErrorEnvio("El nombre del cliente es requerido.");
      return;
    }
    if (orderType === "mesa" && !mesa) {
      setErrorEnvio("Ingrese el número de mesa.");
      return;
    }
    if (orderType === "delivery" && !direccion.trim()) {
      setErrorEnvio("Ingrese la dirección de envío.");
      return;
    }

    // Abrir la pestaña ANTES del await, mientras seguimos dentro
    // del gesto del usuario (click), para evitar el bloqueo de pop-ups.
    const waWindow = window.open("about:blank", "_blank");

    setEnviando(true);
    try {
      await api.crearOrden({
        cliente_nombre: cliente.nombre.toUpperCase().trim(),
        cliente_cedula: cliente.cedula.trim() || undefined,
        cliente_telefono: cliente.telefono.trim() || undefined,
        tipo: orderType,
        mesa: orderType === "mesa" ? Number(mesa) : undefined,
        direccion: orderType === "delivery" ? direccion.trim() : undefined,
        items: carrito.map(i => ({
          id_producto: i.producto.id_producto,
          nombre: i.producto.nombre,
          cantidad: i.cantidad,
          precio_unitario: i.producto.precio,
          notas: i.notas.trim() || undefined
        })),
        subtotal,
        iva,
        total
      });

      // Generar enlace de WhatsApp y redirigir la pestaña ya abierta
      const mensaje = generarMensajeWA(
        ticketActual,
        cliente,
        carrito,
        orderType,
        mesa,
        direccion,
        subtotal,
        iva,
        total
      );
      const waUrl = `https://wa.me/${WA_NUMERO}?text=${encodeURIComponent(mensaje)}`;

      if (waWindow) {
        waWindow.location.href = waUrl;
      } else {
        // El navegador bloqueó incluso la pestaña en blanco (poco común);
        // como respaldo, navegamos en la misma pestaña.

        // eslint-disable-next-line react-hooks/immutability
        window.location.href = waUrl;
      }

      // Toast de éxito
      showToast(
        "success",
        `✓ Pedido #ORD-${ticketActual} registrado`,
        `Cliente: ${cliente.nombre.toUpperCase()} — Total: $${total.toFixed(2)}`
      );

      // Limpiar estado
      setCarrito([]);
      setCliente({ nombre: "", cedula: "", telefono: "" });
      setMesa("");
      setDireccion("");
      setBusqueda("");
    } catch (e: unknown) {
      // Si algo falla, cerramos la pestaña en blanco que abrimos preventivamente
      waWindow?.close();
      const msg = e instanceof Error ? e.message : "Error al procesar el pedido.";
      setErrorEnvio(msg);
      showToast("error", "Error al registrar el pedido", msg);
    } finally {
      setEnviando(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-background p-4 lg:p-6 gap-4 lg:gap-6 h-full min-h-[calc(100vh-64px)]">
      {/* ── Selector de pestaña para móviles ── */}
      <div className="flex lg:hidden bg-surface-container p-1 rounded-xl border border-outline-variant shrink-0 gap-1">
        <button
          onClick={() => setActiveMobileTab("catalog")}
          className={`flex-1 py-2.5 text-xs font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeMobileTab === "catalog"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface hover:bg-surface-container-high"
          }`}
        >
          🍔 Catálogo
        </button>
        <button
          onClick={() => setActiveMobileTab("cart")}
          className={`flex-1 py-2.5 text-xs font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-2 relative ${
            activeMobileTab === "cart"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface hover:bg-surface-container-high"
          }`}
        >
          🛒 Carrito ({carrito.reduce((acc, c) => acc + c.cantidad, 0)})
          {carrito.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-secondary-container text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-background animate-pulse">
              {carrito.reduce((acc, c) => acc + c.cantidad, 0)}
            </span>
          )}
        </button>
      </div>

      {/* ── Catálogo (izquierda) ── */}
      <section
        className={`flex-1 flex flex-col bg-surface-container border border-outline-variant rounded-xl overflow-hidden shadow-sm ${
          activeMobileTab === "catalog" ? "flex" : "hidden lg:flex"
        }`}
      >
        {/* Tabs de categorías */}
        <div className="flex border-b border-outline-variant bg-surface-container-highest overflow-x-auto shrink-0">
          {loadingProductos ? (
            <div className="flex-1 flex items-center justify-center py-4 text-on-surface-variant text-sm gap-2">
              <Loader2 size={18} className="animate-spin" /> Cargando catálogo...
            </div>
          ) : (
            categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`flex-shrink-0 px-6 py-4 text-sm font-bold transition-colors border-b-4 ${
                  categoriaActiva === cat
                    ? "text-primary border-secondary-container bg-surface"
                    : "text-on-surface-variant border-transparent hover:bg-surface-variant"
                }`}
              >
                {formatCategoriaLabel(cat)}
              </button>
            ))
          )}
        </div>
        {/* Barra de búsqueda */}
        <div className="px-4 py-2.5 border-b border-outline-variant bg-surface-container-low shrink-0">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
            />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar producto..."
              className="pl-9 pr-4 h-9 w-full bg-surface border border-outline-variant rounded-lg focus:border-secondary-container focus:ring-1 focus:ring-secondary-container/30 outline-none text-sm text-on-surface placeholder:text-outline transition-colors"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Grid de productos */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {errorProductos && (
            <div className="bg-error-container text-on-error-container p-4 rounded-lg flex items-center gap-3 border border-error text-sm">
              <AlertTriangle size={18} /> {errorProductos}
            </div>
          )}

          {!errorProductos && productosFiltrados.length === 0 && (
            <div className="text-center py-16 text-on-surface-variant text-sm">
              No se encontraron productos en esta categoría.
            </div>
          )}

          {!errorProductos && productosFiltrados.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {productosFiltrados.map(prod => (
                <button
                  key={prod.id_producto}
                  onClick={() => {
                    agregarAlCarrito(prod);
                    showToast("success", `Añadido: ${prod.nombre}`);
                  }}
                  disabled={!prod.disponible}
                  className={`bg-surface border border-outline-variant rounded-xl p-4 flex flex-col justify-between items-start text-left hover:shadow-md transition-all active:scale-[0.98] ${
                    !prod.disponible ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <div className="w-full">
                    <span className="bg-surface-container-high text-on-surface-variant text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wide">
                      {formatCategoriaLabel(prod.categoria)}
                    </span>
                    <h3 className="text-base font-bold text-on-surface mt-2 leading-tight">
                      {prod.nombre}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                      {prod.descripcion}
                    </p>
                  </div>
                  <div className="w-full flex justify-between items-center mt-4 pt-3 border-t border-surface-dim">
                    <span className="font-mono text-xl font-black text-secondary-container">
                      ${prod.precio.toFixed(2)}
                    </span>
                    <span
                      className={`text-xs font-bold ${prod.disponible ? "text-emerald-600" : "text-error"}`}
                    >
                      {prod.disponible ? "Disponible" : "Agotado"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Carrito y Cliente (derecha) ── */}
      <aside
        className={`w-full lg:w-[420px] flex flex-col bg-surface-container border border-outline-variant rounded-xl overflow-hidden shadow-sm shrink-0 ${
          activeMobileTab === "cart" ? "flex" : "hidden lg:flex"
        }`}
      >
        {/* Info del Cliente */}
        <div className="p-4 border-b border-outline-variant bg-surface shrink-0">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-2">
            Datos del Cliente
          </label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={cliente.cedula}
                  onChange={e => setCliente(c => ({ ...c, cedula: e.target.value }))}
                  placeholder="Cédula/RIF"
                  className="industrial-input font-mono uppercase"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={cliente.telefono}
                  onChange={e => setCliente(c => ({ ...c, telefono: e.target.value }))}
                  placeholder="Teléfono"
                  className="industrial-input font-mono"
                />
              </div>
            </div>
            <div>
              <input
                type="text"
                value={cliente.nombre}
                onChange={e => setCliente(c => ({ ...c, nombre: e.target.value }))}
                placeholder="EJ. JUAN PEREZ"
                className="industrial-input uppercase"
              />
            </div>
          </div>

          {/* Selector de tipo de pedido */}
          <div className="mt-4">
            <div className="flex gap-2 bg-surface-dim p-1 rounded-lg">
              {(["mesa", "pickup", "delivery"] as const).map(tipo => (
                <button
                  key={tipo}
                  onClick={() => setOrderType(tipo)}
                  className={`flex-1 h-10 text-xs font-bold uppercase rounded transition-all flex items-center justify-center gap-1 ${
                    orderType === tipo
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-transparent text-on-surface hover:bg-surface"
                  }`}
                >
                  {tipo === "mesa" ? "Mesa" : tipo === "pickup" ? "Llevar" : "Delivery"}
                </button>
              ))}
            </div>

            {/* Campos dinámicos por tipo */}
            <div className="mt-3 min-h-[52px]">
              {orderType === "mesa" && (
                <div className="flex gap-3">
                  <div className="w-20">
                    <input
                      type="number"
                      value={mesa}
                      onChange={e => setMesa(e.target.value)}
                      placeholder="Mesa"
                      className="industrial-input text-center font-bold"
                      min={1}
                    />
                  </div>
                  <div className="flex-1 flex items-center gap-2 text-xs text-on-surface-variant font-medium">
                    <Info size={14} className="shrink-0" />
                    <span>Ingrese el número de la mesa asignada.</span>
                  </div>
                </div>
              )}

              {orderType === "pickup" && (
                <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium py-3">
                  <Info size={14} className="shrink-0" />
                  <span>El cliente retirará el pedido por el local.</span>
                </div>
              )}

              {orderType === "delivery" && (
                <div>
                  <input
                    type="text"
                    value={direccion}
                    onChange={e => setDireccion(e.target.value)}
                    placeholder="Dirección detallada de entrega"
                    className="industrial-input"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lista de productos en carrito */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {carrito.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-on-surface-variant py-12">
              <ShoppingBag size={36} className="opacity-40 mb-2" />
              <p className="text-sm font-semibold">El carrito está vacío</p>
              <p className="text-xs mt-1">
                Selecciona productos a la izquierda para agregarlos.
              </p>
            </div>
          ) : (
            carrito.map(item => (
              <div
                key={item.producto.id_producto}
                className="bg-surface border border-outline-variant rounded-xl p-3 flex flex-col gap-2 relative shadow-sm hover:shadow transition-shadow"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide block">
                      {formatCategoriaLabel(item.producto.categoria)}
                    </span>
                    <h4 className="text-sm font-black text-on-surface mt-0.5 leading-snug">
                      {item.producto.nombre}
                    </h4>
                  </div>
                  <button
                    onClick={() => eliminarItem(item.producto.id_producto)}
                    className="text-on-surface-variant hover:text-error transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Notas del item */}
                <div>
                  <input
                    type="text"
                    value={item.notas}
                    onChange={e =>
                      actualizarNotas(item.producto.id_producto, e.target.value)
                    }
                    placeholder="Notas especiales (ej. sin cebolla)"
                    className="w-full text-xs bg-surface-container border-b border-outline outline-none py-1 focus:border-secondary-container transition-colors placeholder:text-outline/60 text-on-surface"
                  />
                </div>

                <div className="flex justify-between items-center mt-1 pt-2 border-t border-surface-dim">
                  <div className="flex items-center gap-1 bg-surface-container rounded-lg border border-outline-variant p-0.5">
                    <button
                      onClick={() => cambiarCantidad(item.producto.id_producto, -1)}
                      className="w-7 h-7 flex items-center justify-center text-on-surface hover:bg-surface rounded-md transition-colors"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-8 text-center font-mono text-sm font-bold text-primary">
                      {item.cantidad}
                    </span>
                    <button
                      onClick={() => cambiarCantidad(item.producto.id_producto, 1)}
                      className="w-7 h-7 flex items-center justify-center text-on-surface hover:bg-surface rounded-md transition-colors"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <span className="font-mono text-base font-bold text-secondary-container">
                    ${(item.producto.precio * item.cantidad).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totales y botón de confirmación */}
        <div className="p-4 border-t border-outline-variant bg-surface space-y-3 shrink-0">
          <div className="space-y-1.5 text-xs border-b border-surface-dim pb-3">
            <div className="flex justify-between text-on-surface-variant">
              <span>Subtotal</span>
              <span className="font-mono font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>IVA (16%)</span>
              <span className="font-mono font-medium">${iva.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-lg uppercase text-primary font-black">
              Total a Pagar
            </span>
            <span className="font-mono text-3xl text-secondary-container leading-none font-black">
              ${total.toFixed(2)}
            </span>
          </div>

          {errorEnvio && (
            <div className="bg-error-container text-on-error-container p-3 rounded-lg flex items-center gap-2 border border-error text-xs font-semibold">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{errorEnvio}</span>
            </div>
          )}

          <button
            onClick={procesarPedido}
            disabled={enviando || carrito.length === 0}
            className="w-full h-12 bg-secondary-container text-on-secondary-container text-sm font-black uppercase rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {enviando ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {enviando ? "Procesando..." : "Confirmar Pedido"}
          </button>

          {carrito.length > 0 && !enviando && (
            <p className="text-center text-xs text-on-surface-variant flex items-center justify-center gap-1">
              <MessageCircle size={12} /> Se abrirá un enlace de WhatsApp al confirmar
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
