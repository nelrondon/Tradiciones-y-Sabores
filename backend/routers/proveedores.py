"""
routers/proveedores.py
GET    /api/proveedores        → lista de proveedores
POST   /api/proveedores        → crear proveedor
PUT    /api/proveedores/{id}   → actualizar proveedor
DELETE /api/proveedores/{id}   → eliminar proveedor
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Proveedor
from schemas import ProveedorIn, ProveedorOut, ProveedorUpdate

router = APIRouter(prefix="/api/proveedores", tags=["Proveedores"])


@router.get("", response_model=List[ProveedorOut])
def get_proveedores(db: Session = Depends(get_db)):
    return db.query(Proveedor).order_by(Proveedor.nombre).all()


@router.post("", response_model=ProveedorOut, status_code=201)
def crear_proveedor(data: ProveedorIn, db: Session = Depends(get_db)):
    proveedor = Proveedor(**data.model_dump())
    db.add(proveedor)
    db.commit()
    db.refresh(proveedor)
    return proveedor


@router.put("/{id_proveedor}", response_model=ProveedorOut)
def update_proveedor(id_proveedor: int, data: ProveedorUpdate, db: Session = Depends(get_db)):
    proveedor = db.query(Proveedor).filter(Proveedor.id_proveedor == id_proveedor).first()
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(proveedor, field, value)
    db.commit()
    db.refresh(proveedor)
    return proveedor


@router.delete("/{id_proveedor}", status_code=204)
def delete_proveedor(id_proveedor: int, db: Session = Depends(get_db)):
    proveedor = db.query(Proveedor).filter(Proveedor.id_proveedor == id_proveedor).first()
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    db.delete(proveedor)
    db.commit()
