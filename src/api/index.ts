/**
 * Tradiciones y Sabores — Capa de API
 * Conecta el frontend React con la API Node.js/Express del equipo de BD.
 * Base URL: /api/v1 (backend de los compañeros)
 */

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_KEY = import.meta.env.VITE_API_KEY || '';

// Las órdenes son públicas; el resto requiere API Key
const PUBLIC_HEADERS = { 'Content-Type': 'application/json' };
const AUTH_HEADERS   = { 'Content-Type': 'application/json', 'x-api-key': API_KEY };

function check(r: Response, msg: string): Response {
  if (!r.ok) throw new Error(`${msg} (HTTP ${r.status})`);
  return r;
}

// ─────────────────────────────────────────────────────────────
// TIPOS E INTERFACES
// Alineados con el schema real de la BD (restaurant-bd-tdb)
// ─────────────────────────────────────────────────────────────

export type EstatusOrden =
  | 'Recibido' | 'Preparando' | 'Listo' | 'Entregado' | 'Cancelado'
  | 'recibido' | 'preparando' | 'listo'  | 'entregado'  | 'cancelado';

export type TipoOrden = 'mesa' | 'pickup' | 'delivery';

export type CategoriaPlato =
  | 'entrada' | 'plato_principal' | 'postre' | 'bebida' | 'acompañante' | string;

export interface ItemOrden {
  id_producto?: number;
  id_plato?:    number;
  nombre:       string;
  cantidad:     number;
  precio_unitario: number;
  subtotal?:    number;
  notas?:       string;
}

export interface Orden {
  id_pedido:        number;
  num_ticket?:      number;
  hora_creacion:    string;
  cliente_nombre:   string;
  cliente_cedula?:  string;
  cliente_telefono?: string;
  tipo:             TipoOrden;
  tipo_pedido?:     TipoOrden;
  mesa?:            number;
  id_mesa?:         number;
  direccion?:       string;
  direccion_envio?: string;
  items:            ItemOrden[];
  subtotal:         number;
  iva:              number;
  total:            number;
  Estatus_Orden:    EstatusOrden;
  estado_orden?:    EstatusOrden;
}

export interface Producto {
  id_producto:  number;
  id_plato?:    number;
  nombre:       string;
  descripcion:  string;
  precio:       number;
  categoria:    CategoriaPlato;
  imagen_url?:  string;
  disponible:   boolean;
}

export interface ItemInventario {
  // Campos que devuelve el backend del equipo (snake_case)
  id_insumos?:    number;
  id_inventario?: number;
  nombre_insumo?: string;
  nombre?:        string;
  stock_actual?:  number;
  stock?:         number;
  unidad_medida?: string;
  unidad?:        string;
  stock_minimo?:  number;
  punto_reorden?: number;
  fk_id_categoria?: number;
}

export interface Proveedor {
  id_proveedor?:       number;
  ID_Proveedor?:       number;
  nombre?:             string;
  nombre_empresa?:     string;
  Nombre_Empresa?:     string;
  rif?:                string;
  identificacion_rif?: string;
  Identificacion_RIF?: string;
  contacto?:           string;
  nombre_encargado?:   string;
  Nombre_Encargado?:   string;
  telefono?:           string;
  telefono_empresa?:   string;
  Telefono_Empresa?:   string;
  email?:              string;
  email_empresa?:      string;
  Email_Empresa?:      string;
  ciudad?:             string;
  Ciudad?:             string;
  direccion?:          string;
  Direccion?:          string;
}

export interface ResumenReporte {
  total_pedidos:       number;
  ingresos_brutos:     number;
  tiempo_promedio_seg: number;
  pct_cambio_pedidos:  number;
  pct_cambio_ingresos: number;
}

// ─────────────────────────────────────────────────────────────
// HELPERS DE NORMALIZACIÓN
// Adaptan la respuesta del backend a las interfaces del front
// ─────────────────────────────────────────────────────────────

/** Normaliza un Plato (backend devuelve id_plato; front espera id_producto también) */
function normalizePlato(p: any): Producto {
  return {
    id_producto: p.id_plato ?? p.id_producto,
    id_plato:    p.id_plato ?? p.id_producto,
    nombre:      p.nombre,
    descripcion: p.descripcion ?? '',
    precio:      Number(p.precio),
    categoria:   p.categoria,
    imagen_url:  p.imagen_url ?? undefined,
    disponible:  p.disponible ?? true,
  };
}

/** Normaliza un Insumo (backend devuelve snake_case) */
function normalizeInsumo(i: any): ItemInventario {
  return {
    id_insumos:       i.id_insumos ?? i.id_inventario ?? 0,
    id_inventario:    i.id_inventario ?? i.id_insumos ?? 0,
    nombre_insumo:    i.nombre_insumo ?? i.nombre ?? 'Sin nombre',
    nombre:           i.nombre ?? i.nombre_insumo ?? 'Sin nombre',
    stock_actual:     Number(i.stock_actual ?? i.stock ?? 0),
    stock:            Number(i.stock ?? i.stock_actual ?? 0),
    unidad_medida:    i.unidad_medida ?? i.unidad ?? 'Kg',
    unidad:           i.unidad ?? i.unidad_medida ?? 'Kg',
    precio_costo:     Number(i.precio_costo ?? i.precio ?? 0),
    stock_minimo:     Number(i.stock_minimo ?? 0),
    punto_reorden:    Number(i.punto_reorden ?? 0),
    fk_id_categoria:  i.fk_id_categoria ?? undefined,
  };
}

/** Normaliza un Proveedor (backend devuelve snake_case) */
function normalizeProveedor(p: any): Proveedor {
  return {
    id_proveedor:       p.id_proveedor,
    ID_Proveedor:       p.id_proveedor,
    nombre:             p.nombre_empresa,
    nombre_empresa:     p.nombre_empresa,
    Nombre_Empresa:     p.nombre_empresa,
    rif:                p.identificacion_rif,
    identificacion_rif: p.identificacion_rif,
    Identificacion_RIF: p.identificacion_rif,
    contacto:           p.nombre_encargado,
    nombre_encargado:   p.nombre_encargado,
    Nombre_Encargado:   p.nombre_encargado,
    telefono:           p.telefono_empresa,
    telefono_empresa:   p.telefono_empresa,
    Telefono_Empresa:   p.telefono_empresa,
    email:              p.email_empresa,
    email_empresa:      p.email_empresa,
    Email_Empresa:      p.email_empresa,
    ciudad:             p.ciudad,
    Ciudad:             p.ciudad,
    direccion:          p.direccion,
    Direccion:          p.direccion,
  };
}

// ─────────────────────────────────────────────────────────────
// FUNCIONES API
// ─────────────────────────────────────────────────────────────

export const api = {
  // ── Órdenes / Pedidos (endpoint público — sin API key) ────
  getOrdenes: (): Promise<Orden[]> =>
    fetch(`${BASE}/api/v1/ordenes`, { headers: PUBLIC_HEADERS })
      .then(r => check(r, 'Error cargando órdenes').json()),

  getOrdenesActivas: (): Promise<Orden[]> =>
    fetch(`${BASE}/api/v1/ordenes?estatus=activo`, { headers: PUBLIC_HEADERS })
      .then(r => check(r, 'Error cargando órdenes activas').json()),

  getOrdenPorId: (id: number): Promise<Orden> =>
    fetch(`${BASE}/api/v1/ordenes/${id}`, { headers: PUBLIC_HEADERS })
      .then(r => check(r, 'Error consultando orden').json()),

  /**
   * Crea una orden. Adapta el payload al formato que espera el backend del equipo:
   * { cliente_nombre, cliente_cedula, cliente_telefono, tipo, mesa?, direccion?, items[] }
   */
  crearOrden: (data: Partial<Orden> | any): Promise<Orden> => {
    const payload = {
      cliente_nombre:   data.cliente_nombre  ?? data.nombre_cliente   ?? 'Cliente Consumidor',
      cliente_cedula:   data.cliente_cedula  ?? data.cedula_cliente   ?? 'V-00000000',
      cliente_telefono: data.cliente_telefono ?? data.telefono         ?? '0000000000',
      tipo:             data.tipo_pedido      ?? data.tipo             ?? 'mesa',
      mesa:             data.id_mesa          ?? data.mesa             ?? undefined,
      direccion:        data.direccion_envio  ?? data.direccion        ?? undefined,
      items: (data.items ?? data.detalles ?? []).map((it: any) => ({
        id_producto: it.id_plato ?? it.id_producto,
        cantidad:    it.cantidad,
        notas:       it.notas   ?? undefined,
      })),
    };
    return fetch(`${BASE}/api/v1/ordenes`, {
      method:  'POST',
      headers: PUBLIC_HEADERS,
      body:    JSON.stringify(payload),
    }).then(r => check(r, 'Error creando orden').json());
  },

  updateEstatus: (id: number, estatus: EstatusOrden): Promise<void> =>
    fetch(`${BASE}/api/v1/ordenes/${id}`, {
      method:  'PUT',
      headers: PUBLIC_HEADERS,
      body:    JSON.stringify({ Estatus_Orden: estatus, estado_orden: estatus }),
    }).then(r => { check(r, 'Error actualizando estado de orden'); }),

  /**
   * Cancela la orden. El backend del equipo hace soft-delete
   * (cambia estado_orden = 'cancelado'), no elimina el registro.
   */
  cancelarOrden: (id: number): Promise<void> =>
    fetch(`${BASE}/api/v1/ordenes/${id}`, {
      method:  'DELETE',
      headers: PUBLIC_HEADERS,
    }).then(r => { check(r, 'Error cancelando la orden'); }),

  // ── Catálogo de Platos (requiere API key) ────────────────
  getProductos: (): Promise<Producto[]> =>
    fetch(`${BASE}/api/v1/platos`, { headers: AUTH_HEADERS })
      .then(r => check(r, 'Error cargando catálogo de platos').json())
      .then((rows: any[]) => rows.map(normalizePlato)),

  // ── Inventario (requiere API key) ────────────────────────
  getInventario: (): Promise<ItemInventario[]> =>
    fetch(`${BASE}/api/v1/inventario`, { headers: AUTH_HEADERS })
      .then(r => check(r, 'Error cargando inventario').json())
      .then((rows: any[]) => rows.map(normalizeInsumo)),

  crearItem: (data: any): Promise<ItemInventario> =>
    fetch(`${BASE}/api/v1/inventario`, {
      method:  'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({
        nombre_insumo:   data.nombre      ?? data.Nombre_Insumo  ?? data.nombre_insumo,
        stock_actual:    data.stock       ?? data.Stock_Actual    ?? data.stock_actual   ?? 0,
        unidad_medida:   data.unidad      ?? data.Unidad_Medida   ?? data.unidad_medida  ?? 'Kg',
        stock_minimo:    data.stock_minimo ?? data.Stock_Minimo   ?? 0,
        punto_reorden:   data.punto_reorden ?? data.Punto_Reorden ?? 0,
        fk_id_categoria: data.fk_id_categoria ?? null,
      }),
    }).then(r => check(r, 'Error creando ítem de inventario').json())
      .then(normalizeInsumo),

  updateItem: (id: number, data: any): Promise<ItemInventario> =>
    fetch(`${BASE}/api/v1/inventario/${id}`, {
      method:  'PUT',
      headers: AUTH_HEADERS,
      body: JSON.stringify({
        nombre_insumo:   data.nombre      ?? data.Nombre_Insumo  ?? data.nombre_insumo,
        stock_actual:    data.stock       ?? data.Stock_Actual    ?? data.stock_actual,
        unidad_medida:   data.unidad      ?? data.Unidad_Medida   ?? data.unidad_medida,
        stock_minimo:    data.stock_minimo ?? data.Stock_Minimo,
        punto_reorden:   data.punto_reorden ?? data.Punto_Reorden,
        fk_id_categoria: data.fk_id_categoria,
      }),
    }).then(r => check(r, 'Error actualizando ítem de inventario').json())
      .then(normalizeInsumo),

  deleteItem: (id: number): Promise<void> =>
    fetch(`${BASE}/api/v1/inventario/${id}`, { method: 'DELETE', headers: AUTH_HEADERS })
      .then(r => { check(r, 'Error eliminando ítem de inventario'); }),

  // ── Proveedores (requiere API key) ───────────────────────
  // Nota: el endpoint de proveedores vive bajo /api/v1/inventario/proveedores
  // si los compañeros no lo exponen, devuelve array vacío sin romper la UI.
  getProveedores: (): Promise<Proveedor[]> =>
    fetch(`${BASE}/api/v1/proveedores`, { headers: AUTH_HEADERS })
      .then(r => {
        if (!r.ok) return [];
        return r.json().then((rows: any[]) => rows.map(normalizeProveedor));
      })
      .catch(() => []),

  crearProveedor: (data: any): Promise<Proveedor> =>
    fetch(`${BASE}/api/v1/proveedores`, {
      method:  'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({
        nombre_empresa:    data.nombre          ?? data.Nombre_Empresa     ?? data.nombre_empresa,
        identificacion_rif: data.rif            ?? data.Identificacion_RIF ?? data.identificacion_rif,
        ciudad:            data.Ciudad          ?? data.ciudad,
        telefono_empresa:  data.telefono        ?? data.Telefono_Empresa   ?? data.telefono_empresa,
        email_empresa:     data.email           ?? data.Email_Empresa      ?? data.email_empresa,
        direccion:         data.Direccion       ?? data.direccion,
        nombre_encargado:  data.contacto        ?? data.Nombre_Encargado   ?? data.nombre_encargado,
      }),
    }).then(r => check(r, 'Error creando proveedor').json())
      .then(normalizeProveedor),

  updateProveedor: (id: number, data: any): Promise<Proveedor> =>
    fetch(`${BASE}/api/v1/proveedores/${id}`, {
      method:  'PUT',
      headers: AUTH_HEADERS,
      body: JSON.stringify({
        nombre_empresa:    data.nombre          ?? data.Nombre_Empresa     ?? data.nombre_empresa,
        identificacion_rif: data.rif            ?? data.Identificacion_RIF ?? data.identificacion_rif,
        ciudad:            data.Ciudad          ?? data.ciudad,
        telefono_empresa:  data.telefono        ?? data.Telefono_Empresa   ?? data.telefono_empresa,
        email_empresa:     data.email           ?? data.Email_Empresa      ?? data.email_empresa,
        direccion:         data.Direccion       ?? data.direccion,
        nombre_encargado:  data.contacto        ?? data.Nombre_Encargado   ?? data.nombre_encargado,
      }),
    }).then(r => check(r, 'Error actualizando proveedor').json())
      .then(normalizeProveedor),

  deleteProveedor: (id: number): Promise<void> =>
    fetch(`${BASE}/api/v1/proveedores/${id}`, { method: 'DELETE', headers: AUTH_HEADERS })
      .then(r => { check(r, 'Error eliminando proveedor'); }),

  // ── Reportes (requiere API key) ──────────────────────────
  getResumen: (): Promise<ResumenReporte> =>
    fetch(`${BASE}/api/v1/reportes/resumen`, { headers: AUTH_HEADERS })
      .then(r => check(r, 'Error cargando resumen de reportes').json()),

  getPedidosReporte: (params?: { estado?: string; periodo?: string }): Promise<Orden[]> => {
    const qs = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return fetch(`${BASE}/api/v1/reportes/pedidos${qs}`, { headers: AUTH_HEADERS })
      .then(r => check(r, 'Error cargando pedidos del reporte').json());
  },
};
