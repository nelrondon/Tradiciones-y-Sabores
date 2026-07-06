import { useState, useEffect } from 'react';
import {
  UserPlus, Timer, Armchair, ShoppingBag, Bike, Info,
  Trash2, Send, Plus, Minus, Loader2, AlertTriangle, MessageCircle, Search, Printer,
} from 'lucide-react';
import { api, type Producto } from '../api';
import { useToast } from '../components/Toast';

// ── Constantes ────────────────────────────────────────────────────────────────

const IVA_RATE = 0.16;

/** Número WhatsApp del restaurante, configurable en .env.local */
const WA_NUMERO = import.meta.env.VITE_WHATSAPP_NUMERO ?? '584140000000';

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

let ticketCounter = 9000 + Math.floor(Math.random() * 999);
function nuevoTicketId() {
  return ++ticketCounter;
}

function generarMensajeWA(
  ticketId: number,
  cliente: InfoCliente,
  carrito: ItemCarrito[],
  orderType: 'mesa' | 'pickup' | 'delivery',
  mesa: string,
  direccion: string,
  subtotal: number,
  iva: number,
  total: number
): string {
  const tipoLabel =
    orderType === 'mesa'
      ? `🪑 Mesa ${mesa}`
      : orderType === 'pickup'
      ? '🛍️ Para Llevar'
      : `🛵 Delivery: ${direccion}`;

  const items = carrito
    .map(
      (i) =>
        `• ${i.cantidad}x ${i.producto.nombre}` +
        (i.notas ? ` _(${i.notas.toUpperCase()})_` : '')
    )
    .join('\n');

  return (
    `🍔 *NUEVO PEDIDO #${ticketId}*\n\n` +
    `*Cliente:* ${cliente.nombre}\n` +
    `*Teléfono:* ${cliente.telefono || '—'}\n` +
    `*Cédula/RIF:* ${cliente.cedula || '—'}\n` +
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
  const [categoriaActiva, setCategoriaActiva] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Carrito
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);

  // Formulario de cliente
  const [cliente, setCliente] = useState<InfoCliente>({
    nombre: '',
    cedula: '',
    telefono: '',
  });

  // Tipo de pedido
  const [orderType, setOrderType] = useState<'mesa' | 'pickup' | 'delivery'>('mesa');
  const [mesa, setMesa] = useState('');
  const [direccion, setDireccion] = useState('');

  // Estado del envío
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [ticketActual] = useState(() => nuevoTicketId());

  // ── Fetch catálogo ──
  useEffect(() => {
    api.getProductos()
      .then((data) => {
        setProductos(data);
        if (data.length > 0) setCategoriaActiva(data[0].categoria);
      })
      .catch((e: Error) => setErrorProductos(e.message))
      .finally(() => setLoadingProductos(false));
  }, []);

  // ── Derivados ──
  const categorias = [...new Set(productos.map((p) => p.categoria))] as string[];
  const productosFiltrados = productos
    .filter((p) => p.categoria === categoriaActiva)
    .filter((p) =>
      busqueda === '' ||
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.descripcion ?? '').toLowerCase().includes(busqueda.toLowerCase())
    );
  const subtotal = carrito.reduce((s, i) => s + i.producto.precio * i.cantidad, 0);
  const iva = subtotal * IVA_RATE;
  const total = subtotal + iva;

  // ── Manejo del carrito ──
  const agregarAlCarrito = (producto: Producto) => {
    if (!producto.disponible) return;
    setCarrito((prev) => {
      const existe = prev.find((i) => i.producto.id_producto === producto.id_producto);
      if (existe)
        return prev.map((i) =>
          i.producto.id_producto === producto.id_producto
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        );
      return [...prev, { producto, cantidad: 1, notas: '' }];
    });
  };

  const cambiarCantidad = (id: number, delta: number) =>
    setCarrito((prev) =>
      prev
        .map((i) =>
          i.producto.id_producto === id ? { ...i, cantidad: i.cantidad + delta } : i
        )
        .filter((i) => i.cantidad > 0)
    );

  const actualizarNotas = (id: number, notas: string) =>
    setCarrito((prev) =>
      prev.map((i) => (i.producto.id_producto === id ? { ...i, notas } : i))
    );

  const eliminarItem = (id: number) =>
    setCarrito((prev) => prev.filter((i) => i.producto.id_producto !== id));

  // ── Procesar pedido ──
  const procesarPedido = async () => {
    setErrorEnvio(null);
    if (carrito.length === 0) { setErrorEnvio('El carrito está vacío.'); return; }
    if (!cliente.nombre.trim()) { setErrorEnvio('El nombre del cliente es requerido.'); return; }
    if (orderType === 'mesa' && !mesa) { setErrorEnvio('Ingrese el número de mesa.'); return; }
    if (orderType === 'delivery' && !direccion.trim()) { setErrorEnvio('Ingrese la dirección de envío.'); return; }

    setEnviando(true);
    try {
      await api.crearOrden({
        cliente_nombre: cliente.nombre.toUpperCase().trim(),
        cliente_cedula: cliente.cedula.trim() || undefined,
        cliente_telefono: cliente.telefono.trim() || undefined,
        tipo: orderType,
        mesa: orderType === 'mesa' ? Number(mesa) : undefined,
        direccion: orderType === 'delivery' ? direccion.trim() : undefined,
        items: carrito.map((i) => ({
          id_producto: i.producto.id_producto,
          nombre: i.producto.nombre,
          cantidad: i.cantidad,
          precio_unitario: i.producto.precio,
          notas: i.notas.trim() || undefined,
        })),
        subtotal,
        iva,
        total,
      });

      // Generar y abrir enlace de WhatsApp
      const mensaje = generarMensajeWA(
        ticketActual, cliente, carrito, orderType, mesa, direccion,
        subtotal, iva, total
      );
      window.open(`https://wa.me/${WA_NUMERO}?text=${encodeURIComponent(mensaje)}`, '_blank');

      // Toast de éxito
      showToast(
        'success',
        `✓ Pedido #ORD-${ticketActual} registrado`,
        `Cliente: ${cliente.nombre.toUpperCase()} — Total: $${total.toFixed(2)}`
      );

      // Limpiar estado
      setCarrito([]);
      setCliente({ nombre: '', cedula: '', telefono: '' });
      setMesa('');
      setDireccion('');
      setBusqueda('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al procesar el pedido.';
      setErrorEnvio(msg);
      showToast('error', 'Error al registrar el pedido', msg);
    } finally {
      setEnviando(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex bg-background p-6 gap-6 h-full min-h-[calc(100vh-64px)]">

      {/* ── Catálogo (izquierda) ── */}
      <section className="flex-1 flex flex-col bg-surface-container border border-outline-variant rounded-xl overflow-hidden shadow-sm">

        {/* Tabs de categorías */}
        <div className="flex border-b border-outline-variant bg-surface-container-highest overflow-x-auto shrink-0">
          {loadingProductos ? (
            <div className="flex-1 flex items-center justify-center py-4 text-on-surface-variant text-sm gap-2">
              <Loader2 size={18} className="animate-spin" /> Cargando catálogo...
            </div>
          ) : (
            categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`flex-shrink-0 px-6 py-4 text-sm font-bold transition-colors border-b-4 ${
                  categoriaActiva === cat
                    ? 'text-primary border-secondary-container bg-surface'
                    : 'text-on-surface-variant border-transparent hover:bg-surface-variant'
                }`}
              >
                {cat}
              </button>
            ))
          )}
        </div>
        {/* Barra de búsqueda */}
        <div className="px-4 py-2.5 border-b border-outline-variant bg-surface-container-low shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto..."
              className="pl-9 pr-4 h-9 w-full bg-surface border border-outline-variant rounded-lg focus:border-secondary-container focus:ring-1 focus:ring-secondary-container/30 outline-none text-sm text-on-surface placeholder:text-outline transition-colors"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Grid de productos */}
        <div className="flex-1 overflow-y-auto p-6">
          {errorProductos && (
            <div className="flex items-center gap-3 text-on-error-container bg-error-container border border-error p-4 rounded mb-4 text-sm">
              <AlertTriangle size={18} /> {errorProductos}
            </div>
          )}
          <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 content-start stagger">
            {productosFiltrados.map((producto) => {
              const inCart = carrito.find(i => i.producto.id_producto === producto.id_producto);
              return (
                <article
                  key={producto.id_producto}
                  onClick={() => agregarAlCarrito(producto)}
                  className={`fade-in-up bg-surface border rounded-lg p-3 flex flex-col gap-3 transition-all duration-150 ${
                    producto.disponible
                      ? 'border-outline-variant hover:border-secondary-container hover:shadow-md cursor-pointer group'
                      : 'border-outline-variant opacity-50 grayscale cursor-not-allowed'
                  } ${inCart ? 'border-secondary-container ring-2 ring-secondary-container/20' : ''}`}
                >
                  <div className="aspect-square bg-surface-variant rounded overflow-hidden relative">
                    {producto.imagen_url ? (
                      <img
                        src={producto.imagen_url}
                        alt={producto.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl select-none">
                        🍔
                      </div>
                    )}
                    {!producto.disponible && (
                      <span className="absolute inset-0 bg-surface/70 flex items-center justify-center text-xs font-black text-error uppercase tracking-widest backdrop-blur-sm z-10">
                        Agotado
                      </span>
                    )}
                    {inCart && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-secondary-container text-white flex items-center justify-center text-xs font-black shadow-md">
                        {inCart.cantidad}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1">
                    <h3 className="text-base font-bold text-on-surface leading-tight">
                      {producto.nombre}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                      {producto.descripcion}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-surface-variant">
                    <span className="font-mono text-lg font-bold text-primary">
                      ${producto.precio.toFixed(2)}
                    </span>
                    {producto.disponible && (
                      <div className="w-8 h-8 rounded bg-primary text-on-primary flex items-center justify-center group-hover:bg-secondary-container group-hover:text-on-secondary-container transition-colors active:scale-95">
                        <Plus size={18} />
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Panel derecho: Formulario + Carrito ── */}
      <aside className="w-[460px] flex flex-col gap-4 shrink-0">

        {/* Datos del cliente */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 flex flex-col gap-3 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
          <h2 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wide border-b border-outline-variant pb-2">
            <UserPlus size={16} /> Registro de Cliente
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">Cédula / RIF</label>
              <input
                value={cliente.cedula}
                onChange={(e) => setCliente((p) => ({ ...p, cedula: e.target.value }))}
                type="text"
                placeholder="V-12345678"
                className="industrial-input font-mono text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">Teléfono</label>
              <input
                value={cliente.telefono}
                onChange={(e) => setCliente((p) => ({ ...p, telefono: e.target.value }))}
                type="tel"
                placeholder="0414-0000000"
                className="industrial-input font-mono text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">
                Nombre del Cliente <span className="text-error">*</span>
              </label>
              <input
                value={cliente.nombre}
                onChange={(e) => setCliente((p) => ({ ...p, nombre: e.target.value }))}
                type="text"
                placeholder="EJ. JUAN PEREZ"
                className="industrial-input uppercase"
              />
            </div>
          </div>
        </div>

        {/* Carrito + Tipo de pedido */}
        <div className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl flex flex-col shadow-sm relative overflow-hidden min-h-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-secondary-container" />

          {/* Header del ticket */}
          <div className="p-4 border-b border-outline-variant bg-surface flex justify-between items-center shrink-0 mt-1">
            <div>
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block">ID Ticket</span>
              <span className="font-mono text-2xl font-black text-primary leading-none mt-0.5 block">
                #ORD-{ticketActual}
              </span>
            </div>
            <div className="bg-primary text-on-primary px-3 py-1.5 rounded font-mono text-sm flex items-center gap-2">
              <Timer size={16} />
              {carrito.length} ítem{carrito.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Selector de tipo de pedido */}
          <div className="p-4 border-b border-outline-variant bg-surface-container-highest shrink-0">
            <label className="text-xs font-bold text-on-surface-variant uppercase mb-2 block">Tipo de Pedido</label>
            <div className="flex gap-2 bg-surface-dim p-1 rounded-lg">
              {(['mesa', 'pickup', 'delivery'] as const).map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setOrderType(tipo)}
                  className={`flex-1 h-10 text-xs font-bold uppercase rounded transition-all flex items-center justify-center gap-1 ${
                    orderType === tipo
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-transparent text-on-surface hover:bg-surface'
                  }`}
                >
                  {tipo === 'mesa' && <Armchair size={15} />}
                  {tipo === 'pickup' && <ShoppingBag size={15} />}
                  {tipo === 'delivery' && <Bike size={15} />}
                  {tipo === 'mesa' ? 'Mesa' : tipo === 'pickup' ? 'Llevar' : 'Delivery'}
                </button>
              ))}
            </div>

            {/* Campos dinámicos por tipo */}
            <div className="mt-3 min-h-[52px]">
              {orderType === 'mesa' && (
                <div className="flex gap-3">
                  <input
                    value={mesa}
                    onChange={(e) => setMesa(e.target.value)}
                    type="number"
                    min="1"
                    placeholder="N°"
                    className="industrial-input font-mono text-xl w-20 text-center"
                  />
                  <div className="flex-1 text-xs font-semibold text-on-surface-variant bg-surface-container p-3 rounded border border-outline-variant flex items-center gap-2">
                    <Info size={15} className="shrink-0" />
                    Verifique disponibilidad antes de asignar.
                  </div>
                </div>
              )}
              {orderType === 'delivery' && (
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">Dirección de Envío</label>
                  <textarea
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    rows={2}
                    placeholder="Sector, Calle, Casa, Referencia..."
                    className="industrial-input h-auto py-2 resize-none text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Lista de ítems del carrito */}
          <div className="flex-1 overflow-y-auto p-3 bg-surface">
            {carrito.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-on-surface-variant text-center py-8 gap-2">
                <ShoppingBag size={40} className="opacity-20" />
                <span className="text-sm font-bold">Carrito vacío</span>
                <span className="text-xs">Selecciona productos del catálogo</span>
              </div>
            ) : (
              carrito.map((item) => (
                <div
                  key={item.producto.id_producto}
                  className="bg-surface-container border border-outline-variant p-3 rounded mb-2 flex flex-col gap-2 fade-in"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-primary uppercase truncate flex-1 mr-2">
                      {item.producto.nombre}
                    </span>
                    <span className="font-mono font-bold text-sm shrink-0">
                      ${(item.producto.precio * item.cantidad).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => cambiarCantidad(item.producto.id_producto, -1)}
                        className="w-7 h-7 rounded bg-surface-dim border border-outline-variant flex items-center justify-center hover:bg-error-container hover:text-on-error-container transition-colors"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="font-mono font-bold w-5 text-center text-sm">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() => cambiarCantidad(item.producto.id_producto, 1)}
                        className="w-7 h-7 rounded bg-surface-dim border border-outline-variant flex items-center justify-center hover:bg-surface-variant transition-colors"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <button
                      onClick={() => eliminarItem(item.producto.id_producto)}
                      className="text-on-surface-variant hover:text-error text-xs flex items-center gap-1 font-bold transition-colors"
                    >
                      <Trash2 size={13} /> Quitar
                    </button>
                  </div>
                  <input
                    value={item.notas}
                    onChange={(e) => actualizarNotas(item.producto.id_producto, e.target.value)}
                    placeholder="Notas (ej: SIN CEBOLLA)"
                    className="text-xs border border-outline-variant rounded px-2 py-1 bg-surface-dim outline-none focus:border-secondary-container w-full"
                  />
                </div>
              ))
            )}
          </div>

          {/* Totales y botón de envío */}
          <div className="bg-surface-container-highest border-t border-outline-variant p-5 flex flex-col gap-3 shrink-0">
            {errorEnvio && (
              <div className="bg-error-container text-on-error-container text-xs font-bold px-3 py-2 rounded flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {errorEnvio}
              </div>
            )}
            <div className="flex justify-between text-on-surface-variant text-sm">
              <span className="font-bold uppercase">Subtotal</span>
              <span className="font-mono">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant text-sm border-b border-outline-variant pb-2">
              <span className="font-bold uppercase">IVA (16%)</span>
              <span className="font-mono">${iva.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-lg uppercase text-primary font-black">Total a Pagar</span>
              <span className="font-mono text-3xl text-secondary-container leading-none font-black">
                ${total.toFixed(2)}
              </span>
            </div>

            <button
              onClick={procesarPedido}
              disabled={enviando || carrito.length === 0}
              className="mt-2 w-full h-14 bg-secondary-container hover:bg-secondary active:bg-secondary-container active:scale-[0.98] transition-all text-on-secondary-container text-base font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-3 shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enviando ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <>
                  <Send size={20} /> Procesar Pedido
                </>
              )}
            </button>

            {/* Imprimir comanda */}
            {carrito.length > 0 && !enviando && (
              <button
                onClick={() => window.print()}
                className="w-full h-9 border border-outline-variant rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-variant flex items-center justify-center gap-2 transition-colors"
              >
                <Printer size={14} /> Imprimir comanda
              </button>
            )}

            {carrito.length > 0 && !enviando && (
              <p className="text-center text-xs text-on-surface-variant flex items-center justify-center gap-1">
                <MessageCircle size={12} /> Se abrirá un enlace de WhatsApp al confirmar
              </p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
