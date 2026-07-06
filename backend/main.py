"""
main.py — Punto de entrada del backend FastAPI
Restaurant Equis — API REST
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import engine, Base
from routers import ordenes, productos, inventario, proveedores, reportes

load_dotenv()

# ─────────────────────────────────────────────────────────────
# Crear todas las tablas al arrancar (si no existen)
# ─────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas verificadas/creadas en PostgreSQL")
    yield


# ─────────────────────────────────────────────────────────────
# App
# ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="Restaurant Equis — API",
    description="Backend REST para el sistema de gestión del Restaurante Equis.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — permite que el frontend (React) consuma la API
raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://158.220.100.226")
origins = [o.strip() for o in raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────
# Registrar routers
# ─────────────────────────────────────────────────────────────
app.include_router(ordenes.router)
app.include_router(productos.router)
app.include_router(inventario.router)
app.include_router(proveedores.router)
app.include_router(reportes.router)


@app.get("/", tags=["Health"])
def health_root():
    return {"status": "ok", "servicio": "Restaurant Equis API"}


@app.get("/api/", tags=["Health"])
def health_api():
    """Health check accesible a través del reverse proxy de Nginx."""
    return {"status": "ok", "servicio": "Restaurant Equis API", "version": "1.0.0"}
