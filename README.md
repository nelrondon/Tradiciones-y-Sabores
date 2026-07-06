# 🍽️ Restaurante Equis — Sistema de Gestión
> Sistema web completo para gestión de restaurante: POS, Cocina, Inventario, Proveedores y Reportes.

**🌐 Sistema en producción:** [`http://restauranteequis.158.220.100.226.nip.io`](http://restauranteequis.158.220.100.226.nip.io)

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19 · TypeScript · Vite 6 · Tailwind CSS 4 |
| **Backend** | Python 3.11 · FastAPI · SQLAlchemy · Pydantic · Uvicorn |
| **Base de datos** | PostgreSQL 15+ |
| **Servidor web** | Nginx (reverse proxy + SPA) |
| **Infraestructura** | Linux · systemd · nip.io |

**Diseño:** Responsivo — funciona en desktop, tablet y móvil

---

## 📦 Módulos

| Módulo | Usuarios | Función |
|--------|---------|---------|
| **POS — Caja** | Cajeros | Catálogo, carrito, tipos de pedido, WhatsApp |
| **Cocina** | Cocineros | Órdenes activas, cambio de estado, sonido de alerta |
| **Pedidos** | Supervisores | Historial completo, cancelar órdenes |
| **Inventario** | Almacén | CRUD de stock con alertas de mínimos |
| **Proveedores** | Compras | CRUD del directorio con RIF y contacto |
| **Reportes** | Gerencia | KPIs, ingresos, exportar CSV |

---

## 🚀 Correr localmente

### Requisitos
- Node.js 18+
- Python 3.11+

### Frontend
```bash
npm install
npm run dev
# Disponible en http://localhost:3000
```

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # llenar con las credenciales de PostgreSQL
uvicorn main:app --reload --port 5000
```

### Variables de entorno (`.env.local` en la raíz)
```env
VITE_API_URL=http://localhost:5000
VITE_WHATSAPP_NUMERO=584140000000
```

---

## 🔌 API REST — Endpoints

**Documentación interactiva (Swagger):** `/api/docs`

| Método | Endpoint | Descripción |
|--------|---------|-------------|
| `GET` | `/api/` | Health check |
| `GET` | `/api/ordenes` | Todas las órdenes |
| `GET` | `/api/ordenes?estatus=activo` | Órdenes activas (cocina) |
| `POST` | `/api/ordenes` | Crear nueva orden |
| `PUT` | `/api/ordenes/{id}` | Cambiar estado |
| `DELETE` | `/api/ordenes/{id}` | Cancelar orden |
| `GET` | `/api/productos` | Catálogo de productos |
| `GET` | `/api/inventario` | Lista de inventario |
| `POST` | `/api/inventario` | Agregar ítem |
| `PUT` | `/api/inventario/{id}` | Editar ítem |
| `DELETE` | `/api/inventario/{id}` | Eliminar ítem |
| `GET` | `/api/proveedores` | Lista de proveedores |
| `POST` | `/api/proveedores` | Agregar proveedor |
| `PUT` | `/api/proveedores/{id}` | Editar proveedor |
| `DELETE` | `/api/proveedores/{id}` | Eliminar proveedor |
| `GET` | `/api/reportes/resumen` | KPIs del dashboard |
| `GET` | `/api/reportes/pedidos` | Pedidos con filtros |

---

## 🗂️ Estructura del proyecto

```
Restaurant-Equis/
├── backend/
│   ├── main.py              ← Punto de entrada FastAPI
│   ├── database.py          ← Conexión a PostgreSQL
│   ├── models.py            ← Tablas ORM
│   ├── schemas.py           ← Validación Pydantic
│   ├── routers/             ← Endpoints por módulo
│   │   ├── ordenes.py
│   │   ├── productos.py
│   │   ├── inventario.py
│   │   ├── proveedores.py
│   │   └── reportes.py
│   ├── .env.example         ← Plantilla de configuración
│   └── requirements.txt
│
├── src/
│   ├── api/index.ts         ← Capa de comunicación con el backend
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx       ← Reloj hora Venezuela
│   │   └── Toast.tsx        ← Notificaciones globales
│   └── views/
│       ├── PosView.tsx
│       ├── KitchenView.tsx
│       ├── OrdersView.tsx
│       ├── InventoryView.tsx
│       ├── SuppliersView.tsx
│       └── ReportsView.tsx
│
├── nginx.conf               ← Config del servidor web
├── deploy.py                ← Script de despliegue automático
├── PARA_EQUIPO_BD.md        ← Instrucciones para el equipo de BD
├── PARA_EQUIPO_N8N.md       ← Instrucciones para el equipo de n8n
└── ENTREGA.md               ← Documentación del proyecto
```

---

## 🌐 Despliegue en producción

```bash
# Build del frontend
npm run build

# Subir al servidor automáticamente
python deploy.py
```

---

*Versión 1.0.0 — Julio 2026*
