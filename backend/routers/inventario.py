"""
routers/inventario.py
GET    /api/inventario        → lista de inventario
POST   /api/inventario        → crear ítem
PUT    /api/inventario/{id}   → actualizar ítem
DELETE /api/inventario/{id}   → eliminar ítem
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Inventario
from schemas import ItemInventarioIn, ItemInventarioOut, ItemInventarioUpdate

router = APIRouter(prefix="/api/inventario", tags=["Inventario"])


@router.get("", response_model=List[ItemInventarioOut])
def get_inventario(db: Session = Depends(get_db)):
    return db.query(Inventario).order_by(Inventario.nombre).all()


@router.post("", response_model=ItemInventarioOut, status_code=201)
def crear_item(data: ItemInventarioIn, db: Session = Depends(get_db)):
    item = Inventario(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{id_inventario}", response_model=ItemInventarioOut)
def update_item(id_inventario: int, data: ItemInventarioUpdate, db: Session = Depends(get_db)):
    item = db.query(Inventario).filter(Inventario.id_inventario == id_inventario).first()
    if not item:
        raise HTTPException(status_code=404, detail="Ítem de inventario no encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{id_inventario}", status_code=204)
def delete_item(id_inventario: int, db: Session = Depends(get_db)):
    item = db.query(Inventario).filter(Inventario.id_inventario == id_inventario).first()
    if not item:
        raise HTTPException(status_code=404, detail="Ítem de inventario no encontrado")
    db.delete(item)
    db.commit()
