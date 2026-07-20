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

router = APIRouter(prefix="/api/proveedores", tags=["Proveedores"])


def format_proveedor(p: Proveedor) -> dict:
    return {
        "id_proveedor": p.ID_Proveedor,
        "ID_Proveedor": p.ID_Proveedor,
        "nombre": p.Nombre_Empresa,
        "Nombre_Empresa": p.Nombre_Empresa,
        "rif": p.Identificacion_RIF,
        "Identificacion_RIF": p.Identificacion_RIF,
        "contacto": p.Nombre_Encargado,
        "Nombre_Encargado": p.Nombre_Encargado,
        "telefono": p.Telefono_Empresa,
        "Telefono_Empresa": p.Telefono_Empresa,
        "email": p.Email_Empresa,
        "Email_Empresa": p.Email_Empresa,
        "Ciudad": p.Ciudad,
        "Direccion": p.Direccion
    }


@router.get("")
def get_proveedores(db: Session = Depends(get_db)):
    proveedores = db.query(Proveedor).order_by(Proveedor.Nombre_Empresa).all()
    return [format_proveedor(p) for p in proveedores]


@router.post("", status_code=201)
def crear_proveedor(data: dict, db: Session = Depends(get_db)):
    nombre = data.get("nombre") or data.get("Nombre_Empresa") or "Proveedor Desconocido"
    rif = data.get("rif") or data.get("Identificacion_RIF") or "J-00000000-0"
    contacto = data.get("contacto") or data.get("Nombre_Encargado") or "Encargado General"
    telefono = data.get("telefono") or data.get("Telefono_Empresa") or "0000000000"
    email = data.get("email") or data.get("Email_Empresa") or f"contacto_{hash(nombre) % 10000}@proveedor.com"
    ciudad = data.get("Ciudad") or "Caracas"
    direccion = data.get("Direccion") or "Dirección Principal"

    proveedor = Proveedor(
        Nombre_Empresa=nombre,
        Identificacion_RIF=rif,
        Nombre_Encargado=contacto,
        Telefono_Empresa=telefono,
        Email_Empresa=email,
        Ciudad=ciudad,
        Direccion=direccion
    )
    db.add(proveedor)
    db.commit()
    db.refresh(proveedor)
    return format_proveedor(proveedor)


@router.put("/{id_proveedor}")
def update_proveedor(id_proveedor: int, data: dict, db: Session = Depends(get_db)):
    proveedor = db.query(Proveedor).filter(Proveedor.ID_Proveedor == id_proveedor).first()
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    
    if "nombre" in data or "Nombre_Empresa" in data:
        proveedor.Nombre_Empresa = data.get("nombre") or data.get("Nombre_Empresa")
    if "rif" in data or "Identificacion_RIF" in data:
        proveedor.Identificacion_RIF = data.get("rif") or data.get("Identificacion_RIF")
    if "contacto" in data or "Nombre_Encargado" in data:
        proveedor.Nombre_Encargado = data.get("contacto") or data.get("Nombre_Encargado")
    if "telefono" in data or "Telefono_Empresa" in data:
        proveedor.Telefono_Empresa = data.get("telefono") or data.get("Telefono_Empresa")
    if "email" in data or "Email_Empresa" in data:
        proveedor.Email_Empresa = data.get("email") or data.get("Email_Empresa")

    db.commit()
    db.refresh(proveedor)
    return format_proveedor(proveedor)


@router.delete("/{id_proveedor}", status_code=204)
def delete_proveedor(id_proveedor: int, db: Session = Depends(get_db)):
    proveedor = db.query(Proveedor).filter(Proveedor.ID_Proveedor == id_proveedor).first()
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    db.delete(proveedor)
    db.commit()
