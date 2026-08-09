# 🍽️ Tradiciones y Sabores — Sistema de Gestión
**Versión:** 1.0.0 | **Julio 2026**

---

## 🌐 Acceso al sistema

**URL del sistema:**
```
http://tradicionesysabores.158.220.100.226.nip.io
```

**Documentación de la API (Swagger):**
```
http://tradicionesysabores.158.220.100.226.nip.io/api/docs
```

---

## 🛠️ Stack Tecnológico

### Frontend
| Tecnología | Versión | Rol |
|-----------|---------|-----|
| **React** | 19 | Framework de UI — componentes reutilizables |
| **TypeScript** | 5.x | Lenguaje tipado (superconjunto de JavaScript) |
| **Vite** | 6.x | Compilador y servidor de desarrollo |
| **Tailwind CSS** | 4.x | Framework de estilos utilitarios |
| **Lucide React** | — | Librería de íconos SVG |

**Lenguaje:** TypeScript (`.tsx`)  
**Diseño:** Responsivo — funciona en desktop, tablet y móvil

---

### Backend
| Tecnología | Versión | Rol |
|-----------|---------|-----|
| **Python** | 3.11+ | Lenguaje del servidor |
| **FastAPI** | 0.110+ | Framework REST — define todos los endpoints `/api/` |
| **SQLAlchemy** | 2.x | ORM — mapea las tablas PostgreSQL a objetos Python |
| **Pydantic** | 2.x | Validación automática del JSON entrante |
| **Uvicorn** | — | Servidor ASGI — ejecuta FastAPI en el puerto 5000 |

**Lenguaje:** Python (`.py`)  
**Patrón:** API REST — respuestas en JSON

---

### Base de Datos
| Tecnología | Rol |
|-----------|-----|
| **PostgreSQL 15+** | Motor relacional — almacena todos los datos del restaurante |
| **SQL** | Las tablas se crean automáticamente al arrancar el backend |

**Tablas:** `PEDIDO` · `ITEM_PEDIDO` · `PRODUCTO` · `INVENTARIO` · `PROVEEDOR`

---

### Infraestructura
| Tecnología | Rol |
|-----------|-----|
| **Nginx** | Servidor web — sirve el frontend y hace proxy de `/api/` al backend |
| **systemd** | Mantiene el backend activo y lo reinicia si falla |
| **Linux (Ubuntu/Debian)** | Sistema operativo del servidor VPS |
| **nip.io** | DNS automático — convierte la IP en un link accesible |

**Servidor:** `158.220.100.226`

---

### Integraciones
| Integración | Estado | Rol |
|------------|--------|-----|
| **WhatsApp** (wa.me) | ✅ Activo | El POS genera el mensaje y el cajero lo envía |
| **WhatsApp Business API** | 🔄 Pendiente (equipo n8n) | Envío automático sin intervención del cajero |
| **n8n** | 🔄 Pendiente (equipo n8n) | Motor de automatización del flujo de WhatsApp |
| **PostgreSQL** | 🔄 Pendiente (equipo BD) | Almacenamiento de datos de producción |

---

## 📦 Módulos del sistema

| Módulo | Usuarios | Función |
|--------|---------|---------|
| **POS — Caja** | Cajeros | Tomar pedidos, calcular totales, enviar a cocina |
| **Cocina** | Cocineros | Ver órdenes activas, marcar como preparando/listo |
| **Pedidos** | Supervisores | Historial completo, cancelar órdenes |
| **Inventario** | Almacén | Gestión de stock con alertas de mínimos |
| **Proveedores** | Compras | Directorio de proveedores con RIF y contacto |
| **Reportes** | Gerencia | KPIs, ingresos, exportar CSV |

---

## 📁 Documentos del proyecto

| Archivo | Para quién |
|---------|-----------|
| `PARA_EQUIPO_BD.md` | Equipo de Base de Datos |
| `PARA_EQUIPO_N8N.md` | Equipo de n8n / WhatsApp |
| `backend/README.md` | Administrador del servidor |
| `backend/.env.example` | Plantilla de configuración |

---

*Stack: React 19 · TypeScript · Vite · Tailwind CSS 4 · Python 3.11 · FastAPI · SQLAlchemy · PostgreSQL · Nginx · systemd · Linux*
