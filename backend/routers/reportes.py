"""
routers/reportes.py
GET /api/reportes/resumen  → KPIs del dashboard
GET /api/reportes/pedidos  → tabla de pedidos con filtros opcionales
"""
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Pedido, Factura, DetallePedido, EstadoOrdenEnum
from schemas import ResumenReporte
from routers.ordenes import format_pedido_response

router = APIRouter(prefix="/api/reportes", tags=["Reportes"])


def _periodo_range(periodo: Optional[str]):
    ahora = datetime.utcnow()
    if periodo == "semana":
        inicio = ahora - timedelta(days=7)
    elif periodo == "mes":
        inicio = ahora - timedelta(days=30)
    elif periodo == "hoy":
        inicio = ahora.replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        inicio = ahora - timedelta(days=30)
    return inicio, ahora


@router.get("/resumen", response_model=ResumenReporte)
def get_resumen(db: Session = Depends(get_db)):
    ahora = datetime.utcnow()
    inicio_actual = ahora - timedelta(days=30)
    inicio_anterior = ahora - timedelta(days=60)

    # Período actual
    q_actual = db.query(Pedido).filter(Pedido.fecha_creacion >= inicio_actual)
    pedidos_actuales = q_actual.count()
    
    ingresos_actuales = float(
        db.query(func.sum(Factura.total))
        .join(Pedido, Factura.num_ticket == Pedido.num_ticket)
        .filter(Pedido.fecha_creacion >= inicio_actual)
        .scalar() or 0
    )

    # Período anterior
    q_anterior = db.query(Pedido).filter(
        Pedido.fecha_creacion >= inicio_anterior,
        Pedido.fecha_creacion < inicio_actual,
    )
    pedidos_anteriores = q_anterior.count()
    ingresos_anteriores = float(
        db.query(func.sum(Factura.total))
        .join(Pedido, Factura.num_ticket == Pedido.num_ticket)
        .filter(
            Pedido.fecha_creacion >= inicio_anterior,
            Pedido.fecha_creacion < inicio_actual,
        )
        .scalar() or 0
    )

    def pct(actual, anterior):
        if anterior == 0:
            return 100.0 if actual > 0 else 0.0
        return round((actual - anterior) / anterior * 100, 1)

    listos = db.query(Pedido).filter(
        Pedido.fecha_creacion >= inicio_actual,
        Pedido.estado_orden.in_([EstadoOrdenEnum.listo, EstadoOrdenEnum.entregado]),
    ).all()
    
    if listos:
        tiempo_promedio = sum(
            (ahora - p.fecha_creacion).total_seconds() for p in listos
        ) / len(listos)
    else:
        tiempo_promedio = 0.0

    return ResumenReporte(
        total_pedidos=pedidos_actuales,
        ingresos_brutos=ingresos_actuales,
        tiempo_promedio_seg=round(tiempo_promedio, 1),
        pct_cambio_pedidos=pct(pedidos_actuales, pedidos_anteriores),
        pct_cambio_ingresos=pct(ingresos_actuales, ingresos_anteriores),
    )


@router.get("/pedidos")
def get_pedidos_reporte(
    estado: Optional[str] = Query(None),
    periodo: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    inicio, fin = _periodo_range(periodo)
    query = db.query(Pedido).options(
        joinedload(Pedido.cliente),
        joinedload(Pedido.detalles).joinedload(DetallePedido.plato)
    ).filter(
        Pedido.fecha_creacion >= inicio,
        Pedido.fecha_creacion <= fin,
    )
    
    if estado and estado != "Todos":
        s = estado.lower()
        if s in ["recibido", "preparando", "listo", "entregado"]:
            query = query.filter(Pedido.estado_orden == s)

    pedidos = query.order_by(Pedido.num_ticket.desc()).all()
    return [format_pedido_response(p) for p in pedidos]
