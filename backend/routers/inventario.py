"""
routers/inventario.py
GET    /api/inventario        → lista de inventario / insumos
POST   /api/inventario        → crear insumo
PUT    /api/inventario/{id}   → actualizar insumo
DELETE /api/inventario/{id}   → eliminar insumo
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Insumo

router = APIRouter(prefix="/api/inventario", tags=["Inventario"])


def format_insumo(i: Insumo) -> dict:
    return {
        "id_inventario": i.ID_Insumos,
        "ID_Insumos": i.ID_Insumos,
        "nombre": i.Nombre_Insumo,
        "Nombre_Insumo": i.Nombre_Insumo,
        "stock": float(i.Stock_Actual),
        "Stock_Actual": float(i.Stock_Actual),
        "unidad": i.Unidad_Medida,
        "Unidad_Medida": i.Unidad_Medida,
        "precio_costo": 0.0,
        "stock_minimo": float(i.Stock_Minimo),
        "Stock_Minimo": float(i.Stock_Minimo),
        "Punto_Reorden": float(i.Punto_Reorden)
    }


@router.get("")
def get_inventario(db: Session = Depends(get_db)):
    insumos = db.query(Insumo).order_by(Insumo.Nombre_Insumo).all()
    return [format_insumo(i) for i in insumos]


@router.post("", status_code=201)
def crear_item(data: dict, db: Session = Depends(get_db)):
    nombre = data.get("nombre") or data.get("Nombre_Insumo") or "Insumo Nuevo"
    unidad = data.get("unidad") or data.get("Unidad_Medida") or "Kg"
    stock = float(data.get("stock") or data.get("Stock_Actual") or 0)
    stock_min = float(data.get("stock_minimo") or data.get("Stock_Minimo") or 0)
    reorden = float(data.get("Punto_Reorden") or stock_min * 1.5)

    insumo = Insumo(
        Nombre_Insumo=nombre,
        Unidad_Medida=unidad,
        Stock_Actual=stock,
        Stock_Minimo=stock_min,
        Punto_Reorden=reorden
    )
    db.add(insumo)
    db.commit()
    db.refresh(insumo)
    return format_insumo(insumo)


@router.put("/{id_inventario}")
def update_item(id_inventario: int, data: dict, db: Session = Depends(get_db)):
    insumo = db.query(Insumo).filter(Insumo.ID_Insumos == id_inventario).first()
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    
    if "nombre" in data or "Nombre_Insumo" in data:
        insumo.Nombre_Insumo = data.get("nombre") or data.get("Nombre_Insumo")
    if "stock" in data or "Stock_Actual" in data:
        insumo.Stock_Actual = float(data.get("stock") or data.get("Stock_Actual"))
    if "unidad" in data or "Unidad_Medida" in data:
        insumo.Unidad_Medida = data.get("unidad") or data.get("Unidad_Medida")
    if "stock_minimo" in data or "Stock_Minimo" in data:
        insumo.Stock_Minimo = float(data.get("stock_minimo") or data.get("Stock_Minimo"))
    
    db.commit()
    db.refresh(insumo)
    return format_insumo(insumo)


@router.delete("/{id_inventario}", status_code=204)
def delete_item(id_inventario: int, db: Session = Depends(get_db)):
    insumo = db.query(Insumo).filter(Insumo.ID_Insumos == id_inventario).first()
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    db.delete(insumo)
    db.commit()
