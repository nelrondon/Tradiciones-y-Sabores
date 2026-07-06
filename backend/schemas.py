"""
schemas.py — Pydantic schemas
Validan los datos de entrada y dan forma a las respuestas JSON.
Deben coincidir 1:1 con los tipos definidos en src/api/index.ts
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from models import EstatusOrdenEnum, TipoOrdenEnum


# ─────────────────────────────────────────────────────────────
# PRODUCTO
# ─────────────────────────────────────────────────────────────

class ProductoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_producto: int
    nombre: str
    descripcion: str
    precio: float
    categoria: str
    imagen_url: Optional[str] = None
    disponible: bool


# ─────────────────────────────────────────────────────────────
# ÓRDENES
# ─────────────────────────────────────────────────────────────

class ItemOrdenIn(BaseModel):
    id_producto: int
    nombre: str
    cantidad: int
    precio_unitario: float
    notas: Optional[str] = None


class ItemOrdenOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_producto: int
    nombre: str
    cantidad: int
    precio_unitario: float
    notas: Optional[str] = None


class OrdenIn(BaseModel):
    cliente_nombre: str
    cliente_cedula: Optional[str] = None
    cliente_telefono: Optional[str] = None
    tipo: TipoOrdenEnum
    mesa: Optional[int] = None
    direccion: Optional[str] = None
    items: List[ItemOrdenIn]
    subtotal: float
    iva: float
    total: float


class OrdenOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_pedido: int
    hora_creacion: datetime
    cliente_nombre: str
    cliente_cedula: Optional[str] = None
    cliente_telefono: Optional[str] = None
    tipo: TipoOrdenEnum
    mesa: Optional[int] = None
    direccion: Optional[str] = None
    items: List[ItemOrdenOut]
    subtotal: float
    iva: float
    total: float
    Estatus_Orden: EstatusOrdenEnum


class OrdenUpdateEstatus(BaseModel):
    Estatus_Orden: EstatusOrdenEnum


# ─────────────────────────────────────────────────────────────
# INVENTARIO
# ─────────────────────────────────────────────────────────────

class ItemInventarioIn(BaseModel):
    nombre: str
    stock: float
    unidad: str
    precio_costo: float
    stock_minimo: float


class ItemInventarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_inventario: int
    nombre: str
    stock: float
    unidad: str
    precio_costo: float
    stock_minimo: float


class ItemInventarioUpdate(BaseModel):
    nombre: Optional[str] = None
    stock: Optional[float] = None
    unidad: Optional[str] = None
    precio_costo: Optional[float] = None
    stock_minimo: Optional[float] = None


# ─────────────────────────────────────────────────────────────
# PROVEEDORES
# ─────────────────────────────────────────────────────────────

class ProveedorIn(BaseModel):
    nombre: str
    rif: str
    contacto: str
    telefono: str
    email: Optional[str] = None


class ProveedorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_proveedor: int
    nombre: str
    rif: str
    contacto: str
    telefono: str
    email: Optional[str] = None


class ProveedorUpdate(BaseModel):
    nombre: Optional[str] = None
    rif: Optional[str] = None
    contacto: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None


# ─────────────────────────────────────────────────────────────
# REPORTES
# ─────────────────────────────────────────────────────────────

class ResumenReporte(BaseModel):
    total_pedidos: int
    ingresos_brutos: float
    tiempo_promedio_seg: float
    pct_cambio_pedidos: float
    pct_cambio_ingresos: float
