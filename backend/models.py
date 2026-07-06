"""
models.py — Modelos ORM (SQLAlchemy)
Representan las tablas de la base de datos PostgreSQL.
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Numeric, Boolean,
    DateTime, Enum, ForeignKey, Text
)
from sqlalchemy.orm import relationship
import enum

from database import Base


# ─────────────────────────────────────────────────────────────
# ENUMS
# ─────────────────────────────────────────────────────────────

class EstatusOrdenEnum(str, enum.Enum):
    Recibido  = "Recibido"
    Preparando = "Preparando"
    Listo     = "Listo"

class TipoOrdenEnum(str, enum.Enum):
    mesa     = "mesa"
    pickup   = "pickup"
    delivery = "delivery"


# ─────────────────────────────────────────────────────────────
# TABLAS
# ─────────────────────────────────────────────────────────────

class Producto(Base):
    __tablename__ = "productos"

    id_producto  = Column(Integer, primary_key=True, index=True)
    nombre       = Column(String(150), nullable=False)
    descripcion  = Column(Text, default="")
    precio       = Column(Numeric(10, 2), nullable=False)
    categoria    = Column(String(100), nullable=False)
    imagen_url   = Column(String(300), nullable=True)
    disponible   = Column(Boolean, default=True, nullable=False)

    # Relación inversa
    items = relationship("ItemPedido", back_populates="producto")


class Pedido(Base):
    __tablename__ = "pedidos"

    id_pedido         = Column(Integer, primary_key=True, index=True)
    hora_creacion     = Column(DateTime, default=datetime.utcnow, nullable=False)
    cliente_nombre    = Column(String(150), nullable=False)
    cliente_cedula    = Column(String(20), nullable=True)
    cliente_telefono  = Column(String(20), nullable=True)
    tipo              = Column(Enum(TipoOrdenEnum), nullable=False)
    mesa              = Column(Integer, nullable=True)
    direccion         = Column(String(300), nullable=True)
    subtotal          = Column(Numeric(12, 2), nullable=False)
    iva               = Column(Numeric(12, 2), nullable=False)
    total             = Column(Numeric(12, 2), nullable=False)
    Estatus_Orden     = Column(Enum(EstatusOrdenEnum), default=EstatusOrdenEnum.Recibido, nullable=False)

    items = relationship("ItemPedido", back_populates="pedido", cascade="all, delete-orphan")


class ItemPedido(Base):
    __tablename__ = "items_pedido"

    id            = Column(Integer, primary_key=True, index=True)
    id_pedido     = Column(Integer, ForeignKey("pedidos.id_pedido"), nullable=False)
    id_producto   = Column(Integer, ForeignKey("productos.id_producto"), nullable=False)
    nombre        = Column(String(150), nullable=False)   # snapshot del nombre al momento del pedido
    cantidad      = Column(Integer, nullable=False)
    precio_unitario = Column(Numeric(10, 2), nullable=False)
    notas         = Column(Text, nullable=True)

    pedido   = relationship("Pedido", back_populates="items")
    producto = relationship("Producto", back_populates="items")


class Inventario(Base):
    __tablename__ = "inventario"

    id_inventario = Column(Integer, primary_key=True, index=True)
    nombre        = Column(String(150), nullable=False)
    stock         = Column(Numeric(10, 3), nullable=False)
    unidad        = Column(String(30), nullable=False)
    precio_costo  = Column(Numeric(10, 2), nullable=False)
    stock_minimo  = Column(Numeric(10, 3), nullable=False)


class Proveedor(Base):
    __tablename__ = "proveedores"

    id_proveedor = Column(Integer, primary_key=True, index=True)
    nombre       = Column(String(150), nullable=False)
    rif          = Column(String(20), nullable=False)
    contacto     = Column(String(100), nullable=False)
    telefono     = Column(String(20), nullable=False)
    email        = Column(String(150), nullable=True)
