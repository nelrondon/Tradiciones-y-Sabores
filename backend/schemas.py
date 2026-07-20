"""
schemas.py — Pydantic schemas
Validan los datos de entrada y dan forma a las respuestas JSON.
Alineados con el esquema SQL del equipo de BD (nelrondon/restaurant-bd-tdb).
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from models import (
    EstadoMesaEnum, TipoPedidoEnum, EstadoOrdenEnum,
    CategoriaPlatoEnum, EstadoPagoEnum
)

# ─────────────────────────────────────────────────────────────
# MESA
# ─────────────────────────────────────────────────────────────

class MesaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_mesa: int
    capacidad: int
    estado: EstadoMesaEnum
    ubicacion: Optional[str] = None

class MesaIn(BaseModel):
    capacidad: int
    estado: Optional[EstadoMesaEnum] = EstadoMesaEnum.disponible
    ubicacion: Optional[str] = None


# ─────────────────────────────────────────────────────────────
# PLATO / PRODUCTO
# ─────────────────────────────────────────────────────────────

class PlatoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_plato: int
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    categoria: CategoriaPlatoEnum

class PlatoIn(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    categoria: CategoriaPlatoEnum


# ─────────────────────────────────────────────────────────────
# CLIENTE
# ─────────────────────────────────────────────────────────────

class ClienteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    cedula_cliente: str
    nombre: str
    telefono: str
    email: Optional[str] = None
    direccion_habitual: Optional[str] = None

class ClienteIn(BaseModel):
    cedula_cliente: str
    nombre: str
    telefono: str
    email: Optional[str] = None
    direccion_habitual: Optional[str] = None


# ─────────────────────────────────────────────────────────────
# PEDIDO Y DETALLE PEDIDO
# ─────────────────────────────────────────────────────────────

class DetallePedidoIn(BaseModel):
    id_plato: int
    cantidad: int
    subtotal: float

class DetallePedidoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    num_ticket: int
    id_plato: int
    cantidad: int
    subtotal: float
    plato: Optional[PlatoOut] = None

class PedidoIn(BaseModel):
    tipo_pedido: TipoPedidoEnum
    estado_orden: Optional[EstadoOrdenEnum] = EstadoOrdenEnum.recibido
    id_mesa: Optional[int] = None
    cedula_cliente: str
    cliente_nombre: Optional[str] = None   # Auxiliar para registrar cliente si no existe
    cliente_telefono: Optional[str] = None # Auxiliar para registrar cliente si no existe
    direccion_envio: Optional[str] = None
    detalles: List[DetallePedidoIn]

class PedidoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    num_ticket: int
    tipo_pedido: TipoPedidoEnum
    estado_orden: EstadoOrdenEnum
    id_mesa: Optional[int] = None
    cedula_cliente: str
    direccion_envio: Optional[str] = None
    fecha_creacion: datetime
    cliente: Optional[ClienteOut] = None
    detalles: List[DetallePedidoOut] = []

class PedidoUpdateEstatus(BaseModel):
    estado_orden: EstadoOrdenEnum


# ─────────────────────────────────────────────────────────────
# FACTURA
# ─────────────────────────────────────────────────────────────

class FacturaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    num_factura: int
    num_ticket: int
    fecha_emision: datetime
    subtotal: float
    impuesto: float
    total: float
    estado_pago: EstadoPagoEnum
    metodo_pago: Optional[str] = None

class FacturaIn(BaseModel):
    num_ticket: int
    subtotal: float
    impuesto: Optional[float] = 0
    total: float
    estado_pago: Optional[EstadoPagoEnum] = EstadoPagoEnum.pendiente
    metodo_pago: Optional[str] = None


# ─────────────────────────────────────────────────────────────
# INVENTARIO Y PROVEEDORES
# ─────────────────────────────────────────────────────────────

class InsumoIn(BaseModel):
    Nombre_Insumo: str
    Unidad_Medida: str
    Stock_Actual: float = 0
    Stock_Minimo: float = 0
    Punto_Reorden: float = 0
    FK_IDCategoria: Optional[int] = None

class InsumoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ID_Insumos: int
    Nombre_Insumo: str
    Unidad_Medida: str
    Stock_Actual: float
    Stock_Minimo: float
    Punto_Reorden: float
    FK_IDCategoria: Optional[int] = None

class ProveedorIn(BaseModel):
    Nombre_Empresa: str
    Identificacion_RIF: str
    Ciudad: str
    Telefono_Empresa: str
    Email_Empresa: str
    Direccion: str
    Nombre_Encargado: str

class ProveedorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ID_Proveedor: int
    Nombre_Empresa: str
    Identificacion_RIF: str
    Ciudad: str
    Telefono_Empresa: str
    Email_Empresa: str
    Direccion: str
    Nombre_Encargado: str


# ─────────────────────────────────────────────────────────────
# REPORTES
# ─────────────────────────────────────────────────────────────

class ResumenReporte(BaseModel):
    total_pedidos: int
    ingresos_brutos: float
    tiempo_promedio_seg: float
    pct_cambio_pedidos: float
    pct_cambio_ingresos: float
