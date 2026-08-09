# 🍽️ Tradiciones y Sabores — Sistema de Gestión

> Sistema web de gestión para restaurante: POS, Cocina, Inventario, Proveedores y Reportes.

---

## ⚠️ PENDIENTE PARA TERMINAR EL DESPLIEGUE EN VERCEL

> **Leer esto primero si retomas el proyecto.**

### Qué falta para que Vercel funcione 100%

El frontend está desplegado en Vercel pero **necesita conectarse al backend de los compañeros**.
La arquitectura es:

```
Frontend (Vercel)  →  Backend Node.js (compañeros)  →  PostgreSQL (BD de los compañeros)
```

El frontend NO toca la BD directamente. Solo habla con la API de los compañeros.

### Pasos pendientes:

**1. Pedirle a los compañeros del backend:**
- [ ] ¿En qué URL/IP tienen corriendo el backend Node.js? (ej: `http://1.2.3.4:3000`)
- [ ] ¿Cuál es la `API_KEY` que configuraron en su `.env`?

**2. Ir a Vercel → Settings → Environment Variables y agregar:**

| Variable | Valor que te pasan los compañeros |
|---|---|
| `VITE_API_URL` | URL del backend (ej: `http://1.2.3.4:3000`) |
| `VITE_API_KEY` | La API Key del backend de los compañeros |

**3. Hacer Redeploy en Vercel** después de guardar las variables.

### ¿Por qué falta esto?
Los compañeros manejan su propio backend y BD.
Sin la URL y API Key de ellos, el front en Vercel no sabe a dónde enviar las peticiones.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19 · TypeScript · Vite 6 · Tailwind CSS 4 |
| **Backend** | Node.js · Express (manejado por equipo de BD) |
| **Base de datos** | PostgreSQL 15+ (manejada por equipo de BD) |
| **Despliegue frontend** | Vercel |

**Diseño:** Responsivo — funciona en desktop, tablet y móvil

---

## 📦 Módulos

| Módulo | Usuarios | Función |
|--------|---------|---------||
| **POS — Caja** | Cajeros | Catálogo, carrito, tipos de pedido, WhatsApp |
| **Cocina** | Cocineros | Órdenes activas, cambio de estado, sonido de alerta |
| **Pedidos** | Supervisores | Historial completo, cancelar órdenes |
| **Inventario** | Almacén | CRUD de stock con alertas de mínimos |
| **Proveedores** | Compras | CRUD del directorio con RIF y contacto |
| **Reportes** | Gerencia | KPIs, ingresos, exportar CSV |

---

## 🚀 Correr localmente (solo frontend)

### Requisitos
- Node.js 18+

### 1. Instalar dependencias
```bash
npm install
```

### 2. Crear archivo `.env` en la raíz del proyecto
```env
# URL del backend de los compañeros (pídela a ellos)
VITE_API_URL=http://localhost:3000

# API Key del backend de los compañeros (pídela a ellos)
VITE_API_KEY=tu_api_key_aqui

# WhatsApp del restaurante (con código de país, sin signos)
VITE_WHATSAPP_NUMERO=584140000000
```

### 3. Correr el dev server
```bash
npm run dev
# Disponible en http://localhost:5173
```

---

## 🔌 API del backend (endpoints de los compañeros)

El frontend consume la API de los compañeros en `/api/v1/...`

| Método | Endpoint | Auth | Descripción |
|--------|---------|------|-------------|
| `GET`  | `/api/v1/ordenes` | Pública | Todas las órdenes |
| `GET`  | `/api/v1/ordenes?estatus=activo` | Pública | Órdenes activas (cocina) |
| `POST` | `/api/v1/ordenes` | Pública | Crear nueva orden |
| `PUT`  | `/api/v1/ordenes/{id}` | Pública | Cambiar estado |
| `DELETE` | `/api/v1/ordenes/{id}` | Pública | Cancelar orden (soft-delete) |
| `GET`  | `/api/v1/platos` | `x-api-key` | Catálogo de platos |
| `GET`  | `/api/v1/inventario` | `x-api-key` | Lista de insumos |
| `POST` | `/api/v1/inventario` | `x-api-key` | Agregar insumo |
| `PUT`  | `/api/v1/inventario/{id}` | `x-api-key` | Editar insumo |
| `DELETE` | `/api/v1/inventario/{id}` | `x-api-key` | Eliminar insumo |
| `GET`  | `/api/v1/reportes/resumen` | `x-api-key` | KPIs del dashboard |
| `GET`  | `/api/v1/reportes/pedidos` | `x-api-key` | Pedidos con filtros |

> **Nota:** Los endpoints con `x-api-key` requieren el header `x-api-key: <API_KEY>` en cada request.
> La API Key viene del `.env` del backend de los compañeros.

---

## 🗂️ Estructura del proyecto (solo frontend)

```
Tradiciones-y-Sabores/
├── src/
│   ├── api/index.ts         ← Capa de comunicación con el backend de los compañeros
│   ├── components/
│   │   ├── Sidebar.tsx      ← Navegación lateral
│   │   ├── TopBar.tsx       ← Barra superior con reloj Venezuela
│   │   └── Toast.tsx        ← Notificaciones globales
│   └── views/
│       ├── PosView.tsx         ← Punto de venta / caja
│       ├── KitchenView.tsx     ← Tablero de cocina
│       ├── OrdersView.tsx      ← Historial de pedidos
│       ├── InventoryView.tsx   ← Inventario
│       ├── SuppliersView.tsx   ← Proveedores
│       ├── CustomerMenuView.tsx ← Menú digital para clientes
│       └── ReportsView.tsx     ← Reportes y KPIs
│
├── .env.example             ← Variables de entorno necesarias
├── index.html               ← Punto de entrada HTML
├── vite.config.ts           ← Config de Vite
└── package.json
```

---

*Versión 2.0.0 — Agosto 2026 — Tradiciones y Sabores*
