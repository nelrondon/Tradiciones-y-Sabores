"""
models.py — Modelos ORM (SQLAlchemy)
Mapean exactamente las tablas PostgreSQL definidas por el equipo de BD (nelrondon/restaurant-bd-tdb).
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, BigInteger, String, Numeric, Boolean,
    DateTime, Date, Enum, ForeignKey, Text
)
from sqlalchemy.orm import relationship
import enum

from database import Base


# ─────────────────────────────────────────────────────────────
# ENUMS DE BASE DE DATOS
# ─────────────────────────────────────────────────────────────

class EstadoMesaEnum(str, enum.Enum):
    disponible = "disponible"
    ocupada = "ocupada"
    reservada = "reservada"
    fuera_de_servicio = "fuera_de_servicio"

class TipoPedidoEnum(str, enum.Enum):
    mesa = "mesa"
    pickup = "pickup"
    delivery = "delivery"

class EstadoOrdenEnum(str, enum.Enum):
    recibido = "recibido"
    preparando = "preparando"
    listo = "listo"
    entregado = "entregado"

class CategoriaPlatoEnum(str, enum.Enum):
    entrada = "entrada"
    plato_principal = "plato_principal"
    postre = "postre"
    bebida = "bebida"
    acompanante = "acompañante"

class EstadoPagoEnum(str, enum.Enum):
    pendiente = "pendiente"
    pagado = "pagado"
    anulado = "anulado"


# ─────────────────────────────────────────────────────────────
# TABLAS DE MESAS, PLATOS Y PEDIDOS
# ─────────────────────────────────────────────────────────────

class Mesa(Base):
    __tablename__ = "mesa"

    id_mesa   = Column(Integer, primary_key=True, index=True, autoincrement=True)
    capacidad = Column(Integer, nullable=False)
    estado    = Column(Enum(EstadoMesaEnum, values_callable=lambda x: [e.value for e in x]), default=EstadoMesaEnum.disponible, nullable=False)
    ubicacion = Column(String(100), nullable=True)


class Plato(Base):
    __tablename__ = "plato"

    id_plato    = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre      = Column(String(100), nullable=False)
    descripcion = Column(String(255), nullable=True)
    precio      = Column(Numeric(8, 2), nullable=False)
    categoria   = Column(Enum(CategoriaPlatoEnum, values_callable=lambda x: [e.value for e in x]), nullable=False)


class Cliente(Base):
    __tablename__ = "cliente"

    cedula_cliente     = Column(String(20), primary_key=True, index=True)
    nombre             = Column(String(100), nullable=False)
    telefono           = Column(String(20), nullable=False)
    email              = Column(String(100), nullable=True)
    direccion_habitual = Column(String(255), nullable=True)

    pedidos = relationship("Pedido", back_populates="cliente")


class Pedido(Base):
    __tablename__ = "pedido"

    num_ticket      = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tipo_pedido     = Column(Enum(TipoPedidoEnum, values_callable=lambda x: [e.value for e in x]), nullable=False)
    estado_orden    = Column(Enum(EstadoOrdenEnum, values_callable=lambda x: [e.value for e in x]), default=EstadoOrdenEnum.recibido, nullable=False)
    id_mesa         = Column(Integer, ForeignKey("mesa.id_mesa"), nullable=True)
    cedula_cliente  = Column(String(20), ForeignKey("cliente.cedula_cliente"), nullable=False)
    direccion_envio = Column(String(255), nullable=True)
    fecha_creacion  = Column(DateTime, default=datetime.utcnow, nullable=False)

    mesa     = relationship("Mesa")
    cliente  = relationship("Cliente", back_populates="pedidos")
    detalles = relationship("DetallePedido", back_populates="pedido", cascade="all, delete-orphan")
    factura  = relationship("Factura", back_populates="pedido", uselist=False)


class DetallePedido(Base):
    __tablename__ = "detalle_pedido"

    num_ticket = Column(Integer, ForeignKey("pedido.num_ticket"), primary_key=True)
    id_plato   = Column(Integer, ForeignKey("plato.id_plato"), primary_key=True)
    cantidad   = Column(Integer, nullable=False)
    subtotal   = Column(Numeric(8, 2), nullable=False)

    pedido = relationship("Pedido", back_populates="detalles")
    plato  = relationship("Plato")


class Factura(Base):
    __tablename__ = "factura"

    num_factura   = Column(Integer, primary_key=True, index=True, autoincrement=True)
    num_ticket    = Column(Integer, ForeignKey("pedido.num_ticket"), unique=True, nullable=False)
    fecha_emision = Column(DateTime, default=datetime.utcnow, nullable=False)
    subtotal      = Column(Numeric(8, 2), nullable=False)
    impuesto      = Column(Numeric(8, 2), default=0, nullable=False)
    total         = Column(Numeric(8, 2), nullable=False)
    estado_pago   = Column(Enum(EstadoPagoEnum, values_callable=lambda x: [e.value for e in x]), default=EstadoPagoEnum.pendiente, nullable=False)
    metodo_pago   = Column(String(30), nullable=True)

    pedido = relationship("Pedido", back_populates="factura")


# ─────────────────────────────────────────────────────────────
# TABLAS DEL ESQUEMA INVENTARIO
# ─────────────────────────────────────────────────────────────

class CategoriaInsumo(Base):
    __tablename__ = "Categoria"
    __table_args__ = {"schema": "Inventario"}

    ID_Categoria     = Column(BigInteger, primary_key=True, autoincrement=True)
    Nombre_Categoria = Column(String(100), unique=True, nullable=False)


class Insumo(Base):
    __tablename__ = "Insumos"
    __table_args__ = {"schema": "Inventario"}

    ID_Insumos     = Column(BigInteger, primary_key=True, autoincrement=True)
    Nombre_Insumo  = Column(String(100), unique=True, nullable=False)
    Unidad_Medida  = Column(String(20), nullable=False)
    Stock_Actual   = Column(Numeric(12, 4), default=0, nullable=False)
    Stock_Minimo   = Column(Numeric(12, 4), default=0, nullable=False)
    Punto_Reorden  = Column(Numeric(12, 4), default=0, nullable=False)
    FK_IDCategoria = Column(BigInteger, ForeignKey("Inventario.Categoria.ID_Categoria"), nullable=True)


class Proveedor(Base):
    __tablename__ = "Proveedores"
    __table_args__ = {"schema": "Inventario"}

    ID_Proveedor       = Column(BigInteger, primary_key=True, autoincrement=True)
    Nombre_Empresa     = Column(String(150), nullable=False)
    Identificacion_RIF = Column("Identificación_RIF", String(30), unique=True, nullable=False)
    Ciudad             = Column(String(100), nullable=False)
    Telefono_Empresa   = Column(String(30), nullable=False)
    Email_Empresa      = Column(String(100), unique=True, nullable=False)
    Direccion          = Column(String(255), nullable=False)
    Nombre_Encargado   = Column(String(100), nullable=False)
