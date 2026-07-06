"""
routers/reportes.py
GET /api/reportes/resumen  → KPIs del dashboard
GET /api/reportes/pedidos  → tabla de pedidos con filtros opcionales
"""
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Pedido, EstatusOrdenEnum
from schemas import ResumenReporte, OrdenOut

router = APIRouter(prefix="/api/reportes", tags=["Reportes"])


def _periodo_range(periodo: Optional[str]):
    """Devuelve (inicio, fin) de fechas según el parámetro periodo."""
    ahora = datetime.utcnow()
    if periodo == "semana":
        inicio = ahora - timedelta(days=7)
    elif periodo == "mes":
        inicio = ahora - timedelta(days=30)
    elif periodo == "hoy":
        inicio = ahora.replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        inicio = ahora - timedelta(days=30)   # default: último mes
    return inicio, ahora


@router.get("/resumen", response_model=ResumenReporte)
def get_resumen(db: Session = Depends(get_db)):
    ahora = datetime.utcnow()
    inicio_actual = ahora - timedelta(days=30)
    inicio_anterior = ahora - timedelta(days=60)

    # Período actual
    q_actual = db.query(Pedido).filter(Pedido.hora_creacion >= inicio_actual)
    pedidos_actuales = q_actual.count()
    ingresos_actuales = float(
        db.query(func.sum(Pedido.total))
        .filter(Pedido.hora_creacion >= inicio_actual)
        .scalar() or 0
    )

    # Período anterior (para calcular % cambio)
    q_anterior = db.query(Pedido).filter(
        Pedido.hora_creacion >= inicio_anterior,
        Pedido.hora_creacion < inicio_actual,
    )
    pedidos_anteriores = q_anterior.count()
    ingresos_anteriores = float(
        db.query(func.sum(Pedido.total))
        .filter(
            Pedido.hora_creacion >= inicio_anterior,
            Pedido.hora_creacion < inicio_actual,
        )
        .scalar() or 0
    )

    def pct(actual, anterior):
        if anterior == 0:
            return 100.0 if actual > 0 else 0.0
        return round((actual - anterior) / anterior * 100, 1)

    # Tiempo promedio de atención (de Recibido a Listo) — aproximación con datos disponibles
    # Se calcula como tiempo desde hora_creacion hasta "ahora" para órdenes Listas del período actual
    listos = db.query(Pedido).filter(
        Pedido.hora_creacion >= inicio_actual,
        Pedido.Estatus_Orden == EstatusOrdenEnum.Listo,
    ).all()
    if listos:
        tiempo_promedio = sum(
            (ahora - p.hora_creacion).total_seconds() for p in listos
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


@router.get("/pedidos", response_model=List[OrdenOut])
def get_pedidos_reporte(
    estado: Optional[str] = Query(None),
    periodo: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    inicio, fin = _periodo_range(periodo)
    query = db.query(Pedido).filter(
        Pedido.hora_creacion >= inicio,
        Pedido.hora_creacion <= fin,
    )
    if estado and estado != "Todos":
        try:
            estatus_enum = EstatusOrdenEnum(estado)
            query = query.filter(Pedido.Estatus_Orden == estatus_enum)
        except ValueError:
            pass  # estado inválido → ignorar filtro

    return query.order_by(Pedido.hora_creacion.desc()).all()
