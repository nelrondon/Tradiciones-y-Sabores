"""
database.py — Conexión a PostgreSQL via SQLAlchemy
Optimizado para entornos serverless (Vercel) y tradicionales (VPS/Docker).
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv

load_dotenv(override=False)

DB_HOST     = os.getenv("DB_HOST", "localhost")
DB_PORT     = os.getenv("DB_PORT", "5432")
DB_NAME     = os.getenv("DB_NAME", "restaurant_equis")
DB_USER     = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")

POSTGRES_URL = (
    f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# NullPool: no reutiliza conexiones entre requests — NECESARIO en serverless
# Cada request abre y cierra su propia conexión limpia
engine = create_engine(
    POSTGRES_URL,
    poolclass=NullPool,
    connect_args={"connect_timeout": 10},
)

print(f"⚡ Motor PostgreSQL configurado → {DB_HOST}:{DB_PORT}/{DB_NAME}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency de FastAPI — provee una sesión de BD por request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
