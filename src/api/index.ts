/**
 * Restaurant Equis — Capa de API
 * Conecta el frontend React con la API FastAPI respaldada por PostgreSQL.
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
const HEADERS = { 'Content-Type': 'application/json' };

function check(r: Response, msg: string): Response {
  if (!r.ok) throw new Error(`${msg} (HTTP ${r.status})`);
  return r;
}

// ─────────────────────────────────────────────────────────────
// TIPOS E INTERFACES
// ─────────────────────────────────────────────────────────────

export type EstatusOrden = 'Recibido' | 'Preparando' | 'Listo' | 'Entregado' | 'recibido' | 'preparando' | 'listo' | 'entregado';
export type TipoOrden = 'mesa' | 'pickup' | 'delivery';
export type CategoriaPlato = 'entrada' | 'plato_principal' | 'postre' | 'bebida' | 'acompañante' | string;

export interface ItemOrden {
  id_producto?: number;
  id_plato?: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal?: number;
  notas?: string;
}

export interface Orden {
  id_pedido: number;
  num_ticket?: number;
  hora_creacion: string;
  cliente_nombre: string;
  cliente_cedula?: string;
  cliente_telefono?: string;
  tipo: TipoOrden;
  tipo_pedido?: TipoOrden;
  mesa?: number;
  id_mesa?: number;
  direccion?: string;
  direccion_envio?: string;
  items: ItemOrden[];
  subtotal: number;
  iva: number;
  total: number;
  Estatus_Orden: EstatusOrden;
  estado_orden?: EstatusOrden;
}

export interface Producto {
  id_producto: number;
  id_plato?: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: CategoriaPlato;
  imagen_url?: string;
  disponible: boolean;
}

export interface ItemInventario {
  id_inventario: number;
  ID_Insumos?: number;
  nombre: string;
  Nombre_Insumo?: string;
  stock: number;
  Stock_Actual?: number;
  unidad: string;
  Unidad_Medida?: string;
  precio_costo: number;
  stock_minimo: number;
  Stock_Minimo?: number;
}

export interface Proveedor {
  id_proveedor: number;
  ID_Proveedor?: number;
  nombre: string;
  Nombre_Empresa?: string;
  rif: string;
  Identificacion_RIF?: string;
  contacto: string;
  Nombre_Encargado?: string;
  telefono: string;
  Telefono_Empresa?: string;
  email?: string;
  Email_Empresa?: string;
  Ciudad?: string;
  Direccion?: string;
}

export interface ResumenReporte {
  total_pedidos: number;
  ingresos_brutos: number;
  tiempo_promedio_seg: number;
  pct_cambio_pedidos: number;
  pct_cambio_ingresos: number;
}

// ─────────────────────────────────────────────────────────────
// FUNCIONES API
// ─────────────────────────────────────────────────────────────

export const api = {
  // ── Órdenes / Pedidos ────────────────────────────────────
  getOrdenes: (): Promise<Orden[]> =>
    fetch(`${BASE}/api/ordenes`)
      .then(r => check(r, 'Error cargando órdenes').json()),

  getOrdenesActivas: (): Promise<Orden[]> =>
    fetch(`${BASE}/api/ordenes?estatus=activo`)
      .then(r => check(r, 'Error cargando órdenes activas').json()),

  getOrdenPorId: (id: number): Promise<Orden> =>
    fetch(`${BASE}/api/ordenes/${id}`)
      .then(r => check(r, 'Error consultando orden').json()),

  crearOrden: (data: Partial<Orden> | any): Promise<Orden> =>
    fetch(`${BASE}/api/ordenes`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(data),
    }).then(r => check(r, 'Error creando orden').json()),

  updateEstatus: (id: number, estatus: EstatusOrden): Promise<void> =>
    fetch(`${BASE}/api/ordenes/${id}`, {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify({ Estatus_Orden: estatus, estado_orden: estatus }),
    }).then(r => { check(r, 'Error actualizando estado de orden'); }),

  cancelarOrden: (id: number): Promise<void> =>
    fetch(`${BASE}/api/ordenes/${id}`, {
      method: 'DELETE',
      headers: HEADERS,
    }).then(r => { check(r, 'Error cancelando la orden'); }),

  // ── Catálogo de Platos ───────────────────────────────────
  getProductos: (): Promise<Producto[]> =>
    fetch(`${BASE}/api/productos`)
      .then(r => check(r, 'Error cargando catálogo de platos').json()),

  // ── Inventario ───────────────────────────────────────────
  getInventario: (): Promise<ItemInventario[]> =>
    fetch(`${BASE}/api/inventario`)
      .then(r => check(r, 'Error cargando inventario').json()),

  crearItem: (data: any): Promise<ItemInventario> =>
    fetch(`${BASE}/api/inventario`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(data),
    }).then(r => check(r, 'Error creando ítem de inventario').json()),

  updateItem: (id: number, data: any): Promise<ItemInventario> =>
    fetch(`${BASE}/api/inventario/${id}`, {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify(data),
    }).then(r => check(r, 'Error actualizando ítem de inventario').json()),

  deleteItem: (id: number): Promise<void> =>
    fetch(`${BASE}/api/inventario/${id}`, { method: 'DELETE' })
      .then(r => { check(r, 'Error eliminando ítem de inventario'); }),

  // ── Proveedores ──────────────────────────────────────────
  getProveedores: (): Promise<Proveedor[]> =>
    fetch(`${BASE}/api/proveedores`)
      .then(r => check(r, 'Error cargando proveedores').json()),

  crearProveedor: (data: any): Promise<Proveedor> =>
    fetch(`${BASE}/api/proveedores`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(data),
    }).then(r => check(r, 'Error creando proveedor').json()),

  updateProveedor: (id: number, data: any): Promise<Proveedor> =>
    fetch(`${BASE}/api/proveedores/${id}`, {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify(data),
    }).then(r => check(r, 'Error actualizando proveedor').json()),

  deleteProveedor: (id: number): Promise<void> =>
    fetch(`${BASE}/api/proveedores/${id}`, { method: 'DELETE' })
      .then(r => { check(r, 'Error eliminando proveedor'); }),

  // ── Reportes ─────────────────────────────────────────────
  getResumen: (): Promise<ResumenReporte> =>
    fetch(`${BASE}/api/reportes/resumen`)
      .then(r => check(r, 'Error cargando resumen de reportes').json()),

  getPedidosReporte: (params?: { estado?: string; periodo?: string }): Promise<Orden[]> => {
    const qs = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return fetch(`${BASE}/api/reportes/pedidos${qs}`)
      .then(r => check(r, 'Error cargando pedidos del reporte').json());
  },
};
