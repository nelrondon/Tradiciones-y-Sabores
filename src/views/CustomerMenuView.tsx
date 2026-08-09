import { useState, useEffect } from 'react';
import { 
  Utensils, ShoppingBag, Search, Sparkles, CheckCircle2, Clock, 
  MapPin, Phone, User, CreditCard, ChevronRight, X, Plus, Minus,
  Flame, Award, ArrowLeft, RefreshCw, AlertCircle
} from 'lucide-react';
import { api, Producto, Orden } from '../api';
import { useToast } from '../components/Toast';

const CATEGORIAS_DISPLAY = [
  { id: 'todos', label: 'Todo el Menú', icon: '🍽️' },
  { id: 'plato_principal', label: 'Platos Principales', icon: '🍔' },
  { id: 'entrada', label: 'Entradas & Tapas', icon: '🥟' },
  { id: 'acompañante', label: 'Acompañantes', icon: '🍟' },
  { id: 'postre', label: 'Postres', icon: '🍰' },
  { id: 'bebida', label: 'Bebidas & Jugos', icon: '🥤' }
];

function formatCategoriaLabel(cat: string): string {
  if (!cat) return 'General';
  const c = cat.toLowerCase().replace(/_/g, ' ');
  if (c === 'todos') return 'Todos';
  if (c === 'plato principal' || c === 'platos principales') return 'Platos Principales';
  if (c === 'bebida' || c === 'bebidas') return 'Bebidas & Jugos';
  if (c === 'postre' || c === 'postres') return 'Postres';
  if (c === 'adicional' || c === 'adicionales') return 'Adicionales';
  if (c === 'entrada' || c === 'entradas') return 'Entradas & Tapas';
  if (c === 'acompañante' || c === 'acompañantes') return 'Acompañantes';
  return c.charAt(0).toUpperCase() + c.slice(1);
}

interface CartItem {
  producto: Producto;
  cantidad: number;
  notas?: string;
}

interface CustomerMenuViewProps {
  onBack?: () => void;
}

export default function CustomerMenuView({ onBack }: CustomerMenuViewProps) {
  const toast = useToast();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  
  // Carrito de cliente
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Formulario de Pedido
  const [tipoPedido, setTipoPedido] = useState<'mesa' | 'pickup' | 'delivery'>('mesa');
  const [idMesa, setIdMesa] = useState<number>(1);
  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ticket activo / Seguimiento en vivo
  const [activeOrder, setActiveOrder] = useState<Orden | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Cargar catálogo de platos al iniciar
  useEffect(() => {
    loadPlatos();
  }, []);

  const loadPlatos = async () => {
    try {
      setLoading(true);
      const data = await api.getProductos();
      setProductos(data);
    } catch (err: any) {
      toast.showError('No se pudo cargar el menú digital: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Polling para el estado de la orden activa si existe
  useEffect(() => {
    if (!activeOrder) return;
    const interval = setInterval(async () => {
      try {
        const ticketId = activeOrder.num_ticket || activeOrder.id_pedido;
        const updated = await api.getOrdenPorId(ticketId);
        setActiveOrder(updated);
      } catch (e) {
        console.error("Error polling orden:", e);
      }
    }, 5000); // Polling cada 5 segundos

    return () => clearInterval(interval);
  }, [activeOrder]);

  const addToCart = (prod: Producto) => {
    setCart(prev => {
      const existing = prev.find(item => item.producto.id_producto === prod.id_producto);
      if (existing) {
        return prev.map(item =>
          item.producto.id_producto === prod.id_producto
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prev, { producto: prod, cantidad: 1 }];
    });
    toast.showSuccess(`¡${prod.nombre} añadido al pedido!`);
  };

  const updateQuantity = (idProd: number, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.producto.id_producto === idProd) {
            const newQty = item.cantidad + delta;
            return newQty > 0 ? { ...item, cantidad: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0);
  const cartIva = cartSubtotal * 0.16;
  const cartTotal = cartSubtotal + cartIva;
  const totalItemsCount = cart.reduce((acc, item) => acc + item.cantidad, 0);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.showError("Tu carrito está vacío");
      return;
    }
    if (!cedula.trim() || !nombre.trim() || !telefono.trim()) {
      toast.showError("Por favor completa tus datos (Cédula, Nombre y Teléfono)");
      return;
    }
    if (tipoPedido === 'delivery' && !direccion.trim()) {
      toast.showError("Indica la dirección para el delivery");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        tipo_pedido: tipoPedido,
        tipo: tipoPedido,
        id_mesa: tipoPedido === 'mesa' ? idMesa : null,
        mesa: tipoPedido === 'mesa' ? idMesa : null,
        cedula_cliente: cedula.trim(),
        cliente_cedula: cedula.trim(),
        cliente_nombre: nombre.trim(),
        cliente_telefono: telefono.trim(),
        direccion_envio: tipoPedido === 'delivery' ? direccion.trim() : null,
        direccion: tipoPedido === 'delivery' ? direccion.trim() : null,
        items: cart.map(item => ({
          id_plato: item.producto.id_plato || item.producto.id_producto,
          id_producto: item.producto.id_plato || item.producto.id_producto,
          nombre: item.producto.nombre,
          cantidad: item.cantidad,
          precio_unitario: item.producto.precio,
          subtotal: item.producto.precio * item.cantidad
        })),
        subtotal: cartSubtotal,
        iva: cartIva,
        total: cartTotal
      };

      const res = await api.crearOrden(payload);
      setActiveOrder(res);
      setCart([]);
      setIsCartOpen(false);
      toast.showSuccess("🎉 ¡Tu pedido ha sido enviado con éxito a la cocina!");
    } catch (err: any) {
      toast.showError("Error al procesar pedido: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCustomerLink = () => {
    const url = `${window.location.origin}/?view=customer`;
    navigator.clipboard.writeText(url);
    toast.showSuccess("¡Enlace para clientes copiado! Envíalo o ábrelo desde cualquier teléfono o tablet.");
  };

  const filteredProductos = productos.filter(p => {
    const matchesCategory = selectedCategory === 'todos' || p.categoria === selectedCategory;
    const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.descripcion?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface pb-24">
      {/* ── BANNER HEADER CLIENTE ── */}
      <header className="relative bg-gradient-to-r from-primary-dark via-primary to-amber-600 text-on-primary py-8 px-4 sm:px-8 shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
        <div className="relative max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-xl mb-3 border border-white/10 transition cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver al Panel POS
              </button>
            )}
            <div className="block" />
            <div className="inline-flex items-center gap-2 bg-amber-500/30 text-amber-200 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md mb-2 border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5" /> Menú Digital Autoservicio & Pantalla Cliente
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
              🍽️ Tradiciones y Sabores
            </h1>
            <p className="text-amber-100 text-sm mt-1 font-medium max-w-md">
              Explora nuestra carta gastronómica, haz tu pedido al instante y síguelo en vivo hasta tu mesa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={copyCustomerLink}
              title="Copiar enlace directo para abrir en cualquier teléfono, tablet o monitor externo"
              className="bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 backdrop-blur-md border border-white/20 transition cursor-pointer active:scale-95"
            >
              📲 Copiar Enlace Cliente
            </button>
            {activeOrder && (
              <button
                onClick={() => setIsCartOpen(false)}
                className="bg-surface-container-high/90 text-primary hover:bg-surface border border-primary/30 px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition"
              >
                <Clock className="w-4 h-4 animate-spin text-primary" />
                Seguimiento Orden #{activeOrder.num_ticket || activeOrder.id_pedido}
              </button>
            )}

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative bg-amber-400 text-amber-950 hover:bg-amber-300 font-extrabold px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2.5 transition transform active:scale-95"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Ver Carrito</span>
              {totalItemsCount > 0 && (
                <span className="bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded-full animate-bounce">
                  {totalItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── PANTALLA DE SEGUIMIENTO EN VIVO (Si hay orden activa) ── */}
      {activeOrder && (
        <section className="max-w-4xl mx-auto px-4 mt-6">
          <div className="bg-surface-container border-2 border-primary/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Orden en Tiempo Real</span>
                <h3 className="text-2xl font-black text-on-surface">Ticket #{activeOrder.num_ticket || activeOrder.id_pedido}</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Cliente: <span className="font-semibold text-on-surface">{activeOrder.cliente_nombre}</span> ({activeOrder.cliente_cedula})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveOrder(null)}
                  className="text-xs text-outline hover:text-on-surface px-3 py-1.5 rounded-lg border border-outline-variant transition"
                >
                  Cerrar Vista Ticket
                </button>
              </div>
            </div>

            {/* Barra de progreso de estado */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-on-surface-variant">Progreso de Preparación:</span>
                <span className="text-xs font-black text-primary capitalize">
                  {activeOrder.estado_orden || activeOrder.Estatus_Orden}
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-3.5 rounded-full overflow-hidden p-0.5">
                <div 
                  className="bg-gradient-to-r from-amber-500 via-primary to-emerald-500 h-full rounded-full transition-all duration-700"
                  style={{
                    width: (activeOrder.estado_orden?.toLowerCase() === 'recibido' || activeOrder.Estatus_Orden?.toLowerCase() === 'recibido') ? '33%' :
                           (activeOrder.estado_orden?.toLowerCase() === 'preparando' || activeOrder.Estatus_Orden?.toLowerCase() === 'preparando') ? '66%' : '100%'
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center mt-3 text-xs font-bold">
                <div className={(activeOrder.estado_orden?.toLowerCase() === 'recibido' || activeOrder.Estatus_Orden?.toLowerCase() === 'recibido') ? 'text-primary' : 'text-outline'}>
                  📌 1. Recibido
                </div>
                <div className={(activeOrder.estado_orden?.toLowerCase() === 'preparando' || activeOrder.Estatus_Orden?.toLowerCase() === 'preparando') ? 'text-amber-500' : 'text-outline'}>
                  🔥 2. En Cocina
                </div>
                <div className={(activeOrder.estado_orden?.toLowerCase() === 'listo' || activeOrder.Estatus_Orden?.toLowerCase() === 'listo') ? 'text-emerald-500' : 'text-outline'}>
                  ✅ 3. Listo / Despachado
                </div>
              </div>
            </div>

            {/* Resumen de items del ticket */}
            <div className="mt-5 bg-surface-container-low p-4 rounded-xl text-xs space-y-2 border border-outline-variant/20">
              <div className="font-bold text-on-surface border-b border-outline-variant/20 pb-1 flex justify-between">
                <span>Platos solicitados</span>
                <span>Total: ${activeOrder.total?.toFixed(2)}</span>
              </div>
              {activeOrder.items?.map((it, idx) => (
                <div key={idx} className="flex justify-between text-on-surface-variant">
                  <span>{it.cantidad}x {it.nombre}</span>
                  <span>${((it.precio_unitario || 0) * it.cantidad).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── BARRA DE BÚSQUEDA Y CATEGORÍAS ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 mt-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container p-4 rounded-2xl shadow-sm border border-outline-variant/30">
          {/* Input Búsqueda */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-outline" />
            <input
              type="text"
              placeholder="Buscar plato o ingrediente..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant/50 rounded-xl text-sm focus:outline-none focus:border-primary transition"
            />
          </div>

          {/* Selector de Categorías (Pills) */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {CATEGORIAS_DISPLAY.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-on-primary shadow-md scale-105'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── CATÁLOGO DE PLATOS ── */}
        <section className="mt-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-semibold text-on-surface-variant">Cargando menú exquisito...</p>
            </div>
          ) : filteredProductos.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant">
              <Utensils className="w-12 h-12 text-outline mx-auto mb-3" />
              <h3 className="text-lg font-bold text-on-surface">No se encontraron platos</h3>
              <p className="text-xs text-on-surface-variant mt-1">Intenta con otra categoría o término de búsqueda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProductos.map(prod => (
                <div
                  key={prod.id_producto}
                  className="bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/30 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  <div className="relative h-44 bg-gradient-to-br from-amber-500/10 via-primary/5 to-surface-container-highest flex items-center justify-center p-6 text-center">
                    <Utensils className="w-16 h-16 text-primary/20 group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute top-3 right-3 bg-surface/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-primary border border-primary/20 shadow-sm">
                      ${Number(prod.precio).toFixed(2)}
                    </div>
                    <div className="absolute top-3 left-3 bg-amber-500/20 text-amber-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md backdrop-blur-sm">
                      {formatCategoriaLabel(prod.categoria)}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                        {prod.nombre}
                      </h4>
                      <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-2 leading-relaxed">
                        {prod.descripcion || 'Deliciosa preparación artesanal elaborada con ingredientes frescos de primera calidad.'}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Disponible
                      </span>

                      <button
                        onClick={() => addToCart(prod)}
                        className="bg-primary text-on-primary hover:bg-primary-dark font-bold px-4 py-2 rounded-xl text-xs shadow-md flex items-center gap-1.5 transition transform active:scale-95"
                      >
                        <Plus className="w-4 h-4" /> Agregar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ── MODAL DE CARRITO & CHECKOUT ── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end transition-opacity">
          <div className="w-full max-w-lg bg-surface h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
            {/* Header Carrito */}
            <div className="p-6 bg-surface-container border-b border-outline-variant/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-on-surface">Tu Pedido</h3>
                  <p className="text-xs text-on-surface-variant">{totalItemsCount} ítems seleccionados</p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-outline hover:text-on-surface rounded-lg hover:bg-surface-container-high transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de Ítems */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-on-surface-variant">
                  <ShoppingBag className="w-12 h-12 mx-auto text-outline mb-3 opacity-50" />
                  <p className="font-bold">Tu carrito está vacío</p>
                  <p className="text-xs mt-1">Explora el menú y agrega tus platos favoritos.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div
                        key={item.producto.id_producto}
                        className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex items-center justify-between gap-3"
                      >
                        <div className="flex-1">
                          <h5 className="font-bold text-sm text-on-surface">{item.producto.nombre}</h5>
                          <p className="text-xs text-primary font-semibold mt-0.5">
                            ${Number(item.producto.precio).toFixed(2)} c/u
                          </p>
                        </div>

                        <div className="flex items-center gap-2 bg-surface p-1 rounded-lg border border-outline-variant/40">
                          <button
                            onClick={() => updateQuantity(item.producto.id_producto, -1)}
                            className="p-1 hover:bg-surface-container rounded text-outline"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold px-2">{item.cantidad}</span>
                          <button
                            onClick={() => updateQuantity(item.producto.id_producto, 1)}
                            className="p-1 hover:bg-surface-container rounded text-primary"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Formulario de Datos del Cliente */}
                  <form id="checkout-form" onSubmit={handleCreateOrder} className="mt-8 space-y-4 pt-6 border-t border-outline-variant/30">
                    <h4 className="text-xs font-black uppercase text-primary tracking-wider">Datos para la Entrega</h4>

                    {/* Selector Tipo de Pedido */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setTipoPedido('mesa')}
                        className={`py-2 rounded-xl text-xs font-bold transition ${
                          tipoPedido === 'mesa' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        🪑 En Mesa
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipoPedido('pickup')}
                        className={`py-2 rounded-xl text-xs font-bold transition ${
                          tipoPedido === 'pickup' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        🛍️ Pickup
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipoPedido('delivery')}
                        className={`py-2 rounded-xl text-xs font-bold transition ${
                          tipoPedido === 'delivery' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        🛵 Delivery
                      </button>
                    </div>

                    {tipoPedido === 'mesa' && (
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant block mb-1">Número de Mesa:</label>
                        <select
                          value={idMesa}
                          onChange={e => setIdMesa(Number(e.target.value))}
                          className="w-full p-2.5 bg-surface border border-outline-variant/50 rounded-xl text-sm"
                        >
                          <option value={1}>Mesa 1 (Terraza)</option>
                          <option value={2}>Mesa 2 (Terraza)</option>
                          <option value={3}>Mesa 3 (Salón Principal)</option>
                          <option value={4}>Mesa 4 (Salón Principal)</option>
                          <option value={5}>Mesa 5 (VIP)</option>
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant block mb-1">Cédula / RIF *</label>
                        <input
                          type="text"
                          required
                          placeholder="V-12345678"
                          value={cedula}
                          onChange={e => setCedula(e.target.value)}
                          className="w-full p-2.5 bg-surface border border-outline-variant/50 rounded-xl text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant block mb-1">Teléfono *</label>
                        <input
                          type="tel"
                          required
                          placeholder="0414-1234567"
                          value={telefono}
                          onChange={e => setTelefono(e.target.value)}
                          className="w-full p-2.5 bg-surface border border-outline-variant/50 rounded-xl text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-on-surface-variant block mb-1">Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Maria Delgado"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        className="w-full p-2.5 bg-surface border border-outline-variant/50 rounded-xl text-xs"
                      />
                    </div>

                    {tipoPedido === 'delivery' && (
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant block mb-1">Dirección de Entrega *</label>
                        <textarea
                          required
                          placeholder="Calle, Edificio, Apto..."
                          value={direccion}
                          onChange={e => setDireccion(e.target.value)}
                          className="w-full p-2.5 bg-surface border border-outline-variant/50 rounded-xl text-xs h-20"
                        />
                      </div>
                    )}
                  </form>
                </>
              )}
            </div>

            {/* Footer Total & Botón Enviar */}
            {cart.length > 0 && (
              <div className="p-6 bg-surface-container border-t border-outline-variant/30 space-y-4">
                <div className="space-y-1.5 text-xs text-on-surface-variant">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA (16%)</span>
                    <span>${cartIva.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-on-surface pt-2 border-t border-outline-variant/20">
                    <span>Total a Pagar</span>
                    <span className="text-primary">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-amber-500 to-primary text-on-primary font-black py-3.5 rounded-xl shadow-lg hover:brightness-110 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Confirmar y Enviar Pedido</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
