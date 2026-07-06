/**
 * Restaurant Equis — Capa de API
 * Todas las comunicaciones con el backend pasan por aquí.
 * No hay conexión directa a la base de datos — solo fetch a endpoints REST.
 *
 * Configura la URL base en .env.local:
 *   VITE_API_URL=http://localhost:5000
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
const HEADERS = { 'Content-Type': 'application/json' };

/** Verifica el status HTTP y lanza un error legible si falla */
function check(r: Response, msg: string): Response {
  if (!r.ok) throw new Error(`${msg} (HTTP ${r.status})`);
  return r;
}

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

export type EstatusOrden = 'Recibido' | 'Preparando' | 'Listo';
export type TipoOrden = 'mesa' | 'pickup' | 'delivery';

export interface ItemOrden {
  id_producto: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  notas?: string;
}

export interface Orden {
  id_pedido: number;
  hora_creacion: string;        // ISO string o formato "HH:MM"
  cliente_nombre: string;
  cliente_cedula?: string;
  cliente_telefono?: string;
  tipo: TipoOrden;
  mesa?: number;
  direccion?: string;
  items: ItemOrden[];
  subtotal: number;
  iva: number;
  total: number;
  Estatus_Orden: EstatusOrden;
}

export interface Producto {
  id_producto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen_url?: string;
  disponible: boolean;
}

export interface ItemInventario {
  id_inventario: number;
  nombre: string;
  stock: number;
  unidad: string;
  precio_costo: number;
  stock_minimo: number;
}

export interface Proveedor {
  id_proveedor: number;
  nombre: string;
  rif: string;
  contacto: string;
  telefono: string;
  email?: string;
}

export interface ResumenReporte {
  total_pedidos: number;
  ingresos_brutos: number;
  tiempo_promedio_seg: number;
  pct_cambio_pedidos: number;   // positivo = subida, negativo = bajada
  pct_cambio_ingresos: number;
}

// ─────────────────────────────────────────────────────────────
// FUNCIONES DE API
// ─────────────────────────────────────────────────────────────

export const api = {

  // ── Órdenes ──────────────────────────────────────────────
  /** Todas las órdenes (para reportes e historial) */
  getOrdenes: (): Promise<Orden[]> =>
    fetch(`${BASE}/api/ordenes`)
      .then(r => check(r, 'Error cargando órdenes').json()),

  /** Solo órdenes activas: Recibido y Preparando (para cocina) */
  getOrdenesActivas: (): Promise<Orden[]> =>
    fetch(`${BASE}/api/ordenes?estatus=activo`)
      .then(r => check(r, 'Error cargando órdenes activas').json()),

  /** Crear nueva orden desde el POS */
  crearOrden: (data: Omit<Orden, 'id_pedido' | 'hora_creacion' | 'Estatus_Orden'>): Promise<Orden> =>
    fetch(`${BASE}/api/ordenes`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(data),
    }).then(r => check(r, 'Error creando orden').json()),

  /** Actualizar Estatus_Orden de una orden (cocina) */
  updateEstatus: (id: number, estatus: EstatusOrden): Promise<void> =>
    fetch(`${BASE}/api/ordenes/${id}`, {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify({ Estatus_Orden: estatus }),
    }).then(r => { check(r, 'Error actualizando estado de orden'); }),

  /** Cancelar/eliminar una orden (solo si no está Listo) */
  cancelarOrden: (id: number): Promise<void> =>
    fetch(`${BASE}/api/ordenes/${id}`, {
      method: 'DELETE',
      headers: HEADERS,
    }).then(r => { check(r, 'Error cancelando la orden'); }),

  // ── Productos ─────────────────────────────────────────────
  /** Catálogo completo de productos para el POS */
  getProductos: (): Promise<Producto[]> =>
    fetch(`${BASE}/api/productos`)
      .then(r => check(r, 'Error cargando catálogo de productos').json()),

  // ── Inventario ────────────────────────────────────────────
  getInventario: (): Promise<ItemInventario[]> =>
    fetch(`${BASE}/api/inventario`)
      .then(r => check(r, 'Error cargando inventario').json()),

  crearItem: (data: Omit<ItemInventario, 'id_inventario'>): Promise<ItemInventario> =>
    fetch(`${BASE}/api/inventario`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(data),
    }).then(r => check(r, 'Error creando ítem de inventario').json()),

  updateItem: (id: number, data: Partial<Omit<ItemInventario, 'id_inventario'>>): Promise<ItemInventario> =>
    fetch(`${BASE}/api/inventario/${id}`, {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify(data),
    }).then(r => check(r, 'Error actualizando ítem de inventario').json()),

  deleteItem: (id: number): Promise<void> =>
    fetch(`${BASE}/api/inventario/${id}`, { method: 'DELETE' })
      .then(r => { check(r, 'Error eliminando ítem de inventario'); }),

  // ── Proveedores ───────────────────────────────────────────
  getProveedores: (): Promise<Proveedor[]> =>
    fetch(`${BASE}/api/proveedores`)
      .then(r => check(r, 'Error cargando proveedores').json()),

  crearProveedor: (data: Omit<Proveedor, 'id_proveedor'>): Promise<Proveedor> =>
    fetch(`${BASE}/api/proveedores`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(data),
    }).then(r => check(r, 'Error creando proveedor').json()),

  updateProveedor: (id: number, data: Partial<Omit<Proveedor, 'id_proveedor'>>): Promise<Proveedor> =>
    fetch(`${BASE}/api/proveedores/${id}`, {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify(data),
    }).then(r => check(r, 'Error actualizando proveedor').json()),

  deleteProveedor: (id: number): Promise<void> =>
    fetch(`${BASE}/api/proveedores/${id}`, { method: 'DELETE' })
      .then(r => { check(r, 'Error eliminando proveedor'); }),

  // ── Reportes ──────────────────────────────────────────────
  /** KPIs del dashboard de reportes */
  getResumen: (): Promise<ResumenReporte> =>
    fetch(`${BASE}/api/reportes/resumen`)
      .then(r => check(r, 'Error cargando resumen de reportes').json()),

  /** Pedidos para la tabla de reportes con filtros opcionales */
  getPedidosReporte: (params?: { estado?: string; periodo?: string }): Promise<Orden[]> => {
    const qs = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return fetch(`${BASE}/api/reportes/pedidos${qs}`)
      .then(r => check(r, 'Error cargando pedidos del reporte').json());
  },
};
