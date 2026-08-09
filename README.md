# 🍽️ Tradiciones y Sabores — Sistema de Gestión y POS Multi-Capa

> **Sistema Web Integral de Gestión para Restaurantes:** Punto de Venta (POS), Pantalla Cliente (Menú Digital Autoservicio), Tablero KDS de Cocina, Gestión de Pedidos, Control de Inventario con Alerta de Mínimos, Directorio de Proveedores e Informes Financieros.

[![Despliegue Docker](https://img.shields.io/badge/Despliegue-Portainer%20%7C%20Docker-blue?logo=docker)](http://15.235.37.152/)
[![Backend FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python-009688?logo=fastapi)](http://15.235.37.152:5000/docs)
[![Base de Datos](https://img.shields.io/badge/BD-PostgreSQL%2016-336791?logo=postgresql)](http://15.235.37.152:5000/api/debug)
[![Estado](https://img.shields.io/badge/Estado-Producci%C3%B3n%20100%25%20Operativo-brightgreen)](http://15.235.37.152/)

---

## 🌐 Enlaces de Producción (Servidor VPS)

| Recurso / Módulo | URL de Acceso | Descripción |
|---|---|---|
| 🍽️ **Aplicación Web Principal (Puerto 80)** | **`http://15.235.37.152/`** | Interfaz completa (POS, Cocina, Inventario, Pantalla Cliente) |
| 📚 **Documentación Interactiva API (Swagger)** | **`http://15.235.37.152:5000/docs`** | Documentación y prueba de endpoints FastAPI |
| 🔍 **Verificación de Estado de la BD** | **`http://15.235.37.152:5000/api/debug`** | Diagnóstico en tiempo real de la base de datos |
| 🛠️ **Panel de Administración (Portainer)** | **`https://15.235.37.152:9443/`** | Panel gráfico de Docker (Stack `tradiciones-sabores`) |

---

## 🏗️ Arquitectura de Producción (Despliegue de 3 Capas)

El proyecto está diseñado e implementado bajo una arquitectura de **3 capas aisladas mediante contenedores Docker**, orquestados a través de Docker Compose y Portainer:

```
+-----------------------------------------------------------------------+
|                    CAPA 1: FRONTEND (Puerto 80)                       |
|               React 19 + TypeScript + Vite + Nginx SPA                |
+-----------------------------------------------------------------------+
                                   |
                     Peticiones REST /api/v1/
                                   v
+-----------------------------------------------------------------------+
|                    CAPA 2: BACKEND (Puerto 5000)                      |
|               Python 3.12 + FastAPI + Uvicorn ASGI                    |
+-----------------------------------------------------------------------+
                                   |
                     Conexión ORM SQLAlchemy
                                   v
+-----------------------------------------------------------------------+
|                 CAPA 3: BASE DE DATOS (Puerto 5432)                   |
|                      PostgreSQL 16 Alpine                             |
+-----------------------------------------------------------------------+
```

### 1. Capa 1 — Frontend (React 19 + TypeScript + Vite + Nginx)
- Servido en el puerto **80** mediante Nginx optimizado en Docker.
- Aplicación de una sola página (SPA) responsiva para Desktop, Tablet y Móviles.
- Configurado con proxy inverso transparente para enrutar `/api/v1/` hacia el backend.

### 2. Capa 2 — Backend REST API (Python 3.12 + FastAPI + Uvicorn)
- Corriendo en el puerto **5000**.
- Enrutamiento RESTful modularizado (`ordenes.py`, `productos.py`, `inventario.py`, `proveedores.py`, `reportes.py`).
- Creación automática de esquemas de tablas, semillas de catálogo inicial y cálculo automático de IVA (16%).

### 3. Capa 3 — Base de Datos (PostgreSQL 16 Alpine)
- Corriendo en el puerto **5432** con datos persistentes en volumen Docker (`tradiciones-sabores_postgres_data`).
- Esquema de producción relacional con 7 tablas automáticas (`plato`, `mesa`, `cliente`, `insumo`, `proveedor`, `pedido`, `item_pedido`).

---

## 📦 Módulos del Sistema

1. 🛒 **Punto de Venta (POS / Caja):** Selección de platos, filtro por categorías, tipos de pedido (Mesa, Pickup, Delivery), comanda imprimible y cálculo de IVA (16%).
2. 🖥️ **Pantalla Cliente (Menú Digital Autoservicio):** Vista pública para clientes con catálogo interactivo y seguimiento en tiempo real del estado de la orden (📌 *Recibido* ➔ 🔥 *En Cocina* ➔ ✅ *Listo / Despachado*).
3. 🔥 **Panel de Cocina (KDS):** Tablero para cocineros con alertas de sonido e indicadores visuales de pedidos en espera y en preparación.
4. 📋 **Gestión de Pedidos:** Historial completo de tickets, filtro por fechas/estados y cancelación de órdenes.
5. 📦 **Gestión de Inventario (Almacén):** Control de existencias de ingredientes/insumos, alerta visual de stock bajo (`stock <= stock_minimo`), unidades de medida y protección contra fallos.
6. 🚚 **Gestión de Proveedores:** Registro completo de proveedores con RIF, empresas y datos de contacto.
7. 📊 **Reportes y Analytics:** Indicadores de ingresos brutos, total de ventas, tiempo promedio de preparación y exportación de informes.

---

## 🗂️ Estructura Completa del Repositorio

```
Tradiciones-y-Sabores/
├── backend/                             ← Capa 2: API REST Python / FastAPI
│   ├── database.py                      ← Configuración y conexión PostgreSQL SQLAlchemy
│   ├── main.py                          ← Punto de entrada FastAPI, CORS, semillas y routers
│   ├── models.py                        ← Modelos relacionales ORM SQLAlchemy
│   ├── schemas.py                       ← Esquemas de validación Pydantic v2
│   ├── Dockerfile                       ← Dockerfile optimizado para Python 3.12
│   ├── requirements.txt                 ← Dependencias Python (FastAPI, uvicorn, psycopg2-binary, etc.)
│   ├── tradiciones-sabores-api.service  ← Script de servicio systemd para servidor
│   └── routers/                         ← Endpoints divididos por módulo
│       ├── inventario.py                ← CRUD de stock de insumos
│       ├── ordenes.py                   ← Creación, cambio de estado y eliminación de pedidos
│       ├── productos.py                 ← Catálogo de platos y precios
│       ├── proveedores.py               ← Registro de proveedores
│       └── reportes.py                  ← KPIs y estadísticas del negocio
│
├── src/                                 ← Capa 1: Frontend React / TypeScript
│   ├── App.tsx                          ← Componente raíz y enrutador de vistas
│   ├── main.tsx                         ← Punto de montaje React DOM
│   ├── index.css                        ← Estilos globales e industriales
│   ├── api/
│   │   └── index.ts                     ← Cliente API con mapeadores y resguardos de datos
│   ├── components/
│   │   ├── Sidebar.tsx                  ← Menú de navegación lateral
│   │   ├── TopBar.tsx                   ← Barra superior con reloj Venezuela y botón Pantalla Cliente
│   │   └── Toast.tsx                    ← Notificaciones globales emergentes
│   └── views/
│       ├── PosView.tsx                  ← Punto de venta (POS)
│       ├── CustomerMenuView.tsx         ← Pantalla Cliente (Menú digital y seguimiento)
│       ├── KitchenView.tsx              ← Tablero KDS de cocina
│       ├── OrdersView.tsx               ← Historial de órdenes y tickets
│       ├── InventoryView.tsx            ← Gestión de inventario de insumos
│       ├── SuppliersView.tsx            ← Directorio de proveedores
│       └── ReportsView.tsx              ← Reportes y métricas
│
├── docker-compose.yml                   ← Orquestador de 3 capas Docker
├── Dockerfile                           ← Dockerfile multi-stage para Frontend Nginx
├── nginx.docker.conf                    ← Configuración de servidor Nginx y proxy reverso
├── nginx.conf                           ← Configuración Nginx de respaldo
├── clean_db_orders.py                   ← Script de mantenimiento para vaciar pedidos
├── reset_orders_db.py                   ← Script de reinicio de base de datos
├── fix_postgres_remote.py               ← Script de reparación remota de base de datos
├── package.json                         ← Dependencias del frontend React/Vite
├── tsconfig.json                        ← Configuración TypeScript
├── vite.config.ts                       ← Configuración de compilación Vite
├── README.md                            ← Documentación oficial del proyecto
└── ENTREGA.md                           ← Informe técnico de entrega
```

---

## 🔌 Referencia de Endpoints de la API (`/api/v1/...`)

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/v1/platos` | Lista el catálogo de platos del restaurante |
| `GET` | `/api/v1/ordenes` | Obtiene el listado de pedidos activos |
| `POST` | `/api/v1/ordenes` | Registra un nuevo pedido en PostgreSQL |
| `PUT` | `/api/v1/ordenes/{id}` | Actualiza el estado del pedido (*recibido*, *preparando*, *listo*) |
| `DELETE` | `/api/v1/ordenes/{id}` | Cancela/elimina un pedido |
| `GET` | `/api/v1/inventario` | Obtiene la lista de insumos e ingredientes en stock |
| `POST` | `/api/v1/inventario` | Agrega un nuevo ítem al inventario |
| `PUT` | `/api/v1/inventario/{id}` | Actualiza el stock o costo de un ítem |
| `DELETE` | `/api/v1/inventario/{id}` | Elimina un ítem del inventario |
| `GET` | `/api/v1/proveedores` | Obtiene el directorio de proveedores |
| `GET` | `/api/v1/reportes/resumen` | Retorna los KPIs de ingresos y totales |

---

## 🚀 Ejecución Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/teofilobetancourt/Tradiciones-y-Sabores.git
cd Tradiciones-y-Sabores
```

### 2. Ejecutar mediante Docker Compose (Recomendado)
```bash
docker compose up --build -d
```
Accede localmente a:
- **Frontend:** `http://localhost:80`
- **Backend API:** `http://localhost:5000/docs`
- **PostgreSQL:** `localhost:5432`

---

## 📄 Licencia y Autores

Proyecto desarrollado para el restaurante **Tradiciones y Sabores**.  
*Versión 2.0.0 — Agosto 2026*
