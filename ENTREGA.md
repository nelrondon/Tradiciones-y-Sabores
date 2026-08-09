# 🍽️ Tradiciones y Sabores — Informe de Entrega de Producción
**Versión:** 2.0.0 | **Agosto 2026**

---

## 🌐 Acceso al Sistema de Producción

| Módulo / Recurso | URL |
|---|---|
| **Sistema Web Principal (Puerto 80)** | `http://15.235.37.152/` |
| **Menú Digital para Clientes** | `http://15.235.37.152/?view=menu` |
| **Documentación de la API (Swagger)** | `http://15.235.37.152:5000/docs` |
| **Verificación de Base de Datos** | `http://15.235.37.152:5000/api/debug` |
| **Panel Portainer (Docker UI)** | `https://15.235.37.152:9443/` |

---

## 🛠️ Stack Tecnológico de Producción

### 1. Frontend (Capa 1)
| Tecnología | Versión | Rol |
|-----------|---------|-----|
| **React** | 19 | Framework de UI — componentes reutilizables |
| **TypeScript** | 5.x | Lenguaje tipado |
| **Vite** | 6.x | Compilador y empaquetador de producción |
| **Vanilla / Tailwind CSS** | 4.x | Framework de estilos utilitarios e industriales |
| **Lucide React** | — | Librería de íconos SVG |
| **Nginx** | 1.27 / Alpine | Servidor web HTTP y proxy reverso |

---

### 2. Backend (Capa 2)
| Tecnología | Versión | Rol |
|-----------|---------|-----|
| **Python** | 3.12 | Lenguaje de programación backend |
| **FastAPI** | 0.110+ | Framework REST para endpoints `/api/v1/` |
| **SQLAlchemy** | 2.x | ORM — mapeo de tablas relacionales en PostgreSQL |
| **Pydantic** | 2.x | Validación automática del JSON |
| **Uvicorn** | — | Servidor ASGI — ejecuta la API en el puerto 5000 |

---

### 3. Base de Datos (Capa 3)
| Tecnología | Rol |
|-----------|-----|
| **PostgreSQL 16 Alpine** | Motor relacional — almacena todos los datos de produccion |
| **SQL / Auto-Migración** | Esquema automático creado al iniciar la API |

**Tablas Relacionales:** `plato` · `mesa` · `cliente` · `insumo` · `proveedor` · `pedido` · `item_pedido`

---

## 📦 Módulos del Sistema

| Módulo | Usuarios | Función |
|--------|---------|---------|
| **POS — Caja** | Cajeros | Tomar pedidos, calcular totales con IVA (16%), generar comanda |
| **Pantalla Cliente** | Clientes / Caja | Menú digital interactivo y seguimiento en vivo del ticket |
| **Cocina (KDS)** | Cocineros | Ver órdenes activas, marcar como *preparando* / *listo* |
| **Pedidos** | Supervisores | Historial completo de tickets, cancelar órdenes |
| **Inventario** | Almacén | Gestión de stock con alertas visuales de mínimos (`stock <= stock_minimo`) |
| **Proveedores** | Compras | Directorio de proveedores con RIF y contacto |
| **Reportes** | Gerencia | KPIs, ingresos brutos, tiempo promedio y analítica |

---

*Despliegue Multi-Capa en Docker — Tradiciones y Sabores — Agosto 2026*
