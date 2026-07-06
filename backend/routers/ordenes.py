"""
routers/ordenes.py
GET    /api/ordenes          → todas las órdenes (opcional ?estatus=activo)
POST   /api/ordenes          → crear nueva orden
PUT    /api/ordenes/{id}     → actualizar Estatus_Orden
DELETE /api/ordenes/{id}     → cancelar orden (solo si no está Listo)
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Pedido, ItemPedido, EstatusOrdenEnum
from schemas import OrdenIn, OrdenOut, OrdenUpdateEstatus

router = APIRouter(prefix="/api/ordenes", tags=["Órdenes"])


@router.get("", response_model=List[OrdenOut])
def get_ordenes(estatus: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Pedido)
    if estatus == "activo":
        query = query.filter(
            Pedido.Estatus_Orden.in_([EstatusOrdenEnum.Recibido, EstatusOrdenEnum.Preparando])
        )
    return query.order_by(Pedido.hora_creacion.desc()).all()


@router.post("", response_model=OrdenOut, status_code=201)
def crear_orden(data: OrdenIn, db: Session = Depends(get_db)):
    pedido = Pedido(
        cliente_nombre=data.cliente_nombre,
        cliente_cedula=data.cliente_cedula,
        cliente_telefono=data.cliente_telefono,
        tipo=data.tipo,
        mesa=data.mesa,
        direccion=data.direccion,
        subtotal=data.subtotal,
        iva=data.iva,
        total=data.total,
        Estatus_Orden=EstatusOrdenEnum.Recibido,
    )
    db.add(pedido)
    db.flush()  # obtener id_pedido antes del commit

    for it in data.items:
        item = ItemPedido(
            id_pedido=pedido.id_pedido,
            id_producto=it.id_producto,
            nombre=it.nombre,
            cantidad=it.cantidad,
            precio_unitario=it.precio_unitario,
            notas=it.notas,
        )
        db.add(item)

    db.commit()
    db.refresh(pedido)
    return pedido


@router.put("/{id_pedido}", status_code=204)
def update_estatus(id_pedido: int, data: OrdenUpdateEstatus, db: Session = Depends(get_db)):
    pedido = db.query(Pedido).filter(Pedido.id_pedido == id_pedido).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    pedido.Estatus_Orden = data.Estatus_Orden
    db.commit()


@router.delete("/{id_pedido}", status_code=204)
def cancelar_orden(id_pedido: int, db: Session = Depends(get_db)):
    """
    Cancela/elimina una orden.
    - Retorna 404 si la orden no existe.
    - Retorna 400 si la orden ya está en estado 'Listo' (no se puede cancelar).
    - Elimina primero los ítems (ITEM_PEDIDO) y luego el pedido (PEDIDO).
    """
    pedido = db.query(Pedido).filter(Pedido.id_pedido == id_pedido).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    if pedido.Estatus_Orden == EstatusOrdenEnum.Listo:
        raise HTTPException(
            status_code=400,
            detail="No se puede cancelar una orden que ya fue despachada (Listo)"
        )
    # Eliminar ítems primero (FK constraint)
    db.query(ItemPedido).filter(ItemPedido.id_pedido == id_pedido).delete()
    db.delete(pedido)
    db.commit()
