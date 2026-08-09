"""
main.py — Punto de entrada del backend FastAPI
Tradiciones y Sabores — API REST (Integrado con esquema de BD del equipo)
"""
import os
import sys
from contextlib import asynccontextmanager

# Ajustar sys.path para soportar importaciones locales en el entorno serverless de Vercel
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from sqlalchemy import text

from database import engine, Base, SessionLocal
from models import Plato, Mesa, Cliente, CategoriaPlatoEnum, EstadoMesaEnum, Insumo, Proveedor
from routers import ordenes, productos, inventario, proveedores, reportes


load_dotenv()


def seed_initial_data():
    """Siembra datos iniciales de prueba si las tablas están vacías."""
    db = SessionLocal()
    try:
        # 1. Sembrar Platos
        if db.query(Plato).count() == 0:
            platos_seed = [
                Plato(nombre="Hamburguesa Tradiciones Doble", descripcion="Doble carne 150g, queso cheddar, tocineta, salsa especial", precio=12.50, categoria=CategoriaPlatoEnum.plato_principal),
                Plato(nombre="Pizza Margherita Artesanal", descripcion="Masa madre, salsa pomodoro, mozzarella fresca, albahaca", precio=14.00, categoria=CategoriaPlatoEnum.plato_principal),
                Plato(nombre="Tacos de Asada (3 uds)", descripcion="Carne de res marinada, cilantro, cebolla, guacamole", precio=10.00, categoria=CategoriaPlatoEnum.plato_principal),
                Plato(nombre="Tequeños Tradicionales (6 uds)", descripcion="Rellenos de abundante queso paisa con salsa tártara", precio=6.50, categoria=CategoriaPlatoEnum.entrada),
                Plato(nombre="Ensalada César con Pollo", descripcion="Lechuga romana, crutones, queso parmesano y pechuga a la parrilla", precio=8.50, categoria=CategoriaPlatoEnum.entrada),
                Plato(nombre="Tequeños de Nutella (4 uds)", descripcion="Masa crujiente rellena de crema de avellana", precio=5.00, categoria=CategoriaPlatoEnum.postre),
                Plato(nombre="Milkshake de Chocolate", descripcion="Helado de mantecado, sirope de chocolate y crema batida", precio=4.50, categoria=CategoriaPlatoEnum.postre),
                Plato(nombre="Papitas Fritas Trufadas", descripcion="Papas crujientes con aceite de trufa y parmesano", precio=5.50, categoria=CategoriaPlatoEnum.acompanante),
                Plato(nombre="Refresco 500ml", descripcion="Coca-Cola, Pepsi, Chinotto o 7Up", precio=2.00, categoria=CategoriaPlatoEnum.bebida),
                Plato(nombre="Jugo Natural de Parcha", descripcion="Jugo natural recién exprimido", precio=3.00, categoria=CategoriaPlatoEnum.bebida),
            ]
            db.add_all(platos_seed)
            db.commit()
            print("🌱 Platos de prueba creados.")

        # 2. Sembrar Mesas
        if db.query(Mesa).count() == 0:
            mesas_seed = [
                Mesa(capacidad=2, estado=EstadoMesaEnum.disponible, ubicacion="Terraza - M1"),
                Mesa(capacidad=4, estado=EstadoMesaEnum.disponible, ubicacion="Terraza - M2"),
                Mesa(capacidad=4, estado=EstadoMesaEnum.disponible, ubicacion="Salón Principal - M3"),
                Mesa(capacidad=6, estado=EstadoMesaEnum.disponible, ubicacion="Salón Principal - M4"),
                Mesa(capacidad=8, estado=EstadoMesaEnum.disponible, ubicacion="VIP - M5"),
            ]
            db.add_all(mesas_seed)
            db.commit()
            print("🌱 Mesas de prueba creadas.")

        # 3. Sembrar Cliente General
        if db.query(Cliente).count() == 0:
            db.add(Cliente(cedula_cliente="V-00000000", nombre="Cliente General / Consumidor", telefono="04140000000", email="cliente@tradicionesysabores.com", direccion_habitual="Local"))
            db.commit()
            print("🌱 Cliente general creado.")

        # 4. Sembrar Insumos
        if db.query(Insumo).count() == 0:
            db.add_all([
                Insumo(Nombre_Insumo="Carne de Res Molida", Unidad_Medida="Kg", Stock_Actual=25.5, Stock_Minimo=5.0, Punto_Reorden=8.0),
                Insumo(Nombre_Insumo="Queso Cheddar en Lonjas", Unidad_Medida="Paquete", Stock_Actual=15.0, Stock_Minimo=3.0, Punto_Reorden=5.0),
                Insumo(Nombre_Insumo="Papas Congeladas", Unidad_Medida="Kg", Stock_Actual=40.0, Stock_Minimo=10.0, Punto_Reorden=15.0),
            ])
            db.commit()
            print("🌱 Insumos iniciales creados.")

        # 5. Sembrar Proveedores
        if db.query(Proveedor).count() == 0:
            db.add(Proveedor(
                Nombre_Empresa="Distribuidora Alimentos Express C.A.",
                Identificacion_RIF="J-30987654-1",
                Ciudad="Caracas",
                Telefono_Empresa="0212-5551234",
                Email_Empresa="ventas@alimentosexpress.com",
                Direccion="Av. Principal de Los Ruices",
                Nombre_Encargado="Carlos Mendoza"
            ))
            db.commit()
            print("🌱 Proveedor inicial creado.")

    except Exception as e:
        db.rollback()
        print(f"⚠️ Nota en Seed inicial: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Asegurar schema Inventario si se usa PostgreSQL
    try:
        if engine.dialect.name == "postgresql":
            with engine.connect() as conn:
                conn.execute(text('CREATE SCHEMA IF NOT EXISTS "Inventario";'))
                conn.commit()
    except Exception as e:
        print(f"Nota en creación de esquema: {e}")

    try:
        Base.metadata.create_all(bind=engine, checkfirst=True)
        print("✅ Tablas de base de datos creadas/verificadas.")
    except Exception as e:
        print(f"Nota en create_all (las tablas/tipos ya existen): {e}")

    seed_initial_data()
    yield


from fastapi.responses import JSONResponse
import traceback

app = FastAPI(
    title="Tradiciones y Sabores — API",
    description="Backend REST adaptado 100% al esquema de base de datos del equipo.",
    version="1.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "error": str(exc),
            "type": type(exc).__name__,
            "traceback": traceback.format_exc().splitlines()
        }
    )

raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://158.220.100.226,http://localhost:3000")
origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(ordenes.router)
app.include_router(ordenes.router_pedidos)
app.include_router(productos.router)
app.include_router(productos.router_productos)
app.include_router(inventario.router)
app.include_router(proveedores.router)
app.include_router(reportes.router)


@app.get("/", tags=["Health"])
def health_root():
    return {"status": "ok", "servicio": "Tradiciones y Sabores API", "db_integration": "nelrondon/restaurant-bd-tdb"}


@app.get("/api/", tags=["Health"])
def health_api():
    return {"status": "ok", "servicio": "Tradiciones y Sabores API", "version": "1.1.0"}


@app.get("/api/debug", tags=["Health"])
def debug_info():
    db_host = os.getenv("DB_HOST", "NOT_SET").strip()
    db_name = os.getenv("DB_NAME", "NOT_SET").strip()
    db_user = os.getenv("DB_USER", "NOT_SET").strip()
    db_port = os.getenv("DB_PORT", "NOT_SET").strip()
    
    db_status = "UNKNOWN"
    db_error = None
    try:
        from database import SessionLocal
        from models import Plato
        db = SessionLocal()
        count = db.query(Plato).count()
        db.close()
        db_status = f"CONNECTED (Platos count: {count})"
    except Exception as e:
        db_status = "FAILED"
        db_error = f"{type(e).__name__}: {str(e)}"
        
    return {
        "environment": {
            "DB_HOST": db_host,
            "DB_PORT": db_port,
            "DB_NAME": db_name,
            "DB_USER": db_user,
        },
        "db_connection": db_status,
        "db_error": db_error
    }

