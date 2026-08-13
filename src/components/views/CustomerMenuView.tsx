"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Minus,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  User,
  Utensils,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { api, Orden, Plato } from "../../api";
import StaffAccessBar from "../ui/StaffAccessBar";
import { useToast } from "../ui/Toast";

const CATEGORIAS_DISPLAY = [
  { id: "todos", label: "Todo el Menú", icon: "🍽️" },
  { id: "plato_principal", label: "Platos Principales", icon: "🍔" },
  { id: "entrada", label: "Entradas & Tapas", icon: "🥟" },
  { id: "acompañante", label: "Acompañantes", icon: "🍟" },
  { id: "postre", label: "Postres", icon: "🍰" },
  { id: "bebida", label: "Bebidas & Jugos", icon: "🥤" }
];

function formatCategoriaLabel(cat: string): string {
  if (!cat) return "General";
  const c = cat.toLowerCase().replace(/_/g, " ");
  if (c === "todos") return "Todos";
  if (c === "plato principal" || c === "platos principales") return "Platos Principales";
  if (c === "bebida" || c === "bebidas") return "Bebidas & Jugos";
  if (c === "postre" || c === "postres") return "Postres";
  if (c === "adicional" || c === "adicionales") return "Adicionales";
  if (c === "entrada" || c === "entradas") return "Entradas & Tapas";
  if (c === "acompañante" || c === "acompañantes") return "Acompañantes";
  return c.charAt(0).toUpperCase() + c.slice(1);
}

interface CartItem {
  producto: Plato;
  cantidad: number;
  notas?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CustomerMenuViewProps {
  // Esta ventana es autónoma — no hay navegación hacia el sistema interno
}

export default function CustomerMenuView(_props: CustomerMenuViewProps) {
  const toast = useToast();
  const [productos, setProductos] = useState<Plato[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");

  // Carrito de cliente
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Formulario de Pedido
  const [tipoPedido, setTipoPedido] = useState<"mesa" | "pickup" | "delivery">("mesa");
  const [idMesa, setIdMesa] = useState<number>(1);
  const [cedula, setCedula] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ticket activo / Seguimiento en vivo
  const [activeOrder, setActiveOrder] = useState<Orden | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Consulta de pedidos por Cédula (Cliente)
  const [isSearchOrderOpen, setIsSearchOrderOpen] = useState(false);
  const [searchCedula, setSearchCedula] = useState("");
  const [foundOrders, setFoundOrders] = useState<Orden[]>([]);
  const [searchingOrders, setSearchingOrders] = useState(false);
  const [searchedYet, setSearchedYet] = useState(false);

  // Cargar catálogo de platos al iniciar
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadPlatos();
  }, []);

  const loadPlatos = async () => {
    try {
      setLoading(true);
      const data = await api.getPlatos();
      setProductos(data);
    } catch (err: any) {
      toast.showToast("error", "No se pudo cargar el menú digital: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Polling para el estado de la orden activa si existe
  useEffect(() => {
    if (!activeOrder) return;
    const interval = setInterval(async () => {
      try {
        // GET /ordenes/{id} espera el id_pedido, no el número de ticket.
        const updated = await api.getOrden(activeOrder.id_pedido);
        setActiveOrder(updated);
      } catch (e) {
        console.error("Error polling orden:", e);
      }
    }, 5000); // Polling cada 5 segundos

    return () => clearInterval(interval);
  }, [activeOrder]);

  const addToCart = (prod: Plato) => {
    setCart(prev => {
      const existing = prev.find(item => item.producto.id_plato === prod.id_plato);
      if (existing) {
        return prev.map(item =>
          item.producto.id_plato === prod.id_plato
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prev, { producto: prod, cantidad: 1 }];
    });
    toast.showToast("success", `¡${prod.nombre} añadido al pedido!`);
  };

  const updateQuantity = (idProd: number, delta: number) => {
    setCart(
      prev =>
        prev
          .map(item => {
            if (item.producto.id_plato === idProd) {
              const newQty = item.cantidad + delta;
              return newQty > 0 ? { ...item, cantidad: newQty } : null;
            }
            return item;
          })
          .filter(Boolean) as CartItem[]
    );
  };

  const cartSubtotal = cart.reduce(
    (acc, item) => acc + item.producto.precio * item.cantidad,
    0
  );
  const cartIva = cartSubtotal * 0.16;
  const cartTotal = cartSubtotal + cartIva;
  const totalItemsCount = cart.reduce((acc, item) => acc + item.cantidad, 0);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.showToast("error", "error", "Tu carrito está vacío");
      return;
    }
    if (!cedula.trim() || !nombre.trim() || !telefono.trim()) {
      toast.showToast(
        "error",
        "error",
        "Por favor completa tus datos (Cédula, Nombre y Teléfono)"
      );
      return;
    }
    if (tipoPedido === "delivery" && !direccion.trim()) {
      toast.showToast("error", "error", "Indica la dirección para el delivery");
      return;
    }

    try {
      setIsSubmitting(true);
      // El backend toma el nombre y el precio de cada ítem del menú y calcula
      // subtotal, IVA y total: solo enviamos cliente, tipo y líneas del pedido.
      const res = await api.crearOrden({
        tipo: tipoPedido,
        mesa: tipoPedido === "mesa" ? idMesa : null,
        direccion: tipoPedido === "delivery" ? direccion.trim() : null,
        cliente_cedula: cedula.trim(),
        cliente_nombre: nombre.trim(),
        cliente_telefono: telefono.trim(),
        items: cart.map(item => ({
          id_producto: item.producto.id_plato,
          cantidad: item.cantidad,
          notas: item.notas
        }))
      });
      setActiveOrder(res);
      setCart([]);
      setIsCartOpen(false);
      toast.showToast("error", "🎉 ¡Tu pedido ha sido enviado con éxito a la cocina!");
    } catch (err: any) {
      toast.showToast("error", "error", "Error al procesar pedido: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchOrderByCedula = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchCedula.trim()) {
      toast.showToast("error", "Por favor ingresa tu número de Cédula");
      return;
    }
    try {
      setSearchingOrders(true);
      setSearchedYet(true);
      const allOrders = await api.getOrdenes();
      const queryClean = searchCedula
        .trim()
        .toLowerCase()
        .replace(/[^0-9a-z]/g, "");
      const matched = allOrders.filter(o => {
        const c1 = (o.cliente_cedula ?? "").toLowerCase().replace(/[^0-9a-z]/g, "");
        return c1.includes(queryClean) || queryClean.includes(c1);
      });
      // Ordenar de más reciente a más antiguo
      matched.sort((a, b) => (b.id_pedido ?? 0) - (a.id_pedido ?? 0));
      setFoundOrders(matched);
      if (matched.length === 0) {
        toast.showToast("error", "No se encontraron pedidos registrados con esa Cédula.");
      }
    } catch (err: any) {
      toast.showToast("error", "Error al consultar pedidos: " + err.message);
    } finally {
      setSearchingOrders(false);
    }
  };

  const filteredProductos = productos.filter(p => {
    const matchesCategory =
      selectedCategory === "todos" || p.categoria === selectedCategory;
    const matchesSearch =
      p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface pb-24">
      {/* ── Acceso del personal al panel de gestión ── */}
      <StaffAccessBar />

      {/* ── HEADER CLIENTE — Solo el restaurante, nada del sistema interno ── */}
      <header className="relative bg-gradient-to-r from-primary-dark via-primary to-amber-600 text-on-primary py-8 px-4 sm:px-8 shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
        <div className="relative max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Branding del restaurante */}
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-amber-500/30 text-amber-200 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md mb-2 border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5" /> Menú Digital
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
              🍽️ Tradiciones y Sabores
            </h1>
            <p className="text-amber-100 text-sm mt-1 font-medium max-w-md">
              Explora nuestra carta, haz tu pedido y síguelo en vivo hasta tu mesa.
            </p>
          </div>

          {/* Botones del cliente: carrito, consulta por cédula y seguimiento de su orden */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setIsSearchOrderOpen(true);
                setSearchedYet(false);
                setFoundOrders([]);
              }}
              className="bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition backdrop-blur-md border border-white/20 text-sm active:scale-95 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Buscar mi Pedido</span>
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
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  Orden en Tiempo Real
                </span>
                <h3 className="text-2xl font-black text-on-surface">
                  Ticket #{activeOrder.num_ticket || activeOrder.id_pedido}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Cliente:{" "}
                  <span className="font-semibold text-on-surface">
                    {activeOrder.cliente_nombre}
                  </span>{" "}
                  ({activeOrder.cliente_cedula})
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
                <span className="text-xs font-bold text-on-surface-variant">
                  Progreso de Preparación:
                </span>
                <span className="text-xs font-black text-primary capitalize">
                  {activeOrder.Estatus_Orden}
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-3.5 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-amber-500 via-primary to-emerald-500 h-full rounded-full transition-all duration-700"
                  style={{
                    width:
                      activeOrder.Estatus_Orden === "recibido"
                        ? "33%"
                        : activeOrder.Estatus_Orden === "preparando"
                          ? "66%"
                          : "100%"
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center mt-3 text-xs font-bold">
                <div
                  className={
                    activeOrder.Estatus_Orden === "recibido"
                      ? "text-primary"
                      : "text-outline"
                  }
                >
                  📌 1. Recibido
                </div>
                <div
                  className={
                    activeOrder.Estatus_Orden === "preparando"
                      ? "text-amber-500"
                      : "text-outline"
                  }
                >
                  🔥 2. En Cocina
                </div>
                <div
                  className={
                    activeOrder.Estatus_Orden === "listo"
                      ? "text-emerald-500"
                      : "text-outline"
                  }
                >
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
                  <span>
                    {it.cantidad}x {it.nombre}
                  </span>
                  <span>${((it.precio_unitario || 0) * it.cantidad).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── BARRA DE BÚSQUEDA Y CATEGORÍAS ── */}
      <main className="mt-8">
        {/* La barra crece más allá del ancho del catálogo (72rem) hasta lo que
            dé la pantalla, para que las categorías quepan sin scroll cuando hay
            sitio. Si aun así no caben, `scroll-x` se encarga. */}
        <div className="mx-auto w-fit min-w-[min(72rem,100%)] max-w-full px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container p-4 rounded-2xl shadow-sm border border-outline-variant/30">
            {/* Input Búsqueda */}
            <div className="relative w-full sm:w-80 shrink-0">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-outline" />
              <input
                type="text"
                placeholder="Buscar plato o ingrediente..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant/50 rounded-xl text-sm focus:outline-none focus:border-primary transition"
              />
            </div>

            {/* Selector de Categorías (Pills) — barra de scroll horizontal visible.
                `min-w-0` es lo que permite que el contenedor flex se encoja y el
                scroll entre en juego también en escritorio. */}
            <div className="flex items-center gap-2 w-full sm:w-auto min-w-0 scroll-x">
              {CATEGORIAS_DISPLAY.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? "bg-primary text-on-primary shadow-md scale-105"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── CATÁLOGO DE PLATOS ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-8 mt-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-semibold text-on-surface-variant">
                Cargando menú exquisito...
              </p>
            </div>
          ) : filteredProductos.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant">
              <Utensils className="w-12 h-12 text-outline mx-auto mb-3" />
              <h3 className="text-lg font-bold text-on-surface">
                No se encontraron platos
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Intenta con otra categoría o término de búsqueda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProductos.map(prod => (
                <div
                  key={prod.id_plato}
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
                        {prod.descripcion ||
                          "Deliciosa preparación artesanal elaborada con ingredientes frescos de primera calidad."}
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
                  <p className="text-xs text-on-surface-variant">
                    {totalItemsCount} ítems seleccionados
                  </p>
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
                  <p className="text-xs mt-1">
                    Explora el menú y agrega tus platos favoritos.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div
                        key={item.producto.id_plato}
                        className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex items-center justify-between gap-3"
                      >
                        <div className="flex-1">
                          <h5 className="font-bold text-sm text-on-surface">
                            {item.producto.nombre}
                          </h5>
                          <p className="text-xs text-primary font-semibold mt-0.5">
                            ${Number(item.producto.precio).toFixed(2)} c/u
                          </p>
                        </div>

                        <div className="flex items-center gap-2 bg-surface p-1 rounded-lg border border-outline-variant/40">
                          <button
                            onClick={() => updateQuantity(item.producto.id_plato, -1)}
                            className="p-1 hover:bg-surface-container rounded text-outline"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold px-2">{item.cantidad}</span>
                          <button
                            onClick={() => updateQuantity(item.producto.id_plato, 1)}
                            className="p-1 hover:bg-surface-container rounded text-primary"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Formulario de Datos del Cliente */}
                  <form
                    id="checkout-form"
                    onSubmit={handleCreateOrder}
                    className="mt-8 space-y-4 pt-6 border-t border-outline-variant/30"
                  >
                    <h4 className="text-xs font-black uppercase text-primary tracking-wider">
                      Datos para la Entrega
                    </h4>

                    {/* Selector Tipo de Pedido */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setTipoPedido("mesa")}
                        className={`py-2 rounded-xl text-xs font-bold transition ${
                          tipoPedido === "mesa"
                            ? "bg-primary text-on-primary shadow-sm"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        🪑 En Mesa
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipoPedido("pickup")}
                        className={`py-2 rounded-xl text-xs font-bold transition ${
                          tipoPedido === "pickup"
                            ? "bg-primary text-on-primary shadow-sm"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        🛍️ Pickup
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipoPedido("delivery")}
                        className={`py-2 rounded-xl text-xs font-bold transition ${
                          tipoPedido === "delivery"
                            ? "bg-primary text-on-primary shadow-sm"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        🛵 Delivery
                      </button>
                    </div>

                    {tipoPedido === "mesa" && (
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant block mb-1">
                          Número de Mesa:
                        </label>
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
                        <label className="text-xs font-bold text-on-surface-variant block mb-1">
                          Cédula / RIF *
                        </label>
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
                        <label className="text-xs font-bold text-on-surface-variant block mb-1">
                          Teléfono *
                        </label>
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
                      <label className="text-xs font-bold text-on-surface-variant block mb-1">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Maria Delgado"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        className="w-full p-2.5 bg-surface border border-outline-variant/50 rounded-xl text-xs"
                      />
                    </div>

                    {tipoPedido === "delivery" && (
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant block mb-1">
                          Dirección de Entrega *
                        </label>
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

      {/* ── MODAL: CONSULTAR PEDIDOS POR CÉDULA DE CLIENTE ── */}
      {isSearchOrderOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fadeIn">
          <div className="bg-surface border border-outline-variant/40 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="p-6 bg-gradient-to-r from-primary via-primary-dark to-amber-700 text-on-primary flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center border border-amber-300/30 text-amber-200">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">
                    Consultar Estado de Pedidos
                  </h3>
                  <p className="text-xs text-amber-100/90 font-medium">
                    Ingresa tu Cédula para ver tus órdenes en tiempo real
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSearchOrderOpen(false)}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulario de búsqueda */}
            <div className="p-6 bg-surface-container-low border-b border-outline-variant/30">
              <form onSubmit={handleSearchOrderByCedula} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ej. V-12345678 o 12345678"
                  value={searchCedula}
                  onChange={e => setSearchCedula(e.target.value)}
                  className="flex-1 px-4 py-3 bg-surface border border-outline-variant rounded-xl text-sm font-semibold text-on-surface focus:border-secondary-container focus:ring-1 focus:ring-secondary-container outline-none"
                />
                <button
                  type="submit"
                  disabled={searchingOrders}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-5 py-3 rounded-xl shadow transition flex items-center gap-2 text-sm disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {searchingOrders ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Buscar</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Resultados de búsqueda */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {!searchedYet && (
                <div className="text-center py-8 text-on-surface-variant">
                  <User className="w-12 h-12 mx-auto text-outline mb-2 opacity-60" />
                  <p className="text-sm font-bold">
                    Ingresa tu Cédula arriba para consultar tus pedidos
                  </p>
                  <p className="text-xs text-outline mt-1">
                    Podrás ver el estado en vivo (Recibido, En Cocina, Listo, Entregado)
                  </p>
                </div>
              )}

              {searchedYet && searchingOrders && (
                <div className="text-center py-8 text-on-surface-variant flex flex-col items-center gap-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-amber-600" />
                  <p className="text-sm font-bold">
                    Buscando tus pedidos en el sistema...
                  </p>
                </div>
              )}

              {searchedYet && !searchingOrders && foundOrders.length === 0 && (
                <div className="text-center py-8 bg-amber-50/50 border border-amber-200/60 rounded-2xl p-6">
                  <AlertCircle className="w-10 h-10 mx-auto text-amber-600 mb-2" />
                  <h4 className="font-bold text-on-surface text-sm">
                    No encontramos pedidos con esa Cédula
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Verifica los dígitos e intenta nuevamente o consulta en caja.
                  </p>
                </div>
              )}

              {searchedYet && !searchingOrders && foundOrders.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Pedidos Encontrados ({foundOrders.length}):
                  </div>
                  {foundOrders.map(o => {
                    const estatus = (o.Estatus_Orden || "recibido").toLowerCase();
                    let badgeBg = "bg-blue-100 text-blue-800 border-blue-300";
                    let badgeIcon = "🟦";
                    let badgeLabel = "Recibido";

                    if (estatus.includes("preparando") || estatus.includes("cocina")) {
                      badgeBg = "bg-amber-100 text-amber-900 border-amber-300";
                      badgeIcon = "🟨";
                      badgeLabel = "En Cocina / Preparando";
                    } else if (estatus.includes("listo")) {
                      badgeBg = "bg-emerald-100 text-emerald-900 border-emerald-300";
                      badgeIcon = "🟩";
                      badgeLabel = "¡Listo!";
                    } else if (estatus.includes("entregado")) {
                      badgeBg = "bg-gray-100 text-gray-800 border-gray-300";
                      badgeIcon = "⬛";
                      badgeLabel = "Entregado";
                    } else if (estatus.includes("cancelado")) {
                      badgeBg = "bg-red-100 text-red-800 border-red-300";
                      badgeIcon = "🟥";
                      badgeLabel = "Cancelado";
                    }

                    return (
                      <div
                        key={o.id_pedido}
                        className="bg-surface border border-outline-variant/40 rounded-2xl p-4 shadow-sm hover:border-amber-400 transition"
                      >
                        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2 mb-3">
                          <div>
                            <span className="text-xs font-bold text-on-surface-variant">
                              Ticket
                            </span>
                            <h4 className="font-black text-on-surface text-base">
                              #{o.num_ticket || o.id_pedido}
                            </h4>
                          </div>
                          <span
                            className={`text-xs font-extrabold px-3 py-1 rounded-full border flex items-center gap-1 ${badgeBg}`}
                          >
                            <span>{badgeIcon}</span>
                            <span>{badgeLabel}</span>
                          </span>
                        </div>

                        <div className="text-xs text-on-surface-variant space-y-1 mb-3">
                          <p>
                            <span className="font-semibold text-on-surface">Tipo:</span>{" "}
                            {o.tipo === "mesa"
                              ? `Mesa #${o.mesa ?? 1}`
                              : o.tipo === "delivery"
                                ? "Delivery"
                                : "Para Llevar"}
                          </p>
                          <p>
                            <span className="font-semibold text-on-surface">Total:</span>{" "}
                            <span className="font-black text-primary text-sm">
                              ${Number(o.total || 0).toFixed(2)}
                            </span>
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setActiveOrder(o);
                            setIsSearchOrderOpen(false);
                          }}
                          className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 font-bold py-2 rounded-xl text-xs transition border border-amber-300/40 flex items-center justify-center gap-1 cursor-pointer active:scale-98"
                        >
                          <span>Ver Seguimiento en Vivo</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
