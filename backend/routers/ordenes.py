"""
routers/ordenes.py
GET    /api/ordenes & /api/pedidos → obtener todas las órdenes / pedidos
POST   /api/ordenes & /api/pedidos → crear pedido + cliente + detalle_pedido
PUT    /api/ordenes/{num_ticket}    → actualizar estado_orden
DELETE /api/ordenes/{num_ticket}    → eliminar / cancelar orden
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime

from database import get_db
from models import Pedido, DetallePedido, Cliente, Plato, EstadoOrdenEnum, TipoPedidoEnum, Factura, EstadoPagoEnum
from schemas import PedidoIn, PedidoOut, PedidoUpdateEstatus

router = APIRouter(prefix="/api/ordenes", tags=["Órdenes / Pedidos"])
router_pedidos = APIRouter(prefix="/api/pedidos", tags=["Pedidos (Alias)"])


def format_pedido_response(p: Pedido) -> dict:
    """Helper para dar formato compatible a la respuesta de la orden"""
    items = []
    subtotal = 0.0
    for d in p.detalles:
        sub = float(d.subtotal)
        subtotal += sub
        items.append({
            "id_producto": d.id_plato,
            "id_plato": d.id_plato,
            "nombre": d.plato.nombre if d.plato else f"Plato #{d.id_plato}",
            "cantidad": d.cantidad,
            "precio_unitario": float(d.plato.precio) if d.plato else sub / d.cantidad,
            "subtotal": sub
        })
    
    iva = round(subtotal * 0.16, 2)
    total = round(subtotal + iva, 2)

    estatus_str = p.estado_orden.value if hasattr(p.estado_orden, 'value') else str(p.estado_orden)
    estatus_cap = estatus_str.capitalize()

    return {
        "id_pedido": p.num_ticket,
        "num_ticket": p.num_ticket,
        "hora_creacion": p.fecha_creacion.isoformat() if p.fecha_creacion else datetime.utcnow().isoformat(),
        "cliente_nombre": p.cliente.nombre if p.cliente else "Cliente General",
        "cliente_cedula": p.cedula_cliente,
        "cliente_telefono": p.cliente.telefono if p.cliente else "",
        "tipo": p.tipo_pedido.value if hasattr(p.tipo_pedido, 'value') else str(p.tipo_pedido),
        "tipo_pedido": p.tipo_pedido.value if hasattr(p.tipo_pedido, 'value') else str(p.tipo_pedido),
        "mesa": p.id_mesa,
        "id_mesa": p.id_mesa,
        "direccion": p.direccion_envio,
        "direccion_envio": p.direccion_envio,
        "items": items,
        "subtotal": subtotal,
        "iva": iva,
        "total": total,
        "Estatus_Orden": estatus_cap,
        "estado_orden": estatus_str
    }


@router.get("")
@router_pedidos.get("")
def get_ordenes(estatus: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Pedido).options(joinedload(Pedido.cliente), joinedload(Pedido.detalles).joinedload(DetallePedido.plato))
    
    if estatus == "activo":
        query = query.filter(
            Pedido.estado_orden.in_([EstadoOrdenEnum.recibido, EstadoOrdenEnum.preparando])
        )
    
    pedidos = query.order_by(Pedido.num_ticket.desc()).all()
    return [format_pedido_response(p) for p in pedidos]


@router.get("/{num_ticket}")
@router_pedidos.get("/{num_ticket}")
def get_orden_por_id(num_ticket: int, db: Session = Depends(get_db)):
    p = db.query(Pedido).options(
        joinedload(Pedido.cliente),
        joinedload(Pedido.detalles).joinedload(DetallePedido.plato)
    ).filter(Pedido.num_ticket == num_ticket).first()
    
    if not p:
        raise HTTPException(status_code=404, detail="Orden / Pedido no encontrado")
    return format_pedido_response(p)


@router.post("", status_code=201)
@router_pedidos.post("", status_code=201)
def crear_orden(data: dict, db: Session = Depends(get_db)):
    cedula = data.get("cedula_cliente") or data.get("cliente_cedula") or "V-00000000"
    nombre_cli = data.get("cliente_nombre") or data.get("nombre_cliente") or "Cliente Consumidor"
    telefono_cli = data.get("cliente_telefono") or data.get("telefono") or "0000000000"
    direccion_cli = data.get("direccion_envio") or data.get("direccion") or data.get("direccion_habitual")

    cliente = db.query(Cliente).filter(Cliente.cedula_cliente == cedula).first()
    if not cliente:
        cliente = Cliente(
            cedula_cliente=cedula,
            nombre=nombre_cli,
            telefono=telefono_cli,
            direccion_habitual=direccion_cli
        )
        db.add(cliente)
        db.flush()

    tipo_str = data.get("tipo_pedido") or data.get("tipo") or "mesa"
    try:
        tipo_enum = TipoPedidoEnum(tipo_str.lower())
    except ValueError:
        tipo_enum = TipoPedidoEnum.mesa

    id_mesa = data.get("id_mesa") or data.get("mesa")

    pedido = Pedido(
        tipo_pedido=tipo_enum,
        estado_orden=EstadoOrdenEnum.recibido,
        id_mesa=id_mesa,
        cedula_cliente=cliente.cedula_cliente,
        direccion_envio=direccion_cli if tipo_enum == TipoPedidoEnum.delivery else None
    )
    db.add(pedido)
    db.flush()

    items_raw = data.get("items") or data.get("detalles") or []
    subtotal_acum = 0.0

    for it in items_raw:
        id_plato = it.get("id_plato") or it.get("id_producto")
        cant = int(it.get("cantidad", 1))
        
        plato = db.query(Plato).filter(Plato.id_plato == id_plato).first()
        precio_unit = float(plato.precio) if plato else float(it.get("precio_unitario", 0))
        sub = round(precio_unit * cant, 2)
        subtotal_acum += sub

        detalle = DetallePedido(
            num_ticket=pedido.num_ticket,
            id_plato=id_plato,
            cantidad=cant,
            subtotal=sub
        )
        db.add(detalle)

    factura = Factura(
        num_ticket=pedido.num_ticket,
        subtotal=subtotal_acum,
        impuesto=round(subtotal_acum * 0.16, 2),
        total=round(subtotal_acum * 1.16, 2),
        estado_pago=EstadoPagoEnum.pendiente
    )
    db.add(factura)

    db.commit()
    
    pedido_full = db.query(Pedido).options(
        joinedload(Pedido.cliente),
        joinedload(Pedido.detalles).joinedload(DetallePedido.plato)
    ).filter(Pedido.num_ticket == pedido.num_ticket).first()

    return format_pedido_response(pedido_full)


@router.put("/{num_ticket}")
@router_pedidos.put("/{num_ticket}")
def update_estatus(num_ticket: int, data: dict, db: Session = Depends(get_db)):
    pedido = db.query(Pedido).filter(Pedido.num_ticket == num_ticket).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    
    nuevo_estatus = data.get("estado_orden") or data.get("Estatus_Orden") or data.get("estatus")
    if nuevo_estatus:
        s = str(nuevo_estatus).lower()
        if s == "recibido":
            pedido.estado_orden = EstadoOrdenEnum.recibido
        elif s == "preparando":
            pedido.estado_orden = EstadoOrdenEnum.preparando
        elif s == "listo":
            pedido.estado_orden = EstadoOrdenEnum.listo
        elif s == "entregado":
            pedido.estado_orden = EstadoOrdenEnum.entregado
        
    db.commit()
    return {"status": "ok", "num_ticket": num_ticket}


@router.delete("/{num_ticket}")
@router_pedidos.delete("/{num_ticket}")
def cancelar_orden(num_ticket: int, db: Session = Depends(get_db)):
    pedido = db.query(Pedido).filter(Pedido.num_ticket == num_ticket).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Orden / Pedido no encontrado")
    
    # Eliminar en orden relacional (factura -> detalle_pedido -> pedido)
    db.query(Factura).filter(Factura.num_ticket == num_ticket).delete()
    db.query(DetallePedido).filter(DetallePedido.num_ticket == num_ticket).delete()
    db.delete(pedido)
    db.commit()
    return {"status": "deleted", "num_ticket": num_ticket}
