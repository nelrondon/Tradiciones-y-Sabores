"""
database.py — Conexión a PostgreSQL via SQLAlchemy
Con fallback a SQLite si PostgreSQL no está disponible.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv(override=False)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "restaurant_equis")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")

POSTGRES_URL = (
    f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# Intento de conexión directo (sin reintentos con sleep — incompatible con serverless)
try:
    engine = create_engine(
        POSTGRES_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        connect_args={"connect_timeout": 5},
    )
    with engine.connect() as conn:
        pass
    print(f"⚡ Conectado exitosamente a PostgreSQL en {DB_HOST}:{DB_PORT}.")
except Exception as e:
    print(f"⚠️ PostgreSQL no respondió ({e}). Usando SQLite local.")
    SQLITE_URL = "sqlite:///./restaurant_equis.db"
    engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency de FastAPI — provee una sesión de BD por request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
