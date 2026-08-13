/**
 * Tradiciones y Sabores — Capa de API
 *
 * Cliente tipado de la API del equipo de BD (restaurant-bd-tdb). Todos los tipos
 * de este archivo son un reflejo directo del contrato publicado por el backend en
 * `/swagger/json`; si el contrato cambia, este archivo es lo único que hay que tocar.
 *
 * Base URL: <NEXT_PUBLIC_API_URL>/api/v1
 * Auth: cabecera `x-api-key` en todas las rutas EXCEPTO /ordenes, que es pública
 *       (la usa el menú digital del cliente desde su propio teléfono).
 */

const BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";
const API_ROOT = `${BASE}/api/v1`;

// ─────────────────────────────────────────────────────────────
// TIPOS — Enumeraciones
// ─────────────────────────────────────────────────────────────

/** Flujo de una orden: recibido → preparando → listo → entregado. */
export type EstatusOrden =
  | "recibido"
  | "preparando"
  | "listo"
  | "entregado"
  | "cancelado";

export type TipoOrden = "mesa" | "pickup" | "delivery";

export type CategoriaPlato =
  | "entrada"
  | "plato_principal"
  | "postre"
  | "bebida"
  | "acompañante";

export type EstadoMesa = "disponible" | "ocupada" | "reservada" | "fuera_de_servicio";

export type EstadoPago = "pendiente" | "pagado" | "anulado";

/** Estado de envío de una orden de compra a proveedor (reportes). */
export type EstadoPedidoProveedor = "En Proceso" | "En camino" | "Recibido";

// ─────────────────────────────────────────────────────────────
// TIPOS — Recursos
// ─────────────────────────────────────────────────────────────

export interface OrdenItem {
  id_producto: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  notas?: string | null;
}

export interface Orden {
  id_pedido: number;
  num_ticket: number;
  hora_creacion: string;
  cliente_nombre: string;
  cliente_cedula: string;
  cliente_telefono: string;
  tipo: TipoOrden;
  /** Solo aplica cuando `tipo` es "mesa". */
  mesa: number | null;
  /** Cadena vacía cuando la orden no es de tipo "delivery". */
  direccion: string;
  /** Suma de los subtotales de los ítems. */
  subtotal: number;
  /** 16% aplicado sobre el subtotal. */
  iva: number;
  total: number;
  Estatus_Orden: EstatusOrden;
  items: OrdenItem[];
}

export interface CrearOrdenItemInput {
  id_producto: number;
  cantidad: number;
  notas?: string | null;
}

export interface CrearOrdenInput {
  cliente_nombre: string;
  cliente_cedula: string;
  cliente_telefono: string;
  tipo: TipoOrden;
  /** Obligatorio si `tipo` es "mesa". */
  mesa?: number | null;
  /** Obligatoria si `tipo` es "delivery". */
  direccion?: string | null;
  /** Mínimo un ítem, y no puede repetirse el mismo `id_producto` en dos líneas. */
  items: CrearOrdenItemInput[];
}

export interface Plato {
  id_plato: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: CategoriaPlato;
  /** No está en el schema del swagger, pero la API sí lo devuelve. */
  imagen_url: string | null;
  /** No está en el schema del swagger, pero la API sí lo devuelve. */
  disponible: boolean;
}

export interface PlatoInput {
  nombre: string;
  descripcion: string;
  /** Debe ser mayor a 0. */
  precio: number;
  categoria: CategoriaPlato;
}

export interface Mesa {
  id_mesa: number;
  capacidad: number;
  estado: EstadoMesa;
  ubicacion: string;
}

export interface MesaInput {
  /** Entero mayor a 0. */
  capacidad: number;
  estado: EstadoMesa;
  ubicacion: string;
}

export interface Insumo {
  id_insumos: number;
  nombre_insumo: string;
  stock_actual: number;
  unidad_medida: string;
  stock_minimo: number;
  punto_reorden: number;
  fk_id_categoria: number;
}

export interface InsumoInput {
  nombre_insumo: string;
  stock_actual: number;
  unidad_medida: string;
  stock_minimo?: number;
  punto_reorden?: number;
}

export interface Proveedor {
  id_proveedor: number;
  nombre_empresa: string;
  identificacion_rif: string;
  ciudad: string;
  telefono_empresa: string;
  email_empresa: string;
  direccion: string;
  nombre_encargado: string;
}

export type ProveedorInput = Omit<Proveedor, "id_proveedor">;

export interface Factura {
  num_factura: number;
  num_ticket: number;
  fecha_emision: string;
  subtotal: number;
  impuesto: number;
  total: number;
  estado_pago: EstadoPago;
  metodo_pago: string | null;
}

export interface FacturaInput {
  num_ticket: number;
  metodo_pago?: string;
}

export interface Cliente {
  cedula_cliente: string;
  nombre: string;
  telefono: string;
  email: string | null;
  direccion_habitual: string | null;
}

export interface ClienteInput {
  cedula_cliente: string;
  nombre: string;
  telefono: string;
  email?: string;
  direccion_habitual?: string;
}

export interface ReporteResumen {
  total_pedidos: number;
  /** Suma total gastada en compras a proveedores. */
  ingresos_brutos: number;
  tiempo_promedio_seg: number;
  pct_cambio_pedidos: number;
  pct_cambio_ingresos: number;
}

/** Fila del histórico de órdenes de compra a proveedores (GET /reportes/pedidos). */
export interface ReportePedidoItem {
  id_pedido: number;
  num_ticket: number;
  hora_creacion: string;
  /** Nombre del proveedor al que se le compró. */
  cliente_nombre: string;
  tipo: string;
  total: number;
  Estatus_Orden: EstadoPedidoProveedor;
}

export interface ApiMetadatos {
  name: string;
  version: string;
}

// ─────────────────────────────────────────────────────────────
// TIPOS — Respuestas envueltas
// ─────────────────────────────────────────────────────────────

export interface MensajeResponse {
  message: string;
}

/** Las rutas de creación de Platos y Mesas responden { message, data }. */
interface ConDatos<T> extends MensajeResponse {
  data: T;
}

/**
 * Devuelve el recurso tanto si la ruta lo envuelve en { message, data } como si
 * responde el objeto pelado. Se usa en las rutas cuyo cuerpo de respuesta no está
 * documentado en el swagger.
 */
function desenvolver<T>(respuesta: T | ConDatos<T>): T {
  if (respuesta && typeof respuesta === "object" && "data" in respuesta) {
    return (respuesta as ConDatos<T>).data;
  }
  return respuesta as T;
}

export interface ActualizarEstatusOrdenResponse extends MensajeResponse {
  id_pedido: number;
  Estatus_Orden: EstatusOrden;
}

// ─────────────────────────────────────────────────────────────
// CLIENTE HTTP
// ─────────────────────────────────────────────────────────────

/**
 * Error de la API con el status y el cuerpo crudo, para que las vistas puedan
 * distinguir casos concretos (409 de conflicto, 404, etc.) sin parsear strings.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/** Formas de error que devuelve el backend, según la ruta. */
interface CuerpoDeError {
  message?: string;
  error?: string;
  errors?: { msg?: string; path?: string }[];
}

/** Extrae el mensaje legible de cualquiera de las tres formas de error. */
function mensajeDeError(cuerpo: unknown, status: number): string {
  const e = (cuerpo ?? {}) as CuerpoDeError;

  if (Array.isArray(e.errors)) {
    const detalle = e.errors
      .map(v => v?.msg)
      .filter(Boolean)
      .join(" · ");
    if (detalle) return detalle;
  }

  return e.message || e.error || `La API respondió con un error (HTTP ${status})`;
}

// ─────────────────────────────────────────────────────────────
// NORMALIZACIÓN NUMÉRICA
// El driver de MySQL serializa las columnas DECIMAL como string ("3500.00"),
// así que los campos numéricos se convierten al entrar y los tipos de arriba
// siguen siendo ciertos en tiempo de ejecución (`precio.toFixed()` no revienta).
// ─────────────────────────────────────────────────────────────

function aNumero(valor: unknown): number {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

const normalizarPlato = (p: Plato): Plato => ({ ...p, precio: aNumero(p.precio) });

const normalizarInsumo = (i: Insumo): Insumo => ({
  ...i,
  stock_actual: aNumero(i.stock_actual),
  stock_minimo: aNumero(i.stock_minimo),
  punto_reorden: aNumero(i.punto_reorden)
});

const normalizarOrden = (o: Orden): Orden => ({
  ...o,
  subtotal: aNumero(o.subtotal),
  iva: aNumero(o.iva),
  total: aNumero(o.total),
  items: (o.items ?? []).map(item => ({
    ...item,
    precio_unitario: aNumero(item.precio_unitario),
    subtotal: aNumero(item.subtotal)
  }))
});

const normalizarFactura = (f: Factura): Factura => ({
  ...f,
  subtotal: aNumero(f.subtotal),
  impuesto: aNumero(f.impuesto),
  total: aNumero(f.total)
});

type Metodo = "GET" | "POST" | "PUT" | "DELETE";

interface OpcionesRequest {
  method?: Metodo;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** Las rutas de /ordenes no llevan API key. */
  publica?: boolean;
}

function construirUrl(
  path: string,
  query?: Record<string, string | number | undefined>
): string {
  const url = `${API_ROOT}${path}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(query)) {
    if (valor !== undefined && valor !== "") params.set(clave, String(valor));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function request<T>(path: string, opciones: OpcionesRequest = {}): Promise<T> {
  const { method = "GET", body, query, publica = false } = opciones;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (!publica) headers["x-api-key"] = API_KEY;

  let response: Response;
  try {
    response = await fetch(construirUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch (error: unknown) {
    const detalle = error instanceof Error ? error.message : "Error de red";
    throw new ApiError(`No se pudo contactar con la API (${detalle})`, 0, null);
  }

  // Algunas respuestas (y varios errores de infraestructura) no traen JSON.
  const texto = await response.text();
  let json: unknown = null;
  if (texto) {
    try {
      json = JSON.parse(texto);
    } catch {
      if (!response.ok) {
        throw new ApiError(
          `La API respondió con un error (HTTP ${response.status})`,
          response.status,
          texto
        );
      }
    }
  }

  if (!response.ok) {
    throw new ApiError(mensajeDeError(json, response.status), response.status, json);
  }

  return json as T;
}

// ─────────────────────────────────────────────────────────────
// FUNCIONES API
// ─────────────────────────────────────────────────────────────

export const api = {
  // ── Metadatos ────────────────────────────────────────────
  getMetadatos: (): Promise<ApiMetadatos> => request("/"),

  // ── Órdenes / Comandas (rutas públicas, sin API key) ─────
  getOrdenes: (estatus?: EstatusOrden | "activo"): Promise<Orden[]> =>
    request<Orden[]>("/ordenes", { query: { estatus }, publica: true }).then(o =>
      o.map(normalizarOrden)
    ),

  /** Órdenes del tablero de cocina: recibido, preparando o listo. */
  getOrdenesActivas: (): Promise<Orden[]> =>
    request<Orden[]>("/ordenes", {
      query: { estatus: "activo" },
      publica: true
    }).then(o => o.map(normalizarOrden)),

  getOrden: (id: number): Promise<Orden> =>
    request<Orden>(`/ordenes/${id}`, { publica: true }).then(normalizarOrden),

  /**
   * Crea la orden con sus líneas de detalle. El estatus inicial ("recibido") lo
   * asigna el backend, y el nombre y el precio de cada ítem se toman del menú.
   */
  crearOrden: (data: CrearOrdenInput): Promise<Orden> =>
    request<Orden>("/ordenes", { method: "POST", body: data, publica: true }).then(
      normalizarOrden
    ),

  actualizarEstatusOrden: (
    id: number,
    estatus: EstatusOrden
  ): Promise<ActualizarEstatusOrdenResponse> =>
    request(`/ordenes/${id}`, {
      method: "PUT",
      body: { Estatus_Orden: estatus },
      publica: true
    }),

  /** Soft-delete: marca la orden como "cancelado", no borra el registro. */
  cancelarOrden: (id: number): Promise<MensajeResponse> =>
    request(`/ordenes/${id}`, { method: "DELETE", publica: true }),

  // ── Platos / Menú ────────────────────────────────────────
  getPlatos: (): Promise<Plato[]> =>
    request<Plato[]>("/platos").then(p => p.map(normalizarPlato)),

  getPlato: (id: number): Promise<Plato> =>
    request<Plato>(`/platos/${id}`).then(normalizarPlato),

  crearPlato: (data: PlatoInput): Promise<Plato> =>
    request<ConDatos<Plato>>("/platos", { method: "POST", body: data }).then(r =>
      normalizarPlato(r.data)
    ),

  /** Falla con 409 si el plato ya forma parte de una orden o receta. */
  eliminarPlato: (id: number): Promise<Plato> =>
    request<ConDatos<Plato>>(`/platos/${id}`, { method: "DELETE" }).then(r =>
      normalizarPlato(r.data)
    ),

  // ── Mesas ────────────────────────────────────────────────
  getMesas: (): Promise<Mesa[]> => request("/mesas"),

  getMesa: (id: number): Promise<Mesa> => request(`/mesas/${id}`),

  crearMesa: (data: MesaInput): Promise<Mesa> =>
    request<ConDatos<Mesa>>("/mesas", { method: "POST", body: data }).then(r => r.data),

  /**
   * Actualiza los datos de una mesa.
   *
   * ⚠️ El swagger todavía no documenta esta ruta; se asume el mismo patrón que
   * /inventario y /proveedores (PUT sobre el recurso, con actualización parcial).
   */
  actualizarMesa: (id: number, data: Partial<MesaInput>): Promise<Mesa> =>
    request<Mesa | ConDatos<Mesa>>(`/mesas/${id}`, { method: "PUT", body: data }).then(
      desenvolver
    ),

  /** Atajo para el caso más común: cambiar solo el estado de la mesa. */
  actualizarEstadoMesa: (id: number, estado: EstadoMesa): Promise<Mesa> =>
    request<Mesa | ConDatos<Mesa>>(`/mesas/${id}`, {
      method: "PUT",
      body: { estado }
    }).then(desenvolver),

  /**
   * Elimina una mesa.
   *
   * ⚠️ Ruta asumida (no documentada en el swagger). Se espera un 409 si la mesa
   * tiene órdenes asociadas, igual que /platos y /inventario.
   */
  eliminarMesa: (id: number): Promise<MensajeResponse> =>
    request(`/mesas/${id}`, { method: "DELETE" }),

  // ── Inventario / Insumos ─────────────────────────────────
  getInventario: (): Promise<Insumo[]> =>
    request<Insumo[]>("/inventario").then(i => i.map(normalizarInsumo)),

  getInsumo: (id: number): Promise<Insumo> =>
    request<Insumo>(`/inventario/${id}`).then(normalizarInsumo),

  crearInsumo: (data: InsumoInput): Promise<Insumo> =>
    request<Insumo>("/inventario", { method: "POST", body: data }).then(normalizarInsumo),

  actualizarInsumo: (id: number, data: Partial<InsumoInput>): Promise<Insumo> =>
    request<Insumo>(`/inventario/${id}`, { method: "PUT", body: data }).then(
      normalizarInsumo
    ),

  /** Falla con 409 si el insumo está vinculado a proveedores o recetas. */
  eliminarInsumo: (id: number): Promise<MensajeResponse> =>
    request(`/inventario/${id}`, { method: "DELETE" }),

  // ── Proveedores ──────────────────────────────────────────
  getProveedores: (): Promise<Proveedor[]> => request("/proveedores"),

  getProveedor: (id: number): Promise<Proveedor> => request(`/proveedores/${id}`),

  /** El RIF y el email deben ser únicos (409 si ya existen). */
  crearProveedor: (data: ProveedorInput): Promise<Proveedor> =>
    request("/proveedores", { method: "POST", body: data }),

  actualizarProveedor: (id: number, data: Partial<ProveedorInput>): Promise<Proveedor> =>
    request(`/proveedores/${id}`, { method: "PUT", body: data }),

  /** Falla con 409 si el proveedor tiene compras o insumos asociados. */
  eliminarProveedor: (id: number): Promise<MensajeResponse> =>
    request(`/proveedores/${id}`, { method: "DELETE" }),

  // ── Facturas ─────────────────────────────────────────────
  getFacturas: (): Promise<Factura[]> =>
    request<Factura[]>("/facturas").then(f => f.map(normalizarFactura)),

  getFactura: (numFactura: number): Promise<Factura> =>
    request<Factura>(`/facturas/${numFactura}`).then(normalizarFactura),

  /** Cobra un pedido: calcula el subtotal desde el detalle real y emite la factura. */
  crearFactura: (data: FacturaInput): Promise<Factura> =>
    request<Factura>("/facturas", { method: "POST", body: data }).then(normalizarFactura),

  /** El swagger no documenta el cuerpo de la respuesta; solo el 200. */
  actualizarEstadoPago: (
    numFactura: number,
    estadoPago: EstadoPago
  ): Promise<MensajeResponse> =>
    request(`/facturas/${numFactura}/estado-pago`, {
      method: "PUT",
      body: { estado_pago: estadoPago }
    }),

  // ── Clientes ─────────────────────────────────────────────
  getClientes: (): Promise<Cliente[]> => request("/clientes"),

  getCliente: (cedula: string): Promise<Cliente> =>
    request(`/clientes/${encodeURIComponent(cedula)}`),

  crearCliente: (data: ClienteInput): Promise<Cliente> =>
    request("/clientes", { method: "POST", body: data }),

  // ── Reportes ─────────────────────────────────────────────
  getResumenReporte: (): Promise<ReporteResumen> =>
    request<ReporteResumen>("/reportes/resumen").then(r => ({
      total_pedidos: aNumero(r.total_pedidos),
      ingresos_brutos: aNumero(r.ingresos_brutos),
      tiempo_promedio_seg: aNumero(r.tiempo_promedio_seg),
      pct_cambio_pedidos: aNumero(r.pct_cambio_pedidos),
      pct_cambio_ingresos: aNumero(r.pct_cambio_ingresos)
    })),

  /** Histórico de órdenes de compra a proveedores, no de comandas del salón. */
  getPedidosReporte: (estado?: EstadoPedidoProveedor): Promise<ReportePedidoItem[]> =>
    request<ReportePedidoItem[]>("/reportes/pedidos", { query: { estado } }).then(p =>
      p.map(item => ({ ...item, total: aNumero(item.total) }))
    )
};
