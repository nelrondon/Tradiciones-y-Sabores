# 🐍 Tradiciones y Sabores — Backend FastAPI

Servidor REST que expone todos los endpoints consumidos por el frontend React.

---

## Stack

| Componente | Tecnología |
|-----------|-----------|
| Framework | FastAPI + Python 3.11+ |
| ORM | SQLAlchemy 2.x |
| BD | PostgreSQL (psycopg2) |
| Servidor | Uvicorn (ASGI) |
| Proxy | Nginx (enruta /api/ al puerto 5000) |
| Servicio | systemd (arranque automático) |

---

## Estructura

```
backend/
├── main.py                          ← App FastAPI + CORS + lifespan
├── database.py                      ← Conexión SQLAlchemy (lee .env)
├── models.py                        ← Tablas ORM (PostgreSQL)
├── schemas.py                       ← Validación Pydantic
├── routers/
│   ├── ordenes.py                   ← GET/POST/PUT /api/ordenes
│   ├── productos.py                 ← GET /api/productos
│   ├── inventario.py                ← CRUD /api/inventario
│   ├── proveedores.py               ← CRUD /api/proveedores
│   └── reportes.py                  ← GET /api/reportes/*
├── .env.example                     ← Plantilla de configuración
├── requirements.txt                 ← Dependencias Python
└── tradiciones-sabores-api.service  ← Servicio systemd
```

---

## 🗄️ Para el Equipo de Base de Datos

### Paso 1 — Instalar PostgreSQL

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Paso 2 — Crear la Base de Datos

```bash
sudo -u postgres psql << 'EOF'
CREATE DATABASE tradiciones_sabores;
CREATE USER tradiciones_user WITH PASSWORD 'TU_CONTRASEÑA_SEGURA';
GRANT ALL PRIVILEGES ON DATABASE tradiciones_sabores TO tradiciones_user;
\c tradiciones_sabores
GRANT ALL ON SCHEMA public TO tradiciones_user;
EOF
```

### Paso 3 — Crear el archivo `.env`

```bash
cp /opt/tradiciones-sabores/backend/.env.example /opt/tradiciones-sabores/backend/.env
nano /opt/tradiciones-sabores/backend/.env
```

Rellenar con los valores reales:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tradiciones_sabores
DB_USER=tradiciones_user
DB_PASSWORD=TU_CONTRASEÑA_SEGURA
API_PORT=5000
CORS_ORIGINS=http://158.220.100.226,http://localhost:5173
```

### Paso 4 — Notificar al equipo de backend

Una vez que el `.env` esté configurado, avisar para reiniciar el servicio:

```bash
# El equipo de backend ejecutará esto:
sudo systemctl restart tradiciones-sabores-api
sudo systemctl status tradiciones-sabores-api
```

---

## 🐍 Para el Equipo de Backend

### Despliegue inicial (desde Windows)

```powershell
# 1. Asegúrate de tener .deploy.env configurado
# 2. Ejecutar:
.\deploy-backend.ps1
```

El script hace automáticamente:
- Sube todos los archivos del backend al servidor
- Crea el virtualenv Python
- Instala dependencias (`requirements.txt`)
- Configura y habilita el servicio systemd
- Recarga Nginx

### Reiniciar el servicio (después de que el equipo de BD configure el .env)

```powershell
.\deploy-backend.ps1 -Restart
```

### Solo subir cambios de código (sin reinstalar dependencias)

```powershell
.\deploy-backend.ps1 -SkipInstall
```

---

## Arranque manual en el servidor (alternativa)

```bash
cd /opt/tradiciones-sabores/backend
source venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 5000 --workers 2
```

---

## Verificar que funciona

Una vez corriendo, el backend es accesible en:

- **API:** `http://158.220.100.226/api/ordenes` (a través de Nginx)
- **Swagger UI:** `http://158.220.100.226/docs`
- **Health check:** `http://158.220.100.226/api/` → `{"status": "ok"}`

---

## Logs del servicio

```bash
# Ver últimas 50 líneas del log
sudo journalctl -u tradiciones-sabores-api -n 50

# Seguir el log en tiempo real
sudo journalctl -u tradiciones-sabores-api -f
```

---

## Tablas que se crean automáticamente

> **No es necesario crear las tablas manualmente.**  
> Al arrancar el backend por primera vez, SQLAlchemy las crea solas en la BD vacía.

| Tabla | Descripción |
|-------|-------------|
| `productos` | Catálogo del menú |
| `pedidos` | Órdenes con cliente y totales |
| `items_pedido` | Ítems de cada orden |
| `inventario` | Stock de ingredientes |
| `proveedores` | Directorio de proveedores |

---

## Endpoints API

| Método | Ruta | Función |
|--------|------|---------|
| GET | `/api/ordenes` | Todas las órdenes |
| GET | `/api/ordenes?estatus=activo` | Solo activas (cocina) |
| POST | `/api/ordenes` | Crear orden |
| PUT | `/api/ordenes/{id}` | Cambiar estatus |
| GET | `/api/productos` | Catálogo disponible |
| GET/POST | `/api/inventario` | Inventario |
| PUT/DELETE | `/api/inventario/{id}` | Editar/eliminar |
| GET/POST | `/api/proveedores` | Proveedores |
| PUT/DELETE | `/api/proveedores/{id}` | Editar/eliminar |
| GET | `/api/reportes/resumen` | KPIs |
| GET | `/api/reportes/pedidos` | Tabla con filtros |

---

*Tradiciones y Sabores — Sistema de Gestión v1.0*
