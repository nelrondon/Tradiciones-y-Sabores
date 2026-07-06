# 🗄️ Restaurante Equis — Documento para el Equipo de Base de Datos
### Lo que necesitamos de ustedes | Julio 2026

---

## Su misión

Crear y configurar la base de datos PostgreSQL en el servidor para que el sistema de gestión del restaurante pueda almacenar pedidos, productos, inventario y proveedores.

**El sistema ya está desplegado y funcionando visualmente en:** `http://restauranteequis.158.220.100.226.nip.io/`  
Solo falta la conexión a la base de datos para que los datos persistan.

---

## ✅ Pasos que deben seguir (en orden)

### Paso 1 — Crear la base de datos y el usuario

Conectarse a PostgreSQL en el servidor y ejecutar:

```sql
-- Crear la base de datos
CREATE DATABASE restaurant_equis;

-- Crear el usuario de la aplicación
CREATE USER equis_user WITH PASSWORD 'DEFINAN_UNA_CLAVE_SEGURA';

-- Darle todos los permisos sobre la base de datos
GRANT ALL PRIVILEGES ON DATABASE restaurant_equis TO equis_user;

-- Conectarse a la BD para dar permisos sobre el esquema
\c restaurant_equis
GRANT ALL ON SCHEMA public TO equis_user;
```

---

### Paso 2 — Entregar las credenciales

Una vez creada la BD, entregarnos los siguientes datos (por el canal seguro acordado):

```
DB_HOST=         (IP o hostname del servidor PostgreSQL)
DB_PORT=         (normalmente 5432)
DB_NAME=         restaurant_equis
DB_USER=         equis_user
DB_PASSWORD=     (la clave que definieron en el Paso 1)
```

Con esos datos nosotros configuramos el backend. **Las tablas se crean automáticamente** al arrancar el sistema, no necesitan crearlas manualmente.

---

### Paso 3 — Cargar productos iniciales (cuando el sistema esté activo)

Una vez que el backend esté conectado y las tablas creadas, deben cargar el catálogo de productos. Ejemplo de estructura:

```sql
INSERT INTO producto (nombre, descripcion, precio, categoria, imagen_url, disponible)
VALUES
  ('Hamburguesa Clásica',  'Carne 200g, lechuga, tomate, queso',   8.50, 'Hamburguesas', NULL, true),
  ('Hamburguesa Especial', 'Doble carne, tocino, salsa especial',  12.00, 'Hamburguesas', NULL, true),
  ('Papas Fritas',         'Porción grande crujiente',              3.00, 'Acompañantes', NULL, true),
  ('Refresco 350ml',       'Coca-Cola, Pepsi, Malta o Jugo',        1.50, 'Bebidas',      NULL, true),
  ('Agua',                 'Botella 500ml',                         1.00, 'Bebidas',      NULL, true);
-- Agregar todos los productos reales del restaurante
```

---

## 📐 Estructura de las tablas (referencia)

Las tablas se crean automáticamente, pero aquí está la estructura para su referencia:

### Tabla `PEDIDO`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id_pedido | SERIAL PK | ID autoincremental |
| hora_creacion | TIMESTAMP | Fecha/hora del pedido |
| cliente_nombre | VARCHAR(200) | Nombre del cliente (obligatorio) |
| cliente_cedula | VARCHAR(20) | Cédula/RIF (opcional) |
| cliente_telefono | VARCHAR(30) | Teléfono (opcional) |
| tipo | ENUM | 'mesa', 'pickup', 'delivery' |
| mesa | INTEGER | Número de mesa (si tipo=mesa) |
| direccion | TEXT | Dirección (si tipo=delivery) |
| subtotal | NUMERIC(10,2) | Monto sin IVA |
| iva | NUMERIC(10,2) | IVA (16%) |
| total | NUMERIC(10,2) | Total a pagar |
| Estatus_Orden | ENUM | 'Recibido', 'Preparando', 'Listo' |

### Tabla `ITEM_PEDIDO`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id_item | SERIAL PK | ID autoincremental |
| id_pedido | FK → PEDIDO | Pedido al que pertenece |
| id_producto | FK → PRODUCTO | Producto ordenado |
| nombre | VARCHAR(200) | Nombre al momento de la venta |
| cantidad | INTEGER | Cantidad |
| precio_unitario | NUMERIC(10,2) | Precio unitario al momento de venta |
| notas | TEXT | Notas especiales (ej: "SIN CEBOLLA") |

### Tabla `PRODUCTO`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id_producto | SERIAL PK | ID autoincremental |
| nombre | VARCHAR(200) | Nombre del producto |
| descripcion | TEXT | Descripción |
| precio | NUMERIC(10,2) | Precio de venta |
| categoria | VARCHAR(100) | Categoría (agrupa en el POS) |
| imagen_url | VARCHAR(500) | URL de la imagen (opcional) |
| disponible | BOOLEAN | Si aparece en el catálogo |

### Tabla `INVENTARIO`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id_inventario | SERIAL PK | ID autoincremental |
| nombre | VARCHAR(200) | Nombre del ingrediente |
| stock | NUMERIC(10,3) | Cantidad actual |
| unidad | VARCHAR(50) | kg, g, L, unidad, etc. |
| precio_costo | NUMERIC(10,2) | Costo por unidad |
| stock_minimo | NUMERIC(10,3) | Alerta de stock bajo |

### Tabla `PROVEEDOR`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id_proveedor | SERIAL PK | ID autoincremental |
| nombre | VARCHAR(200) | Razón social |
| rif | VARCHAR(20) | RIF fiscal |
| contacto | VARCHAR(200) | Nombre del contacto |
| telefono | VARCHAR(30) | Teléfono |
| email | VARCHAR(200) | Email (opcional) |

---

## 📡 Endpoints disponibles para consulta directa

Una vez conectado el backend, pueden verificar que todo funciona accediendo a:

**Documentación interactiva (Swagger UI):**
```
http://restauranteequis.158.220.100.226.nip.io/api/docs
```

**Health check:**
```
GET http://restauranteequis.158.220.100.226.nip.io/api/
→ {"status": "ok", "servicio": "Restaurant Equis API"}
```

**Todos los endpoints:**

| Método | URL | Descripción |
|--------|-----|-------------|
| GET | `/api/ordenes` | Todas las órdenes |
| GET | `/api/ordenes?estatus=activo` | Solo Recibido + Preparando |
| POST | `/api/ordenes` | Crear nueva orden |
| PUT | `/api/ordenes/{id}` | Cambiar estado de orden |
| DELETE | `/api/ordenes/{id}` | Cancelar orden (si no está Listo) |
| GET | `/api/productos` | Catálogo de productos |
| GET | `/api/inventario` | Lista de inventario |
| POST | `/api/inventario` | Agregar ítem |
| PUT | `/api/inventario/{id}` | Editar ítem |
| DELETE | `/api/inventario/{id}` | Eliminar ítem |
| GET | `/api/proveedores` | Lista de proveedores |
| POST | `/api/proveedores` | Agregar proveedor |
| PUT | `/api/proveedores/{id}` | Editar proveedor |
| DELETE | `/api/proveedores/{id}` | Eliminar proveedor |
| GET | `/api/reportes/resumen` | KPIs del dashboard |
| GET | `/api/reportes/pedidos` | Pedidos con filtros |

---

## 📞 Punto de contacto

Cuando tengan las credenciales listas, comunicarse con **[Tu nombre]** para proceder con la configuración del backend y activar el sistema.

---

*Restaurante Equis — Sistema de Gestión v1.0 — Julio 2026*
