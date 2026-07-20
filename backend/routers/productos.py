"""
routers/productos.py / routers/platos.py
GET /api/platos & GET /api/productos → catálogo de platos del menú
POST /api/platos → registrar nuevo plato
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Plato, CategoriaPlatoEnum
from schemas import PlatoOut, PlatoIn

router = APIRouter(prefix="/api/platos", tags=["Platos"])
router_productos = APIRouter(prefix="/api/productos", tags=["Productos / Platos"])


@router.get("", response_model=List[PlatoOut])
@router_productos.get("", response_model=List[dict])
def get_platos(categoria: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Plato)
    if categoria:
        query = query.filter(Plato.categoria == categoria)
    platos = query.all()

    # Formato adaptado para compatibilidad con código anterior si consulta /api/productos
    result = []
    for p in platos:
        result.append({
            "id_producto": p.id_plato,
            "id_plato": p.id_plato,
            "nombre": p.nombre,
            "descripcion": p.descripcion or "",
            "precio": float(p.precio),
            "categoria": p.categoria.value if hasattr(p.categoria, 'value') else str(p.categoria),
            "disponible": True
        })
    return result

@router.post("", response_model=PlatoOut, status_code=status.HTTP_201_CREATED)
def crear_plato(data: PlatoIn, db: Session = Depends(get_db)):
    nuevo = Plato(
        nombre=data.nombre,
        descripcion=data.descripcion,
        precio=data.precio,
        categoria=data.categoria
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo
