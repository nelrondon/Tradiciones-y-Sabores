"""
routers/productos.py
GET /api/productos  → catálogo completo de productos
"""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Producto
from schemas import ProductoOut

router = APIRouter(prefix="/api/productos", tags=["Productos"])


@router.get("", response_model=List[ProductoOut])
def get_productos(db: Session = Depends(get_db)):
    return db.query(Producto).filter(Producto.disponible == True).all()
